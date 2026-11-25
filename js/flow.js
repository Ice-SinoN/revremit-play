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
function chavStart(){if(S.chavOn)return;S.chavOn=true;const loop=()=>{if(!["chars","runok","nights","garage","tree"].includes(window.SCREEN)){S.chavOn=false;return}
  document.querySelectorAll("canvas.chav").forEach(cv=>{const set=(cv.dataset.sil||cv.dataset.face)&&!(SPR[cv.dataset.ch]&&!SPR[cv.dataset.ch].proc)?(window.SILFR||{})[cv.dataset.ch]:SPR[cv.dataset.ch];/* ★v0.22.125 シルエットは1コマだけの軽い絵 */const g=cv.getContext("2d");g.clearRect(0,0,cv.width,cv.height);
    if(!set||set.proc){{const k=cv.dataset.ch;S.chavLoad=S.chavLoad||{};if(!cv.dataset.sil&&!cv.dataset.face&&ART_SRC[k]&&!S.chavLoad[k]){S.chavLoad[k]=1;ensureSpr([k]).then(()=>{S.chavLoad[k]=0})}}/* ★v0.22.125 手放した絵はここで読みなおす */g.fillStyle="#3a3550";g.font="24px PM12";g.textAlign="center";g.fillText("？",cv.width/2,cv.height*0.65);return}
    if(cv.dataset.face){csSilFace(cv,g,set);return}
    const t=set.tags.idle||set.tags.stand||[0,0],n=t[1]-t[0]+1,ms=(set.dur&&set.dur[t[0]])||120,fr=set.frames[t[0]+Math.floor(performance.now()/ms)%n];if(!fr)return;
    const sc=cv.dataset.int?+cv.dataset.int:Math.min(cv.width/fr.width,cv.height/fr.height)*(+cv.dataset.z||1),/* ★v0.22.113 AD v0.85：data-int＝整数倍（ふちがギザギザにならない） */w=fr.width*sc,h=fr.height*sc,fx=(set.foot?set.foot[0]:fr.width/2)*sc,fy=(set.foot?set.foot[1]:fr.height)*sc;
    const x=Math.round(cv.width/2-fx),y=Math.round(cv.height-2-fy);
    if(cv.dataset.sil){const o=S.silCv||(S.silCv=document.createElement("canvas"));o.width=cv.width;o.height=cv.height;const q=o.getContext("2d");q.imageSmoothingEnabled=false;q.clearRect(0,0,o.width,o.height);
      q.drawImage(fr,x,y,w,h);q.globalCompositeOperation="source-in";q.fillStyle="#3a3456";q.fillRect(0,0,o.width,o.height);q.globalCompositeOperation="source-over";g.drawImage(o,0,0)}
    else{g.imageSmoothingEnabled=false;g.drawImage(fr,x,y,w,h)}});requestAnimationFrame(loop)};requestAnimationFrame(loop)}
/* ---- 1. 走りかた（タイトルのボタン）---- */
/* ★v0.22.61 虎雪 11-20 07:58：ホームは「スタート」1つ → キャラ → 夜 →（ミニカー）→ 走りかた（MT／AT）→ 確認 → 演出。走りかたを選ぶまでは、★の見せ方に最後に選んだ走りかたを使う */
function TU(k,d){return TEXT.ui&&TEXT.ui[k]||d}
/* ★v0.22.63 虎雪 11-20 08:32：「スタート」→「自分で走る」「フルオート周回」の2択。フルオートは②の画面（window.FULLAUTO.open()）へ渡すだけ */
FULL_SCREENS.push("startpick");SCREEN_BG.startpick="garage";
const START_TXT={self:["自分で走る","キャラ・夜・デッキ・走りかたを選んで、自分で戦う。","ミニカーを持ちこめる。いつものラン。"],auto:["フルオート周回","ランを全部オートで、くり返し走る。スマホを縦にして見る。","ログは少なめ。ミニカーは作らない。"]};
function showStartPick(){try{termPrep()}catch(e){}setScreen("startpick");setScene("dim");setBg("garage");closeModal();SND.se("ui_ok");const fa=!!(window.FULLAUTO&&FULLAUTO.open);
  ui().innerHTML=`<div class="hdr" ${at(8,6,300,18)}>${esc(TU("start_head","どう走る？"))}</div>${backBtn("もどる","showTitle()")}`+
   ["self","auto"].map((k,i)=>{const t=START_TXT[k],off=k==="auto"&&!fa;return `<button class="u9 mdcard${k==="self"?" main":""}${off?" off":""}" ${at(40+i*290,60,270,220)} onclick="${k==="self"?"startFlow()":"startFullAuto()"}"><div class="mdh" style="font-size:20px">${esc(TU("start_"+k,t[0]))}</div>
     <div class="mdt">${esc(TU("start_"+k+"_1",t[1]))}</div><div class="mdt">${esc(TU("start_"+k+"_2",t[2]))}</div>${off?`<div class="small dim">${esc(TU("start_auto_wip","準備中"))}</div>`:""}</button>`}).join("")}
