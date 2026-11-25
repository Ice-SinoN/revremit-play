# ★v0.22.160 design 24-10 で本の形は winHeal 0（回復なし・字も出ない）。仕組みはこのテストの中で 0.01 にして見る。★v0.22.153 勝つと回復（design 24-6）：勝つたびヒートの段 ×1% の最大耐久を回復（そのときの段＝勝つ前）・エリート／裏道／ゴーストも・ボス（連戦のボスも）はなし・最大をこえない・ヒート 0 はなし／報酬の画面に「熱 +n」・炎の下（マップは左）に「勝つと回復 +n%」・ヒートの説明の1行。python qa/heal22153.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={"width":1280,"height":720});pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
  o=pg.evaluate("""async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));qaSetProgress({slot:1,nightMax:3,chars:['HINA'],tutorial:true});PRF().modeHelp={MT:1,AT:1,CVT:1};OPTS.banter=false;const o={};o.def=RULES.heat.winHeal;qaNewRun({mode:'MT',night:2});startBattleState('kei');G.heat=5;G.hp=10;B.e.hp=0;o.off=winRewards().heal;G.heat=3;showMap();await w(200);o.offShow=!!document.querySelector('.heathl');RULES.heat.winHeal=0.01;
    const win=(k,h,hp)=>{startBattleState(k);G.heat=h;G.hp=hp;B.e.hp=0;const r=winRewards();return [r.heal,G.hp]};
    qaNewRun({mode:'MT',night:2});const M=G.maxhp;o.M=M;
    o.h5=win('kei',5,10);o.h0=win('kei',0,10);o.h2=win(AREAS[0].elite,2,10);o.full=win('kei',5,M-1);o.boss=win('boss1',5,10);
    PRF().char='HINA';qaNewRun({mode:'MT',night:2});o.ally=win('kuuten',5,10);
    qaNewRun({mode:'MT',night:2});G.heat=3;G.hp=20;startBattleState('kei');enterBattle();await w(1200);o.bt=(document.querySelector('.heathl')||{}).textContent;B.e.hp=0;showWin();await w(500);o.gain=(document.querySelector('.gain')||{}).innerText||'';
    showMap();await w(300);o.mp=(document.querySelector('.heathl')||{}).textContent;o.line=heatLine();G.heat=0;showMap();await w(200);o.mp0=!!document.querySelector('.heathl');return o}""")
  R["o"]=o;M=o["M"];r=lambda x:int(x+0.5)
  if o["def"]!=0 or o["off"]!=0 or o["offShow"]:R["ng"].append(["off",o["def"],o["off"],o["offShow"]])
  if o["h5"]!=[r(M*0.05),10+r(M*0.05)]:R["ng"].append(["h5",o["h5"]])
  if o["h0"][0]!=0:R["ng"].append(["h0",o["h0"]])
  if o["h2"][0]!=r(M*0.02):R["ng"].append(["elite",o["h2"]])
  if o["full"]!=[1,M]:R["ng"].append(["full",o["full"]])
  if o["boss"][0]!=0 or o["ally"][0]!=0:R["ng"].append(["boss",o["boss"],o["ally"]])
  if o["bt"]!="勝つと回復 +3%" or "熱 +" not in o["gain"] or o["mp"]!="勝つと回復 +4%" or "勝つと回復 +4%" not in o["line"] or o["mp0"]:R["ng"].append(["show",o])
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False))
