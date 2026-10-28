import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
const diagram = name => readFileSync(new URL('../diagrams/' + name + '.mmd', import.meta.url), 'utf8');

test('SC-12 two publishers reach validation as two values, without a domain write', () => {
  const text = diagram('uc-05-two-publishers');
  const request = text.split('\n').find(line => line.includes('UI->>S:'));
  assert.match(request, /publisherIds=\[P1,\s*P2\]/, 'Raw invalid form must retain both publishers');
  assert(text.indexOf('validateBookCardinalities(publisherIds, authorIds)') > text.indexOf('UI->>S:'));
  assert.match(text, /Publisher–Book/);
  assert(!/S->>Store:.*(?:insert|save)/.test(text), 'Invalid Book must not be saved');
});

test('dashed replies have an inverse request; unsolicited UI output is a one-way event', () => {
  for (const file of readdirSync(new URL('../diagrams/', import.meta.url)).filter(f => f.endsWith('.mmd'))) {
    const text = diagram(file.slice(0, -4));
    for (const reply of text.matchAll(/^\s*(\w+)-->>(\w+):/gm)) {
      assert(text.includes(reply[2] + '->>' + reply[1] + ':'), file + ': reply without request ' + reply[0].trim());
    }
  }
  const failure = diagram('uc-17-transfer-failure');
  assert(failure.indexOf('UI-)L:') < failure.indexOf('UI-->>Flow:'));
  assert(failure.includes('UI-)L:'));
});

test('UC-10 X2 carries validation fields and reasons through service and UI replies', () => {
  const fields = diagram('uc-10-x2-fields');
  assert.match(fields, /S-->>S: fieldErrors/, 'Validation must name its error-list result');
  assert.match(fields, /S-->>UI: validationErrors\(fieldErrors\)/, 'UI must receive field errors, not only a generic sentence');
  assert.match(fields, /UI-->>A:.*fieldErrors/);
  const references = diagram('uc-10-x2-references');
  for (const field of ['Loan.reader_id', 'Loan.copy_id', 'Copy.book_id']) assert(references.includes(field), field);
  assert.match(references, /Store-->>S: referenceError\(field, reason\)/);
  assert.match(references, /S-->>UI: referenceError\(field, reason\)/);
  assert.match(references, /UI-->>A:.*referenceError\.field.*referenceError\.reason/);
  for (const text of [fields, references]) assert(!/S->>Store:.*(?:insert|save|commit)/.test(text));
});
