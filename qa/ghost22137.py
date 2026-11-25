# v0.22.137 ライバルのゴースト：記録から作る・エリア2/3 に 25%（1ランに1回）・マップの印・絵（反転・薄紫）・一言・報酬3つから1つ・続きから・runlog
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[],"errors":[]}
def ng(m):R["ng"].append(m)
REC="{at:1,char:'YUKI',mode:'MT',night:3,reach:{area:3,row:5},result:'clear',deck:[{id:'hakusen',up:1},{id:'hyouga',up:0},{id:'whiteout',up:1},{id:'braking',up:0},{id:'counter',up:1}],parts:[],stats:{maxHp:60,tune:{}},heatMax:3,ver:''}"
with sync_playwright() as p:
  b=p.chromium.launch()
  for (w,h,d) in [(640,360,2),(844,390,3),(1280,720,1)]:
    pg=b.new_page(viewport={"width":w,"height":h},device_scale_factor=d);errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    pg.evaluate("()=>{qaSetProgress({slot:1,nightMax:3,tutorial:true});PRF().modeHelp={MT:1,AT:1,CVT:1};OPTS.banter=false}")
    def run(js):return pg.evaluate("async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));"+js+"}")
    if w==640:
      e=run(f"""const R={{}};PRF().char='YUKI';newRunState('MT','YUKI',[],null,{{night:3,ghost:{REC}}});G.ghostP=0;ghostRoll(1);R.r1=G.map.flat().filter(n=>n.ghost).length;G.ghostP=1;ghostRoll(1);R.r1b=G.map.flat().filter(n=>n.ghost).length;ghostRoll(2);R.r2=G.map.flat().filter(n=>n.ghost).length;
        const D=G.ghostDef;R.def={{n:D.n,hp:D.hp,el:ENEMIES[AREAS[2].elite].hp,pat:D.pat,rage:D.rage,spd:D.spd}};
        newRunState('MT','YUKI',[],null,{{night:3}});G.ghostP=1;ghostRoll(1);R.none=G.map.flat().filter(n=>n.ghost).length;
        let k=0;for(let i=0;i<400;i++){{newRunState('MT','YUKI',[],null,{{night:3,ghost:{REC}}});ghostRoll(1);ghostRoll(2);if(G.map.flat().some(n=>n.ghost))k++}}R.p=k/400;return R""")
      R["eng"]=e
      if e["r1"]!=0 or e["r1b"]!=0 or e["r2"]!=1:ng(f"1回だけ・エリアごと1回の抽選 {e}")
      if e["none"]!=0:ng("記録なしで出た")
      if not (0.36<e["p"]<0.52):ng(f"割合 {e['p']}（2回で 0.44 くらい）")
      if e["def"]["rage"]!=1 or "ゴースト" not in e["def"]["n"]:ng(f"def {e['def']}")
    o=run(f"""PRF().char='YUKI';qaNewRun({{mode:'MT',night:3}});G.ghostRec={REC};G.ghostP=1;ghostRoll(1);const ai=1;G.row=G.map.findIndex(r=>r[0].a===ai);const r=G.map.findIndex(r=>r.some(n=>n.ghost));G.row=r;G.path=G.path||[];showMap();await w(300);
      const nd=document.querySelector('.node.ghost');const lab=nd&&nd.textContent;const j=G.map[r].findIndex(n=>n.ghost);G.path[r]=j;const key=nodeEnemy(G.map[r][j]);saveRun({{s:'battle',key,j}});startBattleState(key);enterBattle();await w(1200);
      const sp=SPR['ghost_YUKI'];return {{lab,key,set:A.E.set,frames:sp&&sp.frames.length,met:G.ghostMet,toast:[...document.querySelectorAll('.toast2')].map(e=>e.textContent).join('|'),name:B.e.n}}""")
    pg.screenshot(path=f"/tmp/wxs/ghost_{w}.png")
    if not o["lab"] or "ゴースト" not in o["lab"]:ng(f"{w}: マップの印 {o}")
    if o["key"]!="__ghost" or o["set"]!="ghost_YUKI" or not o["frames"]:ng(f"{w}: 絵 {o}")
    if not o["met"] or "前のあたし" not in o["toast"] and "全クリア" not in o["toast"]:ng(f"{w}: 出会った {o}")
    # 続きから
    c=run("ENEMIES.__ghost=undefined;delete ENEMIES.__ghost;continueRun();await w(800);return [window.SCREEN,B&&B.key,!!ENEMIES.__ghost]")
    if c[0]!="battle" or c[1]!="__ghost":ng(f"{w}: 続きから {c}")
    # 勝つ → 3つ → 強化ずみ
    g=run("B.e.hp=0;B.over=true;B.result='win';const m0=G.money,n0=G.deck.length;showWin();await w(400);const btn=[...document.querySelectorAll('.ghr')].map(e=>e.textContent);ghostPick('up');await w(200);const cards=document.querySelectorAll('.cdb,.cbig,[onclick^=\"takeCard\"]').length;takeCard(S.rewards[0]);await w(300);const last=G.deck[G.deck.length-1];return {btn,gold:G.money-m0,cards,added:G.deck.length-n0,up:!!last.up,won:G.ghostWon,scr:window.SCREEN}")
    if len(g["btn"])!=3 or g["gold"]<20 or g["added"]!=1 or not g["up"] or not g["won"]:ng(f"{w}: 報酬 {g}")
    p2=run("qaNewRun({mode:'MT',night:3});G.ghostRec="+REC+";G.ghostP=1;ghostRoll(1);startBattleState('__ghost');enterBattle();await w(300);B.e.hp=0;B.over=true;B.result='win';showWin();await w(300);ghostPick('part');await w(300);return [window.SCREEN,S.partOpts.every(p=>PARTS[p].own==='YUKI'||PARTS[p].own==='N'),S.partOpts.length]")
    if p2[0]!="parts" or not p2[1]:ng(f"{w}: パーツ {p2}")
    R["errors"]+=errs;pg.close()
print(json.dumps(R,ensure_ascii=False,indent=1))
