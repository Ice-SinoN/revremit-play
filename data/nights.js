"use strict";
/* ===== ★v0.21 夜（NIGHT 1〜11）：design v0.6 9-4（おすすめで進めた・★progression 1-5）=====
   決まりは前の夜のぶんに足していく。nightRules(n) で n までの合計を返す。
   開く：クリアで次の夜（unlock.nightMax）・仲間（chars）・話（story）・パーツ（9-5）。 */
/* ★v0.22.77 design 10-23：夜ごとの敵の体力（10-2 の ×1.15 の上にかける。9-4 の「NIGHT 4 +10%」を置きかえ。N5 以降は仮） */
const NIGHT_HP={1:1.0,2:2.0,3:2.0,4:2.0,/* ★v0.22.88 LD balance 11-46 A：N2〜N4 を ×2.0 に（B＝もどすなら 2:2.2,3:2.2,4:2.3） */5:2.7,6:2.9,7:3.1,8:3.3,9:3.5,10:3.7,11:3.9};
/* ★v0.22.139 夜の顔（design 12-3・NIGHT 1〜4＝β）：その夜だけ（次の夜に持ちこさない）。wx＝その天候のマスの割合（ほかは今の抽選）・splash＝エリートが「スプラッシュ」・fogView＝マップは n 段先まで・frzReward＝凍結のカードが報酬に出やすい */
const NIGHT_FACE={1:{n:"はじめての夜",l:"いつもの ROAD"},2:{n:"雨の夜",l:"雨のマスが多い・エリートは「スプラッシュ」（泥はね）",wx:{rain:0.5},splash:1},3:{n:"霧の夜",l:"霧のマスが多い・マップは3段先まで",wx:{fog:0.4},fogView:3},4:{n:"雪の夜",l:"雪のマスが多い・凍結のカードが報酬に出やすい",wx:{snow:0.5},frzReward:1.5},
 /* ★v0.22.195 design 12-3 夜の顔 NIGHT 5〜11（その夜だけ）。名前と1行は仮（シナリオ班が整える）。数は仮（LD が測る） */
 5:{n:"湾岸の夜",l:"高速が入る・夜明けのマスが多い",wx:{dawn:0.3}},
 6:{n:"影の夜",l:"ライバルのゴーストが2回まで・ゴーストの報酬が4つから",ghostMax:2,ghostOpts:4},
 7:{n:"嵐の夜",l:"戦闘の3ターン目に天候が変わる（はじめに知らせる）",storm:2},
 8:{n:"閉店の夜",l:"ショップが半分・ラッキーとシムが多い",nodeMul:{shop:0.5,lucky:1.5,sim:1.5}},
 9:{n:"港の夜",l:"港が入る・エリートのマスでヒート +1",eliteHeat:1},
 10:{n:"混線の夜",l:"敵の攻撃に混線が入ることがある・報酬で合成の組み合わせが1つ見える",jamP:0.25,jamId:"crosstalk",fuseHint:1},
 11:{n:"最後の夜",l:"全部の天候が出る・エリアのボスが第2形態から",wxAll:1,bossP2:1}};
function nightFace(n){return NIGHT_FACE[n]||null}
const NIGHTS=[
 {n:1, add:"（基準）ブローなし",                         open:{chars:["HINA"],story:["n1"]}},
 {n:2, add:"エリートのマスが出やすい・敵の体力 ×2.0",open:{chars:["MOMO"],story:["n2"],parts:["drysump","forged"]}},
 {n:3, add:"ブローあり・敵の体力 ×2.0",                                 open:{chars:["NANA"],story:["n3"],parts:["dogmt","synchro"]}},
 {n:4, add:"敵の体力 ×2.0",                              open:{chars:[],next:"SORA",story:["n4"],parts:["studless","spike"]}},
 {n:5, add:"ボスのあとの回復 30% → 10%・敵の体力 ×2.7",                 open:{chars:["KAEDE"],story:["n5"],parts:["subcon","qrelease"]}},
 {n:6, add:"エリートの体力・攻撃 +20%・敵の体力 ×2.9",                  open:{chars:["RIN"],story:["n6"],parts:["dashcam","etc","aero"]}},
 {n:7, add:"敵の攻撃 +10%・敵の体力 ×3.1",                              open:{chars:["LUNA"],story:["n7"]}},
 {n:8, add:"お金が少ない（最初 0・戦闘のお金 −20%）・敵の体力 ×3.3",    open:{chars:["MIO"],story:["n8"]}},
 {n:9, add:"ボスの体力 +15%・敵の体力 ×3.5",                            open:{chars:["KURO"],story:["n9"]}},
 {n:10,add:"初めのデッキに泥はね1枚・敵の体力 ×3.7",                    open:{story:["n10"]}},
 {n:11,add:"エンジン耐久の最大 −10・敵の体力 ×3.9",                     open:{story:["n11"]}},
];
/* ★v0.22 β は NIGHT 4 まで（design 9-10・チーフ 11-18 10:26）。NIGHT 4 のクリアで「次の仲間は……？」だけ見せる */
const BETA_NIGHTS=4;
function nightRules(n){n=n||0;return{
  noBlow:n>0&&n<3,            // NIGHT 1・2：最大ギアでリミットをこえてもオーバーレブ（n=0 は夜なし＝α・チュートリアル：ブローあり）
  eliteW:n>=2?20:null,        // エリートの重み 12 → 20
  fork:n>=2?1:0,              // ★v0.22.144 design 24-1：NIGHT 2 から、各エリアの真ん中の段（1/3〜2/3）に分かれ道を1つ足す（段の数は同じ）
  hpMul:n>0&&NIGHT_HP[n]||1,  // 敵の体力（全部）★v0.22.77 design 10-23 の表（v0.22.72 の N2 ×2.2・9-4 の N4 ×1.1 を置きかえ）
  areaHeal:n>=5?0.1:null,     // ボスのあとの回復
  eliteMul:n>=6?1.2:1,        // エリートの体力・攻撃
  atkMul:n>=7?1.1:1,          // 敵の攻撃（全部）
  money0:n>=8?0:null,goldMul:n>=8?0.8:1,
  bossMul:n>=9?1.15:1,        // ボスの体力
  startJam:n>=10?["mud"]:[],  // 初めのデッキ
  maxHp:n>=11?-10:0}}
