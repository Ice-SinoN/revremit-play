"use strict";
/* ===== チュートリアルの画面（α3）=====
   中身は data/tutorial.js（TUT）。ふつうの戦闘（engine.js）の上で、手札・山札・敵だけ差しかえて流す。
   ・光らせる所だけ押せる：#tut に「穴」のあいた幕を4枚置き、穴の外のクリックを止める
   ・文は上の帯（MIO の通信）。いつでも「スキップ」
   ・済んだら localStorage revremit_tutorial_done（スキップでも済み）。2回目からは自動で出ない */
const TUT_KEY=TUT.key||"revremit_tutorial_done";
const TUTS={i:-1,ph:"lines",li:0,turns:0,downs:0,done:null,p0:0,c0:0,lastGrade:null,force:false};
window.TUTORIAL_ON=false;
function tutDone(){try{return localStorage.getItem(TUT_KEY)==="1"}catch(e){return true}}
function tutMark(){try{localStorage.setItem(TUT_KEY,"1")}catch(e){}}
/* はじめる。done：終わったら（スキップでも）呼ぶ */
function startTutorial(done){
  TUTS.done=done;TUTS.i=-1;TUTS.ph="lines";TUTS.li=0;TUTS.turns=0;TUTS.downs=0;window.TUTORIAL_ON=true;tutMark();
  newRunState("MT","YUKI",[]);ENEMIES.__tut=Object.assign({},TUT.enemy);
  startBattleState("__tut");if(TUT.noAreaMul){B.e.hp=B.e.maxhp=TUT.enemy.hp;B.am=1}// design 8-5：エリアの倍率をかけない
  B.hand=TUT.hand.map(id=>inst(id));B.draw=TUT.draw.slice().reverse().map(id=>inst(id));B.disc=[];B.rpm=TUT.rpm;B.gear=TUT.gear;
  B.log=[];addLog("練習の戦闘");enterBattle();SND.bgm("tutorial");tutRender();
}
const tutStepObj=()=>TUTS.i<0?{lines:TUT.hello,done:[]}:TUT.steps[TUTS.i];
function tutDoneLines(st){const d=st.done;return typeof d==="function"?d():(d||[])}
/* 今の帯の1行 [話す人, 文]（wait は話す人なし） */
function tutLine(){const st=tutStepObj();if(!st)return null;
  if(TUTS.ph==="lines")return st.lines[TUTS.li];if(TUTS.ph==="wait")return[null,st.wait||""];return tutDoneLines(st)[TUTS.li]}
function tutStep(){TUTS.i++;const st=TUT.steps[TUTS.i];if(!st){tutFinish();return}TUTS.ph="lines";TUTS.li=0;TUTS.p0=G?G.st.perfect:0;
  if(st.screen==="map"){B=null;showMap()}if(st.setup)try{st.setup()}catch(e){}if(B&&window.SCREEN==="battle")renderBattle();tutRender()}
function tutToWait(){const st=tutStepObj();if(st.until){TUTS.ph="wait";TUTS.li=0;TUTS.c0=B?B.cards:0;tutRender();tutCheck()}else tutToDone()}
function tutToDone(){const st=tutStepObj();TUTS.ph="done";TUTS.li=0;if(!tutDoneLines(st).length){if(st.end)tutFinish();else{tutAfterStep(st);tutStep()}}else tutRender()}
function tutCheck(){if(!window.TUTORIAL_ON)return;const st=tutStepObj();
  if(TUTS.ph==="wait"&&st.until&&st.until()){SND.se("tut_ok");TUTS.lastGrade=G&&G.st.perfect>TUTS.p0?"perfect":"good";tutToDone()}else tutRender()}
function tutTap(){const st=tutStepObj();if(!st)return;SND.se("text_next");
  if(TUTS.ph==="lines"){if(TUTS.li<st.lines.length-1){TUTS.li++;tutRender()}else tutToWait();return}
  if(TUTS.ph==="done"){if(TUTS.li<tutDoneLines(st).length-1){TUTS.li++;tutRender()}else if(st.end)tutFinish();else{tutAfterStep(st);tutStep()}}}
