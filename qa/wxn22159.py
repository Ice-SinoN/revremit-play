# ★v0.22.159 QA の気になる所：文字「大」・MOMO の AT で「霧 防御 +2」が資源の帯（2段）にかからない（3サイズ）。python qa/wxn22159.py <html>
import sys,json,pathlib
R={'ng':[]}
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
  b=p.chromium.launch()
  for vw,vh in [(667,375),(844,390),(1280,720)]:
    pg=b.new_page(viewport={"width":vw,"height":vh});pg.goto(pathlib.Path(sys.argv[1]).resolve().as_uri());pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    r=pg.evaluate("""async()=>{qaSetProgress({slot:1,nightMax:3,chars:['MOMO'],tutorial:true});PRF().modeHelp={MT:1,AT:1,CVT:1};OPTS.fsz='l';PRF().char='MOMO';qaNewRun({mode:'AT',night:2});startBattleState('kei');enterBattle();await new Promise(r=>setTimeout(r,1200));try{fsAll()}catch(e){}
      wxBlkNote(2);renderBattle();try{fsAll()}catch(e){};await new Promise(r=>setTimeout(r,100));const n=document.querySelector('#ui .drvnote.wxn').getBoundingClientRect();
      const hit=[...document.querySelectorAll('#ui .bmode,#ui .bmode *,#ui .resb,#ui .resb *,#ui [class*=band]')].filter(e=>{const q=e.getBoundingClientRect();return q.width>0&&n.left<q.right-0.5&&q.left<n.right-0.5&&n.top<q.bottom-0.5&&q.top<n.bottom-0.5}).map(e=>e.className);return hit}""")
    R[str(vw)]=r
    if r:R['ng'].append([vw,r])
    pg.close()
  b.close()
print(json.dumps(R,ensure_ascii=False))
