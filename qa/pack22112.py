# ★v0.22.112 まとめたシートで絵が変わらないか：元の置き場の名前で読んだ絵の画素を、前の版と比べる（マップのアイコン・キャラ選択の部品）。
# あわせて新しい版でマップとキャラ選択の画面がエラーなく出るか。python3 qa/pack22112.py <前の版の html> <新しい版の html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
HASH="""async()=>{const L=[...ART_HAVE].filter(f=>/map_icon_|ui_charsel_/.test(f)&&/\\.png$/.test(f)).sort();const o={};
 for(const f of L){const im=await new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=artURL(f)});if(!im){o[f]="NG";continue}
  const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const g=c.getContext('2d');g.drawImage(im,0,0);const d=g.getImageData(0,0,c.width,c.height).data;let h=0;for(let i=0;i<d.length;i++)h=(h*31+d[i])>>>0;o[f]=c.width+'x'+c.height+':'+h}return o}"""
def run(html,shots):
  with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={"width":1280,"height":720});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(pathlib.Path(html).resolve().as_uri());pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    h=pg.evaluate(HASH);scr={}
    if shots:
      pg.evaluate("()=>{qaSetProgress({slot:1,nightMax:3,chars:['HINA','MOMO'],tutorial:true});PRF().char='HINA';PRF().night=2;newRunState('MT','YUKI',[],null,{night:2});G.row=2;showMap()}");pg.wait_for_timeout(800)
      scr["map_imgs"]=pg.evaluate("()=>[...document.querySelectorAll('#ui img')].filter(i=>/data:|map_icon/.test(i.src)).length");pg.screenshot(path="/tmp/pk_map.png")
      pg.evaluate("()=>{S.farmChoiceOk=true;S.csSel='HINA';showCharSel()}");pg.wait_for_timeout(800)
      scr["cs_imgs"]=pg.evaluate("()=>[...document.querySelectorAll('#ui img.px,#ui .csimg,#ui .csboard')].length");pg.screenshot(path="/tmp/pk_cs.png")
    b.close();return h,errs,scr
a,ea,_=run(sys.argv[1],False);b,eb,scr=run(sys.argv[2],True)
R={"n_old":len(a),"n_new":len(b),"same":sum(1 for k in a if b.get(k)==a[k]),"diff":[k for k in a if b.get(k)!=a[k]][:10],"scr":scr,"errs":[ea,eb]}
print(json.dumps(R,ensure_ascii=False))
