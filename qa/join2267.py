# ★v0.22.67 夜のクリア → 仲間の解放 → 加わる話（虎雪 11-20 10:13）。抜けていた仲間（古いセーブ・引き継ぎ）もそろう。python qa/join2267.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={"width":1280,"height":720});pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
  # 1) ふつう：NIGHT 1 を初めてクリア（NANA で走っても）→ HINA
  R["first"]=pg.evaluate("""()=>{qaSetProgress({slot:1,nightMax:0,chars:['NANA'],tutorial:true});const u=PRF().unlock;u.chars=['YUKI','NANA'];u.nightMax=0;u.story=[];
    PRF().char='NANA';newRunState('MT','NANA',[],null,{night:1});G.st.bosses=3;runEnd(true,'B');return{chars:u.chars.slice(),q:S.joinQ.slice(),nm:u.nightMax,story:u.story.slice()}}""")
  # 2) 抜けていた：nightMax 3 なのに HINA がいない（古いセーブ）→ NANA で NIGHT 1 をクリア → HINA が加わる
  R["missing_run"]=pg.evaluate("""()=>{const u=PRF().unlock;u.chars=['YUKI','MOMO','NANA'];u.nightMax=3;u.story=['n2','n3'];
    newRunState('MT','NANA',[],null,{night:1});G.st.bosses=3;runEnd(true,'B');return{chars:u.chars.slice(),q:S.joinQ.slice(),story:u.story.slice()}}""")
  # 3) 抜けていた：タイトルを開いたときに加わる話が流れる
  R["missing_title"]=pg.evaluate("""()=>{const u=PRF().unlock;u.chars=['YUKI','NANA'];u.nightMax=3;u.story=['n3'];const log=[];const pj=window.playJoins;window.playJoins=(q,d)=>{log.push(q.join());u.__seen=1;d()};
    try{showTitle()}finally{window.playJoins=pj}return{log,chars:u.chars.slice(),screen:window.SCREEN,story:u.story.slice()}}""")
  # 4) v0.19 の古いセーブの引きつぎ（クリアしたミニカー → nightMax 1）
  R["old"]=pg.evaluate("""()=>{const u=blankUnlock();u.nightMax=1;const p={unlock:u};return nightOpenRepair(p).concat(['|'],u.chars,u.story)}""")
  # 5) ★の記録が抜けた（読みこんだ古い形）→ ランの記録から足す
  R["rec"]=pg.evaluate("""()=>{const p=PRF();p.clearRec={};p.unlock.nightMax=0;p.unlock.chars=['YUKI'];p.runlog=[{at:Date.now(),v:1,farm:0,char:'NANA',mode:'AT',night:1,res:'clear'},{at:Date.now()-5,v:1,farm:1,char:'YUKI',mode:'MT',night:2,res:'clear'}];
    const pj=window.playJoins;let q=null;window.playJoins=(x,d)=>{q=x.join();d()};try{showTitle()}finally{window.playJoins=pj}return{rec:p.clearRec,nm:p.unlock.nightMax,chars:p.unlock.chars.slice(),q}}""")
  # 6) フルオートの状態が残っていても、自分で走ったランの解放はもどされない
  R["farm"]=pg.evaluate("""()=>{const p=PRF();p.unlock.chars=['YUKI'];p.unlock.nightMax=0;p.clearRec={};FARM.on=true;FARM.snap=JSON.parse(JSON.stringify(p));
    S.flow={mode:'AT'};PRF().char='YUKI';runGo();bootSkip();G.st.bosses=3;runEnd(true,'B');return{chars:PRF().unlock.chars.slice(),rec:PRF().clearRec,on:FARM.on}}""")
  # 7) 古い形（夜は不明＝0）→ NIGHT 1 にそろえ、HINA も
  R["zero"]=pg.evaluate("""()=>{const p=PRF();p.runlog=[];p.unlock.chars=['YUKI'];p.unlock.nightMax=0;p.clearRec={'YUKI|MT':[0],'NANA|AT':[0,3]};const pj=window.playJoins;let q=null;window.playJoins=(x,d)=>{q=x.join();d()};try{showTitle()}finally{window.playJoins=pj}
    return{rec:p.clearRec,nm:p.unlock.nightMax,q}}""")
  b.close()
f=R["first"];m=R["missing_run"];t=R["missing_title"];o=R["old"]
if not("HINA" in f["chars"] and f["q"][:1]==["HINA"] and f["nm"]==1 and "n1" in f["story"]):R["ng"].append("first")
if not("HINA" in m["chars"] and "HINA" in m["q"] and "n1" in m["story"]):R["ng"].append("missing_run")
if not(t["log"]==["HINA,MOMO"] and set(["HINA","MOMO"])<=set(t["chars"]) and t["screen"]=="title"):R["ng"].append("missing_title")
if not(o[0]=="HINA" and "n1" in o):R["ng"].append("old")
r5=R["rec"];r6=R["farm"]
if not(r5["rec"].get("NANA|AT")==[1] and "YUKI|MT" not in r5["rec"] or (r5["rec"].get("YUKI|MT") or [])==[0]) or r5["nm"]!=1 or r5["q"]!="HINA":R["ng"].append("rec")
if not("HINA" in r6["chars"] and r6["rec"].get("YUKI|AT")==[1] and not r6["on"]):R["ng"].append("farm")
z=R["zero"]
if not(z["rec"]["YUKI|MT"]==[0,1] and z["rec"]["NANA|AT"]==[0,3] and z["nm"]==3 and z["q"]=="HINA,MOMO,NANA"):R["ng"].append("zero")
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False))
