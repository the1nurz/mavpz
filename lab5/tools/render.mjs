import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { inflateSync } from 'node:zlib';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const lab = resolve(root, 'lab5');
const mode = process.argv[2] ?? '--check';
assert(['--render', '--check'].includes(mode) && process.argv.length <= 3, 'Use --render or --check');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const read = path => readFileSync(resolve(root, path));
const source = read('lab5/component.puml');
const text = source.toString('utf8');
const rows = text => text.split(/\r?\n/).filter(l => l.startsWith('| '))
  .map(l => l.split('|').slice(1, -1).map(x => x.trim()));
const architecture = read('lab5/architecture.md').toString('utf8');
const spec = read('lab5/spec.md').toString('utf8');
const interfaceRows = document => rows(document).filter(r => /^I[A-Z]\w+$/.test(r[0]));
const contracts = interfaceRows(spec);
assert.equal(contracts.length, 10);
assert.deepEqual(interfaceRows(architecture).map(r => r.slice(0, 3)), contracts.map(r => r.slice(0, 3)));
const expected = rows(architecture).filter(r => /^C[1-8]$/.test(r[0]) && /^(C[1-8]|A1)$/.test(r[1]));
assert.equal(expected.length, 14);
const components = new Map(), interfaces = new Map(), providers = [], usages = [];
const scopes = [];
let prose = false;
for (const raw of text.split(/\r?\n/)) {
  const line = raw.trim();
  if (/^(note |legend )/.test(line)) { prose = true; continue; }
  if (/^(end note|endlegend)$/.test(line)) { prose = false; continue; }
  if (prose || !line || line.startsWith("'")) continue;
  let m;
  if ((m = line.match(/^(?:rectangle|package) ".+" as (\w+) \{$/))) scopes.push(m[1]);
  else if (line === 'together {') scopes.push('Layout');
  else if (line === '}') assert(scopes.pop(), 'Unbalanced group');
  else if ((m = line.match(/^component "(.+)" as (\w+)(?: <<external>>)?$/))) {
    assert(!components.has(m[2]), 'Duplicate component');
    components.set(m[2], { label: m[1], scopes: [...scopes] });
  } else if ((m = line.match(/^interface "(I\w+)" as (I\w+)$/))) {
    assert.equal(m[1], m[2]);
    assert(!interfaces.has(m[2]), 'Duplicate interface');
    interfaces.set(m[2], [...scopes]);
  } else if ((m = line.match(/^(C[1-8]|A1) -(?:up|down|left|right)- (I\w+)$/))) providers.push([m[1], m[2]]);
  else if ((m = line.match(/^(C[1-8]|A1) \.\.> (I\w+)$/))) usages.push([m[1], m[2]]);
  else assert(!/--|\.\.>|\[hidden\]|^(component|interface|database|actor)\b/.test(line), `Unexpected relation/declaration: ${line}`);
}
assert(!prose && scopes.length === 0, 'Unclosed prose/group');
assert.deepEqual([...components.keys()].sort(), ['A1', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8']);
assert.deepEqual([...interfaces.keys()].sort(), contracts.map(r => r[0]).sort());
for (let i = 1; i <= 8; i++) {
  const group = components.get(`C${i}`).scopes;
  assert(group.includes('Library'));
  assert.equal(group.includes('Server'), i >= 2 && i <= 7);
}
assert.deepEqual(components.get('A1').scopes, []);
assert.deepEqual(interfaces.get('INotificationGateway'), []);
assert.equal(providers.length, 10);
assert.deepEqual(providers.map(r => r.join('|')).sort(), contracts.map(r => [r[1], r[0]].join('|')).sort());
const provider = new Map(providers.map(([p, i]) => [i, p]));
assert.equal(usages.length, 14);
const actual = usages.map(([c, i]) => [c, provider.get(i), i]);
assert.deepEqual(actual.map(r => r.join('|')).sort(), expected.map(r => r.join('|')).sort());
const order = ['C1', 'C2', 'C3', 'C4', 'C6', 'C5', 'C7', 'C8', 'A1'];
for (const [c, p] of actual) assert(order.indexOf(c) < order.indexOf(p), 'Cycle or unexpected dependency');
assert.equal(new Set(actual.map(([c,p]) => `${c}|${p}`)).size, 13);
console.log('PASS 8 internal components + A1; 10 provided interfaces; 14 required usages / 13 pairs; boundaries; no cycles');

const java = process.env.LAB5_JAVA;
const jar = process.env.LAB5_JAR;
const dot = process.env.GRAPHVIZ_DOT;
assert(java && jar && dot, 'Set LAB5_JAVA, LAB5_JAR and GRAPHVIZ_DOT to installed tools (see lab5/validation.md)');
const lock = JSON.parse(read('lab4/tools/toolchain.json'));
assert.equal(hash(readFileSync(jar)), lock.plantuml.sha256, 'Unexpected PlantUML JAR');
function run(exe, args, input) {
  const result = spawnSync(exe, args, { cwd: root, input, maxBuffer: 32 * 1024 * 1024, timeout: 60000,
    env: { ...process.env, PLANTUML_SECURITY_PROFILE: 'SANDBOX', PLANTUML_LIMIT_SIZE: '24000' } });
  assert(!result.error, String(result.error));
  assert.equal(result.status, 0, result.stderr?.toString() || 'Tool failed');
  return result;
}
const runJava = (args, input) => run(java, ['-Djava.awt.headless=true', ...args], input);
const javaVersion = runJava(['-version']).stderr.toString().trim();
const plantumlVersion = runJava(['-jar', jar, '-version']).stdout.toString().split(/\r?\n/)[0];
assert(plantumlVersion.includes(lock.plantuml.version));
const dotVersion = run(dot, ['-V']).stderr.toString().trim();
runJava(['-jar', jar, '-charset', 'UTF-8', '-checkonly', resolve(lab, 'component.puml')]);
console.log(`PASS real ${plantumlVersion} -checkonly, exit 0`);
const outputs = {};
let pngSize;
for (const format of ['svg', 'png']) {
  const bytes = runJava(['-jar', jar, '-charset', 'UTF-8', `-t${format}`, '-pipe'], source).stdout;
  if (format === 'svg') {
    const svg = bytes.toString();
    assert(svg.includes('<svg') && svg.includes('</svg>'), 'Invalid SVG');
    for (const name of interfaces.keys()) assert(svg.includes(`>${name}</text>`), `Missing interface ${name}`);
    for (const [id, { label }] of components) assert(svg.includes(label.split('\\n')[0]), `Missing component ${id}`);
    assert(svg.includes('Інформаційна система') && svg.includes('Один серверний вебзастосунок'));
    assert(!svg.includes('Syntax Error'), 'PlantUML error output');
  } else {
    assert(bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])), 'Invalid PNG');
    assert.equal(bytes.toString('ascii', 12, 16), 'IHDR');
    pngSize = { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
    assert(pngSize.width > 0 && pngSize.height > 0 && pngSize.width < 24000 && pngSize.height < 24000);
    const chunks = [];
    for (let pos = 8; pos < bytes.length;) {
      const len = bytes.readUInt32BE(pos);
      assert(pos + len + 12 <= bytes.length, 'Truncated PNG');
      if (bytes.toString('ascii',pos+4,pos+8) === 'IDAT') chunks.push(bytes.subarray(pos+8,pos+8+len));
      pos += len + 12;
    }
    assert(inflateSync(Buffer.concat(chunks)).length > 0, 'Empty PNG pixels');
  }
  outputs[`component.${format}`] = bytes;
}
const inputs = ['lab5/component.puml','lab5/tools/render.mjs','lab5/.gitattributes','lab5/spec.md','lab5/architecture.md','lab4/tools/toolchain.json'];
const manifest = {
  inputs: Object.fromEntries(inputs.map(p => [p, hash(/\.md$/.test(p) || p.startsWith('lab4/')
    ? Buffer.from(read(p).toString('utf8').replace(/\r\n/g,'\n')) : read(p))])),
  environment: { platform: `${process.platform}/${process.arch}`, node: process.version,
    javaVersion, plantumlVersion, dotVersion, jarSha256: hash(readFileSync(jar)),
    javaSha256: hash(readFileSync(java)), dotSha256: hash(readFileSync(dot)),
    arialSha256: process.env.WINDIR ? hash(readFileSync(resolve(process.env.WINDIR,'Fonts/arial.ttf'))) : null },
  pngSize,
  outputs: Object.fromEntries(Object.entries(outputs).map(([p,b]) => [p,hash(b)])),
};
const folder = resolve(lab,'render');
if (mode === '--render') {
  mkdirSync(folder,{recursive:true});
  for (const [p,b] of Object.entries(outputs)) writeFileSync(resolve(folder,p),b);
  writeFileSync(resolve(folder,'manifest.json'), JSON.stringify(manifest,null,2)+'\n');
  console.log(`PASS rendered real SVG/PNG ${JSON.stringify(pngSize)}; manifest saved`);
} else {
  assert.deepEqual(JSON.parse(readFileSync(resolve(folder,'manifest.json'),'utf8')),manifest,'Manifest/environment differs');
  for (const [p,b] of Object.entries(outputs)) assert(readFileSync(resolve(folder,p)).equals(b),`Stale ${p}`);
  console.log('PASS fresh SVG/PNG byte-for-byte reproduction; no artifacts rewritten');
}
