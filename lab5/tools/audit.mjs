// Collect actual command outputs and source inventories. Semantic/visual audit
// remains in AUDIT.md; this runner does not certify a real application.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const hash=p=>createHash('sha256').update(readFileSync(resolve(root,p))).digest('hex');
const checks=[];
function run(name,exe,args) {
  const p=spawnSync(exe,args,{cwd:root,env:process.env,encoding:'utf8',timeout:60000,maxBuffer:16*1024*1024});
  checks.push({name,command:[exe,...args],exitCode:p.status,stdout:p.stdout?.trim(),stderr:p.stderr?.trim(),error:p.error?.message});
  assert(!p.error && p.status===0,`${name}: ${p.stderr || p.error}`);
  console.log(`PASS ${name}`);
  return p.stdout.trim();
}
const head=run('audit input HEAD','git',['rev-parse','HEAD']);
run('spec commit files','git',['show','--format=fuller','--stat','9eb4dfb6d298d31ee7c8916104752f346153c85e']);
run('first UML commit','git',['log','--diff-filter=A','--format=%H %s','--','lab5/component.puml']);
run('fix commit evidence','git',['show','--format=fuller','--stat','fd5c2fcafed463203074b4c60bfb6a35d9e97c1a']);
run('spec before first diagram','git',['merge-base','--is-ancestor','9eb4dfb6d298d31ee7c8916104752f346153c85e','eb67f2216120f7953a4420d85f976ed4d09d8608']);
run('protected Lab1-4 unchanged','git',['diff','0fab560c1b06dbf7b3f7065c5ade278ce9bf0f9a','--exit-code','--','.',':(exclude)lab5']);
run('spec criteria unchanged','git',['diff','9eb4dfb','--exit-code','--','lab5/spec.md']);
run('whitespace','git',['diff','--check']);
for (const [name,script] of [
  ['ER structural audit','tools/audit.js'],
  ['Lab2 traceability','lab2/tools/check-traceability.mjs'],
  ['UC10 detail','lab2/tools/check-uc10.mjs'],
  ['59 Sequence sources','lab3/tools/check-sequences.mjs'],
]) run(name,process.execPath,[script]);
run('diagram checker regressions 12/12',process.execPath,['--test','--test-reporter=spec','lab5/tools/test-structure.mjs']);
run('fresh real PlantUML render comparison',process.execPath,['lab5/tools/render.mjs','--check']);
run('SVG real XML parser','powershell',['-NoProfile','-Command',
  "$x=New-Object System.Xml.XmlDocument; $x.Load((Join-Path (Get-Location) 'lab5/render/component.svg')); if($x.DocumentElement.LocalName -ne 'svg'){throw 'Invalid SVG'}; Write-Output ('SVG XML PASS: '+$x.SelectNodes(\"//*[local-name()='text']\").Count+' text nodes')"]);

const seq=readdirSync(resolve(root,'lab3/diagrams')).filter(f=>f.endsWith('.mmd')).sort().map(f=>{
  const p='lab3/diagrams/'+f,s=read(p);
  const id=s.match(/^\s*%% (D\d{2})\s*\|/m)?.[1];
  assert(id,`Missing Sequence ID ${f}`);
  const n=+id.slice(1);
  const primary=n<=2||n===18?'C3':n<=25?'C4':n===46||n===47?'C6':[49,50,55].includes(n)?'C2':'C5';
  return {id,path:p,sha256:hash(p),primary,shared:'C1/C2 where UI/Access applies; C7/C8 for Store'};
});
assert.equal(seq.length,59);assert.equal(new Set(seq.map(x=>x.id)).size,59);
const counts={
  REQ:[...read('lab2/requirements.md').matchAll(/^- \*\*(REQ-\d{2}) /gm)].length,
  US:[...read('lab2/user-stories.md').matchAll(/^## US-\d{2} /gm)].length,
  UC:[...read('lab2/diagrams/use-cases.puml').matchAll(/^\s*usecase "UC-\d{2}/gm)].length,
  NFR:[...read('lab2/requirements.md').matchAll(/^### NFR-\d{2} /gm)].length,
  Sequence:seq.length,
};
assert.deepEqual(counts,{REQ:24,US:9,UC:15,NFR:12,Sequence:59});
const record={date:'2026-11-14',baseline:'eb67f2216120f7953a4420d85f976ed4d09d8608',inputHead:head,
  collectorSha256:hash('lab5/tools/audit.mjs'),
  checks,counts,sequenceInventory:seq,
  diagramManifest:JSON.parse(read('lab5/render/manifest.json')),
  browser:existsSync(resolve(root,'.cache/lab5-audit/svg-browser.json'))
    ? JSON.parse(read('.cache/lab5-audit/svg-browser.json'))
    : {status:'NOT RUN successfully',reason:'Headless browser attempt timed out; PNG visually inspected; SVG XML/path geometry checked separately'},
  limitations:['No real application tests','Counts/structural checks do not prove all semantics','Full teacher handout not supplied','Graphviz DLL hashes not complete'],
};
writeFileSync(resolve(root,'lab5/audit-results.json'),JSON.stringify(record,null,2)+'\n');
console.log('PASS audit-results.json saved with actual outputs and 59 source hashes');
