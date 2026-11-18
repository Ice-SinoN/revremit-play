"use strict";
/* ===== 画面（v0.9.1）：原寸（RES：480×270／640×360）を整数倍で表示 =====
   計算は engine.js、絵とモーションは pixel.js・anim.js。ここは DOM の文字・ボタンと、押されたら engine を呼ぶだけ。
   window.SCREEN に今の画面の名前（ボットが見る）。座標はすべて原寸のドット。
   戦闘の配置は data/screen.js の RES から読む。戦闘以外の画面は 480×270 で作ってあるので、640 のときは真ん中（RES.inner）に置く。 */
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const GAME_TITLE="Rev:Remit";
const VERSION="試作 v0.22.12（β2）";
document.title=GAME_TITLE+" "+VERSION;
const S={sel:-1};
/* ★各画面の背景（bg\c2 の 640×360）。戦闘・マップ・会話はそれぞれで描く */
const SCREEN_BG={title:"title",deck:"garage",garage:"garage",release:"result",win:"reward",parts:"reward",shop:"shop",sim:"sim",rest:"garage",result:"result"};
function setBg(k){A.bgImg=k&&window.IMG?IMG[`assets/c2/bg/c2/revremit_bg_${k}_base.png`]||IMG[`assets/c2/fx/c2/revremit_fx_bg_${k}.png`]||null:null}
function setScreen(n){window.SCREEN=n;placeUI(n);if(n!=="battle")SND.engineStop();setBg(SCREEN_BG[n])}
const ui=()=>$("#ui");
/* 戦闘は画面いっぱい、それ以外は 480×270 の箱を真ん中に（640 のとき） */
const FULL_SCREENS=["battle","map","scene","title","data","lab","shop","sim","win","parts","deck","garage","rest","result","release"];// ★v0.15：ショップ・シム・報酬・パーツは背景の絵に合わせて 640 いっぱい
function placeUI(n){const u=$("#ui");if(!u)return;const full=FULL_SCREENS.includes(n);
  u.style.left=(full?0:RES.inner[0])+"px";u.style.top=(full?0:RES.inner[1])+"px";u.style.width=(full?RES.W:480)+"px";u.style.height=(full?RES.H:270)+"px";u.classList.toggle("panel",!full)}
/* ★アイテム・パーツのアイコン（items\c2・64×64） */
const ITEM_ART=k=>`assets/c2/items/c2/revremit_item_${k}.png`;
function itemIcon(k,size,cls){const p=ITEM_ART(k);return artHave(p)?`<img class="px ic ${cls||""}" src="${artURL(p)}" style="width:${size}px;height:${size}px" alt="">`:""}
const partIcon=(p,size)=>itemIcon("part_"+p,size||64);

/* ---- 整数倍で表示（あまりは黒の帯）。端末の画素で整数倍にする（スマホの横 844×390 → 4倍の画素＝CSS では 1.33） ---- */
/* ★v0.18.3：ホーム画面から全画面で開いたとき、切り欠き・角の丸み・ホームバーの所（safe area）をよけて置く */
function safeArea(){let p=$("#safep");if(!p){p=document.createElement("div");p.id="safep";p.style.cssText="position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)";document.body.appendChild(p)}
  const c=getComputedStyle(p),n=v=>parseFloat(v)||0;return{t:n(c.paddingTop),r:n(c.paddingRight),b:n(c.paddingBottom),l:n(c.paddingLeft)}}
function fit(){const st=$("#stage"),dpr=window.devicePixelRatio||1,SA=safeArea(),W=innerWidth-SA.l-SA.r,H=innerHeight-SA.t-SA.b,RW=RES.W,RH=RES.H;
  st.style.width=RW+"px";st.style.height=RH+"px";const cv=$("#cv");if(cv.width!==RW){cv.width=RW;cv.height=RH;if(A.g)A.g.imageSmoothingEnabled=false}
  const k=Math.floor(Math.min(W*dpr/RW,H*dpr/RH));const s=k>=1?k/dpr:Math.min(W/RW,H/RH);
  st.style.transform=`scale(${s})`;st.style.left=Math.round(SA.l+(W-RW*s)/2)+"px";st.style.top=Math.round(SA.t+(H-RH*s)/2)+"px";
  window.FIT={k,s,dpr,SA};$("#rot").style.display=H>W*1.1?"flex":"none"}
addEventListener("resize",fit);addEventListener("orientationchange",()=>setTimeout(fit,300));

const TYPE_K={atk:"攻",grd:"守",dbf:"弱",drw:"引",rev:"回",sk:"技"};
const NODE_JP={battle:"戦闘",shop:"ショップ",sim:"シム",lucky:"ラッキー",elite:"エリート",garage:"ガレージ",boss:"ボス",hidden:"裏道"};
const AREA_BG={street:"street",touge:"pass",circuit:"circuit"};
/* マスのアイコン（map\\c2・40×40・on／off／done）。目玉商品のショップは feature */
const MAP_ICON=(k,st)=>`assets/c2/map/c2/revremit_map_icon_${k==="shopF"?"feature":k}_${st}.png`;
const NODE_ICON={battle:"⚔",shop:"✦",sim:"▣",lucky:"★",elite:"◆",garage:"⌂",boss:"♛",hidden:"？"};
const partName=p=>PARTS[p].n+(PARTS[p].own!=="N"?`（${PARTS[p].own}）`:"");
const at=(x,y,w,h)=>`style="left:${x}px;top:${y}px;${w!=null?`width:${w}px;`:""}${h!=null?`height:${h}px;`:""}"`;

/* カード（手札 62×88・★C2 v2 の規格）。絵の窓 50×38（グラフィック班の cards\c2 があれば絵、なければ種類の色と字）。
   左上＝回転、右上＝ガソリン（目盛りの数）、窓の下＝★今打ったときのダメージ・防御（14:47）、いちばん下＝名前。帯（L/M/R）は窓の左下、打ちごろなら枠が光る */
const CARD_ART=id=>`assets/c2/cards/c2/revremit_card_art_c2_${id}_50x38.png`;
function cardArtTag(id){const p=CARD_ART(id);return window.ART_HAVE&&ART_HAVE.has(p)?`<img class="px" src="${(window.ART_EMBED&&ART_EMBED[p])||p}" alt="">`:""}
const CARD_ICON=k=>`assets/c2/ui/c2/revremit_ui_card_icon_${k}.png`;
const costK=v=>v>=1000?(Math.round(v/100)/10)+"k":String(v);
function cardSmall(c,o){const d=CD(c),r=rarityOf(c),nm=o.num,art=cardArtTag(c.id);
  // ★ui\c2\revremit_ui_card_c2.json：絵の窓 (6,15) 50×38、数字の板は右下（右 56・下 53・高さ 14）に種類の色のアイコン＋数字
  let plate="";if(nm){const ic=CARD_ICON(nm.kind==="blk"?"grd":"atk"),icon=artHave(ic)?`<i class="pi" style="-webkit-mask-image:url(${artURL(ic)});mask-image:url(${artURL(ic)})"></i>`:"";
    plate=`<span class="cv ${nm.cls}">${icon}${esc(nm.txt)}</span>`}
  return `<button class="cs t-${d.t} r-${r}${o.band?" inb":""}${d.charge?" chg":""}${o.cls?" "+o.cls:""}" ${o.attrs||""}>`+
   `<span class="cw">${art||`<span class="ck">${TYPE_K[d.t]}</span>`}</span>`+
   `<span class="cc">${costK(o.cost)}</span><span class="ca${o.gas>(o.gasNow==null?99:o.gasNow)?" lack":""}">G${o.gas}</span>`+plate+
   `<span class="cn">${esc(d.n)}${c.up?'<b class="cu">+</b>':""}</span>${d.band?`<span class="cbd b-${d.band}">${d.band}</span>`:""}<span class="crr"></span></button>`}
/* ---- カードの面の数字（★14:47）：今打ったときのダメージ（多段は 6×2）・ガードは防御。元の数字より上は緑・下は赤 ---- */
function numText(hits,block){if(hits.length){const all=hits.every(h=>h===hits[0]);return hits.length>1&&all?`${hits[0]}×${hits.length}`:String(hits.reduce((a,b)=>a+b,0))}return block?String(block):""}
function faceNumber(i,shift){const c=B.hand[i],d=CD(c),base=baseNumbers(c);if(!base.hits.length&&!base.block)return null;
  const atkKind=base.hits.length&&d.num!=="blk";
  const sim=simulateCard(i,shift);const bsum=atkKind?base.hits.reduce((a,b)=>a+b,0):base.block;
  if(!sim)return{txt:atkKind?numText(base.hits,0):String(base.block),cls:"na",sum:bsum,kind:atkKind?"atk":"blk"};
  const hits=atkKind?sim.hits:[],block=atkKind?0:sim.block;const sum=atkKind?hits.reduce((a,b)=>a+b,0):block;
  const txt=atkKind?(d.num==="sum"?String(sum):numText(hits,0)):String(block);
  return{txt:txt||"0",cls:sum>bsum?"upv":sum<bsum?"dnv":"eq",sum,win:sim.win,kind:atkKind?"atk":"blk",sim}}
/* カード（大きい：報酬・強化・リザルト 110×80） */
function cardBig(c,o){o=o||{};const d=CD(c),r=rarityOf(c),up=o.up!=null?o.up:!!c.up;
  const cost=d.costGear?`${d.costGear[0]}〜${d.costGear[2]}`:baseCost(c,up,0);
  const art=o.art?cardArtTag(c.id||c):"";
  return `<button class="cb t-${d.t} r-${r}${o.cls?" "+o.cls:""}" ${o.attrs||""}>${o.art?`<span class="bw">${art||`<span class="ck">${TYPE_K[d.t]}</span>`}</span>`:""}<span class="bn">${esc(d.n)}${up?"+":""}</span>`+
   `<span class="bt">${TYPE_JP[d.t]}・${RARITY_JP[r]}</span><span class="bc">${o.art?`回転 ${cost}　G${up&&d.gasu!=null?d.gasu:d.gas}${d.band?`　帯${d.band}`:""}`:`回転 ${cost}　ガソリン ${up&&d.gasu!=null?d.gasu:d.gas}${d.band?`　帯 ${d.band}`:""}`}</span><span class="bd">${esc(o.desc||descOf(c,up,0))}</span></button>`}

