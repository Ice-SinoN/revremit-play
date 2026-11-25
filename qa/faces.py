# ★v0.19.1 立ち絵の表情：場面の各行で、出ている立ち絵のファイルが text.js の3つ目の欄と同じか
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve();bad=[];n=0;cnt={}
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={"width":1280,"height":720});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto(html.as_uri());pg.wait_for_function("window.SCREEN==='title'",timeout=30000)
  rows=pg.evaluate("()=>Object.entries(TEXT.scenes).flatMap(([k,s])=>s.lines.map((l,i)=>[k,i,l[0],l[2]||'']))")
  for k,i,who,face in rows:
    if who not in("YUKI","MIO","YUKI_IN"):continue
    src=pg.evaluate(f"()=>{{showScene('{k}',()=>{{}});S.sc.i={i};S.sc.shown=999;clearInterval(S.sc.t);renderScene();const im=[...document.querySelectorAll('.scbw img')].map(x=>x.getAttribute('src')||'');return im.join(' ')}}")
    n+=1;w="mio" if who=="MIO" else "yuki"
    want=pg.evaluate(f"()=>artURL(STORY_ART.bust('{'MIO' if who=='MIO' else 'YUKI'}','{face}'))")
    chars=pg.evaluate("()=>{const b=document.querySelector('.scbg');if(!b)return false;const s=b.getAttribute('src');return['opening_road','ending_garage'].some(k=>s===artURL(STORY_ART.bg(k)))}")
    if chars:
      if src.strip():bad.append([k,i+1,who,"立ち絵が出ている（キャラの一枚絵の上）"])
      cnt["一枚絵の上で立ち絵なし"]=cnt.get("一枚絵の上で立ち絵なし",0)+1;continue
    if want not in src.split(' '):bad.append([k,i+1,who,face])
    cnt[f"{w}:{face}"]=cnt.get(f"{w}:{face}",0)+1
  b.close()
print(json.dumps({"lines":n,"count":cnt,"bad":bad[:10],"errors":errs},ensure_ascii=False))
