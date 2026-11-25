# ★v0.22.6：audio.js v0.10.1・固有スキルの音・データの画面の音・comm_glitch。python qa/audio226.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={};errs=[]
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={"width":1280,"height":720});pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=90000)
  R["r"]=pg.evaluate("""async()=>{const L=[];const f=AUDIO.se;AUDIO.se=function(id,o){L.push(id+(o&&o.rec?':rec':''));return f.apply(this,arguments)};const o={v:AUDIO.VERSION};
    localStorage.clear();SAVE.boot();qaSetProgress({slot:1,nightMax:4,night:4,chars:['HINA','MOMO','NANA']});
    L.length=0;dataUse(1);o.use=L.slice();L.length=0;dataErase(2);o.eraseAsk=L.slice();L.length=0;S.dataGo();o.erase=L.slice();
    newRunState('MT','HINA',[]);L.length=0;showScene('hina_boss_pre',()=>{});for(let i=0;i<S.sc.sc.lines.length;i++){S.sc.i=i;sceneLine()}o.glitch=L.filter(x=>x==='comm_glitch').length;sceneEnd();
    newRunState('MT','YUKI',[]);startBattleState('van');enterBattle();B.hand=[inst('shironeko')];B.gas=9;L.length=0;clickCard(0);clickCard(0);
    await new Promise(r=>setTimeout(r,1500));o.skill=L.filter(x=>/card_/.test(x));
    L.length=0;AUDIO.se('gate_boot',{rec:true});o.rec=L;return o}""")
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False))