function startFullAuto(){if(window.FULLAUTO&&FULLAUTO.open){SND.se("ui_ok");try{FULLAUTO.open()}catch(e){console.error(e);toast2("フルオートを開けませんでした")}}else{SND.se("card_cant");toast2(TU("start_auto_wip_t","フルオート周回は準備中です"))}}
function startFlow(mode){try{termPrep()}catch(e){}SND.se("ui_ok");S.flowTicket=null;S.flow={mode:mode||null};if(mode){try{if(PRF().lastMode!==mode){PRF().lastMode=mode;SAVE.auto()}}catch(e){}}S.chSel=curChar();S.csSel=curChar();S.flowBring=[];showCharSel()}/* ★v0.22.108 案1：①えらぶ → ②準備 */
const flowMode=()=>(S.flow&&S.flow.mode)||PRF().lastMode||"MT";
const flowModeTag=()=>S.flow&&!S.flow.mode?"":`（${flowMode()}）`;
/* ---- 2. キャラ ---- */
function renderChars(){const op=charsOpen(),sel=op.includes(S.chSel)?S.chSel:curChar(),mode=flowMode();S.chSel=sel;
  let h=`<div class="hdr" ${at(8,6,300,18)}>キャラをえらぶ${esc(flowModeTag())}</div>${backBtn("もどる","S.flow=null;showTitle()")}`;
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
  ui().innerHTML=`<div class="hdr" ${at(8,6,300,18)}>夜をえらぶ（${esc(TEXT.names[ch]||ch)}${S.flow&&!S.flow.mode?"":"・"+esc(mode)}）</div>${backBtn("もどる","showChars()")}
   <div class="sign" ${at(8,30,452,324)}></div><div class="small dim ninfo" ${at(16,34,440,26)}>決まりは前の夜のぶんに足されていく。クリアすると次の夜が開く。★＝${esc(TEXT.names[ch]||ch)}でクリアした夜（うすい★は、もう1つの走りかた）</div>
   <div class="scroll nlist2" id="nl" ${at(14,62,440,286)}>`+
    NIGHTS.map(x=>{const lab=x.n===NIGHTS.length?U.night_last:U.night_label.replace("{n}",x.n),bl=nightRules(x.n).noBlow||x.n<3||/ブロー/.test(x.add)?"":`<span class="nblow">${esc(U.night_blow)}</span>`;
      if(x.n>last)return`<button class="nrow2 nfull" disabled><b>${esc(lab)}</b>　<span class="small dim">🔒 ${esc(BETA_TXT.nightLock)}</span></button>`;/* ★v0.22.81 虎雪 14:07：NIGHT 5 以降は正式版で */
      const st=`${starHTML(clearedNight(ch,mode,x.n),mode)}<span class="dim"> ${starHTML(clearedNight(ch,o,x.n),o)}</span>`;
      return x.n<=mx?`<button class="${x.n===cur?"main":""} nrow2" onclick="PRF().night=${x.n};SAVE.auto();SND.jingle('night_select',{lv:${x.n}});renderNights()"><span class="nst">${st}</span><b>${esc(lab)}</b>${bl}<br>${(()=>{const F=typeof nightFace==="function"&&nightFace(x.n);return F?`<span class="small nface">${esc(F.n)}：${esc(x.n===1?x.add:F.l)}</span>`:`<span class="small">${esc(x.add)}</span>`})()}</button>`
        :`<button class="nrow2" disabled><b>${esc(lab)}</b>　<span class="small dim">${esc(U.night_lock)}</span></button>`}).join("")+`</div>
   <div class="sign side" ${at(472,70,160,120)}><div class="h">NIGHT ${cur}</div><div class="small">${starHTML(clearedNight(ch,mode,cur),mode+" クリア")}</div><div class="small dim">${starHTML(clearedNight(ch,o,cur),o+" クリア")}</div>
    <div class="small dim">${nightRules(cur).noBlow||cur<3?"ブローなし":"ブローあり"}</div><div class="small dim">${esc((NIGHTS[cur-1]||{}).add||"")}</div></div>
   <div class="col" ${at(472,250,160)}><button class="main u9" onclick="flowAfterNight()">この夜で走る<br><span class="small">つぎ：${loadMinicars().length?"ミニカー":"走りかた"}</span></button></div>`;
  if($("#nl"))$("#nl").scrollTop=sc;ellFit("#nl .nface");requestAnimationFrame(()=>ellFit("#nl .nface"))}
/* ★v0.22.141 BUG-58：1行に入らない字は詰めて「…」（ブラウザの省略記号は小さい倍率で消えることがあるため字で足す）。元の文は title に */
function ellFit(sel){document.querySelectorAll(sel).forEach(e=>{const t0=e.dataset.full||e.textContent;e.dataset.full=t0;e.title=t0;e.textContent=t0;if(e.scrollWidth<=e.clientWidth+1)return;let n=t0.length;while(n>1&&e.scrollWidth>e.clientWidth+1){n--;e.textContent=t0.slice(0,n).replace(/[・、：\s（「]+$/,"")+"…"}})}
function flowAfterNight(){SND.se("ui_ok");if(loadMinicars().length){S.mcSel=[];showMinicarGarage(flowMode())}else flowToMode([])}
/* ---- 3b. 走りかた（MT／AT）★v0.22.61。文は text（mode_mt_1 など）があればそれ ---- */
FULL_SCREENS.push("modes");SCREEN_BG.modes="garage";
const MODE_TXT={MT:["自分でシフトアップする。帯の中でシフトするとパーフェクト。","パーフェクトでガソリンがもどり、カードをつなげやすい。"],AT:["シフトは自動。回転が帯に入ると、ひとりでに上がる。","シフトを気にせず、カードを打つことに集中できる。"]};
function flowToMode(bring){S.flowBring=(bring||[]).slice();if(S.flowReady){showReady();return}if(S.flow&&S.flow.mode){runConfirm(S.flowBring);return}showModes()}
function showModes(){setScreen("modes");setScene("dim");setBg("garage");closeModal();const ch=curChar(),n=curNight(),last=PRF().lastMode||"MT";
  ui().innerHTML=`<div class="hdr" ${at(8,6,300,18)}>${esc(TU("mode_head","走りかたをえらぶ"))}（${esc(TEXT.names[ch]||ch)}・NIGHT ${n}）</div>${backBtn("もどる","modeBack()")}`+
   ["MT","AT"].map((m,i)=>`<button class="u9 mdcard${m===last?" main":""}" ${at(40+i*290,60,270,220)} onclick="modePick('${m}')"><div class="mdh">${m}</div><div class="mdn">${esc(TU("mode_"+m.toLowerCase()+"_name",m==="MT"?"マニュアル":"オートマ"))}</div>
     <div class="mdt">${esc(TU("mode_"+m.toLowerCase()+"_1",MODE_TXT[m][0]))}</div><div class="mdt">${esc(TU("mode_"+m.toLowerCase()+"_2",MODE_TXT[m][1]))}</div>
     <div class="small">${starHTML(clearedNight(ch,m,n),"NIGHT "+n)}　${starHTML(clearedAny(ch,m),m+" クリア")}</div></button>`).join("")+
   `<div class="small dim" ${at(40,290,560,14)}>${esc(TU("mode_note","えらぶと、確かめの画面に進みます。"))}</div>`}
