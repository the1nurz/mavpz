"""Аудит узгодженості spec.md <-> model/er.mmd (критерії K1, K5)."""
import re,sys
root=sys.argv[1] if len(sys.argv)>1 else '.'
bad=0
mmd=open(root+'/model/er.mmd',encoding='utf8').read()
spec=open(root+'/spec.md',encoding='utf8').read()
# model: entity -> {field:(type,flags)}
ents={}
for m in re.finditer(r'(\w+) \{(.*?)\}',mmd,re.S):
    f={}
    for l in m.group(2).strip().splitlines():
        p=l.split()
        f[p[1]]=(p[0],p[2:] )
    ents[m.group(1).lower()]=f
# spec table
sp={}
for l in spec.splitlines():
    m=re.match(r'\| (\w+) \| (.+) \|$',l)
    if m and m.group(1) not in('Сутність',):
        sp[m.group(1).lower()]=[re.sub(r'\s*\(.*?\)','',a).strip() for a in m.group(2).split(',')]
for e,fs in sp.items():
    mf=set(ents.get(e,{}))
    if set(fs)!=mf: bad+=1; print('FIELD MISMATCH',e,'spec-only',set(fs)-mf,'model-only',mf-set(fs))
types={(e,f):t for e,d in ents.items() for f,(t,_) in d.items() if f=='id' or f.endswith('_id')}
print('id/fk types:',set(types.values()))
for k,t in types.items():
    if t!='uuid': bad+=1; print('TYPE MISMATCH',k,t)
sys.exit(1 if bad else 0)
