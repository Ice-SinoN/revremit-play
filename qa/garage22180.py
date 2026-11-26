import sys,json  # ★v0.22.180 ガレージの見出しに空のかっこを出さない（AD 11-26）
from playwright.sync_api import sync_playwright
H=sys.argv[1];R={}
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={"width":1280,"height":720});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)));pg.goto("file://"+H);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
  pg.evaluate("()=>{qaSetProgress({slot:1,nightMax:4,chars:['HINA','MOMO','NANA'],tutorial:true});OPTS.banter=false;for(const c of ['YUKI','MOMO']){PRF().char=c;newRunState('MT',c,[],null,{night:1});SAVE.cur.profile.minicars.push(makeMinicar({rank:'A',total:900,ten:G.deck.slice(0,10)},[0,1,2,3,4],-1))}}")
  for m in [None,"MT","AT"]:
    pg.evaluate("m=>{S.flow=null;showMinicarGarage(m===null?undefined:m)}",m);pg.wait_for_timeout(300)
    R[str(m)]=pg.evaluate("()=>document.querySelector('#ui .hdr').textContent")
    if m=="MT":pg.screenshot(path="/tmp/v0.22.180_garage.png")
  pg.evaluate("()=>{S.flow={mode:''};showMinicarGarage('MT')}");pg.wait_for_timeout(300);R["flow"]=pg.evaluate("()=>document.querySelector('#ui .hdr').textContent")
  ng=[k for k,v in R.items() if "()" in v or "（）" in v]
  if R["MT"]!="ガレージ（MT）":ng.append("MT")
  print(json.dumps({"ng":ng,"r":R,"errors":errs},ensure_ascii=False));b.close()
