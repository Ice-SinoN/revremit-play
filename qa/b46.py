# ★v0.22.23 BUG-46・音の頼み2つ・クイックシフトの dDeck。python qa/b46.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
with sync_playwright() as p:
  b=p.chromium.launch()
  for vw,vh in [(1920,1080),(1280,720),(1536,864),(844,390),(667,375),(2560,1440),(1366,768)]:
    pg=b.new_page(viewport={"width":vw,"height":vh});pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    for ch,hand,gear,en in [("NANA","[inst('n_taikan',true),inst('n_gaisen'),inst('n_hachiren')]",2,"kei"),("NANA","[inst('n_taikan',true),inst('n_gaisen'),inst('n_hachiren')]",7,"kei"),("YUKI","[inst('kyokkou',true),inst('hyouga'),inst('rinkai'),inst('nadare'),inst('hakusen'),inst('slip'),inst('counter')]",2,"kei"),("MOMO","[inst('m_hanami'),inst('m_kinen'),inst('m_touka')]",0,"kei")]:
      for mode in ["MT","AT"]:
        for i in range(3):
          pg.evaluate(f"()=>{{newRunState('{mode}','{ch}',[]);G.row=1;startBattleState('{en}');enterBattle();B.gas=9;B.gear={gear};B.rpm=1000;B.hand={hand};S.sel={i};renderBattle()}}");pg.wait_for_timeout(60)
          r=pg.evaluate("""(()=>{const d=document.querySelector('.detail');if(!d)return null;const r=d.getBoundingClientRect(),st=document.querySelector('#stage').getBoundingClientRect(),k=st.height/360;
            const bars=[...document.querySelectorAll('.barn')].map(x=>x.getBoundingClientRect());const hitN=bars.some(q=>q.top<r.bottom&&q.bottom>r.top+0.5&&q.left<r.right&&q.right>r.left);
            const barBot=st.top+(RES.bars.y+4)*k;const cs=[...document.querySelectorAll('#ui .cs')].filter(c=>!c.classList.contains('sel'));const hitH=cs.some(c=>{const q=c.getBoundingClientRect();return q.top<r.bottom-0.5&&q.left<r.right&&q.right>r.left});
            return{hitN,hitBar:r.top<barBot-0.5,hitH,scroll:d.scrollHeight>d.clientHeight+1,top:(r.top-st.top)/k}})()""")
          if r and (r["hitN"] or r["hitBar"] or r["hitH"]):R["ng"].append([vw,ch,gear,mode,i,r])
          if vw==1280 and ch=="NANA" and i==0:R.setdefault("nana",[]).append([gear,mode,r])
    if vw==1280:
      pg.evaluate("()=>{newRunState('MT','NANA',[]);G.row=1;startBattleState('kei');enterBattle();B.gas=9;B.gear=2;B.rpm=1000;B.hand=[inst('n_taikan',true),inst('n_gaisen'),inst('n_hachiren')];S.sel=0;renderBattle()}");pg.wait_for_timeout(200);pg.screenshot(path="/tmp/b46_nana.png")
      # 音：打てないカードをもう一度タップ／ローテーション2回目・捨てるカードがない／引けた枚数
      R["snd"]=pg.evaluate("""async()=>{const log=[];const o=SND.se;SND.se=(id,a)=>{log.push(id);return o.call(SND,id,a)};const out={};
        const S0=(h)=>{newRunState('MT','YUKI',[]);G.row=1;startBattleState('kei');enterBattle();B.gas=9;B.gear=2;B.rpm=1000;B.hand=h;S.sel=-1;renderBattle()};
        S0([inst('nadare')]);B.gas=0;renderBattle();log.length=0;clickCard(0);out.first=log.slice();log.length=0;clickCard(0);out.second=log.slice();
        S0([inst('pitsign'),inst('hyouga')]);log.length=0;clickCard(0);clickCard(0);out.noTarget=log.slice();
        S0([inst('pitsign'),inst('pitsign'),inst('nadare'),inst('nadare')]);B.gas=9;B.rotT=true;renderBattle();log.length=0;clickCard(0);clickCard(0);out.used=log.slice();
        SND.se=o;return out}""")
      R["drawn"]=pg.evaluate("""async()=>{const log=[];const o=SND.se;SND.se=(id,a)=>{log.push(id);return o.call(SND,id,a)};
        newRunState('MT','YUKI',[]);G.row=1;startBattleState('kei');enterBattle();B.gas=5;B.gear=2;B.rpm=1000;B.e.next=999;B.hand=[inst('pitsign'),inst('nadare'),inst('nadare')];B.draw=[inst('braking')];B.disc=[];renderBattle();const pv=preview(B.hand[0]);log.length=0;
        doPlay(0,false);await new Promise(r=>setTimeout(r,2500));SND.se=o;return{toss:log.filter(x=>x==='card_toss').length,draw:log.filter(x=>x==='card_draw').length,ev:B.log.filter(x=>x.includes('ローテーション')),pv:pv.txt,hand:B.hand.map(c=>c.id)}}""")
      R["deck"]=pg.evaluate("()=>{S.deck=null;showDeck();deckPick('qshift');const d=document.querySelector('.dkdet .dkd');return d?d.innerHTML:null}")
      pg.screenshot(path="/tmp/b46_deck.png")
      R["momo"]=pg.evaluate("()=>CHARS.MOMO.ruleTxt")
    pg.close()
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False,indent=0))
