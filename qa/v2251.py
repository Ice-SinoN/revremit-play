# ★v0.22.51：説明の窓の「改造：…」の行が見える所にあるか（いちばん長い説明＋強化＋改造）、型のメモの名前（10字）がボタンの枠に入るか。python qa/v2251.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
with sync_playwright() as p:
  b=p.chromium.launch()
  for vw,vh in [(1920,1080),(1280,720),(956,440),(667,375),(1180,820)]:
    pg=b.new_page(viewport={"width":vw,"height":vh});pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    ids=pg.evaluate("()=>Object.keys(CARDS).filter(id=>modKind&&modKind(id)&&['YUKI','NANA','HINA','MOMO','N'].includes(CARDS[id].own)).map(id=>[id,CARDS[id].own,[...descOf(inst(id,true),true,7)].length]).sort((a,b)=>b[2]-a[2]).slice(0,5)")
    for id,o,_ in ids:
      ch=o if o!="N" else "YUKI"
      for br in ["A","B"]:
        r=pg.evaluate(f"""()=>{{PRF().mods=PRF().mods||{{}};PRF().mods['{id}']={{lv:2,br:'{br}'}};newRunState('MT','{ch}',[]);G.row=1;startBattleState('kei');enterBattle();B.gas=9;B.gear=2;B.rpm=1000;B.hand=[inst('{id}',true),inst('hyouga'),inst('slip')];S.sel=0;renderBattle();
          const d=document.querySelector('.detail'),m=d&&d.querySelector('.dmod');if(!m)return{{none:1,dm:CD(B.hand[0]).dMod||null}};const r=d.getBoundingClientRect(),q=m.getBoundingClientRect();
          return{{t:m.textContent,vis:q.top>=r.top-0.5&&q.bottom<=r.bottom+0.5&&q.height>4,inScroll:!!m.closest('.dtx')}}}}""")
        if not r or r.get("none") and r.get("dm") or (not r.get("none") and (not r["vis"] or r["inScroll"])):R["ng"].append([vw,id,br,r])
        if vw==1280:R.setdefault("mod",[]).append([id,br,r])
      pg.evaluate(f"()=>{{delete PRF().mods['{id}']}}")
    r=pg.evaluate("""()=>{const t=treeData(curChar());S.treeIntro=1;t.presets.forEach((x,i)=>x.name=['ああああああああああ','ＷＷＷＷＷＷＷＷＷＷ','吹雪の陣型型型型型型'][i]);showTree();
      return[...document.querySelectorAll('.tslots button')].map(x=>{const a=x.getBoundingClientRect(),s=x.parentNode.getBoundingClientRect(),st=document.querySelector('#stage').getBoundingClientRect(),k=st.height/360;return{bot:(a.bottom-s.bottom)/k,over:x.scrollWidth>x.clientWidth+1||x.scrollHeight>x.clientHeight+1,h:a.height/k}})}""")
    R.setdefault("slots",[]).append([vw,r])
    if any(q["bot"]>0.5 or q["over"] for q in r):R["ng"].append([vw,"slot",r])
    if vw==1280:pg.screenshot(path="/tmp/v2251_tree.png")
    pg.close()
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False))
