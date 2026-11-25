# ★v0.22.24 説明の窓：打つボタン・予告は固定、長い説明の文だけスクロール。いちばん長い説明＋強化で確かめる。python qa/det2224.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
with sync_playwright() as p:
  b=p.chromium.launch()
  for vw,vh in [(1920,1080),(1280,720),(1536,864),(844,390),(667,375),(2560,1440),(1366,768)]:
    pg=b.new_page(viewport={"width":vw,"height":vh});pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    if vw==1280:R["longest"]=pg.evaluate("()=>Object.keys(CARDS).map(id=>{const c=inst(id,true);return[id,CARDS[id].own,[...descOf(c,true,7)].length]}).sort((a,b)=>b[2]-a[2]).slice(0,6)")
    longest=pg.evaluate("()=>Object.keys(CARDS).filter(id=>['YUKI','NANA','HINA','MOMO','N'].includes(CARDS[id].own)).map(id=>[id,CARDS[id].own,[...descOf(inst(id,true),true,7)].length]).sort((a,b)=>b[2]-a[2]).slice(0,4)")
    cases=[("NANA","n_taikan",2,"MT"),("NANA","n_taikan",7,"MT"),("NANA","n_taikan",2,"AT")]+[(o if o!="N" else "YUKI",i,2,"MT") for i,o,_ in longest]
    for ch,id,gear,mode in cases:
      r=pg.evaluate(f"""()=>{{newRunState('{mode}','{ch}',[]);G.row=1;startBattleState('kei');enterBattle();B.gas=9;B.gear={gear};B.rpm=1000;B.hand=[inst('{id}',true),inst('hyouga'),inst('slip')];S.sel=0;renderBattle();
        const d=document.querySelector('.detail');if(!d)return null;const r=d.getBoundingClientRect(),st=document.querySelector('#stage').getBoundingClientRect(),k=st.height/360;
        const btn=[...d.querySelectorAll('button')].map(x=>x.getBoundingClientRect()),tx=d.querySelector('.dtx');
        const pv=[...d.children].filter(x=>!x.matches('button,.dtx')).map(x=>x.getBoundingClientRect());
        const inside=q=>q.top>=r.top-0.5&&q.bottom<=r.bottom+0.5&&q.height>4;
        const bars=[...document.querySelectorAll('.barn')].map(x=>x.getBoundingClientRect());
        return{{n:btn.length,btnIn:btn.every(inside),pvIn:pv.every(inside),txScroll:tx.scrollHeight>tx.clientHeight+1,txH:tx.clientHeight/k,
          hitN:bars.some(q=>q.top<r.bottom&&q.bottom>r.top+0.5&&q.left<r.right&&q.right>r.left),hitBar:r.top<st.top+(RES.bars.y+4)*k-0.5}}}}""")
      if not r or not r["btnIn"] or not r["pvIn"] or r["hitN"] or r["hitBar"] or r["n"]<1:R["ng"].append([vw,ch,id,gear,mode,r])
      if vw==1280:R.setdefault("c1280",[]).append([ch,id,gear,mode,r])
      if vw in(1280,844) and id in("n_taikan",longest[0][0]) and gear==2 and mode=="MT":pg.screenshot(path=f"/tmp/det_{vw}_{id}.png")
    pg.close()
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False))
