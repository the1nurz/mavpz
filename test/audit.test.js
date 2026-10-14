import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { audit } from '../tools/audit.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const spec = readFileSync(path.join(root, 'spec.md'), 'utf8');
const model = readFileSync(path.join(root, 'model/er.mmd'), 'utf8').replace(/\r\n/g, '\n');
const cleanSpec = spec.replace(/\r\n/g, '\n');
function replace(text, from, to) {
  assert(text.includes(from), `Mutation fixture not found: ${from}`);
  return text.replace(from, to);
}

test('accepts current model and reports exact counts', () => {
  const result = audit(spec, model);
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.deepEqual(result.counts, { entities: 7, attributes: 30, relationships: 7 });
});

test('accepts CRLF, BOM, whitespace, comments and reordered attributes', () => {
  const reordered = replace(model, '        string name\n        string country', '        string country\n        string name');
  assert.equal(audit('\uFEFF' + spec, '\uFEFF%% comment\n' + reordered.replace(/\n/g, '\r\n')).ok, true);
});

const modelCases = [
  ['missing entity', model.replace(/    AUTHOR \{[\s\S]*?    \}\n/, ''), /missing entity AUTHOR/],
  ['extra join entity', model + '\n    BOOKAUTHOR {\n uuid id PK\n }\n', /unexpected entity BOOKAUTHOR/],
  ['duplicate entity', model + '\n    AUTHOR {\n uuid id PK\n }\n', /duplicate entity AUTHOR/],
  ['missing attribute', replace(model, '        datetime returned_at\n', ''), /missing.*LOAN.returned_at/],
  ['extra derived field', replace(model, '        string state', '        string state\n        boolean available'), /K3.*COPY.available/],
  ['extra ordinary field', replace(model, '        string country', '        string country\n        string address'), /unexpected attribute PUBLISHER.address/],
  ['duplicate attribute', replace(model, '        string title', '        string title\n        string title'), /duplicate attribute BOOK.title/],
  ['wrong non-key type', replace(model, 'int birth_year', 'string birth_year'), /type mismatch AUTHOR.birth_year/],
  ['wrong PK type', replace(model, 'uuid id PK', 'int id PK'), /key type must be uuid/],
  ['wrong FK type', replace(model, 'uuid reader_id FK', 'int reader_id FK'), /key type must be uuid/],
  ['missing PK', replace(model, 'uuid id PK', 'uuid id'), /exactly one id PK/],
  ['second PK', replace(model, 'string title', 'string title PK'), /exactly one id PK/],
  ['missing FK flag', replace(model, 'uuid publisher_id FK', 'uuid publisher_id'), /flags mismatch BOOK.publisher_id/],
  ['missing UK', replace(model, 'string isbn UK', 'string isbn'), /flags mismatch BOOK.isbn/],
  ['duplicate flag', replace(model, 'string isbn UK', 'string isbn UK, UK'), /duplicate key flags/],
  ['unknown flag', replace(model, 'string isbn UK', 'string isbn UNIQUE'), /unsupported attribute/],
  ['attribute name case', replace(model, 'string title', 'string Title'), /missing attribute BOOK.title/],
  ['entity name case', replace(model, '    AUTHOR {', '    Author {'), /missing entity AUTHOR/],
  ['missing relationship', replace(model, '    BOOK ||--o{ COPY : has\n', ''), /expected 7 relationships/],
  ['duplicate relationship', model + '\n BOOK ||--o{ COPY : other\n', /duplicate relationship/],
  ['unknown endpoint', replace(model, 'BOOK ||--o{ COPY : has', 'BOOK ||--o{ UNKNOWN : has'), /undeclared relationship endpoint/],
  ['optional author', replace(model, 'AUTHOR }|--o{ BOOK', 'AUTHOR }o--o{ BOOK'), /expected direct AUTHOR/],
  ['wrong minimum on copies', replace(model, 'BOOK ||--o{ COPY', 'BOOK ||--|{ COPY'), /missing or changed relationship/],
  ['wrong maximum', replace(model, 'PUBLISHER ||--o{ BOOK', 'PUBLISHER ||--o| BOOK'), /missing or changed relationship/],
  ['wrong mandatory parent', replace(model, 'READER ||--o{ LOAN', 'READER |o--o{ LOAN'), /FK relationship missing/],
  ['changed label', replace(model, ': publishes', ': publishes_other'), /missing or changed relationship/],
  ['changed connector', replace(model, 'BOOK ||--o{ COPY', 'BOOK ||..o{ COPY'), /missing or changed relationship/],
  ['invalid syntax', model + '\n arbitrary invalid syntax\n', /unsupported relationship/],
  ['unclosed entity', model.trimEnd().slice(0, -1), /unclosed entity/],
  ['empty model', '', /empty diagram/],
];
for (const [name, broken, error] of modelCases) {
  test(`rejects model: ${name}`, () => {
    const result = audit(spec, broken);
    assert.equal(result.ok, false);
    assert.match(result.errors.join('\n'), error);
  });
}

