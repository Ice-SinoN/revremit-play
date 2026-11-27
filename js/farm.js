/* js/farm.js（プログラム班②） */
"use strict";
/* ===== フルオート周回（★虎雪 11-20 08:29「放置ゲーっぽい運用」）=====
   ランの全部を自動で回す：マップのマス選び・戦闘（今のオート AUTOBOT）・報酬のカード（デッキの足りない役割を補う）・パーツ（取る／入れ替え＝外す方は売る）・
   ショップ（チューン・目玉商品）・シム（強化・合成）・休憩・ラッキー・裏道。終わったら同じ設定で次のランを自動で始める（回数指定 or 止めるまで）。
   土台：QA のボット（qa-harness policy.js の botUiStep・BOT.node／TUNE_PREF）と、オート戦闘の AI（js/bot.js の AUTOBOT。強さはオートと同じ「少し弱め」）。
   決まり（design 10-22・FARM_RULE）：ログ 1/8・1日 150 をこえたら ×0.1（止まらない・朝4時に0）／型のポイントは全クリアで 25% に1点／整備チケット（エリアのボスで 8%・5枚まで・4種）／
     ディグ（ボスで 1.3%＋夜・天井 60ラン）／ミニカー・解放・夜の★・ストーリー・届けた数・図鑑の「見た」はなし（ランの前の profile にもどす）／ランの記録は残す（オートの印）。
   画面（★虎雪 08:31）：ホームのスタート → 「自分で走る」「フルオート周回」の2択 → フルオートは縦の専用画面（farm_ui.js・ワイヤーの OK 待ち）。今は上に「周回 n回目・合計ログ」と「止める」の帯だけ。
     止める → 「このランの終わりで」「すぐ止める（ランはオートセーブに残る＝つづきから）」。
   放置：画面が消えないように Wake Lock（できる端末だけ）。タブが裏にまわると演出（requestAnimationFrame）が止まるので、そのときは演出を飛ばして進める。
   ゲームの中身のコード（engine・data・戦闘の画面）は書きかえない。外から包む所は rr2-hooks の表（H17〜）で①に正式な口を頼む。 */
/* ●数は design 10-22（デザイン班 08:45・★虎雪 08:38）。差しかえはここだけ */
const FARM_RULE={logMul:0.125,softCap:150,overMul:0.1,resetHour:4,treeClear:0.25,/* ★design 10-22（11-20 10:22）：150 をこえたら ×0.1・止まらない */
  ticket:{drop:0.08,max:5,kinds:["discount","partPick","money","cardPick"]},
  dig:{drop:0.013,nightAdd:0.001,ceil:60},speed:4};
const FARM_TICKET_JP={discount:"割引チケット",partPick:"パーツカタログ",money:"暖機運転",cardPick:"作戦メモ"};/* v0.5.19 text 33-2 */
const FARM={on:false,stopEnd:false,stopLose:false,n:0,limit:0,log:0,cfg:null,t:0,last:"",lastT:0,wl:null,ending:false,
  sum:{clear:0,lose:0,pts:0,tix:[],dig:[]},snap:null,feed:[],runGot:[]};
window.FARM=FARM;

/* ---------- 入れ物（スロットごと・profile.farm）：今日のログ・整備チケット・ディグの天井 ----------
   profile.farm={day:"2026-11-20",dayLog:0,tickets:["discount",…],dig:{YUKI:ランの数,…}}。引き継ぎコードに入る（チケットは持ち物なので）。 */
function farmDayKey(){const d=new Date(Date.now()-FARM_RULE.resetHour*3600e3),z=n=>String(n).padStart(2,"0");return`${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`}
function farmData(){const p=PRF();let f=p.farm;if(!f||typeof f!=="object")f=p.farm={};if(!Array.isArray(f.tickets))f.tickets=[];if(!f.dig||typeof f.dig!=="object")f.dig={};
  const k=farmDayKey();if(f.day!==k){f.day=k;f.dayLog=0}f.dayLog=+f.dayLog||0;return f}
