# ★v0.22.202 design 26-10（v0.11.162）：誇りの紅突＝パーフェクトのたびアタック全部 +1（5まで）・春のクルーズ＝エンジン耐久 +1（強化 +2）・帯 L。python qa/fuse22202.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={"width":1280,"height":720});pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
  q=pg.evaluate
  q("()=>{qaSetProgress({slot:1,nightMax:4,tutorial:true,chars:['HINA','MOMO','NANA']});OPTS.banter=false}")
  # 誇りの紅突：onPerf に atkAllAdd が積まれる
  r=q("""()=>{PRF().char='NANA';qaNewRun({mode:'MT',night:1});startBattleState('kei');B.hand=[inst('f_n_hokorikoutotsu')];B.rpm=1000;const n0=B.onPerf.length;playCard(0,false);return [n0,JSON.stringify(B.onPerf)]}""")
  R["hokori"]=r
  if r[0]!=0 or '"atkAllAdd",1,5' not in r[1]:R["ng"].append(["hokori",r])
  # 春のクルーズ：エンジン耐久 +1（強化 +2）
  h=q("""()=>{const out=[];for(const up of [0,1]){PRF().char='MOMO';qaNewRun({mode:'MT',night:1});startBattleState('kei');const c=inst('f_m_harucruise');if(up)c.up=1;B.hand=[c];B.rpm=4000;
     const hp=G.hp=Math.max(1,(G.maxhp||30)-10);playCard(0,false);out.push(G.hp-hp)}return out}""")
  R["haru"]=h
  if h!=[1,2]:R["ng"].append(["haru",h])
  d=q("()=>[descOf(inst('f_m_harucruise')),CARDS.f_m_harucruise.band]")
  R["haru_d"]=d
  if "エンジン耐久 +1" not in str(d[0]) or d[1]!="L":R["ng"].append(["haru d",d])
  pg.close();b.close()
R["errs"]=errs[:5]
if errs:R["ng"].append(["errs",errs[:3]])
print(json.dumps(R,ensure_ascii=False))