const specCases = [
  ['missing table', replace(cleanSpec, '| Сутність | Атрибут | Тип | Ключ | Посилання |', '| wrong header |'), /exactly one table/],
  ['malformed row', replace(cleanSpec, '| Author | birth_year | int | — | — |', '| Author | birth_year | int | — |'), /malformed table row/],
  ['duplicate attribute', replace(cleanSpec, '| Author | birth_year | int | — | — |', '| Author | full_name | int | — | — |'), /duplicate attribute/],
  ['missing FK reference', replace(cleanSpec, '| FK | Publisher.id |', '| FK | — |'), /inconsistent FK target/],
  ['unknown FK entity', replace(cleanSpec, 'Publisher.id |', 'Unknown.id |'), /invalid FK target/],
  ['wrong FK field case', replace(cleanSpec, 'Publisher.id |', 'Publisher.ID |'), /invalid FK target/],
  ['non-PK FK target', replace(cleanSpec, 'Publisher.id |', 'Publisher.name |'), /invalid FK target/],
  ['FK target without matching relationship', replace(cleanSpec, 'Publisher.id |', 'Author.id |'), /FK relationship missing/],
  ['conflicting cardinality columns', replace(cleanSpec, '| Author | Book | 0..* | 1..* |', '| Author | Book | 0..* | 0..* |'), /columns disagree/],
  ['duplicate relationship', replace(cleanSpec, '| Book | Copy | 0..* | 1..1 | BOOK \\|\\|--o{ COPY | has |', '| Publisher | Book | 0..* | 1..1 | PUBLISHER \\|\\|--o{ BOOK | publishes |'), /duplicate relationship/],
];
for (const [name, broken, error] of specCases) {
  test(`rejects spec: ${name}`, () => {
    const result = audit(broken, model);
    assert.equal(result.ok, false);
    assert.match(result.errors.join('\n'), error);
  });
}

test('CLI works from another directory and states manual 3NF limitation', () => {
  const result = spawnSync(process.execPath, [path.join(root, 'tools/audit.js')], { cwd: tmpdir(), encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /3NF.*require manual review/);
});

test('CLI rejects an incorrect temporary model, missing file and invalid arguments', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'library-er-audit-'));
  try {
    const filename = path.join(dir, 'broken.mmd');
    writeFileSync(filename, replace(model, 'string isbn UK', 'string isbn'));
    const run = args => spawnSync(process.execPath, [path.join(root, 'tools/audit.js'), ...args], { encoding: 'utf8' });
    const broken = run(['--model', filename, '--spec', path.join(root, 'spec.md')]);
    assert.equal(broken.status, 1);
    assert.match(broken.stderr, /flags mismatch BOOK.isbn/);
    assert.equal(run(['--model', path.join(dir, 'missing.mmd')]).status, 1);
    assert.equal(run(['--unknown']).status, 1);
    assert.equal(run(['--model']).status, 1);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
