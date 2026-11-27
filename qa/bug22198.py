# ★v0.22.198 BUG-68（影の夜のゴーストの報酬が4択）・BUG-65 の残り（ミニカーのガレージで Esc）・ZERO の形の音が二重にならない・beta の夜の上限（②の NIGHT_CAP）。python qa/bug22198.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
with sync_playwright() as p:
  b=p.chromium.launch()
  for build in ["full","beta"]:
    pg=b.new_page(viewport={"width":1280,"height":720});pg.on("pageerror",lambda e:errs.append(str(e)))
    if build=="beta":pg.add_init_script('window.RR_BUILD="beta"')
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    q=pg.evaluate
    q("()=>{qaSetProgress({slot:1,nightMax:11,tutorial:true,chars:['HINA','MOMO','NANA','SORA','KAEDE','RIN','LUNA','MIO','KURO']});OPTS.banter=false}")
    mx=q("()=>nightMaxAvail()");R["mx_"+build]=mx
    if mx!=(11 if build=="full" else 4):R["ng"].append(["nights",build,mx])
    if build=="beta":pg.close();continue
    # BUG-68
    g=q("""async()=>{PRF().char='YUKI';qaNewRun({mode:'MT',night:6});startBattleState('kei');B.e.ghost=1;const w={name:'ゴースト',gold:10};ghostReward(w);await new Promise(r=>setTimeout(r,200));
      return [...document.querySelectorAll('#ui .ghr')].map(e=>e.getAttribute('onclick'))}""")
    R["68"]=g
    if len(g)!=4 or "ghostPick('rare')" not in g:R["ng"].append(["BUG-68",g])
    r=q("""async()=>{ghostPick('rare');await new Promise(r=>setTimeout(r,200));return S.rewards.map(id=>rarityOf(id))}""")
    R["68r"]=r
    if not r or any(x!="R" for x in r):R["ng"].append(["BUG-68 rare",r])
    # BUG-65 ミニカーのガレージ
    q("async()=>{closeModal();showTitle();await new Promise(r=>setTimeout(r,200));S.flow=null;S.flowReady=false;showMinicarGarage('MT');await new Promise(r=>setTimeout(r,500))}")
    s0=q("()=>window.SCREEN");pg.keyboard.press("ArrowDown");pg.keyboard.press("Escape");pg.wait_for_timeout(600);s1=q("()=>window.SCREEN")
    R["65"]=[s0,s1]
    if s0==s1:R["ng"].append(["BUG-65",s0,s1])
    # ★v0.22.200：zero_form の二重は ②v0.5.27 で②側から外れた（①のつなぎも外した）。② の版だけ見る
    z=q("()=>[window.ZERO&&ZERO.VERSION]")
    R["zf"]=z
    if not z[0] or z[0]<"0.5.27":R["ng"].append(["zero.js",z])
    pg.close()
  b.close()
R["errs"]=errs[:5]
print(json.dumps(R,ensure_ascii=False))
