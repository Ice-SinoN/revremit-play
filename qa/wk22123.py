# ★v0.22.123 弱点ギア：ボスの帯の札（？→ 見つけたあと「低いギア（1〜2速）」）・見つけた瞬間の字と音・セーブに残る（次の戦闘で最初から見える）・形が変わるボス・4サイズで札が帯の中・ふつうの敵には出ない
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]}
with sync_playwright() as p:
  b=p.chromium.launch()
  for vw,vh in [(667,375),(956,440),(1280,720),(1366,768)]:
    pg=b.new_page(viewport={"width":vw,"height":vh});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    r=pg.evaluate("""async()=>{qaSetProgress({slot:1,nightMax:3,chars:['HINA'],tutorial:true});const p=PRF();p.weakSeen={};const se=[];const o=SND.se;SND.se=(i,x)=>{se.push(i);return o.call(SND,i,x)};
      newRunState('MT','YUKI',[]);G.night=1;G.row=1;startBattleState('boss1');enterBattle();await new Promise(r=>setTimeout(r,1800));
      const lab0=document.querySelector('.weakt')&&document.querySelector('.weakt').innerText;const toast0=[...document.querySelectorAll('.toast2')].map(e=>e.innerText).join('|');
      B.e.next=999;B.gear=0;B.rpm=1000;B.gas=9;B.hand=[inst('hyouga')];renderBattle();const sim=simulateCard(0,false);doPlay(0,false);await new Promise(r=>setTimeout(r,1800));
      const lab1=document.querySelector('.weakt')&&document.querySelector('.weakt').innerText;const saved=JSON.stringify(PRF().weakSeen);
      const box=document.querySelector('.weakt').getBoundingClientRect(),st=document.getElementById('stage').getBoundingClientRect();
      startBattleState('boss1');enterBattle();await new Promise(r=>setTimeout(r,600));const lab2=document.querySelector('.weakt').innerText;
      B.gear=0;B.hand=[inst('hyouga')];B.gas=9;B.rpm=1000;const sim2=simulateCard(0,false);
      startBattleState('kei');enterBattle();await new Promise(r=>setTimeout(r,300));const lab3=!!document.querySelector('.weakt');
      SND.se=o;return {lab0,toast0,lab1,lab2,lab3,saved,se:se.filter(x=>x==='weak_hit').length,sim:sim&&sim.hits,sim2:sim2&&sim2.hits,inBand:box.right<=st.right+1&&box.width>0}}""")
    R.setdefault(str(vw),r)
    ok=r["lab0"]=="弱点：？" and "盾が大きい" in r["toast0"] and r["lab1"].startswith("弱点：低い") and r["lab2"]==r["lab1"] and not r["lab3"] and r["se"]>=1 and r["inBand"]
    if not ok:R["ng"].append(vw)
    if vw==1280:pg.screenshot(path="/home/claude/rr/out/wk123_boss1.png")
    R.setdefault("errs",[]).extend(errs);pg.close()
  b.close()
print(json.dumps(R,ensure_ascii=False))
