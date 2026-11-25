# ★v0.22.17 BUG-42：ガレージがいっぱいのときの「手放す1台」画面で、全部の行が枠の中・押せるか。python qa/rel2217.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={};errs=[]
with sync_playwright() as p:
  b=p.chromium.launch()
  for vw,vh in [(1280,720),(844,390)]:
    pg=b.new_page(viewport={"width":vw,"height":vh});pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    pg.evaluate("()=>{const ids=Object.keys(CARDS).filter(k=>!CARDS[k].gen&&CARDS[k].r!=='SK').sort((a,b)=>CARDS[b].n.length-CARDS[a].n.length);const a=[];for(let i=0;i<60;i++)a.push({v:2,id:'t'+i,rank:'S',mode:'MT',clear:true,cards:ids.slice(i%10,i%10+3).map(id=>({id,up:true})),part:'dogmt',at:Date.now()-i});saveMinicars(a);const m=Object.assign({},a[0],{id:'new'});showReleaseMinicar(loadMinicars(),m)}")
    pg.wait_for_timeout(400)
    R[f"{vw}"]=pg.evaluate("""(()=>{const box=document.querySelector('#rll').getBoundingClientRect();const out=[];document.querySelectorAll('#rll .mc').forEach((e,i)=>{const r=e.getBoundingClientRect();if(r.right>box.right+1||r.left<box.left-1)out.push(i)});return{n:document.querySelectorAll('#rll .mc').length,out}})()""")
    pg.screenshot(path=f"/tmp/rel_{vw}.png")
    # 右の列をタップ
    pg.click("#rll .mc:nth-child(2)");pg.wait_for_timeout(200)
    R[f"{vw}_tap"]=pg.evaluate("S.relSel")
    pg.close()
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False))