/* ---- タイトル ---- */
/* ★タイトルロゴ（虎雪 13:06：Remit の R を左右反転した Я で赤）。グラフィック班の絵（ファイル名に logo）が assets/c2/ にあればそれ、なければ文字で */
function titleLogo(){const f=window.ART_HAVE?[...ART_HAVE].filter(p=>/\/revremit_[^/]*logo[^/]*\.png$/i.test(p)&&!/_review\//.test(p)).sort((a,b)=>a.length-b.length)[0]:null;
  if(f)return `<img class="px tlogo" src="${artURL(f)}" alt="${esc(GAME_TITLE)}">`;
  return `<div class="t2">${esc(GAME_TITLE).replace(/:R/,':<span class="rr">R</span>')}</div>`}
function showTitle(){
  setScreen("title");setScene("dim");closeModal();SND.bgm("title");
  const ch=curChar(),mc=loadMinicars(),dk=loadDeck(ch);
  ui().innerHTML=`<div class="logo" ${at(0,6,640)}><div class="t1">.50 CAL GARAGE &amp; BAR</div>${titleLogo()}<div class="t3">${esc(VERSION)}・${esc(TEXT.names[ch]||ch)}・3エリア</div></div>
  <div class="col" ${at(230,140,180)}>
   ${loadRun()?`<button class="main" onclick="continueRun()">つづきから<br><span class="small">${esc(runLabel(loadRun()))}</span></button>`:""}
   <button class="${loadRun()?"":"main"}" onclick="showMinicarGarage('MT')">MT ではしる</button>
   <button onclick="showMinicarGarage('AT')">AT ではしる</button>
   <button onclick="showDeck()">デッキを組む（${deckCount(dk)}枚）</button>
   <button onclick="startTutorial(showTitle)">あそびかた（練習）</button>
   <button onclick="SND.toggle();showTitle()">音：${SND.on?"あり":"なし"}</button></div>
  <button class="mini dataBtn" ${at(8,8,132,28)} onclick="showData()">データ：スロット${SAVE.slot}</button>
  ${nightMaxAvail()>1?`<button class="mini nightBtn" ${at(8,40,132,28)} onclick="pickNight()">夜：NIGHT ${curNight()} ▼</button>`:""}
  ${charsOpen().length>1?`<button class="mini charBtn" ${at(8,72,132,28)} onclick="showChars()">キャラ：${esc(TEXT.names[ch]||ch)} ▼</button>`:""}
  ${labOpen()?`<button class="mini labBtn" ${at(8,charsOpen().length>1?104:72,132,28)} onclick="showLab()">みおのラボ（ログ ${SAVE.cur.profile.log}）</button>`:""}
  ${FS_OK()?`<button class="mini fsb" ${at(552,8,80,28)} onclick="toggleFS()">${isFS()?"全画面をやめる":"全画面"}</button>`:""}
  <button class="mini" ${at(552,326,80,16)} onclick="showHowto()">ルール一覧</button><div class="small dim tinfo" ${at(8,344,200)}>ミニカー ${mc.length}/${MINICAR_MAX}台</div>`;
}
/* ===== ★v0.20 データ（3スロット＋オートセーブ）。tech-notes 1-10 ===== */
function dataName(k){return k==="auto"?"オートセーブ":"スロット"+k}
/* ★v0.22 データ：1スロット＝1人の進み具合（遊ぶと自動でそのスロットに書く）。オートセーブはスロットごと（BUG-28 案①：遊んだぶんは今のスロットに残る） */
function showData(){setScreen("data");setScene("dim");setBg("garage");closeModal();SND.bgm("title");const L=SAVE.list();
  ui().innerHTML=`<div class="hdr" ${at(40,22,300,18)}>データ</div>
  <div class="small dhint" ${at(352,24,170,24)}>あそぶと自動でセーブ。<br>オートセーブもスロットごと。</div>
  ${backBtn("もどる","showTitle()")}
  ${L.map((r,i)=>{const y=60+i*84,cur=SAVE.slot===r.k,nm=dataName(r.k);
    const sub=r.broken?"読めないデータ（消さずに、別の名前で取ってある）":SAVE.label(r.d);
    const note=r.d?(SAVE.when(r.d)+(r.d.newer?"・新しい版のデータ":"")):"";
    const an=r.auto?`オートセーブ ${SAVE.when(r.auto)}`:"オートセーブ なし",canR=!!r.auto&&(r.broken||!r.d||(r.auto.at||0)>(r.d.at||0));
    const b1=cur||r.broken?"":`<button class="u9 main sv" ${at(472,10,84,32)} onclick="dataUse(${r.k})">${r.d?"あそぶ":"はじめる"}</button>`;
    const b2=r.d||r.broken?`<button class="u9 ld" ${at(cur||r.broken?472:384,10,84,32)} onclick="dataErase(${r.k})">消す</button>`:"";
    const b3=canR?`<button class="u9 ld" ${at(384,44,172,28)} onclick="dataRestore(${r.k})">オートセーブからもどす</button>`:"";
    return `<div class="slot${cur?" cur":""}" ${at(40,y,560,78)}><div class="sn">${nm}${cur?'<span class="now">いまのデータ</span>':""}</div>
      <div class="ss">${esc(sub)}</div><div class="ss dim">${esc(note)}</div><div class="ss dim">${esc(an)}</div>${b1}${b2}${b3}</div>`}).join("")}`}
/* ★v0.22.6 音（audio-list 6-0）：あそぶ・はじめる・もどした＝load_ok、確認の小窓＝overwrite_warn、消した＝ui_cancel */
function dataUse(n){if(SAVE.use(n)){SND.se("load_ok");S.deck=null;S.mcSel=[];showTitle();toast2(`スロット${n}であそびます`)}else showData()}
function dataErase(n){SND.se("overwrite_warn");S.dataGo=()=>{SAVE.erase(n);SND.se("ui_cancel");closeModal();showData();toast2(`スロット${n}を消しました`)};
  modal(`<div class="h">スロット${n}を消しますか？</div><div class="small">ミニカー・解放・ログもいっしょに消えます。もとにはもどせません。</div>
  <div class="row"><button class="warn" onclick="S.dataGo()">消す</button><button onclick="closeModal()">やめる</button></div>`)}
function dataRestore(n){const r=SAVE.list().find(x=>x.k===n);if(!r||!r.auto)return;
  SND.se("overwrite_warn");S.dataGo=()=>{const k=SAVE.restore(n);SND.se("load_ok");closeModal();showTitle();toast2(`スロット${k}をオートセーブの状態にもどしました`)};
  modal(`<div class="h">スロット${n}をオートセーブの状態にもどしますか？</div><div class="small">${esc(SAVE.label(r.auto))}<br>${esc(SAVE.when(r.auto))}</div>
  <div class="row"><button class="main" onclick="S.dataGo()">もどす</button><button onclick="closeModal()">やめる</button></div>`)}
function showHowto(){const C=CHARS.YUKI.car;
  modal(`<div class="h">あそびかた</div><div class="scroll" style="height:180px">
  ・カードのコストは<b>回転数</b>。打つと回転が上がる。<br>
  ・打った回転が<b>シフトの帯</b>に入るなら、シフトアップして打てる。帯の芯で<b>パーフェクト</b>（倍率+0.3・1枚引く）、帯の中で<b>グッド</b>（+0.1）。<br>
  ・ギアが上がるほど倍率が上がる（1速 ×${C.mult[0]}〜${C.gears}速 ×${C.mult[C.gears-1]}）。シフトアップで<b>ガソリン</b>が1（パーフェクトは2）もどる。1ターン${RULES.shiftCap}回まで。<br>
  ・${C.red}〜${C.limit}回転は<b>レッドゾーン</b>（強いカードが打てる）。${C.limit}をこえると<b>オーバーレブ</b>。MT で${C.gears}速のままこえると<b>エンジンブロー（即死）</b>。<br>
  ・1ターンの<b>ガソリンは${RULES.gasMax}目盛り</b>。使い切ると<b>相手の番</b>。残すほど次の番が早い。<br>
  ・続けて打つほど<b>チェイン</b>で強くなる（1枚 +10%）。カードの<b>帯</b>（L・M・R）の回転で打つと ×1.5。<br>
  ・<b>雪崩</b>はガソリン10の大技。パーフェクト・チェイン5・レッドゾーンで打つ、のたびに1減る。<br>
  ・手札は<b>${RULES.hand0}枚</b>から。補充はドローのカード・パーフェクト・シフトダウン（AT はパーキングレンジ）だけ。<br>
  ・カードは1回タップで説明、もう1回で打つ。モーション中にタップすると飛ばせる。<br>
  ・デッキは${RULES.deckSize}枚。同じカードは コモン${RULES.deckLimit.C}・レア${RULES.deckLimit.R}・エピック${RULES.deckLimit.E}・固有スキル${RULES.deckLimit.SK}枚まで（ラン中にもらうカードは上限なし）。</div>
  <div class="row"><button class="main" onclick="closeModal()">とじる</button></div>`)}

/* ---- デッキを組む（上限 C4・R2・E1・SK1・20枚） ---- */
function showDeck(){SND.bgm("title");setScreen("deck");setScene("dim");S.deck=S.deck||loadDeck(curChar());renderDeck()}
/* ★v0.16：背景 garage。左の棚の前に一覧の窓、右の工具の壁の前に枚数とボタン（真ん中の車は見せる） */
function renderDeck(){const ch=curChar(),dk=S.deck,pool=deckPool(ch).sort((a,b)=>"SKERC".indexOf(rarityOf(b))-"SKERC".indexOf(rarityOf(a))||CARDS[a].c-CARDS[b].c),err=deckErrors(dk,ch),n=deckCount(dk);
  const sc=$("#dkl")?$("#dkl").scrollTop:0;
  ui().innerHTML=`<div class="hdr" ${at(8,6,300,18)}>デッキを組む（${esc(ch)}）</div><div class="sign" ${at(8,26,300,328)}></div>
  <div class="scroll grid1" id="dkl" ${at(14,30,288,320)}>`+pool.map(id=>{const k=dk[id]||0,lim=deckLimitOf(id),d=CARDS[id];
    return `<div class="dr r-${rarityOf(id)}" title="${esc(descOf(id,false,0))}"><i class="rare r${rarityOf(id).toLowerCase()}"></i><span class="nm">${esc(d.n)}</span><span class="small dim">${TYPE_K[d.t]} ${d.costGear?d.costGear[0]+"↓":d.c}</span>
     <button class="mini" ${k?"":"disabled"} onclick="deckAdd('${id}',-1)">−</button><span class="num">${k}/${lim}</span><button class="mini" ${k>=lim||n>=RULES.deckSize?"disabled":""} onclick="deckAdd('${id}',1)">＋</button></div>`}).join("")+`</div>
  ${backBtn("もどる","S.deck=null;showTitle()")}
  <div class="sign side" ${at(452,60,180,120)}><div class="big ${n===RULES.deckSize?"ok":"ng"}">${n}/${RULES.deckSize}<span class="small">枚</span></div>
   <div class="small dim">同じカードは<br>コモン${RULES.deckLimit.C}・レア${RULES.deckLimit.R}・エピック${RULES.deckLimit.E}<br>固有スキル${RULES.deckLimit.SK}枚まで</div></div>
  <div class="col" ${at(452,236,180)}><button class="main u9" ${err.length?"disabled":""} onclick="saveDeck(S.deck,curChar());S.deck=null;showTitle()">${err.length?esc(err[0]):"これで決める"}</button>
   <button class="u9" onclick="S.deck=defaultDeck(curChar());renderDeck()">最初のデッキ</button></div>`;
  if($("#dkl"))$("#dkl").scrollTop=sc}
function deckAdd(id,d){const dk=S.deck,k=(dk[id]||0)+d;if(k<0||k>deckLimitOf(id))return;if(d>0&&deckCount(dk)>=RULES.deckSize)return;if(k)dk[id]=k;else delete dk[id];renderDeck()}

/* ---- ガレージ（ミニカーを2台まで） ---- */
function mcCardName(c){return CARDS[c.id].n+(c.up?"+":"")}
function mcHTML(m,o={}){const b=mcBonus(m);
  return `<button class="mc${o.cls?" "+o.cls:""}" ${o.attrs||""}><span class="rk">${esc(m.rank)}</span><span class="mb">${m.cards.length?m.cards.map(c=>esc(mcCardName(c))).join("・"):"カードなし"}${m.part?"／"+esc(PARTS[m.part].n):""}<br><span class="dim">耐久+${b.hp} 攻撃+${b.atk}% ${esc(m.mode)}${m.clear?" クリア":""}</span></span></button>`}
/* ★v0.16：背景 garage。デッキと同じ並び（左に一覧・右にボタン） */
function showMinicarGarage(mode){SND.bgm("title");
  setScreen("garage");setScene("dim");
  const mc=loadMinicars().slice().reverse();S.mcAll=mc;S.mcMode=mode;S.mcSel=(S.mcSel||[]).filter(id=>mc.some(m=>m.id===id));
  const sel=mc.filter(m=>S.mcSel.includes(m.id)),sc=$("#mcl")?$("#mcl").scrollTop:0;
  ui().innerHTML=`<div class="hdr" ${at(8,6,300,18)}>ガレージ（${esc(mode)}）</div><div class="sign" ${at(8,26,300,328)}></div>
  <div class="scroll grid1" id="mcl" ${at(14,30,288,320)}>${mc.length?mc.map((m,i)=>mcHTML(m,{cls:S.mcSel.includes(m.id)?"on":"",attrs:`onclick="toggleBring(${i})"`})).join(""):`<div class="dim small">まだミニカーがない。ランを終えると1台できる。</div>`}</div>
  ${backBtn("もどる","S.mcSel=[];showTitle()")}
  <div class="sign side" ${at(452,60,180,96)}>${itemIcon("minicar",32)}<div class="big">${sel.length}/${BRING_MAX}<span class="small">台</span></div><div class="small dim">持ち込むミニカーを<br>${BRING_MAX}台まで選ぶ</div></div>
  <div class="col" ${at(452,236,180)}><button class="main u9" onclick="startWithMinicars()">${sel.length?"この"+sel.length+"台で出発":"出発"}</button>
   <button class="u9" onclick="S.mcSel=[];newRun('${mode}')">ミニカーなし</button></div>`;
  if($("#mcl"))$("#mcl").scrollTop=sc}
function toggleBring(i){const m=S.mcAll[i];if(!m)return;const s=S.mcSel,k=s.indexOf(m.id);
  if(k>=0)s.splice(k,1);else if(s.length<BRING_MAX)s.push(m.id);else{s.shift();s.push(m.id)}showMinicarGarage(S.mcMode)}
function startWithMinicars(){const p=S.mcAll.filter(m=>S.mcSel.includes(m.id));S.mcSel=[];newRun(S.mcMode,p)}
/* ボット用：newRun("MT") でガレージを飛ばして走れる（組んだデッキを使う） */
/* ★つづきから */
function continueRun(){const r=loadRun();if(!r){showTitle();return}G=r.G;B=null;uidN=1+Math.max(0,...G.deck.map(c=>c.uid||0));SND.setCar();
  const st=r.stage||{};if(st.s==="battle"&&ENEMIES[st.key]){if(st.j!=null)G.path[G.row]=st.j;startBattleState(st.key);enterBattle()}
  else if(st.s==="win"){const rk=st.rank;if(st.key&&ENEMIES[st.key]&&ENEMIES[st.key].ally){allyBossAfter();return}if(rk==="boss"||rk==="elite")partsChoice("パーツを1つ選ぶ",nextRow);else nextRow()}
  else showMap()}
function newRun(mode,bring){const ch=curChar();clearRun();newRunState(mode,ch,(bring||[]).map(normMinicar).filter(Boolean),loadDeck(ch),runOpts());SND.setCar();
  // ★v0.19（text.md v0.7 10-1）：初めてのラン＝チュートリアル → 導入 prologue → オープニング op → ROAD に入る op_road → エリアの入り口 → マップ。
  //   2回目からは run_start（ROAD OPEN と2行）→ エリア名 → マップ。v0.18 までに op を見た人も、導入は1回出る（話が新しくなったため）
  //   ★v0.22：仲間で走るときは、その子の場面（hina_op・run_start_hina）。ブローが入る夜に初めて入るときは night3_first（text 12-1）をマップの前に
  const run=G,go=()=>{G=run;B=null;blowIntro(()=>areaIntro(0,showMap))},
    op=()=>{G=run;B=null;if(ch!=="YUKI"){const lc=ch.toLowerCase();if(!seenGet()[lc+"_op"]&&TEXT.scenes[lc+"_op"])showScene(lc+"_op",go);else showScene(TEXT.scenes["run_start_"+lc]?"run_start_"+lc:"run_start_ally",go);return}
      if(!seenGet().prologue)showScene("prologue",()=>showScene("op",()=>showScene("op_road",go)));else showScene("run_start",go)};
  if(!tutDone())startTutorial(op);else op()}

/* ---- 上の帯 ---- */
function hud(x){const full=FULL_SCREENS.includes(window.SCREEN);return `<div class="hud${full&&window.SCREEN!=="map"?" strip":""}" ${at(x||4,3,(full?632:472)-(x?x-4:0))}><span class="md">${G.mode}</span> 耐久 <b>${G.hp}/${G.maxhp}</b>　お金 <b>${G.money}</b>${G.tickets?`　券 ${G.tickets}`:""}　パーツ ${G.parts.length}/${RULES.partsMax}　デッキ ${G.deck.length}</div>`}

/* ---- マップ（左から右へ・今のエリアの段だけ。640 いっぱい）。背景はグラフィック班の map\c2 があれば ---- */
const MAP_ART=k=>`assets/c2/map/c2/revremit_map_bg_${AREA_BG[k]||k}.png`;
function showMap(){
  setScreen("map");setScene("dim");closeModal();saveRun({s:"map"});SND.red(0);SND.areaBgm("map");
  const ai=areaIdx(),rows=G.map.map((r,i)=>[r,i]).filter(([r])=>r[0].a===ai),cols=rows.length,step=Math.floor(620/cols),AR=AREAS[ai];
  const bgp=MAP_ART(AR.key);
  let h=(artHave(bgp)?`<img class="px" src="${artURL(bgp)}" ${at(0,0,640,360)}>`:"")+hud(4)+`<div class="h" ${at(8,20,400)}>エリア${ai+1}　${esc(AR.n)}<span class="small dim">　${G.row-rows[0][1]+1}/${cols}段</span></div>`;
  rows.forEach(([r,i],ci)=>{const x=10+ci*step;
    r.forEach((n,j)=>{const y=r.length===1?150:Math.round(70+j*(180/(r.length-1||1)));
      const st=i<G.row?"done":i===G.row?"now":"later",hidQ=n.k==="hidden"&&i>G.row+1,lab=hidQ?"？":NODE_JP[n.k]+(n.feat?"★":"");
      const icSt=i<G.row?"done":i===G.row?"on":"off",icK=hidQ?"unknown":n.k==="shop"&&n.feat?"shopF":n.k,ic0=MAP_ICON(icK,icSt),ic=artHave(ic0)?ic0:MAP_ICON(n.k==="hidden"?"elite":icK==="unknown"?"elite":icK,icSt);/* ★v0.22.2 裏道・「？」のアイコン（なければエリートの絵） */
      const inner=artHave(ic)?`<img class="px mi" src="${artURL(ic)}" alt=""><span class="nl">${lab}</span>`:`<span class="ni">${NODE_ICON[n.k]}</span><span class="nl">${lab}</span>`;
      h+=i===G.row?`<button class="node k-${n.k} ${st}" ${at(x,y,step-4,52)} onclick="enterNode(${j})">${inner}</button>`
                  :`<div class="node k-${n.k} ${st}${G.path[i]===j?" went":""}" ${at(x,y,step-4,52)}>${inner}</div>`})});
  h+=`<div class="mparts" ${at(8,306,200,24)}>${G.parts.map(p=>`<span title="${esc(PARTS[p].n)}">${partIcon(p,24)}</span>`).join("")}</div><div class="small" ${at(150,312,420)}>チューニング：${Object.keys(TUNE).map(k=>TUNE[k][0]+G.tune[k]).join(" ")}</div>
  <div class="small dim" ${at(150,326,420)}>${G.bring.length?"ミニカー："+G.bring.map(m=>esc(m.rank)).join("・")+`（攻撃 +${Math.round((G.atkBonus||0)*100)}%）`:""}</div>
  <button class="mini" ${at(576,326,56,28)} onclick="showDeckList()">デッキ</button><button class="mini optb" ${at(576,22,56,30)} onclick="showOpts()">設定</button>`;/* ★v0.22.11 */
  ui().innerHTML=h;
}
function showDeckList(){const c={};G.deck.forEach(x=>{const k=CD(x).n+(x.up?"+":"");c[k]=(c[k]||0)+1});
  modal(`<div class="h">デッキ ${G.deck.length}枚</div><div class="scroll" style="height:170px">${Object.entries(c).map(([k,n])=>`${esc(k)} ×${n}`).join("<br>")}</div><div class="row"><button class="main" onclick="closeModal()">とじる</button></div>`)}
function enterNode(j){SND.se("map_select");
  const n=G.map[G.row][j];if(!n)return;G.path[G.row]=j;SND.se("map_select");
  if(n.k==="hidden"){const go=()=>{const k=nodeEnemy(n);saveRun({s:"battle",key:k,j});startBattleState(k);enterBattle()};
    if(!seenGet().hidden_in){const l=TEXT.hiddenLast[G.char];TEXT.scenes.hidden_in.lines=TEXT.scenes.hidden_in.lines.slice(0,2).concat(l?[l]:[]);showScene("hidden_in",go)}else go()}
  else if(n.k==="battle"||n.k==="elite"){const k=nodeEnemy(n);saveRun({s:"battle",key:k,j});startBattleState(k);enterBattle()}
  else if(n.k==="boss"){const go=()=>{const k=nodeEnemy(n);saveRun({s:"battle",key:k,j});startBattleState(k);enterBattle()};
    /* ★v0.22.3 その子のボス（零号の前に連戦）。まだ倒していなければ、先に「○○_boss_pre」→ その子のボス */
    const ab=allyBossOf(n);if(ab){showScene(G.char.toLowerCase()+"_boss_pre",()=>{saveRun({s:"battle",key:ab,j});startBattleState(ab);enterBattle()});return}
    showScene(AREAS[n.a].boss+"_pre",go)}
  else if(n.k==="shop")showShop(n);
  else if(n.k==="sim")showSim();
  else if(n.k==="lucky"){partsChoice("ラッキー！パーツを1つ選ぶ",nextRow);setBg("lucky")}
  else if(n.k==="garage"){if(sceneKey("rest_first")&&!seenGet()[sceneKey("rest_first")])showScene("rest_first",showRest);else showRest()}// ★v0.19：休憩に初めて入ったとき（text.md 10-20）
}
function nextRow(){const prev=G.map[G.row][0],r=advanceRow();
  if(r==="clear"){const ally=G.char!=="YUKI"&&seenGet()[sceneKey("ed1")];/* ★v0.22.2 仲間のエンディング・ROAD LOG はその子での初クリアだけ（story 7-7） */
    showScene(AREAS[prev.a].boss+"_post",()=>ally?showResult(true):showScene("ed1",()=>showScene("roadlog_001",()=>showScene("ed1_after",()=>showResult(true)))));return}
  if(r==="area"){showScene(AREAS[prev.a].boss+"_post",()=>areaIntro(areaIdx(),showMap));return}
  showMap()}

/* ---- 戦闘 ---- */
function enterBattle(){
  setScreen("battle");setScene("battle");S.sel=-1;S.pending=null;
  A.bgKey=B.hidden&&STAGE_C2.hidden?"hidden":AREA_BG[curArea().key]||"street";
  const E=Object.assign({},ENEMIES[B.key]);if(B.e&&B.e.phased&&E.phase&&E.phase.art&&SPR[E.phase.art]&&!SPR[E.phase.art].proc){E.art=E.phase.art;E.pal=null}/* ★v0.22.9 */if(B.hidden&&SPR["lost_"+B.key]&&!SPR["lost_"+B.key].proc){E.art="lost_"+B.key;E.pal=null}/* ★v0.22.2 裏道のロストライン */
  const own=E.art&&SPR[E.art]&&!SPR[E.art].proc,fb=ART_FALLBACK[E.art],fbOk=fb&&SPR[fb]&&!SPR[fb].proc;// 絵がまだない敵は C2 の絵の色変え（仮）
  Object.assign(A.E,{glitch:0,set:own?E.art:fbOk?fb:"van",pal:E.pal||(own?null:"f_"+E.art),scale:E.scale||(own||fbOk?(E.rank==="elite"&&!own?1.1:1):E.rank==="boss"?1.5:E.rank==="elite"?1.15:1)});
  /* ★v0.22.10 不具合（虎雪 19:04）：先に動く敵の一発・始まりの効果で耐久が 0 になったとき、負けの流れに入らず止まっていた
     → 戦闘の始まりで終わっていたら（または耐久がもう 0 以下なら）、ふつうの勝ち負けの流れ（afterAct）へ */
  if(!B.over&&G.hp<=0&&dead())finish("dead");
  if(B.over){syncDisp();renderBattle();SND.areaBgm("battle");afterAct(B.result,null);return}
  takeEvents();syncDisp();renderBattle();SND.redOn=true;SND.red(B.rpm);SND.areaBgm("battle");
}
/* モーションが終わったら呼ぶ（勝ち・負けの画面へ） */
function onIdle(){if(S.pending&&!busy()){const f=S.pending;S.pending=null;f()}}
setInterval(onIdle,50);
/* 押したら、モーションの残りを飛ばす */
function uiSkip(){flushAnim();onIdle()}
function afterAct(r,rpm0){A.pv=null;const phK=B.key==="boss3"?sceneKey("boss3_phase"):ENEMIES[B.key]&&ENEMIES[B.key].ally?G.char.toLowerCase()+"_boss_phase":null;if(B.ev.some(e=>e.k==="phase")&&phK){S.toastQ=(TEXT.scenes[phK]||{lines:[]}).lines.slice();S.toastT=Date.now();[2500,5000].forEach(t=>setTimeout(()=>{if(window.SCREEN==="battle"&&B&&!B.over&&!busy())renderBattle()},t+30))}
  // エンジン音：回転数が変わったら約2秒だけ（★08:20）。ブローは SND.blow が鳴らす
  if(rpm0!=null&&B.rpm!==rpm0&&r!=="dead")SND.engineBurst(rpm0,B.rpm);
  playEvents(takeEvents());S.sel=-1;
  if(window.TUTORIAL_ON){if(r==="dead"){G.hp=1}S.pending=null;renderBattle();tutAfter(r);return}
  if(r==="win")S.pending=()=>{if(sceneKey("first_remit")&&!seenGet()[sceneKey("first_remit")])showScene("first_remit",showWin);else showWin()};else if(r==="dead")S.pending=()=>showResult(false);
  else if(r==="escape")S.pending=()=>{SND.engineStop();SND.jingle("hidden_escape");toast2(TEXT.ui.hidden_lose.replace(/<br>/g,""));nextRow()};
  renderBattle();
}
function doPlay(i,shift,ok){if(B.over||!tutAllow("play",{i,shift}))return;
  if(!ok&&G.night>=3&&!seenGet().blow_confirm){const p=preview(B.hand[i]);if(p.ok&&p.danger==="blow"&&!shift){SND.se("blow_warn");S.blowGo=()=>{SND.se("ui_ok");seenSet("blow_confirm");closeModal();doPlay(i,shift,true)};
    modal(`<div class="h ngc">ブローします。打ちますか？</div><div class="small">エンジンが止まって、このランは終わります。</div><div class="row"><button class="warn" onclick="S.blowGo()">打つ</button><button class="main" onclick="SND.se('ui_cancel');closeModal()">やめる</button></div>`);return}}flushAnim();closeModal();const r0=B.rpm;afterAct(playCard(i,shift),r0)}
function doEndTurn(){if(B.over||!tutAllow("end"))return;flushAnim();const r0=B.rpm;SND.se("turn_end");afterAct(endTurn(),r0)}
function doDownShift(){if(B.over||!tutAllow("down"))return;flushAnim();const r0=B.rpm,g0=B.gear;afterAct(downShift(),r0);if(B.gear<g0)TUTS.downs++;tutAfter("down")}
function doParking(){if(B.over)return;flushAnim();const r0=B.rpm;afterAct(parking(),r0)}
/* カードの「打ち方」：[ラベル, shift, 種類] の並び。いちばん上がおすすめ */
function cardActions(i){const c=B.hand[i],p=preview(c);if(!p.ok)return[];
  if(G.mode==="AT")return p.paddle?[["打つ",false,"main"],["パドルで上げて打つ",true,""]]:[["打つ",false,"main"]];
  if(CD(c).shiftCard&&p.canShift)return[["シフトアップ",true,"main"]];
  if(p.canShift){const g=p.grade,up=[`シフトして打つ（${GRADE_JP[g]}${g==="perfect"?" +0.3・1枚":g==="good"?" +0.1":""}）`,true,g==="perfect"||g==="good"?"main":""],
      no=[`${B.gear+1}速のまま打つ${p.danger==="over"?"（オーバーレブ）":""}`,false,p.danger==="over"?"warn":""];
    return g==="perfect"||g==="good"||p.danger==="over"?[up,no]:[no,up]}
  if(p.danger==="blow")return[["打つ（エンジンブロー＝即死）",false,"warn"]];
  return[["打つ",false,"main"]];
}
function clickCard(i){
  if(B.over)return;if(busy())uiSkip();if(!tutAllow("card",i))return;
  const c=B.hand[i];if(!c)return;const p=preview(c);
  if(S.sel===i&&p.ok){const a=cardActions(i).find(a=>tutAllow("play",{i,shift:a[1]}));if(a&&a[2]!=="warn"){doPlay(i,a[1]);return}}
  S.sel=i;setPreview(i);renderBattle();tutAfter("sel");
}
/* 予告：シフトしない方・シフトする方の両方（MT でシフトできるとき） */
function detailNumbers(i){const c=B.hand[i],p=preview(c);const a=faceNumber(i,false);if(!a)return"";
  const lab=a.kind==="atk"?"ダメージ":"防御",one=x=>`<span class="${x.cls}">${esc(x.txt)}</span>${x.win?' <span class="gold">たおせる</span>':""}`;
  if(G.mode==="MT"&&p.canShift&&!CD(c).shiftCard){const b=faceNumber(i,true);return `<div class="pvn">${lab}：そのまま ${one(a)}　シフト ${one(b)}</div>`}
  return `<div class="pvn">${lab} ${one(a)}</div>`}
function stageTap(){if(busy()){uiSkip();return}if(S.sel>=0){S.sel=-1;A.pv=null;renderBattle()}}
/* ★カードを触ったときの予告（design 5章）：メーターと HP のバーの上に出す。anim.js が A.pv を読んで描く */
function setPreview(i){A.pv=null;if(i<0||!B.hand[i])return;const c=B.hand[i],p=preview(c);
  const acts=cardActions(i),sh=acts[0]?acts[0][1]:false,sim=p.ok?simulateCard(i,sh):null;
  A.pv={band:bandRangeOf(c),gas:p.ok?p.gas:gasOf(c),ok:p.ok,sim,gasAfter:sim?sim.gas:null}}
function renderBattle(){
  if(!B)return;setScreen("battle");
  const e=B.e,full=!canDraw(),locked=B.over,L=RES;
  /* ★v0.22.8 design 10-7：予告が変わった瞬間に1回だけ enemy_attack_warn（大きな攻撃・貫通） */
  {const k=`${G.st.battles}|${B.key}|${e.phased?1:0}|${e.mi||0}|${e.pi||0}`;if(k!==S.warnKey){S.warnKey=k;if(!locked&&e.hp>0&&bigIntent(e))SND.se("enemy_attack_warn")}}
  const tl=timeline().map((x,i)=>`<span class="${x}">${i===0?"今 ":""}${x==="p"?esc(G.char):esc(e.n.slice(0,6))}</span>`).join("");
  const isBoss=e.rank==="boss",LB=L.boss;
  const tag=e.rank==="elite"?"エリート":e.rank==="boss"?"ボス":"",form=formOf(e);
  const st=[];if(B.curDouble)st.push("次の攻撃2倍");if(B.curAdd)st.push(`次の攻撃+${B.curAdd}`);if(B.wideAdd)st.push(`ワイド+${B.wideAdd}`);
  if(B.atkDown)st.push(`次の攻撃 回転−${B.atkDown}`);if(B.nextBonus)st.push(`次 倍率+${B.nextBonus}`);if(B.atkTwice)st.push("次のアタック2回");if(B.perfTwice)st.push("パーフェクトで次2回");
  if(B.htTurn)st.push("ヒール＆トゥ");
  const n=B.hand.length,cw=L.hand.cw,stepX=n>1?Math.min(cw+2,Math.floor((L.hand.w-cw)/(n-1))):cw+2;
  const chainPct=Math.round((chainMul()-1)*100);
  let h=`<div class="tap" ${at(0,16,L.W,L.panel.y-16)} onclick="stageTap()"></div>
  <div class="tl" ${at(...L.tl,12)}>${tl}</div>
  <div class="hud small" ${at(...L.hud)}><span class="md">${G.mode}</span> ${esc(curArea().n)}　お金${G.money}　パーツ${G.parts.length}</div>
  <div class="logl small" ${at(...L.log)}>${esc(B.log[B.log.length-1]||"")}</div>
  ${B.chain?`<div class="chain" ${at(...L.chain)}>CHAIN <b>${B.chain}</b> <span>+${chainPct}%</span></div>`:""}
  <div class="ename${isBoss?" boss":""}" ${at(...(isBoss?LB.ename:L.ename))}>${esc(e.n)}${form?`<span class="small">・${form}</span>`:""}${tag?`<span class="tg">${tag}</span>`:""}</div>
  <div class="intent" ${at(...(isBoss?LB.intent:L.intent))}>次：${esc(intent(e))}${e.burn?` 炎上${e.burn}`:""}${e.noise?` ノイズ${e.noise}`:""}</div>
  ${e.gimTxt?(isBoss?`<div class="small gim boss" ${at(...LB.gim)}>${gimLines(e).map(esc).join("<br>")}</div>`:`<div class="small gim" ${at(...L.gim)}>${esc(e.gimTxt)}${e.five?`（今 ${B.cards}枚）`:""}${e.cap?`（今 ${B.atks}/${e.cap}）`:""}</div>`):""}
  ${st.length?`<div class="stt small" ${at(...L.stt)}>${st.map(esc).join("<br>")}</div>`:""}
  ${B.onUp.length?`<div class="onup small" ${at(...L.onup)}>${onUpIcons()}</div>`:""}
  ${toastNow()}`;
  // 手札
  h+=B.hand.map((c,i)=>{const p=preview(c);const sel=S.sel===i;
    return cardSmall(c,{num:faceNumber(i,false),cost:costOf(c),gas:gasOf(c),gasNow:B.gas,band:inBand(c),cls:(p.ok?"":"no ")+(sel?"sel":""),
      attrs:`${at(L.hand.x+i*stepX,L.hand.y-(sel?L.hand.selUp:0))} onclick="clickCard(${i})" ${locked?"disabled":""}`})}).join("");
  // 選んだカードの説明と打ち方
  if(S.sel>=0&&B.hand[S.sel]){const c=B.hand[S.sel],d=CD(c),p=preview(c),acts=cardActions(S.sel);
    h+=`<div class="detail" ${at(...L.detail)}><div class="dn">${esc(d.n)}${c.up?"+":""}<span class="small dim"> ${TYPE_JP[d.t]}・${RARITY_JP[rarityOf(c)]}${d.band?`・帯 ${d.band}（${BAND_JP[d.band]}）`:""}</span></div>
      <div class="small">回転 ${costOf(c)}・ガソリン ${gasOf(c)}${d.charge?`（元 ${gasBase(c)}・条件 ${B.charge}回）`:""}</div><div>${esc(descOf(c,c.up,B.gear))}</div>${detailNumbers(S.sel)}
      <div class="small ${p.danger||!p.ok?"ngc":"dim"}">${nwrap(p.ok?p.txt.replace(/^→ /,"→"):p.txt)}</div>
      ${acts.filter(a=>tutAllow("play",{i:S.sel,shift:a[1]})).map(a=>`<button class="${a[2]}" onclick="doPlay(${S.sel},${a[1]})">${esc(a[0])}</button>`).join("")}</div>`}
  // 右下：ボタン
  h+=`<button class="main end" ${at(...L.btnEnd)} ${locked?"disabled":""} onclick="doEndTurn()">ターン<br>終了</button>`;
  if(!window.TUTORIAL_ON&&typeof autoButtons==="function")h+=autoButtons(locked);/* ★v0.22.11 オート・設定 */
  if(G.mode==="MT"){const k=downCost();h+=`<button class="sub" ${at(...L.btnSub)} ${locked||B.gear===0||full||B.gas<k?"disabled":""} onclick="doDownShift()">${full&&B.gear>0?"手札満杯":`↓シフト<br><span class="small">1枚引く G${k}</span>`}</button>`}
  else{const k=parkCost();h+=`<button class="sub" ${at(...L.btnSub)} ${locked||full||B.gas<k?"disabled":""} onclick="doParking()">${full?"手札満杯":`パーキング<br><span class="small">1枚引く G${k}</span>`}</button>`}
  // 数字（キャンバスの上に文字で）：体力・防御・回転数・倍率・ガソリン・山札
  const red=inRed();
  h+=`<div class="barn bl" ${at(...L.barnP)}><span class="bn">${esc(G.char)}</span> ${Math.max(0,G.hp)}/${G.maxhp}${B.block?` <span class="cy">防${B.block}</span>`:""}</div>
  <div class="barn ${isBoss?"ra":"bl"}" ${at(...(isBoss?LB.barnE:L.barnE))}>${Math.max(0,e.hp)}/${e.maxhp}${e.block?` <span class="cy">防${e.block}</span>`:""}</div>
  ${METER.blank?"":`<div class="tachn ${red?"ngc":""}" ${at(...L.tachn)}>${B.rpm}<span class="dim">rpm</span></div><div class="gasn" ${at(...L.gasn)}>${B.gas}/${maxGas()}</div>`}
  <div class="tachm" ${at(...L.tachm)}>×${gearMult()}</div>
  <div class="small dim ra" ${at(...L.counts)}>手札${n} 山${B.draw.length} 捨${B.disc.length}　カード${B.cards}/${RULES.cardCap}</div>`;
  ui().innerHTML=h;if(window.TUTORIAL_ON)tutRender();
}
/* ★BUG-24：ボスの特徴は「・」で区切って1行ずつ（折り返さない）。数えるものは、その行のうしろに */
function gimLines(e){return e.gimTxt.split("・").map((t,i)=>t+(i===0&&e.five?`（今 ${B.cards}枚）`:"")+(i===0&&e.cap?`（今 ${B.atks}/${e.cap}）`:""))}
/* BUG-22：予告の文は「　」で区切った語ごとに折り返さない（「ガソリ／ン −2」にならない） */
const nwrap=t=>String(t).split("　").map(x=>`<span class="nw">${esc(x)}</span>`).join("　");
/* 場の効果のアイコン（YUKI の足もと） */
function onUpIcons(){const k={};B.onUp.forEach(o=>{const t=o[0]==="genHand"?"晶":o[0]==="frz"?"凍":o[0]==="blk"?"守":"他";k[t]=(k[t]||0)+(o[0]==="genHand"?o[2]:o[1])});
  return "⇧ "+Object.entries(k).map(([t,v])=>`<span class="oi">${t}${v}</span>`).join("")}

/* ---- 勝った ---- */
function showWin(){SND.red(0);if(S.jw!==B){S.jw=B;if(B.hidden){SND.engineStop();SND.jingle("hidden_win");setTimeout(()=>SND.se("card_unlock"),900)}else SND.jingle(!B.enemyActed?"one_turn_kill":"win")}
  setScreen("win");setScene("dim");closeModal();
  const w=winRewards();S.win=w;saveRun({s:"win",rank:w.rank,key:w.key});
  /* ★背景 reward：ライト3つ（x 156・319・483）の下にカード、作業台の前にお金と「もらわない」 */
  let h=hud()+`<div class="sign" ${at(170,20,300,30)}><div class="h">${esc(w.name)} をたおした！${w.otk?"　<span class='gold'>ワンターンキル！</span>":""}</div><div class="small">${w.rank==="hidden"?"裏道のカードを開いた":"カードを1枚もらう（デッキに足す）"}</div></div>`;
  S.rewards=w.rank==="hidden"?[]:rewardOptions(w.rank);
  if(w.rank==="hidden")h+=(w.hidCard?cardBig(w.hidCard,{art:true,cls:"lit",attrs:`${at(LAMP_X[1]-70,52,140,184)}`})+`<div class="sign" ${at(170,240,300,40)}><div class="h">裏道のカード「${esc(CARDS[w.hidCard].n)}」を開いた</div><div class="small"><span class="commk">通信</span>みお：${esc(TEXT.ui.hidden_win.replace(/<br>/g,""))}</div><div class="small">デッキに1枚入った（次のランからも報酬に出る）</div></div>`
    :`<div class="sign" ${at(170,120,300,40)}><div class="h">裏道のカードは全部開いている</div><div class="small">お金とログが多めに入る</div></div>`)+`<button class="main u9" ${at(484,300,120,32)} onclick="takeCard(null)">つぎへ</button>`;
  h+=S.rewards.map((id,i)=>cardBig(id,{art:true,cls:"lit",attrs:`${at(LAMP_X[i]-70,52,140,184)} onclick="takeCard('${id}')"`})).join("")+
   (w.rank==="hidden"?"":backBtn("もらわない","takeCard(null)"))+/* ★v0.22.1 BUG-30：裏道は「つぎへ」だけ */
   `<div class="gain sign" ${at(170,284,300,32)}>${itemIcon("money",32)}お金 +${w.gold}${w.ticket?`　${itemIcon("coupon",32)}割引券`:""}</div>`;
  ui().innerHTML=h;
}
const LAMP_X=[156,319,483];
function takeCard(id){if(id)G.deck.push(inst(id));afterWin()}
/* その子のボス：サーキットのボスのマスで、その子で走っていて、まだ倒していないとき */
function allyBossOf(n){const ab=typeof ALLY_BOSS!=="undefined"&&ALLY_BOSS[G.char];return ab&&ENEMIES[ab]&&AREAS[n.a].boss==="boss3"&&!G.allyBossDone?ab:null}
/* その子のボスに勝ったあと：パーツ → 「○○_boss_post」→ 同じマスで零号へ（段は進めない） */
function allyBossAfter(){G.allyBossDone=true;const n=G.map[G.row][G.path[G.row]||0];partsChoice("ボス撃破！パーツを1つ選ぶ",()=>showScene(G.char.toLowerCase()+"_boss_post",()=>enterNode(G.path[G.row]||0)))}
function afterWin(){if(S.win&&ENEMIES[S.win.key]&&ENEMIES[S.win.key].ally){allyBossAfter();return}const r=S.win.rank;if(r==="boss")partsChoice("ボス撃破！パーツを1つ選ぶ",nextRow);else if(r==="elite")partsChoice("エリート撃破！パーツを1つ選ぶ",nextRow);else nextRow()}

/* ---- パーツの3択 ---- */
function partsChoice(title,done){
  setScreen("parts");setScene("dim");
  S.partOpts=partOptions(3);S.pdone=done;const full=G.parts.length>=RULES.partsMax;
  ui().innerHTML=hud()+`<div class="sign" ${at(170,20,300,30)}><div class="h">${esc(title)}</div>${full?`<div class="small gold">パーツが${RULES.partsMax}つ。選ぶと入れ替え</div>`:`<div class="small">ライトの下から1つ</div>`}</div>`+
   (S.partOpts.length?S.partOpts.map((p,i)=>`<button class="pt lit" ${at(LAMP_X[i]-70,52,140,184)} onclick="takePart('${p}')"><span class="slot${PARTS[p].own!=="N"?" sp":""}">${partIcon(p,64)}</span><b>${esc(partName(p))}</b><br><span class="small">${esc(PARTS[p].d)}</span></button>`).join(""):`<div class="sign" ${at(220,120,200,24)}>候補がない</div>`)+
   backBtn("取らない","S.pdone()");
}
/* ★v0.22.9 パーツの入れ替え（★虎雪 18:27「効果が見えないのやだな」）：付ける方・外す方の効果を両方出す。タップで外すパーツを選ぶ → 前 → 後 の数値 → 「入れ替える」 */
function partStats(parts){const sv=G.parts,hp=G.maxhp+(sv.includes("forged")?10:0);G.parts=parts;
  try{const b=bandRange();return{limit:limit(),red:redLo(),band:`${b.lo}〜${b.hi}`,maxhp:hp-(parts.includes("forged")?10:0)}}finally{G.parts=sv}}
function partDiffRows(before,after){const a=partStats(before),b=partStats(after),w=x=>{const m=String(x).split("〜");return m[1]-m[0]},
  L=[["リミット","limit",(x,y)=>y>x],["レッドゾーン（から）","red",(x,y)=>y<x],["シフトの帯","band",(x,y)=>w(y)>w(x)],["エンジン耐久の最大","maxhp",(x,y)=>y>x]];
  return L.filter(([,k])=>a[k]!==b[k]).map(([n,k,good])=>`<div class="pdrow"><span>${n}</span><span>${a[k]} → <b class="${good(a[k],b[k])?"up":"down"}">${b[k]}</b></span></div>`).join("")}
function choosePartSlot(p,onOk){
  if(G.parts.length<RULES.partsMax){onOk(-1);return}
  S.slotOk=onOk;S.slotNew=p;S.slotSel=-1;renderPartSlot()}
function renderPartSlot(){const p=S.slotNew,sel=S.slotSel,q=sel>=0?G.parts[sel]:null;
  const card=(id,tag,cls)=>`<div class="pdcard ${cls}"><div class="small dim">${tag}</div><div class="pdn">${partIcon(id,24)}<b>${esc(partName(id))}</b></div><div class="small">${esc(PARTS[id].d)}</div></div>`;
  let diff="";if(q){const after=G.parts.slice();after[sel]=p;diff=partDiffRows(G.parts,after)}
  modal(`<div class="pswap"><div class="h">どれと入れ替える？</div><div class="small dim">パーツは${RULES.partsMax}つまで。外すパーツをえらぶ</div>
   <div class="pslist">${G.parts.map((x,i)=>`<button class="psrow${i===sel?" on":""}" onclick="S.slotSel=${i};SND.se('ui_ok');renderPartSlot()"><span class="pdn">${partIcon(x,20)}<b>${esc(partName(x))}</b></span><span class="small">${esc(PARTS[x].d)}</span></button>`).join("")}</div>
   <div class="psside">${card(p,"付ける","new")}${q?card(q,"外す","old")+(diff?`<div class="pdiff">${diff}</div>`:""):`<div class="small dim pshint">左から、外すパーツをえらぶ</div>`}
   <div class="row"><button class="main" ${q?"":"disabled"} onclick="closeModal();S.slotOk(${sel})">入れ替える</button><button onclick="closeModal()">やめる</button></div></div></div>`);
  const m=$("#modal .modal .box");if(m)m.classList.add("wide")}
function takePart(p){choosePartSlot(p,idx=>{addPart(p,idx);SND.se(idx>=0?"part_swap":"part_get");S.pdone()})}

/* ---- チューニングショップ ---- */
function showShop(n){
  setScreen("shop");setScene("dim");closeModal();if(S.shop!==n&&(n.feat||n.sale))SND.se("shop_sale");S.shop=n;SND.bgm("shop");
  if(n.feat&&!n.featPart){const pool=partPool();n.featPart=pool.length?pick(pool):null}
  const ut=!!S.useTicket&&G.tickets>0;
  /* ★背景 shop：奥の壁にメニューの板（チューン5つ）、カウンターの上に目玉商品、カウンターの前に値札・割引券・「店を出る」 */
  let h=hud()+`<div class="hdr" ${at(100,24,440,18)}>チューニングショップ${n.sale?"　セール −30%":""}</div>${n.sale?`<i class="badge sale" ${at(506,27,30,12)}></i>`:""}<div class="sign board" ${at(96,42,448,170)}></div>`;
  Object.keys(TUNE).forEach((k,i)=>{const pr=tunePrice(k,n,ut);
    h+=`<div class="shoprow two" ${at(104,48+i*32,432,30)}><div class="tx"><b>${TUNE[k][0]}</b> <span class="lv">${"■".repeat(G.tune[k])}${"□".repeat(5-G.tune[k])}</span><br><span class="small dim">${esc(TUNE[k][1])}</span></div>
    ${pr!=null?`${priceTag(pr,TUNE_PRICE[G.tune[k]],G.money>=pr)}<button class="u9" ${G.money>=pr?"":"disabled"} onclick="uiBuyTune('${k}')">上げる</button>`:`<span class="dim">最大</span>`}</div>`});
  if(n.feat&&n.featPart){const pr=shopPrice(RULES.featPrice,n,ut);
    h+=(n.featBought?"":`<div class="onctr" ${at(124,222,48,48)}>${partIcon(n.featPart,48)}</div>`)+
    `${n.featBought?"":`<i class="badge feature" ${at(100,290,30,12)}></i>`}<div class="shoprow feat" ${at(100,296,330,54)}><div class="tx"><span class="gold">★目玉商品</span> ${n.featBought?"売り切れ":`<b>${esc(partName(n.featPart))}</b><br><span class="small">${esc(PARTS[n.featPart].d)}</span>`}</div>
    ${n.featBought?"":`${priceTag(pr,RULES.featPrice,G.money>=pr)}<button class="u9" ${G.money>=pr?"":"disabled"} onclick="uiBuyFeat()">買う</button>`}</div>`}
  if(G.tickets)h+=`<label class="small sign tick" ${at(440,296,180,22)}><input type="checkbox" ${ut?"checked":""} onchange="S.useTicket=this.checked;showShop(S.shop)"> 割引券を使う（−50%）</label>`;
  // ★v0.18.1：「店を出る」は右上（どの端末でも下の端が隠れても見える所）
  h+=backBtn("店を出る","S.useTicket=false;nextRow()");
  ui().innerHTML=h;
}
/* 値段の札（ui640 price・セールや割引は price_sale で元の値段に線）。足りないときは赤 */
function priceTag(pr,base,ok){const sale=base!=null&&base>pr;return `<span class="price${sale?" sale":""}${ok?"":" lack"}">${sale?`<s>${base}</s>`:""}${pr}</span>`}
function uiBuyTune(k){const ut=!!S.useTicket&&G.tickets>0;const pr=tunePrice(k,S.shop,ut);if(pr!=null&&buyTune(k,pr,ut)){S.useTicket=false;SND.se("shop_buy");SND.se("tune_up",{lv:G.tune[k]})}else SND.se("card_cant");showShop(S.shop)}
function uiBuyFeat(){const n=S.shop,ut=!!S.useTicket&&G.tickets>0,pr=shopPrice(RULES.featPrice,n,ut);if(G.money<pr)return;
  choosePartSlot(n.featPart,idx=>{if(buyFeat(n,pr,ut,idx)){S.useTicket=false;SND.se("shop_buy");SND.se(idx>=0?"part_swap":"part_get")}showShop(n)})}

/* ---- シムトレーニング ---- */
/* ★背景 sim：真ん中のモニター（174,92 〜 464,158）に説明、床にカードの列（タップで選ぶ → モニターに強化の前と後 → 「強化する」） */
function showSim(){
  setScreen("sim");setScene("dim");
  const idx=upgradeTargets();if(S.simSel==null||!idx.includes(S.simSel))S.simSel=null;
  const sel=S.simSel!=null?G.deck[S.simSel]:null;
  let mon;
  if(!sel)mon=`<div class="h">シムトレーニング</div><div class="small">カードを1枚えらんで強化する（数値 ×1.5）</div><div class="small dim">${idx.length?"下の列から選ぶ":"強化できるカードがない"}</div>`;
  else{const cu=baseCost(sel,true,0),cb=baseCost(sel,false,0);
    mon=`<div class="h">${esc(CD(sel).n)} → ${esc(CD(sel).n)}+</div><div class="small dim">${esc(descOf(sel,false,0))}</div><div class="small">→ ${esc(descOf(sel,true,0))}${cu!==cb?`（回転 ${cu}）`:""}</div>`+
     `<button class="main u9" ${at(206,36,80,28)} onclick="uiUpgrade(${S.simSel})">強化する</button>`}
  let h=hud()+`<div class="monitor" ${at(172,90,294,70)}>${mon}</div>`;
  h+=`<button class="mini arr" ${at(4,256,28,72)} onclick="simScroll(-1)">◀</button><div class="simrow scroll" id="simrow" ${at(36,246,568,96)}>`+
   idx.map(i=>{const c=G.deck[i],d=CD(c);return `<span class="sw${i===S.simSel?" on":""}">`+cardSmall(c,{cost:baseCost(c,false,0),gas:d.gas,band:false,cls:i===S.simSel?"sel":"",attrs:`onclick="simPick(${i})"`})+`</span>`}).join("")+
   `</div><button class="mini arr" ${at(608,256,28,72)} onclick="simScroll(1)">▶</button>`;
  h+=backBtn("強化しない","S.simSel=null;nextRow()");
  const sx=S.simX||0;ui().innerHTML=h;const r=$("#simrow");if(r)r.scrollLeft=sx;
}
function simPick(i){if(S.simSel===i){uiUpgrade(i);return}S.simSel=i;S.simX=$("#simrow")?.scrollLeft||0;SND.se("ui_ok");showSim()}
function uiUpgrade(i){if(G.deck[i]&&canUpgrade(G.deck[i])){G.deck[i].up=true;SND.se("card_upgrade")}S.simSel=null;S.simX=0;nextRow()}
function simScroll(k){const r=$("#simrow");if(r){r.scrollLeft+=k*280;S.simX=r.scrollLeft}}
/* ---- ガレージ（休憩） ---- */
/* ★v0.16：背景 garage。ストーブ（左）とソファ（右）。ソファの上に休憩の窓 */
function showRest(){setScreen("rest");setScene("dim");const x=restAmount(),to=Math.min(G.maxhp,G.hp+x);
  ui().innerHTML=hud()+`<div class="hdr" ${at(452,26,180,18)}>ガレージで休憩</div><div class="sign side" ${at(452,46,180,80)}><div class="small dim">ストーブで温まって<br>エンジンを直す</div>
   <div>耐久 ${G.hp} → <b class="ok">${to}</b><span class="small dim">/${G.maxhp}</span></div></div>
   <button class="main u9" ${at(452,134,180,28)} onclick="G.hp=Math.min(G.maxhp,G.hp+${x});nextRow()">エンジンを直す（+${x}）</button>`}

/* ---- リザルト・ミニカー ---- */
function showResult(clear){if(S.runDone!==G){S.runDone=G;try{const st=SAVE.cur.profile.stats;st.runs=(+st.runs||0)+1;if(clear)st.clears=(+st.clears||0)+1}catch(e){}}
  setScreen("result");setScene("dim");closeModal();clearRun();if(!clear){setBg("lose");SND.jingle("gameover")}else SND.bgm("result");
  const res=calcResult(clear),st=G.st;S.res=res;const lg=runEnd(clear,res.rank);setTimeout(()=>{const ri=res.ri;if(ri>=5)SND.se("rank_high",{tier:ri-4});else SND.se(ri>=2?"rank_mid":"rank_low")},clear?2400:3900);S.pickSel=[];S.partSel=G.parts.length?0:-1;S.need=Math.min(MC_CARDS,res.ten.length);
  /* ★v0.16：背景 result。ショーケース（6列×4段）の上2段に候補のカード10枚、3段目にパーツ、下の床に説明と「ミニカーを作る」 */
  let h=`<div class="hdr" ${at(100,4,380,18)}>${clear?"全エリア クリア！":"エンジン停止……現実に戻った"}</div><div class="sign rk" ${at(486,4,54,40)}><div class="rank">${res.rank}</div></div>
  <div class="small sh" ${at(100,24,380)}>${Object.entries(res.pts).map(([k,v])=>`${k}${v}`).join("・")}　合計${res.total}</div>
  <div class="small dim sh" ${at(100,35,380)}>シフト${st.shiftTry}回（パーフェクト${st.perfect}・グッド${st.good}）・ワンターンキル${st.otk}${G.night?`・NIGHT ${G.night}`:""}　<span class="gold">ログ +${lg}</span></div>`;
  h+=res.ten.map((c,i)=>{const[x,y]=CASE_XY(i);return caseCard(c,{attrs:`id="pk${i}" ${at(x,y,70,50)} onclick="togglePick(${i})"`})}).join("");
  if(G.parts.length){h+=G.parts.map((p,i)=>{const[x,y]=CASE_XY(12+i);return `<button id="pp${i}" class="case pc ${i===0?"sel":""}" ${at(x,y,70,50)} onclick="pickPart(${i})">${partIcon(p,32)}<span class="cn">${esc(PARTS[p].n)}</span></button>`}).join("");
    const[x,y]=CASE_XY(12+G.parts.length);h+=`<button id="pp${G.parts.length}" class="case pc" ${at(x,y,70,50)} onclick="pickPart(${G.parts.length})"><span class="cn">パーツなし</span></button>`}
  h+=`<div class="sign foot" id="pkd" ${at(100,276,300,74)}><div class="h">ミニカーに残すカードを${S.need}枚</div><div class="small dim">上のショーケースから選ぶ（ランダムな${res.ten.length}枚）${G.parts.length?"・パーツも1つ":""}</div><div class="small">評価${res.rank}：次のランで 耐久+${MC_BONUS.hp[res.ri]}・攻撃+${MC_BONUS.atk[res.ri]}%</div></div>
  <button class="main u9" id="mkcar" ${at(410,300,130,28)} disabled onclick="saveCar()">あと${S.need}枚えらぶ</button>`;
  ui().innerHTML=h;
}
/* ショーケースの1マス（0〜23：左上から右へ）の左上 */
const CASE_XY=i=>[103+(i%6)*73,52+Math.floor(i/6)*55];
/* ショーケースの中のカード：絵の窓 50×38＋名前 */
function caseCard(c,o){const d=CD(c),r=rarityOf(c),art=cardArtTag(c.id||c);
  return `<button class="case t-${d.t} r-${r}" ${o.attrs||""}><span class="cw">${art||`<span class="ck">${TYPE_K[d.t]}</span>`}</span><span class="cn">${esc(d.n)}${c.up?"+":""}</span></button>`}
function togglePick(i){const s=S.pickSel,k=s.indexOf(i);if(k>=0)s.splice(k,1);else if(s.length<S.need)s.push(i);
  S.res.ten.forEach((_,j)=>{const el=$("#pk"+j);if(el)el.classList.toggle("sel",s.includes(j))});
  const b=$("#mkcar"),rest=S.need-s.length;if(b){b.disabled=rest>0;b.textContent=rest>0?`あと${rest}枚えらぶ`:"ミニカーを作る"}
  const c=S.res.ten[i],dd=$("#pkd");if(c&&dd)dd.innerHTML=`<div class="h">${esc(CD(c).n)}${c.up?"+":""} <span class="small dim">${TYPE_JP[CD(c).t]}・${RARITY_JP[rarityOf(c)]}</span></div><div class="small">${esc(descOf(c,!!c.up,0))}</div><div class="small dim">選んだ ${s.length}/${S.need}枚</div>`}
function pickPart(i){S.partSel=i<G.parts.length?i:-1;for(let j=0;j<=G.parts.length;j++){const el=$("#pp"+j);if(el)el.classList.toggle("sel",j===i)}}
function saveCar(){
  if(S.pickSel.length<S.need)return;
  const a=loadMinicars(),m=makeMinicar(S.res,S.pickSel,S.partSel);SND.se("minicar_make");
  if(a.length>=MINICAR_MAX){showReleaseMinicar(a,m);return}
  a.push(m);saveMinicars(a);afterCar(m)}
function showReleaseMinicar(a,m){setScreen("release");S.relList=a;S.relNew=m;S.relSel=null;renderRelease()}
/* ★v0.16：背景 result。ショーケースの前に一覧の窓、上に新しいミニカー、下の床にボタン */
function renderRelease(){const a=S.relList,m=S.relNew,s=S.relSel,sc=$("#rll")?$("#rll").scrollTop:0;
  ui().innerHTML=`<div class="hdr" ${at(100,4,440,18)}>ガレージがいっぱい（${MINICAR_MAX}台）：手放す1台を選ぶ</div>
  <div class="small sh" ${at(100,28,50)}>新しい</div><div ${at(150,24,390)}>${mcHTML(m,{cls:s==="new"?"rel":"",attrs:`onclick="S.relSel='new';renderRelease()"`})}</div>
  <div class="sign" ${at(100,58,440,212)}></div><div class="scroll grid2" id="rll" ${at(106,62,428,204)}>`+a.map((x,i)=>[x,i]).sort((p,q)=>RANKS.indexOf(p[0].rank)-RANKS.indexOf(q[0].rank)||p[0].at-q[0].at)
    .map(([x,i])=>mcHTML(x,{cls:s===i?"rel":"",attrs:`onclick="S.relSel=${i};renderRelease()"`})).join("")+`</div>
  <button class="warn u9 danger" ${at(200,300,240,28)} ${s===null?"disabled":""} onclick="releaseMinicar()">${s===null?"手放す1台を選ぶ":s==="new"?"新しいミニカーを手放す":"選んだ1台を手放して保管"}</button>`;
  if($("#rll"))$("#rll").scrollTop=sc}
function releaseMinicar(){const a=S.relList,s=S.relSel;if(s===null)return;
  if(s!=="new"){a.splice(s,1);a.push(S.relNew)}
  while(a.length>MINICAR_MAX)a.shift();saveMinicars(a);afterCar(S.relNew)}

/* ---- ★会話の画面（alpha-plan 0-5）：場面の絵＋下にセリフの帯。タップで次へ（文の途中なら全部出す）、「とばす」で場面ごと ----
   文は data/text.js（正本は revremit-text.md）。絵はグラフィック班の story\c2（一枚絵・立ち絵）。なければ戦闘の背景を暗くして出す */
const STORY_ART={bg:k=>k.startsWith("fx:")?`assets/c2/fx/c2/revremit_fx_bg_${k.slice(3)}.png`:`assets/c2/story/c2/revremit_story_${k}.png`,bust:(who,face)=>`assets/c2/story/c2/revremit_story_bust_${who.toLowerCase()}_${face||"normal"}.png`};
/* 表情：文の3つ目に書いてあればそれ、なければ「！」で surprise・「……」で serious */
/* ★v0.19.1：表情は行ごとに text.js の3つ目の欄で決める（tech-notes 1-6-1 の表）。書いていない行は「！」なら surprise、ほかは normal。
   前は YUKI の「……」はじまりを serious にしていたので、こゆきの行がほとんど険しい顔になっていた */
function faceOf(l){if(l[2]&&l[2]!=="tag")return l[2];if(/！/.test(l[1]))return"surprise";return"normal"}
const artHave=p=>window.ART_HAVE&&ART_HAVE.has(p);
const artURL=p=>(window.ART_EMBED&&ART_EMBED[p])||p;
/* ★v0.19：戦闘の上の一言（零号の第2形態は2行を順に。1行 2.5秒） */
function toastNow(){const q=S.toastQ;if(!q||!q.length)return"";const i=Math.floor((Date.now()-S.toastT)/2500);if(i>=q.length){S.toastQ=null;return""}
  const l=q[i];return `<div class="toast" ${at(160,90,320)}><span class="scname">${esc(TEXT.names[l[0]]||"")}</span> <span class="tt">${esc(l[1].replace(/<br>/g,"\n"))}</span></div>`}
/* 絵の名前 "a|b"：a があれば a、なければ b（グラフィック班の新しい絵が来るまでの代わり） */
function storyBg(k){if(!k)return"";for(const x of String(k).split("|")){const p=STORY_ART.bg(x);if(artHave(p))return p}return""}
/* 話す人：GHOST:名前＝ボスの声（名前を灰色）・REC＝記録のかけら（名前なし）。文の〈 〉は text.md の文に入っている */
function whoName(who){if(!who||who==="REC")return"";if(who.startsWith("GHOST:"))return who.slice(6);return TEXT.names[who]||""}
/* ★v0.22：仲間で走っているときは、場面の ID に "_hina" などがあればそれ。なければ YUKI の話の場面（ボスの前後・エンディングなど）は出さない（その子の話は他班が書いている途中） */
const YUKI_ONLY=/^(first_remit|area[123]|boss[123]_(pre|post|phase)|ed1|roadlog_001|ed1_after|rest_first)$/;
function sceneKey(key){const ch=G&&G.char;if(!ch||ch==="YUKI")return key;const lc=ch.toLowerCase(),k2=key+"_"+lc;if(TEXT.scenes[k2])return k2;return YUKI_ONLY.test(key)?null:key}
function showScene(key,done){const bk=key,k0=sceneKey(key);if(k0!==key){if(!k0){done&&done();return}key=k0}
  const sc=TEXT.scenes[key];if(!sc){done&&done();return}
  setScreen("scene");setScene(A.mode==="battle"&&!sc.under?"battle":"dim");closeModal();if(sc.under)setBg(sc.under);
  S.sc={key,sc,i:0,shown:0,done,t:null};SND.bgm(bk==="ed1"||bk==="ed1_after"?"ending":bk==="roadlog_001"?"pzlog":bk==="__t"||/^run_start/.test(bk)||bk==="rest_first"||/^area/.test(bk)?(G?"map_"+({street:"street",touge:"touge",circuit:"circuit"}[curArea().key]||"street"):"talk"):"talk");if(!sc.lines.length&&sc.title){S.sc.titleOnly=true}
  sceneLine()}
function sceneText(){const s=S.sc,l=s.sc.lines[s.i];return l?l[1].replace(/<br>/g,"\n"):""}
/* ★v0.22 QA の指摘：MIO が絵にいないのに話す場面（ROAD の中など）は、帯に「通信」の印と通信の音（audio.js v0.6 の comm_open・comm_blip）。
   MIO がその場にいるのは、ガレージの場面（導入・オープニング・エンディングの6行目から・加わる話）だけ */
const MIO_HERE=/^(prologue|op|ed1_after\w*|join_\w+|next_sora)$/;
/* ★v0.22.2 仲間の編：エンディングは「.50 CAL のガレージ」の行から、○○_op は「ROAD。」の行までがガレージ */
function mioComm(s,i){const l=s.sc.lines[i];if(!l||l[0]!=="MIO")return false;const L=s.sc.lines,at=re=>L.findIndex(x=>re.test(x[1]||""));
  if(/^ed1/.test(s.key)&&!/after/.test(s.key)){const g=at(/^\.50 CAL のガレージ/);return g<0||i<g}
  if(/_op$/.test(s.key)){const r=at(/^ROAD。/);return r>=0&&i>=r}
  return!MIO_HERE.test(s.key)}
function sceneLine(){const s=S.sc;clearInterval(s.t);s.shown=0;const full=sceneText(),comm=mioComm(s,s.i);
  if(comm&&!mioComm(s,s.i-1))SND.se("comm_open");if(!comm&&s.i>0&&mioComm(s,s.i-1))SND.se("comm_close");
  if(comm&&/^ボスです/.test(full))SND.se("comm_glitch");// ★v0.22.6 通信の「ボスです……」の行で1回（audio-list 6-0）
  if(/^カシャ/.test(full))SND.se("photo_shutter");// ★v0.22.2 MOMO 編の写真の音
  if(s.key==="next_sora"){/* ★v0.22.4 audio-list 6-0：始まりで BGM を止める・9行目 そらが録った起動音・15行目 起動音 */
    if(s.i===0)SND.bgmStop();if(s.i===8)SND.se("gate_boot",{rec:true});if(s.i===14)SND.se("gate_boot")}
  else if(/^起動音/.test(full)){SND.bgmStop();SND.se("gate_boot")}// ★v0.22.1 CROSS GATE の起動音（audio-list 6-2）
  if(full){s.t=setInterval(()=>{s.shown++;if(s.shown%3===1)SND.se(comm?"comm_blip":"text_blip");if(s.shown>=full.length){s.shown=full.length;clearInterval(s.t)}renderScene()},30)}
  renderScene()}
/* ★v0.18.2（ちかちかの直し）：絵（一枚絵・立ち絵）は変わったときだけ入れかえる。
   前は1文字出すたび（30ms ごと）に #ui を丸ごと作り直し、<img> も毎回作り直していたので、スマホで絵が一瞬消えて点滅していた */
function renderScene(){const s=S.sc;if(!s||window.SCREEN!=="scene")return;const sc=s.sc,l=sc.lines[s.i]||[null,""],who=l[0];
  let bgk=sc.bg;(sc.bgs||[]).forEach(([i,k])=>{if(s.i>=i)bgk=k});// 行ごとに絵を変える（エンディング：1〜4行 boss3_after・5行から ending）
  const bgp=storyBg(bgk);
  /* ★v0.20.1：キャラが描いてある一枚絵（opening_road・ending_garage）の上には立ち絵を出さない（2人が重なるため）。名前は帯に出る */
  const bgHasChars=/revremit_story_(opening_road(_hina|_momo|_nana)?|ending_garage|join_morning|join_bar_night|join_bar_nana)\.png/.test(bgp);/* ★v0.22.9 加わる話の一枚絵にもキャラが描いてある */
  const comm=mioComm(s,s.i);
  const bwho=who&&who.replace(/_IN$/,""),bw0=!bgHasChars&&/^(YUKI|MIO|HINA|MOMO|NANA)$/.test(bwho||"")?STORY_ART.bust(bwho,faceOf(l)):null,/* ★v0.22.2 仲間の立ち絵（あれば） */bw=bw0&&artHave(bw0)?bw0:"",bx=who==="MIO"?360:24;
  const u=ui();let root=u.querySelector(":scope > .scroot");
  if(!root||root.dataset.key!==s.key){
    u.innerHTML=`<div class="scroot" data-key="${esc(s.key)}"><div class="scbgw"></div><div class="scbw"></div><div class="tap" ${at(0,0,640,360)} onclick="sceneTap()"></div>
     ${sc.title?`<div class="sctitle${sc.file?" file":""}" ${at(0,sc.file?40:120,640)}>${esc(sc.title)}</div>`:""}
     ${sc.lines.length?`<div class="scband" ${at(0,270,640,90)} onclick="sceneTap()"><div class="scname"></div><div class="sctext"></div><div class="scnext small"></div></div>`:""}
     <button class="mini" ${at(568,6,64,18)} onclick="sceneSkip()">${esc("とばす")}</button></div>`;
    root=u.querySelector(":scope > .scroot")}
  // 一枚絵：ファイルが変わったときだけ
  const bgw=root.querySelector(".scbgw");if(bgw.dataset.f!==bgp){bgw.dataset.f=bgp;bgw.innerHTML=bgp?`<img class="px scbg" src="${artURL(bgp)}" ${at(0,0,640,360)} decoding="sync">`:`<div class="scdim${sc.light?" light":""}" ${at(0,0,640,360)}></div>`}
  // 演出（オープニング 13行目からのノイズ）：点滅させない。ゆっくり流れる走査線だけ（ちかちか対策・1秒に3回以下の明滅も起こさない）
  let fx="";(sc.fx||[]).forEach(([i,k])=>{if(s.i>=i)fx=k});if((root.dataset.fx||"")!==fx){root.dataset.fx=fx;root.classList.toggle("fx-noise",fx==="noise")}
  // 立ち絵：ファイルか場所が変わったときだけ。新しい絵は読み終わってから見せる（読み終わるまでは前の絵のまま）
  const bww=root.querySelector(".scbw"),bk=bw+"@"+bx;
  if(bww.dataset.f!==bk){bww.dataset.f=bk;
    if(!bw)bww.innerHTML="";
    else{const im=new Image();im.className="px bust";im.src=artURL(bw);Object.assign(im.style,{position:"absolute",left:bx+"px",top:"18px",width:"256px",height:"256px"});
      const put=()=>{if(bww.dataset.f===bk){bww.innerHTML="";bww.appendChild(im)}};
      if(im.complete&&im.naturalWidth)put();else if(im.decode)im.decode().then(put,put);else im.onload=put}}
  const band=root.querySelector(".scband");if(band){const name=whoName(who),txt=sceneText().slice(0,s.shown);
    band.classList.toggle("comm",comm);band.className=`scband${comm?" comm":""}${who&&who!=="REC"?"":" nar"}${who==="FILE"?" file":""}${who==="REC"?" rec":""}${who&&who.startsWith("GHOST:")?" ghost":""}${!who&&l[2]==="tag"?" tag":""}`;
    const nm=band.querySelector(".scname");nm.innerHTML=(comm?'<span class="commk">通信</span>':"")+esc(name);nm.style.display=name?"":"none";
    band.querySelector(".sctext").textContent=/_IN$/.test(who||"")?"（"+txt+"）":txt;
    band.querySelector(".scnext").textContent=s.shown>=sceneText().length?"▼":""}}
function sceneTap(){const s=S.sc;if(!s)return;const full=sceneText();
  if(s.shown<full.length){s.shown=full.length;clearInterval(s.t);renderScene();return}
  SND.se("text_next");s.i++;if(s.i>=s.sc.lines.length){sceneEnd();return}sceneLine()}
function sceneSkip(){SND.se("ui_cancel");sceneEnd()}
function sceneEnd(){const s=S.sc;if(!s)return;clearInterval(s.t);if(mioComm(s,s.i)||mioComm(s,s.i-1))SND.se("comm_close");S.sc=null;seenSet(s.key);s.done&&s.done()}
/* エリアの入り口（初めてのときだけ一言。2回目からはエリア名だけ） */
function areaIntro(ai,done){const k="area"+(ai+1),sc=TEXT.scenes[k];if(!sc){done();return}
  if(!sceneKey(k)||seenGet()[sceneKey(k)]){TEXT.scenes.__t.title=sc.title||"";showScene("__t",done);return}showScene(k,done)}
TEXT.scenes.__t={title:"",lines:[]};

/* ★v0.18.3：戻る／出るボタンは全部の画面で同じ形・同じ場所（右上の角 (532,22) 104×32）。640 の部品のボタン・太字・黒とライムの縁取りで背景から浮かせる */
const BACK_XY=[532,22,104,32];
function backBtn(label,on){return `<button class="back u9 main" ${at(...BACK_XY)} onclick="${on}">◀ ${esc(label)}</button>`}
/* ---- 小窓 ---- */
function modal(html){$("#modal").innerHTML=`<div class="modal"><div class="box">${html}</div></div>`}
function closeModal(){const m=$("#modal");if(m)m.innerHTML=""}

/* ---- はじめる ---- */
/* ★v0.18.1：読みこみ中の進み具合（％と棒） */
function loadingProg(d,n){const u=ui();if(!u)return;const pc=n?Math.floor(d*100/n):0;
  u.innerHTML=`<div class="loading" ${at(170,150,300,60)}><div class="h">読み込み中…　${pc}%</div><div class="lbar"><i style="width:${pc}%"></i></div><div class="small dim">${d}/${n}</div></div>`}
/* ★v0.18.1：全画面のボタン（requestFullscreen が使える端末だけ。iPhone の Safari・ホーム画面から開いたときは出さない） */
const FS_OK=()=>{const d=document.documentElement;return !!(d.requestFullscreen||d.webkitRequestFullscreen)&&document.fullscreenEnabled!==false&&!matchMedia("(display-mode: fullscreen)").matches&&!matchMedia("(display-mode: standalone)").matches};
const isFS=()=>!!(document.fullscreenElement||document.webkitFullscreenElement);
function toggleFS(){const d=document.documentElement;
  if(isFS()){(document.exitFullscreen||document.webkitExitFullscreen).call(document);return}
  const p=(d.requestFullscreen||d.webkitRequestFullscreen).call(d,{navigationUI:"hide"});
  Promise.resolve(p).then(()=>{try{screen.orientation&&screen.orientation.lock&&screen.orientation.lock("landscape").catch(()=>{})}catch(e){}}).catch(()=>{toast2("全画面にできませんでした")})}
function toast2(t){const u=ui();if(!u)return;const d=document.createElement("div");d.className="toast2";d.textContent=t;Object.assign(d.style,{left:"200px",top:"300px",width:"240px",position:"absolute"});u.appendChild(d);setTimeout(()=>d.remove(),2000)}
/* ★v0.20.1：タッチ画面の長押しで右クリックのメニューを出さない・絵を長押ししてもドラッグを始めない（Windows のタッチ） */
document.addEventListener("contextmenu",e=>e.preventDefault());document.addEventListener("dragstart",e=>e.preventDefault());
document.addEventListener("selectstart",e=>{if(!(e.target&&e.target.closest&&e.target.closest("input,textarea")))e.preventDefault()});
document.addEventListener("fullscreenchange",()=>{setTimeout(fit,50);if(window.SCREEN==="title")showTitle()});
SAVE.boot();
(async function(){fit();animInit($("#cv"));loadingProg(0,0);await loadArt();if(document.fonts&&document.fonts.ready)await Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,1500))]);
  /* ★v0.20：スロットにデータがあれば、はじめにデータをえらぶ（初めての人・テストはそのままタイトル） */
  if([1,2,3].filter(n=>{try{return localStorage.getItem(SAVE_KEYS[n])!=null}catch(e){return false}}).length>1||SAVE.migrated)showData();else showTitle()})();

