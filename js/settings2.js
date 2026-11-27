/* js/settings2.js（プログラム班②） */
"use strict";
/* ===== 文字の大きさ（progression 1-26 の 5）・戦闘の速さと敵の番のスキップ（1-25 の 3）=====
   どちらも端末に覚える（OPTS＝localStorage revremit_opts。セーブ・引き継ぎコードには入らない）。
   設定の画面（auto.js の renderOpts）に行を足す。タイトルにも「設定」（①の本番ではタイトルの HTML に）。 */
OPTS.fsz=OPTS.fsz||"m";if(OPTS.ogFx!=="short")OPTS.ogFx="full";OPTS.bspd=OPTS.bspd===2?2:1;
const FSZ={s:0.9,m:1,l:1.15},FSZ_JP={s:"小",m:"中",l:"大"};

/* ---------- 戦闘の速さ ----------
   演出（カード・敵の動き・数字・メーター）だけ速くする。結果は変わらない。手動 1／2、オート 1／2／4（オートの ×n と同じボタン）。チュートリアルの間は 1倍・スキップなし。 */
const animSpeed0=window.animSpeed;
window.animSpeed=function(){if(window.TUTORIAL_ON)return 1;if(typeof AUTO!=="undefined"&&AUTO.on&&autoOk())return AUTO.speed;return window.SCREEN==="battle"?(OPTS.bspd||1):1};
function bspdToggle(){OPTS.bspd=OPTS.bspd===2?1:2;optsSave();try{SND.se("ui_ok")}catch(e){}if(window.SCREEN==="battle"&&B)renderBattle()}
/* 戦闘の右の列：オートが切のとき、オートの ×n と同じ所（578,146）に手動の ×1／×2 */
if(typeof autoButtons==="function"){const f=autoButtons;window.autoButtons=function(locked){let h=f(locked);
  if(!window.TUTORIAL_ON&&!(typeof AUTO!=="undefined"&&AUTO.on))h+=`<button class="sub autosp bspd${OPTS.bspd===2?" on":""}" ${at(578,146,58,34)} onclick="bspdToggle()">×${OPTS.bspd}</button>`;return h}}

/* ---------- 敵の番のスキップ ----------
   敵の番の演出の間に画面をタップすると、その番の残りを飛ばして結果だけ出す（ダメージの数字は合計で1回。ログには全部残る＝engine はそのまま）。
   大きな攻撃の予告の音（design 10-7）は renderBattle が鳴らすので、そのまま鳴る。
   ★①に頼む：anim.js の playEvents の eact の所で、push する手順に en:1 をつける（今は mEnemyAct を外から包んでつけている）。 */
if(typeof mEnemyAct==="function"){const f=mEnemyAct;window.mEnemyAct=function(p,subs){const L=f(p,subs)||[],R={dmg:(subs||[]).reduce((a,e)=>a+(+e.v||0),0),started:0};
  L.forEach(s=>{s.en=R;const on=s.on;s.on=function(){R.started=1;const m=SKIP.mute;SKIP.mute=!!R.mute;try{return on&&on.apply(this,arguments)}finally{SKIP.mute=m}}});return L}}
const SKIP={on:0,mute:false,seen:{}};
if(typeof fxNum==="function"){const f=fxNum;window.fxNum=function(){if(SKIP.mute)return;return f.apply(this,arguments)}}
/* 飛ばしている間の音は、同じ音を1回だけ */
{const f=SND.se;SND.se=function(id,o){if(SKIP.on){if(SKIP.seen[id])return;SKIP.seen[id]=1}return f.call(this,id,o)}}
function enemyPending(){return!!((A.cur&&A.cur.en)||A.q.some(s=>s.en))}
function skipEnemyTurn(){if(!enemyPending())return false;SKIP.on=1;SKIP.seen={};let total=0;const Rs=new Set();
  try{A.q.forEach(s=>{if(s.en&&!s.en.started){s.en.mute=1;Rs.add(s.en)}});
    const run=s=>{if(s.up)s.up(1);if(s.end)s.end()};
    if(A.cur&&A.cur.en){run(A.cur);A.cur=null}
    while(A.q.length&&A.q[0].en){const s=A.q.shift();if(s.on)s.on();run(s)}
    Rs.forEach(R=>total+=R.dmg);
    if(total>0){SKIP.mute=false;fxNum(PC().x,PC().y-24,total,"#FF4040")}}catch(e){console.error(e)}finally{SKIP.on=0;SKIP.mute=false}
  return true}
document.addEventListener("pointerdown",e=>{if(window.SCREEN!=="battle"||window.TUTORIAL_ON||!B)return;if(e.target.closest&&e.target.closest("#modal .modal,.glpop,#rr2v"))return;
  if(enemyPending()&&skipEnemyTurn()){e.stopPropagation();e.preventDefault()}},true);