window.farmData=farmData;
function farmTodayLeft(){return Math.max(0,FARM_RULE.softCap-farmData().dayLog)}
function farmOver(){return farmData().dayLog>=FARM_RULE.softCap}
window.farmOver=farmOver;

/* ---------- 決まり（10-22-2：ログ 1/8・1日 150、ポイントは全クリアで 25%、解放・★・ストーリー・図鑑の「見た」・ミニカーはなし）---------- */
if(typeof runLog==="function"){const f=runLog;window.runLog=function(){const r=f.apply(this,arguments);
  if(FARM.on&&r&&typeof r.total==="number"){const d=farmData(),base=Math.floor(r.total*FARM_RULE.logMul),left=Math.max(0,FARM_RULE.softCap-d.dayLog),within=Math.min(base,left),v=within+Math.floor((base-within)*FARM_RULE.overMul);/* 150 までは 1/8、こえた分はさらに ×0.1 */r.farmFull=r.total;r.total=v;d.dayLog+=v}return r}}
/* ランの終わり：ラン前の profile にもどす（解放・夜・★・見た場面・届けた数・sCount など）。残すのは ログ・記録・統計・profile.farm と、周回の得（ポイント・チケット・ディグ） */
const FARM_KEEP=["log","runlog","stats","farm","tree"];
if(typeof runEnd==="function"){const f=runEnd;window.runEnd=function(clear,rank){
  if(!FARM.on||!FARM.snap)return f.apply(this,arguments);
  const p=PRF(),log0=p.log||0,tree0=JSON.stringify(FARM.snap.tree||{});const r=f.apply(this,arguments);const add=(p.log||0)-log0;
  const keep={};FARM_KEEP.forEach(k=>keep[k]=p[k]);const base=JSON.parse(JSON.stringify(FARM.snap));
  Object.keys(p).forEach(k=>{if(!FARM_KEEP.includes(k)&&!(k in base))delete p[k]});Object.keys(base).forEach(k=>{if(!FARM_KEEP.includes(k))p[k]=base[k]});
  p.tree=JSON.parse(tree0);/* 型のポイントはラン前にもどしてから、全クリアのとき 25% で1点 */
  if(clear&&TREE[G.char]&&Math.random()<FARM_RULE.treeClear){treeData(G.char).pts=(treeData(G.char).pts||0)+1;FARM.sum.pts++;farmFeed("型のポイント +1","gold")}
  p.log=log0+add;S.runGot=[];S.joinQ=[];
  farmDigCeil();/* 天井 */
  FARM.snap=JSON.parse(JSON.stringify(Object.assign({},p,{runlog:undefined})));SAVE.auto();return r}}
if(typeof clearMark==="function"){const f=clearMark;window.clearMark=function(){if(FARM.on)return;return f.apply(this,arguments)}}
/* 図鑑の「見た」は入れない（★10-22-2） */
if(window.RR2&&RR2.mark){const f=RR2.mark;RR2.mark=function(){if(FARM.on)return;return f.apply(this,arguments)}}

/* ---------- 整備チケット（10-22-6）・ディグ（10-22-5）：エリアのボスを倒すたび ---------- */
function farmBossWin(key){const E=ENEMIES[key];if(!E||E.rank!=="boss"||E.ally)return;const d=farmData();
  if(d.tickets.length<FARM_RULE.ticket.max){if(Math.random()<FARM_RULE.ticket.drop){const k=FARM_RULE.ticket.kinds[Math.floor(Math.random()*FARM_RULE.ticket.kinds.length)];d.tickets.push(k);FARM.sum.tix.push(k);farmFeed("整備チケット："+FARM_TICKET_JP[k],"gold")}}
  else if(!FARM.fullTold){FARM.fullTold=1;farmFeed((TEXT.ui&&TEXT.ui.ticket_full)||"チケットがいっぱい（5枚まで）","dim")/* v0.5.19 text 33-2 */}
  const pr=FARM_RULE.dig.drop+FARM_RULE.dig.nightAdd*Math.max(0,(G.night||1)-1);if(Math.random()<pr)farmDigGet()}
