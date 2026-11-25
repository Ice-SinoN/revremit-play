# ★v0.22.24 BUG-35：手札の長い名前（字を小さく → 3行 → 「…」）。python qa/b35.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[],"cut":[]};errs=[]
HANDS=[("NANA","['n_phoenix','n_taikan','n_gaisen','n_hachiren','n_hokori']",True),("HINA","['h_sunrise','h_fullthrottle','h_saitenka','h_kickstart','slip']",True),
 ("YUKI","['slip','slip','hyouga','rinkai','nadare','hakusen','slip','counter','kyokkou','pitsign']",False),("HINA","['h_sunrise','h_fullthrottle','h_saitenka','h_kickstart','slip','slip','hyouga','nadare','slip','counter']",True)]
with sync_playwright() as p:
  b=p.chromium.launch()
  for vw,vh in [(1920,1080),(1280,720),(844,390),(667,375)]:
    pg=b.new_page(viewport={"width":vw,"height":vh});pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    for ch,hand,up in HANDS:
      r=pg.evaluate(f"""()=>{{newRunState('MT','{ch}',[]);G.row=1;startBattleState('kei');enterBattle();B.gas=9;B.gear=2;B.rpm=1000;B.hand={hand}.filter(id=>CARDS[id]).map((id,i)=>inst(id,{'true' if up else 'false'}&&i%2===0));S.sel=-1;renderBattle();
        return [...document.querySelectorAll('#ui .cs')].map((c,i)=>{{const e=c.querySelector('.cn'),q=e.getBoundingClientRect(),cr=c.getBoundingClientRect();return{{n:CD(B.hand[i]).n+(B.hand[i].up?'+':''),t:e.innerText.replace(/\\n/g,''),cls:e.className,over:e.scrollHeight>e.clientHeight+1,out:q.bottom>cr.bottom+0.5||q.top<cr.top}}}})}}""")
      for x in r:
        if x["over"] or x["out"]:R["ng"].append([vw,ch,x])
        if x["t"]!=x["n"]:R["cut"].append([vw,ch,x["n"],x["t"]])
        if "f9" in x["cls"]:R.setdefault("fit",set()).add(f"{vw} {ch} {x['n']} {x['cls']}")
      if vw==1280:pg.screenshot(path=f"/tmp/b35_{ch}_{len(hand)}.png")
    if vw==1280:
      pg.evaluate("()=>{S.deck=null;S.dkSel=null;showDeck()}");R["deckYuki"]=pg.evaluate("()=>document.querySelector('.dkdet').innerText")
    pg.close()
  b.close()
R["cut"]=sorted(set(json.dumps(x[2:],ensure_ascii=False) for x in R["cut"]))
R["fit"]=sorted(R.get("fit",[]));R["errors"]=errs;print(json.dumps(R,ensure_ascii=False,indent=0))