/* ===================== ★v0.21 β：夜・解放・ログ・強化ショップ（design 9章・tech-notes 1-15）===================== */
const PRF=()=>SAVE.cur.profile;
function deckUL(){return SAVE&&SAVE.cur?unlockedCards(PRF()):null}
function nightMaxAvail(){return Math.min(typeof BETA_NIGHTS==="number"?BETA_NIGHTS:NIGHTS.length,NIGHTS.length,(PRF().unlock.nightMax||0)+1)}
function curNight(){const n=+PRF().night||nightMaxAvail();return Math.max(1,Math.min(n,nightMaxAvail()))}
function labOpen(){return(PRF().unlock.nightMax||0)>=1||PRF().log>0}
function runOpts(){const p=PRF();return{night:curNight(),ul:{cards:unlockedCards(p),parts:unlockedParts(p)},hidden:(p.unlock.nightMax||0)>=1}}
function pickNight(){const mx=nightMaxAvail(),cur=curNight(),U=TEXT.ui,last=typeof BETA_NIGHTS==="number"?BETA_NIGHTS:NIGHTS.length;
  modal(`<div class="h">夜をえらぶ</div><div class="small dim">決まりは前の夜のぶんに足されていく。クリアすると次の夜が開く</div><div class="scroll nlist" style="height:190px">`+
    NIGHTS.slice(0,last).map(x=>{const lab=x.n===NIGHTS.length?U.night_last:U.night_label.replace("{n}",x.n),bl=nightRules(x.n).noBlow||x.n<3||/ブロー/.test(x.add)?"":`<span class="nblow">${esc(U.night_blow)}</span>`;
      return x.n<=mx?`<button class="${x.n===cur?"main":""} nrow" onclick="PRF().night=${x.n};SAVE.auto();closeModal();SND.jingle('night_select',{lv:${x.n}});showTitle()"><b>${esc(lab)}</b>${bl}　<span class="small">${esc(x.add)}</span></button>`
        :`<button class="nrow" disabled><b>${esc(lab)}</b>　<span class="small dim">${esc(U.night_lock)}</span></button>`}).join("")+
    `</div><div class="row"><button onclick="closeModal()">とじる</button></div>`)}
