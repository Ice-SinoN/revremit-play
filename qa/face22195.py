# ★v0.22.195 design 12-3 夜の顔 NIGHT 5〜11 の決まりを1つずつ。python qa/face22195.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={"width":1280,"height":720});pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
  q=pg.evaluate
  q("()=>{window.nightMaxAvail=()=>11;qaSetProgress({slot:1,nightMax:11,tutorial:true});OPTS.banter=false;PRF().modeHelp={MT:1,AT:1,CVT:1}}")  # β は BETA_NIGHTS=4 で止まる＝テストでは 11 まで
  r=q("""()=>{const out={};
   const cnt=(nt,N)=>{const k={},w={};let nodes=0,bw=0;for(let i=0;i<N;i++){qaNewRun({mode:'MT',night:nt});G.map.flat().forEach(n=>{k[n.k]=(k[n.k]||0)+1;nodes++;if(/^(battle|elite|hidden)$/.test(n.k)){w[n.wx]=(w[n.wx]||0)+1;bw++}})}
     const f=o=>Object.fromEntries(Object.entries(o).map(([a,b])=>[a,+(b/(a in k?nodes:bw)).toFixed(3)]));return{k:Object.fromEntries(Object.entries(k).map(([a,b])=>[a,+(b/nodes).toFixed(3)])),w:Object.fromEntries(Object.entries(w).map(([a,b])=>[a,+(b/bw).toFixed(3)]))}};
   for(const nt of [4,5,6,7,8,11])out['m'+nt]=cnt(nt,120);
   out.faces=[1,2,3,4,5,6,7,8,9,10,11].map(n=>nightFace(n)&&nightFace(n).n);
   // 影の夜
   qaNewRun({mode:'MT',night:6});G.ghostRec={char:'HINA',deck:[],result:'clear'};G.ghostP=1;try{ghostRoll(1);ghostRoll(2)}catch(e){out.gerr=String(e)}out.g6=[G.ghostDone,G.map.flat().filter(n=>n.ghost).length,ghostN()];
   qaNewRun({mode:'MT',night:5});G.ghostRec={char:'HINA',deck:[],result:'clear'};G.ghostP=1;try{ghostRoll(1);ghostRoll(2)}catch(e){}out.g5=[G.ghostDone,G.map.flat().filter(n=>n.ghost).length,ghostN()];
   // 港の夜
   qaNewRun({mode:'MT',night:9});out.h9=[heatGain({k:'elite',wx:'dry'}),heatGain({k:'battle',wx:'dry'})];qaNewRun({mode:'MT',night:8});out.h8=[heatGain({k:'elite',wx:'dry'}),heatGain({k:'battle',wx:'dry'})];
   return out}""")
  R.update(r)
  m4,m5,m7,m8,m11=r["m4"],r["m5"],r["m7"],r["m8"],r["m11"]
  if r["faces"][4:]!=["湾岸の夜","影の夜","嵐の夜","閉店の夜","港の夜","混線の夜","最後の夜"]:R["ng"].append(["名前",r["faces"]])
  if r["faces"][:4]!=["はじめての夜","雨の夜","霧の夜","雪の夜"]:R["ng"].append(["1〜4が変わった",r["faces"][:4]])
  if m5["w"].get("dawn",0)<0.3:R["ng"].append(["N5 夜明け",m5["w"]])
  if not(m8["k"].get("shop",0)<m7["k"].get("shop",1)*0.7 and m8["k"].get("lucky",0)>m7["k"].get("lucky",0)*1.2):R["ng"].append(["N8 ショップ・ラッキー",m7["k"],m8["k"]])
  w11=m11["w"]
  if len([x for x in ["dry","rain","snow","fog","dawn"] if 0.12<w11.get(x,0)<0.28])<5:R["ng"].append(["N11 天候",w11])
  if r["g6"][:2]!=[2,2] or r["g6"][2]!=4:R["ng"].append(["N6 ゴースト",r["g6"],r.get("gerr")])
  if r["g5"][:2]!=[1,1] or r["g5"][2]!=3:R["ng"].append(["N5 ゴースト",r["g5"]])
  if not(r["h9"][0]==r["h8"][0]+1 and r["h9"][1]==r["h8"][1]):R["ng"].append(["N9 ヒート",r["h9"],r["h8"]])
  # 嵐の夜：戦闘で3ターン目に変わる
  r=q("""async()=>{qaNewRun({mode:'MT',night:7});startBattleState('kei');B.e.hp=9999;B.e.maxhp=9999;const w0=B.wx,sw=B.stormWx;const seen=[];for(let i=0;i<3;i++){turnEnd();seen.push([B.pTurns,B.wx])}return{w0,sw,seen}}""")
  R["storm"]=r
  if not r["sw"] or r["sw"]==r["w0"] or r["seen"][0][1]!=r["w0"] or r["seen"][1][1]!=r["sw"]:R["ng"].append(["N7 嵐",r])
  # 混線の夜：敵の攻撃で混線が入る
  r=q("""()=>{qaNewRun({mode:'MT',night:10});let n=0,a=0;for(let i=0;i<40;i++){startBattleState('kei');B.e.pat=[['atk',1]];B.e.pi=0;const d0=B.draw.filter(c=>c.id==='crosstalk').length;enemyStep();a++;if(B.draw.filter(c=>c.id==='crosstalk').length>d0)n++}
     qaNewRun({mode:'MT',night:9});let m=0;for(let i=0;i<40;i++){startBattleState('kei');B.e.pat=[['atk',1]];B.e.pi=0;const d0=B.draw.filter(c=>c.id==='crosstalk').length;enemyStep();if(B.draw.filter(c=>c.id==='crosstalk').length>d0)m++}return[n,a,m]}""")
  R["jam"]=r
  if not(3<=r[0]<=20 and r[2]==0):R["ng"].append(["N10 混線",r])
  # 混線の夜：報酬の画面の合成のヒント
  r=q("""async()=>{const out={};for(const nt of [10,9]){qaNewRun({mode:'MT',night:nt});startBattleState('kei');enterBattle();await new Promise(r=>setTimeout(r,1500));B.e.hp=0;const w=finish('win');S.win=w;showWin(w);await new Promise(r=>setTimeout(r,800));const h=document.querySelector('#ui .fhint');out[nt]=h?h.textContent:null}return out}""")
  R["fhint"]=r
  if not(r.get("10") and "合成のヒント" in r["10"] and not r.get("9")):R["ng"].append(["N10 合成のヒント",r])
  # 最後の夜：エリアのボスは第2形態から（ほかの夜はちがう）
  r=q("""async()=>{const out={};for(const nt of [11,10]){qaNewRun({mode:'MT',night:nt});startBattleState('boss1');out[nt]=[B.wx2On||false,B.wx];startBattleState('boss3');out[nt].push(B.e.phased,B.wx2On||false,B.wx)}return out}""")
  R["p2"]=r
  if not(r["11"]==[True,"rain",True,True,"fog"] and r["10"]==[False,r["10"][1],False,False,r["10"][4]]):R["ng"].append(["N11 第2形態",r])
  pg.screenshot(path="/tmp/face22195.png")
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False))
