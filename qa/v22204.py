# ★v0.22.204 ③v2.4・②v0.5.30・formOf の二重（敵の名前の横の「・1」）・futou_phase の二重・スタッフロールの道具の行・BUG-72（god・1速で止まる）。python qa/v22204.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={"width":1280,"height":720});pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
  q=pg.evaluate
  q("()=>{qaSetProgress({slot:1,nightMax:11,tutorial:true,chars:['HINA','MOMO','NANA','SORA','KAEDE','RIN','LUNA','KURO','MIO']});OPTS.banter=false}")
  # formOf は engine の形の名前（ふつうの敵は ""）。anim の上書きがない
  f=q("()=>{PRF().char='YUKI';qaNewRun({mode:'MT',night:1});startBattleState('kei');const a=formOf(B.e);startBattleState('boss3');const z=formOf(B.e);return [a,z,typeof atkForm,PARTS.p_night_harbor.n]}")
  R["form"]=f
  if f[0]!="" or f[1] not in ("剣","槍","盾") or f[2]!="function" or f[3]!="タイダウンベルト":R["ng"].append(["formOf",f])
  # futou_phase は1回
  n=q("()=>{const L=[];const s0=SND.se;SND.se=function(id){L.push(id);return s0.apply(this,arguments)};try{startBattleState('hb_boss');phaseSnd()}finally{SND.se=s0}return L.filter(x=>x==='futou_phase').length}")
  R["futou"]=n
  if n!=0:R["ng"].append(["futou_phase in phaseSnd",n])
  # スタッフロールの道具の行
  c=q("()=>CREDITS_TOOL_TXT.A")
  R["credits"]=c
  if "ElevenLabs" in c or "audio.js" not in c:R["ng"].append(["credits",c])
  # BUG-72：god・1速・臨界氷華＋ローテーションでもオートが進む
  st=q("""async()=>{PRF().char='YUKI';qaNewRun({mode:'MT',night:2});startBattleState('coupe');G.hp=G.maxhp=9999;B.hand=[inst('rinkai'),inst('pitsign')];B.draw=B.draw.slice(0,2);B.rpm=1000;B.gear=0;B.gas=5;
     const h0=B.e.hp;enterBattle();AUTO.on=true;AUTO.speed=4;await new Promise(r=>setTimeout(r,20000));AUTO.on=false;return [h0,B.e.hp,B.pTurns,B.over]}""")
  R["72"]=st
  if not (st[1]<st[0] or st[3]):R["ng"].append(["BUG-72",st])
  # ③ v2.4
  v=q("()=>[typeof ALLY3!=='undefined'&&ALLY3.VERSION||null,TEXT.cards&&TEXT.cards.l_dig1?TEXT.cards.l_dig1.d:(CARDS.l_dig1&&CARDS.l_dig1.d)]")
  R["a3"]=v
  if not v[1] or "×" in str(v[1]):R["ng"].append(["l_dig1",v])
  pg.close();b.close()
R["errs"]=errs[:5]
if errs:R["ng"].append(["errs",errs[:3]])
print(json.dumps(R,ensure_ascii=False))
