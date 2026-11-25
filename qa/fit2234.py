# ★v0.22.34 画面いっぱいに（iPhone 17 Pro Max・SE・Android 横長・iPad・PC）。安全な範囲（ダイナミックアイランド）をまねて確かめる。python qa/fit2234.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
DEV=[("iPhone17ProMax",956,440,3,{"l":62,"r":62,"t":0,"b":21}),("iPhoneSE",667,375,2,{"l":0,"r":0,"t":0,"b":0}),("Android",915,412,2.625,{"l":0,"r":0,"t":0,"b":0}),("iPad",1180,820,2,{"l":0,"r":0,"t":24,"b":20}),("PC",1920,1080,1,{"l":0,"r":0,"t":0,"b":0}),("PCwin",1366,768,1,{"l":0,"r":0,"t":0,"b":0})]
SCREENS=[("title","()=>{showTitle()}"),("chars","()=>{startFlow('MT');renderChars()}"),("battle","()=>{newRunState('MT','YUKI',[],null,{night:1});startBattleState('kei');enterBattle()}"),("map","()=>{newRunState('MT','HINA',[],null,{night:1});showMap&&showMap()}"),("data","()=>{G=null;showData()}")]
with sync_playwright() as p:
  b=p.chromium.launch()
  for name,w,h,dpr,sa in DEV:
    ctx=b.new_context(viewport={"width":w,"height":h},device_scale_factor=dpr,has_touch=name not in("PC","PCwin"));pg=ctx.new_page();pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    pg.evaluate(f"()=>{{const s={json.dumps(sa)};window.safeArea=()=>s;qaSetProgress({{slot:1,nightMax:2,chars:['HINA'],tutorial:true}});fit()}}")
    for sn,js in SCREENS:
      pg.evaluate(js);pg.wait_for_timeout(250)
      r=pg.evaluate(f"""()=>{{const s={json.dumps(sa)},st=document.querySelector('#stage').getBoundingClientRect(),W=innerWidth-s.l-s.r,H=innerHeight-s.t-s.b;
        const fillW=st.width/W,fillH=st.height/H;
        const inSafe=st.left>=s.l-1&&st.right<=innerWidth-s.r+1&&st.top>=s.t-1&&st.bottom<=innerHeight-s.b+1;
        const btn=[...document.querySelectorAll('#ui button')].filter(e=>{{const q=e.getBoundingClientRect();return q.width&&getComputedStyle(e).visibility!=='hidden'}}).map(e=>{{const q=e.getBoundingClientRect();return Math.min(q.width,q.height)}});
        const small=btn.filter(x=>x<22).length;
        const out=[...document.querySelectorAll('#ui *')].filter(e=>{{const q=e.getBoundingClientRect();return q.width>0&&(q.left<st.left-1||q.right>st.right+1||q.top<st.top-1||q.bottom>st.bottom+1)}}).length;
        return{{scale:+window.FIT.s.toFixed(3),fill:+Math.max(fillW,fillH).toFixed(3),ratio:+(st.width/st.height).toFixed(3),inSafe,minBtn:btn.length?+Math.min(...btn).toFixed(1):null,small,out}}}}""")
      R.setdefault(name,{})[sn]=r
      if r["fill"]<0.985 or not r["inSafe"] or r["out"] or abs(r["ratio"]-1.778)>0.01:R["ng"].append([name,sn,r])
      if sn in("battle","title"):pg.screenshot(path=f"/tmp/fit_{name}_{sn}.png")
    ctx.close()
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False))
