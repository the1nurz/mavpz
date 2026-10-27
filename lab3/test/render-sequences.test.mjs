import test from 'node:test';
import assert from 'node:assert/strict';
import { deflateSync } from 'node:zlib';
import { sha256, inspectPng, expectedLabels, artifactDifferences, requireEqualBytes } from '../tools/render-validation.mjs';
import { activationBalance, checkSources } from '../tools/check-sequences.mjs';

function crc32(bytes) {
  let value = -1;
  for (const byte of bytes) {
    value ^= byte;
    for (let bit = 0; bit < 8; bit++) value = (value >>> 1) ^ (0xedb88320 & -(value & 1));
  }
  return (value ^ -1) >>> 0;
}
function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]);
  const length = Buffer.alloc(4), crc = Buffer.alloc(4);
  length.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}
function png(scanline = Buffer.from([0, 255, 255, 255, 255])) {
  const header = Buffer.alloc(13); header.writeUInt32BE(1, 0); header.writeUInt32BE(1, 4);
  header[8] = 8; header[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header), chunk('IDAT', deflateSync(scanline)), chunk('IEND', Buffer.alloc(0))]);
}
test('PNG: dimensions and complete pixel payload are validated', () => {
  assert.deepEqual(inspectPng(png()), { width: 1, height: 1 });
});
test('PNG: truncated, CRC-damaged, trailing and invalid scanline data fail', () => {
  assert.throws(() => inspectPng(png().subarray(0, 25)), /Truncated/);
  const damaged = png(); damaged[45] ^= 1;
  assert.throws(() => inspectPng(damaged), /CRC/);
  assert.throws(() => inspectPng(Buffer.concat([png(), Buffer.from([0])])), /trailing/);
  assert.throws(() => inspectPng(png(Buffer.from([5, 0, 0, 0, 0]))), /filter/);
  assert.throws(() => inspectPng(png(Buffer.from([0, 0]))), /scanline/);
});
test('artifact inventory detects missing, extra, and equal-count substitutions', () => {
  assert.deepEqual(artifactDifferences(['a.svg', 'b.svg'], ['b.svg', 'extra.svg']),
    { missing: ['a.svg'], extra: ['extra.svg'] });
});
test('fresh bytes detect stale or damaged artifacts without trusting timestamps', () => {
  assert.doesNotThrow(() => requireEqualBytes(Buffer.from('same'), Buffer.from('same'), 'a'));
  assert.throws(() => requireEqualBytes(Buffer.from('old'), Buffer.from('new'), 'a'), /Stale or damaged a/);
  assert.notEqual(sha256('source v1'), sha256('source v2'));
});
test('expected rendered text includes actors, calls, returns, title, notes and fragment guards', () => {
  const labels = expectedLabels('sequenceDiagram\nactor A as Читач\nparticipant S as Сервіс\ntitle Назва\nA->>S: call(id)\nS-->>A: Готово\nalt Перевірено\nNote over A,S: Умова\nend');
  assert.deepEqual(labels, ['Читач', 'Сервіс', 'Назва', 'call(id)', 'Готово', 'Перевірено', 'Умова']);
});
test('activation analysis rejects an imbalance hidden in one alternative', () => {
  assert.throws(() => activationBalance('activate S\nalt ok\ndeactivate S\nelse no\nend', 'fixture'), /imbalance/);
  assert.doesNotThrow(() => activationBalance('activate S\nalt ok\nelse no\nend\ndeactivate S', 'fixture'));
});
test('real matrix coverage, exact tags and all 59 activation trees remain valid', () => {
  assert.equal(checkSources().files.length, 59);
});
