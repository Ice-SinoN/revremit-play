"use strict";
/* ===== ★v0.22.28 ランを始める流れ（★虎雪 11-19 11:30・11:32。progression 1-23）=====
   タイトル「MT／AT で走る」→ キャラ → 夜（難易度）→（ミニカーがあれば）ガレージ → 確認 → 端末につなぐ演出 → ラン開始。
   クリアの★：キャラ × 走りかた × 夜（profile.clearRec["YUKI|MT"]=[夜...]）。前の版のセーブは、クリアしたミニカーから
   キャラ × 走りかたの「クリア済み（夜は不明＝0）」だけ足す（夜ごとの★は、この版からクリアした夜）。 */
FULL_SCREENS.push("nights","runok","boot");Object.assign(SCREEN_BG,{nights:"garage",runok:"garage"});
/* 戦闘スタイル（progression 1-23・デザイン班 11-19 11:45。文はあとでデザイン班が直す） */
const CHAR_STYLE={
  YUKI:["守ってから返すカウンター型。凍結で敵の番を遅らせ、そのあいだに攻める。","ねらい：細雪・ホワイトアウトで止めて、白猫の護りの防御でしのぐ。はじめての人におすすめ。"],
  HINA:["ギアが5速と少なく、一気に上げて押し切る速攻型。最初の2ターンは受けるダメージが半分。","ねらい：敵が動く前に、安いアタックを重ねて倒しきる。長引くと、耐久の少なさがひびく。"],
  MOMO:["1ターンにカードをたくさん打つほど、あとのカードが強くなるチェイン型。","ねらい：安いカードでつないで、桃花・満開で大きく決める。チェイン3以上で打てる攻撃が手札にないと、「花の便り」で1枚引ける。"],
  NANA:["8速まであり、1ターンに4回までシフトアップできるシフト連打型。パーフェクトのたびに防御が増える。","ねらい：帯でパーフェクトを重ねて、高いギアへ。八連・凱旋で一気に削る。"],
  SORA:["安いカードを手数で打ちつづけるテンポ型。","ねらい：軽いカードをリズムよくつなぎ、手を止めない。"],
  KAEDE:["回転をレッドゾーンまで上げて、強い一撃で押し切るパワー型。オーバーレブとの勝負。","ねらい：回転を上げきったところで大技を打つ。"],
  RIN:["敵の攻撃を弱めたり、動きを止めたりする妨害型。","ねらい：敵の予告を見て、大きい攻撃の前に止める。"],
  LUNA:["山札の先を見て、引くカードを選べる先読み型。","ねらい：先を読んで、強いカードがそろう番に合わせて打つ。"],
  MIO:["ギアの段がない特殊な型。シフトのかわりに、いちばん強い回転を保ちつづける。","ねらい：強い回転のあたりをキープして、止まらずに打ちつづける。"],
  KURO:["エンジンのかわりに心拍で動く特殊な型。打つほど心拍が上がり、上げすぎると息切れ。","ねらい：心拍を高く保ちながら、休む番でととのえる。"]};
/* ---- クリアの記録 ---- */
function clearRecOf(p){p=p||PRF();if(!p.clearRec||typeof p.clearRec!=="object"||Array.isArray(p.clearRec)){p.clearRec={};
  try{normMinicars(p.minicars).forEach(m=>{if(m.clear){const k=m.char+"|"+m.mode;if(!p.clearRec[k])p.clearRec[k]=[0]}})}catch(e){}}return p.clearRec}
