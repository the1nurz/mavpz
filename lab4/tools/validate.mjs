import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const tools = dirname(fileURLToPath(import.meta.url));
const lab = resolve(tools, '..');
const root = resolve(lab, '..');
const cache = resolve(root, '.cache/lab4');
const mode = process.argv[2] ?? '--check';
assert(['--check', '--render'].includes(mode), 'Use --check or --render');
const hash = data => createHash('sha256').update(data).digest('hex');
const normalize = text => text.replace(/\r\n/g, '\n');
const source = normalize(readFileSync(resolve(lab, 'activity.puml'), 'utf8'));
assert(readFileSync(resolve(lab, 'spec.md'), 'utf8').includes('UC-10'));
const lockText = normalize(readFileSync(resolve(tools, 'toolchain.json'), 'utf8'));
const lock = JSON.parse(lockText);
const java = process.env.LAB4_JAVA ?? resolve(cache, lock.jre.java);
const jar = resolve(cache, lock.plantuml.file);

// Parse the supported structured Activity subset for control-flow checks.
const tokens = [];
let role;
let inNote = false;
for (const raw of source.split('\n')) {
  const line = raw.trim();
  if (line.startsWith('note ')) { inNote = true; continue; }
  if (line === 'end note') { inNote = false; continue; }
  if (inNote || !line || line.startsWith("'") || /^(title |@)/.test(line)) continue;
  if (line.startsWith('|')) {
    assert(/^\|(Бібліотекар|Система)\|$/.test(line), `Unexpected role ${line}`);
    role = line.slice(1, -1);
    continue;
  }
  assert(role, `Missing role for ${line}`);
  tokens.push({ line, role });
}
assert(!inNote, 'Unclosed note');
assert(source.startsWith('@startuml\n') && source.trimEnd().endsWith('@enduml'));
let cursor = 0;
const counts = { start: 0, stop: 0, ifElse: 0, forkJoin: 0, actions: 0 };
const actions = [];
function parseSequence() {
  const nodes = [];
  while (cursor < tokens.length) {
    const token = tokens[cursor];
    const { line } = token;
    if (/^(else |endif$|fork again$|end fork$)/.test(line)) break;
    cursor++;
    if (line.startsWith('if ')) {
      assert(/^if \(.+\) then \(так\)$/.test(line), `Invalid decision ${line}`);
      const yes = parseSequence();
      assert.equal(tokens[cursor++]?.line, 'else (ні)', 'Missing else');
      const no = parseSequence();
      assert.equal(tokens[cursor++]?.line, 'endif', 'Missing endif');
      assert(yes.length && no.length, 'Empty decision branch');
      nodes.push({ kind: 'if', yes, no });
      counts.ifElse++;
    } else if (line === 'fork') {
      const first = parseSequence();
      assert.equal(tokens[cursor++]?.line, 'fork again', 'Missing parallel branch');
      const second = parseSequence();
      assert.equal(tokens[cursor++]?.line, 'end fork', 'Missing join');
      assert(first.length && second.length, 'Empty parallel branch');
      nodes.push({ kind: 'fork', branches: [first, second] });
      counts.forkJoin++;
    } else if (line === 'start' || line === 'stop') {
      counts[line]++;
      nodes.push({ kind: line });
    } else {
      assert(/^:.+;(?: <<(?:sendSignal|acceptEvent)>>)?$/.test(line), `Unsupported action ${line}`);
      actions.push(token);
      counts.actions++;
      nodes.push({ kind: 'action' });
    }
  }
  return nodes;
}
const tree = parseSequence();
assert.equal(cursor, tokens.length, 'Unconsumed control-flow token');
assert.equal(counts.start, 1);
assert.equal(tree[0].kind, 'start');
assert(counts.stop > 0 && counts.ifElse > 0 && counts.forkJoin > 0);
function canContinue(nodes) {
  let active = true;
  for (const node of nodes) {
    assert(active, 'Unreachable action after a terminating path');
    if (node.kind === 'stop') active = false;
    if (node.kind === 'if') {
      const yes = canContinue(node.yes);
      const no = canContinue(node.no);
      active = yes || no;
    }
    if (node.kind === 'fork') {
      for (const branch of node.branches) {
        assert(canContinue(branch), 'Parallel branch terminates before join');
      }
    }
  }
  return active;
}
assert.equal(canContinue(tree), false, 'A path has no final node');
const send = actions.filter(item => item.line.includes('<<sendSignal>>'));
const receive = actions.filter(item => item.line.includes('<<acceptEvent>>'));
assert.equal(send.length, 1);
assert.equal(receive.length, 1);
assert.equal(send[0].role, 'Система');
assert.equal(receive[0].role, 'Бібліотекар');
for (const event of [...send, ...receive]) assert(event.line.includes('«Видачу оформлено», Loan.id'));
assert(source.includes('Ознайомитися з підтвердженням видачі'));
assert(source.includes('Спостерігати тайм-аут'));
const committed = tokens.findIndex(item => item.line === 'if (Операцію зафіксовано?) then (так)');
const fork = tokens.findIndex(item => item.line === 'fork');
assert(committed >= 0 && fork > committed, 'Parallel handling must follow commit');
console.log(`PASS structure, roles, message, reaction and finite structural paths ${JSON.stringify(counts)}`);

