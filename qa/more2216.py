# ★v0.22.16 BUG-41：デッキの効果の窓で、入りきらないときに「▼ つづき」が出て、下まで動かすと消えるか。python qa/more2216.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[],"overflowPairs":0};errs=[]
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={"width":1280,"height":720});pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
  for ch in ["YUKI","HINA","MOMO","NANA"]:
    pg.evaluate(f"()=>{{qaSetProgress({{cards:'all',chars:['HINA','MOMO','NANA']}});PRF().char='{ch}';S.deck=null;S.dkSel=S.dkCmp=null;showDeck()}}")
    ids=pg.evaluate("deckPool(curChar()).sort((a,b)=>descOf(b,false,0).length-descOf(a,false,0).length).slice(0,8)")
    for a in ids:
      for c in ids[:4]:
        if a==c:continue
        r=pg.evaluate(f"()=>{{S.dkSel=null;S.dkCmp=null;deckPick('{c}');deckPick('{a}');const d=document.querySelector('.dkdet'),m=document.querySelector('.dkmore');const ov=d.scrollHeight>d.clientHeight+2,on=m.classList.contains('on');d.scrollTop=d.scrollHeight;d.dispatchEvent(new Event('scroll'));return[ov,on,m.classList.contains('on')]}}")
        if r[0]:R["overflowPairs"]+=1
        if r[0]!=r[1] or r[2]:R["ng"].append([ch,c,a,r])
  pg.evaluate("()=>{S.dkSel=null;S.dkCmp=null;const ids=deckPool(curChar()).sort((a,b)=>descOf(b,false,0).length-descOf(a,false,0).length);deckPick(ids[1]);deckPick(ids[0])}");pg.wait_for_timeout(200);pg.screenshot(path="/tmp/more.png")
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False))
