/* js/beta2.js（プログラム班② v0.5.19）
   β の4人まわりの組みこみ（窓口 11-27 08:02）。①のファイルは書きかえず、ここから足す（rr2Wrap と同じ考え）。
   ①の本体に入ったら、その所だけ消してよい（下の見出しごとに独立）。
   1. 文（text.md v0.22.61）：ROAD LOG の続き -B（26-1）・送り届けた記録の ROAD LOG（31-1〜31-5）・整備チケット（33-2）・
      ミニカーのランクの上限（34-1）・ランを始める流れ（27-9-1）・型の札（27-6-3）・予告と印（28-2）・引き継ぎ（27-8-2）
   2. ストーリーの解放の札＋ jingle("story_unlock")・ガレージの「ROAD LOG」の棚
   3. 絵（graphics-import-list B）：マップの天候 @2x・夜霧の上のふち・ガレージとタイトルの街の灯りの層（届いた記録の段）
   ★one_turn_kill の字は変えない（今の試作のまま）。 */
"use strict";
(function(){
if(typeof TEXT==="undefined")return;
const W=(name,fn)=>{const f=window[name];if(typeof f!=="function")return;const g=fn(f);g.__b2=1;g.__orig=f;window[name]=g};
const AH=p=>typeof artHave==="function"&&artHave(p);
const AU=p=>typeof artURL==="function"?artURL(p):p;
const E=s=>typeof esc==="function"?esc(s):String(s);

/* ===== 1. 文 ===== */
TEXT.ui=TEXT.ui||{};TEXT.scenes=TEXT.scenes||{};
Object.assign(TEXT.ui,{
  /* 34-1 ミニカーのランク（リザルト） */
  mc_cap_lose:"負けたので、ランクは {rank} まで",mc_cap_night:"この夜では、ランクは {rank} まで",
  /* 27-9-1（★今のキャラ選択 案1＝v0.22.108 には「夜をえらぶ」画面と確認の小窓がない。字だけ入れておく） */
  flow_night_go:"この夜で走る<br>つぎ：ミニカー",flow_night_go_nomc:"この夜で走る<br>つぎ：確かめる",flow_cf_sub:"この内容で、ランを始めます。",
  /* 27-6-3 */
  char_tree:"型：{メモの名前}",
  /* 27-8-2 */
  xfer_in_from:"・{日時} に書き出し",
  /* 33-2 */
  ticket_full:"チケットがいっぱい（5枚まで）",ticket_pick:"整備チケットを使う（1ランに1枚）",
  /* ガレージの ROAD LOG の棚（★見出しは text 1-7・31章の言い方。棚の画面の短い文はシナリオ班の確認待ちの仮） */
  rl_shelf:"ROAD LOG",rl_shelf_sub:"読んだ記録 {n}／{m}",rl_head_pz:"PROJECT ZERO - ROAD LOG",rl_head_remit:"ROAD LOG ― 送り届けた記録",
  rl_locked:"？？？",rl_remit_left:"あと {n}",rl_story_got:"{name}"
});
/* 負けたランの上限の札（①の rank_loss_cap）を 34-1 の文に（札の幅 86 なので「、」で折る） */
TEXT.ui.rank_loss_cap=TEXT.ui.mc_cap_lose.replace("、","、<br>").replace("{rank}","{r}");
/* 28-2（★天翔 B・ティータイムの予告は、今の試作のカードにその仕組みがない＝字だけ。誇りの印 hokori_icon は①が入れずみ） */
TEXT.icon=Object.assign({},TEXT.icon,{tenshou_icon:"ためる ×{n}（次のアタック1枚）"});
TEXT.prev=Object.assign({},TEXT.prev,{tenshou_prev:"次のアタック ×{n}",teatime_prev_draw:"1枚引く",teatime_prev_nodraw:"引かない（手札 {n} 枚）"});
/* 33-2 整備チケットの名前と1行（★割合と額は今の試作の数＝最初のショップ 30% 引き・お金 +30。text は 20%・+20 ＝デザイン班に確認） */
const TK_NAME={discount:"割引チケット",partPick:"パーツカタログ",money:"暖機運転",cardPick:"作戦メモ"};
if(typeof FARM_TICKET_JP!=="undefined")Object.assign(FARM_TICKET_JP,TK_NAME);
if(typeof TICKET_TXT!=="undefined")Object.assign(TICKET_TXT,{discount:"最初のチューニングショップが 30% 引き（ほかの割引と合わせて 50% まで）",partPick:"最初のパーツの候補が、4つになる",money:"ランのはじめのお金 +30",cardPick:"最初の戦闘の報酬のカードを、4枚から選べる"});

/* 26-1 ROAD LOG の続き（β の4人）。出す所：その子で NIGHT 6 以上を初めてクリア（β は NIGHT 4 まで＝正式版で出る） */
const RL_B={
 yuki:["001",[["FILE","始動音の録音の続き。<br>エンジンがかかったあと、少しの間。"],["FILE","だれかの、短い笑い声。<br>録音は、そこで切れている。"],["FILE","ファイルの名前：<br>「はじめての始動」"],["FILE","記録した人の欄：PROJECT ZERO"],["YUKI_IN","……この笑い声も、<br>知ってる気がする。","serious"]]],
 hina:["002",[["FILE","同じ字のくせの、整備記録。<br>もう一枚。"],["FILE","作業：小さなバイクに、<br>ロガーを付けた。"],["FILE","すみに、手書きの一言。<br>「次の人へ。」"],["FILE","整備した人の欄は、黒く塗られている。"],["HINA_IN","……ひなのモンキーと、同じ。<br>先輩も、だれかに付けてもらったのかな。","normal"]]],
 momo:["003",[["FILE","写真の裏の、かすれた文字。<br>少しだけ、読めるようになった。"],["FILE","「……ジェクト・ゼロ、<br>はじまりの日」"],["FILE","その下に、小さく十の名前。<br>どれも、黒く塗られている。"],["FILE","撮った人の欄：PROJECT ZERO"],["MOMO_IN","……十人。CROSS GATE に<br>つなげる人数と、同じ。","normal"]]],
 nana:["004",[["FILE","「接続テスト」の記録の一覧。"],["FILE","テストは、決勝の日だけではない。<br>何度も、行われている。"],["FILE","いちばん古い日付は、何年も前。<br>送り先は、すべて同じ。"],["FILE","送り先の名前は、黒く塗られている。"],["NANA_IN","……あの日だけでは、<br>ありませんでしたのね。","normal"]]]};
Object.entries(RL_B).forEach(([c,[no,lines]])=>{if(!TEXT.scenes["roadlog_"+c+"_b"])TEXT.scenes["roadlog_"+c+"_b"]={title:`PROJECT ZERO - ROAD LOG No.${no}-B`,file:1,lines}});
/* 31章 送り届けた記録の数の ROAD LOG（だれで走っていても同じ文。みおの行はガレージで読む場面＝通信にしない） */
const RL_R={
 50:[["FILE","配達の軽バンの記録。<br>最後の一軒に、届けられなかった夜。"],["REC","〈……荷物、届いてました。<br>ずっと前に、たのんだやつ〉"],["REC","〈遅れてすみません、って<br>メモがついてて〉"],["MIO","送った記録が、50になりました。<br>……ちゃんと、届いてます。","smile"]],
 100:[["FILE","雪の日の、帰り道の記録。<br>坂の途中で、引き返した車。"],["REC","〈あの日、帰れなかったのに、<br>なぜか、家に着いた夢を見た〉"],["REC","〈起きたら、窓の外が晴れてて。<br>……なんだか、ほっとした〉"],["MIO","100です。<br>ROAD の街が、少しだけ静かになりました。","normal"]],
 200:[["FILE","峠を走った、二台の記録。<br>いつも、同じ所で並んでいた。"],["REC","〈……あいつと走ったの、<br>もう何年前だっけ〉"],["REC","〈久しぶりに、連絡してみるか〉"],["MIO","200になりました。<br>……届いた先で、また何かが始まるんですね。","smile"]],
 500:[["FILE","サーキットの記録。<br>ゴールの前で、止まった一周。"],["REC","〈……完走、できてたのか。<br>記録の上だけ、でも〉"],["REC","〈じゃあ、次は本当に走りきろう〉"],["MIO","500です。<br>みなさんの走りが、ROAD の外へ帰っていきます。","normal"]],
 1000:[["FILE","送り先の一覧。千の名前と、<br>千の「ただいま」。"],["REC","〈おかえり〉"],["REC","〈おかえりなさい〉"],["MIO","……1000、です。<br>こんなにたくさん、待っている人がいたんですね。","normal"],["MIO","みおも、ちゃんと<br>「おかえり」って言いますね。","smile"]]};
Object.entries(RL_R).forEach(([n,lines])=>{if(!TEXT.scenes["roadlog_remit_"+n])TEXT.scenes["roadlog_remit_"+n]={title:`ROAD LOG ― 送り届けた記録 ${n}`,file:1,lines}});
W("mioComm",f=>function(s,i){if(s&&/^roadlog_remit_/.test(s.key))return false;return f.apply(this,arguments)});

/* ===== 2. ストーリーの解放（札＋ジングル）・棚 =====
   profile.rlog.got＝開いた ROAD LOG の key（スロットごと＝引き継ぎコードに入る）。キャラの1枚目（roadlog_001〜）は今までどおり見たかどうか（seen） */
const BETA4=["YUKI","HINA","MOMO","NANA"];
function RL(){const p=PRF();p.rlog=p.rlog&&typeof p.rlog==="object"?p.rlog:{};if(!Array.isArray(p.rlog.got))p.rlog.got=[];return p.rlog}
const REMIT_MARKS=()=>typeof DELIV!=="undefined"&&DELIV.marks||[50,100,200,500,1000];
const BNIGHT=6;/* 26章：その子で NIGHT 6 以上を初めてクリア */
function rlName(k){const sc=TEXT.scenes[k];return sc&&sc.title?sc.title.replace(/^PROJECT ZERO - /,"").replace(/^ROAD LOG ― /,""):k}
S.rr2RlQ=[];
W("runEnd",f=>function(clear,rank){const r=f.apply(this,arguments);try{if(!G||G.practice||window.TUTORIAL_ON)return r;const R=RL(),got=S.runGot||[],add=[];
  REMIT_MARKS().forEach(n=>{const k="roadlog_remit_"+n;if(TEXT.scenes[k]&&delivCount()>=n&&!R.got.includes(k))add.push(k)});
  const c=(G.char||"YUKI").toLowerCase(),kb="roadlog_"+c+"_b";
  if(clear&&!G.fullAuto&&(G.night|0)>=BNIGHT&&TEXT.scenes[kb]&&!R.got.includes(kb)){add.push(kb);S.rr2RlQ.push(kb)}
  add.forEach(k=>{R.got.push(k);got.push("ストーリー："+(TEXT.ui.rl_story_got||"{name}").replace("{name}",rlName(k)))});
  if(add.length){S.rr2StoryNew=add.length;SAVE.auto()}}catch(e){console.error("[beta2] runEnd",e)}return r});
W("afterCarShow",f=>function(got){const q=S.rr2RlQ||[];if(q.length){const k=q.shift();showScene(k,()=>window.afterCarShow(got));return}
  const st=(got||[]).some(t=>/^ストーリー：/.test(t)),nu=(got||[]).some(t=>/^夜：/.test(t));
  const r=f.apply(this,arguments);if(st){S.rr2StoryNew=0;setTimeout(()=>SND.jingle("story_unlock"),nu?3200:300)}/* audio-list 20-3：ストーリーの解放の札が出るとき */
  return r});
/* 棚：ガレージの4つ目の枠（422,240） */
function rlList(){const R=RL(),seen=typeof seenGet==="function"?seenGet():{},L=[];
  BETA4.forEach((C,i)=>{const no=("00"+(i+1)).slice(-3),k1=C==="YUKI"?"roadlog_001":"roadlog_001_"+C.toLowerCase(),kb="roadlog_"+C.toLowerCase()+"_b";
    L.push({k:k1,g:"pz",n:`No.${no}　${(TEXT.names||{})[C]||C}`,on:!!seen[k1]&&!!TEXT.scenes[k1]});
    L.push({k:kb,g:"pz",n:`No.${no}-B　${(TEXT.names||{})[C]||C}`,on:R.got.includes(kb)})});
  REMIT_MARKS().forEach(n=>{const k="roadlog_remit_"+n;if(TEXT.scenes[k])L.push({k,g:"remit",n:`${n}`,on:R.got.includes(k),left:Math.max(0,n-delivCount())})});return L}
{const st=document.createElement("style");st.textContent=".modal .box.rlbox{width:380px}.modal .rlshelf{max-height:250px;overflow-y:auto;display:grid;grid-template-columns:1fr 1fr;gap:2px 4px;align-content:start}.modal .rlshelf .small{grid-column:1/-1;margin-top:2px}.modal .rlshelf button.nrow{min-height:22px;margin:0;padding:2px 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}";document.head.appendChild(st)}
window.rr2RoadLog=function(){SND.se("ui_ok");const L=rlList(),U=TEXT.ui,row=x=>x.on?`<button class="nrow" onclick="rr2RlRead('${x.k}')">${E(x.n)}</button>`
   :`<button class="nrow" disabled><span class="dim">${E(x.g==="remit"?x.n:x.n.replace(/　.*/,""))}　${E(U.rl_locked)}${x.g==="remit"&&x.left?`（${E(U.rl_remit_left.replace("{n}",x.left))}）`:""}</span></button>`;
  modal(`<div class="h">${E(U.rl_shelf)}</div><div class="nlist rlshelf"><div class="small gold">${E(U.rl_head_pz)}</div>${L.filter(x=>x.g==="pz").map(row).join("")}
   <div class="small gold">${E(U.rl_head_remit)}</div>${L.filter(x=>x.g==="remit").map(row).join("")}</div><div class="row"><button onclick="SND.se('ui_cancel');closeModal()">${E(TEXT.beta&&TEXT.beta.back||"もどる")}</button></div>`);const bx=$("#modal .box");if(bx)bx.classList.add("rlbox")};
window.rr2RlRead=function(k){SND.se("ui_ok");closeModal();const g=G&&G.char;if(G&&k==="roadlog_001")G.char="YUKI";/* YUKI の1枚目は sceneKey が YUKI の時だけ出す形なので、読むあいだだけ */
  try{showScene(k,()=>{showHub()})}finally{if(G&&g)G.char=g}};
W("showHub",f=>function(){const r=f.apply(this,arguments);try{const L=rlList(),n=L.filter(x=>x.on).length,U=TEXT.ui;
  const h=`<button class="u9 hubb rlhub" ${at(428,240,196,56)} onclick="rr2RoadLog()"><b>${E(U.rl_shelf)}</b><span class="small dim">${E(U.rl_shelf_sub.replace("{n}",n).replace("{m}",L.length))}</span></button>`;
  ui().insertAdjacentHTML("beforeend",h)}catch(e){console.error("[beta2] hub",e)}return r});

/* ===== 34-1 ミニカーのランク：夜の上限で止まったとき（負けの上限は①の .lossc＝rank_loss_cap を上で差しかえ） ===== */
W("showResult",f=>function(clear){const r=f.apply(this,arguments);try{const res=S.res;if(!res||res.lossCap||!G)return r;const cap=typeof RANK_CAP!=="undefined"&&RANK_CAP[G.night||0];if(!cap)return r;
  let raw=0;RANKS.forEach((k,i)=>{if(res.total>=RANK_TH[k])raw=i});if(raw<=RANKS.indexOf(cap))return r;
  ui().insertAdjacentHTML("beforeend",`<div class="small sh lossc nightc" ${at(550,10,86,36)}>${E(TEXT.ui.mc_cap_night.replace("{rank}",cap)).replace("、","、<br>")}</div>`)}catch(e){console.error("[beta2] result",e)}return r});

/* ===== 27-6-3 キャラ選びの札に「型：○○」 ===== */
W("renderCharSel",f=>function(){const r=f.apply(this,arguments);try{const c=S.csSel;if(!csOpen(c)||typeof TREE==="undefined"||!TREE[c])return r;const n=$(".csnights");if(!n)return r;
  n.insertAdjacentHTML("afterend",`<div class="csrow cstree"><span class="small">${E(TEXT.ui.char_tree.replace("{メモの名前}",treeName(c)))}</span></div>`)}catch(e){console.error("[beta2] charsel",e)}return r});

/* ===== 3. 絵 ===== */
/* B-3 マップの天候：graphics\map\c2\revremit_map_wx_{wx}{,@2x}.png（20×20・40×40）。あれば今の ui_wx（1x）のかわりに。dry はマスに出さない（design：ドライ＝変わりなし） */
const WXP=(w,x2)=>`assets/c2/map/c2/revremit_map_wx_${w}${x2?"@2x":""}.png`;
window.wxIconSrc=w=>AH(WXP(w))?AU(WXP(w)):AH(`assets/c2/ui/c2/revremit_ui_wx_${w}.png`)?AU(`assets/c2/ui/c2/revremit_ui_wx_${w}.png`):"";
const FOGUP=["assets/c2/map/c2/revremit_map_nightfog_edge_up.png","assets/c2/ui/c2/revremit_map_nightfog_edge_up.png"];
W("showMap",f=>function(){const r=f.apply(this,arguments);try{
  document.querySelectorAll("#ui .node .wxt").forEach(el=>{const m=(el.className.match(/wx-(\w+)/)||[])[1];if(!m||!AH(WXP(m)))return;const nm=typeof wxName==="function"?wxName(m):m,fav=typeof wxFav==="function"&&wxFav(m);
    el.classList.add("ic");el.innerHTML=`<img src="${AU(WXP(m))}"${AH(WXP(m,1))?` srcset="${AU(WXP(m))} 1x, ${AU(WXP(m,1))} 2x"`:""} alt="${E(nm)}">${fav?"<b>★</b>":""}`});
  const fu=FOGUP.find(AH),yg=$("#ui .yogiri");if(fu&&yg&&!yg.querySelector(".ygu")){const im=window.IMG&&IMG[fu],h=im&&im.height||16,w=im&&im.width||128;
    yg.insertAdjacentHTML("beforeend",`<div class="ygu" style="position:absolute;left:40px;right:0;top:0;height:${h}px;background:url('${AU(fu)}') left top/${w}px ${h}px repeat-x;image-rendering:pixelated;pointer-events:none"></div>`)}
 }catch(e){console.error("[beta2] map",e)}return r});
/* B-5 ガレージ・タイトルの街の灯りの層 L1〜L5（640×360・透明）：送り届けた記録の段（delivCity＝0〜5）の数だけ base に重ねる */
const CITY={};
function cityImg(k){const base=window.IMG&&IMG[`assets/c2/bg/c2/revremit_bg_${k}_base.png`];if(!base)return null;const n=typeof delivCity==="function"?delivCity():0;
  const ls=[];for(let i=1;i<=n;i++){const p=`assets/c2/bg/c2/revremit_bg_${k}_city_L${i}.png`;if(window.IMG&&IMG[p])ls.push(IMG[p])}if(!ls.length)return null;
  const key=k+"|"+ls.length;if(CITY[key])return CITY[key];const cv=document.createElement("canvas");cv.width=base.width;cv.height=base.height;const g=cv.getContext("2d");g.imageSmoothingEnabled=false;
  g.drawImage(base,0,0);ls.forEach(im=>g.drawImage(im,0,0,cv.width,cv.height));return CITY[key]=cv}
W("setBg",f=>function(k){const r=f.apply(this,arguments);try{if((k==="garage"||k==="title")&&typeof A!=="undefined"){const c=cityImg(k);if(c)A.bgImg=c}}catch(e){}return r});
window.BETA2={VERSION:"0.5.19",rlList,cityImg};
})();