function clearMark(ch,mode,n){const r=clearRecOf(),k=ch+"|"+mode;r[k]=Array.isArray(r[k])?r[k]:[];if(!r[k].includes(n))r[k].push(n)}
function clearedAny(ch,mode){return(clearRecOf()[ch+"|"+mode]||[]).length>0}
function clearedNight(ch,mode,n){return(clearRecOf()[ch+"|"+mode]||[]).includes(n)}
function starHTML(on,lab){return`<span class="cst${on?" on":""}">${on?"★":"☆"}${lab?esc(lab):""}</span>`}
function charStars(ch,mode){return["MT","AT"].map(m=>`<span class="${m===mode?"":"dim"}">${starHTML(clearedAny(ch,m),m)}</span>`).join(" ")}
/* ---- 待機の絵（戦闘の idle）を小さな canvas に。未解放はシルエット ---- */
function chavStart(){if(S.chavOn)return;S.chavOn=true;const loop=()=>{if(!["chars","runok","nights","garage"].includes(window.SCREEN)){S.chavOn=false;return}
  document.querySelectorAll("canvas.chav").forEach(cv=>{const set=SPR[cv.dataset.ch];const g=cv.getContext("2d");g.clearRect(0,0,cv.width,cv.height);
    if(!set||set.proc){g.fillStyle="#3a3550";g.font="24px PM12";g.textAlign="center";g.fillText("？",cv.width/2,cv.height*0.65);return}
    const t=set.tags.idle||set.tags.stand||[0,0],n=t[1]-t[0]+1,ms=(set.dur&&set.dur[t[0]])||120,fr=set.frames[t[0]+Math.floor(performance.now()/ms)%n];if(!fr)return;
    const sc=Math.min(cv.width/fr.width,cv.height/fr.height)*(+cv.dataset.z||1),w=fr.width*sc,h=fr.height*sc,fx=(set.foot?set.foot[0]:fr.width/2)*sc,fy=(set.foot?set.foot[1]:fr.height)*sc;
    const x=Math.round(cv.width/2-fx),y=Math.round(cv.height-2-fy);
    if(cv.dataset.sil){const o=S.silCv||(S.silCv=document.createElement("canvas"));o.width=cv.width;o.height=cv.height;const q=o.getContext("2d");q.imageSmoothingEnabled=false;q.clearRect(0,0,o.width,o.height);
      q.drawImage(fr,x,y,w,h);q.globalCompositeOperation="source-in";q.fillStyle="#3a3456";q.fillRect(0,0,o.width,o.height);q.globalCompositeOperation="source-over";g.drawImage(o,0,0)}
    else{g.imageSmoothingEnabled=false;g.drawImage(fr,x,y,w,h)}});requestAnimationFrame(loop)};requestAnimationFrame(loop)}
/* ---- 1. 走りかた（タイトルのボタン）---- */
function startFlow(mode){SND.se("ui_ok");S.flow={mode};try{if(PRF().lastMode!==mode){PRF().lastMode=mode;SAVE.auto()}}catch(e){}S.chSel=curChar();showChars()}
const flowMode=()=>(S.flow&&S.flow.mode)||PRF().lastMode||"MT";
/* ---- 2. キャラ ---- */
function renderChars(){const op=charsOpen(),sel=op.includes(S.chSel)?S.chSel:curChar(),mode=flowMode();S.chSel=sel;
  let h=`<div class="hdr" ${at(8,6,300,18)}>キャラをえらぶ（${esc(mode)}）</div>${backBtn("もどる","S.flow=null;showTitle()")}`;
  CHAR_ORDER.forEach((c,i)=>{const C=CHARS[c],on=op.includes(c),x=16+i*128;
    h+=`<button class="u9 chcard${sel===c?" main":""}${on?"":" lock"}" ${at(x,30,122,124)} ${on?`onclick="S.chSel='${c}';SND.se('ui_ok');renderChars()"`:"disabled"}>
      <canvas class="chav" data-ch="${c}" ${on?"":'data-sil="1"'} width="112" height="70"></canvas>
      ${on?`<div class="chn">${esc(TEXT.names[c]||c)}</div><div class="small cstars">${charStars(c,mode)}</div>`
        :`<div class="chn">？？？</div><div class="small dim">NIGHT ${C.join} を<br>クリアで加わる</div>`}</button>`});
  const C=CHARS[sel],st=CHAR_STYLE[sel]||[];
  h+=`<div class="sign chdet" ${at(16,160,456,192)}><div class="h">${esc(sel)}（${esc(TEXT.names[sel]||"")}）　${esc(C.carName)} → ${esc(C.weapon||"")}</div>
    <div class="small dim">型：${esc(C.type)}　${C.car.gears}速・レッド ${C.car.red}・リミット ${C.car.limit}・耐久 ${C.car.hp}</div>
    <div class="small gold">戦闘スタイル</div>${st.map(t=>`<div class="small">${esc(t)}</div>`).join("")}
    <div class="small gold">キャラの決まり</div><div class="small">${esc(ruleTxtOf(sel)||"なし")}</div>
    <div class="small dim">固有スキル：${esc(CARDS[C.skill].n)}</div></div>
   <div class="col" ${at(484,250,140)}><button class="main u9" onclick="PRF().char=S.chSel;SAVE.auto();S.deck=null;showNights()">${esc(TEXT.names[sel]||sel)}で走る<br><span class="small">つぎ：夜をえらぶ</span></button></div>`;
  ui().innerHTML=h;chavStart()}