/* ★v0.22 ブローが入る夜に初めて入るとき（design 8-6・text 12-1）。どのキャラでも1回だけ。4行目は走るキャラ */
function blowIntro(done){if(!G||G.night<3||noBlow()||seenGet().night3_first){done();return}
  const sc=TEXT.scenes.night3_first;sc.lines=sc.lines.slice(0,3).concat([TEXT.night3Last[G.char]||TEXT.night3Last.YUKI]);showScene("night3_first",done)}
/* ===== ★v0.22 キャラ選び（design 9-10・text 12-2）。加わる話を見たら選べる。スロットごと ===== */
function charsOpen(){const u=PRF().unlock;return CHAR_ORDER.filter(c=>c==="YUKI"||(u.chars||[]).includes(c))}
function curChar(){const c=PRF().char;return charsOpen().includes(c)?c:"YUKI"}
function showChars(){setScreen("chars");setScene("dim");setBg("garage");closeModal();SND.bgm("select");S.chSel=S.chSel||curChar();renderChars()}
function renderChars(){const op=charsOpen(),sel=S.chSel;
  let h=`<div class="hdr" ${at(8,6,300,18)}>キャラをえらぶ</div>${backBtn("もどる","showTitle()")}`;
  CHAR_ORDER.forEach((c,i)=>{const C=CHARS[c],on=op.includes(c),x=16+i*152;
    h+=`<button class="u9 chcard${sel===c?" main":""}${on?"":" lock"}" ${at(x,60,144,150)} ${on?`onclick="S.chSel='${c}';SND.se('ui_ok');renderChars()"`:"disabled"}>
      <div class="chn">${esc(c)}</div><div class="small">${esc(TEXT.names[c]||"")}</div><div class="small dim">${esc(C.carName)}</div>
      ${on?`<div class="small">${esc(C.type)}</div><div class="small dim">${C.car.gears}速・耐久 ${C.car.hp}</div>`:`<div class="small dim">NIGHT ${C.join} を<br>クリアで加わる</div>`}</button>`});
  const C=CHARS[sel];
  h+=`<div class="sign" ${at(16,220,456,96)}><div class="h">${esc(sel)}（${esc(TEXT.names[sel]||"")}）　${esc(C.carName)} → ${esc(C.weapon||"")}</div>
    <div class="small">型：${esc(C.type)}　${C.car.gears}速・レッド ${C.car.red}・リミット ${C.car.limit}・耐久 ${C.car.hp}</div>
    <div class="small">${esc(C.ruleTxt||"キャラの決まりなし（基準）")}</div><div class="small dim">固有スキル：${esc(CARDS[C.skill].n)}</div></div>
    <button class="main u9" ${at(484,232,140,40)} onclick="PRF().char=S.chSel;SAVE.auto();S.deck=null;showTitle();toast2((TEXT.names[S.chSel]||S.chSel)+'で走ります')">${esc(TEXT.names[sel]||sel)}で走る</button>`;
  ui().innerHTML=h}
