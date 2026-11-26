# ★v0.22.102 奥義の演出。python qa/ougi22102.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
JS="""async(a)=>{const [id,vw]=a;const w=ms=>new Promise(r=>setTimeout(r,ms));const ch=CARDS[id].own;const log=[];const o=SND.se;SND.se=(x,p)=>{log.push(x);return o.call(SND,x,p)};
  newRunState('MT',ch,[]);G.night=3;G.row=1;G.deck.push(inst(id));startBattleState('kei');enterBattle();await w(500);B.e.next=999;B.e.hp=B.e.maxhp=999;B.gas=9;B.hand=[inst(id),inst('slip')];B.rpm=1000;B.gear=0;renderBattle();
  const t0=performance.now();doPlay(0,false);const seen={cut:false,band:false,nm:'',ln:'',pOver:null,flash:false,hpAt:null};let cutEnd=null;
  const st=document.querySelector('#stage').getBoundingClientRect();let ov=false;
  while(performance.now()-t0<4000){await w(30);const c=document.getElementById('ogcut');if(c){seen.cut=true;const b=c.querySelector('.band');if(b&&b.naturalWidth)seen.band=true;seen.nm=c.querySelector('.nm').textContent;seen.ln=c.querySelector('.ln').textContent;
      [c.querySelector('.nm'),c.querySelector('.ln')].forEach(e=>{const r=e.getBoundingClientRect();if(r.right>st.right+1||r.left<st.left-1)ov=true})}else if(seen.cut&&cutEnd==null)cutEnd=performance.now()-t0;
    if(A.pOver)seen.pOver=A.pOver;if(A.flash)seen.flash=true;if(seen.hpAt==null&&A.disp&&A.disp.ehp<999)seen.hpAt=performance.now()-t0;if(!busy()&&performance.now()-t0>300)break}
  const total=performance.now()-t0;
  // 2回目（同じラン）＝短く
  B.hand=[inst(id)];B.gas=9;B.rpm=1000;renderBattle();const t1=performance.now();doPlay(0,false);let pov2=false;while(busy()&&performance.now()-t1<4000){await w(30);if(A.pOver)pov2=true}const t2=performance.now()-t1;
  // タップで飛ばす
  G.ogSeen={};B.hand=[inst(id)];B.gas=9;B.rpm=1000;renderBattle();const t3=performance.now();doPlay(0,false);await w(150);const c=document.getElementById('ogcut');if(c)c.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));while(busy()&&performance.now()-t3<4000)await w(30);const t4=performance.now()-t3;
  // フルオート＝出さない
  G.ogSeen={};G.fullAuto=true;B.hand=[inst(id)];B.gas=9;B.rpm=1000;renderBattle();let cut3=false;doPlay(0,false);const t5=performance.now();while(busy()&&performance.now()-t5<3000){await w(20);if(document.getElementById('ogcut'))cut3=true}G.fullAuto=false;
  SND.se=o;return{seen,total:Math.round(total),cutEnd:cutEnd&&Math.round(cutEnd),short:Math.round(t2),pov2,skip:Math.round(t4),farmCut:cut3,ov,snd:[...new Set(log.filter(x=>/og|ougi/.test(x)))]}}"""
with sync_playwright() as p:
  b=p.chromium.launch()
  for vw,vh in [(1280,720),(844,390),(667,375),(1920,1080)]:
    pg=b.new_page(viewport={"width":vw,"height":vh});pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    ids=["y_og_frz","y_og_cnt","y_og_red","h_og_rush","h_og_combo","h_og_pit","m_og_chain","m_og_guard","m_og_rev","n_og_shift","n_og_perf","n_og_crown"] if vw==1280 else ["h_og_rush","n_og_crown"]
    for id in ids:
      r=pg.evaluate(JS,[id,vw]);bad=[]
      s=r["seen"];spr=id[0] in "yh" or True  # ★v0.22.181 12本すべて12コマ（鳳凰戴天も入った）
      if not(s["cut"] and s["band"] and s["nm"]): bad.append("カットイン")
      if spr and not s["pOver"]: bad.append("12コマ")
      if not spr and not s["flash"]: bad.append("閃光")
      if r["ov"]: bad.append("字のはみ出し")
      if r["pov2"] or r["short"]>r["total"]-350: bad.append(["2回目が短くない",r["short"],r["total"]])
      if r["skip"]>r["total"]-500: bad.append(["飛ばせない",r["skip"]])
      if r["farmCut"]: bad.append("フルオートで出た")
      if "og_cutin" not in r["snd"]: bad.append("音")
      if bad: R["ng"].append([vw,id,bad,r])
      R.setdefault("r",{})[f"{vw}:{id}"]={k:r[k] for k in ("total","short","skip","cutEnd")}
    if vw==1280:
      pg.evaluate("""async()=>{newRunState('MT','HINA',[]);G.night=3;G.row=1;startBattleState('kei');enterBattle();await new Promise(r=>setTimeout(r,500));B.e.next=999;B.hand=[inst('h_og_rush')];B.gas=9;renderBattle();doPlay(0,false)}""");pg.wait_for_timeout(450);pg.screenshot(path="/tmp/og_cut.png");pg.wait_for_timeout(700);pg.screenshot(path="/tmp/og_mo.png")
    pg.close()
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False,indent=0))
