# ちかちか（会話の画面で絵が作り直されて一瞬消える）の確かめ：python qa/flicker.py <html>
# 会話をいくつか流して、そのあいだに <img> が作り直された回数と、立ち絵・一枚絵が見えなかった回数を数える。画面いっぱいの光の間隔も見る
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve()
JS="""async(keys)=>{const W=ms=>new Promise(r=>setTimeout(r,ms));const out={};
 for(const k of keys){let rebuilt=0,blank=0,frames=0;const mo=new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.tagName==='IMG'||(n.querySelectorAll&&n.querySelectorAll('img').length))rebuilt++})));
  showScene(k,()=>{});await W(50);if(!S.sc){out[k]='なし';continue}mo.observe(ui(),{childList:true,subtree:true});const r0=rebuilt;
  const lines=S.sc.sc.lines.length;let changes=0;
  for(let i=0;i<Math.min(lines,6);i++){const t0=performance.now();while(performance.now()-t0<700){frames++;const imgs=[...ui().querySelectorAll('img')];if(imgs.some(im=>!im.complete||!im.naturalWidth))blank++;await W(16)}
    const before=S.sc?S.sc.i:-1;if(!S.sc)break;sceneTap();if(S.sc&&S.sc.shown<sceneText().length)sceneTap();if(S.sc&&S.sc.i!==before)changes++}
  mo.disconnect();out[k]={imgAdded:rebuilt,lines:Math.min(lines,6),blankFrames:blank,frames};sceneSkip();await W(30)}
 return out}"""
FL="""async()=>{const W=ms=>new Promise(r=>setTimeout(r,ms));const ts=[];A.lastFlash=0;const f0=window.flash;let n=0;for(let i=0;i<10;i++){flash('#fff',100);if(A.flash&&A.flash.t===0&&A.lastFlash!==ts[ts.length-1])ts.push(A.lastFlash);await W(100)}
 const gaps=ts.slice(1).map((t,i)=>Math.round(t-ts[i]));return {flashes:ts.length,minGap:Math.min(...gaps)}}"""
res={}
with sync_playwright() as p:
  b=p.chromium.launch()
  for w,h,d in [(844,390,3),(932,430,3),(1280,720,1)]:
    pg=b.new_page(viewport={"width":w,"height":h},device_scale_factor=d);errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html.as_uri());pg.wait_for_function("window.SCREEN==='title'",timeout=30000)
    pg.evaluate("()=>{localStorage.setItem('revremit_tutorial_done','1');newRunState('MT','YUKI',[])}")
    r=pg.evaluate(JS,["prologue","op","op_road","boss1_pre","boss1_post","ed1","ed1_after","first_remit","run_start","rest_first"]);r["flash"]=pg.evaluate(FL);r["errors"]=errs[:3];res[f"{w}x{h}"]=r;pg.close()
  b.close()
ok=all(all(v[k]["imgAdded"]<=v[k]["lines"]*2 and v[k]["blankFrames"]==0 for k in v if k not in("flash","errors") and isinstance(v[k],dict)) and v["flash"]["minGap"]>=333 and not v["errors"] for v in res.values())
res["ok"]=ok;print(json.dumps(res,ensure_ascii=False,indent=1))
