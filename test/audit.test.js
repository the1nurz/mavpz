import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { audit } from '../tools/audit.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const spec = readFileSync(path.join(root, 'spec.md'), 'utf8').replace(/\r\n/g, '\n');
const model = readFileSync(path.join(root, 'model/er.mmd'), 'utf8').replace(/\r\n/g, '\n');
function replace(text, from, to) {
  assert(text.includes(from), `Mutation fixture not found: ${from}`);
  return text.replace(from, to);
}
function rejects(specText, modelText, error) {
  const result = audit(specText, modelText);
  assert.equal(result.ok, false, 'auditor accepted a broken contract');
  assert.match(result.errors.join('\n'), error);
}

test('accepts revised root model with precise structure and key counts', () => {
  const result = audit(spec, model);
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.deepEqual(result.counts, { entities: 7, attributes: 27, relationships: 7, primaryKeys: 7, foreignKeys: 6, uniqueKeys: 2 });
});
test('accepts BOM, CRLF, whitespace, harmless comments and reordered attributes', () => {
  const changed = replace(model, '        int id PK\n        string name', '        string name\n        int id PK');
  const result = audit('\uFEFF' + spec.replace(/ /g, '  '), '\uFEFF%% layout note\n' + changed.replace(/\n/g, '\r\n'));
  assert.equal(result.ok, true, result.errors.join('\n'));
});
test('accepts equivalent reversed relationship notation', () => {
  const result = audit(spec, replace(model, 'Book ||--|{ Copy : includes', 'Copy }|--|| Book : belongs_to'));
  assert.equal(result.ok, true, result.errors.join('\n'));
});
test('accepts reordered entity definitions in spec', () => {
  const changed = spec.replace(/(^- \*\*\w+\*\*[^\n]*\n){7}/m, m => m.trimEnd().split('\n').reverse().join('\n') + '\n');
  assert.notEqual(changed, spec);
  assert.equal(audit(changed, model).ok, true);
});

const modelCases = [
  ['missing entity', model.replace(/    Author \{[\s\S]*?    \}\n/, ''), /missing entity Author/],
  ['extra entity', model + '\n    BookAuthor {\n int id PK\n }\n', /unexpected entity BookAuthor/],
  ['duplicate entity', model + '\n    Author {\n int id PK\n }\n', /duplicate entity Author/],
  ['uppercase entity', replace(model, '    Author {', '    AUTHOR {'), /missing entity Author/],
  ['missing attribute', replace(model, '        datetime returned_at\n', ''), /missing attribute Loan.returned_at/],
  ['extra attribute', replace(model, 'string physical_condition', 'string physical_condition\n        boolean available'), /unexpected attribute Copy.available/],
  ['duplicate attribute', replace(model, 'string title', 'string title\n        string title'), /duplicate attribute Book.title/],
  ['wrong name', replace(model, 'datetime issued_at', 'datetime loaned_at'), /missing attribute Loan.issued_at/],
  ['wrong value type', replace(model, 'datetime created_at', 'string created_at'), /type mismatch Reservation.created_at/],
  ['old UUID PK', replace(model, 'int id PK', 'uuid id PK'), /type mismatch Publisher.id/],
  ['wrong FK type', replace(model, 'int reader_id FK', 'string reader_id FK'), /FK: invalid Loan.reader_id/],
  ['missing PK', replace(model, 'int id PK', 'int id'), /exactly one id PK/],
  ['extra PK', replace(model, 'string title', 'string title PK'), /exactly one id PK/],
  ['missing FK', replace(model, 'int publisher_id FK', 'int publisher_id'), /FK: invalid Book.publisher_id/],
  ['wrong FK target field', replace(model, 'int book_id FK', 'int reader_id FK'), /missing attribute Copy.book_id/],
  ['wrong parent relationship', replace(model, 'Publisher ||--o{ Book', 'Author ||--o{ Book'), /K6 model: missing or changed relationship/],
  ['missing UK', replace(model, 'string isbn UK', 'string isbn'), /key flags mismatch Book.isbn/],
  ['extra UK', replace(model, 'string email', 'string email UK'), /expected 2 uniqueKeys/],
  ['invalid key', replace(model, 'string isbn UK', 'string isbn UNIQUE'), /invalid or duplicate key flags/],
  ['duplicate key', replace(model, 'string isbn UK', 'string isbn UK, UK'), /invalid or duplicate key flags/],
  ['missing relationship', replace(model, '    Reader ||--o{ Loan : receives\n', ''), /expected 7 relationships/],
  ['duplicate relationship', model + '\n Reader ||--o{ Loan : duplicate\n', /duplicate relationship/],
  ['unknown endpoint', replace(model, 'Book ||--|{ Copy', 'Book ||--|{ Unknown'), /undeclared relationship endpoint/],
  ['K1 optional authors', replace(model, 'Author }|--o{ Book', 'Author }o--o{ Book'), /K1 model: missing or changed relationship/],
  ['K1 one author maximum', replace(model, 'Author }|--o{ Book', 'Author ||--o{ Book'), /K1 model: missing or changed relationship/],
  ['K2 zero copies allowed', replace(model, 'Book ||--|{ Copy', 'Book ||--o{ Copy'), /K2 model: missing or changed relationship/],
  ['K3 reserves Copy', replace(model, 'Book ||--o{ Reservation', 'Copy ||--o{ Reservation'), /K3 model: missing or changed relationship/],
  ['K3 availability restriction', replace(model, 'do not require all copies to be on loan', 'require all copies to be on loan'), /K3 model: missing or changed rule comment/],
  ['K4 only one historical loan', replace(model, 'Copy ||--o{ Loan', 'Copy ||--o| Loan'), /K4 model: missing or changed relationship/],
  ['K4 two open loans', replace(model, 'At most one open Loan', 'At most two open Loans'), /K4 model: missing or changed rule comment/],
  ['K4 wrong active definition', replace(model, 'returned_at is NULL', 'returned_at is NOT NULL'), /K4 model: missing or changed rule comment/],
  ['K4 missing rule', replace(model, '    %% At most one open Loan per Copy; historical loans remain stored.\n', ''), /K4 model: missing or changed rule comment/],
  ['K5 ID-only queue', replace(model, 'served by ascending created_at', 'served by ascending Reservation.id'), /K5 model: missing or changed rule comment/],
  ['K5 descending tie break', replace(model, 'ordered by ascending Reservation.id', 'ordered by descending Reservation.id'), /K5 model: missing or changed rule comment/],
  ['K5 obsolete additional assumption', model + '\n%% Reservation.id is assigned in increasing creation order.\n', /conflicting constraint comment/],
  ['K6 optional publisher', replace(model, 'Publisher ||--o{ Book', 'Publisher |o--o{ Book'), /K6 model: missing or changed relationship/],
  ['invalid syntax', model + '\narbitrary invalid syntax\n', /unsupported relationship or syntax/],
  ['unclosed entity', replace(model, '        string name\n    }', '        string name'), /unsupported attribute/],
  ['empty model', '', /empty diagram/],
];
for (const [name, broken, error] of modelCases) test(`rejects model: ${name}`, () => rejects(spec, broken, error));

