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
function normMinicars(a){return Array.isArray(a)?a.map(normMinicar).filter(m=>m&&m.cards.length).slice(-MINICAR_MAX):[]}
/* ★v0.20：中身は今のデータ（SAVE.cur）の profile.minicars。書いたらオートセーブ */
function loadMinicars(){return normMinicars(SAVE.cur.profile.minicars)}
function saveMinicars(a){SAVE.cur.profile.minicars=a.slice();SAVE.auto()}
function makeMinicar(res,pickIdx,partIdx){
  return normMinicar({v:2,id:"mc"+Date.now().toString(36)+Math.random().toString(36).slice(2,6),char:G.char,rank:res.rank,mode:G.mode,clear:G.st.clear,score:res.total,
    cards:pickIdx.map(i=>{const c=res.ten[i];return{id:c.id,up:!!c.up}}),part:partIdx>=0?G.parts[partIdx]||null:null,tune:Object.assign({},G.tune),at:Date.now()});
}
/* 組んだデッキ（ラン前）。{id:枚数}。壊れていたら最初のデッキ */
const DECK_KEY="revremit_deck_v1";
function loadDeck(charId){try{const dk=SAVE.cur.profile.decks[charId||"YUKI"];
  if(dk&&typeof dk==="object"&&!deckErrors(dk,charId).length)return Object.assign({},dk)}catch(e){}return defaultDeck(charId)}
function saveDeck(dk,charId){SAVE.cur.profile.decks[charId||"YUKI"]=Object.assign({},dk);SAVE.auto()}
/* ===== ★途中のラン（α3）：v0.20 から今のデータの run に入れる =====
   マップに戻るたび・戦闘に入るとき・勝ったときに G を丸ごと保存。
   つづきから：マップ → そのままマップ／戦闘 → 同じ敵との戦闘をはじめから（戦闘の途中は保存しない）／勝ち → 報酬はとばして次の段へ。
   ランが終わったら（リザルト）消す。 */
const RUN_KEY="revremit_run_v1";/* v0.19 までのキー（引きつぎで読むだけ） */
function validRun(r){return!!(r&&r.v===1&&r.G&&Array.isArray(r.G.map)&&Array.isArray(r.G.deck)&&r.G.map.length)}
function saveRun(stage){if(!G||window.TUTORIAL_ON)return;SAVE.cur.run={v:1,at:Date.now(),stage:stage||{s:"map"},G:JSON.parse(JSON.stringify(G))};SAVE.auto()}
function loadRun(){const r=SAVE.cur.run;return validRun(r)?r:null}
function clearRun(){if(SAVE.cur.run){SAVE.cur.run=null;SAVE.auto()}}
function runLabel(r){const g=r.G,row=Math.min(g.row,g.map.length-1),a=g.map[row][0].a,AR=AREAS[a],start=g.map.findIndex(x=>x[0].a===a);
  return`${g.mode}・エリア${a+1} ${AR?AR.n:""} ${row-start+1}段・耐久${g.hp}/${g.maxhp}`}

/* ===== ★v0.20 セーブ：3スロット＋オートセーブ（★虎雪 11-18 08:51・tech-notes 1-10）=====
   1つのデータ＝1つのキー。{fmt,v,game,created,at,plays,from,profile,run}
   ・遊んでいる間は「今のデータ」（SAVE.cur）を、区切りのたびに オートセーブ（revremit_save_auto）へ書く。
   ・スロット1〜3 は、タイトルの「データ」で自分で書く（セーブ）／読む（ロード）。オートセーブも読める。
   ・版の番号 v：読むとき MIGRATE で今の版まで順に直す。知らない項目は消さずに残す（新しい版の項目を古い版が消さない）。
   ・解放（unlock）は「足す」だけ：読み直し・移行・ロードで減らない。
   ・読めない（JSON がこわれた）データは消さずに revremit_save_broken_<元>_<時刻> に写して、空として見せる（止めない）。
   ・自分より新しい版のデータ（v が大きい）は読めるが、そのスロットに上書きするときは確かめる。 */