/* ランの終わり：解放・夜・ログをスロットに書く（1ランに1回）。戻り値＝このランのログ */
function runEnd(clear,rank){if(S.runEndG===G)return S.runEndLog;S.runEndG=G;const p=PRF(),u=p.unlock,got=[];
  if(!G.night){S.runEndLog=0;return 0}// 夜なし（テスト・α の道）は数えない
  const beforeC=new Set(unlockedCards(p)),beforeP=new Set(unlockedParts(p));
  const area=a=>{[a,G.char+":"+a].forEach(k=>{if(!u.areas.includes(k))u.areas.push(k)})};if(G.st.bosses>=1)area("a1");if(G.st.bosses>=2)area("a2");if(clear)area("clear");
  S.joinQ=[];
  (G.hiddenWon||[]).forEach(id=>{if(!u.cards.includes(id))u.cards.push(id)});
  if(clear&&G.night>(u.nightMax||0)){u.nightMax=G.night;const o=NIGHTS[G.night-1].open||{};(o.chars||[]).forEach(c=>{if(!u.chars.includes(c)){u.chars.push(c);S.joinQ.push(c)}});(o.story||[]).forEach(c=>{if(!u.story.includes(c))u.story.push(c)});
    if(G.night<Math.min(NIGHTS.length,typeof BETA_NIGHTS==="number"?BETA_NIGHTS:99))got.push("夜："+TEXT.ui.night_open.replace("{n}",G.night+1));(o.chars||[]).forEach(c=>got.push(`仲間：${TEXT.ui.ally_join.replace("{name}",TEXT.names[c]||c)}`));
    if(o.next&&typeof BETA_NIGHTS==="number"&&G.night>=BETA_NIGHTS)S.joinQ.push("__next")}
  unlockedCards(p).filter(id=>!beforeC.has(id)).forEach(id=>got.push("カード："+CARDS[id].n));
  unlockedParts(p).filter(id=>!beforeP.has(id)).forEach(id=>got.push("パーツ："+PARTS[id].n));
  const lg=runLog(clear,rank);p.log=(p.log||0)+lg.total;S.runEndLog=lg.total;S.runGot=got;S.runLogParts=lg;SAVE.auto();return lg.total}