/* フルオートでだけ見つかるカード：data の DIG_CARDS[キャラ]（デザイン班が cards.js に足す）か、CARDS の dig:1 */
function farmDigPool(ch){const L=(window.DIG_CARDS&&DIG_CARDS[ch])||Object.keys(CARDS).filter(id=>CARDS[id].dig&&(CARDS[id].own===ch||CARDS[id].own==="N"));const u=PRF().unlock;return L.filter(id=>CARDS[id]&&!(u.cards||[]).includes(id))}
function farmDigGet(){const ch=G.char,L=farmDigPool(ch);const d=farmData();d.dig[ch]=0;if(!L.length)return;const id=L[Math.floor(Math.random()*L.length)];
  const add=()=>{const u=PRF().unlock;u.cards=u.cards||[];if(!u.cards.includes(id))u.cards.push(id)};add();if(FARM.snap){FARM.snap.unlock=FARM.snap.unlock||{};FARM.snap.unlock.cards=(FARM.snap.unlock.cards||[]).concat([id])}
  FARM.sum.dig.push(id);farmFeed(((TEXT.ui&&TEXT.ui.dig_log)||"★ {card}を、見つけた！").replace("{card}",CARDS[id].n),"dig");
  try{const k="rr_dig_title",L=JSON.parse(localStorage.getItem(k)||"[]");if(!L.includes(id))L.push(id);localStorage.setItem(k,JSON.stringify(L))}catch(e){}/* v0.5.22 次のタイトルで1回（text 41 dig_title） */
  SAVE.auto()}
function farmDigCeil(){const ch=G.char,d=farmData();d.dig[ch]=(+d.dig[ch]||0)+1;if(d.dig[ch]>=FARM_RULE.dig.ceil)farmDigGet()}
RRHOOK.on("battle_win",o=>{if(FARM.on){farmBossWin(o.key);if(ENEMIES[o.key])farmFeed(`${ENEMIES[o.key].n} に勝った`,"win")}});
RRHOOK.on("battle_start",o=>{if(FARM.on&&ENEMIES[o.key])farmFeed(`${G?`エリア${G.map[Math.min(G.row,G.map.length-1)][0].a+1} `:""}${o.hidden?"裏道の":""}${ENEMIES[o.key].n}`,"head")});
/* 流れる記録（縦の画面の④）。1行＝{t,c,at} 最新 200 行 */
function farmFeed(t,c){FARM.feed.push({t,c:c||"",at:Date.now()});if(FARM.feed.length>200)FARM.feed.splice(0,FARM.feed.length-200);if(typeof farmUiFeed==="function")farmUiFeed()}
window.farmFeed=farmFeed;

/* ---------- 判断 ---------- */
const FARM_TUNE=["ecu","engine","light","tire","shift"];/* QA ボットの TUNE_PREF */
/* マス：耐久が少なければ休憩、お金があればショップ、強化できればシム。エリートは耐久に余裕があるときだけ。裏道はカードが開くので余裕があれば */
function farmNode(){const r=G.map[G.row],hp=G.hp/G.maxhp;let bi=0,bv=-1e9;
  r.forEach((n,j)=>{let v=0;const k=n.k;
    if(k==="garage")v=hp<0.5?90:hp<0.75?35:5;
    else if(k==="shop")v=G.money>=60?60:G.money>=35?30:4;
    else if(k==="sim")v=(upgradeTargets().length||fuseOptions().length)?45:3;
    else if(k==="lucky")v=55;
    else if(k==="battle")v=hp>0.35?40:20;
    else if(k==="elite")v=hp>0.7?50:hp>0.5?25:-20;
    else if(k==="hidden")v=hp>0.6?58:-10;
    else if(k==="boss")v=10;
    if(v>bv){bv=v;bi=j}});return bi}
