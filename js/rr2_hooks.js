/* js/rr2_hooks.js（プログラム班②） */
"use strict";
/* ===== ②の土台：イベントの口（RRHOOK）・セーブの入れ物・仮のつなぎ =====
   ②の機能（図鑑・ライブラリ・用語・ランの記録・文字の大きさ・戦闘の速さ）は、ゲームのコードを書きかえずに動く。
   ゲームとのつなぎ目は RRHOOK.emit(名前, 中身) の1か所にまとめる。
   ★本番のつなぎ（プログラム班①が足す）：rr2-hooks.md の表の場所に RRHOOK.emit(...) を1行ずつ。
     ①が足したら、下の「仮のつなぎ（shim）」は RR2_SHIM=false で止まる（同じことが2回数えられないよう、①が足した口は emit に native:true を付ける）。
   読む順番：ゲームの js をぜんぶ読んだあと（index.html のいちばん下）に rr2_hooks.js → glossary.js → codex.js → runlog.js → settings2.js。 */
const RRHOOK={L:{},native:{},
  on(k,f){(this.L[k]=this.L[k]||[]).push(f)},
  emit(k,o){o=o||{};if(o.native)this.native[k]=1;else if(this.native[k])return;/* ①の本番の口が来たら、仮のつなぎの分は数えない */
    (this.L[k]||[]).forEach(f=>{try{f(o)}catch(e){console.error("[RRHOOK]",k,e)}})}};
window.RRHOOK=RRHOOK;

/* ---- セーブの入れ物（スロットごと・profile の中）----
   profile.codex  ＝図鑑とライブラリの「見た」（引き継ぎコードに入る）
   profile.runlog ＝ランの記録（最新50件。引き継ぎコードには入れない＝XFER で外す）
   どちらも「足りなければ既定で埋める」。save.js の normSave は知らない項目を消さないので、SAVE_V は上げなくてよい（tech-notes 1-10 の決まり2）。 */
const RR2={dirty:0,
  P(){try{return SAVE&&SAVE.cur&&SAVE.cur.profile||null}catch(e){return null}},
  cx(){const p=this.P();if(!p)return null;let c=p.codex;
    if(!c||typeof c!=="object"||Array.isArray(c))c=p.codex={};
    ["c","cu","p","e","k","m","snd","img","use"].forEach(k=>{if(!c[k]||typeof c[k]!=="object"||Array.isArray(c[k]))c[k]={}});
    c.v=1;return c},
  /* 見た：kind＝c（カード）・cu（強化版）・p（パーツ）・e（敵・ボスと戦った）・k（倒した数）・m（ミニカー キャラ|ランク）・snd（曲）・img（一枚絵）・use（カードを使った回数） */
  mark(kind,id,add){const c=this.cx();if(!c||id==null)return;id=String(id);
    if(add){c[kind][id]=(+c[kind][id]||0)+add;this.touch();return}
    if(!c[kind][id]){c[kind][id]=1;this.touch();RRHOOK.emit("codex_new",{kind,id})}},
  has(kind,id){const c=this.cx();return!!(c&&c[kind][String(id)])},
  num(kind,id){const c=this.cx();return c?+(c[kind][String(id)]||0):0},
  /* 書くのはゲームのオートセーブにまかせる（区切りのたびに SAVE.auto）。念のため 3秒あとにも1回 */
  touch(){if(this.dirty)return;this.dirty=1;setTimeout(()=>{this.dirty=0;try{if(SAVE.cur&&!window.TUTORIAL_ON)SAVE.auto()}catch(e){}},3000)},
  tut(){return!!window.TUTORIAL_ON}};
window.RR2=RR2;

/* ===== 仮のつなぎ（shim）：①の口が入るまで、ゲームの関数を外から包んで同じ emit を出す =====
   ゲームの動きは変えない（元の関数を呼んで、そのあとで見るだけ）。 */
const RR2_SHIM=window.RR2_SHIM!==false;
function rr2Wrap(name,after,before){const f=window[name];if(typeof f!=="function")return;
  const g=function(...a){if(before)try{before.apply(this,a)}catch(e){console.error("[rr2 shim]",name,e)}
    const r=f.apply(this,a);if(after)try{after.call(this,r,a)}catch(e){console.error("[rr2 shim]",name,e)}return r};
  g.__rr2=1;g.__orig=f;window[name]=g}
