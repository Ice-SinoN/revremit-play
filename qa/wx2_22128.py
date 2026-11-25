# v0.22.128 第2形態の天候（6体）・霧の予告「？」・窓が重ならない／手札にかからない
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[],"errors":[]}
def ng(m):R["ng"].append(m)
with sync_playwright() as p:
  b=p.chromium.launch()
  for (w,h,d) in [(640,360,2),(844,390,3),(1280,720,1)]:
    pg=b.new_page(viewport={"width":w,"height":h},device_scale_factor=d);errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    pg.evaluate("()=>{window.__W=[];if(window.AUDIO){const f=AUDIO.weather;AUDIO.weather=(x,o)=>__W.push(x+':'+(o&&o.boss))};qaSetProgress({slot:1,nightMax:3,chars:['HINA','MOMO','NANA'],tutorial:true})}")
    for ch,k,area in [("YUKI","boss1",0),("YUKI","boss2",1),("YUKI","boss3",2),("HINA","kuuten",2),("MOMO","sanka",2),("NANA","miketsu",2)]:
      o=pg.evaluate(f"""async ()=>{{PRF().char='{ch}';qaNewRun({{mode:'MT',night:3}});G.row=G.map.findIndex(r=>r[0].a==={area});G.path[G.row]=0;startBattleState('{k}');enterBattle();await new Promise(r=>setTimeout(r,500));__W.length=0;
        B.e.hp=Math.floor(B.e.maxhp*0.5)+1;hitEnemy(2);afterAct('ok',B.rpm);await new Promise(r=>setTimeout(r,6500));
        const lb=document.querySelector('.wxb'),it=document.querySelector('.intent');
        const ts=[...document.querySelectorAll('#ui .toast2')].map(e=>[e.offsetTop,e.offsetTop+e.offsetHeight,e.textContent]);
        return {{wx:B.wx,lb:lb&&lb.textContent,it:it&&it.textContent,snd:__W.slice(),proc:A.wxProc,ts}}}}""")
      pg.screenshot(path=f"/tmp/wxs/p2_{w}_{k}.png")
      exp={"boss1":"夕立","boss2":"吹雪","boss3":"黒い霧","kuuten":"にわか雨","sanka":"花吹雪","miketsu":"夜明け"}[k]
      if not o["lb"] or exp not in o["lb"]:ng(f"{w}:{k} 札 {o}")
      if not any(k in s for s in o["snd"]):ng(f"{w}:{k} 音 {o['snd']}")
      if k=="boss3" and "？" not in (o["it"] or ""):ng(f"{w}: 零号の霧で予告が見える {o['it']}")
      if k=="miketsu" and o["proc"]!="dawn":ng(f"{w}: 夜明けの幕 {o}")
      for a in o["ts"]:
        if a[1]>246:ng(f"{w}:{k} 窓が手札にかかる {a}")
    # 窓が3つ同時：重ならない・手札にかからない
    t=pg.evaluate("""()=>{document.querySelectorAll('#ui .toast2').forEach(e=>e.remove());toast2('みお：一言のテスト',150,5000);toast2('天候の説明のテスト',250,5000);toast2('ボスの一言のテスト。長い文で2行になるかもしれない窓です',250,5000);
      return [...document.querySelectorAll('#ui .toast2')].map(e=>[e.offsetTop,e.offsetTop+e.offsetHeight])}""")
    t.sort()
    for i in range(len(t)):
      if t[i][1]>246:ng(f"{w}: 手札にかかる {t}")
      if i and t[i][0]<t[i-1][1]:ng(f"{w}: 窓が重なる {t}")
    R["errors"]+=errs;pg.close()
print(json.dumps(R,ensure_ascii=False,indent=1))
