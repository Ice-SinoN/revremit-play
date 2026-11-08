"use strict";
/* ===== 描画とモーション（v0.9）=====
   原寸（RES：480×270／640×360）のキャンバスに：背景・キャラ・敵・エフェクト・体力のバー・タコメーター。文字やボタンは DOM（screens.js）。
   計算はもう終わっているので、モーションは「見せるだけ」。押すと残りを飛ばす（操作が詰まらない）。
   キャラのモーションのキーは revremit-yuki-motion-list.md。絵にないコマは、今ある絵＋前に出る・光る・ゆれる・色を変える で出す。 */
const A={
  cv:null,g:null,mode:"none",t0:0,now:0,
  P:{x:0,y:0,tag:"stand",fi:0,dx:0,dy:0,tint:null,alpha:1},
  E:{x:0,y:0,tag:"stand",fi:0,dx:0,dy:0,tint:null,alpha:1,set:"van",pal:null,scale:1},
  q:[],cur:null,fx:[],shake:0,flash:null,disp:{php:0,pmax:1,ehp:0,emax:1,pblk:0,eblk:0},
  bgKey:"street",dim:0,idleT:0,
};
function animInit(cv){A.cv=cv;A.g=cv.getContext("2d");A.g.imageSmoothingEnabled=false;
  A.t0=performance.now();requestAnimationFrame(loop)}
function setScene(mode){A.mode=mode;A.P.x=RES.P.x;A.E.x=RES.E.x;A.P.y=A.E.y=RES.FLOOR;A.q=[];A.cur=null;A.fx=[];A.shake=0;A.flash=null;A.dim=0;resetActors()}
function resetActors(){Object.assign(A.P,{tag:"stand",fi:0,dx:0,dy:0,tint:null,alpha:1});Object.assign(A.E,{tag:"stand",fi:0,dx:0,dy:0,tint:null,alpha:1})}
/* 戦闘の数値を、モーションの区切りで追いつかせる */
function syncDisp(){if(!B||!G)return;Object.assign(A.disp,{php:G.hp,pmax:G.maxhp,ehp:Math.max(0,B.e.hp),emax:B.e.maxhp,pblk:B.block,eblk:B.e.block})}

/* ---- モーションの列 ----
   1つの段＝{d:時間ms, on(): はじめに1回, up(k): 0〜1, end(): おわりに1回} */
function push(...steps){A.q.push(...steps)}
function busy(){return !!A.cur||A.q.length>0}
/* 残りを全部すぐ終わらせる（押したら次へ） */
function flushAnim(){
  if(A.cur){if(A.cur.up)A.cur.up(1);if(A.cur.end)A.cur.end()}A.cur=null;
  while(A.q.length){const s=A.q.shift();if(s.on)s.on();if(s.up)s.up(1);if(s.end)s.end()}
  resetActors();A.shake=0;A.flash=null;A.dim=0;syncDisp();
}
function step(dt){
  if(!A.cur&&A.q.length){A.cur=A.q.shift();A.cur.t=0;if(A.cur.on)A.cur.on()}
  if(A.cur){A.cur.t+=dt;const k=Math.min(1,A.cur.t/Math.max(1,A.cur.d));if(A.cur.up)A.cur.up(k);if(k>=1){if(A.cur.end)A.cur.end();A.cur=null}}
  A.fx=A.fx.filter(f=>{f.t+=dt;return f.t<f.life});
  if(A.shake>0)A.shake=Math.max(0,A.shake-dt/60);
  if(A.flash){A.flash.t+=dt;if(A.flash.t>A.flash.life)A.flash=null}
}
/* ---- エフェクト ---- */
function fxNum(x,y,txt,col){A.fx.push({k:"num",x,y,txt:String(txt),col,t:0,life:700})}
function fxSheet(key,x,y,s){const st=SPR[key];if(!st)return;A.fx.push({k:"spr",key,x,y,s:s||1,t:0,life:st.dur.reduce((a,b)=>a+b,0)})}
function fxWord(x,y,txt,col,life){A.fx.push({k:"word",x,y,txt,col,t:0,life:life||700})}
function fxParts(x,y,n,col,o){o=o||{};for(let i=0;i<n;i++){const a=(o.a!=null?o.a:Math.random()*Math.PI*2)+(Math.random()-0.5)*(o.spread||Math.PI*2),v=(o.v||40)*(0.5+Math.random());
  A.fx.push({k:"pt",x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-(o.up||0),g:o.g!=null?o.g:60,col:Array.isArray(col)?col[i%col.length]:col,s:o.s||1,t:0,life:o.life||500})}}
function fxLine(x1,y1,x2,y2,col,life){A.fx.push({k:"line",x1,y1,x2,y2,col,t:0,life:life||160})}
function fxRing(x,y,r,col,life){A.fx.push({k:"ring",x,y,r,col,t:0,life:life||300})}
function fxCat(x,y,life){A.fx.push({k:"cat",x,y,t:0,life:life||700})}
function flash(col,life){A.flash={col,t:0,life:life||90}}

/* 立ち位置（足元）から、体のまんなか・手の先 */
const BODY=()=>SPR.YUKI&&!SPR.YUKI.proc?80:34;// C2 の YUKI は背 約160 → 体のまんなか 80
const PC=()=>({x:A.P.x+A.P.dx,y:A.P.y+A.P.dy-BODY()});
const EC=()=>({x:A.E.x+A.E.dx,y:A.E.y+A.E.dy-(SPR[A.E.set]&&!SPR[A.E.set].proc?(A.E.set.startsWith("boss")?110:80):34)*A.E.scale});
const FIST=()=>({x:A.P.x+A.P.dx+(BODY()>40?56:38),y:A.P.y+A.P.dy-BODY()});

/* 当たった瞬間：敵がひかる・下がる・数字 */
function hitEnemyFx(e,big){const c=EC();SND.se("hit_enemy");A.E.tint="#F7F9F5";A.E.dx=big?10:5;A.shake=big?3:1;
  if(e.v>0)fxNum(c.x,c.y-20,e.v,"#F7F9F5");if(e.blk)fxNum(c.x+12,c.y-8,"-"+e.blk,"#8B95A3");
  fxParts(c.x-14,c.y,big?14:7,["#F7F9F5","#7FD8FF","#C5FF45"],{v:big?70:45,g:20,life:400});A.disp.ehp=Math.max(0,A.disp.ehp-e.v);A.disp.eblk=Math.max(0,A.disp.eblk-(e.blk||0))}
function settleE(){A.E.tint=null;A.E.dx=0}

