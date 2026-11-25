# ★v0.22.66 ラボの改造のタブ（共通・解放ずみのキャラ）。python qa/lab2266.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
with sync_playwright() as p:
  b=p.chromium.launch()
  for vw,vh in [(1280,720),(956,440),(667,375),(1180,820)]:
    pg=b.new_page(viewport={"width":vw,"height":vh});pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    pg.evaluate("()=>{qaSetProgress({slot:1,nightMax:4,chars:['HINA','MOMO','NANA'],tutorial:true,log:5000,cards:'all'});PRF().char='MOMO';S.modTab=null;showLab();S.labTab='mod';renderLab()}")
    def st():return pg.evaluate("""()=>{const t=[...document.querySelectorAll('.modtabs button')],tb=document.querySelector('.modtabs').getBoundingClientRect(),own=[...new Set(modList(PRF()).map(id=>CARDS[id].own))];
      return{tabs:t.map(x=>x.textContent),on:t.filter(x=>x.classList.contains('main')).map(x=>x.textContent),own,n:modList(PRF()).length,clip:t.some(x=>x.scrollWidth>x.clientWidth+1||x.getBoundingClientRect().right>tb.right+1),fz:modList(PRF()).filter(id=>CARDS[id].fused).length}}""")
    a=st();pg.evaluate("()=>{PRF().codex=PRF().codex||{};PRF().codex.fuse={[FUSE.find(f=>f.id.startsWith('f_n_')).id]:1};[...document.querySelectorAll('.modtabs button')][4].click()}");c=st()
    pg.evaluate("()=>[...document.querySelectorAll('.modtabs button')][0].click()");d=st();pg.screenshot(path=f"/tmp/lab_{vw}.png")
    pg.evaluate("()=>{const L=modList(PRF());S.modSel=L[0];renderLab();modAsk&&0}");R[f"{vw}"]=[a,c,d]
    if a["on"]!=["もも"] or a["own"]!=["MOMO"] or c["own"]!=["NANA"] or c["fz"]!=1 or d["own"]!=["N"] or a["clip"] or len(a["tabs"])!=5:R["ng"].append([vw,a,c,d])
    pg.close()
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False)[:1500])