function rr2InstallShim(){if(!RR2_SHIM)return;
  const handIds=()=>{try{return(B&&B.hand||[]).map(c=>c.id)}catch(e){return[]}};
  /* カード：手札・報酬・ショップの目玉・デッキの画面に出た */
  rr2Wrap("renderBattle",()=>{if(!RR2.tut())RRHOOK.emit("seen_cards",{ids:handIds()})});
  rr2Wrap("showWin",()=>{RRHOOK.emit("seen_cards",{ids:(S.rewards||[]).map(c=>c.id||c)})});
  rr2Wrap("renderDeck",()=>{try{RRHOOK.emit("seen_cards",{ids:deckUL()})}catch(e){}});
  rr2Wrap("showShop",()=>{try{const n=S.shop;if(n&&n.featPart)RRHOOK.emit("seen_parts",{ids:[n.featPart]})}catch(e){}});
  /* 強化版：一度強化した */
  rr2Wrap("uiUpgrade",null,i=>{try{const c=G.deck[i];if(c&&canUpgrade(c))RRHOOK.emit("upgraded",{id:c.id})}catch(e){}});
  /* パーツ：候補に出た */
  rr2Wrap("partsChoice",()=>{RRHOOK.emit("seen_parts",{ids:S.partOpts||[]})});
  /* 敵・ボス：戦った／倒した */
  rr2Wrap("enterBattle",()=>{try{if(!RR2.tut()&&B)RRHOOK.emit("battle_start",{key:B.key,hidden:!!B.hidden})}catch(e){}});
  rr2Wrap("afterAct",(r,a)=>{try{if(a[0]==="win"&&!RR2.tut()&&B)RRHOOK.emit("battle_win",{key:B.key,hidden:!!B.hidden})}catch(e){}});
  /* カードを使った回数 */
  {let pc=null;rr2Wrap("doPlay",()=>{try{if(pc&&B&&!B.hand.includes(pc))RRHOOK.emit("card_used",{id:pc.id})}catch(e){}pc=null},i=>{pc=!RR2.tut()&&B&&!B.over?B.hand[i]:null})}
  /* ミニカー：作った */
  rr2Wrap("saveCar",()=>{try{const L=loadMinicars(),m=L[L.length-1];if(m&&Date.now()-m.at<5000)RRHOOK.emit("minicar_made",{char:m.char,rank:m.rank})}catch(e){}});
  /* 一枚絵：見た（会話の画面で出た絵） */
  rr2Wrap("storyBg",r=>{if(r&&window.SCREEN==="scene")RRHOOK.emit("seen_img",{path:r})});
  /* 曲：流れた（SE は入れない） */
  ["bgm","jingle"].forEach(k=>{const f=SND[k];if(typeof f!=="function"||f.__rr2)return;SND[k]=function(id,o){if(id&&typeof id==="string"&&!RR2.libPlaying)RRHOOK.emit("seen_snd",{id,kind:k});return f.call(this,id,o)};SND[k].__rr2=1});
  /* ラン：始まり・終わり・あきらめ */
  rr2Wrap("newRun",()=>{RRHOOK.emit("run_start",{})});
  rr2Wrap("optsGiveUpGo",null,()=>{RRHOOK.emit("run_giveup",{})});
  rr2Wrap("showResult",(r,a)=>{RRHOOK.emit("run_end",{clear:!!a[0]})});
  /* 引き継ぎコード：ランの記録は入れない */
  if(typeof XFER==="object"&&XFER.pick&&!XFER.pick.__rr2){const f=XFER.pick;XFER.pick=function(n){const r=f.call(this,n),strip=d=>{if(!d)return d;const o=JSON.parse(JSON.stringify(d));if(o.profile)delete o.profile.runlog;return o};return{s:strip(r.s),a:strip(r.a)}};XFER.pick.__rr2=1}
  /* 画面：タイトル・リザルト・設定に②の入口を足す（①の本番では各画面の HTML に直接） */
  rr2Wrap("showTitle",()=>RRHOOK.emit("screen",{n:"title"}));
  rr2Wrap("showData",()=>RRHOOK.emit("screen",{n:"data"}));
  rr2Wrap("showResult",()=>RRHOOK.emit("screen",{n:"result"}));
  rr2Wrap("renderOpts",()=>RRHOOK.emit("screen",{n:"opts"}));
  rr2Wrap("renderBattle",()=>RRHOOK.emit("screen",{n:"battle"}));
  rr2Wrap("showHowto",()=>RRHOOK.emit("screen",{n:"howto"}));
}
/* ゲームの関数がそろってから（同じ読み込みの中なので、すぐでよい） */
rr2InstallShim();

/* ---- 小さい道具 ---- */
const rr2Esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function rr2Name(ch){try{return TEXT.names[ch]||ch}catch(e){return ch}}
function rr2Txt(k,def){try{const t=TEXT.ui&&TEXT.ui[k];return t!=null?t:def}catch(e){return def}}/* 文はシナリオ班（text の ui）。まだなければ仮の文 */