/* ---- YUKI のモーション（カードの種類ごと）----
   絵のタグ（Aseprite）のコマ数に合わせる：段ごとに p＝タグの中の位置（0＝はじめ〜1＝おわり）を書き、コマ数が 2・3・6 のどれでも同じ動きになる。
   ジャブの「半歩ふみこむ」などの前後の動きは dx（プログラム側）。絵にないタグは近いタグで代わりに出す（ALIAS）。 */
const TAG_ALIAS={/* C2 のタグ */atk_light:"atk_l",atk_heavy:"atk_h",atk_finisher:"super",charge:"super",kneel:"hit",stop:"hit",
  /* 前の絵 */atk_h:"atk_light",super:"charge",atk_finisher:"charge",debuff:"atk_l",rev:"stand",draw:"debuff",skill:"guard",blow:"hit",win:"stand"};
function ytag(tag){const set=SPR.YUKI;let t=tag,k=0;while(set&&!set.tags[t]&&TAG_ALIAS[t]&&k++<4)t=TAG_ALIAS[t];return set&&set.tags[t]?t:"stand"}
function yfi(tag,p){const n=tagLen(SPR.YUKI,tag)||1;return Math.round(Math.max(0,Math.min(1,p))*(n-1))}
/* 段を作る：{tag,p,dx,dy,d,on2(), up(k)} */
function ys(tag,p,o){const t=ytag(tag);return{d:o.d,on(){A.P.tag=t;A.P.fi=yfi(t,p);if(o.dx!=null)A.P.dx=o.dx;if(o.dy!=null)A.P.dy=o.dy;if(o.on)o.on()},up:o.up,end:o.end}}
const MOTIONS={
  atk_light(hits){return[
    ys("atk_light",0,{d:80,dx:0}),ys("atk_light",0,{d:70,dx:5}),
    ys("atk_light",0.5,{d:130,dx:10,on(){hits.forEach(e=>hitEnemyFx(e,false));fxParts(FIST().x,FIST().y,5,"#7FD8FF",{v:30,g:0})}}),
    ys("atk_light",1,{d:90,dx:4,on(){settleE()}}),ys("stand",0,{d:60,dx:0})]},
  atk_heavy(hits){return[
    ys("atk_heavy",0,{d:130,dx:-6,on(){fxParts(A.P.x-6,A.P.y-30,6,["#8B95A3","#C9CED6"],{a:Math.PI,spread:0.6,v:30,g:-10})}}),
    ys("atk_heavy",0.5,{d:90,dx:20}),
    ys("atk_heavy",1,{d:210,dx:26,on(){const f=FIST();fxLine(f.x-20,f.y,f.x+60,f.y,"#F7F9F5",180);hits.forEach(e=>hitEnemyFx(e,true))}}),
    ys("atk_heavy",1,{d:120,dx:8,on(){settleE()}}),ys("stand",0,{d:60,dx:0})]},
  atk_finisher(hits){return[
    ys("atk_finisher",0,{d:320,dx:0,on(){A.dim=0.35},up(k){A.P.tint=(Math.floor(k*6)%2)?"#C5FF45":null;if(Math.random()<0.5)fxParts(FIST().x,FIST().y,2,["#C5FF45","#F7F9F5"],{v:20,g:-20,life:300})}}),
    ys("atk_finisher",0.5,{d:140,on(){A.P.tint=null},up(k){A.P.dx=k*56;A.P.dy=-Math.sin(k*Math.PI)*10}}),
    ys("atk_finisher",1,{d:340,dx:60,dy:0,on(){flash("#F7F9F5",120);A.shake=5;const c=EC();
      fxParts(c.x,c.y,24,["#F7F9F5","#7FD8FF","#C5FF45","#FF4040"],{v:90,g:30,life:600});hits.forEach(e=>hitEnemyFx(e,true))}}),
    ys("stand",0,{d:180,on(){A.dim=0},up(k){A.P.dx=60*(1-k)},end(){settleE()}})]},
  guard(){return[ys("guard",0,{d:120,dx:-2}),ys("guard",1,{d:260,on(){const f={x:A.P.x+22,y:A.P.y-36};fxRing(f.x,f.y,14,"#F7F9F5",260);fxParts(f.x,f.y,6,"#7FD8FF",{v:20,g:0})}}),ys("stand",0,{d:40,dx:0})]},
  debuff(){return[ys("debuff",0,{d:130,dx:3}),
    ys("debuff",1,{d:320,on(){const f=FIST(),c=EC();for(let i=0;i<14;i++)A.fx.push({k:"pt",x:f.x,y:f.y+(Math.random()-0.5)*10,vx:(c.x-f.x)/0.35*(0.8+Math.random()*0.4),vy:(Math.random()-0.5)*30,g:0,col:i%2?"#7FD8FF":"#F7F9F5",s:1,t:0,life:350})}}),
    ys("stand",0,{d:120,dx:0,on(){A.E.tint="#7FD8FF"}}),{d:60,on(){A.E.tint=null}}]},
  rev(){return[ys("rev",0,{d:120,on(){A.P.tint="#C5FF45";fxParts(A.P.x-6,A.P.y-30,6,["#FF8A3D","#FFD34D"],{a:Math.PI,spread:0.5,v:35,g:-10,life:300})}}),
    ys("rev",1,{d:180,on(){A.P.tint=null}}),ys("stand",0,{d:60})]},
  draw(){return[ys("draw",0,{d:240,on(){for(let i=0;i<6;i++)fxLine(RES.W,60+i*14,RES.W-100,60+i*14,"#7FD8FF",200)}}),ys("stand",0,{d:80})]},
  skill(){return[ys("skill",0,{d:220,on(){A.dim=0.5}}),ys("skill",0,{d:500,on(){fxCat(A.P.x-6,A.P.y-40,700);fxRing(A.P.x+10,A.P.y-34,26,"#F7F9F5",500)}}),ys("skill",1,{d:260,on(){A.dim=0}})]},
};
/* システムのモーション */
function mShift(g){const f=FIST();return{d:150,on(){if(g==="perfect")fxSheet("fx_perfect",PC().x,PC().y,1);SND.se(g==="perfect"?"shift_perfect":g==="good"?"shift_good":"shift_early");A.P.tint="#C5FF45";fxRing(f.x-10,f.y,8,g==="perfect"?"#C5FF45":"#F7F9F5",200);
  fxWord(A.P.x+10,A.P.y-80,g==="perfect"?"PERFECT":g==="good"?"GOOD":g==="early"?"EARLY":"LATE",g==="perfect"?"#C5FF45":"#F7F9F5",800)},end(){A.P.tint=null}}}
