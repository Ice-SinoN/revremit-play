# ★v0.22.95 design 14-3① MT と AT の差の見せ方。python qa/mode2295.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
SET="""(mode,ch,night)=>{newRunState(mode,ch,[]);G.night=night;G.row=1;startBattleState('kei');enterBattle();B.gas=9;B.gear=1;B.e.next=999;
 const b=bandRange();B.rpm=b.clo-1000;B.hand=[inst(ch==='YUKI'?'hyouga':ch==='HINA'?'h_youda':ch==='MOMO'?'m_touka':'n_hosaki'),inst('qshift'),inst('slip'),inst('braking'),inst('blip')];S.sel=-1;renderBattle()}"""
with sync_playwright() as p:
  b=p.chromium.launch()
  for vw,vh,touch in [(1280,720,False),(844,390,True),(667,375,True),(1920,1080,False)]:
    pg=b.new_page(viewport={"width":vw,"height":vh},has_touch=touch);pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    for ch in ["YUKI","HINA","MOMO","NANA"]:
      for mode in ["MT","AT"]:
        for night in [1,3]:
          pg.evaluate(f"({SET})('{mode}','{ch}',{night})");pg.wait_for_timeout(50)
          r=pg.evaluate("""()=>{const st=document.querySelector('#stage').getBoundingClientRect(),k=st.height/360,q=e=>{const r=e.getBoundingClientRect();return{l:(r.left-st.left)/k,t:(r.top-st.top)/k,r:(r.right-st.left)/k,b:(r.bottom-st.top)/k,ow:e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1}};
            const tabs=[...document.querySelectorAll('#ui .stab')].map(q),bm=document.querySelector('#ui .bmode'),mk=[...document.querySelectorAll('#ui .cs .cmd')].map(e=>e.textContent);
            const btns=[...document.querySelectorAll('#ui button.end,#ui button.sub')].map(q);
            const cv=[...document.querySelectorAll('#ui .stab')].map(e=>{const r=e.getBoundingClientRect(),x=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return x===e});
            return{tabs:tabs.length,tabCls:[...document.querySelectorAll('#ui .stab')].map(e=>e.className),ban:modeBanner().join(' '),banBox:bm?q(bm):null,/* ★v0.22.131 説明は札の小窓（design 23-1） */mk,cv,pv:preview(B.hand[0]).grade}}""")
          bad=[]
          if mode=="MT" and r["tabs"]<1: bad.append("tabなし")
          if mode=="AT" and r["tabs"]: bad.append("ATにtab")
          if not r["ban"] or r["banBox"]["ow"]: bad.append("見出し")
          if mode=="AT" and "ブローしない" not in r["ban"]: bad.append("ブローしない")
          if mode=="AT" and "×0.85" not in r["ban"]: bad.append("0.85")
          if r["mk"].count(mode)!=2: bad.append(["印",r["mk"]])
          if not all(r["cv"]): bad.append("tabが押せない")
          if r["banBox"] and r["banBox"]["r"]>=PX if False else False: pass
          if bad: R["ng"].append([vw,ch,mode,night,bad,r])
          if vw==1280 and night==3 and ch in("YUKI","MOMO"): pg.wait_for_timeout(300);pg.screenshot(path=f"/tmp/m95_{ch}_{mode}.png")
    if vw==1280 or vw==844:
      # 2回目：札でシフトして打つ（選んだカードの下の札）・出来はパーフェクト
      out=pg.evaluate(f"""async()=>{{({SET})('MT','YUKI',3);const g0=B.gear;tabShift(0);await new Promise(r=>setTimeout(r,80));const sel=S.sel,selTab=!!document.querySelector('#ui .stab.sel');
        const r=document.querySelector('#ui .stab.sel').getBoundingClientRect(),x=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
        const hit=x&&x.classList.contains('stab');x.click();await new Promise(r=>setTimeout(r,200));return{{sel,selTab,hit,gear:B.gear-g0,log:B.log.slice(-6)}}}}""")
      R.setdefault("tap",[]).append([vw,out])
      if vw==1280:
        pg.screenshot(path="/tmp/m95_perfect.png")
        # メーター：MT は跳ねる（ばね）、AT はシフトの前の回転を通ってから落ちる
        R["meter"]=pg.evaluate(f"""async()=>{{const tr=async()=>{{const xs=[];for(let k=0;k<40;k++){{await new Promise(r=>setTimeout(r,25));xs.push({{r:Math.round(A.mr),g:A.mg}})}}return xs}};
          ({SET})('MT','YUKI',3);await new Promise(r=>setTimeout(r,300));const from=B.rpm;doPlay(0,false);const to=B.rpm;const mt=await tr();
          ({SET})('AT','YUKI',3);B.rpm=bandRange().lo-200;renderBattle();await new Promise(r=>setTimeout(r,300));const a0=B.rpm,g0=B.gear;doPlay(0,false);const at=await tr();
          return{{mt:{{from,to,max:Math.max(...mt.map(x=>x.r)),last:mt[mt.length-1].r}},at:{{a0,g0,gear:B.gear,to:B.rpm,max:Math.max(...at.map(x=>x.r)),last:at[at.length-1],gseq:[...new Set(at.map(x=>x.g))]}}}}}}""")
    pg.close()
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False,indent=0))
