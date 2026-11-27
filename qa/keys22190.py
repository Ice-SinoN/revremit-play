# ★v0.22.190 キーボード／筐体のボタン（技術メモ 2-1）：キーだけで タイトル → チュートリアル → ラン1回 → リザルト（2枚えらんでミニカー）→ タイトル。あわせてキーごとの小さい確かめ。python qa/keys22190.py <html>
import sys,json,time,pathlib
from playwright.sync_api import sync_playwright
H=str(pathlib.Path(sys.argv[1]).resolve());N=2500;R={"ng":[]}
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={"width":1280,"height":720});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)));pg.goto("file://"+H);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
  pg.evaluate("()=>{OPTS.banter=false;try{OPTS.speed=4}catch(e){}}")
  st=lambda:pg.evaluate("()=>({s:window.SCREEN,t:typeof B!=='undefined'&&B?B.pTurns:null,h:typeof B!=='undefined'&&B&&B.hand?B.hand.length:null,ehp:typeof B!=='undefined'&&B&&B.e?B.e.hp:null,tut:!!window.TUTORIAL_ON,c:KEYS.cur?(KEYS.cur.getAttribute('onclick')||KEYS.cur.textContent||'').slice(0,20):null,busy:typeof busy==='function'&&busy(),md:document.getElementById('modal').children.length,row:typeof G!=='undefined'&&G?G.row:null})")
  seen=[];fails=0;last=None;t0=time.time();keys=0
  for i in range(N):
    s=st()
    if s["s"] not in seen[-1:]:seen.append(s["s"])
    if s["s"]=="result":break
    if s["busy"]:pg.keyboard.down("KeyX");pg.wait_for_timeout(60);pg.keyboard.up("KeyX");keys+=1;continue
    if s["s"]=="battle" and not s["tut"] and not s["md"]:
      sig=(s["t"],s["h"],s["ehp"])
      if sig==last:fails+=1
      else:fails=0
      last=sig
      if fails>=8:
        pg.keyboard.down("ShiftLeft");pg.wait_for_timeout(480);pg.keyboard.up("ShiftLeft");keys+=1;fails=0;pg.wait_for_timeout(200);continue
      c=s["c"] or ""
      if "doPlay(" in c or "doEndTurn" in c and fails<4:pg.keyboard.press("Enter")
      elif "clickCard" in c:
        if fails%2==1:pg.keyboard.press("ArrowRight")
        pg.keyboard.press("Enter")
      else:pg.keyboard.press("ArrowDown");pg.keyboard.press("Enter")
      keys+=2;pg.wait_for_timeout(120);continue
    pg.keyboard.press("Enter");keys+=1;pg.wait_for_timeout(150)
  # リザルト：キーだけで2枚えらんで決める → タイトルにもどる
  R2=[]
  for i in range(80):
    s=st();R2.append((s["s"],s["c"],pg.evaluate("()=>[JSON.stringify(S.pickSel),S.need,!!(KEYS.cur&&KEYS.cur.isConnected),KEYS.on]")))
    if s["s"]=="title":break
    c=s["c"] or ""
    need=pg.evaluate("()=>S.need!=null?S.need-(S.pickSel||[]).length:0")
    if s["s"]=="result" and need>0:
      if "togglePick" in c:
        sel=pg.evaluate("()=>S.pickSel||[]");idx=int(c.split("(")[1].split(")")[0])
        if idx in sel:pg.keyboard.press("ArrowRight")
        else:pg.keyboard.press("Enter")
      else:pg.keyboard.press("ArrowUp")
    else:
      if s["s"]=="result" and ("togglePick" in c or "pickPart" in c):pg.keyboard.press("ArrowDown")
      else:pg.keyboard.press("Enter")
    keys+=1;pg.wait_for_timeout(250)
  seen.append(st()["s"]);R["seen"]=seen;R["keys"]=keys;R["sec"]=round(time.time()-t0)
  for need in ["chars","runok","battle","map","result"]:
    if need not in seen:R["ng"].append(["通らなかった画面",need])
  if seen[-1]!="title":R["ng"].append(["タイトルにもどらない",seen[-1]])
  mc=pg.evaluate("()=>(SAVE.cur.profile.minicars||[]).length")
  if mc<1:R["ng"].append(["ミニカーができていない",mc])
  # キーごと
  pg.goto("file://"+H);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
  q=lambda js:pg.evaluate(js)
  R["ring0"]=q("()=>document.querySelectorAll('.kf').length")
  pg.keyboard.press("ArrowDown");R["ring1"]=q("()=>document.querySelectorAll('.kf').length")
  pg.mouse.move(100,100);pg.mouse.move(140,120);R["ring2"]=q("()=>document.querySelectorAll('.kf').length")
  if R["ring0"]!=0 or R["ring1"]!=1 or R["ring2"]!=0:R["ng"].append(["枠",R["ring0"],R["ring1"],R["ring2"]])
  # Ctrl：おしながら A は何もしない／Ctrl だけ（はなしたとき）は決定
  pg.keyboard.press("ArrowDown");pg.keyboard.press("Control+KeyA");pg.wait_for_timeout(300);m0=q("()=>[window.SCREEN,document.getElementById('modal').children.length]")
  c0=q("()=>KEYS.cur&&KEYS.cur.getAttribute('onclick')")
  pg.keyboard.press("ControlLeft");pg.wait_for_timeout(300);m1=q("()=>[window.SCREEN,document.getElementById('modal').children.length]")
  R["ctrl"]=[c0,m0,m1]
  if m0!=["title",0] or m1==m0:R["ng"].append(["Ctrl",c0,m0,m1])
  q("()=>{closeModal();showTitle()}");pg.wait_for_timeout(300)
  # 小窓：中だけえらぶ・Esc で閉じる
  for i in range(2):
    pg.keyboard.press("Enter");pg.wait_for_timeout(300)
    if q("()=>document.getElementById('modal').children.length"):break
  inm=q("()=>{const m=document.getElementById('modal');return m.children.length?kList().every(o=>m.contains(o.el)):null}")
  pg.keyboard.press("Escape");pg.wait_for_timeout(200);mc2=q("()=>document.getElementById('modal').children.length")
  R["modal"]=[inm,mc2]
  if inm is not True or mc2!=0:R["ng"].append(["小窓",inm,mc2])
  # 戦闘：Space＝↓シフト、左Shift は 0.4秒より短いと何もしない・長いとターン終了、Z＝カードの説明、Esc＝えらぶのをやめる
  q("async()=>{qaSetProgress({slot:1,nightMax:3,tutorial:true});OPTS.banter=false;PRF().char='YUKI';qaNewRun({mode:'MT',night:2});startBattleState('kei');enterBattle();await new Promise(r=>setTimeout(r,2500));B.rpm=5000;B.gear=3;renderBattle()}")
  g0=q("()=>B.gear");pg.keyboard.press("Space");pg.wait_for_timeout(900);g1=q("()=>B.gear")
  t0=q("()=>B.pTurns");pg.keyboard.down("ShiftLeft");pg.wait_for_timeout(150);pg.keyboard.up("ShiftLeft");pg.wait_for_timeout(500);t1=q("()=>B.pTurns")
  pg.keyboard.press("ArrowDown");pg.keyboard.press("ArrowDown");pg.keyboard.press("ArrowRight")
  c=q("()=>KEYS.cur&&KEYS.cur.getAttribute('onclick')")
  pg.keyboard.press("KeyZ");pg.wait_for_timeout(300);hp=q("()=>S.sel===1||!!document.querySelector('#ui .toast2')")  # 説明（長押しの字）か予告
  pg.keyboard.press("Escape");pg.wait_for_timeout(200)
  pg.keyboard.press("Enter");pg.wait_for_timeout(300);s1=q("()=>S.sel");pg.keyboard.press("Escape");pg.wait_for_timeout(300);s2=q("()=>S.sel")
  pg.keyboard.down("ShiftLeft");pg.wait_for_timeout(520);pg.keyboard.up("ShiftLeft")
  for i in range(40):
    pg.wait_for_timeout(250)
    if q("()=>B.pTurns")!=t0 or q("()=>B.over"):break
  t2=q("()=>B.pTurns")
  R["battle"]={"gear":[g0,g1],"turn":[t0,t1,t2],"cur":c,"help":hp,"sel":[s1,s2]}
  if not(g1==g0-1):R["ng"].append(["Space で↓シフト",g0,g1])
  if t1!=t0:R["ng"].append(["左Shift が短くてもターン終了",t0,t1])
  if t2==t0:R["ng"].append(["左Shift 0.5秒でターン終了しない",t0,t2])
  if not(c and "clickCard" in c):R["ng"].append(["↓で手札へ",c])
  if s1 is None or s1<0 or s2!=-1:R["ng"].append(["Enter でえらぶ・Esc でやめる",s1,s2])
  if not hp:R["ng"].append(["Z でカードの説明",hp])
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False))
