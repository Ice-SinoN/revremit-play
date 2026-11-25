# ★v0.22.10 体力 0 で止まる不具合（虎雪 19:04）の回帰：耐久1で先に動く敵／始まりで 0／続きから。python qa/hp0.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={};errs=[]
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={"width":1280,"height":720});pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
  for name,js in [("first1","()=>{localStorage.clear();SAVE.boot();newRunState('MT','YUKI',[]);G.hp=1;G.row=2;startBattleState('coupe');enterBattle();return B.over}"),
                  ("hp0","()=>{newRunState('MT','HINA',[]);G.hp=0;startBattleState('van');enterBattle();return B.over}"),
                  ("cont","()=>{newRunState('MT','MOMO',[]);G.hp=1;G.row=2;const j=0;G.path[G.row]=j;saveRun({s:'battle',key:'coupe',j});continueRun();return !!B&&B.over}")]:
    over=pg.evaluate(js)
    try:
      pg.wait_for_function("window.SCREEN==='result'",timeout=15000);R[name]={"over":over,"screen":"result"}
    except Exception as e:
      R[name]={"over":over,"screen":pg.evaluate("window.SCREEN")}
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False))