function modePick(m){SND.se("ui_ok");S.flow=S.flow||{};S.flow.mode=m;try{if(PRF().lastMode!==m){PRF().lastMode=m;SAVE.auto()}}catch(e){}runConfirm(S.flowBring||[])}
function modeBack(){SND.se("ui_cancel");if(loadMinicars().length){S.mcSel=[];showMinicarGarage(flowMode())}else showNights()}
/* ---- 4. 確認（★虎雪 11:35：ダイアログ。難易度・キャラ・デッキ〈はじめのカード〉・ミニカー → よろしいですか？ OK／もどる）---- */
function runConfirm(bring){S.flowBring=(bring||[]).slice();S.flowFromMode=window.SCREEN==="modes";
  const ch=curChar(),mode=flowMode(),n=curNight(),C=CHARS[ch],dk0=loadDeck(ch),dk=treeDeckMap(dk0,ch),U=TEXT.ui,lab=n===NIGHTS.length?U.night_last:U.night_label.replace("{n}",n);
  const cards=Object.keys(dk).sort((a,b)=>"SKERC".indexOf(rarityOf(a))-"SKERC".indexOf(rarityOf(b))||CARDS[a].c-CARDS[b].c).map(id=>`<span class="rcc r-${rarityOf(id)}">${esc(CARDS[id].n)}<b>×${dk[id]}</b></span>`).join("");
  const mc=S.flowBring.length?S.flowBring.map(m=>`<span class="rcc">${esc(TEXT.names[m.char]||m.char)}・${esc(m.rank)}<b>${m.cards.length}枚</b></span>`).join(""):`<span class="dim">なし</span>`;
  modal(`<div class="rcf"><div class="h">よろしいですか？</div><div class="small dim">この内容で、ランを始めます。</div>
   <div class="rtop"><canvas class="chav" data-ch="${ch}" width="72" height="72"></canvas><div class="rcol">
    <div class="rrow"><span class="dim">難易度</span><b>${esc(lab)}</b>${starHTML(clearedNight(ch,mode,n),"")}<span class="small dim">${nightRules(n).noBlow||n<3?"ブローなし":"ブローあり"}</span></div>
    <div class="rrow"><span class="dim">キャラ</span><b>${esc(TEXT.names[ch]||ch)}</b><span class="small dim">${esc(C.carName)}・${esc(mode)}</span></div>
    <div class="rrow"><span class="dim">ミニカー</span><span class="rcs">${mc}</span></div>${TREE[ch]?`<div class="rrow"><span class="dim">型</span><b>${esc(treeName(ch))}</b><button class="u9 mini" onclick="closeModal();S.treeHub=false;showTree()">型をえらぶ</button></div>`:""}</div></div>
   ${ticketRow()}<div class="small dim">デッキ（はじめのカード ${deckCount(dk)}枚）</div><div class="rcs rdeck">${cards}</div>
   <div class="row"><button class="main" onclick="runGo()">OK</button><button onclick="runBack()">もどる</button></div></div>`);
  const m=$("#modal .modal .box");if(m)m.classList.add("rcbox");SND.se("ui_ok");chavStart()}
function runBack(){SND.se("ui_cancel");closeModal();if(S.flow&&S.flowFromMode){S.flow.mode=null;showModes()}}
function runGo(){const mode=flowMode(),bring=S.flowBring||[],tk=S.flowTicket||null;closeModal();if(window.FARM&&FARM.on){FARM.on=false;FARM.snap=null}/* ★v0.22.67 自分で走るランはフルオートの「ラン前にもどす」を通さない */S.flow=null;S.flowTicket=null;
  if(tk&&typeof farmData==="function"){const d=farmData(),i=d.tickets.indexOf(tk);if(i>=0){d.tickets.splice(i,1);try{SAVE.auto()}catch(e){}}else tk=null}
  bootSeq(()=>{newRun(mode,bring);if(tk&&G){G.ticket={k:tk};if(tk==="money")G.money+=30}},mode,bring)}
