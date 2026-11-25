# ★v0.22.111 長押しの説明（lp）：手札の長押しでトースト・説明の窓の「くわしく」・lp のないカードは出ない
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={}
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={"width":1280,"height":720},has_touch=True);errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
  pg.evaluate("()=>{CARDS.hyouga.lp='テスト：長押しの説明';CARDS.hyouga.lpu='テスト：強化後';newRunState('MT','YUKI',[]);G.row=1;startBattleState('kei');enterBattle();}");pg.wait_for_timeout(500)
  pg.wait_for_timeout(800)
  R["scr"]=pg.evaluate("()=>window.SCREEN")
  R["setup"]=pg.evaluate("()=>{B.gas=9;B.hand=[inst('hyouga'),inst('braking')];S.sel=-1;renderBattle();return B.hand.length}")
  pg.wait_for_timeout(300)
  els=pg.query_selector_all("#ui .cs")
  bx=els[0].bounding_box() if els else None
  if bx:
    pg.mouse.move(bx["x"]+bx["width"]/2,bx["y"]+bx["height"]/2);pg.mouse.down();pg.wait_for_timeout(600)
    R["toast"]=pg.evaluate("()=>[...document.querySelectorAll('.toast2')].map(e=>e.innerText).join('|')")
    pg.mouse.up();pg.wait_for_timeout(100);R["selAfterLP"]=pg.evaluate("()=>S.sel")
    pg.evaluate("()=>clickCard(0)");pg.wait_for_timeout(200)
    R["btn"]=pg.evaluate("()=>!!document.querySelector('.lpbtn')")
    pg.evaluate("()=>clickCard(1)");pg.wait_for_timeout(200);R["btn2"]=pg.evaluate("()=>!!document.querySelector('.lpbtn')")
  R["errs"]=errs;print(json.dumps(R,ensure_ascii=False))
