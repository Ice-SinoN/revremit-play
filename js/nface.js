"use strict";
/* ===== プログラム班② v0.5.23 夜の顔 NIGHT 5〜11（design 12-3・25-5 ③の3）=====
   ①の NIGHT_FACE（data/nights.js・NIGHT 1〜4）に、まだない夜だけ足す（①が同じ夜を入れたら①のほうが勝つ）。名前と1行は design の仮（シナリオ班が決めたら差しかえ）。
   夜の顔の目印（その夜だけ）：
     5 湾岸の夜  wx:{dawn:.3}           夜明けのマス 30%（高速は night2.js のエリアの並び）
     6 影の夜    ghost2・ghost4         ライバルのゴーストが2回まで（エリア2・3 で1回ずつ。25% は①のまま）・ゴーストの報酬が4択（4つ目＝レアのカード）
     7 嵐の夜    storm                  戦闘の3ターン目のはじめに天候が変わる（どれに変わるかは戦闘のはじめに札で出す）
     8 閉店の夜  closing                マップのショップのマスが半分・へった分をラッキーとシムに半分ずつ
     9 港の夜    eliteHeat              エリートのマスに入るとヒート +1（港は night2.js のエリアの並び）
    10 混線の夜  crossJam・fuseHint     敵の攻撃のあと 25% で「混線」1枚を山札に・報酬の画面に合成の組み合わせを1つ
    11 最後の夜  wx 4つ各20%・bossP2   全部の天候が出る・エリアのボスが第2形態から（零号の あとの ZERO は zero.js）
   ①の関数は包むだけ（①のファイルはさわらない）。 */