/* カード：デッキの役割（アタック・ガード・ドローと回転操作・デバフ）の足りない所を補う。レア度・自分の専用・強化できるかを少し足す */
const FARM_ROLE={atk:"atk",grd:"grd",drw:"util",rev:"util",dbf:"dbf",sk:"sk"};
const FARM_TARGET={atk:0.5,grd:0.25,util:0.2,dbf:0.05};
function farmRoles(){const c={atk:0,grd:0,util:0,dbf:0,sk:0},L=G.deck.filter(x=>!CD(x).gen&&CD(x).t!=="jam");L.forEach(x=>{const r=FARM_ROLE[CD(x).t]||"util";c[r]++});return{c,n:Math.max(1,L.length)}}
function farmCardScore(id){const d=CARDS[id];if(!d||d.t==="jam")return -99;const{c,n}=farmRoles(),r=FARM_ROLE[d.t]||"util";
  const def=FARM_TARGET[r]!=null?FARM_TARGET[r]-c[r]/n:0;let s=({C:1,R:2,E:3,SK:3})[d.r]||1;s+=def*12;if(d.own===G.char)s+=1;if(r==="sk")s+=1.5;
  if(G.char==="YUKI"&&typeof BOT!=="undefined"&&BOT.CARD_PREF){const k=BOT.CARD_PREF.indexOf(id);if(k>=0)s+=Math.max(0,2-k*0.1)}
  s+=farmRotFuseBonus(id);return s}
/* v0.5.15 design 24-4 E14：遊ぶ人に近く。①ローテーション（rotate のカード）はデッキに1枚もなければ取る（2枚目からは取りにくく）
   ②合成の材料（FUSE の相手がもうデッキにある）は少し取りやすく ③シムでは合成を強化より先に（いちばんよい合成） */
const FARM_RF={rot0:2.5,rotMore:-2,fusePair:0};/* v0.5.16 合成の材料の取りやすさは外した（design 24-7 の測り：+1.5 だと N1 全クリア −19） */
function farmHasRot(id){const d=CARDS[id];return!!(d&&(d.fx||[]).some(f=>f[0]==="rotate"))}
function farmRotFuseBonus(id){let s=0;const L=G.deck.filter(x=>!CD(x).gen);
  if(farmHasRot(id))s+=L.some(x=>farmHasRot(x.id))?FARM_RF.rotMore:FARM_RF.rot0;
  if(typeof FUSE!=="undefined"){const has=k=>L.some(x=>x.id===k),made=f=>L.some(x=>x.id===f.id);if(FUSE.some(f=>CARDS[f.id]&&!made(f)&&((f.a===id&&has(f.b))||(f.b===id&&has(f.a)))))s+=FARM_RF.fusePair}
  return s}
function farmFuseBest(fo){let b=null,bv=-1e9;fo.forEach(o=>{const v=(({C:1,R:2,E:3,SK:3})[(CARDS[o.id]||{}).r]||2)+(o.up?1:0);if(v>bv){bv=v;b=o}});return b}
function farmReward(opts){if(!opts||!opts.length)return null;const deckN=G.deck.length;
  {const r=opts.find(farmHasRot);if(r&&deckN<28&&!G.deck.some(x=>!CD(x).gen&&farmHasRot(x.id)))return r}/* v0.5.15 E14：ローテーションがなければ必ず取る（遊ぶ人の形） */
  let b=null,bv=-1e9;opts.forEach(id=>{const v=farmCardScore(id);if(v>bv){bv=v;b=id}});
  if(deckN>=22&&bv<3.5||deckN>=28&&bv<5)return null;/* デッキが大きくなりすぎたら、よいカードだけ（QA ボットはいつも取るので 35 枚まで太っていた） */return b}
/* パーツ：その子の専用 > 共通。持っているパーツでいちばん低いものと比べて、上なら入れ替え（外す方は売る） */
function farmPartScore(p){const d=PARTS[p];if(!d)return 0;let s=1;if(d.own===G.char)s+=2;else if(d.own!=="N")s-=1;if(p==="forged"&&(G.night||0)<3)s-=1;return s}
function farmTakePart(p){if(!p)return false;
  if(G.parts.length<RULES.partsMax){addPart(p,-1);SND.se("part_get");farmFeed("パーツ："+PARTS[p].n+" を付けた","gold");return true}
  let wi=-1,wv=1e9;G.parts.forEach((q,i)=>{const v=farmPartScore(q)-(isMcPart(q)?0.5:0);if(v<wv){wv=v;wi=i}});
  if(wi<0||farmPartScore(p)<=wv)return false;
  const q=G.parts[wi],v=sellPrice(q);if(isMcPart(q))removePartAt(wi);else sellPart(q,wi);addPart(p,-1);SND.se("part_swap");farmFeed(`パーツ：${PARTS[p].n} を付けた（${PARTS[q].n} を${v?`売った +${v}`:"外した"}）`,"gold");return true}
