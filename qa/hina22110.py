import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri()
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={"width":1280,"height":720});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
  r=pg.evaluate("""()=>{qaSetProgress({slot:1,nightMax:3,chars:['HINA'],tutorial:true});PRF().char='HINA';const J=[];const o=SND.jingle,s=SND.se;SND.jingle=(i,x)=>{J.push(['j',i,x&&x.lv]);};SND.se=(i,x)=>{J.push(['s',i])};
   S.farmChoiceOk=true;showCharSel();csPick();PRF().night=2;readyNight(-1);SND.jingle=o;SND.se=s;
   newRunState('AT','HINA',[],null,{night:1});startBattleState('kei');startPlayerTurn(false);const a=modeBanner();setDrive('sport');const b2=modeBanner();newRunState('AT','MOMO',[],null,{night:1});startBattleState('kei');startPlayerTurn(false);const m1=[modeBanner()[1],maxGas()];setDrive('sport');const m2=[modeBanner()[1],maxGas()];return{J:J.filter(x=>x[1]==='night_select'),a,b2,m1,m2}}""")
  print(json.dumps(r,ensure_ascii=False),errs)
