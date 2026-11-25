# ★v0.22.98 ドライブモードの画面。python qa/drive2298.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
with sync_playwright() as p:
  b=p.chromium.launch()
  for vw,vh,touch in [(1280,720,False),(844,390,True),(667,375,True),(1920,1080,False)]:
    pg=b.new_page(viewport={"width":vw,"height":vh},has_touch=touch);pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    for ch in ["YUKI","HINA","MOMO","NANA"]:
      r=pg.evaluate(f"""async()=>{{const log=[];const o=SND.se;SND.se=(id,a)=>{{log.push(id);return o.call(SND,id,a)}};const w=ms=>new Promise(r=>setTimeout(r,ms));
        newRunState('AT','{ch}',[]);G.night=3;G.row=1;startBattleState('kei');enterBattle();B.e.next=999;B.e.hp=B.e.maxhp=999;await w(400);renderBattle();
        const st=document.querySelector('#stage').getBoundingClientRect(),k=st.height/360,q=e=>{{const r=e.getBoundingClientRect();return{{l:(r.left-st.left)/k,t:(r.top-st.top)/k,r:(r.right-st.left)/k,b:(r.bottom-st.top)/k,ow:e.scrollWidth>e.clientWidth+1}}}};
        const box=document.querySelector('#ui .bmode.two');const bx=box&&q(box),bn={{t:999}};const dv=[box];/* ★v0.22.131 design 23-1：AT の札（44×36）をタップで切りかえ */
        const hit=dv.every(e=>{{const r=e.getBoundingClientRect(),x=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return x===e}});const ow=dv.some(e=>e.scrollWidth>e.clientWidth+1);
        document.querySelectorAll('.glpop').forEach(e=>e.remove());if(window.GLOSS)GLOSS.pop=null;const g0=B.gas,m0=gearMult(),ban0=modeBanner().join(' ');dv[0].click();await w(80);const g1=B.gas,m1=gearMult(),d1=B.drive,ban1=modeBanner().join(' ');
        document.querySelector('#ui .bmode.two').click();await w(50);const d2=B.drive;document.querySelectorAll('.glpop').forEach(e=>e.remove());
        B.hand=[inst(B.hand[0].id)];B.rpm=1000;renderBattle();doPlay(0,false);await w(500);const off=document.querySelector('#ui .bmode.two').classList.contains('off');
        SND.se=o;return{{bx,bn,hit,ow,overlap:bx&&bx.b>bn.t+0.5,g0,m0,g1,m1,d1,d2,off,ban0,ban1,snd:log.filter(x=>x.startsWith('drive')||x==='card_cant')}}}}""")
      bad=[]
      if not r["bx"]: bad.append("なし")
      else:
        if r["overlap"] or not r["hit"] or r["ow"] or r["bx"]["l"]<0: bad.append("配置")
        if not(r["d1"]=="sport" and r["g1"]==r["g0"]-(0 if ch=="MOMO" else 1) and r["m1"]>r["m0"]): bad.append("切りかえ")
        if r["d2"]!="sport": bad.append("2回目が効いた")
        if not r["off"]: bad.append("打ったあとも押せる")
        if r["snd"][:1]!=["drive_sport"] or "drive_eco" in r["snd"]: bad.append(["音",r["snd"]])
        if "スポーツ" not in r["ban1"]: bad.append("見出し")
      if bad: R["ng"].append([vw,ch,bad,r])
      if vw==1280 and ch=="YUKI": R["r"]=r;pg.screenshot(path="/tmp/drv98.png")
    pg.close()
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False,indent=0))
