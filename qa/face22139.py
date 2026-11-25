# v0.22.139 夜の顔 NIGHT 1〜4（design 12-3）：天候の割合・スプラッシュ・霧の夜は3段先まで（★v0.22.143 design 24-5）・雪の夜の凍結のカード・夜の画面とマップの字
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[],"errors":[]}
def ng(m):R["ng"].append(m)
with sync_playwright() as p:
  b=p.chromium.launch()
  for (w,h,d) in [(640,360,2),(844,390,3),(1280,720,1)]:
    pg=b.new_page(viewport={"width":w,"height":h},device_scale_factor=d);errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    pg.evaluate("()=>{qaSetProgress({slot:1,nightMax:4,tutorial:true,cards:'all'});PRF().modeHelp={MT:1,AT:1,CVT:1}}")
    if w==640:
      e=pg.evaluate("""()=>{const R={};const cnt=n=>{const c={};for(let i=0;i<40;i++){newRunState('MT','YUKI',[],null,{night:n});G.map.flat().forEach(x=>{if(x.wx){c[x.wx]=(c[x.wx]||0)+1}})}const t=Object.values(c).reduce((a,b)=>a+b,0);return Object.fromEntries(Object.entries(c).map(([k,v])=>[k,Math.round(v/t*100)]))};
        R.n1=cnt(1);R.n2=cnt(2);R.n3=cnt(3);R.n4=cnt(4);
        newRunState('MT','YUKI',[],null,{night:2});const el=G.map.flat().find(x=>x.k==='elite');R.sp=nodeEnemy(el);R.spE=ENEMIES[R.sp]&&[ENEMIES[R.sp].n,JSON.stringify(ENEMIES[R.sp].pat).includes('mud')];
        newRunState('MT','YUKI',[],null,{night:1});R.n1el=nodeEnemy(G.map.flat().find(x=>x.k==='elite'));
        const fr=n=>{newRunState('MT','YUKI',[],null,{night:n});G.ul=null;let f=0,t=0;for(let i=0;i<1500;i++)rewardOptions('battle').forEach(id=>{t++;if(JSON.stringify(CARDS[id].fx||[]).includes('"frz'))f++});return f/t};R.f3=fr(3);R.f4=fr(4);return R}""")
      R["eng"]=e
      if e["n2"].get("rain",0)<45:ng(f"雨の夜 {e['n2']}")
      if e["n3"].get("fog",0)<35:ng(f"霧の夜 {e['n3']}")
      if e["n4"].get("snow",0)<45:ng(f"雪の夜 {e['n4']}")
      if e["n1"].get("fog",0) or e["n1"].get("rain",0)>40:ng(f"N1 {e['n1']}")
      if not e["spE"] or e["spE"][0]!="スプラッシュ" or not e["spE"][1] or e["n1el"].startswith("splash"):ng(f"スプラッシュ {e}")
      if not e["f4"]>e["f3"]*1.15:ng(f"雪の夜の凍結 {e['f3']} {e['f4']}")
    # 霧の夜のマップ
    m=pg.evaluate("async()=>{PRF().char='YUKI';PRF().night=3;qaNewRun({mode:'MT',night:3});G.row=0;showMap();await new Promise(r=>setTimeout(r,300));const ns=[...document.querySelectorAll('.node')];const far=G.map.filter((r,i)=>i>3&&r[0].a===0).flat().length;const near=G.map.filter((r,i)=>i>=1&&i<=3).flat().filter(n=>n.k!=='hidden').length;const q=ns.filter(e=>e.textContent.includes('？')).length;return {q,far,near,face:(document.querySelector('.nface')||{}).textContent}}")
    pg.screenshot(path=f"/tmp/wxs/face3_{w}.png")
    if m["q"]<m["far"]*0.9 or m["q"]>m["far"]+3 or "霧の夜" not in (m["face"] or ""):ng(f"{w}: 霧の夜のマップ {m}")
    # 夜をえらぶ画面
    # ★v0.22.143 E13：夜をえらぶ画面は消した → 準備の画面の夜の行で N1〜N4 の名前
    n=pg.evaluate("async()=>{const t=[];for(const k of [1,2,3,4]){PRF().night=k;S.flow={mode:'MT'};showReady();await new Promise(r=>setTimeout(r,150));t.push(((document.querySelector('#ui .nface')||{}).textContent||'').trim())}return {t,gone:typeof showNights}}")
    pg.screenshot(path=f"/tmp/wxs/face_ready_{w}.png")
    if n["t"]!=["はじめての夜","雨の夜","霧の夜","雪の夜"] or n["gone"]!="undefined":ng(f"{w}: 準備の夜の行 {n}")
    lk=pg.evaluate("()=>document.querySelector('#ui').innerText")
    if "★v0." in lk or "*/" in lk:ng(f"{w}: コードの注が夜の画面に出ている")
    R["errors"]+=errs;pg.close()
print(json.dumps(R,ensure_ascii=False,indent=1))
