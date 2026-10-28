import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = p => readFileSync(path.join(root, p), 'utf8');
const cells = line => line.split('|').slice(1, -1).map(x => x.trim());
const unquote = x => x.replaceAll(String.fromCharCode(96), '');

export function activationBalance(source, file) {
  let state = {}, stack = [];
  const key = s => JSON.stringify(Object.fromEntries(Object.entries(s).filter(([, v]) => v).sort()));
  for (const raw of source.split(/\r?\n/)) {
    const line = raw.trim(), fragment = line.match(/^(alt|opt|loop|par|rect)\b/);
    if (fragment) { stack.push({ kind: fragment[1], base: { ...state }, branches: [] }); continue; }
    if (/^(else|and)\b/.test(line)) {
      const f = stack.at(-1); assert(f, file + ': branch without fragment');
      f.branches.push({ ...state }); state = { ...f.base }; continue;
    }
    if (line === 'end') {
      const f = stack.pop(); assert(f, file + ': unmatched end'); f.branches.push({ ...state });
      if (f.kind === 'par') {
        state = { ...f.base };
        for (const b of f.branches) for (const k of new Set([...Object.keys(b), ...Object.keys(f.base)])) {
          state[k] = (state[k] || 0) + (b[k] || 0) - (f.base[k] || 0);
        }
      } else {
        for (const b of f.branches) assert.equal(key(b), key(f.base), file + ': activation imbalance in ' + f.kind);
        state = { ...f.base };
      }
      continue;
    }
    const m = line.match(/^(activate|deactivate) (\w+)$/);
    if (m) {
      state[m[2]] = (state[m[2]] || 0) + (m[1] === 'activate' ? 1 : -1);
      assert(state[m[2]] >= 0, file + ': inactive ' + m[2]);
    }
  }
  assert.equal(stack.length, 0, file + ': unclosed fragment');
  assert.equal(key(state), '{}', file + ': unclosed activation');
}

export function checkSources() {
  const rows = read('lab3/traceability.md').split(/\r?\n/).filter(l => /^\| D\d{2} \|/.test(l)).map(cells);
  const spec = read('lab3/spec.md'), reqs = read('lab2/requirements.md');
  const knownReq = new Set(reqs.match(/REQ-\d{2}/g)), knownNfr = new Set(reqs.match(/NFR-\d{2}/g));
  const knownEr = new Set([...read('model/er.mmd').matchAll(/^\s*([A-Z]+)\s*\{/gm)].map(m => m[1]));
  const ucs = [...read('lab2/diagrams/use-cases.puml').matchAll(/as UC(\d{2})/g)].map(m => 'UC-' + m[1]);
  assert.deepEqual([...spec.matchAll(/^\| (UC-\d{2}) \|/gm)].map(m => m[1]).sort(), ucs.sort());
  const cases = new Set(), tags = new Map();
  for (const f of readdirSync(path.join(root, 'lab2/features')).filter(f => f.endsWith('.feature'))) {
    for (const block of read('lab2/features/' + f).split(/(?=^\s*@SC-\d{2}\b)/m)) {
      const sc = block.match(/@SC-\d{2}\b/)?.[0].slice(1); if (!sc) continue;
      assert(!tags.has(sc), 'Duplicate ' + sc);
      tags.set(sc, (block.match(/@REQ-\d{2}/g) || []).map(x => x.slice(1)).sort());
      const outline = /\bScenario Outline:/.test(block);
      const count = outline ? block.split('Examples:').slice(1).reduce((n, part) =>
        n + part.split(/\r?\n/).filter(l => /^\s*\|/.test(l)).length - 1, 0) : 0;
      assert(!outline || count > 0, sc + ': missing Examples');
      for (let i = 1; i <= Math.max(1, count); i++) cases.add(sc + ':' + (outline ? i : 'single'));
    }
  }
  const actualFiles = [];
  function walk(dir) {
    for (const entry of readdirSync(path.join(root, dir), { withFileTypes: true })) {
      if (entry.isDirectory() && !['svg', 'png'].includes(entry.name)) walk(dir + '/' + entry.name);
      else if (entry.isFile() && entry.name.endsWith('.mmd')) actualFiles.push(dir + '/' + entry.name);
    }
  }
  walk('lab3/diagrams');
  const expected = rows.map(r => 'lab3/' + unquote(r[7]));
  assert.equal(rows.length, 59); assert.equal(new Set(expected).size, 59);
  assert.deepEqual(actualFiles.sort(), expected.sort(), 'Sources differ from traceability matrix');
  const accounted = new Set();
  rows.forEach((r, i) => {
    const file = 'lab3/' + unquote(r[7]), text = read(file);
    assert(text.startsWith('sequenceDiagram\n'), file + ': expected sequenceDiagram');
    assert(text.includes('%% ' + r[0] + ' | ' + r[1] + ' | ' + r[3]), file + ': wrong UC/SC metadata');
    assert(text.includes('%% ' + r[4] + ' | ' + r[5]), file + ': wrong requirement metadata');
    assert(ucs.includes(r[1]));
    (r[4].match(/REQ-\d{2}/g) || []).forEach(x => assert(knownReq.has(x)));
    (r[5].match(/NFR-\d{2}/g) || []).forEach(x => assert(knownNfr.has(x)));
    r[6].split(' (')[0].split(', ').forEach(x => assert(knownEr.has(x.toUpperCase())));
    assert(/^    (alt|opt|loop|par) /m.test(text), file + ': missing combined fragment');
    assert(/-->>/.test(text), file + ': missing return');
    activationBalance(text, file);
    const plan = spec.split(/\r?\n/).find(l => l.startsWith('| ' + r[0] + ' |'));
    assert(plan?.includes(r[7]), file + ': absent from specification');
    if (i < 48) {
      const sc = r[3].match(/SC-\d{2}/)[0], variant = r[3].split(';')[1].trim().match(/^(\d+):/);
      const key = sc + ':' + (variant ? variant[1] : 'single');
      assert(cases.has(key) && !accounted.has(key), key);
      accounted.add(key); assert.deepEqual((r[4].match(/REQ-\d{2}/g) || []).sort(), tags.get(sc));
    }
  });
  for (const key of ['SC-11:single', 'SC-12:5', 'SC-13:2']) {
    assert(cases.has(key) && !accounted.has(key), key); accounted.add(key);
  }
  assert.deepEqual([...accounted].sort(), [...cases].sort());
  assert.equal(tags.size, 27); assert.equal(cases.size, 51); assert.equal(ucs.length, 15);
  return { files: actualFiles.sort(), uc: ucs.length, scenarios: tags.size, cases: cases.size };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const r = checkSources();
    console.log('PASS: ' + r.files.length + ' sources, ' + r.uc + ' UC, ' + r.scenarios +
      ' SC, ' + r.cases + ' cases accounted, exact tags and balanced activations. Two Reservation examples are internal validation contracts, with no standalone UC.');
  } catch (error) { console.error('FAIL: ' + error.message); process.exitCode = 1; }
}
