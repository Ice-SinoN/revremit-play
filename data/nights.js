"use strict";
/* ===== ★v0.21 夜（NIGHT 1〜11）：design v0.6 9-4（おすすめで進めた・★progression 1-5）=====
   決まりは前の夜のぶんに足していく。nightRules(n) で n までの合計を返す。
   開く：クリアで次の夜（unlock.nightMax）・仲間（chars）・話（story）・パーツ（9-5）。 */
const NIGHTS=[
 {n:1, add:"（基準）ブローなし",                         open:{chars:["HINA"],story:["n1"]}},
 {n:2, add:"エリートのマスが出やすい",                   open:{chars:["MOMO"],story:["n2"],parts:["drysump","forged"]}},
 {n:3, add:"ブローあり",                                 open:{chars:["NANA"],story:["n3"],parts:["dogmt","synchro"]}},
 {n:4, add:"敵の体力 +10%",                              open:{chars:["SORA"],story:["n4"],parts:["studless","spike"]}},
 {n:5, add:"ボスのあとの回復 30% → 10%",                 open:{chars:["KAEDE"],story:["n5"],parts:["subcon","qrelease"]}},
 {n:6, add:"エリートの体力・攻撃 +20%",                  open:{chars:["RIN"],story:["n6"],parts:["dashcam","etc","aero"]}},
 {n:7, add:"敵の攻撃 +10%",                              open:{chars:["LUNA"],story:["n7"]}},
 {n:8, add:"お金が少ない（最初 0・戦闘のお金 −20%）",    open:{chars:["MIO"],story:["n8"]}},
 {n:9, add:"ボスの体力 +15%",                            open:{chars:["KURO"],story:["n9"]}},
 {n:10,add:"初めのデッキに泥はね1枚",                    open:{story:["n10"]}},
 {n:11,add:"エンジン耐久の最大 −10",                     open:{story:["n11"]}},
];
function nightRules(n){n=n||0;return{
  noBlow:n>0&&n<3,            // NIGHT 1・2：最大ギアでリミットをこえてもオーバーレブ（n=0 は夜なし＝α・チュートリアル：ブローあり）
  eliteW:n>=2?20:null,        // エリートの重み 12 → 20
  hpMul:n>=4?1.1:1,           // 敵の体力（全部）
  areaHeal:n>=5?0.1:null,     // ボスのあとの回復
  eliteMul:n>=6?1.2:1,        // エリートの体力・攻撃
  atkMul:n>=7?1.1:1,          // 敵の攻撃（全部）
  money0:n>=8?0:null,goldMul:n>=8?0.8:1,
  bossMul:n>=9?1.15:1,        // ボスの体力
  startJam:n>=10?["mud"]:[],  // 初めのデッキ
  maxHp:n>=11?-10:0}}