function farmShop(){const n=S.shop;if(!n)return;
  for(let guard=0;guard<12;guard++){let did=false;for(const k of FARM_TUNE){const pr=tunePrice(k,n,false);if(pr!=null&&G.money>=pr+15){if(buyTune(k,pr,false)){did=true;SND.se("shop_buy");farmFeed(`チューン：${TUNE[k][0]} Lv${G.tune[k]}（−${pr}）`,"gold")}}}if(!did)break}
  if(n.feat&&n.featPart&&!n.featBought){const pr=shopPrice(typeof featCost==="function"?featCost():RULES.featPrice,n,false);/* v0.5.12 design 23-2：ヒートの値段をふつうのランとそろえる（featCost・①v0.22.131） */
    if(G.money>=pr&&(G.parts.length<RULES.partsMax||farmPartScore(n.featPart)>Math.min(...G.parts.map(farmPartScore)))){
      if(G.parts.length>=RULES.partsMax){let wi=0,wv=1e9;G.parts.forEach((q,i)=>{const v=farmPartScore(q);if(v<wv){wv=v;wi=i}});const q=G.parts[wi];if(isMcPart(q))removePartAt(wi);else sellPart(q,wi)}
      if(buyFeat(n,pr,false,-1))farmFeed(`目玉商品：${PARTS[n.featPart].n}（−${pr}）`,"gold")}}
  S.useTicket=false}
function farmSim(){const fo=fuseOptions();const t=upgradeTargets();
  {const fu=t.length?fo.filter(o=>o.up):fo;if(fu.length){const o=farmFuseBest(fu);farmFeed("合成："+(CARDS[o.id]||{}).n,"gold");uiFuse(o.id);return}}/* v0.5.17 design 24-9（C＋B）：合成は、材料が2枚とも強化ずみ、または強化する候補がもうないとき */
  if(t.length){let bi=t[0],bv=-1e9;t.forEach(i=>{const c=G.deck[i],d=CD(c);let v=farmCardScore(c.id)+(d.t==="atk"?1:0);if(G.char==="YUKI"&&typeof BOT!=="undefined"&&BOT.UP_PREF){const k=BOT.UP_PREF.indexOf(c.id);if(k>=0)v+=3-k*0.2}if(v>bv){bv=v;bi=i}});farmFeed("強化："+CD(G.deck[bi]).n+"+","gold");uiUpgrade(bi);return}
  S.simSel=null;S.simTab=null;nextRow()}

/* ---------- 1歩（画面を見て、画面の関数を押す）---------- */
function farmStep(){if(!FARM.on)return;
  if(S.optsOpen)return;/* 設定を開いている間は止まる */
  if(document.hidden&&typeof busy==="function"&&busy())try{flushAnim()}catch(e){}/* 裏にまわると演出が進まない */
  if(window.TUTORIAL_ON){try{closeModal();tutFinish()}catch(e){}return}
  const sc=window.SCREEN,now=Date.now();
  if(sc+"|"+(G&&G.row)+"|"+(B&&B.turn)+"|"+(B&&B.e&&B.e.hp)!==FARM.last){FARM.last=sc+"|"+(G&&G.row)+"|"+(B&&B.turn)+"|"+(B&&B.e&&B.e.hp);FARM.lastT=now}
  else if(now-FARM.lastT>90000){farmStop(true,"同じ画面のまま止まったので、周回を止めました");return}
  if(now-FARM.t<Math.round(400/FARM_RULE.speed))return;FARM.t=now;
  const md=document.querySelector("#modal .modal");
  if(md&&sc!=="battle"){closeModal()}/* 知らせの小窓などは閉じる（戦闘の中の小窓はオートが扱う） */
  if(G&&G._rr2&&!G._rr2.farm)G._rr2.farm=1;
  switch(sc){
    case"scene":sceneSkip();return;
    case"map":enterNode(farmNode());return;
    case"battle":if(!B)return;if(!AUTO.on){AUTO.on=true;AUTO.t=0}AUTO.speed=FARM_RULE.speed;if(B.over&&!busy())uiSkip();else if(md&&!busy())closeModal();return;
    case"win":{const id=S.win&&S.win.rank==="hidden"?null:farmReward(S.rewards);if(id)farmFeed("カード："+CARDS[id].n+" をデッキに","gold");takeCard(id);return}
    case"parts":{let b=null,bv=-1e9;(S.partOpts||[]).forEach(p=>{const v=farmPartScore(p);if(v>bv){bv=v;b=p}});farmTakePart(b);closeModal();S.pdone();return}
    case"shop":farmShop();nextRow();return;
    case"sim":farmSim();return;
    case"rest":{const x=restAmount();G.hp=Math.min(G.maxhp,G.hp+x);farmFeed(`休憩：耐久 +${x}`,"");nextRow();return}
    case"result":farmRunDone();return;
    case"release":S.relSel=0;releaseMinicar();return;
    case"title":if(!FARM.ending)farmStop(false);return;
  }}
