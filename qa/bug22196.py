# ★v0.22.196 BUG-64（「シフトで打つ」の札の字が欠ける）・BUG-65（Esc で「◀ もどる」の画面から戻れない）・BUG-66（844×390 で最初の枠がフルオート周回）と、NIGHT 5 からのボスのあとの回復 10%（design 26-3 ①）。python qa/bug22196.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
with sync_playwright() as p:
  b=p.chromium.launch()
  # BUG-66
  for vw,vh in [(844,390),(915,412),(1280,720),(667,375)]:
    pg=b.new_page(viewport={"width":vw,"height":vh});pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    for i in range(2):
      pg.keyboard.press("Enter");pg.wait_for_timeout(300)
      if pg.evaluate("()=>document.getElementById('modal').children.length"):break
    c=pg.evaluate("()=>KEYS.cur&&KEYS.cur.getAttribute('onclick')")
    R[f"66_{vw}"]=c
    if c!="farmChoiceSelf()":R["ng"].append(["BUG-66",vw,c])
    pg.close()
  pg=b.new_page(viewport={"width":1280,"height":720});pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
  q=pg.evaluate
  q("()=>{window.nightMaxAvail=()=>11;qaSetProgress({slot:1,nightMax:4,tutorial:true,chars:['HINA','MOMO','NANA']});OPTS.banter=false;PRF().modeHelp={MT:1,AT:1,CVT:1}}")
  # BUG-65：ハブ・デッキ・図鑑・キャラえらび・準備で Esc
  res={}
  for name,js in [("hub","showHub()"),("deck","showDeck()"),("codex","showCodex('card','title')"),("chars","startFlow()")]:
    q(f"async()=>{{closeModal();showTitle();await new Promise(r=>setTimeout(r,200));{js};await new Promise(r=>setTimeout(r,500));if(document.getElementById('modal').children.length){{const b=[...document.querySelectorAll('#modal [onclick]')].find(e=>/farmChoiceSelf/.test(e.getAttribute('onclick')));if(b)b.click()}}await new Promise(r=>setTimeout(r,400))}}")
    s0=q("()=>window.SCREEN+'|'+(document.querySelector('#rr2v')&&getComputedStyle(document.querySelector('#rr2v')).display)")
    pg.keyboard.press("ArrowDown");pg.keyboard.press("Escape");pg.wait_for_timeout(500)
    s1=q("()=>window.SCREEN+'|'+(document.querySelector('#rr2v')&&getComputedStyle(document.querySelector('#rr2v')).display)")
    res[name]=[s0,s1]
    if s0==s1:R["ng"].append(["BUG-65",name,s0])
  R["65"]=res
  # BUG-64：文字 小・中・大で「シフトで打つ」の札が入る
  r={}
  for f in ["s","m","l"]:
    r[f]=q(f"""async()=>{{OPTS.fsz='{f}';try{{optsSave&&optsSave();optsApply&&optsApply()}}catch(e){{}};PRF().char='YUKI';qaNewRun({{mode:'MT',night:2}});startBattleState('kei');enterBattle();await new Promise(r=>setTimeout(r,1500));B.rpm=5000;renderBattle();
      for(let i=0;i<B.hand.length;i++){{clickCard(i);await new Promise(r=>setTimeout(r,150));const t=document.querySelector('#ui .stab.sel');if(t)return[t.scrollWidth,t.clientWidth,t.textContent];S.sel=-1;renderBattle()}}return null}}""")
    if not r[f] or r[f][0]>r[f][1]+0:R["ng"].append(["BUG-64",f,r[f]])
  R["64"]=r
  # 回復 10%
  h=q("""()=>{const out={};for(const nt of [4,5,9,11]){qaNewRun({mode:'MT',night:nt});G.hp=1;const bi=G.map.findIndex(r=>r[0].k==='boss');G.row=bi;G.path[bi]=0;advanceRow();out[nt]=+((G.hp-1)/G.maxhp).toFixed(2)}return out}""")
  R["heal"]=h
  if h!={"4":0.3,"5":0.1,"9":0.1,"11":0.1}:R["ng"].append(["回復",h])
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False))