/* ★v0.22.65 design 10-22-6・②の H19：ランの前の小窓で整備チケットを1枚えらぶ（使わなくてもよい）。持ち物は②の farmData().tickets */
const TICKET_TXT={discount:"最初のショップが 30% 引き",partPick:"最初のパーツの候補が4つ",money:"はじめのお金 +30",cardPick:"最初の戦闘のカードを4枚から"};
function ticketRow(){if(typeof farmData!=="function")return"";const t=farmData().tickets||[];if(!t.length)return"";const c={};t.forEach(k=>c[k]=(c[k]||0)+1);const nm=k=>(typeof FARM_TICKET_JP!=="undefined"&&FARM_TICKET_JP[k])||k;
  return `<div class="rrow tkrow"><span class="dim">整備チケット</span><span class="rcs">`+[`<button class="u9 mini${!S.flowTicket?" main":""}" onclick="S.flowTicket=null;ticketRedraw()">使わない</button>`].concat(Object.keys(c).map(k=>`<button class="u9 mini${S.flowTicket===k?" main":""}" title="${esc(TICKET_TXT[k]||"")}" onclick="S.flowTicket='${k}';ticketRedraw()">${esc(nm(k))}×${c[k]}</button>`)).join("")+`</span></div>${S.flowTicket?`<div class="small gold tkd">${esc(TICKET_TXT[S.flowTicket]||"")}（このランで1回）</div>`:""}`}
function ticketRedraw(){SND.se("ui_ok");const r=$("#modal .tkrow");if(!r)return;const n=r.nextElementSibling&&r.nextElementSibling.classList.contains("tkd")?r.nextElementSibling:null;if(n)n.remove();r.outerHTML=ticketRow()}
/* ---- 5. キャラが光の粒にほどけて端末に吸いこまれる（★虎雪 11:35。約3秒・タップでとばす）----
   粒は戦闘の待機の絵のピクセルから作る（色はキャラの色）。★v0.22.36：端末と部屋はグラフィック班ラウンド34 の絵（ui/c2/revremit_ui_terminal.png〈640×360 の透明な層〉・revremit_bg_terminal_room.png）。
   粒の行き先は revremit_ui_terminal.json の screen（消えた画面のガラス）。絵がないときはコードの仮の絵。 */
const TERM={json:"assets/c2/ui/c2/revremit_ui_terminal.json",img:"assets/c2/ui/c2/revremit_ui_terminal.png",room:"assets/c2/ui/c2/revremit_bg_terminal_room.png",scr:{x:447,y:67,w:105,h:87},I:{}};
function termImg(k){const p=TERM[k];if(!artHave(p))return null;let im=TERM.I[k];if(!im){im=TERM.I[k]=new Image();im.src=artURL(p)}return im.complete&&im.naturalWidth?im:null}
function termPrep(){termImg("img");termImg("room");if(!TERM.jl&&artHave(TERM.json)){TERM.jl=1;fetch(artURL(TERM.json)).then(r=>r.json()).then(j=>{if(j&&j.screen)TERM.scr=j.screen}).catch(()=>{})}}
function bootSeq(done,mode,bring){const ch=curChar();setScreen("boot");setScene("dim");closeModal();SND.bgmStop&&SND.bgmStop();termPrep();
  ui().innerHTML=`<div class="boot" ${at(0,0,640,360)} onclick="bootSkip()"><canvas id="bootcv" width="640" height="360"></canvas><div class="small bskip">タップでとばす</div></div>`;
  const cv=$("#bootcv"),g=cv.getContext("2d"),T0=performance.now(),DUR=3000;g.imageSmoothingEnabled=false;S.boot={done,end:false};
  const P=[];const set=SPR[ch];const SC=0.8,CX=170,FY=318;
  if(set&&!set.proc){const t=set.tags.idle||set.tags.stand||[0,0],fr=set.frames[t[0]],w=fr.width,h=fr.height,q=fr.getContext?fr.getContext("2d"):null;
    let d=null;try{if(q)d=q.getImageData(0,0,w,h).data;else{const o=document.createElement("canvas");o.width=w;o.height=h;const oq=o.getContext("2d");oq.drawImage(fr,0,0);d=oq.getImageData(0,0,w,h).data}}catch(e){}
    const fx=set.foot?set.foot[0]:w/2,fy=set.foot?set.foot[1]:h,st=2;
    if(d)for(let y=0;y<h;y+=st)for(let x=0;x<w;x+=st){const k=(y*w+x)*4;if(d[k+3]<120)continue;
      const px=CX+(x-fx)*SC,py=FY+(y-fy)*SC;
      P.push({x0:px,y0:py,c:`rgb(${d[k]},${d[k+1]},${d[k+2]})`,t0:600+(1-(y/h))*900+Math.random()*350,sp:0.7+Math.random()*0.6,sw:(Math.random()*2-1)*60,s:st*SC+0.4,tx:Math.random(),ty:Math.random()})}}
  SND.se("comm_open");let swoosh=false,arrived=0;
  const term=(glow)=>{const S2=TERM.scr,im=termImg("img"),a=Math.min(1,glow);
    if(im){g.drawImage(im,0,0,640,360)}
    else{const TX=S2.x,TY=S2.y,TW=S2.w,TH=S2.h;g.fillStyle="#141022";g.fillRect(TX-14,TY-12,TW+28,TH+24);g.strokeStyle="#3a3456";g.lineWidth=2;g.strokeRect(TX-14,TY-12,TW+28,TH+24);g.fillStyle="#1d1830";g.fillRect(TX+TW/2-10,TY+TH+12,20,40);g.fillRect(TX-24,TY+TH+52,TW+48,10)}
    g.save();g.globalCompositeOperation="lighter";g.fillStyle=`rgba(70,230,255,${0.08+0.45*a})`;g.fillRect(S2.x+3,S2.y+3,S2.w-6,S2.h-6);
    g.fillStyle="rgba(197,255,69,.05)";for(let y=S2.y+3;y<S2.y+S2.h-3;y+=3)g.fillRect(S2.x+3,y,S2.w-6,1);g.restore();
    /* ★v0.22.44 QA の気づき：明るい水色の上でライムの字が読みにくい → 字は重ねがけ（lighter）をやめ、暗い縁どり＋濃い帯の上に、太字で */
    if(a>0.05){const ta=Math.min(1,0.35+0.65*a);g.save();g.font="12px PM12B, monospace";g.textBaseline="top";
      g.fillStyle=`rgba(4,16,26,${0.72*ta})`;g.fillRect(S2.x+5,S2.y+6,S2.w-10,28);g.fillRect(S2.x+6,S2.y+S2.h-16,S2.w-12,7);
      g.lineWidth=3;g.lineJoin="round";g.strokeStyle=`rgba(4,16,26,${ta})`;g.fillStyle=`rgba(214,255,110,${ta})`;
      for(const[tx,ty]of[["REMIT",8],[`${ch} / ${mode}`,21]]){g.strokeText(tx,S2.x+8,S2.y+ty);g.fillText(tx,S2.x+8,S2.y+ty)}
      g.fillRect(S2.x+8,S2.y+S2.h-14,Math.round((S2.w-16)*a),3);g.restore()}};
  const step=()=>{if(!S.boot||S.boot.end)return;const t=performance.now()-T0,p=Math.min(1,t/DUR),S2=TERM.scr,tcx=S2.x+S2.w/2,tcy=S2.y+S2.h/2;
    const room=termImg("room");if(room)g.drawImage(room,0,0,640,360);else{g.fillStyle="#05060C";g.fillRect(0,0,640,360);g.fillStyle="#0c0e1a";g.fillRect(0,FY+2,640,58)}
    const k=arrived/Math.max(1,P.length);
    const gr=g.createRadialGradient(tcx,tcy,4,tcx,tcy,200);gr.addColorStop(0,`rgba(70,230,255,${0.06+0.22*k})`);gr.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=gr;g.fillRect(0,0,640,360);
    term(k);
    if(t<1100){const kk=Math.sin(Math.min(1,t/1100)*Math.PI),rg=g.createRadialGradient(CX,FY-80,6,CX,FY-80,110);rg.addColorStop(0,`rgba(247,249,245,${0.22*kk})`);rg.addColorStop(1,"rgba(247,249,245,0)");g.fillStyle=rg;g.fillRect(CX-120,FY-200,240,210)}
    arrived=0;
    for(const q of P){let x,y,s=q.s;if(t<q.t0){x=q.x0;y=q.y0;if(t>q.t0-250)x+=Math.random()*1.4-0.7}
      else{const u=Math.min(1,(t-q.t0)/(900/q.sp)),e=u*u*(3-2*u);if(u>=1){arrived++;continue}
        const ex=S2.x+6+q.tx*(S2.w-12),ey=S2.y+6+q.ty*(S2.h-12);
        x=q.x0+(ex-q.x0)*e;y=q.y0+(ey-q.y0)*e+Math.sin(u*Math.PI)*q.sw*(1-u)-Math.sin(u*Math.PI)*40;s=q.s*(1-0.6*u)+0.3;
        if(!swoosh){swoosh=true;SND.se("card_toss")}}
      g.fillStyle=q.c;g.fillRect(x,y,s,s)}
    if(p>0.9){g.fillStyle=`rgba(247,249,245,${(p-0.9)*6})`;g.fillRect(0,0,640,360)}
    if(p>=1){bootEnd();return}requestAnimationFrame(step)};requestAnimationFrame(step)}