/* ミニカーを作ったあと：S 以上なら次のカード。このランで開いたものをまとめて見せてからタイトルへ */
function afterCar(m){const p=PRF(),got=(S.runGot||[]).slice();
  const ch=G&&G.char||"YUKI",sl=sRankList(ch),sc=sCountOf(p,ch);
  if(G&&G.night&&m&&["S","SS","SSS"].includes(m.rank)&&sc<sl.length){if(UNLOCK.chars[ch]){p.unlock.sCountC=Object.assign({},p.unlock.sCountC);p.unlock.sCountC[ch]=sc+1}else p.unlock.sCount=sc+1;
    unlockRecalc(p);const id=sl[sc];if(CARDS[id])got.push(`カード：${CARDS[id].n}（S ランク以上のミニカー）`);SAVE.auto()}
  const jq=(S.joinQ||[]).slice();S.joinQ=[];if(jq.length){playJoins(jq,()=>afterCarShow(got));return}
  afterCarShow(got)}
/* ★v0.22 仲間が加わる話（NIGHT 1・2・3 の初クリア）・β の終わり（NIGHT 4 のクリア＝「次の仲間は……？」） */
function playJoins(q,done){const c=q.shift();if(!c){done();return}const next=()=>playJoins(q,done);
  if(c==="__next"){showScene("ally_next",()=>showScene("next_sora",next));SND.jingle("ally_next");return}/* ★v0.22.2 text 15章 SORA の予告・★v0.22.4 札でジングル ally_next（会話の曲は止まる） */
  SND.jingle("ally_join",{who:c.toLowerCase()});const k="join_"+c.toLowerCase();
  if(TEXT.scenes[k])showScene(k,next);
  else{TEXT.scenes["join_tmp"]={light:1,lines:[[null,TEXT.ui.ally_join.replace("{name}",TEXT.names[c]||c)+"。"]]};showScene("join_tmp",next)}}
