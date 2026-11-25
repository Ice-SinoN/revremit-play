# ★v0.22.11 オート戦闘・設定の画面。python qa/auto2211.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={};errs=[]
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={"width":1280,"height":720});pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
  pg.evaluate("()=>{localStorage.clear();SAVE.boot();newRunState('MT','YUKI',[]);G.row=1;startBattleState('van');enterBattle()}")
  pg.wait_for_timeout(500);pg.screenshot(path="/tmp/auto0.png")
  pg.evaluate("()=>{autoToggle();AUTO.speed=4}")
  try:
    pg.wait_for_function("window.SCREEN!=='battle'",timeout=120000);R["auto"]=pg.evaluate("({screen:window.SCREEN,res:B&&B.result,hp:G.hp})")
  except Exception as e: R["auto"]={"timeout":str(e)[:80],"screen":pg.evaluate("window.SCREEN")}
  pg.evaluate("()=>{newRunState('MT','YUKI',[]);G.row=1;startBattleState('van');AUTO.on=false;enterBattle();showOpts()}");pg.wait_for_timeout(400);pg.screenshot(path="/tmp/opts.png")
  R["optsAutoPaused"]=pg.evaluate("AUTO.on===false")
  pg.evaluate("()=>{const r=document.querySelector('.oprow input');r.value=30;r.dispatchEvent(new Event('input'))}")
  R["vol"]=pg.evaluate("JSON.parse(localStorage.getItem('revremit_opts')).bgm")
  pg.evaluate("()=>{optsGiveUp()}");pg.wait_for_timeout(200);R["confirm"]=pg.evaluate("document.querySelector('#modal').innerText.includes('本当にあきらめますか')")
  pg.evaluate("()=>optsGiveUpGo()");pg.wait_for_timeout(500);R["giveup"]=pg.evaluate("window.SCREEN")
  pg.evaluate("()=>{newRunState('MT','YUKI',[]);showMap();showOpts()}");pg.wait_for_timeout(300);pg.screenshot(path="/tmp/optsmap.png")
  pg.evaluate("()=>optsClose()")
  # 消せるか
  pg.evaluate("()=>{FEATURES.auto=false;newRunState('MT','YUKI',[]);startBattleState('van');enterBattle()}");R["flagOff"]=pg.evaluate("!document.querySelector('.autob')&&!!document.querySelector('.optb')")
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False))