function mPlayerHit(e){const t=ytag("hit");return{d:220,on(){SND.se(e.v>0?"hit_player":"guard_block");if(e.v>0){A.P.tag=t;A.P.fi=0;A.P.tint="#FF4040";A.P.dx=-6;A.shake=2;fxNum(PC().x,PC().y-24,e.v,"#FF4040")}else{A.P.tag=ytag("guard");A.P.fi=0;fxRing(A.P.x+22,A.P.y-36,12,"#F7F9F5",200)}
  if(e.blk)fxNum(PC().x+14,PC().y-12,"-"+e.blk,"#8B95A3");A.disp.php=Math.max(0,A.disp.php-e.v);A.disp.pblk=Math.max(0,A.disp.pblk-(e.blk||0))},up(k){if(k>0.5){A.P.tint=null;if(A.P.tag===t)A.P.fi=yfi(t,1)}},end(){A.P.tag="stand";A.P.fi=0;A.P.dx=0}}}
function mEnemyAct(p,subs){const s=A.E.scale;
  if(p==="blk")return[{d:260,on(){SND.se("guard_block");A.E.tint="#8B95A3";fxRing(EC().x-16*s,EC().y,14*s,"#C9CED6",240)},end(){A.E.tint=null}}];
  return[{d:200,on(){SND.se("enemy_attack");A.E.tag="atk";A.E.fi=0;A.E.dx=6}},
    {d:90,on(){A.E.fi=1;A.E.dx=-26}},
    ...subs.map((e,i)=>Object.assign(mPlayerHit(e),{d:i<subs.length-1?150:220})),
    {d:150,on(){A.E.tag="stand";A.E.fi=0;A.E.dx=0}}]}
function mOver(e){return{d:260,on(){fxSheet("fx_overrev",PC().x,PC().y-30,1);SND.limiter();A.P.tint="#FF4040";A.shake=2;fxWord(A.P.x,A.P.y-80,"OVER REV","#FF4040",900);fxNum(PC().x,PC().y-24,e.v,"#FF4040");A.disp.php=Math.max(0,A.disp.php-e.v)},end(){A.P.tint=null}}}
function mBlow(){return[ys("blow",0,{d:500,on(){fxSheet("fx_blow",PC().x,PC().y,2);SND.blow();A.P.tint="#FF4040";A.shake=6;flash("#FF4040",160);fxWord(A.P.x+10,A.P.y-84,"ENGINE BLOW","#FF4040",1600)},up(){if(Math.random()<0.6)fxParts(FIST().x-8,FIST().y-6,2,["#2A2F3A","#4A5262","#8B95A3"],{a:-Math.PI/2,spread:0.8,v:30,g:-25,s:2,life:900})}}),
  ys("blow",1,{d:600,on(){A.P.tint=null},end(){A.P.hold=true}})]}
function mStop(){return[ys("stop",0,{d:600,on(){fxSheet("fx_stall",PC().x,PC().y-40,2);fxWord(A.P.x+10,A.P.y-84,"ENGINE STOP","#8B95A3",1600)},up(k){A.P.alpha=1-k*0.6},end(){A.P.hold=true}})]}
function mWin(){return[{d:700,on(){fxSheet("fx_remit",EC().x,EC().y,2);SND.engineStop();SND.se("enemy_down");fxWord(A.E.x-20,A.E.y-100,"REMIT","#C5FF45",1200)},up(k){A.E.alpha=1-k;A.E.dy=-k*20;if(Math.random()<0.8)fxParts(EC().x+(Math.random()-0.5)*30,EC().y+(Math.random()-0.5)*40,2,["#C5FF45","#F7F9F5"],{a:-Math.PI/2,spread:0.6,v:30,g:-30,life:700})}},
  ys("win",0,{d:400,end(){A.P.hold=true}})]}

/* engine の B.ev から、見せる順を組み立てる */
function playEvents(evs){
  let i=0;
  while(i<evs.length){const e=evs[i];
    if(e.k==="card"){
      if(e.shift)push(mShift(e.shift));
      // このカードで起きたこと（次の card・eact・turn まで）
      const sub=[];i++;while(i<evs.length&&!["card","eact","turn","win","dead","down"].includes(evs[i].k))sub.push(evs[i++]);
      const hits=sub.filter(x=>x.k==="ehit"),mo=MOTIONS[e.mo]?e.mo:"rev";
      const dmg=hits.reduce((a,x)=>a+x.v,0),cardSE={guard:"card_guard",skill:"card_guard",debuff:"card_attack_s",draw:"card_draw"}[mo];
      push({d:1,on(){if(hits.length)SND.attack(dmg);else if(cardSE)SND.se(cardSE);if(e.chain>=1)SND.se("chain_up",{lv:e.chain})}});
      push(...MOTIONS[mo](hits.length?hits:[]));
      sub.forEach(x=>{
        if(x.k==="frz")push({d:1,on(){fxParts(EC().x,EC().y-10,8,["#7FD8FF","#F7F9F5"],{v:25,g:10});fxWord(EC().x-10,EC().y-56,"FREEZE","#7FD8FF")}});
        if(x.k==="burn")push({d:1,on(){fxParts(EC().x,EC().y,8,["#FF8A3D","#FF4040","#FFD34D"],{a:-Math.PI/2,spread:0.8,v:30,g:-20})}});
        if(x.k==="heal")push({d:1,on(){fxNum(PC().x,PC().y-24,"+"+x.v,"#C5FF45");A.disp.php+=x.v}});
        if(x.k==="pblk")push({d:1,on(){A.disp.pblk+=x.v}});
        if(x.k==="over")push(mOver(x));
        if(x.k==="blow")push(...mBlow());
        // α2：ガソリンがもどる・大技の条件・場の効果・第2形態・ロールケージ
        if(x.k==="gas")push({d:1,on(){fxWord(PC().x,PC().y-70,"GAS","#FFB23F");setTimeout(()=>SND.se("gas_refill",{perfect:e.shift==="perfect"}),150)}});
        if(x.k==="frz")push({d:1,on(){SND.se("freeze")}});if(x.k==="burn")push({d:1,on(){SND.se("burn")}});if(x.k==="noise")push({d:1,on(){SND.se("noise")}});if(x.k==="gasout")push({d:1,on(){SND.se("gas_empty")}});
        if(x.k==="charge")push({d:1,on(){fxWord(PC().x+30,PC().y-80,"CHARGE","#FFD34D")}});
        if(x.k==="onup")push({d:1,on(){fxParts(PC().x,PC().y-20,6,["#7FD8FF","#F7F9F5"],{v:20,g:-10})}});
        if(x.k==="phase")push({d:300,on(){A.E.pal=x.pal||A.E.pal;if(x.glitch)A.E.glitch=1;A.flash={t:0,life:300,col:"#FFFFFF"}}});
        if(x.k==="cage")push({d:1,on(){fxWord(PC().x,PC().y-60,"CAGE","#FFD34D")}});
      });
      if(e.band)push({d:1,on(){fxWord(PC().x,PC().y-90,"BAND "+(CD(e.id).band||""),"#7FD8FF")}});
      continue;
    }
    if(e.k==="down"){push({d:160,on(){SND.se(G&&G.mode==="AT"?"parking":"shift_down");A.P.tag="stand";A.P.dy=2;fxParts(A.P.x-4,A.P.y-30,5,["#FF8A3D","#FFD34D"],{a:Math.PI,spread:0.5,v:30,g:-10,life:250})},end(){A.P.dy=0}});i++;
      while(i<evs.length&&evs[i].k==="draw")i++;if(i<evs.length&&evs[i].k==="over"){push(mOver(evs[i]));i++}continue}
    if(e.k==="eact"){if(i===0||evs[i-1].k!=="phit"&&evs[i-1].k!=="eact"&&evs[i-1].k!=="eblk")push({d:1,on(){SND.se("enemy_turn")}});const sub=[];i++;while(i<evs.length&&["phit","eblk"].includes(evs[i].k))sub.push(evs[i++]);
      push(...mEnemyAct(e.p,sub.filter(x=>x.k==="phit")));continue}
    if(e.k==="gasout"){push({d:1,on(){SND.se("gas_empty")}});i++;continue}
    if(e.k==="phase"){push({d:300,on(){A.E.pal=e.pal||A.E.pal;if(e.glitch)A.E.glitch=1;A.flash={t:0,life:300,col:"#FFFFFF"}}});i++;continue}
    if(e.k==="eburn"){push({d:200,on(){fxParts(EC().x,EC().y,10,["#FF8A3D","#FF4040"],{a:-Math.PI/2,spread:0.8,v:30,g:-20});fxNum(EC().x,EC().y-30,e.v,"#FF8A3D");A.disp.ehp=Math.max(0,A.disp.ehp-e.v)}});i++;continue}
    if(e.k==="turn"){push({d:1,on(){syncDisp()}});i++;continue}
    if(e.k==="win"){push(...mWin());i++;continue}
    if(e.k==="dead"){if(!evs.some(x=>x.k==="blow"))push(...mStop());i++;continue}
    i++;
  }
  push({d:1,on(){syncDisp()}});
}

