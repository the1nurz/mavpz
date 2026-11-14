import assert from 'node:assert/strict';

// A deliberately closed subset: unknown statements must never disappear from
// the graph check. PlantUML remains the separate real syntax parser.
export function checkStructure(text, spec, architecture) {
  const rows = doc => doc.split(/\r?\n/).filter(l => l.startsWith('| '))
    .map(l => l.split('|').slice(1, -1).map(x => x.trim()));
  const contractsOf = doc => rows(doc).filter(r => /^I[A-Z]\w+$/.test(r[0]));
  const contracts = contractsOf(spec);
  assert.equal(contracts.length, 10);
  assert.deepEqual(contractsOf(architecture).map(r => r.slice(0,3)), contracts.map(r => r.slice(0,3)));
  const expected = rows(architecture).filter(r => /^C[1-8]$/.test(r[0]) && /^(C[1-8]|A1)$/.test(r[1]));
  const contractUsages = contracts.flatMap(([i,p,cs]) => (cs.match(/C[1-8]/g) || []).map(c => [c,p,i].join('|')));
  assert.equal(expected.length,14);
  assert.deepEqual(expected.map(r => r.join('|')).sort(), contractUsages.sort(), 'Architecture differs from spec consumers');
  const components = new Map(), interfaces = new Map(), providers = [], usages = [], scopes = [], groups = [];
  const styles = new Set(['componentStyle','defaultFontName','defaultFontSize','shadowing','backgroundColor',
    'packageStyle','roundcorner','nodesep','ranksep','ArrowColor','componentBackgroundColor','componentBorderColor',
    'interfaceBackgroundColor','interfaceBorderColor','packageBackgroundColor','packageBorderColor',
    'noteBackgroundColor','noteBorderColor']);
  let prose = null, starts = 0, ends = 0;
  for (const [index, raw] of text.split(/\r?\n/).entries()) {
    const line = raw.trim();
    if (prose) {
      if (line === prose) prose = null;
      else assert(!/^(note |legend |@enduml)/.test(line), 'Unclosed note/legend before next block');
      continue;
    }
    if (!line || line.startsWith("'")) continue;
    let m;
    if (line === '@startuml component') { assert.equal(++starts,1); continue; }
    if (line === '@enduml') { assert.equal(++ends,1); continue; }
    assert(starts === 1 && ends === 0, 'Statement outside diagram');
    if (/^note (left|right|top|bottom) of (C[1-8]|A1)$/.test(line)) { prose = 'end note'; continue; }
    if (line === 'legend bottom left') { prose = 'endlegend'; continue; }
    if (line === 'top to bottom direction' || /^title .+$/.test(line)) continue;
    if ((m = line.match(/^skinparam (\w+) ([^{}]+)$/))) { assert(styles.has(m[1]), `Unsupported style ${m[1]}`); continue; }
    if ((m = line.match(/^(rectangle|package) ".+" as (Library|Server) \{$/))) {
      assert(!groups.includes(m[2]), 'Duplicate group');
      assert.equal(m[2], scopes.length ? 'Server' : 'Library');
      assert.equal(m[1], m[2] === 'Library' ? 'rectangle' : 'package');
      groups.push(m[2]); scopes.push(m[2]);
    } else if (line === 'together {') scopes.push('Layout');
    else if (line === '}') assert(scopes.pop(), 'Unbalanced group');
    else if ((m = line.match(/^component "(.+)" as (\w+)(?: <<external>>)?$/))) {
      assert(!components.has(m[2]), 'Duplicate component');
      components.set(m[2], {label:m[1], scopes:scopes.filter(s=>s!=='Layout')});
    } else if ((m = line.match(/^interface "(I\w+)" as (I\w+)$/))) {
      assert.equal(m[1],m[2]); assert(!interfaces.has(m[2]),'Duplicate interface');
      interfaces.set(m[2],scopes.filter(s=>s!=='Layout'));
    } else if ((m = line.match(/^(C[1-8]|A1) -(?:up|down|left|right)- (I\w+)$/))) providers.push([m[1],m[2]]);
    else if ((m = line.match(/^(C[1-8]|A1) \.\.> (I\w+)$/))) usages.push([m[1],m[2]]);
    else throw new Error(`Unsupported statement at line ${index+1}: ${line}`);
  }
  assert(!prose && !scopes.length, 'Unclosed note/group');
  assert.equal(starts,1); assert.equal(ends,1);
  assert.deepEqual(groups,['Library','Server']);
  assert.deepEqual([...components.keys()].sort(),['A1','C1','C2','C3','C4','C5','C6','C7','C8']);
  assert.deepEqual([...interfaces.keys()].sort(),contracts.map(r=>r[0]).sort());
  for (let i=1;i<=8;i++) {
    const g=components.get(`C${i}`).scopes;
    assert(g.includes('Library'));
    assert.equal(g.includes('Server'),i>=2 && i<=7);
  }
  assert.deepEqual(components.get('A1').scopes,[]);
  for (const [i,p] of contracts.map(r=>[r[0],r[1]])) {
    const g=interfaces.get(i);
    assert.deepEqual(g,p==='A1' ? [] : p==='C8' ? ['Library'] : ['Library','Server']);
  }
  assert.equal(providers.length,10);
  assert.deepEqual(providers.map(r=>r.join('|')).sort(),contracts.map(r=>[r[1],r[0]].join('|')).sort());
  const provider=new Map(providers.map(([p,i])=>[i,p]));
  assert.equal(usages.length,14);
  const actual=usages.map(([c,i])=>[c,provider.get(i),i]);
  assert.deepEqual(actual.map(r=>r.join('|')).sort(),expected.map(r=>r.join('|')).sort());
  const order=['C1','C2','C3','C4','C6','C5','C7','C8','A1'];
  for (const [c,p] of actual) assert(order.indexOf(c)<order.indexOf(p),'Cycle or unexpected dependency');
  assert.equal(new Set(actual.map(([c,p])=>`${c}|${p}`)).size,13);
  return { components, interfaces, actual };
}
