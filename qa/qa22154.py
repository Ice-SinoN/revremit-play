# ★v0.22.154 QA の気になる所：①文字「大」でガレージの型のボタン（型のメモ・ポイント）が切れない ②結果の画面の「ログ +n」がランクの札にかからない（長い行でも）③最初の戦闘の走りかたの小窓：設定を開いていると出ない。python qa/qa22154.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
with sync_playwright() as p:
  b=p.chromium.launch()
  for vw,vh in [(667,375),(956,440),(1280,720)]:
    pg=b.new_page(viewport={"width":vw,"height":vh});pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    o=pg.evaluate("""async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));qaSetProgress({slot:1,nightMax:4,chars:['HINA','MOMO','NANA'],tutorial:true});const o={};
      for(const fz of ['s','m','l']){OPTS.fsz=fz;showHub();try{fsAll()}catch(e){};await w(150);o['hub_'+fz]=[...document.querySelectorAll('.hubt')].filter(bt=>{const s=bt.querySelector('.small');const r=s.getBoundingClientRect(),q=bt.getBoundingClientRect();return s.scrollWidth>s.clientWidth+1||r.bottom>q.bottom+0.5||!/ポイント/.test(s.textContent)}).length}
      OPTS.fsz='l';qaNewRun({mode:'MT',night:2});G.st.bosses=1;G.st.rowsDone=12;G.st.shiftTry=123;G.st.perfect=88;G.st.good=27;G.st.otk=12;showResult(false);try{fsAll()}catch(e){};await w(800);
      const lg=[...document.querySelectorAll('#ui .gold')].find(e=>/ログ \\+/.test(e.textContent)),rk=document.querySelector('#ui .rk');const a=lg.getBoundingClientRect(),c=rk.getBoundingClientRect(),st=document.querySelector('#stage').getBoundingClientRect();
      o.res=!(a.left<c.right&&c.left<a.right&&a.top<c.bottom&&c.top<a.bottom)&&a.right<=st.right+1;OPTS.fsz='m';
      const P=PRF();P.modeHelp={};qaNewRun({mode:'MT',night:2});startBattleState('kei');enterBattle();await w(200);renderOpts();await w(1500);o.help=!!document.querySelector('.glpop.mhelp');closeModal();return o}""")
    R[str(vw)]=o
    if o["hub_s"] or o["hub_m"] or o["hub_l"] or not o["res"] or o["help"]:R["ng"].append([vw,o])
    pg.close()
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False))
