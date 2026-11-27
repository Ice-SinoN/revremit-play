/* js/dig.js（プログラム班② v0.5.21）
   フルオートでだけ見つかるカード（design 10-22-5・β の4人 × 2枚）。出方（ボスを倒すたび 1.3%＋夜・天井 60ラン）は②の farm.js（CARDS の dig:1 を見る）。
   id・数・効果は design の表のまま。v0.5.22 名前・読み・説明・フレーバーは text 41章（id は design のまま、text の id は DIG_ALIAS で読みかえ）。
   効き目（fx）は design が①に渡した8つ（halfToFrz・atkHitsHand・replayNext・atkGasAll・doubleNextRev0・atkDiscardRev0・gearReset・execute）を、
   ①の本体を書きかえずに OPS に足して作った仮。①が本体に入れたら、このファイルの「効き目」は消してよい（同じ名前なので OPS の上書きになる）。
   カードの面の予告の数字は、このファイルの fx では出ない（説明の字で読む）。 */
"use strict";
(function(){
if(typeof CARDS==="undefined"||typeof OPS==="undefined")return;
const W=(name,fn)=>{const f=window[name];if(typeof f!=="function")return;const g=fn(f);g.__dig=1;g.__orig=f;window[name]=g};
const DIG={
 y_dig_hyoukyou:{yomi:"ひょうきょう",r:"R",own:"YUKI",n:"氷鏡",t:"grd",c:1500,gas:1,v:8,fx:[["halfToFrz","v"]],d:"次に受ける攻撃のダメージの半分（最大 {v}）を、凍結にして返す。",flav:"受けた冷たさは、<br>鏡のように、そのまま返す。"},
 y_dig_dust:{yomi:"ひょうじん",r:"E",own:"YUKI",n:"氷塵",t:"atk",c:2500,gas:2,v:4,k:8,ku:8,fx:[["atkHitsHand","v","k"]],d:"{v} ダメージを、手札の枚数だけ（最大 8回）。",flav:"晴れた寒い朝、<br>光る氷の粉が、空を舞う。"},
 h_dig_tandem:{r:"R",own:"HINA",n:"タンデム",t:"rev",c:0,gas:1,sup:1,v:0.5,vu:0.75,fx:[["replayNext","v"]],d:"次に打つアタックを、もう1回打つ（2回目は ×{v}）。",flav:"うしろに、もうひとり。<br>二人ぶんの一撃。"},
 h_dig_gasketsu:{yomi:"もえつきうち",r:"E",own:"HINA",n:"燃尽打",t:"atk",c:1500,gas:0,v:6,fx:[["atkGasAll","v"]],d:"ガソリンを全部使う：使った目盛り ×{v} ダメージ。",flav:"最後の一滴まで、<br>ぜんぶ前に出す。"},
 m_dig_kaleido:{yomi:"まんげきょう",r:"R",own:"MOMO",n:"万華鏡",t:"rev",c:0,gas:1,sup:1,v:2,vu:2,fx:[["doubleNextRev0"]],d:"このターン、次に打つ回転0のカードの効果を2回（チェインは1つ）。",flav:"くるりと回せば、<br>同じ花が、ふたつ咲く。"},
 m_dig_hanaikada:{yomi:"はないかだ",r:"E",own:"MOMO",n:"花筏",t:"atk",c:2000,gas:2,v:2,k:30,ku:30,fx:[["atkDiscardRev0","v","k"]],d:"捨て札の回転0のカードの数 ×{v} ダメージ（最大 30）。",flav:"散った花びらは、<br>川をつないで、舟になる。"},
 n_dig_reverse:{r:"R",own:"NANA",n:"リバースギア",t:"rev",c:0,gas:1,sup:1,v:3,k:18,ku:18,fx:[["gearReset","v","k"]],d:"ギアを1速にもどす（回転はそのまま）。もどした段 ×{v} の防御（最大 18）。",flav:"一度もどるのは、<br>もう一度、きれいに積むため。"},
 n_dig_photo:{yomi:"しゃしんはんてい",r:"E",own:"NANA",n:"写真判定",t:"atk",c:3000,gas:2,v:40,fx:[["execute","v"]],d:"敵の体力が 20% 以下なら倒す（ボス・その子のボスには {v} ダメージ）。",flav:"鼻の差でも、勝ちは勝ち。<br>写真が、それを決める。"},
};
Object.entries(DIG).forEach(([id,d])=>{if(CARDS[id])return;CARDS[id]=Object.assign({dig:1},d);const ch=CHARS[d.own];if(ch&&Array.isArray(ch.pool)&&!ch.pool.includes(id))ch.pool.push(id)});
window.DIG_ALIAS=Object.assign(window.DIG_ALIAS||{},{y_dig_hyoujin:"y_dig_dust",h_dig_moetsuki:"h_dig_gasketsu"});/* text 41 の id → design の id */
window.digId=id=>window.DIG_ALIAS[id]||id;
/* 改造・合成の材料にはしない（design 10-22-5） */
W("modKind",f=>function(id){if(CARDS[id]&&CARDS[id].dig)return null;return f.apply(this,arguments)});

/* ===== 効き目（仮） ===== */
let lastM=1;W("mkCtx",f=>function(m){lastM=m;return f.apply(this,arguments)});
const ADD={
 halfToFrz:(x,v)=>{B.digMirror=v;addLog(`氷鏡：次に受ける攻撃の半分（最大 ${v}）を凍結で返す`)},
 atkHitsHand:(x,v,k)=>{const n=Math.min(k||8,B.hand.length);for(let i=0;i<n;i++)x.attack(v);addLog(`手札 ${n}枚ぶん`)},
 replayNext:(x,v)=>{B.digReplay=v;addLog(`次のアタックをもう1回（×${v}）`)},
 atkGasAll:(x,v)=>{const n=Math.max(0,B.gas|0);B.gas=0;if(n)x.attack(v*n);addLog(`ガソリン ${n} 目盛りを使った`)},
 doubleNextRev0:()=>{B.digDouble0=B.turn==null?true:B.turn;addLog("次の回転0のカードは2回")},
 atkDiscardRev0:(x,v,k)=>{const n=B.disc.filter(c=>(CD(c).c|0)===0&&CD(c).t!=="jam").length;x.attack(Math.min(k||30,n*v));addLog(`捨て札の回転0：${n}枚`)},
 gearReset:(x,v,k)=>{const n=B.gear|0;B.gear=0;const b=Math.min(k||18,n*v);if(b)x.blockRaw(b);addLog(`ギアを1速に（${n}段もどした）`);try{SND.gear()}catch(e){}},
 execute:(x,v)=>{const e=B.e;if(e.rank==="boss"){x.attack(v);return}if(e.hp>0&&e.hp<=e.maxhp*0.2){addLog("フォトフィニッシュ！");x.attack(e.hp+(e.block||0),true)}else addLog("フォトフィニッシュ：まだ届かない")},
};
Object.keys(ADD).forEach(k=>{if(!OPS[k])OPS[k]=ADD[k]});
/* 二人乗り・万華鏡：カードを打ったあとに、そのカードの効果をもう1回（二人乗り＝アタックに ×v・万華鏡＝回転0のカードに ×1）。チェインは数えない */
W("playCard",f=>function(i,shift){const c=B&&B.hand&&B.hand[i];const r=f.apply(this,arguments);
  try{if(!c||!B||B.over||B.playUid!==c.uid)return r;const d=CD(c);let mul=0,why="";
   if(B.digReplay&&d.t==="atk"&&!d.fx.some(q=>q[0]==="replayNext")){mul=B.digReplay;B.digReplay=0;why="二人乗り"}
   else if(B.digDouble0&&(d.c|0)===0&&d.t!=="atk"&&!d.fx.some(q=>q[0]==="doubleNextRev0")){mul=1;B.digDouble0=false;why="万華鏡"}
   if(mul){const x=mkCtx(lastM*mul),v=cardVal(c),kv=typeof kOf==="function"?kOf(c):null,jv=typeof jOf==="function"?jOf(c):null;addLog(`${why}：もう1回`);
    d.fx.forEach(q=>{const op=OPS[q[0]];if(op)op(x,...q.slice(1).map(a=>argOf(a,v,kv,jv)))});if(typeof checkPhase==="function")checkPhase()}}catch(e){console.error("[dig] replay",e)}return r});
/* 氷鏡：次に受ける攻撃（1発目）の半分を凍結に */
W("enemyHit",f=>function(v,pierce){const arm=B&&B.digMirror;let raw=0;try{if(arm)raw=eAtk(B.e,v)}catch(e){}const r=f.apply(this,arguments);
  if(arm&&B){B.digMirror=0;const z=Math.min(arm,Math.floor(raw/2));if(z>0){addLog(`氷鏡：凍結 ${z} を返した`);mkCtx(1).freeze(z)}}return r});
/* 万華鏡はそのターンだけ（ターン終了で消える） */
W("endTurn",f=>function(){if(B)B.digDouble0=false;return f.apply(this,arguments)});
window.DIG_CARDS_B2=Object.keys(DIG);
/* ===== v0.5.22 text 41 の知らせ・図鑑の文 ===== */
TEXT.ui=Object.assign({dig_log:"★ {card}を、見つけた！",dig_head:"フルオートで見つけた！",dig_sub:"自分で走るときも、使えます。",dig_title:"フルオートで、新しいカードが見つかりました：{card}",dex_how_dig:"フルオートで見つかる（ごくまれ）",dex_how_dig_got:"フルオートで見つけた"},TEXT.ui||{});
/* 次にタイトルを開いたとき1回（farm.js が localStorage rr_dig_title にためる。フルオート中は出さない） */
W("showTitle",f=>function(){const r=f.apply(this,arguments);try{if(window.FARM&&FARM.on)return r;const k="rr_dig_title",L=JSON.parse(localStorage.getItem(k)||"[]").filter(id=>CARDS[id]);if(!L.length)return r;localStorage.removeItem(k);
  const u=typeof ui==="function"&&ui();if(!u)return r;const d=document.createElement("div");d.className="digtitle";d.textContent=TEXT.ui.dig_title.replace("{card}",L.map(id=>CARDS[id].n).join("・"));
  Object.assign(d.style,{position:"absolute",left:"80px",top:"14px",width:"480px",boxSizing:"border-box",padding:"4px 8px",background:"#0A0812",color:"#FFD34D",border:"1px solid #FFD34D",fontSize:"12px",lineHeight:"16px",textAlign:"center",zIndex:30,pointerEvents:"none",whiteSpace:"normal"});
  u.appendChild(d);setTimeout(()=>{try{d.remove()}catch(e){}},5000);}catch(e){}return r});
})();
