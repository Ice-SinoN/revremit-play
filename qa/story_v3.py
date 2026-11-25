# ★v0.19 ストーリー v3 の流れと見た目の確かめ：python qa/story_v3.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve();shots=pathlib.Path(__file__).parent/"shots";shots.mkdir(exist_ok=True)
FLOW="""()=>{const log=[];const real=showScene;window.showScene=(k,d)=>{log.push(k);if(TEXT.scenes[k])seenSet(k);d&&d()};
 const sm=window.showMap;window.showMap=()=>{log.push("MAP")};
 newRun("MT");const first=log.slice();log.length=0;newRun("MT");const second=log.slice();log.length=0;
 const ar=window.advanceRow;window.advanceRow=()=>"clear";const sr=window.showResult;window.showResult=()=>log.push("RESULT");G.row=0;nextRow();const clear=log.slice();
 log.length=0;enterNode.call(null,0);
 window.showScene=real;window.showMap=sm;window.advanceRow=ar;window.showResult=sr;return{first,second,clear}}"""
res={};errs=[]
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={"width":1280,"height":720});pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto(html.as_uri());pg.wait_for_function("window.SCREEN==='title'",timeout=30000)
  pg.evaluate("()=>{localStorage.clear();localStorage.setItem('revremit_tutorial_done','1')}")
  res["flow"]=pg.evaluate(FLOW)
  pg.evaluate("()=>newRunState('MT','YUKI',[])")
  for k,i in [("prologue",4),("prologue",8),("op",13),("op_road",2),("boss1_pre",4),("boss1_post",1),("first_remit",2),("ed1",6),("run_start",0),("rest_first",0)]:
    pg.evaluate(f"()=>{{showScene('{k}',()=>{{}});S.sc.i={i};S.sc.shown=999;clearInterval(S.sc.t);renderScene()}}");pg.wait_for_timeout(250)
    st=pg.evaluate("()=>{const b=document.querySelector('.scband');return{cls:b.className,name:b.querySelector('.scname').textContent,nameCol:getComputedStyle(b.querySelector('.scname')).color,txt:b.querySelector('.sctext').textContent,fs:getComputedStyle(b.querySelector('.sctext')).fontSize,h:b.querySelector('.sctext').scrollHeight,bg:(document.querySelector('.scbg')||{}).src||'dim',noise:document.querySelector('.scroot').classList.contains('fx-noise')}}")
    st["bg"]=st["bg"].split("/")[-1][:40];res[f"{k}#{i+1}"]=st;pg.screenshot(path=str(shots/f"v19_{k}_{i+1}.png"))
  b.close()
res["errors"]=errs;print(json.dumps(res,ensure_ascii=False,indent=1))