/* design 8-5 after:"endTurn"：done の文のあと自動でターン終了（押せるかの判定はとおす） */
function tutAfterStep(st){if(st.after==="endTurn"&&B&&!B.over){TUTS.force=true;try{doEndTurn()}finally{TUTS.force=false}}}
/* スキップ：確認の小窓（話す人なし）→ はい／いいえ */
function tutSkip(){const k=TUT.skip||{};modal(`<div class="h">${esc(k.q||"スキップしますか？")}</div><div class="small dim">${esc(k.note||"")}</div><button class="main" onclick="closeModal();tutFinish()">${esc(k.yes||"スキップする")}</button><button onclick="closeModal()">${esc(k.no||"つづける")}</button>`)}
function tutFinish(){window.TUTORIAL_ON=false;const el=document.getElementById("tut");if(el)el.remove();delete ENEMIES.__tut;
  flushAnim&&flushAnim();G=null;B=null;const d=TUTS.done;TUTS.done=null;if(d)d()}
/* 押してよいか（screens.js の押す所から呼ぶ）。操作を待っている間（wait）だけ */
/* 光らせる手札の番号と、打ち方のしばり（design 8-5：hl.nth・seq） */
function tutHi(st){st=st||tutStepObj();if(!st||!B)return{idx:[],sel:null,shift:null};
  if(st.seq){const q=st.seq[Math.max(0,B.cards-TUTS.c0)];if(!q)return{idx:[],sel:null,shift:null};const k=B.hand.findIndex(c=>c.id===q.card);return{idx:k>=0?[k]:[],sel:".detail button",shift:q.shift==null?null:q.shift}}
  const h=st.hl||{},ids=[].concat(h.card||[]);let idx=[];
  if(h.nth!=null){let n=0;B.hand.forEach((c,i)=>{if(c.id===ids[0]){if(n===h.nth)idx.push(i);n++}})}
  else B.hand.forEach((c,i)=>{if(ids.includes(c.id))idx.push(i)});
  return{idx,sel:h.sel||null,shift:st.shiftOnly?true:st.keepOnly?false:null}}
/* 押してよいか（screens.js の押す所から呼ぶ）。操作を待っている間（wait）だけ */
function tutAllow(kind,arg){if(!window.TUTORIAL_ON||TUTS.force)return true;const st=tutStepObj();if(!st||TUTS.ph!=="wait")return false;const al=st.allow||[];
  if(al.includes("free")){if(kind==="play"&&st.noBlow&&B.hand[arg.i]&&!arg.shift){const p=preview(B.hand[arg.i]);if(p.danger==="blow")return false}return true}// noBlow：ブローになる打ち方は押せない
  const H=tutHi(st);
  if(kind==="card")return al.includes("card")&&H.idx.includes(arg);
  if(kind==="play"){if(st.noPlay||!al.includes("play"))return false;return H.idx.includes(arg.i)&&(H.shift==null?true:H.shift===!!arg.shift)}
  return al.includes(kind)}
/* 光らせる所の四角（原寸の座標） */
function tutRects(){const st=tutStepObj();if(!st||!(st.hl||st.seq)||TUTS.ph!=="wait")return[];const out=[],stg=document.querySelector("#stage").getBoundingClientRect(),s=window.FIT?FIT.s:1;
  const box=el=>{const r=el.getBoundingClientRect();return[(r.left-stg.left)/s,(r.top-stg.top)/s,r.width/s,r.height/s]};
  const H=tutHi(st);if(B)document.querySelectorAll("#ui button.cs").forEach((el,i)=>{if(H.idx.includes(i))out.push(box(el))});
  if(H.sel)document.querySelectorAll("#ui "+H.sel).forEach(el=>{if(el.offsetParent!==null)out.push(box(el))});
  if(st.hl&&st.hl.rect)out.push(st.hl.rect);return out}
