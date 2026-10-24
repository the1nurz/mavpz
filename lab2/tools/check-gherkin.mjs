import fs from 'node:fs';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
process.chdir(fileURLToPath(new URL('../../', import.meta.url)));
const require = createRequire(new URL('../../.cache/gherkin/package.json', import.meta.url));
const { Parser, AstBuilder, GherkinClassicTokenMatcher, compile } = require('@cucumber/gherkin');
const stories = fs.readFileSync('lab2/user-stories.md', 'utf8');
const storyIds = [...stories.matchAll(/^## (US-\d{2}) —/gm)].map(m => m[1]);
assert.equal(storyIds.length, 9);
assert.equal(new Set(storyIds).size, 9);
const requirementIds = [...fs.readFileSync('lab2/requirements.md', 'utf8').matchAll(/\*\*(REQ-\d{2}) —/g)].map(m => m[1]);
const seen = new Set(), covered = new Set();
const scenarioTags = new Map();
let definitions = 0, examples = 0;
for (const name of fs.readdirSync('lab2/features').filter(n => n.endsWith('.feature'))) {
  let nextId = 0;
  const newId = () => String(nextId++);
  const doc = new Parser(new AstBuilder(newId), new GherkinClassicTokenMatcher()).parse(fs.readFileSync(`lab2/features/${name}`, 'utf8'));
  const pickles = compile(doc, name, newId);
  examples += pickles.length;
  for (const child of doc.feature.children) {
    const scenario = child.scenario;
    if (!scenario) continue;
    definitions++;
    const tags = scenario.tags.map(t => t.name.slice(1));
    const ids = tags.filter(t => /^SC-/.test(t));
    assert.equal(ids.length, 1);
    assert(!seen.has(ids[0])); seen.add(ids[0]);
    scenarioTags.set(ids[0], tags);
    assert(stories.includes(ids[0]), `Missing story reference: ${ids[0]}`);
    const us = tags.filter(t => /^US-/.test(t));
    assert(us.length && us.every(t => storyIds.includes(t)));
    const reqs = tags.filter(t => /^REQ-/.test(t));
    assert(reqs.length && reqs.every(t => requirementIds.includes(t)));
    reqs.forEach(t => covered.add(t));
    assert(scenario.steps.some(s => s.keyword.trim() === 'Given'));
    assert(scenario.steps.some(s => s.keyword.trim() === 'When'));
    assert(scenario.steps.some(s => s.keyword.trim() === 'Then'));
    if (ids[0] === 'SC-19') {
      const dueDates = scenario.examples.flatMap(e => e.tableBody.map(row => row.cells[0].value));
      assert(dueDates.includes('2026-10-20T10:00:00Z'), 'Missing equal due_at boundary');
      assert(dueDates.includes('2026-11-03T10:00:00Z'), 'Missing later due_at case');
      assert(tags.includes('REQ-13'), 'SC-19 must trace REQ-13');
    }
  }
  console.log(`PASS parser/compile: ${name}, ${pickles.length} concrete cases`);
}
assert.equal(covered.size, 24);
for (const id of requirementIds) {
  assert(covered.has(id));
  const row = stories.split('\n').find(line => line.startsWith(`| ${id} |`));
  assert(row, `Missing coverage row ${id}`);
  const scs = row.match(/SC-\d{2}/g) || [];
  assert(scs.length && scs.every(s => seen.has(s)));
  const usIds = row.match(/US-\d{2}/g) || [];
  for (const sc of scs) {
    assert(scenarioTags.get(sc).includes(id), `Wrong requirement edge ${id} -> ${sc}`);
    assert(usIds.some(us => scenarioTags.get(sc).includes(us)), `Wrong story edge for ${sc}`);
  }
}
for (const match of stories.matchAll(/\]\(([^)]+)\)/g)) assert(fs.existsSync(`lab2/${match[1]}`));
console.log(`PASS: ${storyIds.length} unique stories, ${definitions} unique scenarios, ${examples} concrete cases, ${covered.size}/24 EARS, links exist`);