function bootSkip(){if(S.boot&&!S.boot.end){SND.se("ui_ok");bootEnd()}}
function bootEnd(){const b=S.boot;if(!b||b.end)return;b.end=true;S.boot=null;SND.se("gate_boot");b.done&&b.done()}

/* ★v0.22.48 スキルツリー（design 11-3・text 27-6）。ランの前（確認の小窓の「型をえらぶ」）から。振り直し・メモの切りかえはタダ。今のメモに自動で残る */
function treeData(ch){const p=PRF();p.tree=p.tree||{};const t=p.tree[ch]=p.tree[ch]||{pts:0,cur:0,presets:[]};for(let i=0;i<3;i++)t.presets[i]=t.presets[i]||{name:"",lv:[0,0,0]};return t}
function treeName(ch,i){const t=treeData(ch),k=i==null?t.cur||0:i,pr=t.presets[k],top=pr.lv.indexOf(4);return pr.name||(top>=0?TREE[ch][top].n+"型":`型のメモ ${k+1}`)}
function showTree(){SND.call(A=>A.bgmFor?A.bgmFor("tree",treeChar()):A.bgm("garage"));setScreen("tree");setScene("dim");setBg("garage");closeModal();const ch=treeChar();renderTree();if(!S.treeIntro){S.treeIntro=1;toast2(ch==="MIO"?"こゆき：……どれで行く？":"みお：今夜は、どの型で行きますか？",300)}}
function renderTree(){const ch=treeChar(),t=treeData(ch),pr=t.presets[t.cur||0],lv=pr.lv,used=treeSpent(lv),left=(t.pts||0)-used,br=TREE[ch];
  let h=`<div class="hdr" ${at(8,6,300,18)}>${esc(TEXT.names[ch]||ch)}の型</div><div class="small" ${at(8,26,300,14)}>ポイント ${left}／${t.pts||0}（${esc(TEXT.names[ch]||ch)}で走るとたまる）</div>${backBtn("もどる","treeBack()")}
   <div class="tslots" ${at(316,58,316,24)}>`+t.presets.map((x,i)=>`<button class="u9${i===(t.cur||0)?" main":""}" onclick="treeSlot(${i})">${esc(treeName(ch,i))}</button>`).join("")+`</div>`;
  br.forEach((b,i)=>{const x=8+i*210;h+=`<div class="tbr" ${at(x,86,204,226)}><div class="tbn"><b>${esc(b.n)}</b> <span class="small dim">${esc(b.d)}</span></div>`+
    [1,2,3,4].map(k=>{const on=lv[i]>=k,can=lv[i]===k-1,need=TREE_COST[k-1],txt=k===1?(b.entry[0]===b.entry[1]?`初期デッキに「${CARDS[b.entry[0]].n}」が2枚入る`:`初期デッキに「${CARDS[b.entry[0]].n}」「${CARDS[b.entry[1]].n}」が入る`):k===2?`${b.n}のパーツが、店で出やすい`:k===3?`${b.n}のカードを帯で打つと ×${RULES.bandMul+TREE_BANDADD}`:b.top;
      const why=on?"":!can?"下の段のあとで、とれる":left<need?`ポイントが足りない（あと ${need-left}）`:"";
      return `<button class="tnode${on?" on":""}${!on&&why?" off":""}${k===4?" top":""}" onclick="treeTap(${i},${k})" ${b.tip&&k===4?`title="${esc(b.tip)}" onpointerdown="treeLP(${i})" onpointerup="treeLPx()" onpointerleave="treeLPx()"`:""}><span class="tnt${k===4&&b.mtOnly&&flowMode()==="AT"?" dim":""}">${esc(txt)}</span><span class="small ${on?"ok":"dim"} tnc">${on?"とった":why||"とる"}・${need} ポイント</span></button>`}).join("")+`</div>`});
  h+=`<div class="small dim" ${at(8,314,300,12)}>型の決め（4段目）は、1本だけ</div><div class="small dim" ${at(316,314,316,12)} style="text-align:right">${esc(TT("tree_autosave","変えたところは自動で保存されます"))}</div>
   <button class="u9" ${at(8,328,100,26)} onclick="treeReset()">振り直す</button><button class="u9" ${at(114,328,110,26)} onclick="treeRename()">名前をつける</button>
   <button class="main u9" ${at(460,328,172,26)} onclick="treePick()">この型で走る</button>`;
  ui().innerHTML=h}