/* ---- 描く ---- */
let lastT=0;
function loop(t){requestAnimationFrame(loop);const dt=Math.min(50,t-(lastT||t));lastT=t;A.now=t;
  try{step(dt);draw(dt)}catch(e){if(!A.errLogged){A.errLogged=1;console.error(e)}}}
/* ★零号の第2形態：ノイズを強めて見せる（横の帯をずらす・色ずれ。決定 2026-11-07） */
let GLC=null;
function glitchCanvas(cv){const w=cv.width,h=cv.height;if(!GLC||GLC.width!==w||GLC.height!==h){GLC=mkCanvas(w,h)}const g=GLC.getContext("2d");g.clearRect(0,0,w,h);
  const t=A.now,strong=Math.floor(t/90)%7===0;let y=0;
  while(y<h){const bh=4+Math.floor(Math.random()*18),off=(Math.random()<(strong?0.6:0.25))?Math.round((Math.random()-0.5)*(strong?24:8)):0;g.drawImage(cv,0,y,w,bh,off,y,w,bh);y+=bh}
  if(strong||Math.random()<0.2){g.globalCompositeOperation="lighter";g.globalAlpha=0.35;g.drawImage(tintCanvas(cv,"#FF2BD6"),3,0);g.drawImage(tintCanvas(cv,"#2BE8FF"),-3,0);g.globalAlpha=1;g.globalCompositeOperation="source-over"}
  return GLC}
function drawSprite(g,set,tag,fi,x,y,o){if(!set)return;let cv=frameOf(set,tag,fi);if(o.pal)cv=palCanvas(cv,o.pal);if(o.tint)cv=tintCanvas(cv,o.tint);if(o.glitch)cv=glitchCanvas(cv);
  const s=o.scale||1,f=set.foot||[cv.width/2,cv.height];g.globalAlpha=o.alpha==null?1:o.alpha;
  g.drawImage(cv,Math.round(x-f[0]*s),Math.round(y-f[1]*s),cv.width*s,cv.height*s);g.globalAlpha=1}
