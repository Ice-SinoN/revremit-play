# ★v0.22.35 シムトレーニング：全カード（専用4人＋共通＋強化で変わるもの）× 5サイズで、前／後の説明の見切れ・重なり。python qa/sim2235.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[],"more":[]};errs=[]
CHK="""()=>{const out=[],st=document.querySelector('#stage').getBoundingClientRect(),B=e=>e.getBoundingClientRect();
 const els=[...document.querySelectorAll('#ui .simc,#ui .simgo,#ui .simrow,#ui .back,#ui .hud,#ui .simarr,#ui .simmon')];
 for(const e of els){const b=B(e);if(b.left<st.left-1||b.right>st.right+1||b.top<st.top-1||b.bottom>st.bottom+1)out.push('out:'+e.className)}
 for(let i=0;i<els.length;i++)for(let j=i+1;j<els.length;j++){const a=B(els[i]),b=B(els[j]);const pr=els[i].className+els[j].className;if(pr.includes('simmon')&&!pr.includes('back')&&!pr.includes('simrow')&&!pr.includes('hud'))continue;if(a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1)out.push('overlap:'+els[i].className+'|'+els[j].className)}
 const more=[];document.querySelectorAll('#ui .simc').forEach((w,k)=>{const c=w.querySelector('.cb'),cb=B(c),wb=B(w);if(cb.bottom>wb.bottom+1)out.push('cardout'+k);
   w.querySelectorAll('.cb > span').forEach(s=>{if(s.classList.contains('bd'))return;if(s.scrollWidth>s.clientWidth+2)out.push('xclip:'+s.className+':'+s.textContent.slice(0,12));const q=B(s);if(q.bottom>cb.bottom+1)out.push('yclip:'+s.className)});
   const d=w.querySelector('.bd');if(d.scrollHeight>d.clientHeight+2){const mo=w.querySelector('.simmore');if(!mo.classList.contains('on'))out.push('noMore'+k);more.push(k);if(d.clientHeight<24)out.push('bdTiny'+k)}
   if(d.scrollWidth>d.clientWidth+2)out.push('bdX'+k)});
 return{out,more}}"""
with sync_playwright() as p:
  b=p.chromium.launch()
  for name,vw,vh,dpr in [("PC",1280,720,1),("PCbig",1920,1080,1),("iPhone17PM",956,440,3),("SE",667,375,2),("iPad",1180,820,2)]:
    pg=b.new_page(viewport={"width":vw,"height":vh},device_scale_factor=dpr);pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    ids=pg.evaluate("()=>Object.keys(CARDS).filter(id=>!CARDS[id].gen&&['YUKI','HINA','MOMO','NANA','N'].includes(CARDS[id].own)&&canUpgrade(inst(id)))")
    R.setdefault("n",{})[name]=len(ids)
    for ch in ["YUKI","HINA","MOMO","NANA"]:
      sub=pg.evaluate(f"ids=>ids.filter(id=>['N','{ch}'].includes(CARDS[id].own))",ids)
      for mode in (["MT","AT"] if name=="PC" else ["MT"]):
        pg.evaluate(f"()=>{{newRunState('{mode}','{ch}',[],null,{{night:1}})}}")
        for id in sub:
          r=pg.evaluate(f"()=>{{G.deck=[inst('{id}')];S.simSel=0;S.simX=0;showSim();return ({CHK})()}}")
          if r["out"]:R["ng"].append([name,ch,mode,id,r["out"][:3]])
          if r["more"]:R["more"].append(f"{name}:{id}")
    pg.evaluate("()=>{newRunState('MT','NANA',[],null,{night:1});S.simSel=null;showSim()}");pg.screenshot(path=f"/tmp/sim_none_{name}.png")
    longest=pg.evaluate("ids=>ids.filter(id=>['N','NANA'].includes(CARDS[id].own)).sort((a,b)=>descOf(inst(b),true,0).length-descOf(inst(a),true,0).length)[0]",ids)
    pg.evaluate(f"()=>{{G.deck=[inst('{longest}'),...G.deck];S.simSel=0;showSim()}}");pg.screenshot(path=f"/tmp/sim_long_{name}.png");R.setdefault("longest",{})[name]=longest
    pg.close()
  b.close()
R["more"]=sorted(set(R["more"]))[:30];R["errors"]=errs;print(json.dumps(R,ensure_ascii=False))
