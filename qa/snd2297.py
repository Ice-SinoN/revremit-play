# ★v0.22.97 audio v0.26 のつなぎ。python qa/snd2297.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();errs=[]
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={"width":1280,"height":720});pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
  r=pg.evaluate("""async()=>{const log=[];const o=SND.se;SND.se=(id,a)=>{log.push([id,a&&a.n]);return o.call(SND,id,a)};const w=ms=>new Promise(r=>setTimeout(r,ms));const out={ver:AUDIO.VERSION};
    const S0=(m)=>{newRunState(m,'YUKI',[]);G.night=3;G.row=1;startBattleState('kei');enterBattle();B.gas=5;B.gear=0;B.e.next=999;B.e.hp=B.e.maxhp=999;B.hand=[inst('hyouga'),inst('hyouga'),inst('hyouga')];renderBattle()};
    S0('MT');const b=bandRange(),mid=Math.round((b.clo+b.chi)/2/100)*100;B.rpm=mid-1000;log.length=0;doPlay(0,true);await w(700);B.rpm=mid-1000;B.gas=5;doPlay(0,true);const t0=performance.now();await w(700);out.mt=log.filter(x=>/shift|kime/.test(x[0]));out.hs=A.hitStop>0;
    S0('AT');B.rpm=b.lo;log.length=0;doPlay(0,false);await w(700);out.at=log.filter(x=>/shift|kime/.test(x[0]));
    S0('AT');B.gear=2;B.rpm=1500;B.e.next=0;log.length=0;doEndTurn();await w(3000);out.down=log.filter(x=>/down|parking/.test(x[0]));out.glog=B.log.filter(x=>x.includes('自動シフトダウン'));
    SND.se=o;return out}""")
  print(json.dumps({"r":r,"errors":errs},ensure_ascii=False));b.close()
