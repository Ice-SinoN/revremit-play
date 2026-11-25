# ★v0.22.3 タッチだけ（本物のタップ）で、仲間の話・予告の会話を送れるか／「とばす」で飛ばせるか。python qa/touch_scene.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={};errs=[]
SC=[("HINA","hina_op"),("HINA","first_remit"),("HINA","hina_boss_pre"),("HINA","ed1"),("MOMO","momo_op"),("MOMO","momo_boss_post"),("NANA","nana_op"),("NANA","nana_boss_pre"),("NANA","ally_next"),("YUKI","op_road")]
def pt(pg,sel):
  r=pg.evaluate(f"()=>{{const e=document.querySelector('{sel}');if(!e)return null;const r=e.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2]}}");return r
with sync_playwright() as p:
  b=p.chromium.launch()
  for vw,vh in [(1920,1080),(1366,768)]:
    ctx=b.new_context(viewport={"width":vw,"height":vh},has_touch=True,is_mobile=False);pg=ctx.new_page();pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=90000)
    pg.evaluate("()=>{localStorage.clear();SAVE.boot();qaSetProgress({slot:1,nightMax:4,night:4,chars:['HINA','MOMO','NANA']})}")
    out={}
    for ch,k in SC:
      for mode in ("send","skip"):
        pg.evaluate(f"()=>{{PRF().char='{ch}';newRunState('MT','{ch}',[]);window.__done=0;showScene('{k}',()=>{{window.__done=1}})}}");pg.wait_for_timeout(200)
        key=pg.evaluate("()=>S.sc&&S.sc.key");n=pg.evaluate("()=>S.sc?S.sc.sc.lines.length:0");taps=0;steps=[]
        if mode=="skip":
          xy=pt(pg,".scroot button.mini");pg.touchscreen.tap(*xy);taps=1;pg.wait_for_timeout(300)
        else:
          while not pg.evaluate("()=>window.__done") and taps<200:
            i0=pg.evaluate("()=>S.sc?S.sc.i:-1");xy=pt(pg,".scband") or pt(pg,".scroot .tap");pg.touchscreen.tap(*xy);taps+=1;pg.wait_for_timeout(120)
            i1=pg.evaluate("()=>S.sc?S.sc.i:-1");steps.append(i1-i0 if i1>=0 else 'end')
        jumps=[s for s in steps if isinstance(s,int) and s>1]
        out[f"{k}:{mode}"]={"key":key,"lines":n,"taps":taps,"done":pg.evaluate("()=>window.__done"),"jump>1":len(jumps)}
    R[f"{vw}x{vh}"]=out;ctx.close()
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False))
