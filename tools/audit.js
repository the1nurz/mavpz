import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Baseline of the accepted generated artifact; these attribute choices are
// not extra requirements attributed to the student's prose specification.
const schema = {
  Publisher: { id: ['int', 'PK'], name: ['string', ''] },
  Author: { id: ['int', 'PK'], full_name: ['string', ''] },
  Book: { id: ['int', 'PK'], title: ['string', ''], isbn: ['string', 'UK'], publication_year: ['int', ''], publisher_id: ['int', 'FK'] },
  Copy: { id: ['int', 'PK'], book_id: ['int', 'FK'], inventory_number: ['string', 'UK'], physical_condition: ['string', ''] },
  Reader: { id: ['int', 'PK'], full_name: ['string', ''], email: ['string', ''] },
  Loan: { id: ['int', 'PK'], reader_id: ['int', 'FK'], copy_id: ['int', 'FK'], issued_at: ['datetime', ''], due_at: ['datetime', ''], returned_at: ['datetime', ''] },
  Reservation: { id: ['int', 'PK'], reader_id: ['int', 'FK'], book_id: ['int', 'FK'], created_at: ['datetime', ''], status: ['string', ''] },
};
const foreignKeys = [
  ['Book', 'publisher_id', 'Publisher'], ['Copy', 'book_id', 'Book'],
  ['Loan', 'reader_id', 'Reader'], ['Loan', 'copy_id', 'Copy'],
  ['Reservation', 'reader_id', 'Reader'], ['Reservation', 'book_id', 'Book'],
];
const relationships = [
  ['K6', 'Publisher', '1..1', 'Book', '0..*'],
  ['K1', 'Author', '1..*', 'Book', '0..*'],
  ['K2', 'Book', '1..1', 'Copy', '1..*'],
  ['K4', 'Reader', '1..1', 'Loan', '0..*'],
  ['K4', 'Copy', '1..1', 'Loan', '0..*'],
  ['K3', 'Reader', '1..1', 'Reservation', '0..*'],
  ['K3', 'Book', '1..1', 'Reservation', '0..*'],
];
const leftRanges = { '||': '1..1', '|o': '0..1', '}o': '0..*', '}|': '1..*' };
const rightRanges = { '||': '1..1', 'o|': '0..1', 'o{': '0..*', '|{': '1..*' };

