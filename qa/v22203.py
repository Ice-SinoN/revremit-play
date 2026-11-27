# ★v0.22.203 オートの行き止まり（bot_idle・②v0.5.28）・スタッフロール案A・text v0.22.78（29-7 の1行）・audio v0.40・BUG-71（ツリーの段の下の行）。python qa/v22203.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={"width":1280,"height":720});pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
  q=pg.evaluate
  q("()=>{qaSetProgress({slot:1,nightMax:11,tutorial:true,chars:['HINA','MOMO','NANA','SORA','KAEDE','RIN','LUNA','KURO','MIO']});OPTS.banter=false}")
  # ①の AUTOBOT：打てないカード＋ローテーションだけでも、終えるだけを3回続けない（②の手当てを外して見る）
  r=q("""()=>{PRF().char='YUKI';qaNewRun({mode:'MT',night:2});startBattleState('coupe');G.hp=G.maxhp=9999;B.hand=[inst('rinkai'),inst('pitsign')];B.draw=B.draw.slice(0,2);B.rpm=1000;B.gear=0;B.gas=5;
    const f=AUTOBOT.battle;const base=f.__orig||f;let seq=[];
    for(let t=0;t<6&&!B.over;t++){B.cards=0;B.pTurns=(B.pTurns||0)+1;const a=(typeof AUTOBOT.__base==='function'?AUTOBOT.__base:f).call(AUTOBOT,'smart');seq.push(a&&a.t);if(a&&a.t!=='end')break}
    return [seq,typeof B.botIdle]}""")
  R["idle"]=r
  if r[0].count("end")>2:R["ng"].append(["bot idle",r])
  src=q("()=>AUTOBOT.battle.toString().includes('botIdle')||String(window.__botsrc||'')")
  # 文
  t=q("()=>[CREDITS_TOOLS,TEXT.banter&&TEXT.banter.banter_momo_nana_low_2?TEXT.banter.banter_momo_nana_low_2[1]:JSON.stringify(TEXT).match(/その笑顔、信じますわよ。[^\"]*/)[0],AUDIO.VERSION,typeof AUDIO._lab.BGMVOL]")
  R["text"]=t
  if t[0]!="A" or "無理だけは" not in t[1] or t[2]<"0.40" or t[3]!="object":R["ng"].append(["text/audio",t])
  # BUG-71：文字「大」でツリーの段の下の行が枠の中
  w=q("""async()=>{OPTS.fsz='l';const out={};for(const ch of Object.keys(TREE)){PRF().char=ch;showTree();await new Promise(r=>setTimeout(r,200));let worst=-99;
    document.querySelectorAll('#ui .tnode').forEach(n=>{const c=n.querySelector('.tnc');if(c)worst=Math.max(worst,c.getBoundingClientRect().bottom-n.getBoundingClientRect().bottom)});out[ch]=Math.round(worst)}OPTS.fsz='m';return out}""")
  R["71"]=w
  if any(v>0 for v in w.values()):R["ng"].append(["BUG-71",w])
  # ② v0.5.28 の夜の顔 1〜4
  n=q("()=>typeof NIGHT_FACE!=='undefined'&&NIGHT_FACE[1]?NIGHT_FACE[1].n:null")
  R["nface"]=n
  if n!="はじめての夜":R["ng"].append(["nface",n])
  pg.close();b.close()
R["errs"]=errs[:5]
if errs:R["ng"].append(["errs",errs[:3]])
print(json.dumps(R,ensure_ascii=False))
