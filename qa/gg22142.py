# ★v0.22.142 C7：ゴーストの「ときどきグリッチ」。ゴーストの戦闘だけ・2.6秒に約0.24秒・色ずれ（強い）なし・ふつうのエリートと零号の強いグリッチは今のまま。python qa/gg22142.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
REC="{at:1,char:'YUKI',mode:'MT',night:3,reach:{area:3,row:5},result:'clear',deck:[{id:'hakusen',up:1},{id:'hyouga',up:0},{id:'whiteout',up:1},{id:'braking',up:0},{id:'counter',up:1}],parts:[],stats:{maxHp:60,tune:{}},heatMax:3,ver:''}"
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={"width":1280,"height":720});pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
  pg.evaluate("()=>{qaSetProgress({slot:1,nightMax:3,tutorial:true});PRF().modeHelp={MT:1,AT:1,CVT:1};OPTS.banter=false}")
  o=pg.evaluate("""async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));const o={};
    qaNewRun({mode:'MT',night:3});G.ghostRec="""+REC+""";G.ghostP=1;ghostRoll(1);startBattleState('__ghost');enterBattle();await w(800);
    let on=0,n=0;const t0=performance.now();while(performance.now()-t0<5300){n++;if(ghostGlitchNow())on++;await w(20)}o.ratio=on/n;o.strongOff=A.E.glitch||0;
    let shot=0;for(let i=0;i<400&&!ghostGlitchNow();i++)await w(10);o.caught=ghostGlitchNow();
    startBattleState(AREAS[1].elite);enterBattle();await w(500);let e2=0;for(let i=0;i<60;i++){if(ghostGlitchNow())e2++;await w(50)}o.elite=e2;return o}""")
  R["o"]=o
  if not(0.05<=o["ratio"]<=0.15):R["ng"].append(["ratio",o["ratio"]])
  if o["strongOff"]:R["ng"].append(["strong",o["strongOff"]])
  if o["elite"]:R["ng"].append(["elite",o["elite"]])
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False))
