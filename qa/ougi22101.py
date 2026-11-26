# ★v0.22.101 奥義の絵の登録（あとで読む）。python qa/ougi22101.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();errs=[]
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={"width":1280,"height":720});pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=100000)
  r=pg.evaluate("""async()=>{const pre=Object.keys(PRE.img||{}).filter(k=>/ougi|_og_|cutin/.test(k)&&!/card_art/.test(k))/* ★v0.22.178 奥義カードの面は、ほかのカードの面と同じく起動で読む */.length;const ids=Object.keys(OUGI_ART);
    await ensureSpr(ids.map(i=>OUGI_ART[i].spr).filter(Boolean));const spr=Object.fromEntries(ids.filter(i=>OUGI_ART[i].spr).map(i=>{const s=SPR[OUGI_ART[i].spr];return[i,s&&s.frames?[s.frames.length,s.frames[0].width,s.frames[0].height,Object.keys(s.tags||{})]:null]}));
    const imgs={};for(const i of ids){for(const k of ["cutin","cutin1"]){const src=OUGI_ART[i][k];if(!src)continue;const im=await loadImg(src);imgs[i+"."+k]=im?[im.naturalWidth,im.naturalHeight]:null}}
    return{pre,n:ids.length,spr,imgs}}""")
  ng=[]
  if r["pre"]: ng.append("起動で読んでいる")
  if r["n"]!=12: ng.append("12件でない")
  for k,v in r["spr"].items():
    if not v or v[0]!=12: ng.append(["12コマでない",k,v])
  for k,v in r["imgs"].items():
    if not v or (v!=[1280,360] and v!=[640,180]): ng.append(["絵",k,v])
  print(json.dumps({"ng":ng,"r":r,"errors":errs},ensure_ascii=False));b.close()
