# ★v0.22.120 BUG-54：デッキの画面で「はじめから」の札がつく行の名前が、文字「大」でも「…」で終わる（字が途中で切れたまま見えない）。4サイズ×文字 小中大×4人
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[],"cut":0}
with sync_playwright() as p:
  b=p.chromium.launch()
  for vw,vh in [(667,375),(956,440),(1280,720),(1366,768)]:
    pg=b.new_page(viewport={"width":vw,"height":vh});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    for fs in ["s","m","l"]:
      for c in ["YUKI","HINA","MOMO","NANA"]:
        r=pg.evaluate("""([c,fs])=>{qaSetProgress({slot:1,nightMax:3,chars:['HINA','MOMO','NANA'],cards:'all',tutorial:true});OPTS.fsz=fs;PRF().char=c;S.deck=null;showDeck();try{fsAll()}catch(e){}
          const rows=[...document.querySelectorAll('#dkl .dr')];let cut=0,noell=[],tagOut=0;
          rows.forEach(r=>{const n=r.querySelector('.nm'),t=r.querySelector('.sttag');if(t){const a=t.getBoundingClientRect(),q=r.getBoundingClientRect();if(a.right>q.right+0.5)tagOut++}
            if(n&&n.scrollWidth>n.clientWidth+1){cut++;if(getComputedStyle(n).textOverflow!=='ellipsis')noell.push(n.textContent)}});
          return {rows:rows.length,cut,noell,tagOut}}""",[c,fs])
        R["cut"]+=r["cut"]
        if r["noell"] or r["tagOut"]:R["ng"].append([vw,fs,c,r])
    R.setdefault("errs",[]).extend(errs);pg.close()
  b.close()
print(json.dumps(R,ensure_ascii=False))
