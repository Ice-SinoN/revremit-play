# 戻る／出るボタンが全部の画面で「ある・見える・押せる」か。スマホの全画面版で切り欠き・ホームバーの所（safe area）をよけた場合もためす
# 使い方：python qa/backbtn.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve()
SCR=[("deck","()=>{S.deck=null;showDeck()}","()=>SCREEN==='title'"),
 ("garage","()=>showMinicarGarage('MT')","()=>SCREEN==='title'"),
 ("shop","()=>{newRunState('MT','YUKI',[]);G.money=50;G.tickets=1;showShop({k:'shop',feat:true,sale:true})}","()=>SCREEN!=='shop'"),
 ("sim","()=>{newRunState('MT','YUKI',[]);showSim()}","()=>SCREEN!=='sim'"),
 ("win","()=>{newRunState('MT','YUKI',[]);startBattleState('van');showWin()}","()=>SCREEN!=='win'"),
 ("parts","()=>{newRunState('MT','YUKI',[]);partsChoice('x',()=>{window.__pd=1})}","()=>window.__pd===1")]
PROBE="""()=>{const b=document.querySelector('#ui button.back');if(!b)return {has:false};const r=b.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,top=document.elementFromPoint(cx,cy);
 const sa=FIT.SA||{t:0,r:0,b:0,l:0};const inSafe=r.left>=sa.l-0.5&&r.top>=sa.t-0.5&&r.right<=innerWidth-sa.r+0.5&&r.bottom<=innerHeight-sa.b+0.5;
 return {has:true,label:b.textContent,hNative:Math.round(r.height/FIT.s*10)/10,onTop:top===b||b.contains(top),inSafe,rect:[r.left,r.top,r.width,r.height].map(Math.round)}}"""
res={}
with sync_playwright() as p:
  br=p.chromium.launch()
  for w,h,d,sa in [(844,390,3,None),(932,430,3,None),(844,390,3,(0,47,21,47)),(932,430,3,(0,59,21,59)),(1280,720,1,None)]:
    pg=br.new_page(viewport={"width":w,"height":h},device_scale_factor=d);errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html.as_uri());pg.wait_for_function("window.SCREEN==='title'",timeout=30000)
    if sa: pg.evaluate(f"()=>{{safeArea();document.querySelector('#safep').style.padding='{sa[0]}px {sa[1]}px {sa[2]}px {sa[3]}px';fit()}}")
    out={}
    for k,js,after in SCR:
      pg.evaluate("()=>{localStorage.setItem('revremit_tutorial_done','1')}");pg.evaluate(js);pg.wait_for_timeout(120)
      r=pg.evaluate(PROBE)
      if r.get("has"):
        x=r["rect"];pg.mouse.click(x[0]+x[2]/2,x[1]+x[3]/2);pg.wait_for_timeout(150);r["worked"]=pg.evaluate(after)
      out[k]=r
    key=f"{w}x{h}"+(f" 切り欠き{sa}" if sa else "")
    res[key]={"screens":out,"errors":errs[:3]}
    pg.close()
  br.close()
res["ok"]=all(all(v.get("has") and v["onTop"] and v["inSafe"] and v["hNative"]>=28 and v.get("worked") for v in r["screens"].values()) and not r["errors"] for r in res.values())
print(json.dumps(res,ensure_ascii=False,indent=1))