function tutRender(){if(!window.TUTORIAL_ON)return;let el=document.getElementById("tut");if(!el){el=document.createElement("div");el.id="tut";document.querySelector("#stage").appendChild(el)}
  const st=tutStepObj(),l=tutLine();if(!st||!l){el.innerHTML="";return}
  const waiting=TUTS.ph==="wait",free=waiting&&(st.allow||[]).includes("free"),rs=waiting?tutRects():[];
  let h="";const W=RES.W,H=RES.H;
  if(!waiting)h+=`<div class="tb" ${at(0,0,W,H)} onclick="tutTap()"></div>`;// 説明の間はどこを押しても文が進む（下の画面は押せない）
  else if(!free){let hole=null;if(rs.length){const x0=Math.min(...rs.map(r=>r[0]))-2,y0=Math.min(...rs.map(r=>r[1]))-2,x1=Math.max(...rs.map(r=>r[0]+r[2]))+2,y1=Math.max(...rs.map(r=>r[1]+r[3]))+2;hole=[x0,y0,x1-x0,y1-y0]}
    if(hole){const[x,y,w,hh]=hole;h+=`<div class="tm" ${at(0,0,W,Math.max(0,y))}></div><div class="tm" ${at(0,y+hh,W,Math.max(0,H-y-hh))}></div><div class="tm" ${at(0,y,Math.max(0,x),hh)}></div><div class="tm" ${at(x+w,y,Math.max(0,W-x-w),hh)}></div>`;
      // 光る枠（ui\c2 の9分割の枠）と、上から指す矢印
      rs.forEach(r=>{h+=TUTP.frame&&TUTP.frame.urls?`<div class="tglow t9" ${at(r[0]-5,r[1]-5,r[2]+10,r[3]+10)}></div>`:`<div class="tglow" ${at(r[0]-2,r[1]-2,r[2]+4,r[3]+4)}></div>`});
      const r0=rs[0],want=r0&&r0[1]>60?"down":"up",dir=TUTP.arrow&&TUTP.arrow[want]?want:TUTP.arrow&&TUTP.arrow[want==="down"?"up":"down"]?(want==="down"?"up":"down"):null;// ★BUG-21：読めない向きの矢印は、もう片方か出さない
      if(r0&&dir&&TUTP.arrow.cell){const r=r0,A0=TUTP.arrow[dir],c=TUTP.arrow.cell,ax=Math.round(r[0]+r[2]/2-A0.tip[0]),ay=dir==="down"?Math.round(r[1]-6-A0.tip[1]):Math.round(r[1]+r[3]+6-A0.tip[1]);
        h+=`<img class="px tarrow" data-dir="${dir}" src="${A0.urls[0]}" ${at(ax,ay,c[0],c[1])}>`}}
    else h+=`<div class="tm" ${at(0,0,W,H)}></div>`}
  else if(rs.length)rs.forEach(r=>{h+=TUTP.frame&&TUTP.frame.urls?`<div class="tglow t9" ${at(r[0]-5,r[1]-5,r[2]+10,r[3]+10)}></div>`:`<div class="tglow" style="pointer-events:none" ${at(r[0]-2,r[1]-2,r[2]+4,r[3]+4)}></div>`});// free の段も光らせる（幕なし）
  const hit=y=>rs.some(r=>r[1]<y+76&&r[1]+r[3]>y),who=l[0],by=st.screen==="map"?10:!hit(136)?136:!hit(10)?10:136,/* 光る所（説明の小窓のボタンなど）に帯が重なるときは上へ */comm=TUTP.comm&&TUTP.comm.urls&&who==="MIO"?`<img class="px tcomm" src="${TUTP.comm.urls[0]}" ${at(84,by+6,24,24)}>`:"";
  h+=comm+`<div class="tband${who?"":" nar"}" ${at(110,by,420,76)} onclick="${waiting?"":"tutTap()"}"><div class="scname">${who?esc(TEXT.names[who]||"")+'<span class="small dim">　通信</span>':""}</div><div class="sctext">${esc(String(l[1]).replace(/<br>/g,"\n"))}</div>${waiting?"":'<div class="scnext small">▼</div>'}</div>
   <button class="mini tskip" ${at(552,by===10?96:24,80,28)} onclick="tutSkip()">スキップ</button>`;
  el.innerHTML=h;tutTick()}
/* 部品のコマ送り（枠 400ms・矢印 160ms・通信 500ms） */
function tutTick(){if(!window.TUTORIAL_ON){clearInterval(TUTS.tm);TUTS.tm=null;return}if(!TUTS.tm)TUTS.tm=setInterval(tutTick,80);const t=Date.now(),el=document.getElementById("tut");if(!el)return;
  if(TUTP.frame&&TUTP.frame.urls){const u=TUTP.frame.urls[Math.floor(t/TUTP.frame.ms)%TUTP.frame.urls.length];el.querySelectorAll(".t9").forEach(d=>{d.style.borderImageSource=`url(${u})`})}
  el.querySelectorAll(".tarrow").forEach(im=>{const A0=TUTP.arrow&&TUTP.arrow[im.dataset.dir];if(!A0)return;const u=A0.urls[Math.floor(t/(TUTP.arrow.ms||160))%A0.urls.length];if(u&&im.getAttribute("src")!==u)im.src=u});
  el.querySelectorAll(".tcomm").forEach(im=>{if(!TUTP.comm)return;const u=TUTP.comm.urls[Math.floor(t/TUTP.comm.ms)%TUTP.comm.urls.length];if(im.getAttribute("src")!==u)im.src=u})}
/* 戦闘の操作のあとに呼ぶ */
function tutAfter(r){if(!window.TUTORIAL_ON)return;if(r==="turn")TUTS.turns++;if(G&&G.hp<1){G.hp=1}setTimeout(()=>tutCheck(),0)}
