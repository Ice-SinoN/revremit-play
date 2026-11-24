/* js/codex.js（プログラム班②） */
"use strict";
/* ===== 図鑑（progression 1-25 の 1）とサウンド・イラストライブラリ（1-26 の 9）=====
   入口：タイトルの「図鑑」（ランの中からは開かない）。ガレージの入口は①と相談（rr2-hooks.md）。
   画面は #stage の上にかぶせる層（#rr2v）。下の画面はそのまま残るので、閉じると元の画面にもどる（setScreen は変えない）。
   タブ：カード（ふつう／強化）・パーツ・敵・ボス・ミニカー・サウンド・イラスト・用語集。
   見ていないもの：黒いシルエット＋「？？？」＋手に入れ方のヒント1行。達成率はタブごと（用語集は数えない）。
   並び（640×360）：タブ y18・高さ28／絞りこみと達成率 y52／左に一覧（8,82 300×270・上下に動かせる）／右に1つの中身（316,82 316×270）／右上の角に「◀ もどる」。
   ★項目・並び・文はデザイン班・シナリオ班の決めが来たら差しかえる（いまは progression 1-25・1-26 の表のまま・文は仮）。 */
const CDX_TABS=[["card","カード"],["part","パーツ"],["enemy","敵"],["boss","ボス"],["mini","ミニカー"],["snd","サウンド"],["img","イラスト"],["gloss","用語集"]];
const CDX={tab:"card",sel:null,up:false,who:"all",gsort:"yomi",from:null};

/* ---- 「見た」を数える（RRHOOK から）---- */
RRHOOK.on("seen_cards",o=>(o.ids||[]).forEach(id=>{if(CARDS[id]&&!CARDS[id].gen)RR2.mark("c",id)}));
RRHOOK.on("upgraded",o=>{RR2.mark("c",o.id);RR2.mark("cu",o.id)});
RRHOOK.on("card_used",o=>{if(CARDS[o.id])RR2.mark("use",o.id,1)});
RRHOOK.on("seen_parts",o=>(o.ids||[]).forEach(id=>{if(PARTS[id])RR2.mark("p",id)}));
RRHOOK.on("battle_start",o=>RR2.mark("e",cdxEKey(o.key,o.hidden)));
RRHOOK.on("battle_win",o=>RR2.mark("k",cdxEKey(o.key,o.hidden),1));
RRHOOK.on("minicar_made",o=>RR2.mark("m",o.char+"|"+o.rank));
RRHOOK.on("seen_snd",o=>RR2.mark("snd",o.id));
RRHOOK.on("seen_img",o=>{const k=cdxImgKey(o.path);if(k)RR2.mark("img",k)});
/* 前の版のセーブから分かる分だけ埋める（作ったミニカー・持っているパーツの付いたミニカー）。1回だけ */
function cdxBackfill(){const p=RR2.P(),c=RR2.cx();if(!p||!c||c.bf)return;c.bf=1;
  try{normMinicars(p.minicars).forEach(m=>{c.m[m.char+"|"+m.rank]=1;m.cards.forEach(x=>{c.c[x.id]=1;if(x.up)c.cu[x.id]=1});if(m.part)c.p[m.part]=1})}catch(e){}}
const cdxEKey=(k,h)=>(h?"hidden:":"")+k;
const cdxImgKey=p=>{const m=String(p||"").match(/revremit_story_(.+)\.png$/);return m&&!/^bust_/.test(m[1])?m[1]:null};

/* ---- 並べる物 ---- */
const CDX_RORD={C:0,R:1,E:2,SK:3,OG:9};
function cdxCards(){const o=["N"].concat(typeof CHAR_ORDER!=="undefined"?CHAR_ORDER:["YUKI"]);
  return Object.keys(CARDS).filter(id=>{const d=CARDS[id];return!d.gen&&d.t!=="jam"}).sort((a,b)=>{const A=CARDS[a],B_=CARDS[b];
    return(o.indexOf(A.own)-o.indexOf(B_.own))||((CDX_RORD[A.r]||0)-(CDX_RORD[B_.r]||0))})}
function cdxParts(){const o=["N"].concat(typeof CHAR_ORDER!=="undefined"?CHAR_ORDER:["YUKI"]);return Object.keys(PARTS).sort((a,b)=>o.indexOf(PARTS[a].own)-o.indexOf(PARTS[b].own))}
function cdxEnemies(boss){const L=[];AREAS.forEach((A_,i)=>{if(!boss){A_.pool.forEach(k=>L.push({key:k,a:i}));L.push({key:A_.elite,a:i,elite:1})}else L.push({key:A_.boss,a:i})});
  if(boss)Object.keys(ENEMIES).filter(k=>ENEMIES[k].ally).forEach(k=>L.push({key:k,a:2,ally:ENEMIES[k].ally}));
  else AREAS.forEach((A_,i)=>L.push({key:A_.elite,a:i,hidden:1}));/* 裏道（エリートの ×1.1） */
  return L.map(x=>Object.assign(x,{id:cdxEKey(x.key,x.hidden)}))}