function draw(dt){
  const g=A.g;if(!g)return;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,RES.W,RES.H);
  if(A.mode==="none")return;
  const sx=A.shake?Math.round((Math.random()-0.5)*2*A.shake):0,sy=A.shake?Math.round((Math.random()-0.5)*2*A.shake):0;
  g.setTransform(1,0,0,1,sx,sy);
  if(A.mode==="dim"&&A.bgImg){g.drawImage(A.bgImg,0,0);g.fillStyle="rgba(10,12,24,.28)";g.fillRect(0,0,RES.W,RES.H)}// ★各画面の背景（絵は暗めに描いてあるので薄くだけ）
  else{drawStage(g,dt);
  if(A.mode==="battle"&&B){drawBattle(g)}
  else if(A.mode==="dim"){g.fillStyle="rgba(10,12,24,.62)";g.fillRect(0,0,RES.W,RES.H)}}
  // エフェクト
  A.fx.forEach(f=>{const k=f.t/f.life;
    if(f.k==="pt"){const tt=f.t/1000;g.globalAlpha=1-k;g.fillStyle=f.col;g.fillRect(Math.round(f.x+f.vx*tt),Math.round(f.y+f.vy*tt+0.5*f.g*tt*tt),f.s,f.s)}
    else if(f.k==="num"){g.globalAlpha=k<0.7?1:1-(k-0.7)/0.3;const w=digitsW(f.txt,2);digits(g,f.txt,Math.round(f.x-w/2)+1,Math.round(f.y-k*14)+1,"#171B22",2);digits(g,f.txt,Math.round(f.x-w/2),Math.round(f.y-k*14),f.col,2)}
    else if(f.k==="word"){g.globalAlpha=k<0.75?1:1-(k-0.75)/0.25;wordPx(g,f.txt,Math.round(f.x),Math.round(f.y-k*6),f.col)}
    else if(f.k==="line"){g.globalAlpha=1-k;g.fillStyle=f.col;const x1=Math.min(f.x1,f.x2),w=Math.abs(f.x2-f.x1);g.fillRect(Math.round(x1+(f.x2<f.x1?w*k:0)),Math.round(f.y1),Math.round(w*(1-k)),1)}
    else if(f.k==="ring"){g.globalAlpha=1-k;g.fillStyle=f.col;const r=Math.round(f.r*(0.6+0.4*k));for(let a=0;a<24;a++){const t=a/24*Math.PI*2;g.fillRect(Math.round(f.x+Math.cos(t)*r),Math.round(f.y+Math.sin(t)*r),1,1)}}
    else if(f.k==="spr"){const st=SPR[f.key],i=Math.min(st.frames.length-1,Math.floor(f.t/st.dur[0])),fr=st.frames[i];g.drawImage(fr,Math.round(f.x-fr.width*f.s/2),Math.round(f.y-fr.height*f.s/2),fr.width*f.s,fr.height*f.s)}
    else if(f.k==="cat"){g.globalAlpha=Math.sin(k*Math.PI)*0.8;catPx(g,Math.round(f.x),Math.round(f.y-k*6),4)}
    g.globalAlpha=1});
  g.setTransform(1,0,0,1,0,0);
  if(A.flash){g.globalAlpha=1-A.flash.t/A.flash.life;g.fillStyle=A.flash.col;g.fillRect(0,0,RES.W,RES.H);g.globalAlpha=1}
}
function drawBattle(g){
  if(A.dim){g.fillStyle=`rgba(5,6,14,${A.dim})`;g.fillRect(0,0,RES.W,RES.H)}
  // 足元の影
  // 足元の影（2段の楕円・graphics-hq の基準）
  const sh=(x,w)=>{g.fillStyle="rgba(0,0,0,.28)";g.fillRect(Math.round(x-w/2),PX.FLOOR-2,Math.round(w),4);g.fillStyle="rgba(0,0,0,.22)";g.fillRect(Math.round(x-w*0.35),PX.FLOOR-3,Math.round(w*0.7),6)};
  sh(A.P.x+A.P.dx,BODY()>40?64:32);sh(A.E.x+A.E.dx,(BODY()>40?(A.E.set.startsWith("boss")?96:64):36)*A.E.scale);
  const ei=idlePose(SPR[A.E.set]||SPR.van,A.E,1.7),pi=idlePose(SPR.YUKI,A.P,0);
  drawSprite(g,SPR[A.E.set]||SPR.van,ei.tag,ei.fi,A.E.x+A.E.dx,A.E.y+A.E.dy+ei.dy,{pal:A.E.pal,tint:A.E.tint,alpha:A.E.alpha,scale:A.E.scale,glitch:A.E.glitch});
  drawSprite(g,SPR.YUKI,pi.tag,pi.fi,A.P.x+A.P.dx,A.P.y+A.P.dy+pi.dy,{tint:A.P.tint,alpha:A.P.alpha});
  // 体力のバー（★C2 v2 の見本どおり、頭の上）
  const bw=RES.bars.w,by=RES.bars.y;
  bar(g,A.P.x-bw/2,by,bw,A.disp.php,A.disp.pmax,"#C5FF45",A.disp.pblk);
  const isB=B&&B.e&&B.e.rank==="boss"&&RES.boss,eby=isB?RES.boss.barY:by;// ★BUG-24：ボスは上の段（後ろに暗い帯）
  if(isB){const[sx,sy,sw,sh2]=RES.boss.strip;const gr=g.createLinearGradient(0,sy,0,sy+sh2);gr.addColorStop(0,"rgba(10,8,18,0.8)");gr.addColorStop(0.8,"rgba(10,8,18,0.62)");gr.addColorStop(1,"rgba(10,8,18,0)");g.fillStyle=gr;g.fillRect(sx,sy,sw,sh2)}
  bar(g,A.E.x-bw/2,eby,bw,A.disp.ehp,A.disp.emax,"#FF4040",A.disp.eblk);
  // ★予告：相手の HP がどれだけ減るか（点滅。倒せるときは白）
  if(A.pv&&A.pv.sim&&!busy()){const s0=A.pv.sim,cur=Math.max(0,B.e.hp),after=s0.win?0:Math.max(0,s0.ehp),mx=Math.max(1,B.e.maxhp);
    if(after<cur){const x0=Math.round(A.E.x-bw/2+bw*after/mx),x1=Math.round(A.E.x-bw/2+bw*cur/mx);g.globalAlpha=0.45+0.45*Math.sin(A.now/90);g.fillStyle=s0.win?"#FFFFFF":"#FFD34D";g.fillRect(x0,eby,Math.max(1,x1-x0),4);g.globalAlpha=1}}
  // 下の操作パネル
  const py=RES.panel.y;g.fillStyle="#0E111C";g.fillRect(0,py,RES.W,RES.H-py);g.fillStyle="#262B48";g.fillRect(0,py,RES.W,1);g.fillStyle="#171B22";g.fillRect(0,py+1,RES.W,1);
  if(METER.blank)meterC2(g,RES.meter[0],RES.meter[1]);else{tacho(g,RES.tacho.cx,RES.tacho.cy);gasGauge(g,RES.gas.x,RES.gas.y)}
}
function bar(g,x,y,w,v,mx,col,blk){g.fillStyle="#171B22";g.fillRect(x-1,y-1,w+2,6);g.fillStyle="#2A2F3A";g.fillRect(x,y,w,4);
  g.fillStyle=col;g.fillRect(x,y,Math.max(0,Math.round(w*Math.min(1,v/Math.max(1,mx)))),4);
  if(blk>0){g.fillStyle="#7FD8FF";g.fillRect(x+w+3,y-2,9,8);g.fillStyle="#171B22";g.fillRect(x+w+4,y-1,7,6)}
  // 数字は DOM（screens.js の .barn）：小さい数字はフォントのほうが読みやすい
}
/* ★大きいタコメーター（14:28 の仮。グラフィック班の ui\c2 のメーターが来たら絵に差しかえ）：
   LED の弧 28個（4×4）・シフトの帯（緑）・7000〜リミットは赤・打ちごろの帯（触ったカード）は水色に光る・真ん中にギア */
