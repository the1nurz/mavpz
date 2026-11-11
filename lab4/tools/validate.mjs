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

// Three Activity views share a source, while their final nodes stay independent.
const diagrams = [...source.matchAll(/^@startuml ([a-z-]+)\n[\s\S]*?^@enduml/gm)]
  .map(match => ({ name: match[1], source: `${match[0]}\n` }));
assert.deepEqual(diagrams.map(item => item.name), ['activity', 'activity-observation', 'activity-concurrency']);
assert.equal(source.replace(/^@startuml [a-z-]+\n[\s\S]*?^@enduml/gm, '').trim(), '');

function analyze(diagram) {
  // Parse the supported structured Activity subset for control-flow checks.
  const tokens = [];
  let role;
  let inNote = false;
  for (const raw of diagram.source.split('\n')) {
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
        nodes.push({ kind: 'if', yes, no, token });
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
        nodes.push({ kind: 'action', token });
      }
    }
    return nodes;
  }
  const tree = parseSequence();
  assert.equal(cursor, tokens.length, 'Unconsumed control-flow token');
  assert.equal(counts.start, 1);
  assert.equal(tree[0].kind, 'start');
  assert(counts.stop > 0 && counts.ifElse > 0);
  function paths(nodes, incoming = [{ terminal: false, issues: 0, actions: [], decisions: [] }]) {
    let states = incoming;
    for (const node of nodes) {
      const completed = states.filter(state => state.terminal);
      let active = states.filter(state => !state.terminal);
      assert(active.length, 'Unreachable action after a terminating path');
      if (node.kind === 'stop') active = active.map(state => ({ ...state, terminal: true }));
      if (node.kind === 'action') {
        active = active.map(state => ({ ...state, actions: [...state.actions, node.token] }));
        if (node.token.line.includes('Виконати атомарну операцію видачі')) {
          active = active.map(state => ({ ...state, issues: state.issues + 1 }));
        }
      }
      if (node.kind === 'if') {
        const yes = active.map(state => ({
          ...state,
          decisions: [...state.decisions, { condition: node.token.line, accepted: true }],
        }));
        const no = active.map(state => ({
          ...state,
          decisions: [...state.decisions, { condition: node.token.line, accepted: false }],
        }));
        active = [...paths(node.yes, yes), ...paths(node.no, no)];
      }
      if (node.kind === 'fork') {
        for (const branch of node.branches) {
          const results = paths(branch, active);
          assert(results.every(state => !state.terminal), 'Parallel branch terminates before join');
          assert(results.every(state => state.issues === 0), 'Domain writes must stay in the called UC-10');
          const serialized = JSON.stringify(branch);
          assert(!/acceptEvent|Тайм-аут|Ознайомитися/.test(serialized), 'Join must not wait for client events or reaction');
        }
      }
      states = [...completed, ...active];
    }
    return states;
  }
  const routes = paths(tree);
  assert(routes.every(state => state.terminal), 'A path has no final node');
  assert(routes.every(state => state.issues <= 1), 'Repeated issue on one path');
  console.log(`PASS ${diagram.name} structure and ${routes.length} finite paths ${JSON.stringify(counts)}`);
  return { tokens, actions, counts, routes };
}

