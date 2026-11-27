# ★v0.22.201 SORA〜MIO の奥義の絵18本（カットイン＋12コマ）・タイダウンベルト・スタッフロール・朝のタイトル・エンディングの曲・残響の音・敵の攻撃の音（audio v0.39）。python qa/v22201.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
NEW=[("sora","kyouon waon yoin"),("kaede","guren haisui sotosen"),("rin","yumi koma kime"),("luna","tsuki hoshi yozora"),("kuro","kodou douke denno"),("mio","saiteki kaiseki kaigan")]
ids=[f"ougi_{c}_{b}" for c,bs in NEW for b in bs.split()]
with sync_playwright() as p:
  b=p.chromium.launch()
  pg=b.new_page(viewport={"width":1280,"height":720});pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
  q=pg.evaluate
  # 奥義の絵：OUGI_ART に18本・12コマのシートが読める
  a=q("""async(ids)=>{const out={};for(const id of ids){const A=OUGI_ART[id];if(!A){out[id]='none';continue}
     const ok=async u=>await new Promise(r=>{const i=new Image();i.onload=()=>r(i.naturalWidth);i.onerror=()=>r(0);i.src=artURL(u)});
     const k=A.spr,S=k&&ART_SRC[k];out[id]=[await ok(A.cutin),await ok(A.cutin1),S?await ok(S.sheet):-1]}return out}""",ids)
  R["og"]=a
  for k,v in a.items():
    if v=="none" or v!=[1280,640,2688]:R["ng"].append(["og",k,v])
  # 奥義のカードがその絵を指す
  n=q("(ids)=>ids.filter(id=>Object.values(CARDS).some(c=>c.r==='OG'&&c.og===id)).length",ids)
  if n!=18:R["ng"].append(["og cards",n])
  # タイダウンベルト
  t=q("()=>[PARTS.p_night_harbor&&PARTS.p_night_harbor.n,PARTS.hook&&PARTS.hook.n]")
  R["part"]=t
  if t[0]!="タイダウンベルト" or t[1]!="牽引フック":R["ng"].append(["part",t])
  # スタッフロール（もう一度見る＝とばせる）
  c=q("""async()=>{const L=[];const b0=SND.bgm;SND.bgm=function(id){L.push(id);return b0.apply(this,arguments)};let done=0;
     showCredits(()=>{done=1},{replay:1});await new Promise(r=>setTimeout(r,800));const pg=document.querySelector('.crroot .crpage'),txt=pg?pg.textContent.trim().length:0,vis=(document.querySelector('.crskip')||{style:{}}).style.display!=='none';
     const sk=document.querySelector('.crskip');if(sk)sk.click();
     await new Promise(r=>setTimeout(r,3000));SND.bgm=b0;return [txt,done,L,0,vis]}""")
  R["credits"]=c
  if c[0]<2 or not c[1] or "credits" not in c[2] or not c[4]:R["ng"].append(["credits",c])
  # 朝のタイトル（ZERO を一度たおしたあと）
  m=q("""()=>{return [AUDIO&&AUDIO.BGM_IDS&&AUDIO.BGM_IDS.includes('title_morning'),typeof AUDIO.VERSION==='string'?AUDIO.VERSION:AUDIO.VERSION+'']}""")
  R["morning"]=m
  if not m[0] or str(m[1])<"0.39":R["ng"].append(["audio",m])
  # 敵の攻撃の形（formOf）
  f=q("()=>{const b0=B;const t=(k,e)=>{B={key:k};return formOf(e)};let r;try{r=[t('zero',{zf:0}),t('zero',{zf:1}),t('boss3',{phased:1}),t('kei',{})]}finally{B=b0}return r}")
  R["form"]=f
  if f!=[1,2,2,1]:R["ng"].append(["formOf",f])
  pg.close();b.close()
R["errs"]=errs[:5]
if errs:R["ng"].append(["errs",errs[:3]])
print(json.dumps(R,ensure_ascii=False))
