"use strict";
/* ===== セーブ（v0.9）：ミニカー・組んだデッキ =====
   形：{v:2,id,char,rank,mode,clear,score,cards:[{id,up}],part,tune,at}
   読むときに normMinicar() で確かめ、壊れたものだけ外す（止めない）。
   v0.6 の旧キー deckrogue_minicars_v01 は形がちがう（名前だけ）ので読まない（v0.7 から）。 */
const LS_KEY="revremit_minicars_v2";
function normMinicar(m,i){
  if(!m||typeof m!=="object"||m.v!==2)return null;
  const rank=RANKS.includes(m.rank)?m.rank:"E";
  const cards=(Array.isArray(m.cards)?m.cards:[]).filter(c=>c&&CARDS[c.id]&&!CARDS[c.id].gen).slice(0,MC_CARDS).map(c=>({id:c.id,up:!!c.up}));
  const part=m.part&&PARTS[m.part]?m.part:null;
  const ch=CHARS[m.char]?m.char:"YUKI";
  return{v:2,id:String(m.id||("mc"+(+m.at||0)+"_"+(i||0))),char:ch,rank,mode:m.mode==="AT"?"AT":"MT",
    clear:!!m.clear,score:+m.score||0,cards,part,tune:m.tune&&typeof m.tune==="object"?m.tune:{},at:+m.at||0};
}
/* BUG-17：カードが0枚になったもの（壊れたデータ）は外し、60台より多ければ新しい60台だけ */
function loadMinicars(){try{const a=JSON.parse(localStorage.getItem(LS_KEY)||"[]");return Array.isArray(a)?a.map(normMinicar).filter(m=>m&&m.cards.length).slice(-MINICAR_MAX):[]}catch(e){return[]}}
function saveMinicars(a){try{localStorage.setItem(LS_KEY,JSON.stringify(a))}catch(e){}}
function makeMinicar(res,pickIdx,partIdx){
  return normMinicar({v:2,id:"mc"+Date.now().toString(36)+Math.random().toString(36).slice(2,6),char:G.char,rank:res.rank,mode:G.mode,clear:G.st.clear,score:res.total,
    cards:pickIdx.map(i=>{const c=res.ten[i];return{id:c.id,up:!!c.up}}),part:partIdx>=0?G.parts[partIdx]||null:null,tune:Object.assign({},G.tune),at:Date.now()});
}
/* 組んだデッキ（ラン前）。{id:枚数}。壊れていたら最初のデッキ */
const DECK_KEY="revremit_deck_v1";
function loadDeck(charId){try{const d=JSON.parse(localStorage.getItem(DECK_KEY)||"null");const dk=d&&d[charId||"YUKI"];
  if(dk&&typeof dk==="object"&&!deckErrors(dk,charId).length)return Object.assign({},dk)}catch(e){}return defaultDeck(charId)}
function saveDeck(dk,charId){try{const d=JSON.parse(localStorage.getItem(DECK_KEY)||"{}")||{};d[charId||"YUKI"]=dk;localStorage.setItem(DECK_KEY,JSON.stringify(d))}catch(e){}}
/* ===== ★途中のラン（α3）=====
   マップに戻るたび・戦闘に入るとき・勝ったときに G を丸ごと保存（localStorage revremit_run_v1）。
   つづきから：マップ → そのままマップ／戦闘 → 同じ敵との戦闘をはじめから（戦闘の途中は保存しない）／勝ち → 報酬はとばして次の段へ。
   ランが終わったら（リザルト）消す。 */
const RUN_KEY="revremit_run_v1";
function saveRun(stage){if(!G||window.TUTORIAL_ON)return;try{localStorage.setItem(RUN_KEY,JSON.stringify({v:1,at:Date.now(),stage:stage||{s:"map"},G}))}catch(e){}}
function loadRun(){try{const r=JSON.parse(localStorage.getItem(RUN_KEY)||"null");if(!r||r.v!==1||!r.G||!Array.isArray(r.G.map)||!Array.isArray(r.G.deck))return null;return r}catch(e){return null}}
function clearRun(){try{localStorage.removeItem(RUN_KEY)}catch(e){}}
function runLabel(r){const g=r.G,row=Math.min(g.row,g.map.length-1),a=g.map[row][0].a,AR=AREAS[a],start=g.map.findIndex(x=>x[0].a===a);
  return`${g.mode}・エリア${a+1} ${AR?AR.n:""} ${row-start+1}段・耐久${g.hp}/${g.maxhp}`}
