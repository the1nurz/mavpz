import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const diagram = name => readFileSync(new URL('../diagrams/' + name + '.mmd', import.meta.url), 'utf8');

test('SC-12 two publishers reach validation as two values, without a domain write', () => {
  const text = diagram('uc-05-two-publishers');
  const request = text.split('\n').find(line => line.includes('UI->>S:'));
  assert.match(request, /publisherIds=\[P1,\s*P2\]/, 'Raw invalid form must retain both publishers');
  assert(text.indexOf('validateBookCardinalities(publisherIds, authorIds)') > text.indexOf('UI->>S:'));
  assert.match(text, /Publisher–Book/);
  assert(!/S->>Store:.*(?:insert|save)/.test(text), 'Invalid Book must not be saved');
});
