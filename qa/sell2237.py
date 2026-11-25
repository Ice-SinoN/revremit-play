# ★v0.22.37 10-19 パーツの売却の画面：入れ替え（売値つき）・ショップの「売る」・ミニカーのパーツ。python qa/sell2237.py <html>
import sys,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();errs=[];R=[]
CHK="""()=>{const st=document.querySelector('#stage').getBoundingClientRect(),m=document.querySelector('#modal .modal .box');if(!m)return['nomodal'];const b=m.getBoundingClientRect();const o=[];
 if(b.left<st.left-1||b.right>st.right+1||b.top<st.top-1||b.bottom>st.bottom+1)o.push('modalout');
 m.querySelectorAll('button').forEach(x=>{const q=x.getBoundingClientRect();if(q.bottom>st.bottom+1||q.right>st.right+1)o.push('btnout:'+x.textContent.slice(0,8));if(x.scrollWidth>x.clientWidth+2)o.push('btnclip:'+x.textContent.slice(0,8))});return o}"""
with sync_playwright() as p:
  b=p.chromium.launch()
  for name,vw,vh,dpr in [("PC",1280,720,1),("iPhone17PM",956,440,3),("SE",667,375,2)]:
    pg=b.new_page(viewport={"width":vw,"height":vh},device_scale_factor=dpr);pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    pg.evaluate("""()=>{const mp=Object.keys(PARTS).find(p=>PARTS[p].own==='MOMO');newRunState('MT','YUKI',[{char:'MOMO',cards:[],part:mp,tune:{}}],null,{night:1});
      const pool=partPool();while(G.parts.length<RULES.partsMax)addPart(pool.shift());G.money=100;window._new=pool[0]}""")
    pg.evaluate("()=>{S.pdone=()=>{window._done=1};takePart(window._new)}");pg.wait_for_timeout(200)
    pg.click("#modal .psrow >> nth=1");pg.wait_for_timeout(150);r=pg.evaluate(CHK);R.append([name,"swap",r]);pg.screenshot(path=f"/tmp/sell_swap_{name}.png")
    m0=pg.evaluate("G.money");pg.click("#modal button.main");pg.wait_for_timeout(150);pg.screenshot(path=f"/tmp/sell_conf_{name}.png")
    pg.click("#modal button.main");pg.wait_for_timeout(150)
    R.append([name,"swapsold",pg.evaluate(f"()=>[G.money-{m0},G.parts.includes(window._new),window._done,G.parts.length]")])
    pg.evaluate("()=>{const n={feat:true,featPart:null};showShop(n)}");pg.wait_for_timeout(150);pg.screenshot(path=f"/tmp/sell_shop_{name}.png")
    pg.click("#ui .sellbtn");pg.wait_for_timeout(150);R.append([name,"shopsell",pg.evaluate(CHK)]);pg.screenshot(path=f"/tmp/sell_list_{name}.png")
    pg.click("#modal .sellrow button >> nth=0");pg.wait_for_timeout(150);txt=pg.evaluate("document.querySelector('#modal').innerText.slice(0,40)")
    pg.click("#modal button.main");pg.wait_for_timeout(150);R.append([name,"mc",txt,pg.evaluate("[G.parts.length,G.mcParts.length]")])
  b.close()
for r in R:print(r)
print("errors",errs)