function tacho(g,cx,cy){if(!B||!G)return;
  const C=car(),b=bandRange(),L=limit(),MAX=Math.ceil((L+1000)/1000)*1000,N=28,R=RES.tacho.r,rl=redLo();
  g.fillStyle="#0A0C14";g.fillRect(cx-56,cy-52,112,96);g.fillStyle="#262B48";g.fillRect(cx-56,cy-52,112,1);g.fillRect(cx-56,cy+43,112,1);g.fillRect(cx-56,cy-52,1,96);g.fillRect(cx+55,cy-52,1,96);
  const hb=A.pv&&A.pv.band,rv=B.rpm+tachWobble();
  for(let i=0;i<N;i++){const v=(i+0.5)/N*MAX,a=(-135+270*(i+0.5)/N)*Math.PI/180,x=Math.round(cx+Math.sin(a)*R)-2,y=Math.round(cy-4-Math.cos(a)*R)-2;
    const col=v>L?"#A3001A":v>=rl?"#FF4040":(v>=b.clo&&v<=b.chi)?"#C5FF45":(v>=b.lo&&v<=b.hi)?"#5BE37D":"#F7F9F5";
    const on=v<=rv+MAX/N/2,top=on&&v>rv-MAX/N/2;
    if(hb&&v>=hb[0]&&v<=hb[1]){g.globalAlpha=0.55+0.35*Math.sin(A.now/120);g.fillStyle="#7FD8FF";g.fillRect(x-1,y-1,6,6)}
    g.globalAlpha=on?(top?0.75+0.25*Math.sin(A.now/70):1):0.16;g.fillStyle=col;g.fillRect(x,y,4,4);g.globalAlpha=1}
  // 予告：打ったあとの回転（白い点）
  if(A.pv&&A.pv.sim){const v=Math.min(MAX,A.pv.sim.rpm),a=(-135+270*v/MAX)*Math.PI/180;g.fillStyle="#FFFFFF";g.globalAlpha=0.5+0.5*Math.sin(A.now/90);
    g.fillRect(Math.round(cx+Math.sin(a)*(R-8))-1,Math.round(cy-4-Math.cos(a)*(R-8))-1,3,3);g.globalAlpha=1}
  const gear=String(B.gear+1),over=B.rpm>L;
  digits(g,gear,cx-7,cy-18,over?"#FF4040":B.rpm>=rl?"#FF8A40":"#C5FF45",6);
  // シフトアップの残り（1ターン3回）のランプ
  for(let i=0;i<RULES.shiftCap;i++){const on=i>=B.shiftsT;g.fillStyle=on?"#C5FF45":"#2A2F3A";g.fillRect(RES.lamps.x+i*8,RES.lamps.y,6,4)}
}
/* ★ガソリンゲージ（5目盛り・燃料計の形）：触ったカードの消費は点滅、シフトでもどる分は水色 */
function gasGauge(g,x,y){if(!B||!G)return;const M=maxGas(),w=RES.gas.w,h=RES.gas.h;
  g.fillStyle="#0A0C14";g.fillRect(x,y,w,h);g.fillStyle="#262B48";g.fillRect(x,y,w,1);g.fillRect(x,y+h-1,w,1);g.fillRect(x,y,1,h);g.fillRect(x+w-1,y,1,h);
  // 給油機のアイコン・F／E
  g.fillStyle="#8B95A3";g.fillRect(x+5,y+6,6,8);g.fillRect(x+11,y+8,2,4);g.fillStyle="#0A0C14";g.fillRect(x+6,y+7,4,2);
  wordPx(g,"F",x+w-8,y+4,"#8B95A3");wordPx(g,"E",x+w-8,y+h-16,"#8B95A3");
  const cellH=Math.floor((h-24)/M)-2,cx=x+16,cwid=w-30;const use=A.pv&&A.pv.ok?A.pv.gas:0,aft=A.pv&&A.pv.gasAfter!=null?A.pv.gasAfter:null;
  for(let i=0;i<M;i++){const yy=y+h-6-(i+1)*(cellH+2);let col="#2A2F3A",al=1;
    if(i<B.gas){col=B.gas<=1?"#FF4040":"#FFB23F";if(use&&i>=B.gas-use){al=0.35+0.45*Math.sin(A.now/100)}}
    if(aft!=null&&i>=B.gas-use&&i<aft){col="#7FD8FF";al=0.7}
    g.globalAlpha=al;g.fillStyle=col;g.fillRect(cx,yy,cwid,cellH);g.globalAlpha=1}
}
/* 英字の言葉（PERFECT・REMIT など）：小さな 5×5 の英字 */
const LET={A:"0111010001111111000110001",H:"1000110001111111000110001",X:"1000101010001000101010001",B:"1111010001111101000111110",C:"0111110000100001000001111",D:"1111010001100011000111110",E:"1111110000111101000011111",F:"1111110000111101000010000",G:"0111110000100111000101111",I:"1111100100001000010011111",K:"1000110010111001001010001",L:"1000010000100001000011111",M:"1000111011101011000110001",N:"1000111001101011001110001",O:"0111010001100011000101110",P:"1111010001111101000010000",R:"1111010001111101001010001",S:"0111110000011100000111110",T:"1111100100001000010000100",U:"1000110001100011000101110",V:"1000110001100010101000100",W:"1000110001101011101110001",Y:"1000101010001000010000100",Z:"1111100010001000100011111"," ":"0000000000000000000000000"};
function wordPx(g,txt,x,y,col){const w=txt.length*6-1;let cx=Math.round(x-w/2);
  for(const ch of txt){const m=LET[ch];if(m){for(let j=0;j<5;j++)for(let i=0;i<5;i++)if(m[j*5+i]==="1"){g.fillStyle="#171B22";g.fillRect(cx+i+1,y+j+1,1,1);g.fillStyle=col;g.fillRect(cx+i,y+j,1,1)}}cx+=6}}
function catPx(g,x,y,s){const m=["w.......w","ww.....ww","www...www","wwwwwwwww","wwbwwwbww","wwwwwwwww","wwwwbwwww",".wwwwwww.","..wwwww.."];
  m.forEach((r,j)=>{for(let i=0;i<r.length;i++)if(r[i]!=="."){g.fillStyle=r[i]==="b"?"#171B22":"#F7F9F5";g.fillRect(x+(i-4)*s,y+(j-4)*s,s,s)}})}

/* ---- 待機のループ（★2026-11-06 14:35）----
   動きの途中でないとき（stand）は、絵に idle のタグがあればそれをくり返す。なければ、ゆっくり1ドット上下（敵は ふわっと）。 */
function idlePose(set,act,phase){
  const out={tag:act.tag,fi:act.fi,dy:0};if(!set||act.tag!=="stand"||busy())return out;
  const t=A.now+phase*1000,tg=set.tags.idle;
  if(tg){const from=tg[0],to=tg[1];let tot=0;for(let i=from;i<=to;i++)tot+=set.dur[i]||120;let x=t%tot;
    for(let i=from;i<=to;i++){x-=set.dur[i]||120;if(x<0){out.tag="idle";out.fi=i-from;break}}return out}
  out.dy=act===A.E?Math.round(Math.sin(t/700)*1.5*BG_FX.strength*1.6):(Math.sin(t/900)>0.6?-1:0);
  return out}
