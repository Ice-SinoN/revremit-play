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

/* ===== ★セーブ v2（v0.21）：3スロット＋オートセーブ（★虎雪 11-18 08:51・★チーフ 11-18 09:39・tech-notes 1-10）=====
   ・1スロット＝1人の遊び手の進み具合。解放（カード・パーツ・キャラ・夜）・ログ（ラン後のマネー）・ミニカー・デッキ・見た場面・途中のランを、スロットごとに持つ。
   ・遊んでいるスロット（SAVE.slot）に、区切りのたびに自動で書く。同じものをオートセーブ（revremit_save_auto）にも写す＝「最後に遊んだスロットの最後の状態」。
     スロットが読めなくなったときは、オートセーブから元にもどせる。
   ・版の番号 v：読むとき MIGRATE で今の版まで順に直す。知らない項目は消さない。解放は足すだけ（減らない）。
   ・読めないデータは消さずに revremit_save_broken_<元>_<時刻> に写して、そのスロットは「読めない」と出す（止めない）。 */
const SAVE_FMT="revremit-save",SAVE_V=2;
const SAVE_KEYS={auto:"revremit_save_auto",1:"revremit_save_1",2:"revremit_save_2",3:"revremit_save_3"};
const OLD_KEYS={minicars:"revremit_minicars_v2",deck:"revremit_deck_v1",seen:"revremit_seen_v1",run:"revremit_run_v1",tutorial:"revremit_tutorial_done"};
const UNLOCK_LISTS=["chars","cards","parts","story","stages"];
/* 解放は「とったもの」だけを持つ（初めから使えるものは data/unlock.js の START）。nightMax＝クリアした夜のいちばん上（0＝まだ） */
function blankUnlock(){return{chars:["YUKI"],cards:[],parts:[],story:[],stages:[],nightMax:0,sCount:0,areas:[]}}
function blankProfile(){return{tutorial:false,seen:{},minicars:[],decks:{},unlock:blankUnlock(),log:0,stats:{runs:0,clears:0}}}
function blankSave(){const t=Date.now();return{fmt:SAVE_FMT,v:SAVE_V,game:VERSION_NO(),created:t,at:t,plays:0,from:null,profile:blankProfile(),run:null}}
function VERSION_NO(){try{return(typeof VERSION==="string"&&VERSION.match(/v[\d.]+/)||[""])[0]}catch(e){return""}}
const uniq=a=>[...new Set(a)];
/* α（v0.19 まで・v0.20）のデータから、もうやったことの解放を足す（今まで遊べたカードが消えないように） */
function alphaUnlocks(p){try{const mc=normMinicars(p.minicars),u=p.unlock;
  const clear=mc.some(m=>m.clear)||(+(p.stats&&p.stats.clears)||0)>0;
  if(clear){["a1","a2","clear"].forEach(a=>{if(!u.areas.includes(a))u.areas.push(a)});u.nightMax=Math.max(u.nightMax||0,1)}
  const s=mc.filter(m=>["S","SS","SSS"].includes(m.rank)).length;u.sCount=Math.max(u.sCount||0,s);
  if(typeof unlockRecalc==="function")unlockRecalc(p)}catch(e){}return p}
/* 版ごとの直し方：MIGRATE[n] は v=n のデータを v=n+1 にする */
const MIGRATE={
  1:d=>{const p=d.profile||{},u=p.unlock||{};
    p.unlock=Object.assign(blankUnlock(),u,{nightMax:Math.max(0,+u.diffMax||0)});delete p.unlock.diffMax;
    p.log=Math.max(0,+p.money||0);delete p.money;d.profile=alphaUnlocks(Object.assign(blankProfile(),p));d.v=2;return d}};
