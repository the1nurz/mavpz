import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { runInNewContext } from 'node:vm';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { checkStructure } from './check-structure.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const source=read('lab5/component.puml'), spec=read('lab5/spec.md'), architecture=read('lab5/architecture.md');
const check=(s=source,a=architecture)=>checkStructure(s,spec,a);
const insert=line=>source.replace('@enduml',line+'\n@enduml');
const baseline='eb67f2216120f7953a4420d85f976ed4d09d8608';
const old=p=>execFileSync('git',['show',`${baseline}:${p}`],{cwd:root,encoding:'utf8'});
const legacy=old('lab5/tools/render.mjs');
const legacySource=old('lab5/component.puml');
const prefix=legacy.slice(legacy.indexOf('const rows = text =>'),legacy.indexOf('const java ='));
function oldCheck(s,a) {
  runInNewContext(prefix,{text:s,assert,console:{log(){}},read:p=>Buffer.from(p.endsWith('architecture.md')?a:spec)});
}

test('positive: current diagram and exact contracts',()=>check());
test('AUD5-02a: reproduce legacy extra-arrow false positive, reject it now',()=>{
  const s=insert('C1 -> C8');
  oldCheck(legacySource.replace('@enduml','C1 -> C8\n@enduml'),architecture);
  assert.throws(()=>check(s),/Unsupported statement/);
});
test('AUD5-02b: source+edge-table cannot override required consumer in spec',()=>{
  const s=source.replace('C6 ..> IQueue','C4 ..> IQueue');
  const a=architecture.replace('| C6 | C5 | IQueue |','| C4 | C5 | IQueue |');
  oldCheck(legacySource.replace('C6 ..> IQueue','C4 ..> IQueue'),a);
  assert.throws(()=>check(s,a),/Architecture differs from spec consumers/);
});
test('reject implicit extra component',()=>assert.throws(()=>check(insert('[Payment]')),/Unsupported statement/));
test('reject unsupported include without executing it',()=>assert.throws(()=>check(insert('!include unavailable.puml')),/Unsupported statement/));
test('reject wrong provider',()=>assert.throws(()=>check(source.replace('C2 -left- IBackend','C3 -left- IBackend'))));
test('reject missing required interface usage',()=>assert.throws(()=>check(source.replace('C6 ..> IQueue',''))));
test('reject reversed usage syntax',()=>assert.throws(()=>check(source.replace('C6 ..> IQueue','IQueue ..> C6')),/Unsupported statement/));
test('reject duplicate component',()=>assert.throws(()=>check(insert('component "Duplicate" as C1')),/Duplicate component/));
test('reject external A1 moved into Library',()=>{
  const line=source.split(/\r?\n/).find(l=>l.startsWith('component "A1'));
  const s=source.replace(line,'').replace('  component "C8',line+'\n  component "C8');
  assert.throws(()=>check(s));
});
test('reject synthetic C5 self-consumer',()=>assert.throws(()=>check(insert('C5 ..> IQueue'))));
test('reject unclosed note',()=>assert.throws(()=>check(source.replace('end note',''))));
