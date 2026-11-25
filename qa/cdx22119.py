# ★v0.22.119 図鑑（② v0.5.9）：はじめから（starter の配列＝今のキャラ／専用はその子）・読みのルビ（yomi・44枚）・見切れ。4サイズ。
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]}
CHK="""()=>{const bad=[];const d=document.querySelector('.cdxdet');if(!d)return['nodet'];const box=d.getBoundingClientRect();
 d.querySelectorAll('*').forEach(e=>{const r=e.getBoundingClientRect();if(!r.width)return;if(r.right>box.right+0.5||r.left<box.left-0.5)bad.push('out:'+e.className+':'+e.textContent.slice(0,12))});
 const rt=d.querySelector('.cdxrt');if(rt&&rt.getBoundingClientRect().top<box.top)bad.push('rt-above');return bad}"""
CASES=[("HINA","hyouga",True,True),("HINA","braking",False,True),("HINA","h_youda",True,True),("MOMO","m_hougou",True,True),("NANA","n_taikan",True,False),("YUKI","braking",False,True),("YUKI","fubuki",True,False),("YUKI","f_m_harucruise",True,False),("NANA","n_phoenix",False,True),("MOMO","y_og_frz",True,False)]
with sync_playwright() as p:
  b=p.chromium.launch()
  for vw,vh in [(640,360),(956,440),(1280,720),(844,390)]:
    pg=b.new_page(viewport={"width":vw,"height":vh});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    pg.evaluate("()=>{qaSetProgress({slot:1,tutorial:true,nightMax:4,cards:'all',parts:'all',chars:['HINA','MOMO','NANA']});Object.keys(CARDS).forEach(id=>{RR2.mark('c',id);RR2.mark('cu',id)});showTitle()}")
    for ch,cid,wantRuby,wantSt in CASES:
      r=pg.evaluate("""([ch,cid])=>{PRF().char=ch;showCodex('card','title');CDX.who='all';CDX.up=false;CDX.sel=cid;renderCodex();const h=document.querySelector('.cdxdet .cdxh');return {h:h?h.innerText.replace(/\\n/g,'|'):null,ruby:!!document.querySelector('.cdxdet .cdxrt'),st:!!document.querySelector('.cdxdet .cdxst')}}""",[ch,cid])
      pg.wait_for_timeout(100);bad=pg.evaluate(CHK)
      ok=r["ruby"]==wantRuby and r["st"]==wantSt and not bad
      if not ok:R["ng"].append([vw,ch,cid,r,bad])
      if vw==1280 and cid in("hyouga","braking"):pg.screenshot(path=f"/home/claude/rr/out/cdx119_{ch}_{cid}.png")
    # 一覧の小さいタイルと戦闘には出ない
    t=pg.evaluate("()=>{showCodex('card','title');CDX.sel=null;renderCodex();return document.querySelectorAll('.cdxrt,.cdxst').length}")
    if t:R["ng"].append([vw,"tile",t])
    R.setdefault("errs",[]).extend(errs);pg.close()
  b.close()
print(json.dumps(R,ensure_ascii=False))
