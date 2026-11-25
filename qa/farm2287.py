# ★v0.22.87 BUG-53・BUG-52：フルオートの画面の数字の箱が枠からはみ出さない／横向きの帯が見出しとボタンをふさがない。python qa/farm2287.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
with sync_playwright() as p:
  b=p.chromium.launch()
  for vw,vh in [(390,844),(440,956),(956,440),(844,390),(1280,720)]:
    pg=b.new_page(viewport={"width":vw,"height":vh},**({"is_mobile":True,"has_touch":True,"device_scale_factor":3} if vw<1000 else {}));pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    r=pg.evaluate("""async()=>{qaSetProgress({slot:1,nightMax:4,tutorial:1});closeModal();newRunState("MT","NANA",[],null,{night:4});G.money=12345;G.hp=888;G.maxhp=999;startBattleState("boss3");B.rpm=12345;B.gas=10;
      FARM.log=9999;FARM.sum={clear:999,lose:999};fuiOpen('run');fuiNums();await new Promise(r=>setTimeout(r,300));
      const box=document.querySelector('#fu-nums');if(!box)return{none:1};const bb=box.getBoundingClientRect();const out=[];
      document.querySelectorAll('#fu-nums .fnum').forEach(f=>{const fr=f.getBoundingClientRect();[...f.children].forEach(c=>{const cr=c.getBoundingClientRect();if(cr.right>fr.right+0.5||cr.right>bb.right+0.5||cr.left<fr.left-0.5)out.push(f.innerText.replace(/\\s+/g,' ')+' :'+Math.round(cr.right-Math.min(fr.right,bb.right)))});
        const kids=[...f.children].map(c=>c.getBoundingClientRect());for(let i=1;i<kids.length;i++)if(kids[i].left<kids[i-1].right-0.5)out.push('overlap '+f.innerText);[...f.querySelectorAll('b')].forEach(x=>{if(x.scrollWidth>x.clientWidth+1)out.push('clip '+x.textContent)});const lab=f.querySelector(':scope>span');if(lab&&lab.getClientRects().length>1)out.push('wrap '+lab.textContent)});
      const rot=document.querySelector('#farmui .fuirot');const rv=rot&&getComputedStyle(rot).display!=='none'?rot.getBoundingClientRect():null;const hit=[];
      if(rv)document.querySelectorAll('#farmui button,#farmui .fhd,#farmui h1,#farmui .ftitle').forEach(e=>{const r=e.getBoundingClientRect();if(r.width&&r.top<rv.bottom-0.5&&r.bottom>rv.top)hit.push(e.textContent.trim().slice(0,10))});
      return{out,rot:!!rv,hit}}""")
    pg.screenshot(path=f"/tmp/farm_{vw}x{vh}.png");R[f"{vw}x{vh}"]=r
    if r.get("none") or r["out"] or r["hit"]:R["ng"].append([vw,vh,r])
  R["errors"]=errs
print(json.dumps(R,ensure_ascii=False,indent=1)[:2500])
