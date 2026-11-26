import sys,json  # ★v0.22.183 AD v1.40：とどめで画面が白いのは2コマまで
from playwright.sync_api import sync_playwright
H=sys.argv[1]
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={"width":1280,"height":720});pg.goto("file://"+H);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
  pg.evaluate("()=>{qaSetProgress({slot:1,nightMax:4,chars:['HINA','MOMO','NANA'],tutorial:true});PRF().modeHelp={MT:1,AT:1,CVT:1};OPTS.banter=false}")
  pg.evaluate("async()=>{PRF().char='HINA';qaNewRun({mode:'MT',night:2});startBattleState('kei');enterBattle();await new Promise(r=>setTimeout(r,2500));B.hand=[inst('h_og_rush')];B.gas=9;B.rpm=3000;B.gear=3;B.e.hp=999;renderBattle();await ensureSpr(['og_hina_zenkai']);window.__fl=[];(function f(){__fl.push(A.flash?Math.round((1-A.flash.t/A.flash.life)*100):0);if(__fl.length<400)requestAnimationFrame(f)})()}")
  pg.evaluate("()=>{try{doPlay(0,false)}catch(e){playCard(0,false)}}");pg.wait_for_timeout(5000)
  fl=pg.evaluate("()=>__fl");on=[x for x in fl if x>0];print(json.dumps({"ng":[] if 0<len(on)<=2 else ["白いコマ",len(on)],"on":on,"errors":[]}));b.close()
