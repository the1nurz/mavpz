import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entities = ['PUBLISHER', 'AUTHOR', 'BOOK', 'COPY', 'READER', 'LOAN', 'RESERVATION'];
const leftRanges = { '||': '1..1', '|o': '0..1', '}o': '0..*', '}|': '1..*' };
const rightRanges = { '||': '1..1', 'o|': '0..1', 'o{': '0..*', '|{': '1..*' };
const relationshipPattern = /^(\w+)\s+(\|\||\|o|\}o|\}\|)(--|\.\.)(\|\||o\||o\{|\|\{)\s+(\w+)\s*:\s*(?:"([^"\n]+)"|([\w ]+))$/;

function fail(message) {
  throw new Error(message);
}

function relation(line, location) {
  const match = line.match(relationshipPattern);
  if (!match) fail(`${location}: unsupported relationship: ${line}`);
  const [, from, left, connector, right, to, quoted, plain] = match;
  return { from, left, connector, right, to, label: (quoted ?? plain).trim() };
}

function flags(value, location) {
  if (value === '—' || value === '') return [];
  const result = value.split(',').map(s => s.trim());
  if (result.some(s => !['PK', 'FK', 'UK'].includes(s)) || new Set(result).size !== result.length) {
    fail(`${location}: invalid or duplicate key flags: ${value}`);
  }
  return result.sort();
}

// Split Markdown cells without treating escaped Mermaid pipes as delimiters.
function cells(line) {
  return line.replace(/\\\|/g, '\u0000').split('|').slice(1, -1)
    .map(s => s.trim().replace(/\u0000/g, '|'));
}

function table(text, header, width) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
  const starts = lines.flatMap((line, i) => line.trim() === header ? [i] : []);
  if (starts.length !== 1) fail(`spec: expected exactly one table ${header}`);
  const start = starts[0];
  if (!/^\|(?:\s*:?-+:?\s*\|)+$/.test(lines[start + 1]?.trim() ?? '')) {
    fail('spec: missing table separator');
  }
  const rows = [];
  for (let i = start + 2; i < lines.length && lines[i].trim().startsWith('|'); i++) {
    const line = lines[i].trim();
    const row = cells(line);
    if (!line.endsWith('|') || row.length !== width || row.some(s => !s)) {
      fail(`spec:${i + 1}: malformed table row`);
    }
    rows.push(row);
  }
  if (!rows.length) fail('spec: empty table');
  return rows;
}

function parseSpec(text) {
  const attributes = table(text, '| Сутність | Атрибут | Тип | Ключ | Посилання |', 5);
  const model = { entities: new Map(), relations: [] };
  for (const [name, field, type, key, target] of attributes) {
    if (!/^[A-Z][a-z]+$/.test(name) || !/^\w+$/.test(field) || !/^\w+$/.test(type)) {
      fail(`spec: invalid entity, field or type: ${name}.${field}`);
    }
    const entity = name.toUpperCase();
    if (!model.entities.has(entity)) model.entities.set(entity, new Map());
    const fields = model.entities.get(entity);
    if (fields.has(field)) fail(`spec: duplicate attribute ${entity}.${field}`);
    const keys = flags(key, `spec ${name}.${field}`);
    if (keys.includes('FK') !== (target !== '—')) fail(`spec: inconsistent FK target ${name}.${field}`);
    if (target !== '—' && !/^[A-Z][a-z]+\.\w+$/.test(target)) fail(`spec: invalid FK target ${target}`);
    const reference = target === '—' ? null : target.split('.');
    fields.set(field, { type, flags: keys, target: reference ? `${reference[0].toUpperCase()}.${reference[1]}` : null });
  }
  const relationships = table(text,
    '| Ліва сутність | Права сутність | Правих на одну ліву | Лівих на одну праву | Mermaid | Підпис |', 6);
  for (const [from, to, rights, lefts, expression, label] of relationships) {
    const r = relation(`${expression} : "${label}"`, 'spec');
    if (r.from !== from.toUpperCase() || r.to !== to.toUpperCase()
      || rightRanges[r.right] !== rights || leftRanges[r.left] !== lefts) {
      fail(`spec: cardinality columns disagree with Mermaid for ${from}-${to}`);
    }
    model.relations.push(r);
  }
  return model;
}