function treeSave(){SAVE.auto&&SAVE.auto()}
function TT(k,d){return TEXT.tree&&TEXT.tree[k]||d}
function treeSlot(i){const t=treeData(treeChar());t.cur=i;SND.se("ui_ok");treeSave();renderTree()}
/* ★v0.22.58 text 27-7：4段目の長押しで説明（満開は AT のとき段の文を灰色・説明だけ） */
function treeLP(i){treeLPx();S.treeLPt=setTimeout(()=>{S.treeLPf=1;const b=TREE[treeChar()][i];toast2(b.tip,290,2500)},450)}
function treeLPx(){if(S.treeLPt){clearTimeout(S.treeLPt);S.treeLPt=0}}
function treeTap(i,k){if(S.treeLPf){S.treeLPf=0;return}const ch=treeChar(),t=treeData(ch),pr=t.presets[t.cur||0],lv=pr.lv,left=(t.pts||0)-treeSpent(lv);
  if(lv[i]>=k){if(lv[i]!==k){SND.se("card_cant");return}lv[i]=k-1;SND.se("tree_down");treeSave();renderTree();return}/* いちばん上の段を外す（ポイントはもどる） */
  if(lv[i]!==k-1||left<TREE_COST[k-1]){SND.se("card_cant");return}
  const o=k===4?lv.findIndex((l,j)=>j!==i&&l===4):-1;
  const take=()=>{if(o>=0)lv[o]=3;lv[i]=k;SND.se(k===4?"tree_cap":"tree_up",{lv:k,who:treeChar().toLowerCase()});treeSave();renderTree()};
  if(o>=0){const B2=TREE[ch];if((t.pts||0)-treeSpent(lv.map((l,j)=>j===o?3:l))<TREE_COST[3]){SND.se("card_cant");return}
    S.treeGo=()=>{closeModal();take()};modal(`<div class="h">「${esc(B2[o].n)}」の型の決めを外して、「${esc(B2[i].n)}」にしますか？</div><div class="small">外した段のポイントは、もどります。</div><div class="row"><button class="main" onclick="S.treeGo()">入れかえる</button><button onclick="closeModal()">やめる</button></div>`);return}
  take()}
function treeReset(){S.treeGo=()=>{closeModal();const t=treeData(treeChar());t.presets[t.cur||0].lv=[0,0,0];SND.se("tree_reset");toast2("振り直しました");treeSave();renderTree()};
  modal(`<div class="h">振り直しますか？</div><div class="small">ポイントは、全部もどります。</div><div class="row"><button class="main" onclick="S.treeGo()">振り直す</button><button onclick="closeModal()">やめる</button></div>`)}
function treeRename(){const t=treeData(treeChar()),pr=t.presets[t.cur||0];S.treeGo=()=>{const v=($("#tname")||{}).value||"";pr.name=v.trim().slice(0,10);closeModal();treeSave();renderTree();toast2(TT("tree_rename_toast","保存しました"),318,1000)};/* ★v0.22.51 text 27-6-3：名前を変えたときだけ1秒 */
  modal(`<div class="h">名前をつける</div><input id="tname" class="tname" maxlength="10" value="${esc(pr.name||"")}" placeholder="${esc(treeName(treeChar()))}"><div class="row"><button class="main" onclick="S.treeGo()">きめる</button><button onclick="closeModal()">やめる</button></div>`)}
