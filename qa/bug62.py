# ★v0.22.175 BUG-62：霧の夜（N3）のマップで、夜霧の雲が見出し（「霧の夜」まで）・天候の1行・マスの名前を隠さない（文字 小中大 × 段のはじめ／なか × 2サイズ）。霧の得の1行はカットインの上に出ない。python qa/bug62.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
with sync_playwright() as p:
  b=p.chromium.launch()
  for vw,vh in [(667,375),(1280,720)]:
    pg=b.new_page(viewport={"width":vw,"height":vh});pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    o=pg.evaluate("""async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));qaSetProgress({slot:1,nightMax:4,tutorial:true});PRF().modeHelp={MT:1,AT:1,CVT:1};OPTS.banter=false;const o={};
      const top=el=>{if(!el)return 0;const r=el.getBoundingClientRect();const rg=document.createRange();rg.selectNodeContents(el);const q=[...rg.getClientRects()];let bad=0;for(const c of q){for(const fx of [0.2,0.5,0.8]){const x=c.left+c.width*fx,y=c.top+c.height/2;const t=document.elementFromPoint(x,y);if(t&&t.closest&&t.closest('.yogiri'))bad++}}return bad};
      for(const fz of ['s','m','l'])for(const rw of [0,2,5]){OPTS.fsz=fz;qaNewRun({mode:'MT',night:3});G.row=rw;showMap();try{fsAll()}catch(e){};await w(150);
        const k=fz+rw;o[k]={h:top(document.querySelector('#ui > .h')),leg:top(document.querySelector('#ui > .wxleg')),lab:[...document.querySelectorAll('#ui > .node')].map(n=>top(n.querySelector('.nl')||n)).reduce((a,b)=>a+b,0),yg:!!document.querySelector('.yogiri')}}
      OPTS.fsz='m';qaNewRun({mode:'MT',night:3});startBattleState('kei');enterBattle();await w(1200);wxBlkNote(2);renderBattle();ogCutShow(OUGI_ART.ougi_yuki_kousetsu,CARDS.y_og_red,{},false);await w(100);o.note=document.querySelectorAll('#ui .drvnote').length;ogCutHide();return o}""")
    R[str(vw)]=o
    for k,v in o.items():
      if k=="note":
        if v:R["ng"].append([vw,"note",v])
        continue
      if v["h"] or v["leg"] or v["lab"]:R["ng"].append([vw,k,v])
    pg.close()
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False))
