"use strict";
/* ===== ★プログラム班③：β のあとの仲間（SORA・KAEDE・RIN・LUNA・MIO）の共通の土台 =====
   読む順：js/flow.js のあと → data/text_<子>.js（文）→ js/ally3_core.js（このファイル）→ js/ally_<子>.js（その子のデータ）→ js/ally3_ui.js（画面・音）。
   node のボット（qa/beta-sim.js など）は js/engine.js のあとに ally3_core.js と ally_<子>.js を足す（画面のファイルは要らない）。
   ①のコードは書きかえない。①の関数は外から包むだけ（一覧は revremit-ally3-handoff.md の 2章）。
   数値はすべて【仮・プログラム班③】。デザイン班の正本が来たら、ally_<子>.js の表だけ差しかえる。 */
(function(){
if(typeof CHARS==="undefined"||globalThis.ALLY3)return;
const A3=globalThis.ALLY3={ver:"ally3-0.3",chars:[],hook:{attack:[],block:[],before:[],after:[],rule:[],turn:[],freeze:[],battle:[]},sceneSE:{},style:{}};
const H=A3.hook;
A3.sameTurn=k=>B[k+"Turn"]===B.pTurns;
A3.turnVal=(k,v)=>{if(v!==undefined){B[k]=v;B[k+"Turn"]=B.pTurns;return v}return A3.sameTurn(k)?(B[k]||0):0};
/* ★v0.38 音（audio-list 19-5）：シム・画面なしでは鳴らさない。ms をつけると少しあとで */
A3.se=(id,o,ms)=>{try{if(typeof document==="undefined"||typeof SND==="undefined"||(B&&B.sim))return;if(ms)setTimeout(()=>{try{SND.se(id,o)}catch(e){}},ms);else SND.se(id,o)}catch(e){}};
A3.human=()=>typeof document!=="undefined"&&!(typeof AUTO!=="undefined"&&AUTO.on)&&!(typeof FARM!=="undefined"&&FARM.on)&&!(B&&B.sim);
A3.isChar=ch=>!!(G&&G.char===ch);

/* ---- 1人を登録する（データの形は ally_sora.js を見本に） ---- */
A3.register=function(o){const ch=o.id;if(CHARS[ch])return;A3.chars.push(ch);
  CHARS[ch]=Object.assign({name:ch,pool:null},o.char);if(!CHAR_ORDER.includes(ch))CHAR_ORDER.push(ch);
  Object.assign(CARDS,o.cards||{});Object.assign(PARTS,o.parts||{});
  CHARS[ch].pool=Object.keys(CARDS).filter(id=>!CARDS[id].gen&&CARDS[id].r!=="SK"&&(CARDS[id].own==="N"||CARDS[id].own===ch));
  UNLOCK.chars[ch]=o.unlock;
  if(o.night){const x=NIGHTS[o.night-1];if(x){x.open.chars=(x.open.chars||[]).filter(c=>c!==ch).concat(ch)}}
  if(o.boss){ENEMIES[o.boss.key]=o.boss.enemy;ALLY_BOSS[ch]=o.boss.key}
  if(o.tree)TREE[ch]=o.tree;if(o.treeBase)TREE_BASE[ch]=o.treeBase;
  if(o.style)A3.style[ch]=o.style;if(o.sceneSE)Object.assign(A3.sceneSE,o.sceneSE);
  if(o.ops)Object.assign(OPS,o.ops);
  ["attack","block","before","after","rule","turn","freeze","battle"].forEach(k=>{if(o[k])H[k].push(o[k])})};

/* ---- 2. 共通の OPS（どの子でも使える形） ---- */
Object.assign(OPS,{
 atkPlayed:(x,v,k,max)=>x.attack(v+Math.min(max,k*Math.max(0,B.cards-1))),                    // {v}＋先に打ったカードの数 ×k
 atkHitsCards:(x,v)=>{const n=Math.max(0,B.cards-1),h=1+(n>=3?1:0)+(n>=6?1:0);for(let i=0;i<h;i++)x.attack(v)},
 atkTypes:(x,v,need)=>{const s=new Set(A3.sameTurn("types")?B.types:[]);s.add("atk");x.attack(s.size>=need?v*2:v)},
 atkTurns:(x,v,k,max)=>x.attack(v+Math.min(max,k*(B.pTurns||0))),                              // 戦闘の後半ほど
 atkRedHalf:(x,v,n)=>{const h=B.playRed?1:0.5;for(let i=0;i<(n||1);i++)x.attack(Math.round(v*h*10)/10)}, // レッドの外は ×0.5
 atkLost:(x,v,k,max)=>x.attack(v+Math.min(max,Math.floor((G.maxhp-G.hp)*k))),                  // 失った耐久で伸びる
 atkIfTurn2:(x,v)=>x.attack(B.pTurns>=1?v*1.5:v),                                               // 2ターン目から ×1.5
 atkFrzMul:(x,v)=>x.attack(B.frozeTotal>0?v*1.5:v),                                             // この戦闘で凍結を与えていたら ×1.5
 atkPlusFrz:(x,v,k,max)=>x.attack(v+Math.min(max,Math.round(k*B.frozeTotal*(A3.treeTopIs("r_qmove")?1.5:1)))),
 atkPlusFrzN:(x,v,k,max)=>x.attack(v+Math.min(max,Math.round(k*(B.frzN||0)*(A3.treeTopIs("r_qmove")?1.5:1)))),
 atkIfEAtk:(x,v)=>{const a=curAct(B.e)||[];x.attack(["atk","multi","prc"].includes(a[0])?v*1.5:v)},
 atkIfEBlk:(x,v)=>x.attack(B.e.block>0?v*2:v),
 blkRed:(x,v)=>x.block(B.playRed?v*2:v),
 revUpCap:(x,a)=>{B.rpm=Math.min(limit(),B.rpm+a);addLog(`回転 +${a}（今 ${B.rpm}）`);ev({k:"revup",v:a})},
 discardFrz:(x,v)=>{const c=B.hand.pop();if(c){if(!CD(c).gen)B.disc.push(c);addLog(`「${CD(c).n}」を捨てた`)}x.freeze(v)},
 sortTop:(x,n)=>A3.sortTop(n),
 tutorTop:(x,n)=>{const L=B.draw.length;let bi=-1,bv=-1;if(B.lunaPick){bi=B.draw.findIndex(c=>c.uid===B.lunaPick);B.lunaPick=null;if(bi>=0)bv=1}if(bi<0){for(let i=Math.max(0,L-n);i<L;i++){const d=CD(B.draw[i]);const v=d.t==="atk"?100+cardVal(B.draw[i]):0;if(v>bv){bv=v;bi=i}}}
   if(bi>=0&&B.hand.length<RULES.handMax){const c=B.draw.splice(bi,1)[0];B.hand.push(c);addLog(`山札の上から「${CD(c).n}」を手札に`);ev({k:"draw",n:1})}A3.peek()},
 atkTopHeavy:(x,v,k,max)=>{const L=B.draw.length,n=B.draw.slice(Math.max(0,L-5)).filter(c=>baseCost(c,undefined,B.gear)>=2000).length;A3.peek();x.attack(v+Math.min(max,k*n))},
 atkIfTopAtk:(x,v)=>{const t=B.draw[B.draw.length-1];A3.peek();x.attack(t&&CD(t).t==="atk"?v*1.5:v)},
 atkTopCost:(x,v,max)=>{const t=B.draw[B.draw.length-1];A3.peek();x.attack(v+Math.min(max,t?Math.floor(baseCost(t,undefined,B.gear)/500):0))},
 atkPeeks:(x,v,k,max)=>x.attack(v+Math.min(max,k*(B.peekN||0))),
 atkTopAdd:(x,v,a)=>{const t=B.draw[B.draw.length-1];A3.peek();x.attack(t&&CD(t).t==="atk"?v+a:v)},/* ★v0.15 月影 */
 blkJam:(x,v,per,max)=>{x.block(v+Math.min(max,per*B.hand.filter(h=>CD(h).t==="jam").length))},/* ★v0.15 低重心 */
 millBlkN:(x,base,n,per)=>{let k=0;for(let i=0;i<n;i++){const c=B.draw.pop();if(!c)break;B.disc.push(c);k++;addLog(`山札の上「${CD(c).n}」を捨てた`)}A3.peek();x.block(base+per*k)},/* ★v0.15 新月 */
 atkRed2:(x,v)=>x.attack(B.playRed?v*2:v),/* ★v0.17 火の粉 */
 millBlk:(x,v,add)=>{const c=B.draw.pop();if(c){B.disc.push(c);addLog(`山札の上「${CD(c).n}」を捨てた`)}A3.peek();x.block(v+(add||0))},
 nextTurnDraw:(x,n)=>{B.nextDraw=(B.nextDraw||0)+n;addLog(`次の番のはじめに ${n} 枚引く`)},
 flagBattle:(x,k,v)=>{B[k]=(B[k]||0)+(v==null?1:v)},
 turnAdd:(x,k,v)=>{A3.turnVal(k,A3.turnVal(k)+v)},
});
/* ★v0.21 design 13-5-3：決まり spdAT（AT のときだけ速さを足す・RIN は −1）。G.car はランごとの写しなので、ランを始めるときにそこへ足す（③のキャラだけ。続きからは保存した G.car のまま） */
{const nr=newRunState;newRunState=function(){const r=nr.apply(this,arguments);try{if(G&&G.mode==="AT"&&A3.chars.includes(G.char)){const d=(CHARS[G.char].rule||{}).spdAT;if(d){G.car.spd+=d;G.spdAT=d}}}catch(e){}return r}}
A3.peek=()=>{B.peekN=(B.peekN||0)+1};
/* 山札の上 n 枚を、アタックが上に来るように並べかえる（見る＝peekN +1） */
A3.sortTop=n=>{const L=B.draw.length,s=Math.max(0,L-n),top=B.draw.splice(s),pk=B.lunaPick;top.sort((a,b)=>pk?(a.uid===pk?1:0)-(b.uid===pk?1:0):(CD(a).t==="atk"?1:0)-(CD(b).t==="atk"?1:0)||cardVal(a)-cardVal(b));B.lunaPick=null;B.draw.push(...top);A3.peek();addLog(`山札の上 ${top.length} 枚を並べかえた`)};
A3.treeTopIs=id=>{try{return treeTop()===id}catch(e){return false}};

/* ---- 3. ①の関数を包む（③の子・③のパーツのときだけ効く） ---- */
const _RULE=RULE;RULE=function(){let r=_RULE();if(G&&A3.chars.includes(G.char))H.rule.forEach(f=>{r=f(r)||r});return r};
const _mkCtx=mkCtx;mkCtx=function(m){const x=_mkCtx(m),a0=x.attack,f0=x.freeze;
  x.attack=function(v,raw){if(!raw&&B&&G)H.attack.forEach(f=>{v=f(v,m)});return a0.call(this,v,raw)};
  const b0=x.block;x.block=function(v){if(B&&G)H.block.forEach(f=>{v=f(v)});return b0.call(this,v)};
  x.freeze=function(v){B.frzN=(B.frzN||0)+1;const r=f0.call(this,v);H.freeze.forEach(f=>f(v));return r};
  return x};
const _playCard=playCard;playCard=function(i,shift){
  if(!B||B.over||!B.hand[i])return _playCard(i,shift);
  const c=B.hand[i],d=CD(c),cost=costOf(c),t0=B.pTurns,blk0=B.block,cards0=B.cards,ctx={c,d,cost,blk0,red:inRed(),shift};
  B.curCheap=cost<=1000;B.curCost=cost;B.curType=d.t;H.before.forEach(f=>f(ctx));
  const r=_playCard(i,shift);
  B.curCheap=false;B.curCost=0;
  if(B.over||B.pTurns!==t0||B.cards===cards0)return r;
  if(!A3.sameTurn("types")){B.types=[];B.typesTurn=B.pTurns}if(!B.types.includes(d.t))B.types.push(d.t);
  ctx.r=r;H.after.forEach(f=>f(ctx));
  return r};
const _spt=startPlayerTurn;startPlayerTurn=function(first){const r=_spt(first);
  if(B.nextDraw){const k=drawN(B.nextDraw);B.nextDraw=0;if(k)addLog(`明星：${k}枚引いた`)}
  H.turn.forEach(f=>f(first));return r};
const _sbs=startBattleState;startBattleState=function(key){const r=_sbs(key);try{H.battle.forEach(f=>f(key))}catch(e){}return r};
A3.drawHook=null;
const _drawN=drawN;drawN=function(n){if(!A3.drawHook||!B)return _drawN(n);let k=0;for(let i=0;i<n;i++){A3.drawHook();const g=_drawN(1);if(!g)break;k+=g}return k};
const _overRev=overRev;overRev=function(){if(B&&has("k_bov")&&!B.bovUsed){B.bovUsed=true;B.rpm=limit();addLog("ブローオフバルブ：オーバーレブでも耐久が減らない（1回）");ev({k:"over",v:0});return false}return _overRev()};
})();
/* ★v0.72 design 16-18・★虎雪 11-25 07:3x「KURO の特性で特定のカードは5枚とかにして」：カードごとの同じカードの上限（deckMax）。なければ①の決まり（RULES.deckLimit） */
if(typeof deckLimitOf==="function"){const dl0=deckLimitOf;deckLimitOf=function(id){const d=typeof CARDS!=="undefined"&&CARDS[id];return d&&d.deckMax||dl0(id)}}
/* ★v0.93 ゴーストの守り（design 10-17-2・v0.11.126）：③の6人。①の GHOST_GUARD（v0.22.150）に足す。①にない種類は③の名前（a3…）で、ここで効かせる。帯の特徴の行は①の gimTxt（t を「／」でつなぐ）のまま */
if(typeof GHOST_GUARD!=="undefined"){Object.assign(GHOST_GUARD,{
  SORA:{k:"a3same",n:3,v:8,t:"3枚そろうと、音を合わせて防御 +8"},
  KAEDE:{k:"a3big",v:10,t:"大技のあと、防御 +10"},
  RIN:{k:"a3cut",n:3,v:3,t:"はじめの3ターン、1発ごとに −3"},
  LUNA:{k:"a3moon",n:4,t:"満月の番は、受けるダメージ半分"},
  KURO:{k:"a3gl",n:3,v:5,t:"グリッチの数だけ、番の終わりに防御（5 まで）"},
  MIO:{k:"nth",n:1,v:3,t:"毎番、防御 +3"}});
 const gg=()=>B&&B.e&&B.e.gg,gBlk=(v,why)=>{const e=B.e;e.block+=v;addLog(`ゴーストの守り：${why?why+" ":""}防御 +${v}`);try{ev({k:"eblk",v})}catch(x){}};
 /* RIN：はじめの n ターン、1発ごとに −v ／ LUNA：n ターンに1回（満月の番＝n 番目ごと）、受けるダメージ半分 */
 if(typeof hitEnemy==="function"){const he0=hitEnemy;hitEnemy=function(d){const g=gg();if(g&&d>0){if(g.k==="a3cut"&&(B.pTurns||0)<g.n){d=Math.max(0,d-g.v);if(!B.sim)addLog(`ゴーストの守り：−${g.v}`)}else if(g.k==="a3moon"&&(B.pTurns||0)%g.n===g.n-1){d=Math.ceil(d/2);if(!B.sim)addLog("ゴーストの守り：満月で半分")}}return he0.call(this,d)}}
 /* SORA：プレイヤーが同じ種類のカードを続けて n 枚打つと、その番に1回 防御 +v ／ KURO：プレイヤーが n 枚打つごとにグリッチ +1（最大 v） */
 if(typeof playCard==="function"){const pc0=playCard;playCard=function(i){const c=B&&B.hand&&B.hand[i],t=c&&CD(c).t,g=gg(),r=pc0.apply(this,arguments);
   if(g&&c&&r!=="err"&&B.e){const e=B.e;if(g.k==="a3same"){if(e.a3sT!==B.pTurns){e.a3sT=B.pTurns;e.a3sK=null;e.a3sN=0;e.a3sDone=0}if(t===e.a3sK)e.a3sN++;else{e.a3sK=t;e.a3sN=1}if(e.a3sN>=g.n&&!e.a3sDone){e.a3sDone=1;gBlk(g.v,"音を合わせて")}}
     else if(g.k==="a3gl"){e.a3gc=(e.a3gc||0)+1;e.a3g=Math.min(g.v,Math.floor(e.a3gc/g.n))}}return r}}
 /* KAEDE：いちばん大きい攻撃を打ったすぐあとに 防御 +v ／ KURO：ゴーストが動くたび（番の終わり）にグリッチの数だけ防御 */
 if(typeof enemyStep==="function"){const es0=enemyStep;enemyStep=function(){const e=B&&B.e,g=e&&e.gg;let act=null;try{act=g&&g.k==="a3big"?curAct(e):null}catch(x){}const r=es0.apply(this,arguments);
   if(g&&B.e===e&&e.hp>0){if(g.k==="a3big"){/* 大技（いちばん大きい攻撃）を打ったすぐあと＝プレイヤーの次の番に残る防御 */const p=curPat(e),dm=a=>a[0]==="atk"?a[1]:a[0]==="multi"?a[1]*a[2]:0,mx=Math.max(...p.map(dm));if(act&&mx>0&&dm(act)>=mx)gBlk(g.v,"大技のあと")}
     else if(g.k==="a3gl"&&e.a3g>0)gBlk(e.a3g,"グリッチ")}return r}}}