(function(){
const W=(name,fn)=>{const f=window[name];if(typeof f!=="function")return;const g=fn(f);g.__nf=1;g.__orig=f;window[name]=g};
const ADD={
 5:{n:"湾岸の夜",l:"高速が入る・夜明けのマスが多い",wx:{dawn:0.3}},
 6:{n:"影の夜",l:"ライバルのゴーストが2回まで・ゴーストの報酬が4択",ghost2:1,ghost4:1},
 7:{n:"嵐の夜",l:"戦闘の3ターン目に天候が変わる（どれに変わるかは札に出る）",storm:1},
 8:{n:"閉店の夜",l:"ショップが半分・ラッキーとシムが多い",closing:1},
 9:{n:"港の夜",l:"港が入る・エリートのマスでヒート +1",eliteHeat:1},
 10:{n:"混線の夜",l:"敵の攻撃に混線が入ることがある・合成の組み合わせが報酬で1つ見える",crossJam:0.25,fuseHint:1},
 11:{n:"最後の夜",l:"全部の天候が出る・エリアのボスが第2形態から",wx:{rain:0.2,snow:0.25,fog:1/3,dawn:0.5},bossP2:1},
};
if(typeof NIGHT_FACE!=="undefined")Object.keys(ADD).forEach(n=>{if(!NIGHT_FACE[n])NIGHT_FACE[n]=ADD[n]});
/* v0.5.26 text 44章：夜の顔の見出し・説明・雰囲気の一言（TEXT.ui.night_face_{n}・_d・_f）。5〜11 は名前と1行を text に（1〜4 は①の文のまま） */
{const T=[null,["はじめての夜","ふつうの夜。ここが基準。","ROAD が、はじめて開いた夜。"],["雨の夜","雨のマスが多い。雨のエリートが出る。","路面が光る。タイヤの音が変わる。"],["霧の夜","霧のマスが多い。マップは3段先まで。ブローが入る。","先が見えない。だから、読む。"],
  ["雪の夜","雪のマスが多い。凍結のカードが出やすい。","白い道。音が、消えていく。"],["湾岸の夜","高速が入る（4エリア）。夜明けのマスが出やすい。","海ぞいの高架を、どこまでも。"],["影の夜","ライバルのゴーストが2回まで。勝つと報酬は4つから。","うしろに、だれかの影がつく。"],
  ["嵐の夜","戦闘の3ターン目に、天候が変わる（予告に出る）。","風向きが、急に変わる。"],["閉店の夜","ショップが半分。ラッキーとシムが多い。","灯りの消えた街を、走りぬける。"],["港の夜","港が入る（5エリア）。エリートのマスでヒート +1。","霧の向こうで、汽笛が鳴る。"],
  ["混線の夜","敵の攻撃に混線がまざる。合成の組み合わせが1つ見える。","通信に、知らない声がまじる。"],["最後の夜","全部の天候が出る。ボスは第2形態から。","夜の、いちばん奥へ。"]];
 TEXT.ui=TEXT.ui||{};T.forEach((r,n)=>{if(!r)return;TEXT.ui["night_face_"+n]=r[0];TEXT.ui["night_face_"+n+"_d"]=r[1];TEXT.ui["night_face_"+n+"_f"]=r[2];
   const F=typeof NIGHT_FACE!=="undefined"&&NIGHT_FACE[n];if(F&&n>=5&&F===ADD[n]){F.n=r[0];F.l=r[1];F.f=r[2]}else if(F&&!F.f)F.f=r[2]})}
const F=()=>{try{return(G&&typeof nightFace==="function"&&nightFace(G.night))||{}}catch(e){return{}}};
const auto=()=>!!((G&&G.fullAuto)||(window.FARM&&FARM.on));

/* ---- 6 影の夜：ゴースト2回まで ---- */
W("ghostRoll",f=>function(ai){if(!G)return f.apply(this,arguments);const fc=F();
  if(fc.ghost2&&G.ghostDone&&(G.ghostN||1)<2&&!(G.ghostRolled||{})[ai]){G.ghostDone=0;const r=f.apply(this,arguments);if(G.ghostDone)G.ghostN=2;else G.ghostDone=1;return r}
  const was=G.ghostDone,r=f.apply(this,arguments);if(!was&&G.ghostDone)G.ghostN=1;return r});
/* 影の夜：ゴーストの報酬に4つ目「レアのカード」 */
function ghostRareOpts(){const ul=G.ul?G.ul.cards:Object.keys(CARDS);return shuffle([...new Set(CHARS[G.char].pool)].filter(id=>CARDS[id]&&rarityOf(id)==="R"&&!CARDS[id].gen&&!CARDS[id].dig&&(!G.ul||ul.includes(id)))).slice(0,3)}
window.ghostRareOpts=ghostRareOpts;
W("ghostReward",f=>function(w){const r=f.apply(this,arguments);if(!F().ghost4)return r;try{const u=ui(),bs=[...u.querySelectorAll(".ghr")];if(bs.length!==3)return r;
  bs.forEach((b,i)=>{b.style.left=(30+i*148)+"px"});const nb=bs[2].cloneNode(true);nb.style.left=(30+3*148)+"px";nb.setAttribute("onclick","ghostPick('rare')");nb.innerHTML=`<b>レアのカード</b><br><span class="small">解放ずみのレアから3枚</span>`;bs[2].after(nb);
  const sm=u.querySelector(".sign .small");if(sm)sm.textContent=sm.textContent.replace("3つから1つ","4つから1つ")}catch(e){}return r});
W("ghostPick",f=>function(k){if(k!=="rare")return f.apply(this,arguments);try{SND.se("ui_ok")}catch(e){}S.ghostUp=false;S.rewards=ghostRareOpts();
  if(!S.rewards.length)return f.call(this,"epic");
  ui().innerHTML=hud()+`<div class="sign" ${at(170,20,300,30)}><div class="h">レアのカードを1枚</div><div class="small">デッキに足す</div></div>`+
   S.rewards.map((id,i)=>cardBig(id,{art:true,cls:"lit",attrs:`${at(LAMP_X[i]-70,52,140,184)} onclick="takeCard('${id}')"`})).join("")+backBtn("もらわない","takeCard(null)")});

/* ---- 7 嵐の夜：3ターン目のはじめに天候が変わる ---- */
const STORM_WX=["rain","snow","fog","dawn"];
const wxN=w=>(typeof wxName==="function"?wxName(w):(TEXT.wx&&TEXT.wx[w]&&TEXT.wx[w].n)||w);
W("startBattleState",f=>function(key){const r=f.apply(this,arguments);try{if(!B||B.sim)return r;const fc=F();
   if(fc.storm&&!B.storm){const L=STORM_WX.filter(w=>w!==B.wx);B.storm={wx:L[Math.floor(Math.random()*L.length)],at:3};addLog(`嵐の夜：3ターン目に天候が「${wxN(B.storm.wx)}」に変わる`)}
   /* 11 最後の夜：エリアのボスは第2形態から */
   if(fc.bossP2&&AREAS.some(a=>a.boss===key)){const e=B.e;if(e.phase&&!e.phased){e.phased=true;e.spd=e.phase.spd;if(e.phase.morph){e.morph=e.phase.morph;e.mi=0;e.pi=0}if(e.phase.pat){e.pat=e.phase.pat;e.pi=0}addLog(`${e.n} は、はじめから第2形態`)}
     if(e.wx2&&!B.wx2On){B.wx2On=true;B.wx=e.wx2}}}catch(e){}return r});
W("startPlayerTurn",f=>function(first){const r=f.apply(this,arguments);try{const s=B&&B.storm;if(s&&!s.done&&B.pTurns>=s.at-1&&!B.over){s.done=1;B.wx=s.wx;addLog(`嵐：天候が変わった：${wxN(s.wx)}`);ev({k:"wx2",wx:s.wx,storm:1});try{const I=window.AUDIO&&AUDIO.SE_IDS;if(I&&!auto()){const id=I.includes("storm_shift")?"storm_shift":I.includes("se_storm_shift")?"se_storm_shift":null;if(id)SND.se(id)}}catch(e){}/* design 26-5 ⑥（サウンド班の音が入ったら鳴る） */
   if(typeof window.nightStormHit==="function")window.nightStormHit();
   if(!auto())setTimeout(()=>{if(window.SCREEN==="battle"&&B&&!B.over)toast2(`嵐：天候が「${wxN(s.wx)}」に変わった`,120,2600)},350)}}catch(e){}return r});
/* 戦闘の画面：天候の札の右に「3ターン目 ○○」（変わったら消える） */
W("renderBattle",f=>function(){const r=f.apply(this,arguments);try{const s=B&&B.storm;if(s&&!s.done&&window.SCREEN==="battle"){const u=ui();if(u&&!u.querySelector(".stormtag")){const x=B.wx&&B.wx!=="dry"?102:4;
   u.insertAdjacentHTML("beforeend",`<button class="stormtag wx-${s.wx}" ${at(x,74,104,14)} onclick="toast2('嵐の夜：3ターン目のはじめに天候が「${wxN(s.wx)}」に変わる',76,3000)">嵐→3ターン目 ${esc(wxN(s.wx))}</button>`)}}}catch(e){}return r});

/* ---- 8 閉店の夜：ショップのマス半分・ラッキーとシム ×1.8 ---- */
W("genMap",f=>function(){const fc=F();if(!fc.closing||typeof NODE_W==="undefined")return f.apply(this,arguments);const keep=NODE_W.map(x=>x[1]);
  {const sh=NODE_W.find(x=>x[0]==="shop"),half=sh?sh[1]/2:0;NODE_W.forEach(x=>{if(x[0]==="shop")x[1]=half;else if(x[0]==="lucky"||x[0]==="sim")x[1]+=half/2})}/* v0.5.26 design 26-5 ③：へったショップの分をラッキーとシムに半分ずつ */
  try{return f.apply(this,arguments)}finally{NODE_W.forEach((x,i)=>x[1]=keep[i])}});

/* ---- 9 港の夜：エリートのマスに入るとヒート +1 ---- */
W("enterNode",f=>function(j){try{const n=G&&G.map[G.row]&&G.map[G.row][j];if(n&&n.k==="elite"&&F().eliteHeat&&typeof heatSet==="function"){heatSet((G.heat||0)+1);if(!auto())toast2("港の夜：エリートのマスでヒート +1",300,1800)}}catch(e){}return f.apply(this,arguments)});

/* ---- 10 混線の夜：敵の攻撃のあと 25% で混線1枚・報酬に合成の組み合わせ1つ ---- */
if(typeof ENEMY_OPS!=="undefined")["atk","multi","prc"].forEach(k=>{const o=ENEMY_OPS[k];if(!o||o.__nf)return;const g=function(e){const r=o.apply(this,arguments);try{const p=F().crossJam;if(p&&B&&!B.sim&&CARDS.crosstalk&&Math.random()<p)ENEMY_OPS.jam(e,"crosstalk",1)}catch(x){}return r};g.__nf=1;ENEMY_OPS[k]=g});
function fuseHint(){if(typeof FUSE==="undefined")return null;const ok=f=>CARDS[f.id]&&CARDS[f.a]&&CARDS[f.b],own=id=>{const c=CARDS[id];return c&&(c.own===G.char||c.own==="N"||!c.own)};
  const R=S.rewards||[],D=(G.deck||[]).map(c=>c.id);let L=FUSE.filter(f=>ok(f)&&(R.includes(f.a)||R.includes(f.b)));if(!L.length)L=FUSE.filter(f=>ok(f)&&(D.includes(f.a)||D.includes(f.b))&&own(f.a)&&own(f.b));if(!L.length)L=FUSE.filter(f=>ok(f)&&own(f.a)&&own(f.b));
  return L.length?L[Math.floor(Math.random()*L.length)]:null}
W("showWinBody",f=>function(w){const r=f.apply(this,arguments);try{if(!F().fuseHint||auto()||(w&&(w.ghost||w.rank==="hidden"))||window.SCREEN!=="win")return r;const h=fuseHint();if(!h)return r;
  ui().insertAdjacentHTML("beforeend",`<div class="fusehint small" ${at(100,262,440,16)}><span class="gold">合成のヒント</span>　${esc(CARDS[h.a].n)} ＋ ${esc(CARDS[h.b].n)} → <b>${esc(CARDS[h.id].n)}</b></div>`)}catch(e){}return r});

try{const st=document.createElement("style");st.textContent=`.stormtag{position:absolute;background:#1a1030;color:#e6d8ff;border:1px dashed #b08cff;font-size:10px;line-height:12px;padding:0;text-align:center;white-space:nowrap;overflow:hidden}.fusehint{position:absolute;text-align:center;line-height:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:rgba(10,8,18,.85);border:1px solid #6a5a2a;color:#e8e2cf}`;document.head.appendChild(st)}catch(e){}
W("renderReady",f=>function(){const r=f.apply(this,arguments);try{const el=document.querySelector("#ui .nface");const n=curNight(),fl=TEXT.ui["night_face_"+n+"_f"];if(el&&fl&&!el.title.includes(fl))el.title=el.title+"\n"+fl}catch(e){}return r});
window.NFACE={VERSION:"0.5.26",ADD,fuseHint};
})();
