# ★v0.22.96 パーフェクト連続の画面。python qa/pchain2296.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
with sync_playwright() as p:
  b=p.chromium.launch()
  for vw,vh in [(1280,720),(844,390),(667,375)]:
    pg=b.new_page(viewport={"width":vw,"height":vh});pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    r=pg.evaluate("""async()=>{newRunState('MT','YUKI',[]);G.night=3;G.row=1;startBattleState('kei');enterBattle();B.gas=5;B.gear=0;B.e.next=999;B.e.hp=B.e.maxhp=999;
      const b=bandRange(),mid=Math.round((b.clo+b.chi)/2/100)*100;B.hand=[inst('hyouga'),inst('hyouga'),inst('hyouga'),inst('hakusen')];B.rpm=mid-costOf(B.hand[0]);renderBattle();
      S.sel=0;renderBattle();const lab1=[...document.querySelectorAll('.detail button')].map(x=>x.textContent);doPlay(0,true);await new Promise(r=>setTimeout(r,900));
      B.rpm=mid-costOf(B.hand[0]);B.gas=5;renderBattle();S.sel=0;renderBattle();const lab2=[...document.querySelectorAll('.detail button')].map(x=>x.textContent);
      doPlay(0,true);await new Promise(r=>setTimeout(r,350));
      const st=document.querySelector('#stage').getBoundingClientRect(),k=st.height/360;
      const fx=[...document.querySelectorAll('#fxd .fxt')].map(e=>{const q=e.getBoundingClientRect();return{t:e.textContent,l:(q.left-st.left)/k,r:(q.right-st.left)/k}});
      const pc=document.querySelector('#ui .pchain');const pq=pc&&pc.getBoundingClientRect();
      return{lab1,lab2,fx,pc:pc&&pc.textContent,pcBox:pq&&{l:(pq.left-st.left)/k,r:(pq.right-st.left)/k,t:(pq.top-st.top)/k},chain:B.perfChain,log:B.log.slice(-5)}}""")
    if not r["pc"] or "×2" not in r["pc"]: R["ng"].append([vw,"pchain",r])
    if not any("PERFECT ×2" in f["t"] for f in r["fx"]): R["ng"].append([vw,"fx",r])
    if not any("+0.4" in f["t"] and "ガソリン" in f["t"] for f in r["fx"]): R["ng"].append([vw,"gain",r])
    if any(f["l"]<0 or f["r"]>640 for f in r["fx"]): R["ng"].append([vw,"はみ出し",r])
    if not any("+0.4" in x for x in r["lab2"]): R["ng"].append([vw,"button",r])
    if vw==1280: R["r"]=r;pg.screenshot(path="/tmp/pc96.png")
    pg.close()
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False,indent=0))
