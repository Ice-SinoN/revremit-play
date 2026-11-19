"use strict";
/* ===== ★v0.22.28 ランを始める流れ（★虎雪 11-19 11:30・11:32。progression 1-23）=====
   タイトル「MT／AT で走る」→ キャラ → 夜（難易度）→（ミニカーがあれば）ガレージ → 確認 → 端末につなぐ演出 → ラン開始。
   クリアの★：キャラ × 走りかた × 夜（profile.clearRec["YUKI|MT"]=[夜...]）。前の版のセーブは、クリアしたミニカーから
   キャラ × 走りかたの「クリア済み（夜は不明＝0）」だけ足す（夜ごとの★は、この版からクリアした夜）。 */
FULL_SCREENS.push("nights","runok","boot");Object.assign(SCREEN_BG,{nights:"garage",runok:"garage"});
/* 戦闘スタイル（progression 1-23・デザイン班 11-19 11:45。文はあとでデザイン班が直す） */
const CHAR_STYLE={
  YUKI:["守ってから返すカウンター型。凍結で敵の番を遅らせ、そのあいだに攻める。","ねらい：細雪・ホワイトアウトで止めて、白猫の護りの防御でしのぐ。はじめての人におすすめ。"],
  HINA:["ギアが5速と少なく、一気に上げて押し切る速攻型。最初の2ターンは受けるダメージが半分。","ねらい：敵が動く前に安いアタックを重ねて倒しきる。長引くと耐久の少なさがひびく。"],
  MOMO:["1ターンにカードをたくさん打つほど、あとのカードが強くなるチェイン型。","ねらい：安いカードでつないで、桃花・満開で大きく決める。チェイン3以上で攻撃がなくなると「花の便り」で1枚引ける。"],
  NANA:["8速まであり、1ターンに4回までシフトアップできるシフト連打型。パーフェクトのたびに守りが増える。","ねらい：帯でパーフェクトを重ねて高いギアへ。八連・凱旋で一気に削る。"],
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
function chavStart(){if(S.chavOn)return;S.chavOn=true;const loop=()=>{if(!["chars","runok"].includes(window.SCREEN)){S.chavOn=false;return}
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
        :`<div class="chn">？？？</div><div class="small dim">NIGHT ${C.join} クリアで</div>`}</button>`});
  const C=CHARS[sel],st=CHAR_STYLE[sel]||[];
  h+=`<div class="sign chdet" ${at(16,160,456,192)}><div class="h">${esc(sel)}（${esc(TEXT.names[sel]||"")}）　${esc(C.carName)} → ${esc(C.weapon||"")}</div>
    <div class="small dim">型：${esc(C.type)}　${C.car.gears}速・レッド ${C.car.red}・リミット ${C.car.limit}・耐久 ${C.car.hp}</div>
    <div class="small gold">戦闘スタイル</div>${st.map(t=>`<div class="small">${esc(t)}</div>`).join("")}
    <div class="small gold">キャラの決まり</div><div class="small">${esc(ruleTxtOf(sel)||"キャラの決まりなし（基準）")}</div>
    <div class="small dim">固有スキル：${esc(CARDS[C.skill].n)}</div></div>
   <div class="col" ${at(484,250,140)}><button class="main u9" onclick="PRF().char=S.chSel;SAVE.auto();S.deck=null;showNights()">${esc(TEXT.names[sel]||sel)}で走る<br><span class="small">つぎ：夜をえらぶ</span></button></div>`;
  ui().innerHTML=h;chavStart()}
/* ---- 3. 夜（難易度）---- */
function showNights(){setScreen("nights");setScene("dim");setBg("garage");closeModal();SND.se("ui_ok");renderNights()}
function renderNights(){const mx=nightMaxAvail(),cur=curNight(),U=TEXT.ui,last=typeof BETA_NIGHTS==="number"?BETA_NIGHTS:NIGHTS.length,ch=curChar(),mode=flowMode(),o=mode==="MT"?"AT":"MT";
  const sc=$("#nl")?$("#nl").scrollTop:0;
  ui().innerHTML=`<div class="hdr" ${at(8,6,300,18)}>夜をえらぶ（${esc(TEXT.names[ch]||ch)}・${esc(mode)}）</div>${backBtn("もどる","showChars()")}
   <div class="sign" ${at(8,30,452,324)}></div><div class="small dim" ${at(16,34,440,14)}>決まりは前の夜のぶんに足されていく。クリアすると次の夜が開く。★＝${esc(TEXT.names[ch]||ch)}でクリアした夜</div>
   <div class="scroll nlist2" id="nl" ${at(14,50,440,298)}>`+
    NIGHTS.slice(0,last).map(x=>{const lab=x.n===NIGHTS.length?U.night_last:U.night_label.replace("{n}",x.n),bl=nightRules(x.n).noBlow||x.n<3||/ブロー/.test(x.add)?"":`<span class="nblow">${esc(U.night_blow)}</span>`;
      const st=`${starHTML(clearedNight(ch,mode,x.n),mode)}<span class="dim"> ${starHTML(clearedNight(ch,o,x.n),o)}</span>`;
      return x.n<=mx?`<button class="${x.n===cur?"main":""} nrow2" onclick="PRF().night=${x.n};SAVE.auto();SND.jingle('night_select',{lv:${x.n}});renderNights()"><span class="nst">${st}</span><b>${esc(lab)}</b>${bl}<br><span class="small">${esc(x.add)}</span></button>`
        :`<button class="nrow2" disabled><b>${esc(lab)}</b>　<span class="small dim">${esc(U.night_lock)}</span></button>`}).join("")+`</div>
   <div class="sign side" ${at(472,70,160,120)}><div class="h">NIGHT ${cur}</div><div class="small">${starHTML(clearedNight(ch,mode,cur),mode+" クリア")}</div><div class="small dim">${starHTML(clearedNight(ch,o,cur),o+" クリア")}</div>
    <div class="small dim">${nightRules(cur).noBlow||cur<3?"ブローなし":"ブローあり"}</div></div>
   <div class="col" ${at(472,250,160)}><button class="main u9" onclick="flowAfterNight()">この夜で走る<br><span class="small">つぎ：${loadMinicars().length?"ミニカー":"確かめ"}</span></button></div>`;
  if($("#nl"))$("#nl").scrollTop=sc}
function flowAfterNight(){SND.se("ui_ok");if(loadMinicars().length){S.mcSel=[];showMinicarGarage(flowMode())}else runConfirm([])}
/* ---- 4. 確認 ---- */
function runConfirm(bring){S.flowBring=(bring||[]).slice();setScreen("runok");setScene("dim");setBg("garage");closeModal();
  const ch=curChar(),mode=flowMode(),n=curNight(),C=CHARS[ch],dk=loadDeck(ch),U=TEXT.ui,lab=n===NIGHTS.length?U.night_last:U.night_label.replace("{n}",n);
  ui().innerHTML=`<div class="hdr" ${at(8,6,300,18)}>この内容で走りますか？</div>
   <div class="sign" ${at(16,34,200,280)}><canvas class="chav" data-ch="${ch}" data-z="1" width="184" height="190"></canvas><div class="h" style="text-align:center">${esc(TEXT.names[ch]||ch)}</div><div class="small dim" style="text-align:center">${esc(C.carName)}</div></div>
   <div class="sign rcf" ${at(228,34,396,236)}>
    <div class="rrow"><span class="dim">キャラ</span><b>${esc(ch)}（${esc(TEXT.names[ch]||"")}）</b></div>
    <div class="rrow"><span class="dim">走りかた</span><b>${esc(mode)}</b>${starHTML(clearedAny(ch,mode),"")}</div>
    <div class="rrow"><span class="dim">夜</span><b>${esc(lab)}</b>${starHTML(clearedNight(ch,mode,n),"")}<span class="small dim">${nightRules(n).noBlow||n<3?"ブローなし":"ブローあり"}</span></div>
    <div class="rrow"><span class="dim">スキルツリー</span><b>プリセットなし</b><span class="small dim">（スキルツリーは準備中）</span></div>
    <div class="rrow"><span class="dim">デッキ</span><b>${deckCount(dk)}枚</b></div>
    <div class="rrow"><span class="dim">ミニカー</span><b>${S.flowBring.length?S.flowBring.length+"台 持ちこむ":"なし"}</b></div>
    <div class="small dim" style="margin-top:4px">${esc(ruleTxtOf(ch))}</div></div>
   <div class="row rbtn" ${at(228,280,396,40)}><button class="main u9" onclick="runGo()">OK（出発）</button><button class="u9" onclick="runBack()">もどる</button></div>`;
  SND.se("ui_ok");chavStart()}
function runBack(){SND.se("ui_cancel");if(loadMinicars().length)showMinicarGarage(flowMode());else showNights()}
function runGo(){const mode=flowMode(),bring=S.flowBring||[];S.flow=null;S.flowBring=null;bootSeq(()=>newRun(mode,bring))}
/* ---- 5. 端末につなぐ演出（約3秒・タップでとばす）---- */
function bootSeq(done){setScreen("boot");setScene("dim");closeModal();SND.bgmStop&&SND.bgmStop();
  const ch=curChar(),mode=flowMode(),n=curNight(),C=CHARS[ch],dk=loadDeck(ch),hex=()=>Math.floor(Math.random()*65536).toString(16).toUpperCase().padStart(4,"0");
  const L=[`> .50 CAL LOGGER  ${VERSION_NO()}`,`> LINK ............ ${C.carName}  [OK]`,`> DRIVER  ${ch} / MODE ${mode}`,`> NIGHT ${n} ... ROUTE MAP LOAD`,`> DECK ${deckCount(dk)} CARDS  SUM ${hex()}`,
    `> MINICAR x${(S.flowBring||[]).length} ... SYNC`,`> CROSS GATE  ${hex()}:${hex()}:${hex()}`,"> ROAD ACCESS ......",">> REMIT READY"];
  ui().innerHTML=`<div class="boot" ${at(0,0,640,360)} onclick="bootSkip()"><canvas id="bootcv" width="640" height="360"></canvas><div class="small bskip">タップでとばす</div></div>`;
  const cv=$("#bootcv"),g=cv.getContext("2d"),T0=performance.now(),DUR=3200;S.boot={done,end:false};SND.se("comm_open");let shown=0;
  const step=()=>{if(!S.boot||S.boot.end)return;const t=performance.now()-T0,p=Math.min(1,t/DUR);
    g.fillStyle="#05060C";g.fillRect(0,0,640,360);
    // ノイズ（はじめ強く、だんだん弱く）
    const nz=Math.max(0,1-t/900);for(let i=0;i<260*nz+30;i++){g.fillStyle=Math.random()<.5?"rgba(197,255,69,.18)":"rgba(70,230,255,.14)";g.fillRect(Math.random()*640|0,Math.random()*360|0,1+Math.random()*3|0,1)}
    // 走査線
    g.fillStyle="rgba(197,255,69,.05)";for(let y=(t/12|0)%4;y<360;y+=4)g.fillRect(0,y,640,1);
    // ログ（1行ずつ、1文字ずつ）
    const per=DUR*0.8/L.length,nl=Math.min(L.length,Math.floor(t/per)+1);if(nl>shown){shown=nl;SND.se("comm_blip")}
    g.font="12px PM12, monospace";g.textBaseline="top";
    for(let i=0;i<nl;i++){const s=L[i],k=i<nl-1?s.length:Math.min(s.length,Math.floor((t-i*per)/per*s.length*1.6));const y=40+i*22;
      g.fillStyle=i===L.length-1?"#C5FF45":"#8FE6FF";let sx=48;if(Math.random()<0.04){sx+=(Math.random()*8-4)|0}g.fillText(s.slice(0,k)+(i===nl-1&&(t/200|0)%2?"_":""),sx,y)}
    // 進みのバー
    g.strokeStyle="#3a3550";g.strokeRect(48,318,544,8);g.fillStyle="#C5FF45";g.fillRect(50,320,Math.round(540*p),4);
    g.fillStyle="#6b6880";g.font="10px PM10, monospace";g.fillText(`ACCESS ${Math.round(p*100)}%`,48,300);
    // グリッチの帯
    if(Math.random()<0.12){const y=Math.random()*360|0,h=2+Math.random()*10|0;g.drawImage(cv,0,y,640,h,(Math.random()*16-8)|0,y,640,h)}
    if(p>=1){bootEnd();return}requestAnimationFrame(step)};requestAnimationFrame(step)}
function bootSkip(){if(S.boot&&!S.boot.end){SND.se("ui_ok");bootEnd()}}
function bootEnd(){const b=S.boot;if(!b||b.end)return;b.end=true;S.boot=null;SND.se("gate_boot");b.done&&b.done()}
