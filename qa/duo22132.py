# v0.22.132 撃破演出（エリアのボス）・仲間の掛け合い（5つの場面・因縁・切・自分のミニカーでは出ない）
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[],"errors":[]}
def ng(m):R["ng"].append(m)
MC="(ch)=>({char:ch,rank:'B',cards:[],part:null,stat:{}})"
with sync_playwright() as p:
  b=p.chromium.launch()
  for (w,h,d) in [(640,360,2),(844,390,3),(1280,720,1)]:
    pg=b.new_page(viewport={"width":w,"height":h},device_scale_factor=d);errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    pg.evaluate("()=>{qaSetProgress({slot:1,nightMax:3,chars:['HINA','MOMO','NANA'],tutorial:true});PRF().modeHelp={MT:1,AT:1,CVT:1};OPTS.banter=true;OPTS.remitFx=true}")
    def run(js):return pg.evaluate("async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));"+js+"}")
    # ①ランのはじめ（マップ）
    o=run(f"PRF().char='YUKI';qaNewRun({{mode:'MT',night:3}});G.bring=[({MC})('NANA')];G.duoStart=0;G.row=0;showMap();await w(1000);const d=document.querySelector('.duo');return d&&d.innerText")
    if not o or not pg.evaluate("()=>/^banter_yuki_nana_start_/.test(G.duoLast)"):ng(f"{w}: ランのはじめ（29-7）に出ない {o}")
    lo=run("document.querySelectorAll('.duo').forEach(e=>e.remove());G.duoLow=0;startBattleState('bike' in ENEMIES?'bike':Object.keys(ENEMIES)[0]);enterBattle();await w(300);G.hp=Math.floor(G.maxhp*0.25);renderBattle();await w(600);const a=G.duoLast;document.querySelectorAll('.duo').forEach(e=>e.remove());renderBattle();await w(600);return [a,!!document.querySelector('.duo')]")
    if not str(lo[0]).startswith("banter_yuki_nana_low_") or lo[1]:ng(f"{w}: 耐久3割 {lo}")
    pg.screenshot(path=f"/tmp/wxs/duo_map_{w}.png")
    # ④ボスの前（因縁 YUKI×NANA は1回目 rival）
    o=run("document.querySelectorAll('.duo').forEach(e=>e.remove());G.row=G.map.findIndex(r=>r[0].k==='boss');G.path[G.row]=0;startBattleState('boss1');enterBattle();await w(900);const d=document.querySelector('.duo');const r=d&&d.getBoundingClientRect(),st=document.querySelector('#stage').getBoundingClientRect(),k=st.height/360;return {t:d&&d.innerText,last:G.duoLast,b:r&&(r.bottom-st.top)/k}")
    pg.screenshot(path=f"/tmp/wxs/duo_boss_{w}.png")
    if not o["t"] or o["last"]!="duo_yuki_nana_rival":ng(f"{w}: 因縁 {o}")
    if o["b"] and o["b"]>246.5:ng(f"{w}: 吹き出しが手札にかかる {o}")
    o=run("document.querySelectorAll('.duo').forEach(e=>e.remove());startBattleState('boss2');enterBattle();await w(900);return G.duoLast")
    if o=="duo_yuki_nana_rival" or not o.startswith("duo_yuki_nana_boss"):ng(f"{w}: 2回目の因縁 {o}")
    # ⑤ボスを倒したあと：撃破演出 → 報酬 → 掛け合い
    o=run("document.querySelectorAll('.duo').forEach(e=>e.remove());B.e.hp=0;B.over=true;B.result='win';showWin();await w(300);const fx=window.SCREEN;await w(2600);const sc=window.SCREEN;await w(500);return {fx,sc,duo:G.duoLast,img:!!document.querySelector('.duo')}")
    if o["fx"]!="remitfx" or o["sc"]!="win":ng(f"{w}: 撃破演出 {o}")
    if not o["img"]:ng(f"{w}: 勝ったあとの掛け合い {o}")
    pg.screenshot(path=f"/tmp/wxs/duo_win_{w}.png")
    # ②休憩・③エリート
    o=run("document.querySelectorAll('.duo').forEach(e=>e.remove());showRest();await w(800);const a=!!document.querySelector('.duo');document.querySelectorAll('.duo').forEach(e=>e.remove());const ek=Object.keys(ENEMIES).find(k=>ENEMIES[k].rank==='elite'&&!ENEMIES[k].prov);startBattleState(ek);enterBattle();await w(2000);const b=!!document.querySelector('.duo');document.querySelectorAll('.duo').forEach(e=>e.remove());startBattleState('bike' in ENEMIES?'bike':Object.keys(ENEMIES)[0]);enterBattle();await w(2000);return {rest:a,elite:b,battle:!!document.querySelector('.duo')}")
    if not o["rest"] or not o["elite"] or o["battle"]:ng(f"{w}: 休憩・エリート・ふつう {o}")
    # 切／自分のミニカー
    o=run("document.querySelectorAll('.duo').forEach(e=>e.remove());OPTS.banter=false;showRest();await w(800);const a=!!document.querySelector('.duo');OPTS.banter=true;G.bring=[{char:'YUKI',rank:'B',cards:[]}];showRest();await w(800);return {off:a,own:!!document.querySelector('.duo')}")
    if o["off"] or o["own"]:ng(f"{w}: 切・自分のミニカー {o}")
    lk=run("PRF().char='MOMO';qaNewRun({mode:'MT',night:3});const row=G.map[G.row],j=row.findIndex(n=>n.k==='battle');G.path[G.row]=j;startBattleState(nodeEnemy(row[j]));enterBattle();await w(300);const t=document.querySelector('#ui').innerText;showMap();await w(200);return t+document.querySelector('#ui').innerText")
    if "★v0." in lk or "*/" in lk:ng(f"{w}: コードの注が画面に出ている")
    R["errors"]+=errs;pg.close()
print(json.dumps(R,ensure_ascii=False,indent=1))
