# ★v0.22.205 ②v0.5.31（farm の手当てを外した・BUG-73・zero_link_nana）・スタッフロールの道具の行（text v0.22.81 53-1）。python qa/v22205.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={"width":1280,"height":720});pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
  q=pg.evaluate
  q("()=>{qaSetProgress({slot:1,nightMax:11,tutorial:true,chars:['HINA','MOMO','NANA','SORA','KAEDE','RIN','LUNA','KURO','MIO']});OPTS.banter=false}")
  c=q("""async()=>{showCredits(()=>{},{replay:1});await new Promise(r=>setTimeout(r,500));const pg=document.querySelector('.crroot .crpage');
    pg.innerHTML='<div class="crh">使った道具</div><div class="crb">'+CREDITS_TOOL_TXT.A+'</div>';pg.classList.add('on');await new Promise(r=>setTimeout(r,100));
    const r=[pg.scrollHeight,pg.clientHeight,pg.scrollWidth,pg.clientWidth,CREDITS_TOOL_TXT.A];const sk=document.querySelector('.crskip');if(sk)sk.click();return r}""")
  R["credits"]=c
  if c[0]>c[1]+1 or c[2]>c[3]+1 or "PixelMplus" not in c[4] or "ChatGPT" not in c[4]:R["ng"].append(["credits",c])
  z=q("()=>[typeof AUTOBOT!=='undefined'&&!!AUTOBOT.battle.__stall,[...document.scripts].some(s=>s.textContent.includes('これが、最後の相手ですのね'))?'最後の相手':'']")
  R["p2"]=z
  if z[0] or "最後の相手" not in z[1]:R["ng"].append(["p2",z])
  pg.close();b.close()
R["errs"]=errs[:5]
if errs:R["ng"].append(["errs",errs[:3]])
print(json.dumps(R,ensure_ascii=False))
