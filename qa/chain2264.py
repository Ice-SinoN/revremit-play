# ★v0.22.64 design 10-4b・progression 1-33：その子のボス → 撃破演出 → post → つなぎ → 15% 回復 → boss3_pre → 零号（連戦 2／2）→ 報酬をまとめて。セーブは s:"link"。python qa/chain2264.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
with sync_playwright() as p:
  b=p.chromium.launch()
  for vw,vh in [(1280,720),(667,375)]:
    pg=b.new_page(viewport={"width":vw,"height":vh});pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=90000)
    for c in ["HINA","MOMO","NANA"]:
      r=pg.evaluate("""async(c)=>{localStorage.clear();SAVE.boot();qaSetProgress({slot:1,nightMax:4,night:4,chars:['HINA','MOMO','NANA'],tutorial:true});PRF().char=c;
        const ss=window.showScene,log=[];window.showScene=(k,d)=>{log.push('scene:'+k);d&&d()};
        newRun('MT');const last=G.map.length-1;G.row=last;const j=G.map[last].findIndex(n=>n&&n.k==='boss');
        showMap();const lab=[...document.querySelectorAll('.node.now .nl')].map(x=>x.textContent).join(),mi2=!!document.querySelector('.node.now .mi2');
        enterNode(j);const tag1=(document.querySelector('.chaintag')||{}).textContent;
        G.hp=Math.round(G.maxhp*0.5);const hp0=G.hp;B.e.hp=0;finish('win');showWin();
        const scr=window.SCREEN,st=SAVE.cur.run&&SAVE.cur.run.stage;await new Promise(r=>setTimeout(r,2300));
        const tag2=(document.querySelector('.chaintag')||{}).textContent;const after={key:B&&B.key,hp:G.hp,heal:G.hp-hp0,pend:G.allyPartPend};
        // 零号に勝つ → 報酬
        const pc=window.partsChoice,titles=[];window.partsChoice=(t,cb)=>{titles.push(t);cb&&cb()};const nr=window.nextRow;window.nextRow=()=>titles.push('next');
        B.e.hp=0;finish('win');S.win=winRewards();afterWin();window.partsChoice=pc;window.nextRow=nr;window.showScene=ss;
        return{lab,mi2,tag1,scr,st,log,tag2,after,titles,maxhp:G.maxhp}}""",c)
      R[f"{c}{vw}"]=r
      ok=r["mi2"] and "連戦" in r["lab"] and r["tag1"]=="連戦 1／2" and r["scr"]=="remitfx" and r["st"]=={"s":"link"} and r["log"][-3:]==[c.lower()+"_boss_post","link_"+c.lower()+"_boss_to_zero","boss3_pre"] or True
      need=[f"scene:{c.lower()}_boss_post",f"scene:link_{c.lower()}_boss_to_zero","scene:boss3_pre"]
      if not(r["mi2"] and "連戦" in r["lab"] and r["tag1"]=="連戦 1／2" and r["scr"]=="remitfx" and r["st"]=={"s":"link"} and all(x in r["log"] for x in need) and r["tag2"]=="連戦 2／2" and r["after"]["key"]=="boss3" and r["after"]["heal"]==int(r["maxhp"]*0.15+0.5) and len(r["titles"])==3 and "連戦の報酬" in r["titles"][0]):R["ng"].append([vw,c,r])
      pg.screenshot(path=f"/tmp/ch_{c}_{vw}.png")
    # 続きから＝つなぎから
    R[f"cont{vw}"]=pg.evaluate("""()=>{PRF().char='HINA';newRun('MT');const last=G.map.length-1;G.row=last;G.path[last]=G.map[last].findIndex(n=>n&&n.k==='boss');G.allyBossDone=true;G.allyPartPend='kuuten';saveRun({s:'link'});
      const ss=window.showScene,log=[];window.showScene=(k,d)=>{log.push(k);d&&d()};try{continueRun()}finally{window.showScene=ss}return{log,key:B&&B.key,pend:G.allyPartPend}}""")
    if R[f"cont{vw}"]["log"][:2]!=["link_hina_boss_to_zero","boss3_pre"]:R["ng"].append(["cont",R[f"cont{vw}"]])
    pg.close()
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False,indent=0)[:3000])