setInterval(farmStep,50);

/* ---------- ランの終わり → 次のラン ---------- */
function farmRunDone(){if(FARM.ending)return;FARM.ending=true;FARM.n++;const lg=+S.runEndLog||0;FARM.log+=lg;const clear=!!(S.res&&S.res.clear!==false&&B&&B.result!=="dead"&&!(G.hp<=0));
  const win=!!FARM.lastClear;FARM.lastClear=false;if(win)FARM.sum.clear++;else FARM.sum.lose++;
  farmFeed(`${win?"全クリア":"負け"}・ランク ${S.res?S.res.rank:"－"}・ログ +${lg}${farmOver()?"（今日の上限をこえました：ログ ×"+FARM_RULE.overMul+"）":""}`,win?"win":"lose");SAVE.auto();
  const more=FARM.on&&!FARM.stopEnd&&!(FARM.stopLose&&!win)&&(!FARM.limit||FARM.n<FARM.limit);
  setTimeout(()=>{S.joinQ=[];S.runGot=null;
    if(more){const c=FARM.cfg;FARM.ending=false;FARM.lastT=Date.now();FARM.snap=JSON.parse(JSON.stringify(Object.assign({},PRF(),{runlog:undefined})));newRun(c.mode,c.bring);farmBar()}
    else{farmStop(false);if(typeof farmUiResult==="function")farmUiResult();else{showTitle();modal(`<div class="h">フルオート周回 おわり</div><div class="small">${FARM.n}回・ログ +${FARM.log}</div><div class="row"><button class="main" onclick="closeModal();showTitle()">OK</button></div>`)}}},
    document.hidden?50:1200)}

/* ---------- 始める・止める ---------- */
function farmStart(cfg,limit,stopLose){Object.assign(FARM,{on:true,stopEnd:false,stopLose:!!stopLose,n:0,limit:limit||0,log:0,cfg,t:0,last:"",lastT:Date.now(),ending:false,spd0:AUTO.speed,t0:Date.now(),fullTold:0,sum:{clear:0,lose:0,pts:0,tix:[],dig:[]},feed:[]});
  FARM.snap=JSON.parse(JSON.stringify(Object.assign({},PRF(),{runlog:undefined})));
  AUTO.speed=FARM_RULE.speed;farmWake(true);farmBar();try{window.AUDIO&&AUDIO.farmMode&&AUDIO.farmMode(true)}catch(e){}/* ★①v0.22.80 サウンド班 頼み⑩ A：周回の間は farm の曲だけ */}
