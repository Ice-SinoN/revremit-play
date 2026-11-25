# ★v0.22.22 BUG-45：S ランク以上のミニカーで開いたカードの知らせ。ラボで氷壁を買っていたら4枚目は出さない。python qa/b45.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={};errs=[]
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={"width":1280,"height":720});pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
  for sc,bought in [(0,[]),(1,[]),(2,[]),(3,[]),(3,["hyouheki"])]:
    r=pg.evaluate(f"""()=>{{qaSetProgress({{nightMax:1}});const p=PRF();p.unlock.sCount={sc};p.unlock.cards=(p.unlock.cards||[]).filter(x=>!UNLOCK.sRank.includes(x)).concat({json.dumps(bought)});unlockRecalc(p);
      newRunState('MT','YUKI',[],null,{{night:1}});S.runGot=[];S.runEndLog=0;let shown=null;const o=afterCarShow;window.afterCarShow=g=>{{shown=g}};try{{afterCar({{rank:'S'}})}}finally{{window.afterCarShow=o}}
      return{{shown,sc:PRF().unlock.sCount,has:unlockedCards(PRF()).includes(UNLOCK.sRank[{sc}])}}}}""")
    R[f"{sc}{'+'+bought[0] if bought else ''}"]=r
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False))
