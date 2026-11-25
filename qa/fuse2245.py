# ★v0.22.45 合成の画面：24組 × 3サイズで、材料・できあがり・ボタンが画面の中・重ならない。python qa/fuse2245.py <html>
import sys,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();ng=[];errs=[]
CHK="""()=>{const st=document.querySelector('#stage').getBoundingClientRect(),B=e=>e.getBoundingClientRect(),o=[];
 const els=[...document.querySelectorAll('#ui .simc,#ui .fmats,#ui .simgo,#ui .simtabs,#ui .back,#ui .simrow')];
 for(const e of els){const b=B(e);if(b.left<st.left-1||b.right>st.right+1||b.top<st.top-1||b.bottom>st.bottom+1)o.push('out:'+e.className)}
 for(let i=0;i<els.length;i++)for(let j=i+1;j<els.length;j++){const a=B(els[i]),b=B(els[j]);if(a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1){const n=els[i].className+'|'+els[j].className;if(!/simgo.*(simc|fmats)|(simc|fmats).*simgo/.test(n))o.push('ov:'+n)}}
 const g=document.querySelector('#ui .simgo');if(g){const a=B(g);for(const e of document.querySelectorAll('#ui .simc .cb,#ui .fmrow')){const b=B(e);if(a.top<b.bottom-1&&b.top<a.bottom-1&&a.left<b.right-1&&b.left<a.right-1)o.push('btn-over-card')}}
 return o}"""
with sync_playwright() as p:
  b=p.chromium.launch()
  for name,vw,vh,dpr in [("PC",1280,720,1),("iPhone17PM",956,440,3),("SE",667,375,2)]:
    pg=b.new_page(viewport={"width":vw,"height":vh},device_scale_factor=dpr);pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    for f in pg.evaluate("FUSE.map(f=>[f.a,f.b,f.id,CARDS[f.id].own])"):
      a,bb,i,ch=f
      r=pg.evaluate(f"()=>{{newRunState('MT','{ch}',[],null,{{night:1}});G.deck=[inst('{a}',true),inst('{bb}',true),inst('braking')];S.simTab='fuse';S.fuseSel='{i}';showSim();return ({CHK})()}}")
      if r:ng.append([name,i,r[:3]])
    pg.evaluate("()=>{newRunState('MT','NANA',[],null,{night:1});G.deck=[inst('n_taikan',true),inst('n_totsugeki',true)];S.simTab='fuse';S.fuseSel='f_n_taikantotsugeki';showSim()}");pg.screenshot(path=f"/tmp/fuse_{name}.png")
  b.close()
print({"ng":ng,"errors":errs})