function parseModel(text) {
  const model = { entities: new Map(), relations: [] };
  let current = null;
  let header = false;
  for (const [index, raw] of text.replace(/^\uFEFF/, '').split(/\r?\n/).entries()) {
    const line = raw.trim();
    const location = `model:${index + 1}`;
    if (!line || line.startsWith('%%')) continue;
    if (!header) {
      if (line !== 'erDiagram') fail(`${location}: expected erDiagram`);
      header = true;
      continue;
    }
    if (current) {
      if (line === '}') { current = null; continue; }
      const match = line.match(/^(\w+)\s+(\w+)(?:\s+((?:PK|FK|UK)(?:\s*,\s*(?:PK|FK|UK))*))?$/);
      if (!match) fail(`${location}: unsupported attribute: ${line}`);
      const [, type, name, key = ''] = match;
      const fields = model.entities.get(current);
      if (fields.has(name)) fail(`${location}: duplicate attribute ${current}.${name}`);
      fields.set(name, { type, flags: flags(key, location) });
    } else {
      const opening = line.match(/^(\w+)\s*\{$/);
      if (opening) {
        current = opening[1];
        if (model.entities.has(current)) fail(`${location}: duplicate entity ${current}`);
        model.entities.set(current, new Map());
      } else {
        model.relations.push(relation(line, location));
      }
    }
  }
  if (!header || current) fail('model: empty diagram or unclosed entity');
  return model;
}

const relationKey = r => [r.from, r.left, r.connector, r.right, r.to, r.label].join('|');

export function audit(specText, modelText) {
  const errors = [];
  let spec, model;
  try { spec = parseSpec(specText); model = parseModel(modelText); }
  catch (error) { return { ok: false, errors: [error.message], counts: null }; }
  const check = (condition, message) => { if (!condition) errors.push(message); };
  for (const [source, document] of [['spec', spec], ['model', model]]) {
    check(document.entities.size === 7, `K5 ${source}: expected 7 entities, got ${document.entities.size}`);
    for (const name of entities) check(document.entities.has(name), `K5 ${source}: missing entity ${name}`);
    for (const [name, fields] of document.entities) {
      check(entities.includes(name), `K4/K5 ${source}: unexpected entity ${name}`);
      const primary = [...fields].filter(([, f]) => f.flags.includes('PK'));
      check(primary.length === 1 && primary[0][0] === 'id', `K1 ${source}: ${name} must have exactly one id PK`);
      for (const [field, value] of fields) {
        if (value.flags.includes('PK') || value.flags.includes('FK')) {
          check(value.type === 'uuid', `K1 ${source}: ${name}.${field} key type must be uuid`);
        }
        if (name === 'COPY') {
          check(!['available', 'availability', 'is_available', 'status'].includes(field),
            `K3 ${source}: forbidden derived or mixed field COPY.${field}`);
        }
      }
    }
    const total = [...document.entities.values()].reduce((n, fields) => n + fields.size, 0);
    check(total === 30, `K5 ${source}: expected 30 attributes, got ${total}`);
    check(document.relations.length === 7, `K2 ${source}: expected 7 relationships, got ${document.relations.length}`);
    const pairs = new Set();
    for (const r of document.relations) {
      const pair = [r.from, r.to].sort().join(':');
      check(!pairs.has(pair), `K2/K5 ${source}: duplicate relationship ${pair}`);
      pairs.add(pair);
      check(document.entities.has(r.from) && document.entities.has(r.to), `K2 ${source}: undeclared relationship endpoint ${pair}`);
    }
    check(document.relations.some(r => r.from === 'AUTHOR' && r.to === 'BOOK'
      && r.left === '}|' && r.right === 'o{' && r.connector === '--'),
    `K2/K4 ${source}: expected direct AUTHOR }|--o{ BOOK`);
    for (const [entity, required] of [['LOAN', ['reader_id', 'copy_id', 'loaned_at', 'due_at', 'returned_at']],
      ['RESERVATION', ['reader_id', 'book_id', 'reserved_at', 'status']]]) {
      for (const field of required) check(document.entities.get(entity)?.has(field), `K4 ${source}: missing ${entity}.${field}`);
    }
  }
  for (const [name, expectedFields] of spec.entities) {
    const actualFields = model.entities.get(name) ?? new Map();
    for (const [field, expected] of expectedFields) {
      const actual = actualFields.get(field);
      check(Boolean(actual), `K5 model: missing attribute ${name}.${field}`);
      if (actual) {
        check(actual.type === expected.type, `K5 model: type mismatch ${name}.${field}`);
        check(actual.flags.join(',') === expected.flags.join(','), `K1/K5 model: key flags mismatch ${name}.${field}`);
      }
      if (expected.target) {
        const [parent, key] = expected.target.split('.');
        for (const [source, document] of [['spec', spec], ['model', model]]) {
          const target = document.entities.get(parent)?.get(key);
          check(Boolean(target?.flags.includes('PK')) && target?.type === expected.type,
            `K1 ${source}: invalid FK target for ${name}.${field}: ${expected.target}`);
          check(document.relations.some(r => r.from === parent && r.to === name
            && r.left === '||' && r.right === 'o{'), `K1/K2 ${source}: FK relationship missing ${parent}-${name}`);
        }
      }
    }
    for (const field of actualFields.keys()) check(expectedFields.has(field), `K5 model: unexpected attribute ${name}.${field}`);
  }
  const expectedRelations = new Set(spec.relations.map(relationKey));
  const actualRelations = new Set(model.relations.map(relationKey));
  for (const key of expectedRelations) check(actualRelations.has(key), `K2/K5 model: missing or changed relationship ${key}`);
  for (const key of actualRelations) check(expectedRelations.has(key), `K2/K5 model: unexpected relationship ${key}`);
  return { ok: errors.length === 0, errors, counts: {
    entities: model.entities.size,
    attributes: [...model.entities.values()].reduce((n, fields) => n + fields.size, 0),
    relationships: model.relations.length,
  } };
}

export function main(args = process.argv.slice(2)) {
  try {
    let specPath = path.join(root, 'spec.md');
    let modelPath = path.join(root, 'model', 'er.mmd');
    for (let i = 0; i < args.length; i += 2) {
      if (!['--spec', '--model'].includes(args[i]) || !args[i + 1] || args[i + 1].startsWith('--')) {
        fail('Usage: node tools/audit.js [--spec path] [--model path]');
      }
      if (args[i] === '--spec') specPath = path.resolve(args[i + 1]);
      else modelPath = path.resolve(args[i + 1]);
    }
    const result = audit(readFileSync(specPath, 'utf8'), readFileSync(modelPath, 'utf8'));
    if (!result.ok) { for (const error of result.errors) console.error(`FAIL: ${error}`); return 1; }
    console.log(`PASS: ${result.counts.entities} entities, ${result.counts.attributes} attributes, ${result.counts.relationships} relationships; K1/K2/K4/K5 structural checks.`);
    console.log('K3: structural checks passed; functional dependencies, 3NF and operational rules require manual review. K6 is outside this audit.');
    return 0;
  } catch (error) { console.error(`FAIL: ${error.message}`); return 1; }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main();
}
