# ★v0.22.14 BUG-33・34・35・39・40 とデッキの効果の窓の見た目。python qa/vl2214.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={};errs=[]
VIS="""(n)=>{const cs=[...document.querySelectorAll('#ui .cs')];const out=[];
 cs.forEach((c,i)=>{const nx=cs[i+1];const ca=c.querySelector('.ca').getBoundingClientRect();
  if(nx){const b=nx.getBoundingClientRect();if(ca.right>b.left+0.5)out.push('G'+i)}
  const cn=c.querySelector('.cn');if(nx&&cn){const r=cn.getBoundingClientRect(),b=nx.getBoundingClientRect();if(r.right>b.left+0.5)out.push('N'+i)}});return out}"""
with sync_playwright() as p:
  b=p.chromium.launch()
  for vw,vh in [(1280,720),(844,390)]:
    pg=b.new_page(viewport={"width":vw,"height":vh});pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    # BUG-33
    pg.evaluate("()=>{qaSetProgress({chars:['HINA','MOMO','NANA']});showChars()}");pg.wait_for_timeout(300)
    R[f"{vw}_chars"]=pg.evaluate("""(()=>{const st=document.querySelector('#stage').getBoundingClientRect();return [...document.querySelectorAll('#ui *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&(r.right>st.right+1||r.bottom>st.bottom+1||r.left<st.left-1)}).length})()""")
    pg.screenshot(path=f"/tmp/vl_chars_{vw}.png")
    # BUG-34・35
    for ch,n,ids in [("HINA",7,None),("HINA",10,None),("NANA",5,"n_phoenix"),("YUKI",10,None)]:
      pg.evaluate(f"()=>{{newRunState('MT','{ch}',[]);G.row=1;startBattleState('van');enterBattle();const all=G.deck.slice();while(B.hand.length<{n})B.hand.push(all[B.hand.length%all.length]);{'B.hand[1]=Object.assign({},B.hand[1],{id:\"'+ids+'\",up:true});' if ids else ''}S.sel=-1;renderBattle()}}")
      pg.wait_for_timeout(200)
      R[f"{vw}_{ch}{n}"]=pg.evaluate(VIS)
      R[f"{vw}_{ch}{n}_clip"]=pg.evaluate("[...document.querySelectorAll('#ui .cs .cn')].filter((e,i,a)=>e.scrollHeight>e.clientHeight+1).map(e=>e.textContent)")
      pg.screenshot(path=f"/tmp/vl_hand_{ch}{n}_{vw}.png")
    pg.evaluate("()=>{S.sel=1;renderBattle()}");pg.wait_for_timeout(200);pg.screenshot(path=f"/tmp/vl_detail_{vw}.png")
    R[f"{vw}_bug39"]=pg.evaluate("document.querySelector('.detail .dn').innerText")
    pg.close()
  # BUG-40（全画面の要素がある間は「全画面」を出す）
  pg=b.new_page(viewport={"width":1280,"height":720});pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
  R["fs_before"]=pg.evaluate("FS_OK()");pg.evaluate("()=>document.documentElement.requestFullscreen()")
  pg.wait_for_timeout(500);R["fs_in"]=pg.evaluate("[isFS(),FS_OK()]")
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False))
