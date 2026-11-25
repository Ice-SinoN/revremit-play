# ★v0.22.150 A1 ゴーストの守り（design 10-17-2）：HINA＝最初の2ターン受けるダメージ半分／NANA＝3回動くごとに防御 +6／YUKI（仮）＝体力半分で1回 防御 +12／MOMO（仮）＝打たれたカードの枚数だけ防御（最大 6）。特徴の行に出る。python qa/gguard22150.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
def rec(ch):return "{at:1,char:'%s',mode:'MT',night:2,reach:{area:2,row:5},result:'lose',deck:[{id:'hakusen',up:1},{id:'hyouga',up:0},{id:'braking',up:0}],parts:[],stats:{maxHp:60,tune:{}},heatMax:1,ver:''}"%ch
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page();pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
  pg.evaluate("()=>{qaSetProgress({slot:1,nightMax:3,chars:['HINA','MOMO','NANA'],tutorial:true});OPTS.banter=false}")
  o={}
  for ch in ["HINA","NANA","YUKI","MOMO"]:
    o[ch]=pg.evaluate("""()=>{const R={};qaNewRun({mode:'MT',night:2});G.ghostRec=%s;G.ghostP=1;ghostRoll(1);startBattleState('__ghost');const e=B.e;R.gg=e.gg&&e.gg.k;R.gim=e.gimTxt;
      const h0=e.hp;B.pTurns=0;hitEnemy(20);R.t0=h0-e.hp;B.pTurns=2;const h1=e.hp;hitEnemy(20);R.t2=h1-e.hp;
      const bl=[];e.hp=e.maxhp;e.gLow=0;e.gAct=0;for(let i=0;i<3;i++){B.cards=i===0?9:3;B.over=false;enemyStep();bl.push(e.block)}R.bl=bl;e.hp=Math.floor(e.maxhp*0.4);B.cards=0;enemyStep();R.low=e.block;enemyStep();R.low2=e.block;return R}"""%rec(ch))
  R["o"]=o
  H,N,Y,M=o["HINA"],o["NANA"],o["YUKI"],o["MOMO"]
  if not(H["gg"]=="half" and H["t0"]==10 and H["t2"]==20):R["ng"].append(["HINA",H])
  if not(N["gg"]=="nth" and N["bl"][2]>=6 and N["bl"][0]<6):R["ng"].append(["NANA",N])
  if not(Y["gg"]=="low" and Y["low"]>=12 and Y["low2"]<12 and Y["t0"]==20):R["ng"].append(["YUKI",Y])
  if not(M["gg"]=="chain" and M["bl"][0]>=6 and M["low"]<6):R["ng"].append(["MOMO",M])
  for ch,x in o.items():
    if "／" not in (x["gim"] or ""):R["ng"].append([ch,"gim",x["gim"]])
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False))