/* ---------- 文字の大きさ（小 90%／中 100%／大 115%）----------
   決まり（design 1-26 の 5）：①名前・ボタンの字は1行（入らなければその所だけ縮める・最小 80%）②説明・セリフ・用語の小窓は窓の大きさを変えず中をスクロール
   ③数字・ガソリン・回転・HP のバーの字は変えない。
   やり方：#ui・#modal・#rr2v の文字のある所の font-size をその場で掛ける（元の大きさは data-f0 に）。字はドットのフォントなので 1px 単位に丸める。
   変えない所（FIX）：手札のカードの面（.cs＝回転・ガソリン・数字の板・名前は fitHandNames が合わせている）・メーター・HP（canvas）・数字の札。 */
const FS_FIX=".cs,.cs *,.num,.gasn,.barn,.pvn,.rank,.price,.cv,.cc,.ca,canvas,.nl,.dr,.dr *,.shoprow .small,.lossc";/* v0.5.19 リザルトのランクの上限の札（幅 86）も元の大きさ *//* v0.5.18 大のとき重なった所：マップのマスの名前（.nl）・デッキの行（名前・札・種類・回転が1行に詰まっている）・ショップの行の説明（値段の下にもぐる）は元の大きさ */
const FS_ONE="button,.cn,.bn,.dn,.hdr,.h,.cdxn,.sn,.nmtag,.cdxh";
function fsK(){return FSZ[OPTS.fsz]||1}
function fsApply(root){if(!root)return;const k=fsK();const els=[...root.querySelectorAll("*")].filter(e=>{if(e.matches(FS_FIX))return false;for(const n of e.childNodes)if(n.nodeType===3&&n.nodeValue.trim())return true;return false});
  const base=els.map(e=>{if(e.dataset.f0)return[+e.dataset.f0,+e.dataset.l0||0];const c=getComputedStyle(e);let f=parseFloat(c.fontSize)||10;
    const p=e.parentElement;if(p&&p.dataset&&p.dataset.f0&&c.fontSize===getComputedStyle(p).fontSize)f=+p.dataset.f0;/* 親を大きくしたのを受けついでいるだけなら、親の元の大きさ */
    const lh=parseFloat(c.lineHeight);return[f,isNaN(lh)?0:lh*(f/(parseFloat(c.fontSize)||f))]});
  els.forEach((e,i)=>{const[f,l]=base[i];e.dataset.f0=f;if(l)e.dataset.l0=l;
    if(k===1){if(e.dataset.fs){e.style.fontSize=e.dataset.s0||"";e.style.lineHeight=e.dataset.h0||"";delete e.dataset.fs}return}
    if(!e.dataset.fs){e.dataset.fs=1;e.dataset.s0=e.style.fontSize||"";e.dataset.h0=e.style.lineHeight||""}/* ゲームが書いた大きさは覚えておいて、中にもどすとき返す */
    if(k<1&&e.closest("button")){e.style.fontSize=e.dataset.s0;return}/* 小のとき、ボタンの字は小さくしない（押す所が 28 より小さくならないように＝BUG-20） */
    const n=Math.max(7,Math.round(f*k));e.style.fontSize=n+"px";if(l)e.style.lineHeight=Math.round(l*k)+"px"});
  if(k>1)els.forEach(e=>{if(!e.matches(FS_ONE))return;const cs=getComputedStyle(e);if(/(auto|scroll)/.test(cs.overflowY))return;
    const over=()=>e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1;if(!over())return;
    const f=+e.dataset.f0,min=Math.max(7,Math.floor(f*k*0.8));let n=parseFloat(e.style.fontSize)||f;
    while(over()&&n>min){n--;e.style.fontSize=n+"px";if(e.dataset.l0)e.style.lineHeight=Math.max(n,Math.round(+e.dataset.l0*n/f))+"px"}})}
const FS_ROOTS=["#ui","#modal","#rr2v"];
function fsAll(){FS_ROOTS.forEach(s=>fsApply($(s)));const p=$(".glpop");if(p)fsApply(p)}
(function(){let q=0;const run=()=>{q=0;if(fsK()!==1||document.querySelector("[data-fs]"))fsAll()};
  const mo=new MutationObserver(()=>{if(!q){q=1;requestAnimationFrame(run)}});
  const go=()=>{mo.observe($("#stage"),{childList:true,subtree:true})};if(document.readyState==="loading")addEventListener("DOMContentLoaded",go);else go()})();
function fszSet(v){OPTS.fsz=v;optsSave();try{SND.se("ui_ok")}catch(e){}renderOpts();fsAll()}


/* ---------- 音量：天候の音・エンジン音（★虎雪 11-20 08:08）----------
   名前（①・サウンド班とそろえる）：OPTS.engine・OPTS.weather（0〜1。端末の revremit_opts。セーブ・引き継ぎコードには入らない）。読むときは sndVol("engine"|"weather")。
   初期値：エンジン音＝今の半分（今は 効果音×0.85 → その半分）。天候の音＝かすか（仮 0.3。サウンド班が audio-list に出す値に差しかえる＝WEATHER_DEFAULT）。
   エンジン音は audio.js に engine のバスがあるので AUDIO.setVolume("engine",OPTS.engine) だけ（効果音のつまみとは切りはなす）。
   天候の音は audio.js v0.24 の amb のつまみ（①が OPTS.weather を渡す）。 */
