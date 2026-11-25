# ★v0.22.144（裏道が5つめに入るのは前から＝分かれ道では4つまで） 分かれ道 +1（design 24-1）：NIGHT 2 から各エリアの真ん中の段（1/3〜2/3）に1つ足す・段の数は同じ・1段は4つまで・種類の割合はほかの真ん中の段と同じ・NIGHT 1 は今のまま・マスの数は1ランで約 +2.5（裏道が4つの段では入れかわるので +3 より少し少ない）・マップの画面で4つの段が重ならない。python qa/fork22144.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={"width":1280,"height":720});pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
  o=pg.evaluate("""()=>{qaSetProgress({slot:1,nightMax:3,tutorial:true});const out={};
   for(const nt of [1,2,3,4]){let forks=[],rows=0,max=0,bad=0,nodes=0,fk={},ot={},rowsOK=true;
    for(let i=0;i<300;i++){qaNewRun({mode:'MT',night:nt});const m=G.map;rows=m.length;
     AREAS.forEach((a,ai)=>{const rs=m.filter(r=>r[0].a===ai&&r[0].k!=='boss');if(rs.length!==a.rows)rowsOK=false;const f=rs.flat().filter(n=>n.fork);forks.push(f.length);
      const lo=Math.max(1,Math.ceil(a.rows/3)),hi=Math.min(a.rows-2,Math.floor(a.rows*2/3));
      f.forEach(n=>{if(n.r<lo||n.r>hi)bad++;fk[n.k]=(fk[n.k]||0)+1});rs.forEach((r,ri)=>{max=Math.max(max,r.filter(n=>n.k!=='hidden').length);if(ri>=lo&&ri<=hi)r.filter(n=>!n.fork&&n.k!=='hidden').forEach(n=>{ot[n.k]=(ot[n.k]||0)+1})});nodes+=rs.flat().length})}
    const avg=forks.reduce((s,x)=>s+x,0)/forks.length;out[nt]={avg,bad,max,rowsOK,nodes:nodes/300,fk,ot}}
   return out}""")
  R["o"]=o
  if o["1"]["avg"]!=0:R["ng"].append(["N1",o["1"]["avg"]])
  for nt in ["2","3","4"]:
    x=o[nt]
    if x["avg"]<0.97 or x["avg"]>1 or x["bad"] or x["max"]>4 or not x["rowsOK"]:R["ng"].append([nt,x])
    tf=sum(x["fk"].values());to=sum(x["ot"].values())
    for k in set(x["fk"])|set(x["ot"]):
      a=x["fk"].get(k,0)/tf;c=x["ot"].get(k,0)/to
      if abs(a-c)>0.06:R["ng"].append([nt,"ratio",k,round(a,3),round(c,3)])
    if x["nodes"]-o["1"]["nodes"]<2.0:R["ng"].append([nt,"nodes",x["nodes"],o["1"]["nodes"]])
  for vw,vh in [(667,375),(1280,720)]:
    pg.set_viewport_size({"width":vw,"height":vh})
    r=pg.evaluate("""async()=>{let fr=-1;for(let i=0;i<50&&fr<0;i++){qaNewRun({mode:'MT',night:2});fr=G.map.findIndex(r=>r.some(n=>n.fork)&&r.length===4)}if(fr<0)return null;G.row=fr;showMap();await new Promise(r=>setTimeout(r,300));
     const ns=[...document.querySelectorAll('#ui .node.now')].map(e=>e.getBoundingClientRect());let hit=0;for(let i=0;i<ns.length;i++)for(let j=i+1;j<ns.length;j++){const p=ns[i],q=ns[j];if(p.left<q.right-1&&q.left<p.right-1&&p.top<q.bottom-1&&q.top<p.bottom-1)hit++}return{n:ns.length,hit}}""")
    pg.screenshot(path=f"/tmp/fork_{vw}.png")
    if not r or r["hit"] or r["n"]!=4:R["ng"].append([vw,"map",r])
    R[str(vw)]=r
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False))
