import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';

export const sha256 = data => createHash('sha256').update(data).digest('hex');

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** Validate all chunks, CRCs and decompressed scanlines, not just the PNG signature. */
export function inspectPng(data) {
  const bytes = Buffer.from(data);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!bytes.subarray(0, 8).equals(signature)) throw new Error('Invalid PNG signature');
  let offset = 8, width, height, channels, ended = false;
  const idat = [];
  while (offset < bytes.length) {
    if (offset + 12 > bytes.length) throw new Error('Truncated PNG chunk');
    const length = bytes.readUInt32BE(offset);
    if (offset + 12 + length > bytes.length) throw new Error('Truncated PNG payload');
    const type = bytes.toString('ascii', offset + 4, offset + 8);
    const chunk = bytes.subarray(offset + 8, offset + 8 + length);
    if (crc32(bytes.subarray(offset + 4, offset + 8 + length)) !== bytes.readUInt32BE(offset + 8 + length)) {
      throw new Error('PNG CRC mismatch in ' + type);
    }
    if (offset === 8 && type !== 'IHDR') throw new Error('PNG must start with IHDR');
    if (type === 'IHDR') {
      if (width !== undefined || length !== 13) throw new Error('Invalid PNG IHDR');
      width = chunk.readUInt32BE(0); height = chunk.readUInt32BE(4);
      channels = ({ 2: 3, 6: 4 })[chunk[9]];
      if (!width || !height || !channels || chunk[8] !== 8 || chunk[10] || chunk[11] || chunk[12]) {
        throw new Error('Unsupported or empty PNG (expected non-interlaced 8-bit RGB/RGBA)');
      }
      if (width * height > 150_000_000) throw new Error('PNG exceeds 150 megapixels');
    }
    if (type === 'IDAT') idat.push(chunk);
    offset += length + 12;
    if (type === 'IEND') { ended = true; break; }
  }
  if (!ended || offset !== bytes.length || !idat.length) throw new Error('PNG missing IDAT/IEND or has trailing data');
  const stride = width * channels + 1;
  const raw = inflateSync(Buffer.concat(idat), { maxOutputLength: stride * height });
  if (raw.length !== stride * height) throw new Error('Incorrect PNG scanline size');
  for (let y = 0; y < height; y++) if (raw[y * stride] > 4) throw new Error('Invalid PNG filter');
  return { width, height };
}

export function expectedLabels(source) {
  const labels = [];
  for (const raw of source.split(/\r?\n/)) {
    const line = raw.trim();
    let m;
    if ((m = line.match(/^(?:actor|participant) \w+ as (.+)$/))) labels.push(m[1]);
    else if ((m = line.match(/^title (.+)$/))) labels.push(m[1]);
    else if ((m = line.match(/^\w+(?:->>|-->>|--x|-\))\w+: (.+)$/))) labels.push(m[1]);
    else if ((m = line.match(/^Note (?:over|right of|left of) [^:]+: (.+)$/))) labels.push(m[1]);
    else if ((m = line.match(/^(?:alt|opt|loop|par|else|and) (.+)$/))) labels.push(m[1]);
  }
  return labels;
}

export function artifactDifferences(expectedNames, actualNames) {
  const expected = new Set(expectedNames), actual = new Set(actualNames);
  return {
    missing: [...expected].filter(x => !actual.has(x)).sort(),
    extra: [...actual].filter(x => !expected.has(x)).sort(),
  };
}

export function requireEqualBytes(actual, expected, label) {
  if (!Buffer.from(actual).equals(Buffer.from(expected))) throw new Error('Stale or damaged ' + label);
}
