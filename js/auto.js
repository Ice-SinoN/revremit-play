"use strict";
/* ===== ★v0.22.11 オート戦闘（試遊用・★虎雪 18:45「微妙だったら消せばいい」）・設定の画面（★虎雪 19:06） =====
   FEATURES.auto を false にすると、オートのボタン・設定のオートの行が丸ごと消える（ほかは何も変わらない）。
   オート：戦闘の画面の「オート」で入／切。AI（js/bot.js の AUTOBOT＝QA のボットの写し・smart）がカードを選んでターンを進める。
     報酬・パーツ・ショップ・ガレージは手動のまま。早送り 1・2・4倍（モーションの速さ）。
   設定：戦闘・マップの「設定」。音量（BGM・効果音）・オートの早送りの初期値・全画面・つづける／タイトルへ／あきらめる。
     音量と早送りは端末に覚える（localStorage revremit_opts。セーブのスロットとは別）。 */
const FEATURES={auto:true};
const OPTS={bgm:0.55,se:0.9,speed:1};
try{Object.assign(OPTS,JSON.parse(localStorage.getItem("revremit_opts")||"{}"))}catch(e){}
function optsSave(){try{localStorage.setItem("revremit_opts",JSON.stringify(OPTS))}catch(e){}}
function optsApply(){if(window.AUDIO)try{AUDIO.setVolume("bgm",OPTS.bgm);AUDIO.setVolume("se",OPTS.se);AUDIO.setVolume("engine",Math.min(1,OPTS.se*0.85))}catch(e){}}
addEventListener("pointerdown",()=>optsApply(),{once:true});

/* ---- オート ---- */
const AUTO={on:false,speed:OPTS.speed||1,t:0};
function autoOk(){return FEATURES.auto&&!window.TUTORIAL_ON}
/* アニメの速さ（anim.js の step で使う） */
function animSpeed(){return AUTO.on&&autoOk()?AUTO.speed:1}
function autoToggle(){if(!autoOk())return;AUTO.on=!AUTO.on;AUTO.t=Date.now();SND.se(AUTO.on?"ui_ok":"ui_cancel");if(window.SCREEN==="battle"&&B)renderBattle()}
function autoSpeed(){AUTO.speed=AUTO.speed>=4?1:AUTO.speed*2;SND.se("ui_ok");if(window.SCREEN==="battle"&&B)renderBattle()}
/* 戦闘の画面のボタン（右の列。↓シフト・ターン終了の上） */
function autoButtons(locked){let h=`<button class="sub optb" ${at(578,222,58,34)} onclick="showOpts()">設定</button>`;
  if(autoOk())h+=`<button class="sub autob${AUTO.on?" on":""}" ${at(578,184,58,34)} onclick="autoToggle()">オート<br><span class="small">${AUTO.on?"入":"切"}</span></button>`+
    (AUTO.on?`<button class="sub autosp" ${at(578,146,58,34)} onclick="autoSpeed()">×${AUTO.speed}</button>`:"");
  return h}
/* 1手ずつ：モーションが終わっていて、小窓が出ていないとき */
function autoTick(){if(!AUTO.on||!autoOk()||window.SCREEN!=="battle"||!B||B.over||busy()||S.pending)return;
  if(document.querySelector("#modal .modal"))return;
  const wait=Math.round(350/AUTO.speed);if(Date.now()-AUTO.t<wait)return;AUTO.t=Date.now();
  let a;try{a=AUTOBOT.battle("smart")}catch(e){console.error(e);AUTO.on=false;renderBattle();return}
  if(!a)return;
  if(a.t==="play"){if(preview(B.hand[a.i]).danger==="blow"&&!a.shift){doEndTurn();return}/* オートはブローしない（確認の小窓を出さない） */
    S.sel=a.i;doPlay(a.i,a.shift)}
  else if(a.t==="down")doDownShift();else if(a.t==="park")doParking();else doEndTurn()}
setInterval(autoTick,60);

/* ---- 設定 ---- */
function showOpts(){SND.se("ui_ok");S.optsOpen=true;S.autoWas=AUTO.on;AUTO.on=false;renderOpts()}
function renderOpts(){const fs=typeof FS_OK==="function"&&FS_OK(),inRun=!!G&&(window.SCREEN==="battle"||window.SCREEN==="map");
  const sl=(k,n)=>`<div class="oprow"><span>${n}</span><input type="range" min="0" max="100" step="5" value="${Math.round(OPTS[k]*100)}" oninput="OPTS.${k}=this.value/100;optsApply();optsSave();this.nextElementSibling.textContent=this.value"><b>${Math.round(OPTS[k]*100)}</b></div>`;
  modal(`<div class="opts"><div class="h">設定</div>${sl("bgm","BGM")}${sl("se","効果音")}
   ${FEATURES.auto?`<div class="oprow"><span>オートの早送り</span><span class="opbtns">${[1,2,4].map(v=>`<button class="${OPTS.speed===v?"main":""}" onclick="OPTS.speed=${v};AUTO.speed=${v};optsSave();renderOpts()">×${v}</button>`).join("")}</span></div>`:""}
   ${fs?`<div class="oprow"><span>全画面</span><span class="opbtns"><button class="${isFS()?"main":""}" onclick="toggleFS();setTimeout(renderOpts,300)">${isFS()?"入":"切"}</button></span></div>`:""}
   <div class="row"><button class="main" onclick="optsClose()">つづける</button>${inRun?`<button onclick="optsTitle()">タイトルへ</button><button class="warn" onclick="optsGiveUp()">あきらめる</button>`:""}</div></div>`);
  const m=$("#modal .modal .box");if(m)m.classList.add("optbox")}
function optsClose(){S.optsOpen=false;AUTO.on=!!S.autoWas;closeModal();SND.se("ui_cancel");if(window.SCREEN==="battle"&&B)renderBattle()}
/* タイトルへ：ランはオートセーブに残る（「つづきから」で戻れる） */
function optsTitle(){S.optsOpen=false;AUTO.on=false;closeModal();SND.engineStop();flushAnim();showTitle();toast2("ランはオートセーブに残っています（つづきから）")}
/* あきらめる：確認 → ふつうの負けと同じ（リザルト・ログはその時点まで） */
function optsGiveUp(){modal(`<div class="h">本当にあきらめますか？</div><div class="small">今のランはここで終わります（負けと同じ。ログはここまでのぶん）。</div>
  <div class="row"><button class="warn" onclick="optsGiveUpGo()">あきらめる</button><button onclick="renderOpts()">やめる</button></div>`)}
function optsGiveUpGo(){S.optsOpen=false;AUTO.on=false;closeModal();SND.engineStop();flushAnim();if(B&&!B.over){B.over=true;B.result="dead"}S.pending=null;showResult(false)}