const [main, observation, concurrency] = diagrams.map(analyze);
assert.equal(main.counts.forkJoin, 0);
assert.equal(observation.counts.forkJoin, 0);
assert.equal(concurrency.counts.forkJoin, 1);
assert.equal(main.actions.filter(item => item.line.includes('Виконати атомарну операцію видачі')).length, 1);
const send = main.actions.filter(item => item.line.includes('<<sendSignal>>'));
const receive = observation.actions.filter(item => item.line.includes('<<acceptEvent>>'));
assert.equal(send.length, 1);
assert.equal(receive.length, 1);
assert.equal(send[0].role, 'Система');
assert.equal(receive[0].role, 'Бібліотекар');
for (const event of [...send, ...receive]) assert(event.line.includes('Підтвердження(Loan.id)'));
assert(receive[0].line.includes('АБО Тайм-аут'), 'Accept action needs alternative timeout trigger');
assert(diagrams[1].source.includes('TimeEvent — Тайм-аут'));
assert(diagrams[1].source.includes('SignalEvent — Підтвердження(Loan.id)'));
assert(diagrams[1].source.includes('Події стосуються лише поточного запиту'));
assert(observation.actions.some(item => item.line.includes('Ознайомитися')));
assert(observation.actions.some(item => item.line.includes('Завершити спостереження після події Тайм-аут')));
const dateGuard = 'if (due_at >= loaned_at?) then (так)';
const dateChecks = main.tokens.filter(item => item.line.startsWith('if ') && /due_at|loaned_at/.test(item.line));
assert.deepEqual(dateChecks.map(item => item.line), [dateGuard], 'Date condition must be due_at >= loaned_at');
const commitGuard = 'if (Операцію зафіксовано?) then (так)';
assert.equal(main.tokens.filter(item => item.line === commitGuard).length, 1, 'Expected one commit decision');
for (const route of main.routes) {
  const datesAccepted = route.decisions.some(decision => decision.condition === dateGuard && decision.accepted);
  const commitAccepted = route.decisions.some(decision => decision.condition === commitGuard && decision.accepted);
  const confirmations = route.actions.filter(item => item.line.includes('<<sendSignal>>')).length;
  assert(route.issues === 0 || datesAccepted, 'Issue requires the accepted due_at >= loaned_at branch');
  assert(confirmations === 0 || (commitAccepted && route.issues === 1), 'Confirmation requires successful commit on its control-flow path');
}
const successfulRoutes = main.routes.filter(route =>
  route.decisions.some(decision => decision.condition === commitGuard && decision.accepted));
assert(successfulRoutes.every(route => route.actions.includes(send[0])), 'Successful commit must send exactly one confirmation');
const committed = main.tokens.findIndex(item => item.line === commitGuard);
assert(main.tokens.slice(committed).every(item => item.role === 'Система'), 'Server completion depends on a human role');
assert(!main.actions.some(item => /acceptEvent|Ознайомитися|Очікувати/.test(item.line)));
assert.equal(concurrency.actions.filter(item => item.line.startsWith(':Обробити запит R')).length, 2);
assert(concurrency.actions.some(item => item.line.includes('Обробити запит R1 за A02–A10 UC-10')));
assert(concurrency.actions.some(item => item.line.includes('Обробити запит R2 за A02–A10 UC-10')));
console.log('PASS event alternatives, independent server completion, D40 calls and at most one issue per server path');
console.log('PASS date eligibility and success-only confirmation across server control-flow paths');

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
const sizes = {};
for (const diagram of diagrams) {
  for (const format of ['svg', 'png']) {
    outputs[`${diagram.name}.${format}`] = runJava(['-jar', jar, '-charset', 'UTF-8', `-t${format}`, '-pipe'], Buffer.from(diagram.source)).stdout;
  }
  const svg = outputs[`${diagram.name}.svg`].toString('utf8');
  assert(svg.includes('<svg ') && svg.includes('</svg>'), 'Invalid SVG envelope');
  assert(!/Syntax Error|An error has occur/.test(svg), 'PlantUML error image');
  for (const text of [diagram.name === 'activity-observation' ? 'Бібліотекар' : 'Система', 'Loan.id']) {
    assert(svg.includes(text), `Missing SVG text ${text}`);
  }
  const png = outputs[`${diagram.name}.png`];
  assert(png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])));
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  assert(width > 0 && height > 0 && width < 24000 && height < 24000, 'Invalid or capped PNG');
  sizes[diagram.name] = { width, height };
}
const manifest = {
  sourceSha256: hash(source),
  validatorSha256: hash(normalize(readFileSync(fileURLToPath(import.meta.url), 'utf8'))),
  toolchainSha256: hash(lockText),
  plantuml: lock.plantuml.version,
  javaVersion,
  platform: `${process.platform}/${process.arch}`,
  pngSizes: sizes,
  outputs: Object.fromEntries(Object.entries(outputs).map(([format, bytes]) => [format, hash(bytes)])),
};
const render = resolve(lab, 'render');
if (mode === '--render') {
  mkdirSync(render, { recursive: true });
  for (const [name, bytes] of Object.entries(outputs)) writeFileSync(resolve(render, name), bytes);
  writeFileSync(resolve(render, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`PASS generated three SVG/PNG views locally ${JSON.stringify(sizes)}`);
} else {
  assert.deepEqual(JSON.parse(readFileSync(resolve(render, 'manifest.json'), 'utf8')), manifest, 'Stale render manifest or changed toolchain');
  for (const [name, bytes] of Object.entries(outputs)) {
    assert(readFileSync(resolve(render, name)).equals(bytes), `Stale or modified ${name}`);
  }
  console.log('PASS SVG/PNG freshness and byte-for-byte local reproduction');
}
