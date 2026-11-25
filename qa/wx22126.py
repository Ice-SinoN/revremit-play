# v0.22.126 天候（雨・雪）：マップの札・段の1行・戦闘の背景・粒・札・帯・チェイン・凍結・得意・初めのランはドライ・ボスはドライ
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[],"errors":[]}
def ng(m):R["ng"].append(m)
SIZES=[(640,360,2),(844,390,3),(1280,720,1),(956,440,3)]
with sync_playwright() as p:
  b=p.chromium.launch()
  for (w,h,d) in SIZES:
    pg=b.new_page(viewport={"width":w,"height":h},device_scale_factor=d);errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    pg.evaluate("()=>{qaSetProgress({slot:1,nightMax:3,chars:['HINA','MOMO','NANA'],tutorial:true})}")
    # 初めのラン（runs 0）：エリア1 の最初の3段はドライ
    r=pg.evaluate("()=>{const p=PRF();p.stats=p.stats||{};p.stats.runs=0;const o=runOpts();newRunState('MT','YUKI',[],null,o);return [o.wxFirst,G.map.slice(0,3).flat().filter(n=>/battle|elite|hidden/.test(n.k)).map(n=>n.wx)]}")
    if not r[0] or any(x!="dry" for x in r[1]):ng(f"{w}: 初めのラン {r}")
    st=pg.evaluate("()=>{const c={};let boss=0;for(let i=0;i<60;i++){newRunState('MT','YUKI',[],null,{});G.map.flat().forEach(n=>{if(n.k==='boss'){if(n.wx!=='dry')boss++;return}if(n.wx)c[n.wx]=(c[n.wx]||0)+1})}return {c,boss}}")
    if st["boss"]:ng(f"{w}: ボスがドライでない")
    if set(st["c"])-{"dry","rain","snow","fog","dawn"} or not {"fog","dawn"}<=set(st["c"]):ng(f"{w}: 天候の種類 {st}")  # ★v0.22.147 A2：ふつうのマスにも霧・夜明け
    # 同じ段に同じ天候（ドライ以外）が3つ並ばない
    tri=pg.evaluate("()=>{let n=0;for(let i=0;i<60;i++){newRunState('MT','YUKI',[],null,{});G.map.forEach(r=>{const c={};r.forEach(x=>{if(x.wx&&x.wx!=='dry')c[x.wx]=(c[x.wx]||0)+1});if(Object.values(c).some(v=>v>=3))n++})}return n}")
    if tri:ng(f"{w}: 同じ段に3つ {tri}")
    # マップ：峠で雪のマスを今の段に作る
    pg.evaluate("()=>{const p=PRF();p.stats.runs=5;qaNewRun({mode:'MT',night:3});G.map[G.row].forEach((n,j)=>{if(/battle|elite/.test(n.k))n.wx=j%2?'snow':'rain'});showMap()}");pg.wait_for_timeout(300)
    m=pg.evaluate("""()=>{const r=[...document.querySelectorAll('.node .wxt')].map(e=>{const b=e.getBoundingClientRect(),nb=e.parentElement.getBoundingClientRect();return {t:e.textContent,in:b.left>=nb.left-0.5&&b.right<=nb.right+0.5&&b.top>=nb.top-0.5,cut:e.scrollWidth>e.clientWidth+1}});const lg=document.querySelector('.wxleg');return {r,lg:lg&&lg.textContent,lgcut:lg&&lg.scrollWidth>lg.clientWidth+1}}""")
    if not m["r"] or any((not x["in"]) or x["cut"] for x in m["r"]):ng(f"{w}: マップの札 {m}")
    if not m["lg"] or m["lgcut"]:ng(f"{w}: 段の1行 {m['lg']}")
    pg.screenshot(path=f"/tmp/wxs/map_{w}.png")
    # 戦闘：雪（YUKI は得意）
    for ch,wx in [("YUKI","snow"),("MOMO","snow"),("MOMO","rain"),("YUKI","rain")]:
      o=pg.evaluate(f"""async ()=>{{const p=PRF();p.char='{ch}';qaNewRun({{mode:'MT',night:3}});const row=G.map[G.row];const j=row.findIndex(n=>n.k==='battle');if(j<0)return null;row[j].wx='{wx}';G.path[G.row]=j;startBattleState(nodeEnemy(row[j]));enterBattle();await new Promise(r=>setTimeout(r,1500));
        const C=car(),br=bandRange();const bt=document.querySelector('.wxb');const bb=bt&&bt.getBoundingClientRect();
        const ov=bt?[...document.querySelectorAll('#ui .pchain,#ui .chaintag,#ui .hud,#ui .log,#ui .chain')].filter(e=>{{const r=e.getBoundingClientRect();return r.width&&!(r.right<=bb.left||r.left>=bb.right||r.bottom<=bb.top||r.top>=bb.bottom)}}).map(e=>e.className):[];
        return {{wx:B.wx,minus:wxMinus(),band:[C.band[0],C.band[1],br.lo,br.hi,C.core[0],C.core[1],br.clo,br.chi],cs:chainStep(),bt:bt&&bt.textContent,ov,base:!!A.wxBase,fx:!!(A.wxFx&&A.wxFx.fr.length===4)}}}}""")
      pg.screenshot(path=f"/tmp/wxs/bt_{w}_{ch}_{wx}.png")
      if not o:ng(f"{w}: 戦闘のマスなし");continue
      fav=(ch=="YUKI" and wx=="snow") or (ch=="MOMO" and wx=="rain")
      if o["minus"]==fav:ng(f"{w}:{ch}{wx} 得意 {o}")
      bw=o["band"][1]-o["band"][0];nw=o["band"][3]-o["band"][2];cw=o["band"][5]-o["band"][4];ncw=o["band"][7]-o["band"][6]
      if wx=="snow" and not fav and abs(nw-bw*0.7)>2:ng(f"{w}:{ch} 雪の帯 {o['band']}")
      if wx=="snow" and fav and nw!=bw:ng(f"{w}:{ch} 雪の得意の帯 {o['band']}")
      if wx=="rain" and not fav and abs(ncw-cw*0.5)>2:ng(f"{w}:{ch} 雨の芯 {o['band']}")
      if wx=="rain":
        base=(CH:={"YUKI":0.1,"MOMO":0.15}[ch])
        if abs(o["cs"]-(base+0.03))>1e-6:ng(f"{w}:{ch} 雨のチェイン {o['cs']}")
      if not o["bt"] or o["ov"]:ng(f"{w}:{ch}{wx} 札 {o}")
      if not o["base"] or not o["fx"]:ng(f"{w}:{ch}{wx} 背景・粒 {o}")
    # 雪の凍結 ×1.5
    fz=pg.evaluate("""()=>{const p=PRF();p.char='YUKI';qaNewRun({mode:'MT',night:3});const row=G.map[G.row],j=row.findIndex(n=>n.k==='battle');row[j].wx='snow';G.path[G.row]=j;startBattleState(nodeEnemy(row[j]));const f0=B.frozeTotal;OPS.freeze(4,{m:1});const a=B.frozeTotal-f0;row[j].wx='dry';startBattleState(nodeEnemy(row[j]));const f1=B.frozeTotal;OPS.freeze(4,{m:1});return [a,B.frozeTotal-f1]}""") if False else None
    # ボス・タイトルにもどると止まる
    pg.evaluate("()=>showTitle()");pg.wait_for_timeout(200)
    if pg.evaluate("()=>!!(A.wxOn||A.wxBase)"):ng(f"{w}: タイトルで天候が残る")
    R["errors"]+=errs;pg.close()
print(json.dumps(R,ensure_ascii=False,indent=1))