const specCases = [
  ['missing entity', replace(spec, '- **Reader**', '- Reader'), /spec: missing entity Reader/],
  ['duplicate entity', replace(spec, '- **Reader**', '- **Book**'), /distinct entity definitions/],
  ['wrong entity name', replace(spec, '- **Author**', '- **AUTHOR**'), /spec: missing entity Author/],
  ['K1 permits no author', replace(spec, 'принаймні одного автора', 'нуль авторів'), /K1 spec: changed/],
  ['K2 permits no copy', replace(spec, 'щонайменше один фізичний примірник', 'нуль фізичних примірників'), /K2 spec: changed/],
  ['K3 reserves Copy', replace(spec, 'читач бронює книгу, а не конкретний фізичний примірник', 'читач бронює конкретний фізичний примірник'), /K3 spec: changed/],
  ['K4 two active loans', replace(spec, 'максимум одна активна видача', 'максимум дві активні видачі'), /K4 spec: changed/],
  ['K4 wrong NULL definition', replace(spec, 'returned_at = NULL', 'returned_at != NULL'), /K4 spec: changed/],
  ['K4 no subsequent loan', replace(spec, 'Нова видача дозволяється після повернення попередньої.', ''), /K4 spec: changed/],
  ['K5 changed primary sort', replace(spec, 'за зростанням created_at', 'за спаданням created_at'), /K5 spec: changed/],
  ['K5 missing tie break', replace(spec, ', а за однакового часу — за зростанням Reservation.id', ''), /K5 spec: changed/],
  ['K6 two publishers', replace(spec, "пов'язана з одним видавцем", "пов'язана з двома видавцями"), /K6 spec: changed/],
  ['missing criterion', spec.replace(/^- \*\*K5\.[^\n]*\n/m, ''), /K5 spec: missing criterion/],
  ['duplicate criterion', spec + '\n' + spec.match(/^- \*\*K5\.[^\n]*/m)[0], /K5 spec: duplicate criterion/],
  ['extra criterion', spec + '\n- **K7. Додаткове:** нове правило.\n', /unexpected criterion K7/],
];
for (const [name, broken, error] of specCases) test(`rejects spec: ${name}`, () => rejects(broken, model, error));

test('CLI reads root files from another cwd and states limits for K4/K5', () => {
  const result = spawnSync(process.execPath, [path.join(root, 'tools/audit.js')], { cwd: tmpdir(), encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /7 entities, 27 attributes, 7 relationships; 7 PK, 6 FK, 2 UK/);
  assert.match(result.stdout, /real data are NOT executed/);
});
test('CLI honors explicit paths and fails on bad files and arguments', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'library-er-audit-'));
  try {
    const file = path.join(dir, 'broken.mmd');
    writeFileSync(file, replace(model, 'string isbn UK', 'string isbn'));
    const run = args => spawnSync(process.execPath, [path.join(root, 'tools/audit.js'), ...args], { encoding: 'utf8' });
    const broken = run(['--model', file, '--spec', path.join(root, 'spec.md')]);
    assert.equal(broken.status, 1);
    assert.match(broken.stderr, /key flags mismatch Book.isbn/);
    assert.equal(run(['--model', path.join(dir, 'missing.mmd')]).status, 1);
    for (const args of [['--unknown'], ['--model'], ['--model', '--spec'], ['--spec', path.join(root, 'spec.md'), 'extra']]) assert.equal(run(args).status, 1);
  } finally {
    const resolved = realpathSync(dir);
    assert.equal(path.dirname(resolved), realpathSync(tmpdir()));
    assert(path.basename(resolved).startsWith('library-er-audit-'));
    rmSync(resolved, { recursive: true, force: true });
  }
});