if (!existsSync(java) || !existsSync(jar)) {
  console.error('NOT RUN PlantUML syntax, rendering and freshness. Run lab4/tools/setup.ps1 or set LAB4_JAVA.');
  process.exit(2);
}
assert.equal(hash(readFileSync(jar)), lock.plantuml.sha256, 'PlantUML jar checksum mismatch');
function runJava(args, input) {
  const result = spawnSync(java, ['-Djava.awt.headless=true', ...args], {
    cwd: root,
    input,
    env: { ...process.env, PLANTUML_LIMIT_SIZE: '24000', PLANTUML_SECURITY_PROFILE: 'SANDBOX' },
    timeout: 120000,
    maxBuffer: 64 * 1024 * 1024,
    windowsHide: true,
  });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stderr?.toString() || result.stdout?.toString());
  return result;
}
const javaVersionResult = runJava(['-version']);
const javaVersion = javaVersionResult.stderr.toString().trim();
const syntax = runJava(['-jar', jar, '-charset', 'UTF-8', '-checkonly', resolve(lab, 'activity.puml')]);
assert(!/error/i.test(syntax.stderr.toString()), syntax.stderr.toString());
console.log(`PASS real PlantUML ${lock.plantuml.version} syntax parser`);
const outputs = {};
for (const format of ['svg', 'png']) {
  outputs[format] = runJava(['-jar', jar, '-charset', 'UTF-8', `-t${format}`, '-pipe'], Buffer.from(source)).stdout;
}
const svg = outputs.svg.toString('utf8');
assert(svg.includes('<svg ') && svg.includes('</svg>'), 'Invalid SVG envelope');
assert(!/Syntax Error|An error has occur/.test(svg), 'PlantUML error image');
for (const text of ['Бібліотекар', 'Система', 'Видачу оформлено', 'Loan.id', 'тайм-аут']) {
  assert(svg.includes(text), `Missing SVG text ${text}`);
}
assert(outputs.png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])));
const width = outputs.png.readUInt32BE(16);
const height = outputs.png.readUInt32BE(20);
assert(width > 0 && height > 0 && width < 24000 && height < 24000, 'Invalid or capped PNG');
const manifest = {
  sourceSha256: hash(source),
  validatorSha256: hash(normalize(readFileSync(fileURLToPath(import.meta.url), 'utf8'))),
  toolchainSha256: hash(lockText),
  plantuml: lock.plantuml.version,
  javaVersion,
  platform: `${process.platform}/${process.arch}`,
  pngSize: { width, height },
  outputs: Object.fromEntries(Object.entries(outputs).map(([format, bytes]) => [format, hash(bytes)])),
};
const render = resolve(lab, 'render');
if (mode === '--render') {
  mkdirSync(render, { recursive: true });
  for (const [format, bytes] of Object.entries(outputs)) writeFileSync(resolve(render, `activity.${format}`), bytes);
  writeFileSync(resolve(render, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`PASS generated SVG and PNG locally (${width} × ${height})`);
} else {
  assert.deepEqual(JSON.parse(readFileSync(resolve(render, 'manifest.json'), 'utf8')), manifest, 'Stale render manifest or changed toolchain');
  for (const [format, bytes] of Object.entries(outputs)) {
    assert(readFileSync(resolve(render, `activity.${format}`)).equals(bytes), `Stale or modified ${format.toUpperCase()}`);
  }
  console.log('PASS SVG/PNG freshness and byte-for-byte local reproduction');
}
