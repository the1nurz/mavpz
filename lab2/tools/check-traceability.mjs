import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = name => readFileSync(path.join(root, name), 'utf8');
const ids = (text, prefix) => [...text.matchAll(new RegExp(`\\b${prefix}-\\d{2}\\b`, 'g'))].map(m => m[0]);
const unique = (values, label) => {
  assert.equal(new Set(values).size, values.length, `Duplicate ${label}`);
  return new Set(values);
};
const contains = (set, values, label) => values.forEach(id => assert(set.has(id), `Unknown ${label}: ${id}`));

try {
  const reqs = unique([...read('requirements.md').matchAll(/\*\*(REQ-\d{2}) —/g)].map(m => m[1]), 'REQ');
  const stories = unique([...read('user-stories.md').matchAll(/^## (US-\d{2}) —/gm)].map(m => m[1]), 'US');
  const puml = read('diagrams/use-cases.puml');
  const cases = unique([...puml.matchAll(/^  usecase "(UC-\d{2})/gm)].map(m => m[1]), 'UC');
  assert.equal(reqs.size, 24); assert.equal(stories.size, 9); assert.equal(cases.size, 17);
  const scenarios = new Map();
  for (const filename of readdirSync(path.join(root, 'features')).filter(n => n.endsWith('.feature'))) {
    const source = read(`features/${filename}`);
    const blocks = [...source.matchAll(/((?:^\s*@[^\r\n]+\r?\n)+)\s*Scenario(?: Outline)?:/gm)];
    assert.equal(blocks.length, [...source.matchAll(/^\s*Scenario(?: Outline)?:/gm)].length, `Untagged scenario: ${filename}`);
    for (const block of blocks) {
      const sc = ids(block[1], 'SC'), us = ids(block[1], 'US'), req = ids(block[1], 'REQ');
      assert.equal(sc.length, 1); assert(!scenarios.has(sc[0]), `Duplicate ${sc[0]}`);
      unique(us, `${sc[0]} US tags`); unique(req, `${sc[0]} REQ tags`);
      assert(us.length && req.length); contains(stories, us, 'US tag'); contains(reqs, req, 'REQ tag');
      scenarios.set(sc[0], { us, req });
    }
  }
  assert.equal(scenarios.size, 27);
  const ucReqs = new Map();
  for (const line of puml.split(/\r?\n/).filter(s => /^' UC-\d{2} \|/.test(s))) {
    const uc = ids(line, 'UC')[0]; assert(!ucReqs.has(uc), `Duplicate UC mapping ${uc}`);
    contains(cases, [uc], 'mapped UC'); contains(reqs, ids(line, 'REQ'), 'mapped REQ');
    contains(stories, ids(line, 'US'), 'mapped US'); contains(new Set(scenarios.keys()), ids(line, 'SC'), 'mapped SC');
    ucReqs.set(uc, ids(line, 'REQ'));
  }
  assert.equal(ucReqs.size, cases.size);
  const model = readFileSync(path.join(root, '../model/er.mmd'), 'utf8');
  const fields = new Map([...model.matchAll(/^\s*(\w+) \{([^}]+)\}/gm)].map(m =>
    [m[1], new Set([...m[2].matchAll(/^\s*\w+ (\w+)/gm)].map(a => a[1]))]));
  const matrix = process.argv[2] ? readFileSync(path.resolve(process.argv[2]), 'utf8') : read('traceability.md');
  const rows = matrix.split(/\r?\n/).filter(s => /^\| REQ-/.test(s)).map(s => s.split('|').slice(1, -1).map(c => c.trim()));
  assert.equal(rows.length, reqs.size, 'Expected 24 matrix rows');
  unique(rows.map(r => r[0]), 'matrix REQ rows');
  const used = { REQ: new Set(), US: new Set(), SC: new Set(), UC: new Set() };
  for (const row of rows) {
    assert.equal(row.length, 6, 'Malformed matrix row');
    const [req, er, usText, scText, ucText, status] = row;
    assert(reqs.has(req), `Unknown matrix REQ ${req}`);
    const us = ids(usText, 'US'), sc = ids(scText, 'SC'), uc = ids(ucText, 'UC');
    unique(us, `${req} US`); unique(sc, `${req} SC`); unique(uc, `${req} UC`);
    assert(us.length && sc.length); contains(stories, us, 'matrix US');
    contains(new Set(scenarios.keys()), sc, 'matrix SC'); contains(cases, uc, 'matrix UC');
    for (const id of sc) {
      const tags = scenarios.get(id);
      assert(tags.req.includes(req), `${id} lacks ${req}`);
      assert(tags.us.some(s => us.includes(s)), `${id} lacks a row US`);
    }
    for (const id of us) assert(sc.some(s => scenarios.get(s).us.includes(id)), `${id} lacks a row scenario`);
    for (const id of uc) assert(ucReqs.get(id).includes(req), `${id} lacks mapped ${req}`);
    if (!uc.length) {
      assert.equal(req, 'REQ-10'); assert.equal(status, 'Структурно');
      assert(puml.split(/\r?\n/).some(s => s.startsWith("' Наскрізний контракт") && ids(s, 'REQ').includes(req)));
    } else assert.equal(status, 'Описано');
    for (const match of er.matchAll(/`([A-Z]+)(?:\.(\w+))?`/g)) {
      assert(fields.has(match[1]), `Unknown ER entity ${match[1]}`);
      if (match[2]) assert(fields.get(match[1]).has(match[2]), `Unknown ER field ${match[0]}`);
    }
    used.REQ.add(req); us.forEach(id => used.US.add(id)); sc.forEach(id => used.SC.add(id)); uc.forEach(id => used.UC.add(id));
  }
  for (const [prefix, definitions] of [['REQ', reqs], ['US', stories], ['SC', new Set(scenarios.keys())], ['UC', cases]]) {
    assert.equal(used[prefix].size, definitions.size, `Incomplete ${prefix} coverage`);
  }
  console.log('PASS: 24 matrix rows; REQ 24/24, US 9/9, SC 27/27, UC 17/17.');
  console.log('PASS: unique definitions, existing references, SC tags, UC mappings, ER fields.');
  console.log('REQ-10: structural contract in diagram legend; no standalone UC. Behaviour is not executed.');
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
}