const CDX_RANKS=()=>typeof RANKS!=="undefined"?RANKS:["E","D","C","B","A","S","SS","SSS"];
function cdxMinis(){const L=[];(typeof CHAR_ORDER!=="undefined"?CHAR_ORDER:["YUKI"]).forEach(ch=>CDX_RANKS().forEach(r=>L.push({id:ch+"|"+r,ch,r})));return L}
/* 曲（AUDIO の BGM・ジングル。SE とエンジン音は入れない）。名前は仮（サウンド班・シナリオ班の名前が来たら差しかえ） */
const CDX_SND_JP={title:"タイトル",map_street:"マップ：ストリート",map_touge:"マップ：峠",map_circuit:"マップ：サーキット",battle_street:"戦闘：ストリート",battle_touge:"戦闘：峠",battle_circuit:"戦闘：サーキット",
  elite:"エリート",hidden:"裏道",boss_zankou:"ボス：残光",boss_byakuya:"ボス：白夜",boss_zerogou:"ボス：零号",boss_kuuten:"ボス：空転",boss_sanka:"ボス：散花",boss_miketsu:"ボス：未決",
  theme_hina:"ひなのテーマ",theme_momo:"もものテーマ",theme_nana:"ななみのテーマ",talk:"会話",ending:"エンディング",pzlog:"走行記録",shop:"ショップ",result:"リザルト",tutorial:"チュートリアル",lab:"みおのラボ",select:"キャラ選び",
  win:"勝ち",one_turn_kill:"ワンターンキル",gameover:"負け",hidden_win:"裏道の勝ち",hidden_escape:"裏道の逃げられた",ally_next:"次の仲間"};
function cdxSndGroup(id,j){if(j)return/^jingle_win_|^win$|one_turn_kill/.test(id)?"勝ち曲":"ジングル";
  if(/^boss_/.test(id))return"ボス";if(/^theme_/.test(id))return"その子の曲";if(/^map_/.test(id))return"マップ";if(/^battle_|^elite$|^hidden$/.test(id))return"戦闘";
  if(/^talk|^ending|^pzlog/.test(id))return"話";if(/^title|^select|^lab|^shop|^result|^tutorial/.test(id))return"タイトル・画面";return"そのほか"}
const CDX_SG=["タイトル・画面","マップ","戦闘","ボス","その子の曲","話","勝ち曲","ジングル","そのほか"];
function cdxSnds(){const AU=window.AUDIO||(typeof AUDIO!=="undefined"?AUDIO:null);if(!AU)return[];
  const L=(AU.BGM_IDS||[]).map(id=>({id,j:0})).concat((AU.JINGLE_IDS||[]).map(id=>({id,j:1})));
  L.forEach(x=>{x.g=cdxSndGroup(x.id,x.j);x.n=CDX_SND_JP[x.id]||x.id});return L.sort((a,b)=>CDX_SG.indexOf(a.g)-CDX_SG.indexOf(b.g))}