/* ---- 3. 夜（難易度）---- */
function showNights(){setScreen("nights");setScene("dim");setBg("garage");closeModal();SND.se("ui_ok");renderNights()}
function renderNights(){const mx=nightMaxAvail(),cur=curNight(),U=TEXT.ui,last=typeof BETA_NIGHTS==="number"?BETA_NIGHTS:NIGHTS.length,ch=curChar(),mode=flowMode(),o=mode==="MT"?"AT":"MT";
  const sc=$("#nl")?$("#nl").scrollTop:0;
  ui().innerHTML=`<div class="hdr" ${at(8,6,300,18)}>夜をえらぶ（${esc(TEXT.names[ch]||ch)}・${esc(mode)}）</div>${backBtn("もどる","showChars()")}
   <div class="sign" ${at(8,30,452,324)}></div><div class="small dim ninfo" ${at(16,34,440,26)}>決まりは前の夜のぶんに足されていく。クリアすると次の夜が開く。★＝${esc(TEXT.names[ch]||ch)}でクリアした夜（うすい★は、もう1つの走りかた）</div>
   <div class="scroll nlist2" id="nl" ${at(14,62,440,286)}>`+
    NIGHTS.slice(0,last).map(x=>{const lab=x.n===NIGHTS.length?U.night_last:U.night_label.replace("{n}",x.n),bl=nightRules(x.n).noBlow||x.n<3||/ブロー/.test(x.add)?"":`<span class="nblow">${esc(U.night_blow)}</span>`;
      const st=`${starHTML(clearedNight(ch,mode,x.n),mode)}<span class="dim"> ${starHTML(clearedNight(ch,o,x.n),o)}</span>`;
      return x.n<=mx?`<button class="${x.n===cur?"main":""} nrow2" onclick="PRF().night=${x.n};SAVE.auto();SND.jingle('night_select',{lv:${x.n}});renderNights()"><span class="nst">${st}</span><b>${esc(lab)}</b>${bl}<br><span class="small">${esc(x.add)}</span></button>`
        :`<button class="nrow2" disabled><b>${esc(lab)}</b>　<span class="small dim">${esc(U.night_lock)}</span></button>`}).join("")+`</div>
   <div class="sign side" ${at(472,70,160,120)}><div class="h">NIGHT ${cur}</div><div class="small">${starHTML(clearedNight(ch,mode,cur),mode+" クリア")}</div><div class="small dim">${starHTML(clearedNight(ch,o,cur),o+" クリア")}</div>
    <div class="small dim">${nightRules(cur).noBlow||cur<3?"ブローなし":"ブローあり"}</div></div>
   <div class="col" ${at(472,250,160)}><button class="main u9" onclick="flowAfterNight()">この夜で走る<br><span class="small">つぎ：${loadMinicars().length?"ミニカー":"確かめる"}</span></button></div>`;
  if($("#nl"))$("#nl").scrollTop=sc}