function treePick(){const ch=treeChar();SND.se("ui_ok");toast2(S.treeHub?`「${treeName(ch)}」にしました`:`「${treeName(ch)}」で走ります`);treeSave();treeBack()}
function treeChar(){return S.treeHub&&S.treeCh||curChar()}
function treeBack(){SND.se("ui_cancel");if(S.treeFromReady){S.treeFromReady=false;showReady();return}if(S.treeHub){S.treeHub=false;showHub();return}runConfirm(S.flowBring||[])}
/* ===== ★v0.22.69 ガレージ（★虎雪 11-20 10:47）：ランの外のメニューをまとめる。ミニカー（一覧・中身・処分）・型（スキルツリー）・デッキ・みおのラボ・図鑑 ===== */
FULL_SCREENS.push("hub","mcbox");Object.assign(SCREEN_BG,{hub:"garage",mcbox:"garage"});
function hubBack(){if(S.hubOpen)showHub();else showTitle()}
function showHub(){S.hubOpen=true;setScreen("hub");setScene("dim");setBg("garage");closeModal();SND.bgm("garage");const p=PRF(),mc=loadMinicars(),ch=curChar(),op=charsOpen().filter(c=>TREE[c]);
  const B=(x,y,w,h,t,s,on,cls)=>`<button class="u9 hubb${cls?" "+cls:""}" ${at(x,y,w,h)} onclick="${on}"><b>${t}</b>${s?`<span class="small dim">${s}</span>`:""}</button>`;
  let h=`<div class="hdr" ${at(8,6,300,18)}>ガレージ</div>${backBtn("タイトルへ","S.hubOpen=false;showTitle()")}`+
   B(16,62,196,66,"ミニカー",`${mc.length}／${MINICAR_MAX}台・中身を見る・処分`,"showMcBox()")+
   B(222,62,196,66,"デッキを組む",`${esc(TEXT.names[ch]||ch)}・${deckCount(loadDeck(ch))}枚`,"showDeck()")+
   B(428,62,196,66,"みおのラボ",`ログ ${p.log||0}・カードを開く／改造`,"showLab()")+
   `<div class="hubsec" ${at(20,138,600,30)}><b>型（スキルツリー）</b><span class="small dim">　キャラごとに型のメモ3つ。ランの前の「型をえらぶ」と同じもの</span></div>`+
   op.map((c,i)=>B(16+i*152,170,146,52,`${esc(TEXT.names[c]||c)}の型`,`「${esc(treeName(c))}」・ポイント ${(treeData(c).pts||0)-treeSpent(treeData(c).presets[treeData(c).cur||0].lv)}`,`S.treeHub=true;S.treeCh='${c}';showTree()`,"hubt")).join("")+
   B(222,240,196,56,esc(BETA_TXT.noticeHead),"","showBetaEnd(()=>showHub(),true)")+(typeof showCodex==="function"?B(16,240,196,56,"図鑑",typeof cdxPct==="function"&&typeof cdxAll==="function"?`${cdxPct(cdxAll())}%`:"","showCodex('card','title')"):"");
  ui().innerHTML=h}
/* ミニカーの保管庫：一覧（新しい順）・右に中身（mcDetail）・処分（確認あり） */
function showMcBox(){setScreen("mcbox");setScene("dim");setBg("garage");closeModal();const mc=loadMinicars().slice().reverse();S.mcbox=mc;if(!mc.some(m=>m.id===S.mcboxSel))S.mcboxSel=mc[0]&&mc[0].id;
  const sel=mc.find(m=>m.id===S.mcboxSel),sc=$("#mbl")?$("#mbl").scrollTop:0;
  ui().innerHTML=`<div class="hdr" ${at(8,6,300,18)}>ミニカー ${mc.length}／${MINICAR_MAX}台</div><div class="sign" ${at(8,26,300,328)}></div>
   <div class="scroll grid1" id="mbl" ${at(14,30,288,320)}>${mc.length?mc.map((m,i)=>mcHTML(m,{cls:m.id===S.mcboxSel?"on":"",attrs:`onclick="S.mcboxSel='${m.id}';SND.se('ui_ok');showMcBox()"`})).join(""):`<div class="dim small">まだミニカーがない。ランを終えると1台できる。</div>`}</div>
   ${backBtn("もどる","showHub()")}
   <div class="sign mcdet" ${at(312,58,320,226)}><div class="scroll" id="mcd">${sel?mcDetail(sel):`<div class="small dim">ミニカーを選ぶと中身が出ます。</div>`}</div></div>
   ${sel?`<div class="col" ${at(452,292,180)}><button class="u9 warn" onclick="mcDispose()">このミニカーを処分</button></div>`:""}`;
  if($("#mbl"))$("#mbl").scrollTop=sc;{const d=$("#mcd");if(d&&d.scrollHeight>d.clientHeight+2){const t=document.createElement("div");t.className="small mcmore";t.textContent="▼ つづき（上下に動かせます）";d.parentNode.appendChild(t);d.onscroll=()=>{if(d.scrollTop+d.clientHeight>=d.scrollHeight-2)t.remove()}}}}
function mcDispose(){const m=(S.mcbox||[]).find(x=>x.id===S.mcboxSel);if(!m)return;SND.se("overwrite_warn");S.mcDisGo=()=>{const a=loadMinicars().filter(x=>x.id!==m.id);saveMinicars(a);closeModal();SND.se("card_toss");toast2("ミニカーを処分しました");S.mcboxSel=null;showMcBox()};
  modal(`<div class="h">このミニカーを処分しますか？</div><div class="small">${esc(m.rank)} ${esc(TEXT.names[m.char]||m.char)}・${esc(m.mode)}／カード ${m.cards.length}枚${m.part?"・"+esc(partName(m.part)):""}</div><div class="small dim">もとにはもどせません。</div><div class="row"><button class="warn" onclick="S.mcDisGo()">処分する</button><button class="main" onclick="closeModal()">やめる</button></div>`)}