// Controlled prose checks, not general NLP or execution of DB constraints.
// Changed wording fails closed and requires a reviewed contract update.
const criteria = {
  K1: 'книга має принаймні одного автора; одна книга може мати кількох авторів, а один автор — кілька книг.',
  K2: 'кожна книга повинна мати щонайменше один фізичний примірник.',
  K3: 'читач бронює книгу, а не конкретний фізичний примірник, бронювати книгу можна незалежно від наявності вільних примірників.',
  K4: 'один примірник може мати багато історичних видач, але одночасно допускається максимум одна активна видача. Активна видача — це Loan, у якого returned_at = NULL. Нова видача дозволяється після повернення попередньої.',
  K5: 'бронювання однієї книги обслуговуються за зростанням created_at, а за однакового часу — за зростанням Reservation.id.',
  K6: "кожна книга пов'язана з одним видавцем; один видавець може бути пов'язаний із кількома книгами.",
};
const commentRules = [
  ['K4', 'Loan.returned_at is NULL while the loan is open.'],
  ['K4', 'At most one open Loan per Copy; historical loans remain stored.'],
  ['K3', 'Reservations concern Book and do not require all copies to be on loan.'],
  ['K5', 'Pending reservations for a Book are served by ascending created_at.'],
  ['K5', 'Equal created_at values are ordered by ascending Reservation.id.'],
];
const normalize = text => text.replace(/`/g, '').replace(/[’ʼ]/g, "'").replace(/\s+/g, ' ').trim().toLowerCase();
const lines = text => text.replace(/^\uFEFF/, '').split(/\r?\n/);
const edgeKey = (a, left, b, right) => a < b ? `${a}:${left}|${b}:${right}` : `${b}:${right}|${a}:${left}`;

function parseModel(text) {
  const entities = new Map(), relations = [], comments = [];
  let current = null, header = false;
  for (const [index, raw] of lines(text).entries()) {
    const line = raw.trim(), location = `model:${index + 1}`;
    if (!line) continue;
    if (line.startsWith('%%')) { comments.push(line.slice(2).trim()); continue; }
    if (!header) {
      if (line !== 'erDiagram') throw new Error(`${location}: expected erDiagram`);
      header = true;
      continue;
    }
    if (current) {
      if (line === '}') { current = null; continue; }
      const match = line.match(/^(\w+)\s+(\w+)(?:\s+(.+))?$/);
      if (!match) throw new Error(`${location}: unsupported attribute`);
      const [, type, field, keys = ''] = match;
      const flags = keys ? keys.split(',').map(s => s.trim()).sort() : [];
      if (flags.some(f => !['PK', 'FK', 'UK'].includes(f)) || new Set(flags).size !== flags.length) throw new Error(`${location}: invalid or duplicate key flags`);
      if (entities.get(current).has(field)) throw new Error(`${location}: duplicate attribute ${current}.${field}`);
      entities.get(current).set(field, { type, flags });
    } else {
      const opening = line.match(/^(\w+)\s*\{$/);
      if (opening) {
        current = opening[1];
        if (entities.has(current)) throw new Error(`${location}: duplicate entity ${current}`);
        entities.set(current, new Map());
        continue;
      }
      const r = line.match(/^(\w+)\s+(\|\||\|o|\}o|\}\|)(--|\.\.)(\|\||o\||o\{|\|\{)\s+(\w+)\s*:\s*(?:"([^"\n]+)"|([\w ]+))$/);
      if (!r) throw new Error(`${location}: unsupported relationship or syntax`);
      relations.push({ from: r[1], left: leftRanges[r[2]], to: r[5], right: rightRanges[r[4]] });
    }
  }
  if (!header || current) throw new Error('model: empty diagram or unclosed entity');
  return { entities, relations, comments };
}

export function audit(specText, modelText) {
  const errors = [];
  const check = (condition, message) => { if (!condition) errors.push(message); };
  let model;
  try { model = parseModel(modelText); }
  catch (error) { return { ok: false, errors: [error.message], counts: null }; }
  const specEntities = [], specCriteria = new Map();
  for (const line of lines(specText)) {
    const entity = line.trim().match(/^-\s+\*\*(\w+)\*\*\s*—/);
    if (entity) specEntities.push(entity[1]);
    const criterion = line.trim().match(/^-\s+\*\*(K\d+)\.[^*]*\*\*\s*(.+)$/);
    if (criterion) {
      const [, id, rule] = criterion;
      check(!specCriteria.has(id), `${id} spec: duplicate criterion`);
      specCriteria.set(id, rule);
    }
  }
  check(specEntities.length === 7 && new Set(specEntities).size === 7, 'spec: expected 7 distinct entity definitions');
  for (const name of Object.keys(schema)) check(specEntities.includes(name), `spec: missing entity ${name}`);
  for (const name of specEntities) check(Object.hasOwn(schema, name), `spec: unexpected entity ${name}`);
  check(specCriteria.size === 6, 'spec: expected exactly K1-K6');
  for (const [id, expected] of Object.entries(criteria)) {
    check(specCriteria.has(id), `${id} spec: missing criterion`);
    if (specCriteria.has(id)) check(normalize(specCriteria.get(id)) === normalize(expected), `${id} spec: changed or unsupported rule wording; review the contract and tests`);
  }
  for (const id of specCriteria.keys()) check(Object.hasOwn(criteria, id), `spec: unexpected criterion ${id}`);

  check(model.entities.size === 7, `structure: expected 7 entities, got ${model.entities.size}`);
  for (const [name, expected] of Object.entries(schema)) {
    const fields = model.entities.get(name);
    check(Boolean(fields), `structure: missing entity ${name}`);
    if (!fields) continue;
    for (const [field, [type, flag]] of Object.entries(expected)) {
      const actual = fields.get(field);
      check(Boolean(actual), `structure: missing attribute ${name}.${field}`);
      if (actual) {
        check(actual.type === type, `structure: type mismatch ${name}.${field}: expected ${type}`);
        check(actual.flags.join(',') === flag, `structure: key flags mismatch ${name}.${field}`);
      }
    }
    for (const field of fields.keys()) check(Object.hasOwn(expected, field), `structure: unexpected attribute ${name}.${field}`);
    const primary = [...fields].filter(([, f]) => f.flags.includes('PK'));
    check(primary.length === 1 && primary[0][0] === 'id', `structure: ${name} must have exactly one id PK`);
  }
  for (const name of model.entities.keys()) check(Object.hasOwn(schema, name), `structure: unexpected entity ${name}`);
  const allFields = [...model.entities.values()].flatMap(fields => [...fields.values()]);
  const counts = { entities: model.entities.size, attributes: allFields.length, relationships: model.relations.length,
    primaryKeys: allFields.filter(f => f.flags.includes('PK')).length,
    foreignKeys: allFields.filter(f => f.flags.includes('FK')).length,
    uniqueKeys: allFields.filter(f => f.flags.includes('UK')).length };
  for (const [key, expected] of Object.entries({ attributes: 27, primaryKeys: 7, foreignKeys: 6, uniqueKeys: 2, relationships: 7 })) check(counts[key] === expected, `structure: expected ${expected} ${key}, got ${counts[key]}`);
  for (const [child, field, parent] of foreignKeys) {
    const fk = model.entities.get(child)?.get(field), pk = model.entities.get(parent)?.get('id');
    check(Boolean(fk?.flags.includes('FK') && pk?.flags.includes('PK') && fk.type === pk.type && fk.type === 'int'), `FK: invalid ${child}.${field} -> ${parent}.id or key type mismatch`);
  }
  const pairs = new Set();
  for (const r of model.relations) {
    check(model.entities.has(r.from) && model.entities.has(r.to), `structure: undeclared relationship endpoint ${r.from}-${r.to}`);
    const pair = [r.from, r.to].sort().join(':');
    check(!pairs.has(pair), `structure: duplicate relationship ${pair}`);
    pairs.add(pair);
    check(relationships.some(([, a, left, b, right]) => edgeKey(a, left, b, right) === edgeKey(r.from, r.left, r.to, r.right)), `structure: unexpected relationship or cardinality ${r.from}-${r.to}`);
  }
  for (const [id, a, left, b, right] of relationships) check(model.relations.some(r => edgeKey(r.from, r.left, r.to, r.right) === edgeKey(a, left, b, right)), `${id} model: missing or changed relationship ${a}(${left})-${b}(${right})`);
  const normalizedComments = model.comments.map(normalize);
  for (const [id, rule] of commentRules) check(normalizedComments.includes(normalize(rule)), `${id} model: missing or changed rule comment: ${rule}`);
  // Reject obsolete/additional constraint-like comments instead of accepting
  // correct and conflicting rules together. Unrelated layout notes are allowed.
  for (const comment of model.comments) {
    if (/\b(loans?|cop(?:y|ies)|reservations?|returned_at|created_at)\b/i.test(comment)) check(commentRules.some(([, rule]) => normalize(rule) === normalize(comment)), `rules: unsupported or conflicting constraint comment: ${comment}`);
  }
  return { ok: errors.length === 0, errors, counts };
}

export function main(args = process.argv.slice(2)) {
  try {
    let specPath = path.join(root, 'spec.md'), modelPath = path.join(root, 'model', 'er.mmd');
    for (let i = 0; i < args.length; i += 2) {
      if (!['--spec', '--model'].includes(args[i]) || !args[i + 1] || args[i + 1].startsWith('--')) throw new Error('Usage: node tools/audit.js [--spec path] [--model path]');
      if (args[i] === '--spec') specPath = path.resolve(args[i + 1]);
      else modelPath = path.resolve(args[i + 1]);
    }
    const result = audit(readFileSync(specPath, 'utf8'), readFileSync(modelPath, 'utf8'));
    if (!result.ok) { for (const error of result.errors) console.error(`FAIL: ${error}`); return 1; }
    const c = result.counts;
    console.log(`PASS: ${c.entities} entities, ${c.attributes} attributes, ${c.relationships} relationships; ${c.primaryKeys} PK, ${c.foreignKeys} FK, ${c.uniqueKeys} UK.`);
    console.log('K1-K6: structural contract and supported spec/comment wording agree.');
    console.log('K4/K5: documentation checks only; constraints on real data are NOT executed. Changed prose requires manual review. Mermaid rendering is checked separately.');
    return 0;
  } catch (error) { console.error(`FAIL: ${error.message}`); return 1; }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main();