function flowAfterNight(){SND.se("ui_ok");if(loadMinicars().length){S.mcSel=[];showMinicarGarage(flowMode())}else runConfirm([])}
/* ---- 4. 確認（★虎雪 11:35：ダイアログ。難易度・キャラ・デッキ〈はじめのカード〉・ミニカー → よろしいですか？ OK／もどる）---- */
function runConfirm(bring){S.flowBring=(bring||[]).slice();
  const ch=curChar(),mode=flowMode(),n=curNight(),C=CHARS[ch],dk=loadDeck(ch),U=TEXT.ui,lab=n===NIGHTS.length?U.night_last:U.night_label.replace("{n}",n);
  const cards=Object.keys(dk).sort((a,b)=>"SKERC".indexOf(rarityOf(a))-"SKERC".indexOf(rarityOf(b))||CARDS[a].c-CARDS[b].c).map(id=>`<span class="rcc r-${rarityOf(id)}">${esc(CARDS[id].n)}<b>×${dk[id]}</b></span>`).join("");
  const mc=S.flowBring.length?S.flowBring.map(m=>`<span class="rcc">${esc(TEXT.names[m.char]||m.char)}・${esc(m.rank)}<b>${m.cards.length}枚</b></span>`).join(""):`<span class="dim">なし</span>`;
  modal(`<div class="rcf"><div class="h">よろしいですか？</div><div class="small dim">この内容で、ランを始めます。</div>
   <div class="rtop"><canvas class="chav" data-ch="${ch}" width="72" height="72"></canvas><div class="rcol">
    <div class="rrow"><span class="dim">難易度</span><b>${esc(lab)}</b>${starHTML(clearedNight(ch,mode,n),"")}<span class="small dim">${nightRules(n).noBlow||n<3?"ブローなし":"ブローあり"}</span></div>
    <div class="rrow"><span class="dim">キャラ</span><b>${esc(TEXT.names[ch]||ch)}</b><span class="small dim">${esc(C.carName)}・${esc(mode)}</span></div>
    <div class="rrow"><span class="dim">ミニカー</span><span class="rcs">${mc}</span></div></div></div>
   <div class="small dim">デッキ（はじめのカード ${deckCount(dk)}枚）</div><div class="rcs rdeck">${cards}</div>
   <div class="row"><button class="main" onclick="runGo()">OK</button><button onclick="runBack()">もどる</button></div></div>`);
  const m=$("#modal .modal .box");if(m)m.classList.add("rcbox");SND.se("ui_ok");chavStart()}
function runBack(){SND.se("ui_cancel");closeModal()}
function runGo(){const mode=flowMode(),bring=S.flowBring||[];closeModal();S.flow=null;bootSeq(()=>newRun(mode,bring),mode,bring)}
/* ---- 5. キャラが光の粒になって端末に吸いこまれる（★虎雪 11:35。約3秒・タップでとばす）----
   粒は戦闘の待機の絵のピクセルから作る（色はキャラの色）。端末はコードで描く（絵が来たら差しかえ）。 */
