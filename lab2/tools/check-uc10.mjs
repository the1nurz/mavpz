import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const ids = (text, prefix) => [...text.matchAll(new RegExp(`\\b${prefix}-\\d{2}\\b`, 'g'))].map(m => m[0]);
try {
  const requirements = read('requirements.md');
  const reqIds = new Set([...requirements.matchAll(/\*\*(REQ-\d{2}) —/g)].map(m => m[1]));
  const nfrIds = new Set([...requirements.matchAll(/^### (NFR-\d{2}) —/gm)].map(m => m[1]));
  const detail = read('uc-10-detail.md');
  assert.equal([...detail.matchAll(/^## \d+\./gm)].length, 10, 'Expected ten sections');
  const tags = new Map();
  for (const name of fs.readdirSync(path.join(root, 'features')).filter(f => f.endsWith('.feature'))) {
    for (const m of read(`features/${name}`).matchAll(/((?:^\s*@[^\r\n]+\r?\n)+)\s*Scenario(?: Outline)?:/gm)) {
      tags.set(ids(m[1], 'SC')[0], { req: ids(m[1], 'REQ'), us: ids(m[1], 'US') });
    }
  }
  const rows = detail.split(/\r?\n/).filter(line => /^\| SC-/.test(line));
  assert.equal(rows.length, 6);
  const seen = new Set(), covered = new Set();
  for (const line of rows) {
    const cells = line.split('|').slice(1, -1);
    const scenario = cells[0].trim();
    assert(tags.has(scenario) && !seen.has(scenario), `Unknown/duplicate scenario ${scenario}`);
    seen.add(scenario);
    assert(tags.get(scenario).us.includes('US-06'), `${scenario} is not US-06`);
    const req = ids(cells[1], 'REQ');
    assert.deepEqual([...req].sort(), [...tags.get(scenario).req].sort(), `Wrong REQ edges for ${scenario}`);
    req.forEach(id => { assert(reqIds.has(id)); covered.add(id); });
    const nfr = ids(cells[3], 'NFR');
    assert(nfr.length); nfr.forEach(id => assert(nfrIds.has(id), `Unknown ${id}`));
  }
  assert.deepEqual([...seen].sort(), ['SC-19', 'SC-20', 'SC-21', 'SC-22', 'SC-23', 'SC-27']);
  for (const id of ['REQ-13', 'REQ-15', 'REQ-16', 'REQ-17', 'REQ-18', 'REQ-19', 'REQ-24']) assert(covered.has(id), `Missing ${id}`);
  ids(detail, 'REQ').forEach(id => assert(reqIds.has(id), `Unknown ${id}`));
  ids(detail, 'NFR').forEach(id => assert(nfrIds.has(id), `Unknown ${id}`));
  assert(read('diagrams/use-cases.puml').includes('as UC10 <<головний поглиблений UC>>'));
  console.log('PASS: UC-10 has 10 sections, 6 US-06 scenarios, exact scenario REQ tags and existing NFR references.');
  console.log('NFR links are acceptance constraints, not executed Gherkin coverage.');
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
}
