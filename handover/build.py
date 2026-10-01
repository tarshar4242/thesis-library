import json,re,csv
from collections import defaultdict,Counter
from topics import T
import sys
d=json.load(open(sys.argv[1] if len(sys.argv)>1 else 'inventory.json'))
def orig(t):
    m=re.match(r'^[^_]*[\u4e00-\u9fff][^_]*_(.+)$',t)
    return m.group(1) if m else t
for f in d['folders']+d['files']:
    f['current']=f['title']; f['title']=orig(f['title'])
# dedupe by id
d['folders']=list({f['id']:f for f in d['folders']}.values()); d['files']=list({f['id']:f for f in d['files']}.values())
ROOT='1wTuBDC0bYnDtGxrU4tvnSW2c92Q5QuUB'
fol={f['id']:f for f in d['folders']}
def anc(i):
    out=[]
    while i!=ROOT: out.append(fol[i]); i=fol[i]['parentId']
    return out  # nearest first
def path(i): return '/'.join(f['title'] for f in reversed(anc(i)))
miss=set()
def kind_of(s):
    if re.search(r'infographic',s,re.I): return '資訊圖表'
    if re.search(r'slide|template',s,re.I): return '簡報'
    return ''
def parse(s):
    ver=''
    m=re.search(r'\b[Vv](\d)\b',s)
    if m: ver='V'+m.group(1)
    m=re.search(r'\b(20\d\d)\b',s)
    if m: ver=m.group(1)
    t=re.sub(r'\b(power ?point|powerpiont|templates?|slides?|infographics?|[Vv]\d|20\d\d)\b','',s,flags=re.I)
    t=re.sub(r'[-\s]+',' ',t).strip()
    zh=T.get(t)
    if zh is None:
        for k in T:
            if k.lower()==t.lower(): zh=T[k]
    if zh is None: miss.add(t); zh='??'+t
    return zh,ver
def topic_zh(i):  # chinese base for a folder (topic+kind+ver)
    return names[i]
names={}
TOPLEVEL={}
def kids(i): return [f for f in d['folders'] if f['parentId']==i]
for top in kids(ROOT):
    letters=set()
    for c in kids(top['id']): letters.add(c['title'][0].upper() if not c['title'][0].isdigit() else '#')
    L=sorted(letters); 
    rng=('數字與' if '#' in L else '')+'-'.join(sorted(x for x in L if x!='#')[::max(1,len([x for x in L if x!='#'])-1)])
    TOPLEVEL[top['id']]=f'{rng}開頭版型合集'
def folder_zh(f):
    if f['id'] in TOPLEVEL: return TOPLEVEL[f['id']]
    t=f['title']
    if re.match(r'(Presentation|Presenteton|File)',t,re.I):
        p=folder_zh(fol[f['parentId']]); return re.sub(r'簡報|資訊圖表','',p,count=1)+'簡報檔'
    m=re.match(r'Template (\d)',t)
    if m: return re.sub(r'簡報|資訊圖表','',folder_zh(fol[f['parentId']]),count=1)+'簡報版本'+m.group(1)
    zh,ver=parse(t)
    k=kind_of(t)
    if not k:
        for a in anc(f['parentId']) if f['parentId']!=ROOT else []:
            if a['id'] in TOPLEVEL: break
            k=kind_of(a['title'])
            if k: break
    return zh+k+ver
for f in d['folders']: names[f['id']]=folder_zh(f)
rows=[]
for f in d['folders']:
    rows.append(dict(cur=f['current'],id=f['id'],type='資料夾',path=path(f['parentId']) if f['parentId']!=ROOT else '',old=f['title'],zh=names[f['id']]))
for f in d['files']:
    t=f['title']; base=re.sub(r'\.\w+$','',t).strip()
    if re.match(r'read ?me',t,re.I): zh='字型說明'
    elif t.startswith('Fonts used in'):
        zh,ver=parse(re.sub(r'Fonts used in','',base)); zh=zh+'字型說明'+ver.upper()
    else:
        zh,ver=parse(base); k=kind_of(base)
        if not k:
            for a in anc(f['parentId']):
                if a['id'] in TOPLEVEL: break
                k=kind_of(a['title'])
                if k: break
        zh=zh+(k or '簡報')+ver
    rows.append(dict(cur=f['current'],id=f['id'],type='檔案',path=path(f['parentId']),old=t,zh=zh))
for r in rows: r['new']=f"{r['zh']}_{r['old']}"
c=Counter(r['new'] for r in rows if r['zh']!='字型說明')
seen=defaultdict(int)
for r in sorted(rows,key=lambda r:(r['path'],r['old'])):
    if r['zh']!='字型說明' and c[r['new']]>1:
        seen[r['new']]+=1; r['new']=f"{r['zh']}-{seen[r['new']]}_{r['old']}"
print('MISS',miss)
print(TOPLEVEL)
rows.sort(key=lambda r:(r['type']!='檔案', r['path'],r['old']))
with open('對照表.csv','w',newline='',encoding='utf-8-sig') as fh:
    w=csv.DictWriter(fh,fieldnames=['type','path','old','new','id']); w.writeheader()
    for r in rows: w.writerow({k:r[k] for k in ['type','path','old','new','id']})
json.dump(rows,open('plan.json','w'),ensure_ascii=False)
todo=[r for r in rows if r['cur']!=r['new']]
with open('todo.tsv','w') as fh:
    for r in todo: fh.write(f"{r['id']}\t{r['new']}\n")
print('total',len(rows),'need rename',len(todo))