function bootSeq(done,mode,bring){const ch=curChar();setScreen("boot");setScene("dim");closeModal();SND.bgmStop&&SND.bgmStop();
  ui().innerHTML=`<div class="boot" ${at(0,0,640,360)} onclick="bootSkip()"><canvas id="bootcv" width="640" height="360"></canvas><div class="small bskip">タップでとばす</div></div>`;
  const cv=$("#bootcv"),g=cv.getContext("2d"),T0=performance.now(),DUR=3000;S.boot={done,end:false};
  // 端末（右）の画面の位置
  const TX=488,TY=150,TW=104,TH=76,tcx=TX+TW/2,tcy=TY+TH/2;
  // 粒：待機の1コマ目のピクセル
  const P=[];const set=SPR[ch];const SC=0.8,CX=170,FY=300;
  if(set&&!set.proc){const t=set.tags.idle||set.tags.stand||[0,0],fr=set.frames[t[0]],w=fr.width,h=fr.height,q=fr.getContext?fr.getContext("2d"):null;
    let d=null;try{if(q)d=q.getImageData(0,0,w,h).data;else{const o=document.createElement("canvas");o.width=w;o.height=h;const oq=o.getContext("2d");oq.drawImage(fr,0,0);d=oq.getImageData(0,0,w,h).data}}catch(e){}
    const fx=set.foot?set.foot[0]:w/2,fy=set.foot?set.foot[1]:h,st=2;
    if(d)for(let y=0;y<h;y+=st)for(let x=0;x<w;x+=st){const k=(y*w+x)*4;if(d[k+3]<120)continue;
      const px=CX+(x-fx)*SC,py=FY+(y-fy)*SC,r=d[k],gg=d[k+1],b=d[k+2];
      P.push({x0:px,y0:py,c:`rgb(${r},${gg},${b})`,t0:600+(1-(y/h))*900+Math.random()*350,sp:0.7+Math.random()*0.6,sw:(Math.random()*2-1)*60,s:st*SC+0.4})}}
  SND.se("comm_open");let swoosh=false,arrived=0;
  const term=(glow)=>{// 端末：台・モニター・画面（光る）
    g.fillStyle="#141022";g.fillRect(TX-14,TY-12,TW+28,TH+24);g.strokeStyle="#3a3456";g.lineWidth=2;g.strokeRect(TX-14,TY-12,TW+28,TH+24);
    g.fillStyle="#1d1830";g.fillRect(TX+TW/2-10,TY+TH+12,20,40);g.fillRect(TX-24,TY+TH+52,TW+48,10);
    const a=Math.min(1,0.25+glow);g.fillStyle=`rgba(70,230,255,${0.15+0.5*a})`;g.fillRect(TX,TY,TW,TH);
    g.fillStyle=`rgba(197,255,69,${0.6*a})`;g.font="10px PM10, monospace";g.textBaseline="top";g.fillText("REMIT",TX+6,TY+6);g.fillText(`${ch} / ${mode}`,TX+6,TY+20);
    g.fillStyle=`rgba(197,255,69,${0.3+0.6*a})`;g.fillRect(TX+6,TY+TH-12,Math.round((TW-12)*Math.min(1,glow)),4);
    g.fillStyle="rgba(197,255,69,.08)";for(let y=TY;y<TY+TH;y+=3)g.fillRect(TX,y,TW,1)};
  const step=()=>{if(!S.boot||S.boot.end)return;const t=performance.now()-T0,p=Math.min(1,t/DUR);
    g.fillStyle="#05060C";g.fillRect(0,0,640,360);
    // 床と光
    const gr=g.createRadialGradient(tcx,tcy,4,tcx,tcy,180);gr.addColorStop(0,`rgba(70,230,255,${0.08+0.25*Math.min(1,arrived/Math.max(1,P.length))})`);gr.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=gr;g.fillRect(0,0,640,360);
    g.fillStyle="#0c0e1a";g.fillRect(0,FY+2,640,58);g.fillStyle="rgba(197,255,69,.06)";for(let x=0;x<640;x+=32)g.fillRect(x,FY+2,1,58);
    term(arrived/Math.max(1,P.length));
    // キャラのまわりが光る（はじめ）
    if(t<1100){const k=Math.sin(Math.min(1,t/1100)*Math.PI),rg=g.createRadialGradient(CX,FY-80,6,CX,FY-80,110);rg.addColorStop(0,`rgba(247,249,245,${0.22*k})`);rg.addColorStop(1,"rgba(247,249,245,0)");g.fillStyle=rg;g.fillRect(CX-120,FY-200,240,210)}
    arrived=0;
    for(const q of P){let x,y,s=q.s;if(t<q.t0){x=q.x0;y=q.y0;if(t>q.t0-250){/* ほどける前にふるえる */x+=Math.random()*1.4-0.7}}
      else{const u=Math.min(1,(t-q.t0)/(900/q.sp)),e=u*u*(3-2*u);if(u>=1){arrived++;continue}
        x=q.x0+(tcx-q.x0)*e;y=q.y0+(tcy-q.y0)*e+Math.sin(u*Math.PI)*q.sw*(1-u)-Math.sin(u*Math.PI)*40;s=q.s*(1-0.6*u)+0.3;
        if(!swoosh){swoosh=true;SND.se("card_toss")}}
      g.fillStyle=q.c;g.fillRect(x,y,s,s)}
    if(!P.length)arrived=Math.round(p*1);// 絵がないときは光だけ
    if(p>0.9){g.fillStyle=`rgba(247,249,245,${(p-0.9)*6})`;g.fillRect(0,0,640,360)}
    if(p>=1){bootEnd();return}requestAnimationFrame(step)};requestAnimationFrame(step)}
function bootSkip(){if(S.boot&&!S.boot.end){SND.se("ui_ok");bootEnd()}}
function bootEnd(){const b=S.boot;if(!b||b.end)return;b.end=true;S.boot=null;SND.se("gate_boot");b.done&&b.done()}
