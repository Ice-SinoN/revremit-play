# ★v0.22.4：audio.js v0.10 と、ally_next・next_sora・engineBurst {top} のつなぎ。python qa/audio224.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={};errs=[]
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={"width":1280,"height":720});pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=90000)
  R["ver"]=pg.evaluate("()=>({v:AUDIO.VERSION,j:AUDIO.JINGLE_IDS.includes('ally_next')})")
  pg.evaluate("""()=>{window.LOG=[];for(const k of ['se','jingle','bgm','bgmStop','engineBurst'])((k0)=>{const f=AUDIO[k0];AUDIO[k0]=function(...a){LOG.push([k0,...a.map(x=>typeof x==='object'?JSON.stringify(x):x)]);return f.apply(this,a)}})(k)}""")
  # 予告：札 → next_sora を1行ずつ
  R["next"]=pg.evaluate("""()=>{localStorage.clear();SAVE.boot();qaSetProgress({slot:1,nightMax:4,night:4,chars:['HINA','MOMO','NANA']});newRunState('MT','YUKI',[]);LOG.length=0;
    playJoins(['__next'],()=>{});const a=LOG.splice(0);sceneEnd();const out={ally:a.filter(x=>x[0]!=='se'||x[1]!=='text_blip')};
    const per={};for(let i=0;i<S.sc.sc.lines.length;i++){LOG.length=0;S.sc.i=i;sceneLine();per[i+1]=LOG.filter(x=>!/blip/.test(x[1]||'')).map(x=>x.join(':'))}
    out.key=S.sc.key;out.lines=Object.fromEntries(Object.entries(per).filter(([k,v])=>v.length));return out}""")
  R["top"]=pg.evaluate("""()=>{const out={};for(const n of [1,3]){newRunState('MT','YUKI',[],null,{night:n});G.night=n;startBattleState('van');
    for(const g of [0,G.car.gears-1]){B.gear=g;LOG.length=0;SND.engineBurst(5000,7400);out['N'+n+'_g'+(g+1)]=(LOG.find(x=>x[0]==='engineBurst')||[]).slice(3).join('')||'-'}}return out}""")
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False,indent=1))