function afterCarShow(got){const p=PRF();
  {const nu=got.find(t=>t.startsWith("夜："));if(nu)setTimeout(()=>SND.jingle("night_up",{lv:+(nu.match(/\d+/)||[1])[0]}),300)}
  S.runGot=null;if(!got.length&&!S.runEndLog){showTitle();return}
  /* 種類ごとに1行にまとめる（初めてのクリアは20こ近く開くため） */
  const grp={};got.forEach(t=>{const k=t.includes("：")?t.split("：")[0]:"";(grp[k]=grp[k]||[]).push(k?t.slice(k.length+1):t)});
  const lines=Object.entries(grp).map(([k,v])=>`<div class="small">${k?`<b>${esc(k)}</b>　`:""}${v.map(esc).join("・")}</div>`).join("");
  showTitle();modal(`<div class="h">このランで</div><div class="small">ログ +${S.runEndLog||0}（合計 ${p.log}）</div>${lines?`<div class="scroll" style="max-height:170px">${lines}</div>`:""}<div class="row"><button class="main" onclick="closeModal();showTitle()">OK</button></div>`)}
/* 強化ショップ：ログでカードを解放（design 9-7。名前は案「ログ」） */
function showLab(){setScreen("lab");setScene("dim");setBg("garage");closeModal();SND.bgm("lab");S.labSel=S.labSel||UNLOCK.shop[0][0];renderLab()}
function renderLab(){const p=PRF(),have=new Set(unlockedCards(p)),sel=S.labSel,pr=(UNLOCK.shop.find(x=>x[0]===sel)||[])[1];
  ui().innerHTML=`<div class="hdr" ${at(8,6,300,18)}>みおのラボ</div><div class="sign" ${at(330,26,190,30)}><div class="h">${itemIcon("money",24)} ログ ${p.log}</div></div>
  ${backBtn("もどる","showTitle()")}<div class="sign" ${at(8,26,300,260)}></div>
  <div class="small" ${at(16,32,284)}><span class="nmtag">みお</span>ロガーに残った記録から、カードを作れます……！</div>`+
  UNLOCK.shop.map(([id,price],i)=>{const d=CARDS[id],own=have.has(id);return `<button class="u9 lrow${sel===id?" main":""}" ${at(16,52+i*44,284,40)} onclick="S.labSel='${id}';renderLab()"><span class="ln">${esc(d.n)}</span><span class="small dim"> ${RARITY_JP[d.r]}</span><span class="lp ${own?"dim":p.log>=price?"gold":"ngc"}">${own?"解放ずみ":"ログ "+price}</span></button>`}).join("")+
  (sel?cardBig(sel,{art:true,attrs:at(380,64,140,184)})+(have.has(sel)?`<div class="small dim" ${at(330,262,240)}>解放ずみ（報酬・デッキに出る）</div>`:
    `<button class="main u9" ${at(380,258,140,32)} ${p.log>=pr?"":"disabled"} onclick="labBuy('${sel}')">ログ ${pr} で開く</button>`):"")}