const SAVE_FMT="revremit-save",SAVE_V=1;
const SAVE_KEYS={auto:"revremit_save_auto",1:"revremit_save_1",2:"revremit_save_2",3:"revremit_save_3"};
const OLD_KEYS={minicars:"revremit_minicars_v2",deck:"revremit_deck_v1",seen:"revremit_seen_v1",run:"revremit_run_v1",tutorial:"revremit_tutorial_done"};
const UNLOCK_LISTS=["chars","cards","story","stages"];
function blankUnlock(){return{chars:["YUKI"],cards:[],story:[],stages:[],diffMax:0}}
function blankProfile(){return{tutorial:false,seen:{},minicars:[],decks:{},unlock:blankUnlock(),money:0,stats:{runs:0,clears:0}}}
function blankSave(){const t=Date.now();return{fmt:SAVE_FMT,v:SAVE_V,game:VERSION_NO(),created:t,at:t,plays:0,from:null,profile:blankProfile(),run:null}}
function VERSION_NO(){try{return(typeof VERSION==="string"&&VERSION.match(/v[\d.]+/)||[""])[0]}catch(e){return""}}
/* 版ごとの直し方：MIGRATE[n] は v=n のデータを v=n+1 にする（β で項目が増えたらここに足す） */
const MIGRATE={};
const uniq=a=>[...new Set(a)];
/* 解放は和（どちらかにあれば残す）。難易度は大きいほう */
function mergeUnlock(a,b){const u=blankUnlock();UNLOCK_LISTS.forEach(k=>u[k]=uniq([...u[k],...((a&&Array.isArray(a[k]))?a[k]:[]),...((b&&Array.isArray(b[k]))?b[k]:[])].map(String)));
  u.diffMax=Math.max(0,+(a&&a.diffMax)||0,+(b&&b.diffMax)||0);
  [a,b].forEach(x=>x&&typeof x==="object"&&Object.keys(x).forEach(k=>{if(!(k in u))u[k]=x[k]}));return u}
function normSave(o){
  if(!o||typeof o!=="object"||o.fmt!==SAVE_FMT||!(+o.v>=1))return null;
  let d;try{d=JSON.parse(JSON.stringify(o))}catch(e){return null}
  while(d.v<SAVE_V&&MIGRATE[d.v]){try{d=MIGRATE[d.v](d)}catch(e){break}}
  const p=Object.assign(blankProfile(),d.profile&&typeof d.profile==="object"?d.profile:{});
  p.tutorial=!!p.tutorial;p.seen=p.seen&&typeof p.seen==="object"&&!Array.isArray(p.seen)?p.seen:{};
  p.minicars=Array.isArray(p.minicars)?p.minicars:[];p.decks=p.decks&&typeof p.decks==="object"?p.decks:{};
  p.unlock=mergeUnlock(p.unlock,null);p.money=Math.max(0,+p.money||0);
  p.stats=Object.assign({runs:0,clears:0},p.stats&&typeof p.stats==="object"?p.stats:{});
  d.profile=p;d.run=validRun(d.run)?d.run:null;d.plays=+d.plays||0;d.at=+d.at||0;d.created=+d.created||d.at;
  d.newer=d.v>SAVE_V;return d}
function lsGet(k){try{return localStorage.getItem(k)}catch(e){return null}}
function lsSet(k,v){try{localStorage.setItem(k,v);return true}catch(e){return false}}
/* 1つのデータを読む：{d:データ|null, broken:true|false} */
function readSave(which){const raw=lsGet(SAVE_KEYS[which]);if(raw==null)return{d:null,broken:false};
  let o=null;try{o=JSON.parse(raw)}catch(e){}const d=normSave(o);
  if(!d){const bk=`revremit_save_broken_${which}_${Date.now()}`;if(!lsGet(bk))lsSet(bk,raw);return{d:null,broken:true}}return{d,broken:false}}
