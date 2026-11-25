# ★v0.22.8 design 10-7：enemy_attack_warn が「予告が変わった瞬間に1回だけ」鳴るか。python qa/warn228.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();errs=[]
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={"width":1280,"height":720});pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=90000)
  r=pg.evaluate("""()=>{const L=[];const f=AUDIO.se;AUDIO.se=function(id){if(id==='enemy_attack_warn')L.push(id);return f.apply(this,arguments)};localStorage.clear();SAVE.boot();
    newRunState('MT','YUKI',[]);G.row=G.map.length-1;startBattleState('van');B.e.pat=[['atk',3],['prc',2]];B.e.pi=0;enterBattle();renderBattle();renderBattle();const a=L.length;
    B.e.pi=1;renderBattle();renderBattle();const b=L.length;B.e.pi=2;renderBattle();const c=L.length;return{small:a,prc:b,back:c}}""")
  b.close()
print(json.dumps({"r":r,"errors":errs}))
