# ★v0.22.16 BUG-36（リザルトのショーケース）・BUG-37（ガレージ）の長い名前。python qa/case2216.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={};errs=[]
CHK="""(sel)=>{const out=[];document.querySelectorAll(sel).forEach(b=>{const r=b.getBoundingClientRect();b.querySelectorAll('*').forEach(e=>{const q=e.getBoundingClientRect();if(!q.width)return;
  const st=getComputedStyle(e);if(q.right>r.right+1||q.bottom>r.bottom+1)out.push('out:'+e.textContent.slice(0,12))})});return out}"""
with sync_playwright() as p:
  b=p.chromium.launch()
  for vw,vh in [(1280,720),(844,390)]:
    pg=b.new_page(viewport={"width":vw,"height":vh});pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    pg.evaluate("()=>{newRunState('MT','NANA',[]);G.parts=['dogmt','spike','launch','studless','n_paddleshifter'].filter(x=>PARTS[x]);const ids=Object.keys(CARDS).sort((a,b)=>CARDS[b].n.length-CARDS[a].n.length).slice(0,12);G.deck=ids.map(id=>({id,up:true,uid:Math.random()}));G.row=20;showResult(true)}")
    pg.wait_for_timeout(800)
    pg.evaluate("()=>{const s=document.querySelector('#scroot, .scroot');if(window.SCREEN==='scene'){showResult(true)}}");pg.wait_for_timeout(500)
    R[f"{vw}_result_screen"]=pg.evaluate("window.SCREEN")
    R[f"{vw}_result"]=pg.evaluate(CHK,".case")
    pg.screenshot(path=f"/tmp/case_{vw}.png")
    pg.evaluate("()=>{const ids=Object.keys(CARDS).sort((a,b)=>CARDS[b].n.length-CARDS[a].n.length);saveMinicars([0,1,2].map(i=>({v:2,id:'t'+i,rank:'S',mode:'MT',clear:true,cards:ids.slice(i*2,i*2+3).map(id=>({id,up:true})),part:'dogmt',at:Date.now()})));showMinicarGarage('view')}")
    pg.wait_for_timeout(400)
    R[f"{vw}_garage"]=pg.evaluate(CHK,".mc")
    pg.screenshot(path=f"/tmp/garage_{vw}.png")
    pg.close()
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False))