function farmStop(now,msg){const was=FARM.on;try{if(window.AUDIO&&AUDIO.farmMode){AUDIO.farmMode(false);setTimeout(()=>{try{if(!FARM.on)SND.bgm(window.SCREEN==='title'?'title':'result')}catch(e){}},700)}}catch(e){}/* ★①v0.22.80 周回の終わり：もとの曲へ */FARM.on=false;FARM.stopEnd=false;FARM.ending=false;AUTO.on=false;if(FARM.spd0)AUTO.speed=FARM.spd0;farmWake(false);farmBar();
  if(now&&was){try{flushAnim();SND.engineStop()}catch(e){}showTitle();toast2(msg||"周回を止めました（ランはオートセーブに残っています＝つづきから）")}}
function farmStopAsk(){S.farmAskWas=AUTO.on;modal(`<div class="h">フルオート周回を止めますか？</div><div class="small">周回 ${FARM.n+1}回目を走っています。</div>
  <div class="row"><button class="main" onclick="FARM.stopEnd=true;closeModal();farmBar()">このランの終わりで</button><button class="warn" onclick="closeModal();farmStop(true)">すぐ止める</button><button onclick="closeModal()">つづける</button></div>`)}
/* 画面が消えないように（できる端末だけ。タブが表にもどったらもう一度） */
async function farmWake(on){try{if(on){if("wakeLock"in navigator&&!FARM.wl){FARM.wl=await navigator.wakeLock.request("screen");FARM.wl.addEventListener("release",()=>{FARM.wl=null})}}else if(FARM.wl){await FARM.wl.release();FARM.wl=null}}catch(e){FARM.wl=null}}
document.addEventListener("visibilitychange",()=>{if(FARM.on&&!document.hidden)farmWake(true)});

/* ---------- 画面：上の帯（周回 n回目・合計ログ・止める）---------- */
function farmBar(){let b=$("#farmbar");if(!FARM.on){if(b)b.remove();return}
  if(!b){b=document.createElement("div");b.id="farmbar";$("#stage").appendChild(b)}
  b.innerHTML=`<span class="fb1">周回 <b>${FARM.n+1}</b>${FARM.limit?`／${FARM.limit}`:""}回目</span><span class="fb2">ログ +${FARM.log}</span>${FARM.stopEnd?`<span class="fb3">このランで止まる</span>`:""}<button class="u9 fbstop" onclick="farmStopAsk()">止める</button>`}
setInterval(()=>{if(FARM.on)farmBar()},1000);

/* ---------- 選べるもの（★虎雪 08:32：「自分で走る」で全クリアしたキャラ × 夜だけ。MT／AT はどちらでクリアしていても可＝仮）---------- */
/* v0.5.31 BUG-73：MIO（CVT）・KURO（BIKE）のクリアも見る。走りかたはそのキャラのもの（csModes） */
function farmModes(ch){try{if(typeof csModes==="function")return csModes(ch)}catch(e){}return["MT","AT"]}
function farmCleared(ch,n){if(!n)return false;return["MT","AT","CVT","BIKE"].some(m=>typeof clearedNight==="function"&&clearedNight(ch,m,n))}
function farmNights(ch){const L=[];for(let n=1;n<=NIGHTS.length;n++)if(farmCleared(ch,n))L.push(n);return L}
function farmChars(){return(typeof charsOpen==="function"?charsOpen():["YUKI"]).filter(ch=>farmNights(ch).length)}
function farmAvailable(){return farmChars().length>0}
/* 始める：{char,night,mode,bring,limit}。キャラ・夜は今のスロットの選びに書く（自分で走るときの初期値と同じ所） */
function farmGo(o){if(!farmCleared(o.char,o.night)){toast2("自分で走ってクリアすると選べます");return false}
  const p=PRF();p.char=o.char;p.night=o.night;SAVE.auto();
  const ms=farmModes(o.char);if(!ms.includes(o.mode))o.mode=ms[0];
  farmStart({mode:o.mode||"MT",bring:(o.bring||[]).slice()},o.limit>0?o.limit:0,o.stopLose);newRun(FARM.cfg.mode,FARM.cfg.bring);return true}
window.farmGo=farmGo;window.farmModes=farmModes;window.farmAvailable=farmAvailable;window.farmChars=farmChars;window.farmNights=farmNights;
/* v0.5.31：v0.5.28 のオートの止まりの手当ては外した（①が v0.22.203 で bot_idle を bot.js・qa/policy.js に入れた） */