const WEATHER_DEFAULT=0.4;/* ★①：サウンド班の amb 0.4（audio-list 16章） */
if(OPTS.engine==null)OPTS.engine=Math.round((OPTS.se!=null?OPTS.se:0.9)*0.85/2*100)/100;
if(OPTS.weather==null)OPTS.weather=WEATHER_DEFAULT;
function sndVol(k){const v=OPTS[k];return typeof v==="number"?Math.max(0,Math.min(1,v)):1}
window.sndVol=sndVol;
if(typeof optsApply==="function"){const f=optsApply;window.optsApply=function(){f.apply(this,arguments);if(window.AUDIO)try{AUDIO.setVolume("engine",sndVol("engine"))}catch(e){}}}
/* 天候の音：audio.js v0.24 の amb のつまみに①が OPTS.weather を渡す（v0.22.65）。②の仮のつなぎ（ambient を包む・setVolume("weather")）は外した（二重にしぼって小さくなるため） */

/* ---------- 設定の画面に行を足す ---------- */
RRHOOK.on("screen",o=>{if(o.n!=="opts")return;const b=$("#modal .opts");if(!b||b.querySelector(".rr2opt"))return;
  /* v0.5.14 design 24-4 C10：「掛け合い」「撃破演出」は②の行に移した。①の行（auto.js の「掛け合い・撃破演出」）がまだあれば消す（①が外したら何もしない） */
  b.querySelectorAll(".oprow").forEach(r=>{const t=(r.querySelector("span")||{}).textContent||"";if(!r.classList.contains("rr2opt")&&/掛け合い/.test(t)&&/撃破/.test(t))r.remove()});const row=b.querySelector(".row");
  const h=`<div class="oprow rr2opt"><span>文字の大きさ</span><span class="opbtns">${["s","m","l"].map(v=>`<button class="${OPTS.fsz===v?"main":""}" onclick="fszSet('${v}')">${FSZ_JP[v]}</button>`).join("")}</span></div>
   <div class="oprow rr2opt"><span>戦闘の速さ</span><span class="opbtns">${[1,2].map(v=>`<button class="${OPTS.bspd===v?"main":""}" onclick="OPTS.bspd=${v};optsSave();renderOpts()">×${v}</button>`).join("")}</span></div>
   <div class="oprow rr2opt"><span>奥義の演出</span><span class="opbtns">${[["full","ふつう"],["short","短く"]].map(([v,n])=>`<button class="${(OPTS.ogFx==="short"?"short":"full")===v?"main":""}" onclick="OPTS.ogFx='${v}';optsSave();renderOpts()">${n}</button>`).join("")}</span></div>
   ${[["banter","掛け合い"],["remitFx","撃破演出"]].map(([k,n])=>`<div class="oprow rr2opt"><span>${n}</span><span class="opbtns">${[[true,"入"],[false,"切"]].map(([v,t])=>`<button class="${(OPTS[k]!==false)===v?"main":""}" onclick="OPTS.${k}=${v};optsSave();renderOpts()">${t}</button>`).join("")}</span></div>`).join("")}
   <div class="small dim rr2opt">敵の番は、画面をタップで飛ばせます。奥義の「短く」はカットインだけ（2回目からはいつも短く）。</div>`;/* v0.5.7 OPTS.ogFx（①v0.22.102 の anim.js が見る） */
  if(row)row.insertAdjacentHTML("beforebegin",h);else b.insertAdjacentHTML("beforeend",h);
  /* 音量：効果音のつまみのすぐ下に「エンジン音」「天候の音」（auto.js の sl() と同じ形） */
  const sl=(k,n)=>`<div class="oprow rr2opt rr2vol"><span>${n}</span><input type="range" min="0" max="100" step="5" value="${Math.round(sndVol(k)*100)}" oninput="OPTS.${k}=this.value/100;optsApply();optsSave();this.nextElementSibling.textContent=this.value"><b>${Math.round(sndVol(k)*100)}</b></div>`;
  const rows=[...b.querySelectorAll(".oprow")],se=rows.find(r=>/効果音/.test(r.textContent))||rows[1];
  if(se)se.insertAdjacentHTML("afterend",sl("engine","エンジン音")+sl("weather","天候の音"));
  /* 行が増えて 360 に入らないので、見出しと下のボタン（つづける・タイトルへ・あきらめる）は固定、間の行だけ上下に動かす */
  const sc=document.createElement("div");sc.className="opscroll";const first=b.querySelector(".oprow");if(first){b.insertBefore(sc,first);[...b.children].filter(e=>e!==sc&&!e.matches(".h,.row")).forEach(e=>sc.appendChild(e))}
  const box=$("#modal .modal .box");if(box)box.classList.add("rr2optbox")});
/* タイトルにも「設定」（文字の大きさを最初に選べるように） */
RRHOOK.on("screen",o=>{if(o.n!=="title")return;const u=ui();if(!u||u.querySelector(".optT"))return;
  u.insertAdjacentHTML("beforeend",`<button class="mini optT" ${at(552,292,80,28)} onclick="showOpts()">設定</button>`)});
