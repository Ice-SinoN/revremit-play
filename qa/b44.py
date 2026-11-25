# ★v0.22.21 BUG-44：説明の窓（下ぞろえ）が手札にかからない・画面の上にはみ出さない。python qa/b44.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
with sync_playwright() as p:
  b=p.chromium.launch()
  for vw,vh in [(1920,1080),(1280,720),(844,390)]:
    pg=b.new_page(viewport={"width":vw,"height":vh});pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    for ch,hand,gear in [("NANA","[inst('n_taikan',true),inst('n_gaisen'),inst('n_hachiren')]",2),("YUKI","[inst('kyokkou',true),inst('hyouga'),inst('rinkai'),inst('nadare'),inst('hakusen'),inst('slip'),inst('counter')]",2),("MOMO","[inst('m_hanami'),inst('m_kinen'),inst('m_touka')]",0)]:
      for mode in ["MT","AT"]:
        for i in range(3):
          pg.evaluate(f"()=>{{newRunState('{mode}','{ch}',[]);G.row=1;startBattleState('kei');enterBattle();B.gas=9;B.gear={gear};B.rpm=1000;B.hand={hand};S.sel={i};renderBattle()}}");pg.wait_for_timeout(80)
          r=pg.evaluate("""(()=>{const d=document.querySelector('.detail');if(!d)return null;const r=d.getBoundingClientRect(),st=document.querySelector('#stage').getBoundingClientRect();
            const cs=[...document.querySelectorAll('#ui .cs')].filter(c=>!c.classList.contains('sel'));const hit=cs.some(c=>{const q=c.getBoundingClientRect();return q.top<r.bottom-0.5&&q.left<r.right&&q.right>r.left});
            return{hit,top:r.top>=st.top-1,scroll:d.scrollHeight>d.clientHeight+1}})()""")
          if r and (r["hit"] or not r["top"]):R["ng"].append([vw,ch,mode,i,r])
    pg.evaluate("()=>{newRunState('MT','NANA',[]);G.row=1;startBattleState('kei');enterBattle();B.gas=9;B.gear=2;B.rpm=1000;B.hand=[inst('n_taikan',true),inst('n_gaisen'),inst('n_hachiren')];S.sel=0;renderBattle()}");pg.wait_for_timeout(200);pg.screenshot(path=f"/tmp/b44_{vw}.png")
    pg.close()
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False))
