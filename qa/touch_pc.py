# ★v0.20.1 タッチ画面の PC：押す所の大きさ（実寸 mm）・隣との間・一覧のドラッグ・長押し・ピンチ
# 使い方：python qa/touch_pc.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve()
PC=[(1920,1080,1,15.6),(1920,1080,1,23.8),(1366,768,1,15.6),(2560,1440,1,27),(1536,864,1.25,15.6)]
SCR=[("title","()=>{closeModal();showTitle()}"),("data","()=>showData()"),("howto","()=>{showTitle();showHowto()}"),
 ("deck","()=>{closeModal();S.deck=null;showDeck()}"),("garage","()=>showMinicarGarage('MT')"),
 ("map","()=>{tutMark();newRunState('MT','YUKI',[]);showMap()}"),("battle","()=>{startBattleState('van');enterBattle()}"),("battle_sel","()=>{clickCard(0)}"),
 ("shop","()=>{newRunState('MT','YUKI',[]);G.money=500;G.tickets=1;showShop({k:'shop',feat:true,sale:true})}"),("sim","()=>showSim()"),
 ("win","()=>{startBattleState('van');showWin()}"),("parts","()=>partsChoice('x',()=>{})"),("rest","()=>{newRunState('MT','YUKI',[]);showRest()}"),
 ("result","()=>{G.parts=['boost'];showResult(true)}"),("scene","()=>{showScene('op',()=>{})}"),("tutorial","()=>{closeModal();startTutorial(showTitle)}")]
TGT="""()=>{const s=FIT.s,sel='#ui button,#modal button,#tut button,#ui .card,#ui .node,#ui .cs,#ui [onclick],#modal [onclick],#tut [onclick]';
 const els=[...new Set(document.querySelectorAll(sel))].filter(e=>{const r=e.getBoundingClientRect();if(!r.width||!r.height||e.disabled)return false;
   const t=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return t&&(t===e||e.contains(t))});
 const R=els.filter(e=>!els.some(o=>o!==e&&o.contains(e))).map(e=>{const r=e.getBoundingClientRect();return{t:(e.textContent||e.className).trim().slice(0,8),x:r.left,y:r.top,w:r.width,h:r.height}});
 let pairs=[];for(let i=0;i<R.length;i++)for(let j=i+1;j<R.length;j++){const a=R[i],b=R[j];
   const gx=Math.max(0,Math.max(a.x,b.x)-Math.min(a.x+a.w,b.x+b.w)),gy=Math.max(0,Math.max(a.y,b.y)-Math.min(a.y+a.h,b.y+b.h));
   if(gx<1e-6&&gy<1e-6)continue;const g=Math.max(gx,gy);if(g/s<4)pairs.push([a.t,b.t,Math.round(g/s*10)/10])}
 return{scale:s,n:R.length,min:R.map(r=>({t:r.t,w:r.w,h:r.h,m:Math.min(r.w,r.h)})).sort((a,b)=>a.m-b.m).slice(0,3),close:pairs.slice(0,6)}}"""
def drag(pg,sel,dy):
  r=pg.evaluate(f"()=>{{const e=document.querySelector('{sel}');if(!e)return null;const r=e.getBoundingClientRect();return{{x:r.left+r.width*0.3,y:r.top+r.height*0.6,top:e.scrollTop,max:e.scrollHeight-e.clientHeight,state:JSON.stringify([window.S&&S.deck,window.S&&S.mcSel])}}}}")
  if not r:return {"none":sel}
  c=pg.context.new_cdp_session(pg);x,y=r["x"],r["y"]
  c.send("Input.dispatchTouchEvent",{"type":"touchStart","touchPoints":[{"x":x,"y":y}]})
  for k in range(1,11):c.send("Input.dispatchTouchEvent",{"type":"touchMove","touchPoints":[{"x":x,"y":y-dy*k/10}]});pg.wait_for_timeout(16)
  c.send("Input.dispatchTouchEvent",{"type":"touchEnd","touchPoints":[]});pg.wait_for_timeout(400)
  a=pg.evaluate(f"()=>{{const e=document.querySelector('{sel}');return{{top:e.scrollTop,state:JSON.stringify([window.S&&S.deck,window.S&&S.mcSel])}}}}")
  return{"scrolled":round(a["top"]-r["top"]),"canScroll":r["max"],"tappedByDrag":a["state"]!=r["state"]}
res={};
with sync_playwright() as p:
  b=p.chromium.launch()
  for w,h,d,inch in PC:
    ctx=b.new_context(viewport={"width":w,"height":h},device_scale_factor=d,has_touch=True);pg=ctx.new_page();errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html.as_uri());pg.wait_for_function("window.SCREEN==='title'",timeout=60000)
    ppi=((w*d)**2+(h*d)**2)**0.5/inch;mm=lambda css:round(css*d/ppi*25.4,1)
    out={"ppi":round(ppi),"screens":{}};small=[];close=[]
    for k,js in SCR:
      pg.evaluate(js);pg.wait_for_timeout(150);t=pg.evaluate(TGT)
      m=t["min"][0] if t["min"] else None
      out["screens"][k]={"n":t["n"],"smallest":f"{m['t']} {mm(m['w'])}×{mm(m['h'])}mm" if m else "-"}
      if m and mm(m["m"])<9:small.append([k,m["t"],mm(m["w"]),mm(m["h"])])
      if t["close"]:close.append([k,t["close"]])
    out["scale"]=t["scale"];out["under9mm"]=small;out["close<4px"]=close
    pg.evaluate("()=>{if(window.TUTORIAL_ON){TUTS.force=1;tutFinish()}closeModal();S.deck=null;showDeck()}");pg.wait_for_timeout(150);out["tutOff"]=pg.evaluate("()=>!window.TUTORIAL_ON");out["drag_deck"]=drag(pg,"#dkl",300)
    pg.evaluate("()=>{const a=loadMinicars();for(let i=0;i<12;i++)a.push({v:2,id:'t'+i,char:'YUKI',rank:'B',mode:'MT',clear:false,score:1,cards:[{id:'hyouga'}],part:null,tune:{},at:i});saveMinicars(a);S.mcSel=[];showMinicarGarage('MT')}");pg.wait_for_timeout(150)
    out["drag_garage"]=drag(pg,"#mcl",300)
    pg.evaluate("()=>{showTitle();showHowto()}");pg.wait_for_timeout(150);out["drag_howto"]=drag(pg,"#modal .scroll",300)
    out["longpress_menu_blocked"]=pg.evaluate("()=>{const e=new MouseEvent('contextmenu',{bubbles:true,cancelable:true});document.querySelector('#ui').dispatchEvent(e);return e.defaultPrevented}")
    out["pinch_off"]=pg.evaluate("()=>getComputedStyle(document.documentElement).touchAction")
    out["errors"]=errs;res[f"{w}x{h}@{d} {inch}in"]=out;ctx.close()
  b.close()
print(json.dumps(res,ensure_ascii=False,indent=1))