/* 解放は和（どちらかにあれば残す）。数は大きいほう */
function mergeUnlock(a,b){const u=blankUnlock();UNLOCK_LISTS.concat(["areas"]).forEach(k=>u[k]=uniq([...u[k],...((a&&Array.isArray(a[k]))?a[k]:[]),...((b&&Array.isArray(b[k]))?b[k]:[])].map(String)));
  ["nightMax","sCount"].forEach(k=>u[k]=Math.max(0,+(a&&a[k])||0,+(b&&b[k])||0));
  [a,b].forEach(x=>x&&typeof x==="object"&&Object.keys(x).forEach(k=>{if(!(k in u))u[k]=x[k]}));return u}
function normSave(o){
  if(!o||typeof o!=="object"||o.fmt!==SAVE_FMT||!(+o.v>=1))return null;
  let d;try{d=JSON.parse(JSON.stringify(o))}catch(e){return null}
  while(d.v<SAVE_V&&MIGRATE[d.v]){try{d=MIGRATE[d.v](d)}catch(e){break}}
  const p=Object.assign(blankProfile(),d.profile&&typeof d.profile==="object"?d.profile:{});
  p.tutorial=!!p.tutorial;p.seen=p.seen&&typeof p.seen==="object"&&!Array.isArray(p.seen)?p.seen:{};
  p.minicars=Array.isArray(p.minicars)?p.minicars:[];p.decks=p.decks&&typeof p.decks==="object"?p.decks:{};
  p.unlock=mergeUnlock(p.unlock,null);p.log=Math.max(0,Math.floor(+p.log||0));
  p.stats=Object.assign({runs:0,clears:0},p.stats&&typeof p.stats==="object"?p.stats:{});
  d.profile=p;d.run=validRun(d.run)?d.run:null;d.plays=+d.plays||0;d.at=+d.at||0;d.created=+d.created||d.at;
  d.newer=d.v>SAVE_V;return d}
function lsGet(k){try{return localStorage.getItem(k)}catch(e){return null}}
function lsSet(k,v){try{localStorage.setItem(k,v);return true}catch(e){return false}}
function lsDel(k){try{localStorage.removeItem(k)}catch(e){}}
function readSave(which){const raw=lsGet(SAVE_KEYS[which]);if(raw==null)return{d:null,broken:false};
  let o=null;try{o=JSON.parse(raw)}catch(e){}const d=normSave(o);
  if(!d){const bk=`revremit_save_broken_${which}_${Date.now()}`;if(!lsGet(bk))lsSet(bk,raw);return{d:null,broken:true}}return{d,broken:false}}
function packSave(d,slot){const o=Object.assign({},d,{at:Date.now(),game:VERSION_NO(),slot});delete o.newer;return JSON.stringify(o)}
/* 書くのは「新しい中身を作ってから1回で setItem」（途中で閉じても、前の中身か新しい中身のどちらか） */
function writeSave(which,d,slot){const ok=lsSet(SAVE_KEYS[which],packSave(d,slot));
  if(!ok&&!SAVE.warned){SAVE.warned=1;try{window.toast2&&toast2("セーブできませんでした（ブラウザの保存がいっぱい・オフ）")}catch(e){}}return ok}
/* v0.19 までのデータ（キーがばらばら）を1つにまとめる。元のキーは消さない */
function fromOldKeys(){const g=k=>lsGet(OLD_KEYS[k]);if(["minicars","deck","seen","run","tutorial"].every(k=>g(k)==null))return null;
  const d=blankSave(),p=d.profile;const J=(s,def)=>{try{const v=JSON.parse(s);return v==null?def:v}catch(e){return def}};
  p.minicars=J(g("minicars"),[]);p.decks=J(g("deck"),{})||{};p.seen=J(g("seen"),{})||{};p.tutorial=g("tutorial")==="1";
  const r=J(g("run"),null);d.run=validRun(r)?r:null;d.from="v0.19";
  p.stats.clears=normMinicars(p.minicars).filter(m=>m.clear).length;p.stats.runs=normMinicars(p.minicars).length;alphaUnlocks(p);return normSave(d)}
