# ★v0.22.3：その子のボスの受け口（サーキットのボスのマス：○○_boss_pre → その子のボス → パーツ → ○○_boss_post → 零号）。python qa/allyboss.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={};errs=[]
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={"width":1280,"height":720});pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=90000)
  R["flow"]=pg.evaluate("""()=>{localStorage.clear();SAVE.boot();qaSetProgress({slot:1,nightMax:4,night:4,chars:['HINA','MOMO','NANA']});
    const ss=window.showScene,eb=window.enterBattle,pc=window.partsChoice,log=[];
    window.showScene=(k,d)=>{log.push('scene:'+k);d&&d()};window.partsChoice=(t,cb)=>{log.push('parts');cb&&cb()};
    window.enterBattle=()=>{log.push('battle:'+B.key+':'+B.e.n+':hp'+B.e.maxhp+(B.e.phase?':ph':''))};
    const out={};try{for(const c of ['YUKI','HINA','MOMO','NANA']){PRF().char=c;newRun('MT');const last=G.map.length-1;G.row=last;
      const j=G.map[last].findIndex(n=>n&&n.k==='boss');log.length=0;enterNode(j);
      if(B&&B.e.ally){S.win=winRewards();afterWin()}out[c]=log.slice();out[c+'_row']=G.row===last&&G.allyBossDone===(c!=='YUKI')}}
    finally{window.showScene=ss;window.enterBattle=eb;window.partsChoice=pc}
    out.texts=['hina','momo','nana'].every(l=>['pre','phase','post'].every(s=>TEXT.scenes[l+'_boss_'+s]&&TEXT.scenes[l+'_boss_'+s].lines.length));
    out.bgm=['boss_kuuten','boss_sanka','boss_miketsu'].map(x=>x+':'+(AUDIO.BGM_IDS?AUDIO.BGM_IDS.includes(x):'?'));return out}""")
  # 続きから：その子のボスに勝って保存 → 続きからでパーツ → post → 零号
  R["cont"]=pg.evaluate("""()=>{PRF().char='NANA';newRun('MT');const last=G.map.length-1;G.row=last;const j=G.map[last].findIndex(n=>n&&n.k==='boss');G.path[last]=j;
    startBattleState('miketsu');S.win=winRewards();saveRun({s:'win',rank:'boss',key:'miketsu'});const st=SAVE.cur.run.stage;
    const ss=window.showScene,eb=window.enterBattle,pc=window.partsChoice,log=[];window.showScene=(k,d)=>{log.push('scene:'+k);d&&d()};window.partsChoice=(t,cb)=>{log.push('parts');cb&&cb()};
    window.enterBattle=()=>{log.push('battle:'+B.key)};try{continueRun()}catch(e){log.push('ERR '+e)}finally{window.showScene=ss;window.enterBattle=eb;window.partsChoice=pc}return{st,log}}""")
  # 第2形態の一言
  R["phase"]=pg.evaluate("""()=>{PRF().char='HINA';newRun('MT');startBattleState('kuuten');B.e.hp=Math.floor(B.e.maxhp*0.4);checkPhase();afterAct(null,null);return{ph:B.e.phased,toast:(S.toastQ||[]).map(l=>l[1]).join('/')}}""")
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False,indent=1))
