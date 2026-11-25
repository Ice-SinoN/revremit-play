# ★v0.22.13 デッキを組む画面：タップで効果・2枚を並べる・入れ替え・はみ出し。python qa/deck2213.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
OVER="""()=>{const out=[];const box=e=>e.getBoundingClientRect();const st=document.querySelector('#stage').getBoundingClientRect();
 const els=[...document.querySelectorAll('.dkdet,.dkswap,#ui .sign.side,#ui .col,#ui .back,#dkl')];
 for(const e of els){const b=box(e);if(b.right>st.right+1||b.bottom>st.bottom+1)out.push('out:'+e.className);
  if(e.classList.contains('dkdet')&&e.scrollWidth>e.clientWidth+1)out.push('xscroll');}
 for(let i=0;i<els.length;i++)for(let j=i+1;j<els.length;j++){const a=box(els[i]),b=box(els[j]);
  if(a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1)out.push('overlap:'+els[i].className+'|'+els[j].className)}
 document.querySelectorAll('.dkdet *').forEach(e=>{if(e.children.length===0&&e.scrollWidth>e.clientWidth+2)out.push('clip:'+e.textContent.slice(0,10))});return out}"""
with sync_playwright() as p:
  b=p.chromium.launch()
  for vw,vh in [(1280,720),(1920,1080),(1366,768),(844,390)]:
    pg=b.new_page(viewport={"width":vw,"height":vh});pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    for ch in ["YUKI","HINA","MOMO","NANA"]:
      pg.evaluate(f"()=>{{qaSetProgress({{cards:'all',chars:['HINA','MOMO','NANA']}});PRF().char='{ch}';S.deck=null;S.dkSel=S.dkCmp=null;showDeck()}}")
      ids=pg.evaluate("deckPool(curChar())")
      R.setdefault("cards",{})[ch]=len(ids)
      if pg.evaluate("document.querySelector('.dkdet').innerText.length")<5:R["ng"].append(ch+":hint")
      for i,id in enumerate(ids):
        pg.evaluate(f"deckPick('{id}')")
        o=pg.evaluate(OVER)
        if o:R["ng"].append(f"{vw}:{ch}:{id}:{o[:3]}")
        t=pg.evaluate("document.querySelector('.dkdet').innerText")
        if pg.evaluate(f"CARDS['{id}'].n") not in t:R["ng"].append(f"{ch}:{id}:noname")
      # 入れ替え
      inDeck=[k for k,v in pg.evaluate("S.deck").items() if v>0]
      pg.evaluate(f"()=>{{S.dkSel=null;S.dkCmp=null;deckPick('{inDeck[0]}')}}")
      tgt=[x for x in ids if x!=inDeck[0] and pg.evaluate(f"(S.deck['{x}']||0)<deckLimitOf('{x}')")][0]
      pg.evaluate(f"deckPick('{tgt}')");n0=pg.evaluate("deckCount(S.deck)");a0=pg.evaluate(f"S.deck['{inDeck[0]}']||0");b0=pg.evaluate(f"S.deck['{tgt}']||0")
      if vw==1280 and ch=="MOMO":pg.screenshot(path="/tmp/deck_two.png")
      pg.click(".dkswap")
      ok=pg.evaluate("deckCount(S.deck)")==n0 and pg.evaluate(f"S.deck['{inDeck[0]}']||0")==a0-1 and pg.evaluate(f"S.deck['{tgt}']||0")==b0+1
      if not ok:R["ng"].append(f"{ch}:swap")
      # ＋−は選択を変えない
      pg.evaluate("()=>{}");sel=pg.evaluate("S.dkSel");pg.click("#dkl .dr .mini:not([disabled])");
      if pg.evaluate("S.dkSel")!=sel:R["ng"].append(f"{ch}:plusSelects")
    pg.close()
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False))
