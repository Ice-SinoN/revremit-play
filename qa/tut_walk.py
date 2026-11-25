# チュートリアルを画面の関数で最後まで通す（design 8-2 の数字・押せない所を確かめる）。使い方：python qa/tut_walk.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve()
JS="""async()=>{const W=ms=>new Promise(r=>setTimeout(r,ms));const log=[],bad=[];localStorage.clear();S.deck=null;newRun('MT');
 const st=()=>TUTS.i<0?'hello':TUT.steps[TUTS.i].id,snap=()=>B?`${B.gear+1}速 ${B.rpm} G${B.gas} CH${B.chain} 敵${B.e.hp} 耐${G.hp}`:'(no B)';
 const idx=id=>B.hand.findIndex(c=>c.id===id);
 const tryBad=(name,f,chk)=>{const before=JSON.stringify([B.cards,B.gear,B.rpm,S.sel]);f();const after=JSON.stringify([B.cards,B.gear,B.rpm,S.sel]);if(before!==after)bad.push(name+'が押せた')};
 let guard=0;
 while(window.TUTORIAL_ON&&guard++<300){
  if(TUTS.ph!=='wait'){tutTap();await W(5);continue}
  const id=st();log.push(id+' wait '+snap());
  if(id==='preview'){tryBad('preview:ほかのカード',()=>clickCard(1));clickCard(0)}
  else if(id==='rpm'){tryBad('rpm:2枚目の白閃',()=>doPlay(3,false));clickCard(0)}
  else if(id==='shift'){const i=idx('rikka');tryBad('shift:○速のまま',()=>doPlay(i,false));doPlay(i,true)}
  else if(id==='gas'){const h=idx('hakusen');tryBad('gas:シフトして打つ',()=>doPlay(h,true));doPlay(idx('pitboard'),false);await W(50);doPlay(idx('hakusen'),false)}
  else if(id==='chain'){tryBad('chain:順番ちがい',()=>doPlay(idx('whiteout'),false));doPlay(idx('hyouga'),false);await W(20);tryBad('chain:霜纏いを○速のまま',()=>doPlay(idx('shimo'),false));doPlay(idx('shimo'),true);await W(20);doPlay(idx('counter'),true);await W(20);tryBad('chain:ホワイトアウトをシフト',()=>doPlay(idx('whiteout'),true));doPlay(idx('whiteout'),false)}
  else if(id==='red'){const i=idx('hakunetsu');clickCard(i);await W(20);tryBad('red:打つ',()=>doPlay(i,false));log.push('red preview '+preview(B.hand[i]).txt)}
  else if(id==='down'){doDownShift()}
  else if(id==='finish'){const i=idx('rinkai');doPlay(i,false)}
  else {bad.push('待ちの段 '+id+' を進められない');break}
  await W(60);if(typeof flushAnim==='function')flushAnim();await W(20);if(TUTS.ph==='wait'){tutCheck();await W(20)}
  log.push('  → '+st()+' '+TUTS.ph+' '+snap());
 }
 return{log,bad,end:window.SCREEN,tut:window.TUTORIAL_ON,done:localStorage.getItem('revremit_tutorial_done')}}"""
HID="""async()=>{localStorage.clear();S.deck=null;newRun('MT');const W=ms=>new Promise(r=>setTimeout(r,ms));const out=[];
   let g=0;while(window.TUTORIAL_ON&&g++<200){if(TUTS.ph!=='wait'){tutTap();await W(5);continue}const s=TUT.steps[TUTS.i].id,ix=k=>B.hand.findIndex(c=>c.id===k);
     const chk=()=>{const rs=tutRects();rs.forEach(r=>{const st=document.querySelector('#stage').getBoundingClientRect(),k=FIT.s;const el=document.elementFromPoint(st.left+(r[0]+r[2]/2)*k,st.top+(r[1]+r[3]/2)*k);if(!el||el.closest('#tut'))out.push(s+': 光る所が隠れている '+r.map(Math.round))})};
     chk();
     if(s==='preview'){clickCard(0)}else if(s==='rpm'){if(S.sel!==0)clickCard(0);await W(10);chk();clickCard(0)}
     else if(s==='shift'){clickCard(ix('rikka'));await W(10);chk();doPlay(ix('rikka'),true)}
     else if(s==='gas'){clickCard(ix('pitboard'));await W(10);chk();doPlay(ix('pitboard'),false);flushAnim();clickCard(ix('hakusen'));await W(10);chk();doPlay(ix('hakusen'),false)}
     else if(s==='chain'){for(const[k,sh]of[['hyouga',false],['shimo',true],['counter',true],['whiteout',false]]){clickCard(ix(k));await W(10);chk();doPlay(ix(k),sh);flushAnim();await W(10)}}
     else if(s==='red'){clickCard(ix('hakunetsu'))}else if(s==='down')doDownShift();else if(s==='finish')doPlay(ix('rinkai'),false);
     flushAnim();await W(30);tutCheck();await W(10)}
   return{out,end:SCREEN}}"""
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={"width":1280,"height":720});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto(html.as_uri());pg.wait_for_function("window.SCREEN==='title'",timeout=20000)
  r=pg.evaluate(JS)
  # 2回目：光る所（カード・説明の小窓のボタン）が MIO の帯で隠れていないか（真ん中の点で一番上が #tut でない）
  r["hidden"]=pg.evaluate(HID)
  r["errors"]=errs[:5];r["ok"]=not r["bad"] and not r["hidden"]["out"] and r["end"]=="scene" and not errs
  print(json.dumps(r,ensure_ascii=False,indent=1));b.close()