/* 一枚絵（story/c2 の絵。立ち絵は入れない） */
function cdxImgGroup(k){if(/^opening_road/.test(k))return"ROAD に入る";if(/^join_/.test(k))return"仲間が加わる";if(/^ending/.test(k))return"エンディング";if(/_after$/.test(k))return"撃破";return"話"}
const CDX_IG=["ROAD に入る","仲間が加わる","話","撃破","エンディング","奥義","奥義（金の縁）"];
function cdxImgs(){const H=window.ART_HAVE?[...ART_HAVE]:[];const L=H.map(p=>({p,id:cdxImgKey(p)})).filter(x=>x.id&&/\/story\/c2\//.test(x.p)).concat(cdxOgImgs());
  L.forEach(x=>{if(!x.g)x.g=cdxImgGroup(x.id)});return L.sort((a,b)=>CDX_IG.indexOf(a.g)-CDX_IG.indexOf(b.g)||(a.og?a.ord-b.ord:a.id.localeCompare(b.id)))}

/* ---- ヒント（手に入れ方の1行。仮の文：シナリオ班の文が来たら TEXT.ui.cdx_* で差しかえ）---- */
function cdxCardHint(id){const U=UNLOCK,nm=rr2Name;if(CARDS[id]&&CARDS[id].r==="OG")return cdxOgHint(id);
  if(U.startCards.includes(id))return"はじめから使える";
  const ar={a1:"エリア1 を初めて突破",a2:"エリア2 を初めて突破",clear:"初めての全クリア"};
  for(const k in U.area)if(U.area[k].includes(id))return ar[k];
  if(U.sRank.includes(id))return"S ランク以上のミニカーを作る";if(U.hidden.includes(id))return"裏道で勝つ";
  const sh=U.shop.find(x=>x[0]===id);if(sh)return`みおのラボ（ログ ${sh[1]}）`;
  for(const ch in U.chars||{}){const C=U.chars[ch],n=nm(ch);if(C.start.includes(id))return`${n}が加わると使える`;for(const k of["a1","a2","clear"])if((C[k]||[]).includes(id))return`${n}で${ar[k]}`;
    if((C.sRank||[]).includes(id))return`${n}で S ランク以上のミニカー`;if((C.hidden||[]).includes(id))return`${n}で裏道に勝つ`}
  return"？"}
function cdxPartHint(id){const U=UNLOCK,nm=rr2Name;if(U.startParts.includes(id))return"はじめから出る";
  const ar={a1:"エリア1 を初めて突破",a2:"エリア2 を初めて突破",clear:"初めての全クリア"};for(const k in U.areaParts)if(U.areaParts[k].includes(id))return ar[k];
  try{for(let i=0;i<NIGHTS.length;i++){const o=NIGHTS[i].open||{};if((o.parts||[]).includes(id))return`NIGHT ${i+1} をクリア`}}catch(e){}
  for(const ch in U.chars||{}){const P=U.chars[ch].parts||{};for(const k in P)if(P[k].includes(id))return k==="start"?`${nm(ch)}が加わると出る`:`${nm(ch)}で${ar[k]}`}
  return"？"}
function cdxEnemyHint(x){const A_=AREAS[x.a],a=`エリア${x.a+1}（${A_.n}）`;if(x.hidden)return`${a}の裏道（NIGHT 1 クリアのあと）`;if(x.ally)return`${rr2Name(x.ally)}で走る（サーキットのボスの前）`;
  if(ENEMIES[x.key].rank==="boss")return`${a}のボス`;return x.elite?`${a}のエリート`:`${a}で出る`}

/* ---- 絵 ---- */
const CDX_THUMB={};
function cdxEnemyImg(key){if(CDX_THUMB[key]!==undefined)return CDX_THUMB[key];let u="";
  try{const E=ENEMIES[key];let art=E.art,pal=E.pal;let set=SPR[art];if((!set||set.proc)&&typeof ART_FALLBACK!=="undefined"&&ART_FALLBACK[art]){set=SPR[ART_FALLBACK[art]];}
    if(set&&set.frames){let cv=frameOf(set,"idle",0);if(pal&&typeof palCanvas==="function")cv=palCanvas(cv,pal);u=cv.toDataURL()}}catch(e){u=""}
  return CDX_THUMB[key]=u}
function cdxArt(kind,x,seen,size){const S_=size||40,sil=seen?"":" sil";let im="";
  if(kind==="card"){const t=cardArtTag(x);im=t?t.replace("<img",`<img class="px${sil}" style="width:${S_}px"`):"";
    if(!im&&CARDS[x]&&CARDS[x].r==="OG"&&typeof OUGI_ART!=="undefined"){const A0=OUGI_ART[CARDS[x].og];if(A0&&(A0.cutin1||A0.cutin))im=`<img class="px ogth${sil}" src="${artURL(A0.cutin1||A0.cutin)}" style="width:${S_}px;height:${S_}px" alt="">`}}/* v0.5.7 奥義のカードの絵がまだないあいだはカットインの右（顔）を切りぬく */
  else if(kind==="part"){const t=partIcon(x,S_);im=t?t.replace('class="px',`class="px${sil}`):""}
  else if(kind==="enemy"){const u=cdxEnemyImg(x);im=u?`<img class="px en${sil}" src="${u}" alt="">`:""}
  else if(kind==="mini"){const k="minicar_"+String(x).toLowerCase(),t=artHave(ITEM_ART(k))?itemIcon(k,S_):itemIcon("minicar",S_);im=t?t.replace('class="px',`class="px${sil}`):""}
  return im||`<span class="cdxq">${seen?"・":"？"}</span>`}

/* ---- 画面 ---- */
function rr2Layer(){let v=$("#rr2v");if(!v){v=document.createElement("div");v.id="rr2v";$("#stage").appendChild(v)}
  try{const bg=artURL("assets/c2/bg/c2/revremit_bg_garage_base.png");v.style.backgroundImage=artHave("assets/c2/bg/c2/revremit_bg_garage_base.png")?`linear-gradient(rgba(8,10,20,.78),rgba(8,10,20,.78)),url(${bg})`:""}catch(e){}
  v.classList.add("u640");return v}
function rr2CloseLayer(){const v=$("#rr2v");if(v)v.remove();GLOSS.close()}
function showCodex(tab,from){if(G&&window.SCREEN!=="title"&&from!=="title"){toast2("図鑑はランの外で開けます");return}
  cdxBackfill();CDX.tab=tab||CDX.tab||"card";CDX.sel=null;CDX.from=from||CDX.from;try{SND.se("ui_ok")}catch(e){}renderCodex()}
function cdxResume(){try{if(window.SCREEN==="title"||window.SCREEN==="data")SND.bgm("title")}catch(e){}}
function codexBack(){const w=CDX.tab==="snd";cdxSndStop();rr2CloseLayer();if(w)cdxResume();try{SND.se("ui_cancel")}catch(e){}}
function cdxTabTo(t){if(CDX.tab==="snd"&&t!=="snd"){cdxSndStop();cdxResume()}if(t==="snd"&&CDX.tab!=="snd")try{SND.bgmStop()}catch(e){}CDX.tab=t;CDX.sel=null;try{SND.se("ui_ok")}catch(e){}renderCodex()}
/* タブごとの {一覧, 見たか} */
function cdxItems(t){const c=RR2.cx()||{c:{},cu:{},p:{},e:{},m:{},snd:{},img:{}};
  if(t==="card"){cdxOgSync();let L=cdxCards();if(CDX.who==="OG")L=L.filter(id=>CARDS[id].r==="OG");else if(CDX.who!=="all")L=L.filter(id=>CARDS[id].own===CDX.who);return L.map(id=>({id,seen:CDX.up?!!c.cu[id]:!!c.c[id]}))}
  if(t==="part"){let L=cdxParts();if(CDX.who!=="all")L=L.filter(id=>PARTS[id].own===CDX.who);return L.map(id=>({id,seen:!!c.p[id]}))}
  if(t==="enemy"||t==="boss")return cdxEnemies(t==="boss").map(x=>Object.assign(x,{seen:!!c.e[x.id]}));
  if(t==="mini")return cdxMinis().map(x=>Object.assign(x,{seen:!!c.m[x.id]}));
  if(t==="snd")return cdxSnds().map(x=>Object.assign(x,{seen:!!c.snd[x.id]}));
  if(t==="img")return cdxImgs().map(x=>Object.assign(x,{seen:x.og?cdxOgSeen(x):!!c.img[x.id]}));
  return GLOSS.list(CDX.gsort).map(x=>({id:x.w,d:x,seen:true}))}
/* 達成率（絞りこみなし・カードはふつう＋強化を数える） */
function cdxRate(t){const c=RR2.cx();if(!c)return[0,0];const k=(L,f)=>[L.filter(f).length,L.length];
  if(t==="card"){const L=cdxCards().filter(id=>canUpgradeId(id));const a=cdxCards();return[a.filter(id=>c.c[id]).length+L.filter(id=>c.cu[id]).length,a.length+L.length]}
  if(t==="part")return k(cdxParts(),id=>c.p[id]);if(t==="enemy"||t==="boss")return k(cdxEnemies(t==="boss"),x=>c.e[x.id]);
  if(t==="mini")return k(cdxMinis(),x=>c.m[x.id]);if(t==="snd")return k(cdxSnds(),x=>c.snd[x.id]);if(t==="img")return k(cdxImgs(),x=>x.og?cdxOgSeen(x):c.img[x.id]);return[0,0]}
function canUpgradeId(id){try{return canUpgrade({id,up:false})}catch(e){return true}}
function cdxPct(r){return r[1]?Math.floor(r[0]*100/r[1]):0}
function cdxAll(){let a=0,b=0;CDX_TABS.forEach(([t])=>{if(t==="gloss")return;const r=cdxRate(t);a+=r[0];b+=r[1]});return[a,b]}

function renderCodex(){const v=rr2Layer(),t=CDX.tab,L=cdxItems(t);
  const tabs=CDX_TABS.map(([k,n],i)=>{const r=k==="gloss"?null:cdxRate(k),full=r&&r[1]&&r[0]===r[1];
    return`<button class="u9 cdxt${k===t?" main":""}" ${at(8+i*64,18,62,28)} onclick="cdxTabTo('${k}')">${n}${full?'<i class="cdxfull">★</i>':""}</button>`}).join("");
  let flt="";const W=(k,n)=>`<button class="u9 cdxf${CDX.who===k?" main":""}" onclick="CDX.who='${k}';CDX.sel=null;renderCodex()">${rr2Esc(n)}</button>`;
  if(t==="card"||t==="part")flt=W("all","全部")+W("N","共通")+(typeof CHAR_ORDER!=="undefined"?CHAR_ORDER:["YUKI"]).map(ch=>W(ch,rr2Name(ch))).join("")+
    (t==="card"?W("OG","奥義")+`<button class="u9 cdxf cdxup${CDX.up?" main":""}" onclick="CDX.up=!CDX.up;renderCodex()">${CDX.up?"強化":"ふつう"}</button>`:"");
  if(t==="gloss")flt=`<button class="u9 cdxf${CDX.gsort==="yomi"?" main":""}" onclick="CDX.gsort='yomi';renderCodex()">五十音</button><button class="u9 cdxf${CDX.gsort==="cat"?" main":""}" onclick="CDX.gsort='cat';renderCodex()">型ごと</button>`;
  const r=t==="gloss"?null:cdxRate(t),all=cdxAll();
  const rate=r?`<span class="cdxr">${r[0]}／${r[1]}（${cdxPct(r)}%）</span>`:`<span class="cdxr">${L.length} 語</span>`;
  v.innerHTML=tabs+backBtn("もどる","codexBack()")+`<div class="cdxbar" ${at(8,56,624,28)}><span class="cdxflt">${flt}</span>${rate}<span class="cdxr dim">全体 ${cdxPct(all)}%</span></div>`+
    `<div class="cdxlist cdx-${t}" ${at(8,88,300,264)}>${cdxListHTML(t,L)}</div><div class="cdxdet sign" ${at(316,88,316,264)}>${cdxDetailHTML(t,L)}</div>`;
  const ls=v.querySelector(".cdxlist");if(ls&&CDX.scroll&&CDX.scroll[t])ls.scrollTop=CDX.scroll[t];if(ls)ls.onscroll=()=>{(CDX.scroll=CDX.scroll||{})[t]=ls.scrollTop};
  GLOSS.scan(v)}
function cdxListHTML(t,L){if(!L.length)return`<div class="small dim">まだ何もありません</div>`;
  const sel=x=>CDX.sel===x.id?" sel":"",tap=x=>`onclick="cdxPick('${String(x.id).replace(/'/g,"\\'")}')"`;
  if(t==="mini"){const R=CDX_RANKS();return(typeof CHAR_ORDER!=="undefined"?CHAR_ORDER:["YUKI"]).map(ch=>`<div class="cdxmrow"><span class="cdxmn">${rr2Esc(rr2Name(ch))}</span>${R.map(rk=>{const x=L.find(y=>y.id===ch+"|"+rk);
    return`<button class="cdxm${x.seen?" on":""}${sel(x)}" ${tap(x)}>${x.seen?rk:"？"}</button>`}).join("")}</div>`).join("")}
  if(t==="snd"||t==="img"||t==="gloss"){let g="",h="";const key=t==="gloss"?(CDX.gsort==="cat"?x=>x.d.cat:x=>x.d.yomi[0]):x=>x.g;
    L.forEach(x=>{const k=key(x);if(k!==g){g=k;h+=`<div class="cdxg">${rr2Esc(k)}</div>`}
      const nm=t==="snd"?(x.seen?x.n:"？？？"):t==="img"?(x.seen?"":"？？？"):x.id;
      h+=t==="img"?`<button class="cdxi${x.og?" og":""}${x.gold?" gold":""}${sel(x)}" ${tap(x)}>${x.seen?`<img class="px" src="${artURL(x.p)}" alt="">`:`<span class="cdxq">？</span>`}</button>`
        :`<button class="cdxrow${x.seen?"":" no"}${sel(x)}" ${tap(x)}>${t==="snd"&&CDX.playing===x.id?"♪ ":""}${rr2Esc(nm)}</button>`});return h}
  let ogH=false;
  return L.map(x=>{const hd=t==="card"&&CARDS[x.id].r==="OG"&&!ogH&&CDX.who!=="OG"?(ogH=true,`<div class="cdxg cdxogh">奥義</div>`):"";if(t==="card"&&CARDS[x.id].r!=="OG")ogH=false;
    return hd+cdxTile(t,x,sel,tap)}).join("")}
function cdxTile(t,x,sel,tap){{const nm=!x.seen?"？？？":t==="card"?CARDS[x.id].n+(CDX.up?"+":""):t==="part"?PARTS[x.id].n:(x.hidden?"裏道の":"")+ENEMIES[x.key].n;
    const kind=t==="card"?"card":t==="part"?"part":"enemy",arg=kind==="enemy"?x.key:x.id;
    return`<button class="cdxtile${x.seen?"":" no"}${sel(x)}${t==="card"?" r-"+(CARDS[x.id].r||"C"):""}" ${tap(x)}><span class="cdxa">${cdxArt(kind,arg,x.seen,kind==="enemy"?52:40)}</span><span class="cdxn">${rr2Esc(nm)}</span></button>`}}
function cdxPick(id){CDX.sel=id;try{SND.se("ui_ok")}catch(e){}const t=CDX.tab;
  if(t==="snd"){const x=cdxItems("snd").find(y=>y.id===id);if(x&&x.seen)cdxSndPlay(x);else try{SND.se("card_cant")}catch(e){}}
  if(t==="img"){const L=cdxItems("img").filter(y=>y.seen),i=L.findIndex(y=>y.id===id);if(i>=0){cdxImgView(L,i);return}}
  renderCodex()}
function cdxDetailHTML(t,L){const x=L.find(y=>y.id===CDX.sel);
  if(!x)return`<div class="small dim">${t==="snd"?"曲をタップで再生、もう一度で止める。":t==="img"?"絵をタップで大きく。左右で次・前。":t==="gloss"?"用語をタップすると、意味が出ます。<br>カードの説明の点線の下線をタップしても出ます。":"タップすると、ここに中身が出ます。<br>見ていないものは、手に入れ方のヒント。"}</div>`+(t==="snd"?cdxSndCtl():"");
  if(t==="gloss")return`<div class="cdxh">${rr2Esc(x.d.w)}${x.d.prov?'<i class="prov">仮</i>':""}</div><div class="small dim">${rr2Esc(x.d.cat)}</div><div class="cdxd">${rr2Esc(x.d.t)}</div>`;
  if(!x.seen){const hint=t==="card"?cdxCardHint(x.id):t==="part"?cdxPartHint(x.id):t==="enemy"||t==="boss"?cdxEnemyHint(x):t==="mini"?`${rr2Name(x.ch)}で ${x.r} ランクのミニカーを作る`:t==="snd"?`流れる場面：${x.g}`:`場面：${x.g}`;
    return`<div class="cdxh">？？？</div><div class="cdxhint"><span class="gold">ヒント</span> ${rr2Esc(hint)}</div>${t==="card"&&CARDS[x.id].r==="OG"?`<div class="small dim cdxhint2">${rr2Esc(cdxOgT("og_hint_mt"))}</div>`:""}`+(t==="snd"?cdxSndCtl():"")}
  if(t==="card"&&CARDS[x.id].r==="OG")return cdxOgDetail(x.id);
  if(t==="card"){const d=CARDS[x.id],up=CDX.up;let desc=d.d||"";try{desc=descOf({id:x.id,up},up,0)}catch(e){}let du="";try{if(!up&&canUpgradeId(x.id))du=descOf({id:x.id,up:true},true,0)}catch(e){}
    const cost=d.costGear?`${d.costGear[0]}〜${d.costGear[2]}`:(up&&d.cu!=null?d.cu:d.c),gas=up&&d.gasu!=null?d.gasu:d.gas;
    return`<div class="cdxtop"><span class="cdxa big">${cdxArt("card",x.id,true,50)}</span><div><div class="cdxh">${rr2Esc(d.n)}${up?"+":""}</div>
      <div class="small">${TYPE_JP[d.t]||""}・${RARITY_JP[d.r]||""}・${d.own==="N"?"共通":rr2Esc(rr2Name(d.own))}</div><div class="small">回転 ${cost}　ガソリン ${gas}${d.band?`　帯 ${d.band}`:""}</div></div></div>
      <div class="cdxd" data-gloss>${rr2Esc(desc)}</div>${du?`<div class="cdxd up" data-gloss><span class="gold">強化すると</span> ${rr2Esc(du)}</div>`:""}
      <div class="small dim cdxfoot">解放：${rr2Esc(cdxCardHint(x.id))}　使った回数 ${RR2.num("use",x.id)}</div>`}
  if(t==="part"){const d=PARTS[x.id];return`<div class="cdxtop"><span class="cdxa big">${cdxArt("part",x.id,true,48)}</span><div><div class="cdxh">${rr2Esc(d.n)}</div><div class="small">${d.own==="N"?"共通":rr2Esc(rr2Name(d.own))+"の専用"}</div></div></div>
      <div class="cdxd" data-gloss>${rr2Esc(d.d)}</div><div class="small dim cdxfoot">解放：${rr2Esc(cdxPartHint(x.id))}</div>`}
  if(t==="enemy"||t==="boss"){const E=ENEMIES[x.key],gim=E.gimTxt||"";const hp=E.hp;
    return`<div class="cdxtop en"><span class="cdxa big">${cdxArt("enemy",x.key,true,96)}</span><div><div class="cdxh">${x.hidden?"裏道の":""}${rr2Esc(E.n)}</div><div class="small">${rr2Esc(cdxEnemyHint(x))}</div>
      <div class="small">体力のもと ${hp}${x.hidden?"（×1.1）":""}・速さ ${E.spd}</div></div></div>${gim?`<div class="cdxd" data-gloss>${rr2Esc(gim)}</div>`:""}
      <div class="small dim cdxfoot">倒した数 ${RR2.num("k",x.id)}</div>`}
  if(t==="mini"){const mc=(()=>{try{return loadMinicars().filter(m=>m.char===x.ch&&m.rank===x.r)}catch(e){return[]}})();
    return`<div class="cdxtop"><span class="cdxa big">${cdxArt("mini",x.ch,true,48)}</span><div><div class="cdxh">${rr2Esc(rr2Name(x.ch))}・${x.r} ランク</div><div class="small">ガレージにいま ${mc.length} 台</div></div></div>`}
  if(t==="snd")return`<div class="cdxh">${rr2Esc(x.n)}</div><div class="small dim">${rr2Esc(x.g)}</div>`+cdxSndCtl();
  return""}

/* ---- サウンドライブラリ：タップで再生・もう一度で止める。くり返し 入／切。開いている間はタイトルの曲を止める ---- */
function cdxSndCtl(){return`<div class="cdxsc"><button class="u9 cdxf${CDX.loop!==false?" main":""}" onclick="CDX.loop=CDX.loop===false;renderCodex()">くり返し ${CDX.loop!==false?"入":"切"}</button>${CDX.playing?`<button class="u9 cdxf" onclick="cdxSndStop();renderCodex()">■ 止める</button>`:""}</div>`}
function cdxSndPlay(x){if(CDX.playing===x.id){cdxSndStop();return}cdxSndStop();RR2.libPlaying=1;
  try{if(x.j)SND.jingle(x.id);else{SND.bgmStop();SND.bgm(x.id)}}catch(e){}RR2.libPlaying=0;CDX.playing=x.id;
  clearTimeout(CDX.lt);if(x.j&&CDX.loop!==false)CDX.lt=setTimeout(()=>{if(CDX.playing===x.id&&$("#rr2v")){CDX.playing=null;cdxSndPlay(x)}},9000);/* ジングルのくり返し（長さが分かれば audio.js の終わりの知らせに） */
  else if(x.j)CDX.lt=setTimeout(()=>{if(CDX.playing===x.id){CDX.playing=null;if($("#rr2v")&&CDX.tab==="snd")renderCodex()}},9000);
  else if(CDX.loop===false)CDX.lt=setTimeout(()=>{if(CDX.playing===x.id){cdxSndStop();if($("#rr2v")&&CDX.tab==="snd")renderCodex()}},120000)}/* ★BGM の「1回だけ」はサウンド班に頼む（今は2分で止める仮） */
function cdxSndStop(){clearTimeout(CDX.lt);if(CDX.playing){CDX.playing=null;try{SND.bgmStop()}catch(e){}}}

/* ---- イラストライブラリ：全画面・左右で次・前 ---- */
function cdxImgView(L,i){const v=rr2Layer();CDX.iv={L,i};const x=L[i];RR2.mark("img",x.id);
  const o=document.createElement("div");o.className="cdxiv"+(x.og?" og":"")+(x.gold?" gold":"");o.innerHTML=`${x.og?`<div class="cdxogband"><img class="px" src="${artURL(x.p)}" alt=""><div class="fr"></div><div class="nm">${rr2Esc(x.n||"")}</div><div class="ln">${rr2Esc(x.ln||"")}</div></div>`:`<img class="px" src="${artURL(x.p)}" alt="">`}<button class="u9 cdxiv-p" ${at(8,150,40,60)} onclick="event.stopPropagation();cdxImgStep(-1)">◀</button><button class="u9 cdxiv-n" ${at(592,150,40,60)} onclick="event.stopPropagation();cdxImgStep(1)">▶</button><button class="u9 main" ${at(532,22,104,32)} onclick="event.stopPropagation();cdxImgClose()">◀ もどる</button><div class="cdxiv-c small">${i+1}／${L.length}　${rr2Esc(x.g)}${x.og?"　"+rr2Esc(x.n):""}</div>`;
  const old=v.querySelector(".cdxiv");if(old)old.remove();v.appendChild(o)}
function cdxImgStep(d){const V=CDX.iv;if(!V)return;const n=V.L.length;cdxImgView(V.L,(V.i+d+n)%n);try{SND.se("ui_ok")}catch(e){}}
function cdxImgClose(){const o=$("#rr2v .cdxiv");if(o)o.remove();CDX.iv=null;renderCodex()}

/* ---- 入口：タイトルの左上（データ・ラボの下）に「図鑑」 ---- */
RRHOOK.on("screen",o=>{if(o.n!=="title")return;const u=ui();if(!u||u.querySelector(".cdxBtn"))return;const y=(typeof labOpen==="function"&&labOpen())?72:40;
  u.insertAdjacentHTML("beforeend",`<button class="mini cdxBtn" ${at(8,y,132,28)} onclick="showCodex('card','title')">図鑑 ${cdxPct(cdxAll())}%</button>`)});

/* ---- v0.5.7 奥義（①v0.22.102・design 10-15・text 30-1）----
   図鑑のカード：r:"OG" の12枚を各キャラの最後に「奥義」の段で。絞りこみ「奥義」で12枚だけ。中身＝名前・読み・カットインの一言・フレーバー・効果・解放のしかた・金の縁。
   見たか：解放（unlockedCards に入った）か、戦闘で使った・見た（seen_cards）。
   イラストライブラリ：カットイン（OUGI_ART の cutin。1280×360）を「奥義」と「奥義（金の縁）」に。ふつう＝解放ずみ、金の縁＝MT で解放（PRF().ogGold）。 */
function cdxOgIds(){return cdxCards().filter(id=>CARDS[id].r==="OG")}
function cdxOgHas(id){try{return unlockedCards(PRF()).includes(id)}catch(e){return false}}
function cdxOgGold(id){try{return!!(PRF().ogGold||{})[id]}catch(e){return false}}
function cdxOgSync(){const c=RR2.cx();if(!c)return;cdxOgIds().forEach(id=>{if(cdxOgHas(id)&&!c.c[id])RR2.mark("c",id)})}
function cdxOgBranch(id){try{const k=Object.keys(OG_OF_BRANCH).find(b=>OG_OF_BRANCH[b]===id),own=CARDS[id].own,br=(TREE[own]||[]).find(b=>b.id===k);return br?br.n:""}catch(e){return""}}
/* v0.5.8 ヒントの文は text v0.22.28 30-4（og_hint・og_hint_mt・og_tag）。TEXT.ui にあればそちらを使う */
const CDX_OGT={og_hint:"{ひらがな}で、型「{枝}」の4段目をとって、NIGHT 4 以上を全クリア",og_hint_mt:"MT で手に入れると、カードの縁が金になる",og_tag:"奥義（1戦に1回）"};
function cdxOgT(k){return(typeof TEXT!=="undefined"&&TEXT.ui&&TEXT.ui[k])||CDX_OGT[k]}
function cdxOgHint(id){const d=CARDS[id];return cdxOgT("og_hint").replace("{ひらがな}",rr2Name(d.own)).replace("{枝}",cdxOgBranch(id)).replace("NIGHT 4",`NIGHT ${(typeof RULES!=="undefined"&&RULES.ogNight)||4}`)}
function cdxOgDetail(id){const d=CARDS[id],T=(TEXT.og&&TEXT.og[d.og])||{},gold=cdxOgGold(id);let desc=d.d||"";try{desc=descOf({id,up:CDX.up},CDX.up,0)}catch(e){}
  return`<div class="cdxtop"><span class="cdxa big">${cdxArt("card",id,true,50)}</span><div><div class="cdxh">${rr2Esc(d.n)}${CDX.up?"+":""}${gold?'<i class="cdxgold">金</i>':""}</div>${T.y?`<div class="small dim">${rr2Esc(T.y)}</div>`:""}
    <div class="small">${rr2Esc(cdxOgT("og_tag"))}・${rr2Esc(rr2Name(d.own))}・ガソリン ${d.gas}</div></div></div>
    ${T.line?`<div class="cdxogline">「${rr2Esc(T.line)}」</div>`:""}<div class="cdxd" data-gloss>${rr2Esc(desc)}</div>
    ${T.flav?`<div class="cdxflav">${rr2Esc(T.flav)}</div>`:""}<div class="small dim cdxfoot">解放：${rr2Esc(cdxOgHint(id))}<br>${gold?"金の縁：あり":rr2Esc(cdxOgT("og_hint_mt"))}　使った回数 ${RR2.num("use",id)}</div>`}
function cdxOgImgs(){if(typeof OUGI_ART==="undefined")return[];const L=[];
  cdxOgIds().forEach((id,ord)=>{const d=CARDS[id],A0=OUGI_ART[d.og];if(!A0||!A0.cutin)return;const T=(TEXT.og&&TEXT.og[d.og])||{};
    const b={p:A0.cutin,og:1,ord,card:id,n:d.n,ln:T.line||""};L.push(Object.assign({},b,{id:"og:"+d.og,g:"奥義"}),Object.assign({},b,{id:"ogg:"+d.og,g:"奥義（金の縁）",gold:1}))});return L}
function cdxOgSeen(x){return x.gold?cdxOgGold(x.card):cdxOgHas(x.card)}
