# ★v0.22.142 C6（★v0.22.148 BUG-60：印は数字の板の金の縁〈.cv.wkv・シフトで弱点は .sh〉・中身は説明の窓「弱点 ×1.3」・7枚・9枚 × 文字 小中大で重ならない ／★v0.22.143 BUG-60：字は「×1.3」・右上・種類の札〈.ck〉・数字の札〈.cv〉・回転〈.cc〉・名前と重ならない）：手札の弱点の印。見つける前は出ない／見つけたら今のギアで弱点のアタックに「弱」／MT でシフトして弱点に入るなら「弱▲」／アタック以外・ふつうの敵・弱点の外のギアは出ない／AT は自動シフトのあと／印は札の中（4サイズ）・強さは同じ（予告のダメージが印の前後で同じ）。python qa/wk22142.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
JS="""async(mode)=>{qaSetProgress({slot:1,nightMax:3,chars:['HINA'],tutorial:true});PRF().weakSeen={};const W=ms=>new Promise(r=>setTimeout(r,ms));
 const tabs=()=>[...document.querySelectorAll('#ui .cv.wkv')].map(e=>e.classList.contains('sh')?'sh':'wk');const o={};
 newRunState(mode,'YUKI',[]);G.night=1;G.row=1;startBattleState('boss1');enterBattle();await W(1500);G.weakSeen={};
 const set=(g,rpm,hand)=>{B.gear=g;B.rpm=rpm;B.gas=9;B.e.next=999;B.hand=hand.map(x=>inst(x));S.sel=-1;renderBattle()};
 set(0,1000,['hyouga','counter','hyouga']);o.unknown=tabs();
 G.weakSeen[weakKey(B.e)]=1;set(0,1000,['hyouga','counter','hyouga']);o.low1=tabs();
 const st=document.getElementById('stage').getBoundingClientRect(),k=st.width/640;o.inCard=[...document.querySelectorAll('#ui .cv.wkv')].every((e,i)=>{const r=e.getBoundingClientRect();return r.width>0&&r.left>=st.left+(RES.hand.x)*k-1&&r.bottom<=st.top+(RES.hand.y+RES.hand.ch)*k+1});
 o.crowd={};for(const fz of ['s','m','l'])for(const nh of [7,9]){OPTS.fsz=fz;const ids=['hyouga','y_og_frz','hakusen','y_og_red','counter','sasame','hyouga','hakusen','y_og_frz'].slice(0,nh);B.gear=1;B.rpm=5000;set(B.gear,5000,ids);B.gear=1;renderBattle();try{fsAll()}catch(e){}
   const hit2=(a,b)=>a.left<b.right-0.5&&b.left<a.right-0.5&&a.top<b.bottom-0.5&&b.top<a.bottom-0.5;const cards=[...document.querySelectorAll('#ui .cs')];
   o.crowd[fz+nh]=[...document.querySelectorAll('#ui .cv.wkv')].map(e=>{const r=e.getBoundingClientRect();const bad=[...document.querySelectorAll('#ui .cc,#ui .ca,#ui .ck,#ui .cv,#ui .cn')].filter(x=>x!==e).filter(x=>{const q=x.getBoundingClientRect();if(!hit2(r,q))return false;const pt=document.elementFromPoint((Math.max(r.left,q.left)+Math.min(r.right,q.right))/2,(Math.max(r.top,q.top)+Math.min(r.bottom,q.bottom))/2);return pt&&(pt===x||x.contains(pt))}).map(x=>x.className+':'+x.textContent);const fit=true;return {t:e.textContent,bad,fit}}).filter(x=>x.bad.length||!x.fit)}
 OPTS.fsz='m';
 set(0,1000,['hyouga','y_og_frz','hakusen','y_og_red','counter','sasame','hyouga']);const hit=(a,b)=>a.left<b.right-0.5&&b.left<a.right-0.5&&a.top<b.bottom-0.5&&b.top<a.bottom-0.5;
 o.over=[...document.querySelectorAll('#ui .cv.wkv')].map(e=>{const r=e.getBoundingClientRect();return [...document.querySelectorAll('#ui .ck,#ui .cc,#ui .cn')].filter(x=>{const q=x.getBoundingClientRect();if(!hit(r,q))return false;const pt=document.elementFromPoint((Math.max(r.left,q.left)+Math.min(r.right,q.right))/2,(Math.max(r.top,q.top)+Math.min(r.bottom,q.bottom))/2);return pt&&(pt===x||x.contains(pt))}).map(x=>x.className+':'+x.textContent)}).flat();o.n7=document.querySelectorAll('#ui .cv.wkv').length;S.sel=0;renderBattle();o.det=(document.querySelector('.detail .wkd')||{}).textContent||'';
 set(3,1000,['hyouga']);o.low4=tabs();
 startBattleState('boss2');enterBattle();await W(600);G.weakSeen[weakKey(B.e)]=1;set(1,5000,['hyouga']);o.mid2=tabs();set(2,1000,['hyouga']);o.mid3=tabs();
 const d0=simulateCard(0,false);
 startBattleState('kei');enterBattle();await W(300);set(0,1000,['hyouga']);o.normal=tabs();return o}"""
with sync_playwright() as p:
  b=p.chromium.launch()
  for vw,vh in [(667,375),(956,440),(1280,720),(1920,1080)]:
    for mode in ["MT","AT"]:
      pg=b.new_page(viewport={"width":vw,"height":vh});pg.on("pageerror",lambda e:errs.append(str(e)))
      pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
      o=pg.evaluate(JS,mode);R.setdefault(mode,o)
      exp={"unknown":[],"low1":["wk","wk"],"low4":[],"mid3":["wk"],"normal":[]}
      exp["mid2"]=["sh"] if mode=="MT" else (o["mid2"] if o["mid2"] in ([],["wk"]) else ["x"])
      for k,v in exp.items():
        if o[k]!=v:R["ng"].append([vw,mode,k,o[k]])
      if not o["inCard"]:R["ng"].append([vw,mode,"inCard"])
      if any(o["crowd"].values()):R["ng"].append([vw,mode,"crowd",{k:v for k,v in o["crowd"].items() if v}])
      if o["det"]!="弱点 ×1.3":R["ng"].append([vw,mode,"det",o["det"]])
      if o["over"] or o["n7"]<4:R["ng"].append([vw,mode,"over",o["over"],o["n7"]])
      if vw==1280 and mode=="MT":pg.screenshot(path="/tmp/wk142.png")
      pg.close()
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False))
