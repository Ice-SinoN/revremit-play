# ★v0.22.5：text v0.14〜v0.17 の直し（nana_area1・裏道の3行目・NIGHT 3 の4行目）と 17-2 の画面の文16か所。python qa/text225.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={};errs=[]
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={"width":1280,"height":720});pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=90000)
  R["t"]=pg.evaluate("""()=>{localStorage.clear();SAVE.boot();qaSetProgress({slot:1,nightMax:4,night:4,chars:['HINA','MOMO','NANA'],log:500});const o={};const txt=()=>document.querySelector('#ui').innerText.replace(/\\s+/g,' ');const T=[];const t2=window.toast2;window.toast2=m=>{T.push(m);t2(m)};
    o.nana_area1=TEXT.scenes.area1_nana.lines[0][1];
    o.hidden3=['YUKI','HINA','MOMO','NANA'].map(c=>(TEXT.hiddenLast[c]||[])[1]);o.night3=Object.keys(TEXT.night3Last);
    PRF().char='HINA';showTitle();o.title=txt().match(/キャラ：\\S+|・ひな・3エリア/g);
    showChars();o.chars=(document.querySelector('#ui .main.u9')||{}).innerText;document.querySelector('#ui .main.u9').click();o.charToast=T.pop();
    showData();o.data=txt().match(/あそぶと自動でセーブ。|いまのデータ/g);dataUse(1);o.dataToast=T.pop();
    showLab();o.lab=!!document.querySelector('.nmtag')&&!document.querySelector('#ui .commk');PRF().log=0;labBuy('drift');o.labNo=T.pop();PRF().log=500;labBuy('drift');o.labOk=T.pop();
    o.ally=TEXT.ui.ally_join.replace('{name}',TEXT.names.MOMO);o.lose=TEXT.ui.hidden_lose;
    newRunState('MT','YUKI',[]);G.map[G.row][0]={k:'hidden',a:0,r:G.row};G.path[G.row]=0;startBattleState('wraith');o.lost=B.e.n;o.chBtn=(showChars(),[...document.querySelectorAll('#ui button')].map(x=>x.innerText).find(x=>/で走る/.test(x)));return o}""")
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False,indent=1))