/* ---- タコメーターのアイドリングのゆれ：いちばん上の LED がちらつき、アイドリングのときは針が少しだけ上下 ---- */
function tachWobble(){if(!B||busy())return 0;const C=car();if(B.rpm>C.idle+300)return 0;return Math.round((Math.sin(A.now/90)+Math.sin(A.now/53))*60)}
/* ---- 背景：動かない層＋動く層（data/stages.js） ---- */
function drawStage(g,dt){
  if(STAGE_C2[A.bgKey]){drawStageC2(g,dt,STAGE_C2[A.bgKey]);return}
  const rt=STAGE_RT[A.bgKey];if(!rt){const bg=SPR.bg_street;if(bg&&bg.layers)bg.layers.forEach(l=>g.drawImage(l,0,0,RES.W,RES.H));return}
  const L=rt.layers,iw=L[0]?L[0].width:RES.W,ih=L[0]?L[0].height:RES.H,sx=RES.W/iw,sy=RES.H/ih,S=BG_FX.strength,t=A.now;
  const lay=i=>{const w=rt.move.find(m=>m.t==="wave"&&m.layer===i);const im=L[i];if(!im)return;
    if(!w){g.drawImage(im,0,0,RES.W,RES.H);return}
    // その層：ゆらす帯の上はそのまま、帯は細い横の帯に分けて少しずつずらす
    g.drawImage(im,0,0,iw,w.y0,0,0,RES.W,w.y0*sy);
    const band=w.band||2,amp=(w.amp||1)*S;
    for(let y=w.y0;y<w.y1;y+=band){const off=Math.round(Math.sin(t/(w.period||2400)*Math.PI*2+y*0.35)*amp*sx);
      g.drawImage(im,0,y,iw,band,off,y*sy,RES.W,band*sy)}
    if(w.y1<ih)g.drawImage(im,0,w.y1,iw,ih-w.y1,0,w.y1*sy,RES.W,(ih-w.y1)*sy)};
  L.forEach((_,i)=>{lay(i);
    // この層の上に重ねる動き（glow は層の直後）
    rt.move.forEach(m=>{if(m.t==="glow"&&(m.layer||0)===i&&m.mask){const k=0.5+0.5*Math.sin(t/(m.period||2600)*Math.PI*2);
      const fl=Math.random()<0.004?0.4:1;g.globalAlpha=Math.min(BG_FX.max,(m.alpha||0.4)*S*k*fl);g.globalCompositeOperation="lighter";g.drawImage(m.mask,0,0,RES.W,RES.H);g.globalCompositeOperation="source-over";g.globalAlpha=1}})});
  rt.move.forEach(m=>{const a=Math.min(BG_FX.max,(m.alpha==null?0.8:m.alpha)*(m.t==="snow"?1:S));
    if(m.t==="sheet"&&m.frames){let x=t%m.total,fi=0;for(let i=0;i<m.dur.length;i++){x-=m.dur[i];if(x<0){fi=i;break}}const f=m.frames[fi];
      g.globalAlpha=a;g.drawImage(f,Math.round(m.x*sx),Math.round(m.y*sy),f.width*sx,f.height*sy);g.globalAlpha=1}
    else if(m.t==="blink"&&m.img){const k=0.5+0.5*Math.sin(t/(m.period||2000)*Math.PI*2),al=(m.min||0.2)+((m.max||1)-(m.min||0.2))*k;
      g.globalAlpha=Math.min(BG_FX.max,al*S);g.drawImage(m.img,Math.round((m.x||0)*sx),Math.round((m.y||0)*sy),m.img.width*sx,m.img.height*sy);g.globalAlpha=1}
    else if(m.t==="flow"){const sp=(m.speed||40)*S,gap=m.gap||160,w=(m.w||6),h=(m.h||1),span=iw+gap;
      g.globalAlpha=a;for(let x0=((t/1000*sp)%span+span)%span-gap;x0<iw+gap;x0+=gap){const x=Math.round(x0*sx),y=Math.round(m.y*sy);
        if(m.img)g.drawImage(m.img,x,y,m.img.width*sx,m.img.height*sy);else{g.fillStyle=m.col||"#FFF6B0";g.fillRect(x,y,Math.round(w*sx),Math.max(1,Math.round(h*sy)))}}g.globalAlpha=1}
    else if(m.t==="snow"&&m.p){g.fillStyle="#F7F9F5";g.globalAlpha=a;m.p.forEach(s=>{s.y+=s.v*dt/1000/RES.H;s.x-=s.v*dt/3000/RES.W;if(s.y>1){s.y=-0.01;s.x=Math.random()}if(s.x<0)s.x+=1;
      g.fillRect(Math.round(s.x*RES.W),Math.round(s.y*RES.H),s.s,s.s)});g.globalAlpha=1}});
}

