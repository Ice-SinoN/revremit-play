# ★v0.22.12 仲間で ROAD に入る一枚絵（opening_road_{hina,momo,nana}）。python qa/road2212.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={};errs=[]
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={"width":1280,"height":720});pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
  for ch,key in [("YUKI","op_road"),("HINA","op"),("MOMO","op"),("NANA","op")]:
    sk=key if ch=="YUKI" else ch.lower()+"_op"
    n=len(pg.evaluate(f"TEXT.scenes['{sk}'].lines"))
    pg.evaluate(f"()=>{{newRunState('MT','{ch}',[]);showScene('{sk}',()=>{{}})}}")
    seen=[]
    for i in range(n):
      pg.wait_for_timeout(120)
      seen.append(pg.evaluate("(()=>{const s=S.sc;if(!s)return'';let k=s.sc.bg;(s.sc.bgs||[]).forEach(([i,x])=>{if(s.i>=i)k=x});return storyBg(k).split('/').pop()})()"))
      pg.evaluate("()=>{if(S.sc&&S.sc.i<S.sc.sc.lines.length-1){clearInterval(S.sc.t);S.sc.i++;S.sc.shown=0;renderScene()}}")
    R[ch]=sorted(set(s for s in seen if s))
    pg.evaluate("()=>{S.sc.i=S.sc.sc.lines.length-1;renderScene()}");pg.wait_for_timeout(400);pg.screenshot(path=f"/tmp/road_{ch}.png")
    R[ch+"_bust"]=pg.evaluate("[...document.querySelectorAll('#ui img')].filter(i=>/bust/.test(i.className+i.src.slice(0,80))).length")
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False))
