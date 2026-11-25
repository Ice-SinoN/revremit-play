# ★v0.22.117 ミニカー10台の絵（R-AD12）：ガレージのミニカーの一覧・持ちこみで、10人ぶんの絵が出るか（64×64 が読める・共通の絵でない）
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]}
CH=["YUKI","HINA","MOMO","NANA","SORA","KAEDE","RIN","LUNA","MIO","KURO"]
with sync_playwright() as p:
  b=p.chromium.launch()
  for vw,vh in [(1280,720),(667,375)]:
    pg=b.new_page(viewport={"width":vw,"height":vh});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    pg.evaluate("(CH)=>{qaSetProgress({slot:1,nightMax:3,chars:['HINA','MOMO','NANA'],tutorial:true});saveMinicars(CH.map((c,i)=>({v:2,id:'m'+i,char:c,rank:'A',mode:'MT',clear:true,score:5,cards:[{id:'hyouga',up:false},{id:'sasame',up:false}],part:'forged',tune:{},at:i+1})))}",CH)
    for scr,js in [("icons","(CH)=>{ui().innerHTML=CH.map((c,i)=>`<div style='position:absolute;left:${10+i*62}px;top:40px'>${mcIcon({char:c},48,'mci')}</div>`).join('')}"),("box","(CH)=>showMcBox()"),("bring","(CH)=>{S.flow={mode:'MT'};S.flowReady=true;S.mcSel=[];showMinicarGarage('MT')}")]:
      pg.evaluate(js,CH);pg.wait_for_timeout(1200)
      r=pg.evaluate("""(CH)=>{const im=[...document.querySelectorAll('#ui img')];return CH.map(c=>{const k='minicar_'+c.toLowerCase(),u=artURL(ITEM_ART(k)),e=im.filter(i=>i.getAttribute('src')===u);return [c,artHave(ITEM_ART(k)),e.length,e.length?e[0].naturalWidth:0]})}""",CH)
      got=[x[0] for x in r if x[1] and x[2]>0];bad=[x for x in r if not(x[1] and x[2]>0 and x[3]==64)]
      srcs=got
      R.setdefault(f"{scr}_{vw}",{"n":len(srcs),"chars":got,"bad":bad[:3]})
      if bad and scr=='icons' or len(got)<(10 if scr=='icons' else 4):R["ng"].append([scr,vw,len(got),bad[:2]])
      pg.screenshot(path=f"/tmp/mc_{scr}_{vw}.png")
    R.setdefault("errs",[]).extend(errs);pg.close()
  b.close()
print(json.dumps(R,ensure_ascii=False))