const SAVE={cur:null,slot:1,warned:0,
  /* 起動：オートセーブが指すスロットを今のスロットに。古い版のデータはここで移す（tech-notes 1-10） */
  boot(){const slots={};[1,2,3].forEach(n=>{slots[n]=readSave(n)});const a=readSave("auto");
    const any=[1,2,3].some(n=>lsGet(SAVE_KEYS[n])!=null)||lsGet(SAVE_KEYS.auto)!=null;
    if(!any){const o=fromOldKeys();if(o){this.cur=o;this.slot=1;this.migrated="v0.19";this.auto();return}
      this.cur=blankSave();this.slot=1;this.fresh=true;return}
    // v0.20（v=1）のオートセーブは「今のデータ」だった：スロットより新しければ、そのスロットの中身にする（遊んだ分を消さない）
    const rawAuto=(()=>{try{return JSON.parse(lsGet(SAVE_KEYS.auto)||"null")}catch(e){return null}})();
    if(a.d&&rawAuto&&rawAuto.v===1){let n=+a.d.from;
      if(!(n>=1&&n<=3)){n=[1,2,3].find(k=>!slots[k].d&&!slots[k].broken)||0}
      if(n&&(!slots[n].d||(a.d.at||0)>=(slots[n].d.at||0))){slots[n]={d:a.d,broken:false};writeSave(n,a.d,n)}
      [1,2,3].forEach(k=>{if(slots[k].d&&k!==n)writeSave(k,slots[k].d,k)});this.migrated="v0.20";if(n){this.slot=n;this.cur=slots[n].d;this.auto();return}}
    const n=+(a.d&&(a.d.slot||a.d.from));
    if(n>=1&&n<=3&&slots[n].d){this.slot=n;this.cur=(a.d.at||0)>(slots[n].d.at||0)?a.d:slots[n].d;return}
    const k=[1,2,3].find(k=>slots[k].d);if(k){this.slot=k;this.cur=slots[k].d;return}
    this.cur=a.d||blankSave();this.slot=[1,2,3].find(k=>!slots[k].broken)||1},
  /* 区切りごと：今のスロットとオートセーブの両方に書く */
  auto(){if(!this.cur)return;writeSave(this.slot,this.cur,this.slot);writeSave("auto",this.cur,this.slot)},
  list(){return["auto",1,2,3].map(k=>{const r=readSave(k);return{k,d:r.d,broken:r.broken}})},
  /* スロットをえらぶ（あそぶ）。空なら新しいデータ（チュートリアル済みは引きつぐ） */
  use(n){const r=readSave(n);if(r.broken)return false;if(r.d){this.cur=r.d;this.cur.plays=(this.cur.plays||0)+1}
    else{const t=this.cur&&this.cur.profile?this.cur.profile.tutorial:false;this.cur=blankSave();this.cur.profile.tutorial=t}
    this.slot=n;this.auto();return true},
  /* オートセーブ（最後の状態）を、そのスロットにもどす */
  restore(){const a=readSave("auto");if(!a.d)return false;const n=+(a.d.slot||a.d.from)||this.slot;this.cur=a.d;this.slot=n;this.auto();return n},
  erase(n){lsDel(SAVE_KEYS[n]);if(this.slot===n){this.cur=blankSave();this.cur.profile.tutorial=true}},
  /* 解放を足す（減らす関数は作らない） */
  unlock(kind,id){const u=this.cur.profile.unlock;if(!UNLOCK_LISTS.includes(kind))return false;id=String(id);if(u[kind].includes(id))return false;u[kind].push(id);this.auto();return true},
  label(d){if(!d)return"（空き）";const p=d.profile,mc=normMinicars(p.minicars),u=p.unlock;
    return`NIGHT ${Math.min((u.nightMax||0)+1,typeof NIGHTS!=="undefined"?NIGHTS.length:11)}まで・ミニカー ${mc.length}台・ログ ${p.log||0}${d.run&&validRun(d.run)?"・つづき "+runLabel(d.run):""}`},
  when(d){if(!d||!d.at)return"";const t=new Date(d.at),z=n=>String(n).padStart(2,"0");return`${t.getMonth()+1}/${t.getDate()} ${z(t.getHours())}:${z(t.getMinutes())}`}};
