# v0.22.131 ヒート（炎・上がる／冷める・敵 +3%・レア度・パーツ代・マップの +n）と帯（design 23-1：MT／AT／CVT の札・花の便り・説明の小窓）
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[],"errors":[]}
def ng(m):R["ng"].append(m)
OV="""(sel)=>{const a=[...document.querySelectorAll(sel)];const out=[];const others=[...document.querySelectorAll('#ui > *')].filter(e=>!e.classList.contains('yogiri'));/* ★v0.22.176 夜霧の雲は下にしく（炎は雲の上）＝重なりに数えない */
 a.forEach(e=>{const r=e.getBoundingClientRect();others.forEach(o=>{if(o===e||o.contains(e)||e.contains(o)||o.classList.contains('band')||o.classList.contains('bres')||o.classList.contains('bmode')||o.classList.contains('toast2'))return;const q=o.getBoundingClientRect();if(!q.width||!q.height)return;const st=document.querySelector('#stage').getBoundingClientRect();if(q.width>st.width*0.9)return;if(r.left<q.right-1&&r.right>q.left+1&&r.top<q.bottom-1&&r.bottom>q.top+1)out.push(e.className+' x '+o.className)})});return out}"""
with sync_playwright() as p:
  b=p.chromium.launch()
  for (w,h,d) in [(640,360,2),(844,390,3),(1280,720,1)]:
    pg=b.new_page(viewport={"width":w,"height":h},device_scale_factor=d,has_touch=True);errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    pg.evaluate("()=>{qaSetProgress({slot:1,nightMax:3,chars:['HINA','MOMO','NANA'],tutorial:true})}")
    if w==640:
      e=pg.evaluate("""()=>{const R={};PRF().char='YUKI';qaNewRun({mode:'MT',night:3});const row=G.map[G.row],j=row.findIndex(n=>n.k==='battle');row[j].wx='dry';G.path[G.row]=j;
        startBattleState('bike'in ENEMIES?'bike':nodeEnemy(row[j]));const hp0=B.e.maxhp,am0=B.am;R.w1=winRewards().heat;G.heat=5;startBattleState(B.key);R.hp=[hp0,B.e.maxhp];R.am=[am0,B.am];
        R.feat=[(G.heat=0,featCost()),(G.heat=5,featCost())];
        G.heat=0;const c0={C:0,R:0,E:0},c5={C:0,R:0,E:0};for(let i=0;i<1500;i++){rewardOptions('battle').forEach(id=>c0[rarityOf(id)]++)}G.heat=5;for(let i=0;i<1500;i++){rewardOptions('battle').forEach(id=>c5[rarityOf(id)]++)}R.c0=c0;R.c5=c5;
        G.heat=3;row[j].wx='rain';startBattleState(nodeEnemy(row[j]));R.wbad=winRewards().heat;row[j].wx='dry';G.heat=1;startBattleState('elite_wraith'in ENEMIES?'elite_wraith':Object.keys(ENEMIES).find(k=>ENEMIES[k].rank==='elite'));R.we=winRewards().heat;
        G.heat=4;startBattleState('boss1');R.wb=winRewards().heat;
        G.heat=3;const r=G.row;G.map[r][0].k='shop';G.path[r]=0;advanceRow();R.shop=G.heat;G.heat=4;G.map[G.row][0].k='garage';G.path[G.row]=0;advanceRow();R.gar=G.heat;R.max=G.heatMax;return R}""")
      if e["w1"]!=[0,1]:ng(f"勝ち +1 {e['w1']}")
      if e["wbad"]!=[3,5]:ng(f"雨で勝ち +2 {e['wbad']}")
      if e["we"]!=[1,3]:ng(f"エリート +2 {e['we']}")
      if e["wb"]!=[4,2]:ng(f"ボス −2 {e['wb']}")
      if e["shop"]!=2 or e["gar"]!=0:ng(f"冷める {e}")
      if abs(e["hp"][1]/e["hp"][0]-1.075)>0.02 or abs(e["am"][1]/e["am"][0]-1.075)>0.001:ng(f"敵 +7.5% {e['hp']} {e['am']}")
      if e["feat"][1]!=round(e["feat"][0]*1.5):ng(f"パーツ代 {e['feat']}")
      t0=sum(e["c0"].values());t5=sum(e["c5"].values())
      if not (e["c5"]["C"]/t5<e["c0"]["C"]/t0-0.1 and e["c5"]["R"]/t5>e["c0"]["R"]/t0+0.1):ng(f"レア度 {e['c0']} {e['c5']}")
      if e["max"]<5:ng(f"heatMax {e['max']}")
      R["heat"]=e
    # マップ：炎と +n
    m=pg.evaluate("""()=>{PRF().char='YUKI';qaNewRun({mode:'MT',night:3});G.heat=3;G.map[G.row].forEach((n,j)=>{if(n.k==='battle')n.wx=j%2?'rain':'dry'});showMap();
      const hb=document.querySelector('.heatb');const on=hb?hb.querySelectorAll('.hf.on').length:-1;const gs=[...document.querySelectorAll('.node .heatg')].map(e=>e.textContent);return {on,gs,n:hb&&hb.querySelectorAll('.hf').length}}""")
    if m["on"]!=3 or m["n"]!=5 or not m["gs"]:ng(f"{w}: マップの炎 {m}")
    ov=pg.evaluate(OV,".heatb");
    if ov:ng(f"{w}: マップの炎が重なる {ov}")
    pg.screenshot(path=f"/tmp/wxs/heat_map_{w}.png")
    for ch,md in [("YUKI","MT"),("YUKI","AT"),("MOMO","MT")]:
      o=pg.evaluate(f"""async ()=>{{PRF().char='{ch}';PRF().modeHelp={{}};qaNewRun({{mode:'{md}',night:3}});G.heat=2;const row=G.map[G.row],j=row.findIndex(n=>n.k==='battle');row[j].wx='dry';G.path[G.row]=j;startBattleState(nodeEnemy(row[j]));enterBattle();await new Promise(r=>setTimeout(r,1300));
        const auto=!!document.querySelector('.glpop.mhelp');const bm=document.querySelector('.bmode'),bd=document.querySelector('.band');const r=bm&&bm.getBoundingClientRect(),st=document.querySelector('#stage').getBoundingClientRect(),s=st.width/640;
        return {{auto,bm:bm&&bm.textContent,box:r&&[(r.left-st.left)/s,(r.top-st.top)/s,r.width/s,r.height/s],band:!!bd,res:document.querySelectorAll('.bres').length,old:!!document.querySelector('.modeban,.drvc')}}}}""")
      pg.screenshot(path=f"/tmp/wxs/band_{w}_{ch}_{md}.png")
      if not o["auto"]:ng(f"{w}:{ch}{md} 初めての小窓が出ない")
      if o["old"]:ng(f"{w}: 前の札が残る")
      if md=="AT" and (round(o["box"][3])!=36 or "エコ" not in o["bm"]):ng(f"{w}: AT の札 {o}")
      if md=="MT" and (round(o["box"][3])!=18 or round(o["box"][2])!=44):ng(f"{w}: MT の札 {o}")
      if ch=="MOMO" and o["res"]!=1:ng(f"{w}: 花の便りが帯にない {o}")
      ov=pg.evaluate(OV,".bmode,.bres,.heatb")
      if ov:ng(f"{w}:{ch}{md} 重なる {ov}")
      if md=="AT":
        d=pg.evaluate("async ()=>{await new Promise(r=>setTimeout(r,3200));document.querySelector('.bmode').click();await new Promise(r=>setTimeout(r,200));return [B.drive,document.querySelector('.bmode').textContent]}")
        if d[0]!="sport":ng(f"{w}: AT の札で切りかわらない {d}")
      # 2回目のランは自動で出ない
      a2=pg.evaluate(f"""async ()=>{{document.querySelectorAll('.glpop').forEach(e=>e.remove());qaNewRun({{mode:'{md}',night:3}});const row=G.map[G.row],j=row.findIndex(n=>n.k==='battle');G.path[G.row]=j;startBattleState(nodeEnemy(row[j]));enterBattle();await new Promise(r=>setTimeout(r,1300));return !!document.querySelector('.glpop.mhelp')}}""")
      if a2:ng(f"{w}:{ch}{md} 2回目も小窓が出る")
    # CVT の札（MIO がいない β では mode を CVT にしてみる）
    c=pg.evaluate("""async ()=>{PRF().char='YUKI';qaNewRun({mode:'MT',night:3});const row=G.map[G.row],j=row.findIndex(n=>n.k==='battle');G.path[G.row]=j;startBattleState(nodeEnemy(row[j]));enterBattle();G.mode='CVT';renderBattle();await new Promise(r=>setTimeout(r,300));return document.querySelector('.bmode').textContent}""")
    pg.screenshot(path=f"/tmp/wxs/band_{w}_CVT.png")
    if c!="CVT":ng(f"{w}: CVT {c}")
    R["errors"]+=errs;pg.close()
print(json.dumps(R,ensure_ascii=False,indent=1))
