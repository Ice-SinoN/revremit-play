# BUG-20：押す所が原寸 28 以上か（画面ぜんぶ・小窓もふくむ）／BUG-22：予告の語（ガソリン −2 など）が途中で折り返さないか
# 使い方：python qa/bug20_22.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve()
SIZES=[(844,390,3),(932,430,3),(1280,720,1),(1920,1080,1)]
SMALL="""()=>{const s=FIT.s;return [...document.querySelectorAll('#ui button,#modal button,#tut button')].filter(b=>b.offsetParent&&!b.disabled||b.offsetParent).map(b=>{const r=b.getBoundingClientRect();return [b.textContent.trim().slice(0,10),Math.round(r.height/s*10)/10]}).filter(x=>x[1]<28)}"""
SCR=[("title","()=>{closeModal();showTitle()}"),("howto","()=>showHowto()"),("tutorial","()=>{closeModal();localStorage.clear();S.deck=null;newRun('MT')}"),("tutskip","()=>tutSkip()"),
 ("shop","()=>{closeModal();tutFinish();newRunState('MT','YUKI',[]);G.money=500;G.tickets=1;showShop({k:'shop',feat:true,sale:true})}"),("sim","()=>showSim()"),
 ("win","()=>{startBattleState('van');showWin()}"),("parts","()=>partsChoice('x',()=>{})"),("deck","()=>{S.deck=null;showDeck()}"),("garage","()=>showMinicarGarage('MT')"),
 ("rest","()=>{newRunState('MT','YUKI',[]);showRest()}"),("result","()=>{G.parts=['boost'];showResult(true)}"),("map","()=>{newRunState('MT','YUKI',[]);showMap()}"),
 ("battle_sel","()=>{startBattleState('van');enterBattle();clickCard(0)}")]
# 予告：手札のカードを全部1枚ずつ触って、.nw の行の数を見る（2行以上＝語の途中で折り返し）
WRAP="""()=>{const out=[];const ids=Object.keys(CARDS).filter(id=>!CARDS[id].gen);for(const g of [0,3,5])for(const rpm of [1000,3500,6000,7600]){
  newRunState('MT','YUKI',[]);startBattleState('van');enterBattle();B.gear=g;B.rpm=rpm;
  for(let k=0;k<ids.length;k+=6){B.hand=ids.slice(k,k+6).map(id=>inst(id));B.gas=5;S.sel=-1;
    for(let i=0;i<B.hand.length;i++){clickCard(i);document.querySelectorAll('#ui .detail .nw').forEach(el=>{if(el.getClientRects().length>1)out.push(B.hand[i].id+'@'+(g+1)+'速'+rpm+': '+el.textContent)});S.sel=-1}}}
  return [...new Set(out)].slice(0,10)}"""
res={}
with sync_playwright() as p:
  b=p.chromium.launch()
  for w,h,d in SIZES:
    pg=b.new_page(viewport={"width":w,"height":h},device_scale_factor=d);errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html.as_uri());pg.wait_for_function("window.SCREEN==='title'",timeout=20000)
    small={}
    for k,js in SCR:
      pg.evaluate(js);pg.wait_for_timeout(80);r=pg.evaluate(SMALL)
      if r:small[k]=r
    wrap=pg.evaluate(WRAP)
    res[f"{w}x{h}"]={"small":small,"wrap":wrap,"errors":errs[:3]}
    pg.close()
  b.close()
res["ok"]=all(not v["small"] and not v["wrap"] and not v["errors"] for k,v in res.items() if k!="ok")
print(json.dumps(res,ensure_ascii=False,indent=1))
