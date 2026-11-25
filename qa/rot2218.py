# ★v0.22.18 ローテーション（design 11-1）の画面：選ぶ画面・やめる・入れかえる・オート・灰色・ラボ。python qa/rot2218.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={};errs=[]
SETUP="()=>{newRunState('MT','YUKI',[]);G.row=1;startBattleState('van');enterBattle();B.gas=5;B.rpm=1000;B.hand=[inst('pitsign'),inst('nadare'),inst('nadare'),inst('nadare'),inst('hyouga')];B.draw=[inst('braking'),inst('braking'),inst('braking'),inst('braking')];S.sel=-1;renderBattle()}"
with sync_playwright() as p:
  b=p.chromium.launch()
  for vw,vh in [(1280,720),(844,390)]:
    pg=b.new_page(viewport={"width":vw,"height":vh});pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    pg.evaluate(SETUP);pg.wait_for_timeout(300)
    pg.evaluate("()=>{clickCard(0);doPlay(0,false)}");pg.wait_for_timeout(300)
    R[f"{vw}_modal"]=pg.evaluate("!!document.querySelector('#modal .rotp')")
    R[f"{vw}_clip"]=pg.evaluate("(()=>{const b=document.querySelector('#modal .box').getBoundingClientRect(),st=document.querySelector('#stage').getBoundingClientRect();return b.right<=st.right+1&&b.bottom<=st.bottom+1&&b.left>=st.left-1&&b.top>=st.top-1})()")
    pg.screenshot(path=f"/tmp/rot_{vw}.png")
    # やめる → 何も使わない
    pg.evaluate("()=>rotCancel()");R[f"{vw}_cancel"]=pg.evaluate("[B.hand.length,B.hand[0].id,!!B.rotT]")
    # もう一度 → 1枚えらんで入れかえる
    pg.evaluate("()=>{clickCard(0);doPlay(0,false)}");pg.wait_for_timeout(200)
    pg.evaluate("()=>{rotToggle(B.hand[4].uid);rotToggle(B.hand[1].uid)}")  # 打てる氷牙は選べない・泥はね…
    pg.wait_for_timeout(100);R[f"{vw}_sel"]=pg.evaluate("S.rot&&S.rot.sel.length")
    pg.evaluate("()=>rotGo()");pg.wait_for_timeout(200)
    R[f"{vw}_go"]=pg.evaluate("[B.hand.length,B.hand.filter(c=>c.id==='nadare').length,B.log.some(x=>x.includes('ローテーション：1 枚入れかえた'))]")
    # オート中は自動
    pg.evaluate(SETUP);pg.evaluate("()=>{AUTO.on=true;doPlay(0,false);AUTO.on=false}");pg.wait_for_timeout(200)
    R[f"{vw}_auto"]=pg.evaluate("[!!document.querySelector('#modal .rotp'),B.hand.filter(c=>c.id==='nadare').length]")
    # 灰色
    pg.evaluate("()=>{B.hand=[inst('pitsign'),inst('hyouga')];renderBattle()}");R[f"{vw}_gray"]=pg.evaluate("[document.querySelector('#ui .cs').classList.contains('no'),preview(B.hand[0]).txt]")
    # ラボ
    pg.evaluate("()=>{qaSetProgress({log:500,nightMax:1});showLab()}");pg.wait_for_timeout(300)
    R[f"{vw}_lab"]=pg.evaluate("document.body.innerText.includes('ローテーション')")
    R[f"{vw}_labclip"]=pg.evaluate("(()=>{const b=document.querySelector('.sign').getBoundingClientRect();return [...document.querySelectorAll('.lrow')].every(e=>e.getBoundingClientRect().bottom<=b.bottom+1)})()")
    pg.screenshot(path=f"/tmp/lab_{vw}.png")
    pg.close()
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False))
