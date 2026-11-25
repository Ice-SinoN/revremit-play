import sys,pathlib,json
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={}
with sync_playwright() as p:
  b=p.chromium.launch()
  for vw,vh in [(1280,720),(667,375)]:
    pg=b.new_page(viewport={"width":vw,"height":vh});pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    for c in ["YUKI","HINA","MOMO","NANA"]:
      r=pg.evaluate("""(c)=>{qaSetProgress({slot:1,nightMax:3,chars:['HINA','MOMO','NANA'],cards:'all',tutorial:true});PRF().char=c;S.deck=null;showDeck();
        const T=[...document.querySelectorAll('#dkl .dr')];const tags=T.filter(r=>r.querySelector('.sttag'));
        const clip=T.filter(r=>{const t=r.querySelector('.sttag');if(!t)return false;const a=t.getBoundingClientRect(),q=r.getBoundingClientRect();return a.right>q.right+0.5||t.scrollWidth>t.clientWidth+1});
        const want=new Set(CHARS[c].deck.map(x=>x[0])).size;return {rows:T.length,tags:tags.length,want,clip:clip.length}}""",c)
      R[f"{c}_{vw}"]=r
      if vw==1280 and c in("YUKI","HINA"):pg.screenshot(path=f"/home/claude/rr/out/dk118_{c}.png")
    pg.close()
print(json.dumps(R))