function writeSave(which,d){const o=Object.assign({},d,{at:Date.now(),game:VERSION_NO()});delete o.newer;if(which!=="auto")o.from=which;
  const ok=lsSet(SAVE_KEYS[which],JSON.stringify(o));if(!ok&&!SAVE.warned){SAVE.warned=1;try{window.toast2&&toast2("セーブできませんでした（ブラウザの保存がいっぱい・オフ）")}catch(e){}}return ok}
/* v0.19 までのデータ（キーがばらばら）を1つにまとめる。元のキーは消さない（前の版にもどしても遊べる） */
function fromOldKeys(){const g=k=>lsGet(OLD_KEYS[k]);if(["minicars","deck","seen","run","tutorial"].every(k=>g(k)==null))return null;
  const d=blankSave(),p=d.profile;const J=(s,def)=>{try{const v=JSON.parse(s);return v==null?def:v}catch(e){return def}};
  p.minicars=J(g("minicars"),[]);p.decks=J(g("deck"),{})||{};p.seen=J(g("seen"),{})||{};p.tutorial=g("tutorial")==="1";
  const r=J(g("run"),null);d.run=validRun(r)?r:null;d.from="v0.19";
  p.stats.clears=normMinicars(p.minicars).filter(m=>m.clear).length;p.stats.runs=normMinicars(p.minicars).length;return normSave(d)}
const SAVE={cur:null,src:"auto",warned:0,brokenNow:[],
  /* 起動：オートセーブを今のデータに。何もなく v0.19 のデータがあれば引きつぐ（オートとスロット1の両方に書く） */
  boot(){const a=readSave("auto");if(a.broken)this.brokenNow.push("auto");
    const any=[1,2,3].some(n=>lsGet(SAVE_KEYS[n])!=null);
    if(!a.d&&!any){const o=fromOldKeys();if(o){this.cur=o;writeSave("auto",o);writeSave(1,o);this.src="auto";this.migrated=true;return}}
    this.cur=a.d||blankSave();this.src="auto"},
  /* 区切りごと（マップ・戦闘の前・勝ち・リザルト・デッキ・ミニカー・会話を見た）に呼ぶ */
  auto(){if(!this.cur)return;writeSave("auto",this.cur)},
  list(){return["auto",1,2,3].map(k=>{const r=readSave(k);return{k,d:r.d,broken:r.broken}})},
  load(k){const r=readSave(k);if(!r.d)return false;this.cur=r.d;this.cur.plays=(this.cur.plays||0)+1;this.src=k;this.auto();return true},
  saveTo(n){if(!this.cur||!(n>=1&&n<=3))return false;const ok=writeSave(n,this.cur);if(ok){this.cur.from=n;this.auto()}return ok},
  newData(){const keep=this.cur&&this.cur.profile?this.cur.profile.tutorial:false;this.cur=blankSave();this.cur.profile.tutorial=keep;this.src="new";this.auto()},
  /* 解放を足す（β で使う。減らす関数は作らない） */
  unlock(kind,id){const u=this.cur.profile.unlock;if(!UNLOCK_LISTS.includes(kind))return;if(!u[kind].includes(String(id))){u[kind].push(String(id));this.auto()}},
  label(d){if(!d)return"（空き）";const p=d.profile,mc=normMinicars(p.minicars);
    return`ミニカー ${mc.length}台・クリア ${mc.filter(m=>m.clear).length}回${d.run&&validRun(d.run)?"・つづき "+runLabel(d.run):""}`},
  when(d){if(!d||!d.at)return"";const t=new Date(d.at),z=n=>String(n).padStart(2,"0");return`${t.getMonth()+1}/${t.getDate()} ${z(t.getHours())}:${z(t.getMinutes())}`}};
SAVE.boot();
