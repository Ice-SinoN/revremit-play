# ★v0.22.148 BUG-61：マップの1段は4つまで（裏道を入れても）・真ん中の段のショップ／シムは残る・裏道の出る割合は前と同じくらい。python qa/bug61.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page();pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
  o=pg.evaluate("""()=>{qaSetProgress({slot:1,nightMax:3,tutorial:true});const o={};for(const nt of [1,2,4]){let five=0,hid=0,midNo=0,runs=500;
    for(let i=0;i<runs;i++){newRunState('MT','YUKI',[],null,{night:nt,hidden:true});G.map.forEach(r=>{if(r.length>4)five++;if(r.some(n=>n.k==='hidden'))hid++});AREAS.forEach((a,ai)=>{const r=G.map.find(r=>r[0].a===ai&&r[0].r===a.mid);if(r&&!r.some(n=>n.k==='shop'||n.k==='sim'))midNo++})}
    o[nt]={five,hidPerRun:Math.round(hid/runs*100)/100,midNo}}return o}""")
  R["o"]=o
  for k,v in o.items():
    if v["five"] or v["midNo"]:R["ng"].append([k,v])
    if not (0.85<=v["hidPerRun"]<=1.25):R["ng"].append([k,"hidden",v["hidPerRun"]])
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False))
