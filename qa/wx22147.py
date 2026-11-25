# ★v0.22.147 A2：ふつうのマス（戦闘・エリート）にも霧・夜明け。エリアごとの割合（WX_W：ストリート 霧15・夜明け10／峠 20・10／サーキット 5・20）・NIGHT 1 で夜の顔なし・ボスはドライ／ふつうの戦闘で霧＝予告が「？」・シフトで防御 +2・霧の背景／夜明け＝ガソリン +1・幕／得意（HINA 夜明け・NANA 霧）は★で悪い所なし／マップの札が読める色。python qa/wx22147.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={"width":1280,"height":720});pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
  o=pg.evaluate("""async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));qaSetProgress({slot:1,nightMax:3,chars:['HINA','MOMO','NANA'],tutorial:true});const p=PRF();p.stats=p.stats||{};p.stats.runs=9;const o={};
    const c={};let boss=0;for(let i=0;i<300;i++){newRunState('MT','YUKI',[],null,{night:1});G.map.flat().forEach(n=>{if(n.k==='boss'){if(n.wx!=='dry')boss++;return}if(!n.wx)return;const ak=AREAS[n.a].key;c[ak]=c[ak]||{};c[ak][n.wx]=(c[ak][n.wx]||0)+1})}
    o.pct={};for(const ak in c){const t=Object.values(c[ak]).reduce((a,b)=>a+b,0);o.pct[ak]={};for(const k in c[ak])o.pct[ak][k]=Math.round(c[ak][k]/t*1000)/10}o.boss=boss;
    const go=async(ch,wx)=>{p.char=ch;qaNewRun({mode:'MT',night:1});const row=G.map[G.row],j=row.findIndex(n=>n.k==='battle');row[j].wx=wx;G.path[G.row]=j;startBattleState(nodeEnemy(row[j]));enterBattle();await w(900)};
    await go('YUKI','fog');o.fog={wx:B.wx,proc:A.wxProc,q:document.body.innerText.includes('？'),base:!!A.wxBase};const b0=B.block;onShiftUp('good');o.fog.blk=B.block-b0;
    await go('YUKI','dawn');o.dawn={wx:B.wx,proc:A.wxProc,gas:B.gas,max:maxGas()};
    await go('NANA','fog');o.nanaFav=wxFav('fog');await go('HINA','dawn');o.hinaFav=wxFav('dawn');
    qaNewRun({mode:'MT',night:1});G.map[G.row].forEach((n,j)=>{if(/battle|elite/.test(n.k))n.wx=j%2?'fog':'dawn'});showMap();await w(300);
    o.tags=[...document.querySelectorAll('.node .wxt')].map(e=>[e.textContent,getComputedStyle(e).color]);return o}""")
  R["o"]=o
  W={"street":(15,10),"touge":(20,10),"circuit":(5,20)}
  for ak,(f,d) in W.items():
    x=o["pct"].get(ak,{})
    if abs(x.get("fog",0)-f)>5 or abs(x.get("dawn",0)-d)>5:R["ng"].append([ak,x])
  if o["boss"]:R["ng"].append(["boss",o["boss"]])
  if o["fog"]["wx"]!="fog" or o["fog"]["proc"]!="fog" or o["fog"]["blk"]<2:R["ng"].append(["fog",o["fog"]])
  if o["dawn"]["wx"]!="dawn" or o["dawn"]["proc"]!="dawn":R["ng"].append(["dawn",o["dawn"]])
  if not o["nanaFav"] or not o["hinaFav"]:R["ng"].append(["fav",o["nanaFav"],o["hinaFav"]])
  ft=[x for x in o["tags"] if x[0].startswith(("霧","夜明け"))]
  if not ft or any(c=="rgb(207, 227, 255)" for t,c in ft):R["ng"].append(["tags",o["tags"]])
  pg.screenshot(path="/tmp/wx147_map.png");b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False))