/* ===== ★v0.22.81 虎雪 14:07：公開β の締め（NIGHT 4 の初クリア：SORA の予告のあと・text v0.22.21 35章）と「正式版の予告」（ガレージ）。TEXT.beta があればそれ ===== */
const BETA_TXT=Object.assign({
  pages:["ROAD の夜は、まだ明けない。<br>――続きは、正式版で。","まだ、走っていない記録がある。<br>？？？",
    "β 版は、このまま遊べます。<br>NIGHT 1〜4 の周回・ミニカー集め・カード改造・スキルツリー・フルオート周回。",
    "走ってくれて、ありがとうございました。<br>感想は X のリプライ・DM で、気軽にどうぞ。","みお：また、次の夜に。<br>こゆき：……ん。待ってる。"],
  noticeHead:"正式版の予告",noticeBody:"仲間は、あと6人。ROAD の夜は、もっと深くなる。<br>夜明けの日まで、もうしばらくお待ちください。",
  nightLock:"正式版で、走れます",toTitle:"タイトルへ",back:"もどる",next:"タップで次へ"},typeof TEXT!=="undefined"&&TEXT.beta||{});
const BETA_NEXT=["SORA","KAEDE","RIN","LUNA","KURO","MIO"];/* 加わる順。SORA は予告で出たので少し明るく */
const BETA_ART=["","","","","assets/c2/story/c2/revremit_story_ending_garage.png"];
FULL_SCREENS.push("betaend");SCREEN_BG.betaend="garage";
const betaSilHTML=y=>`<div class="sign besbg" ${at(40,y-4,560,136)}></div>`+BETA_NEXT.map((c,i)=>`<div class="besil${i?"":" besora"}" ${at(44+i*92,y,88,128)}><canvas id="bes${i}" width="88" height="104"></canvas><div class="small dim">？？？</div></div>`).join("");
function showBetaEnd(done,fromHub){setScreen("betaend");setScene("dim");setBg("garage");closeModal();S.betaDone=done;S.betaHub=!!fromHub;S.betaPg=0;
  if(!fromHub)SND.bgm("title");betaRender()}
function betaRender(){const n=S.betaPg,hub=S.betaHub,T=BETA_TXT,last=hub||n>=T.pages.length-1;
  const art=!hub&&BETA_ART[n]&&window.ART_HAVE&&ART_HAVE.has(BETA_ART[n])?BETA_ART[n]:null;
  let h=art?`<img class="px beart" src="${(window.ART_EMBED&&ART_EMBED[art])||art}" ${at(0,0,640,360)} alt="">`:"";
  if(hub){h+=`<div class="hdr" ${at(8,6,360,18)}>${esc(T.noticeHead)}</div><div class="sign bemsg" ${at(40,34,560,52)}><div>${T.noticeBody}</div></div>`+betaSilHTML(100)}
  else{const sil=n===1;h+=`<div class="sign bemsg${art?" bebot":""}" ${art?at(40,232,560,52):sil?at(40,30,560,52):at(40,130,560,72)}><div>${T.pages[n]}</div></div>`+(sil?betaSilHTML(96):"")+
    `<div class="small dim bepg" ${at(40,art?288:sil?236:210,560,14)}>${n+1}／${T.pages.length}${last?"":"　"+esc(T.next)}</div>`}
  h+=last?`<div class="col" ${at(220,hub?250:308,200)}><button class="main u9" onclick="event.stopPropagation();betaEndGo()">${esc(hub?T.back:T.toTitle)}</button></div>`:"";
  ui().innerHTML=`<div class="betap" ${at(0,0,640,360)} onclick="betaTap()"></div>`+h;
  if(hub||n===1)betaSil()}
function betaTap(){if(S.betaHub||S.betaPg>=BETA_TXT.pages.length-1)return;S.betaPg++;SND.se("text_next");betaRender()}
function betaEndGo(){const d=S.betaDone;S.betaDone=null;SND.se("ui_ok");if(d)d();else showTitle()}
async function betaSil(){try{await Promise.all(BETA_NEXT.map(silFrame))}catch(e){}/* ★v0.22.125 1コマだけ */if(window.SCREEN!=="betaend")return;
  BETA_NEXT.forEach((c,i)=>{const cv=$("#bes"+i);if(!cv)return;const g=cv.getContext("2d"),set=(SPR[c]&&!SPR[c].proc)?SPR[c]:SILFR[c];g.clearRect(0,0,cv.width,cv.height);
    if(!set||set.proc||!set.frames){g.fillStyle="#0b0d16";g.font="40px PM12";g.textAlign="center";g.fillText("？",44,70);return}
    const t=set.tags.idle||set.tags.stand||[0,0],fr=set.frames[t[0]],tmp=document.createElement("canvas");tmp.width=fr.width;tmp.height=fr.height;const q=tmp.getContext("2d");
    q.drawImage(fr,0,0);q.globalCompositeOperation="source-in";q.fillStyle=i?"#05060c":"#2a3350";q.fillRect(0,0,tmp.width,tmp.height);
    const sc=104/fr.height;g.imageSmoothingEnabled=false;g.shadowColor=i?"rgba(150,180,255,.45)":"rgba(200,230,255,.9)";g.shadowBlur=i?5:10;if(!i){g.globalAlpha=1}g.drawImage(tmp,(cv.width-fr.width*sc)/2,0,fr.width*sc,fr.height*sc)})}