/* ===== ★C2 の背景を描く（順：base → 窓 → 車 → ネオン → 映りこみ → 雪。強さは BG_FX＝キャラより目立たない）===== */
function drawStageC2(g,dt,st){try{drawStageC2_(g,dt,st)}catch(e){if(!A.bgErr){A.bgErr=1;console.error(e)}g.globalAlpha=1}}// BUG-21：背景の層で何が起きても、キャラ・メーターは描く
function drawStageC2_(g,dt,st){const t=A.now,S=BG_FX.strength;g.drawImage(st.base,0,0);
  if(st.pixels){g.fillStyle=st.pixels.col;st.pixels.pts.forEach(p=>{p.next-=dt;if(p.next<=0){if(p.off>0){p.off=0;p.next=st.pixels.per[0]+Math.random()*(st.pixels.per[1]-st.pixels.per[0])}else{p.off=1;p.next=500+Math.random()*1500}}if(p.off)g.fillRect(p.x,p.y,1,1)})}
  if(st.cars){const c=st.cars,[[x0,y0],[x1,y1]]=c.path;c.next-=dt;if(c.next<=0&&c.list.length<3){c.next=c.spawn[0]+Math.random()*(c.spawn[1]-c.spawn[0]);c.list.push({k:0,dir:Math.random()<0.5?1:-1,v:c.sp[0]+Math.random()*(c.sp[1]-c.sp[0])})}
    const len=Math.hypot(x1-x0,y1-y0);g.globalAlpha=c.alpha*S;c.list=c.list.filter(o=>{o.k+=o.v*S*dt/1000/len;if(o.k>1)return false;const q=o.dir>0?o.k:1-o.k,im=o.dir>0?c.r:c.l;if(im)g.drawImage(im,Math.round(x0+(x1-x0)*q-im.width/2),Math.round(y0+(y1-y0)*q-im.height/2));return true});g.globalAlpha=1}
  st.neon.forEach(n=>{const per=n.period_ms,ph=((t+n.ph)%per)/per,[lo,hi]=n.alpha;let k;
    if(n.move==="pulse"||n.move==="glow")k=0.5+0.5*Math.sin(ph*Math.PI*2);else if(n.move==="blink")k=ph<0.5?1:0;
    else k=(ph>0.9&&Math.floor(ph*60)%2)?0:1;// flicker：周期の終わりに2〜3回ちらつく
    const a=lo+(hi-lo)*k;g.globalAlpha=1-(1-a)*S;g.drawImage(n.im,n.x,n.y);g.globalAlpha=1});
  st.sheets.forEach(s0=>{const i=Math.floor(t/s0.ms)%s0.fr.length;g.globalAlpha=0.5+0.5*S;g.drawImage(s0.fr[i],s0.x,s0.y);g.globalAlpha=1});
  if(st.snow){const sn=st.snow,[ax,ay,aw,ah]=sn.area;sn.p.forEach(p=>{p.y+=p.v*S*dt/1000;p.ph+=dt/700;if(p.y>ay+ah){p.y=ay;p.x=Math.random()*aw}
    g.globalAlpha=sn.alpha[p.k]*S/0.6>1?sn.alpha[p.k]:sn.alpha[p.k]*S/0.6;if(sn.ims[p.k])g.drawImage(sn.ims[p.k],Math.round(ax+p.x+Math.sin(p.ph)*p.sw),Math.round(p.y))});g.globalAlpha=1}
}
/* ===== ★メーター（ui\c2）：下地＋LED の弧（打ちごろの帯は水色・レッドは赤・触ったカードの帯は光る）＋ギア・回転・燃料のコマ ===== */
const MCOL={lime:[197,255,69],limeD:[40,56,14],cyan:[70,230,255],cyanD:[20,80,100],red:[255,52,64],redD:[170,24,40],hi:[244,246,240]};// ★meter_c2_frame.json の colors
function meterC2(g,x0,y0){const M=METER;g.drawImage(M.blank,x0,y0);if(!B||!G)return;
  const L=limit(),MAX=Math.ceil((L+1000)/1000)*1000,b=bandRange(),rl=redLo(),rv=B.rpm+tachWobble(),hb=A.pv&&A.pv.band,blink=0.5+0.5*Math.sin(A.now/120);
  const key=[Math.round(rv/50),hb?hb.join():"",Math.round(blink*4),L].join("|");
  if(M.key!==key){M.key=key;if(!M.ring_cv){M.ring_cv=mkCanvas(M.W,M.H);M.ring_g=M.ring_cv.getContext("2d")}const id=M.ring_g.createImageData(M.W,M.H),d=id.data;
    M.ring.forEach(p=>{const v=M.frame?(p.seg+0.5)*M.segRpm:p.t*MAX,on=v<=rv;let c;
      if(hb&&v>=hb[0]&&v<=hb[1])c=on?MCOL.hi:[Math.round(40+80*blink),Math.round(90+90*blink),Math.round(110+90*blink)];
      else if(v>=rl)c=on?MCOL.red:MCOL.redD;else if(v>=b.lo&&v<=b.hi)c=on?MCOL.cyan:MCOL.cyanD;else c=on?MCOL.lime:MCOL.limeD;
      const i=(p.y*M.W+p.x)*4;d[i]=c[0];d[i+1]=c[1];d[i+2]=c[2];d[i+3]=255});
    M.ring_g.putImageData(id,0,0)}
  g.drawImage(M.ring_cv,x0,y0);
  // ★枠の絵のとき：打ちごろの帯の外側の弧（band_arc_r の円周・水色）。触ったカードの帯は白く点滅
  if(M.frame){const top=M.segs*M.segRpm,arc=(lo,hi,col,al)=>{lo=Math.max(0,lo);hi=Math.min(top,hi);if(hi<=lo)return;g.globalAlpha=al;g.fillStyle=col;
      const n=Math.ceil((hi-lo)/top*270*M.arcR*Math.PI/180*1.5);let last="";
      for(let k=0;k<=n;k++){const t=(lo+(hi-lo)*k/n)/top,ang=(-135+270*t)*Math.PI/180,px=Math.round(x0+M.cx+M.arcR*Math.sin(ang)),py=Math.round(y0+M.cy-M.arcR*Math.cos(ang)),kk=px+","+py;if(kk!==last){g.fillRect(px,py,1,1);last=kk}}g.globalAlpha=1};
    arc(b.lo,b.hi,"#46E6FF",0.7+0.3*blink);if(hb)arc(hb[0],hb[1],"#F4F6F0",0.4+0.6*blink)}
  // ギア（大きく）と回転の数字
  const gear=String(B.gear+1),over=B.rpm>L,gc=over?"#FF4040":B.rpm>=rl?"#FF8A40":"#C5FF45",gw=digitsW(gear,5);
  digits(g,gear,x0+M.cx-Math.round(gw/2),y0+M.gearCy-12,gc,5);
  const rs=String(B.rpm),rw=digitsW(rs,1);digits(g,rs,x0+M.cx-Math.round(rw/2),y0+75,over?"#FF4040":"#F4F6F0",1);
  // 燃料のコマ（下から。触ったカードの消費は点滅、シフトでもどる分は水色）
  const mg=maxGas(),use=A.pv&&A.pv.ok?A.pv.gas:0,aft=A.pv&&A.pv.gasAfter!=null?A.pv.gasAfter:null,top=M.cells[0][0],bot=M.cells[M.cells.length-1][1],ch=Math.floor((bot-top+3)/mg)-3;
  for(let i=0;i<mg;i++){let y1=bot-i*(ch+3),yy=y1-ch+1;if(mg===M.cells.length){const c=M.cells[M.cells.length-1-i];yy=c[0];y1=c[1]}const chh=y1-yy+1;let col="#1C1A2A",al=1;
    if(i<B.gas){col=B.gas<=1?"#FF4060":"#C5FF45";if(use&&i>=B.gas-use)al=0.3+0.5*blink}
    if(aft!=null&&i>=B.gas-use&&i<aft){col="#46E6FF";al=0.8}
    g.globalAlpha=al;g.fillStyle=col;g.fillRect(x0+M.cellX[0]+1,y0+yy+1,M.cellX[1]-M.cellX[0]-2,chh-2);g.globalAlpha=1}
  if(use){digits(g,String(use),x0+M.useX+5,y0+M.useY-2,"#FF5460",1);g.fillStyle="#FF5460";g.fillRect(x0+M.useX,y0+M.useY,3,1)}
  // シフトアップの残り（1ターン3回）
  for(let i=0;i<RULES.shiftCap;i++){g.fillStyle=i>=B.shiftsT?"#C5FF45":"#2A2F3A";g.fillRect(x0+8+i*7,y0+100,5,3)}
}