function labBuy(id){const p=PRF(),it=UNLOCK.shop.find(x=>x[0]===id);if(!it||unlockedCards(p).includes(id))return;if(p.log<it[1]){SND.se("card_cant");toast2("みお：ログが、足りません……");return}p.log-=it[1];SAVE.unlock("cards",id);SND.se("upgrade_buy");setTimeout(()=>SND.se("card_unlock"),500);toast2(`「${CARDS[id].n}」を開きました`);renderLab()}

/* ===================== ★テスト用の口（QA・レベルデザイン班・デザイン班）=====================
   qaSetProgress({slot,nightMax,night,cards,parts,chars,log,tutorial,sCount})：進み具合を一度に作ってスロットに書く。
     cards："start"（初めからだけ）｜"all"（40種ぜんぶ）｜[id,...]（START に足す）。parts も同じ（"start"｜"all"｜[id]）。
   qaNewRun({mode,night})：その状態でランを始めてマップへ（会話はとばす）。戻り値：{night,cards,parts} */
function qaSetProgress(o){o=o||{};if(o.slot)SAVE.slot=o.slot;const p=PRF(),u=p.unlock;
  if(o.tutorial!=null)p.tutorial=!!o.tutorial;else p.tutorial=true;
  if(o.nightMax!=null)u.nightMax=Math.max(0,Math.min(NIGHTS.length,+o.nightMax));if(o.night!=null)p.night=+o.night;
  if(o.cards==="all"){u.areas=["a1","a2","clear"];u.sCount=UNLOCK.sRank.length;u.cards=uniq([...UNLOCK.sRank,...UNLOCK.hidden,...UNLOCK.shop.map(x=>x[0])])}
  else if(o.cards==="start"){u.areas=[];u.sCount=0;u.cards=[]}else if(Array.isArray(o.cards))u.cards=uniq(u.cards.concat(o.cards));
  if(o.parts==="all")u.parts=Object.keys(PARTS);else if(o.parts==="start")u.parts=[];else if(Array.isArray(o.parts))u.parts=uniq(u.parts.concat(o.parts));
  if(Array.isArray(o.chars))u.chars=uniq(u.chars.concat(o.chars));if(o.log!=null)p.log=+o.log;if(o.sCount!=null)u.sCount=+o.sCount;
  SAVE.auto();return{slot:SAVE.slot,nightMax:u.nightMax,night:curNight(),cards:unlockedCards(p).length,parts:unlockedParts(p).length,log:p.log}}
function qaNewRun(o){o=o||{};if(o.night)PRF().night=o.night;const ss=window.showScene;window.showScene=(k,d)=>{seenSet(k);d&&d()};try{newRun(o.mode||"MT")}finally{window.showScene=ss}
  return{night:G.night,cards:G.ul.cards.length,parts:G.ul.parts.length,hidden:G.map.flat().filter(n=>n.k==="hidden").length}}
