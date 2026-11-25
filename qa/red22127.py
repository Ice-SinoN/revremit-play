# v0.22.127 レッドの演出（ふちの赤い光）・ギアで重なる BGM・設定の2行・踏みこみの絵
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[],"errors":[]}
def ng(m):R["ng"].append(m)
with sync_playwright() as p:
  b=p.chromium.launch()
  for (w,h,d) in [(640,360,2),(844,390,3),(1280,720,1),(956,440,3)]:
    pg=b.new_page(viewport={"width":w,"height":h},device_scale_factor=d);errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    if w==640:
      if not pg.evaluate("()=>!!(window.CARD_SHEET_ART&&CARD_SHEET_ART.ku_fumikomi)"):ng("踏みこみの絵がシートにない")
    pg.evaluate("""()=>{window.__L=[];const A=window.AUDIO;if(A){const g=A.bgmGear,l=A.bgmLayers,r=A.redLoop;A.bgmGear=(n,o)=>{__L.push('g'+n+'/'+(o&&o.max));};A.bgmLayers=x=>{__L.push('L'+x)};A.redLoop=(on,o)=>{__L.push('r'+on+':'+(o&&o.level))}}
      qaSetProgress({slot:1,nightMax:3,tutorial:true});PRF().char='YUKI';qaNewRun({mode:'MT',night:3});const row=G.map[G.row],j=row.findIndex(n=>n.k==='battle');row[j].wx='dry';G.path[G.row]=j;startBattleState(nodeEnemy(row[j]));enterBattle()}""")
    pg.wait_for_timeout(800)
    r=pg.evaluate("()=>{const a=__L.slice();return {cur:SND.cur,a}}")
    if not any(x.startswith("g1/6") for x in r["a"]):ng(f"{w}: 戦闘の始まりに bgmGear(1) がない {r}")
    # ギアを上げる → 重なる
    pg.evaluate("()=>{__L.length=0;B.gear=4;renderBattle()}");pg.wait_for_timeout(100)
    if "g5/6" not in pg.evaluate("()=>__L"):ng(f"{w}: 5速で bgmGear(5) がない")
    # レッド
    pg.evaluate("()=>{B.rpm=redLo()+200;A.mr=B.rpm;OPTS.redFx='full';SND.redOn=false;SND.red(B.rpm);renderBattle()}");pg.wait_for_timeout(900)
    a1=pg.evaluate("()=>A.redA");pg.screenshot(path=f"/tmp/wxs/red_{w}.png")
    pg.evaluate("()=>{B.rpm=car().limit-50;A.mr=B.rpm}");pg.wait_for_timeout(900);a2=pg.evaluate("()=>A.redA")
    if not (a1>0.05 and a2>a1):ng(f"{w}: 赤い光 {a1} {a2}")
    # 赤いふちが字にかからない＝canvas の下（#ui は上）。canvas の z と ui の z
    z=pg.evaluate("()=>{const c=document.querySelector('#cv'),u=document.querySelector('#ui');return [getComputedStyle(c).zIndex,getComputedStyle(u).zIndex,c.compareDocumentPosition(u)&4]}")
    pg.evaluate("()=>{OPTS.redFx='off'}");pg.wait_for_timeout(900)
    if pg.evaluate("()=>A.redA")>0.02:ng(f"{w}: 切でも光る")
    if "rtrue:1" not in pg.evaluate("()=>__L"):ng(f"{w}: redLoop の level")
    # 設定の画面（2行）：はみ出し
    pg.evaluate("()=>{OPTS.redFx='full';showOpts()}");pg.wait_for_timeout(300)
    o=pg.evaluate("""()=>{const box=document.querySelector('#modal .box');const bb=box.getBoundingClientRect();const st=document.querySelector('#stage').getBoundingClientRect();
      const bad=[...box.querySelectorAll('button,span,input')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&(r.right>bb.right+1||r.left<bb.left-1)}).map(e=>e.textContent);
      const rows=[...box.querySelectorAll('.oprow span:first-child')].map(e=>e.textContent);return {bad,rows,over:bb.bottom>st.bottom+1||bb.top<st.top-1,scroll:box.scrollHeight>box.clientHeight+1}}""")
    pg.screenshot(path=f"/tmp/wxs/opts_{w}.png")
    if o["bad"] or o["over"] or "レッドの演出" not in o["rows"] or "ギアで重なる曲" not in o["rows"]:ng(f"{w}: 設定 {o}")
    pg.evaluate("()=>{__L.length=0;[...document.querySelectorAll('#modal button')].find(b=>b.textContent==='切'&&b.getAttribute('onclick').includes('bgmLayer')).click()}");pg.wait_for_timeout(200)
    if not any(x.startswith("LDBHMX") for x in pg.evaluate("()=>__L")):ng(f"{w}: 切で全部のパートにもどらない")
    pg.evaluate("()=>{OPTS.bgmLayer=true;optsClose();__L.length=0;showMap()}");pg.wait_for_timeout(300)
    if not any(x.startswith("LDBHMX") for x in pg.evaluate("()=>__L")):ng(f"{w}: マップで全部のパートにもどらない {pg.evaluate('()=>__L')}")
    R["errors"]+=errs;pg.close()
print(json.dumps(R,ensure_ascii=False,indent=1))
