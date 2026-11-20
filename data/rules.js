"use strict";
/* ===== ランの決まりと数値（α2：design v0.3 4章）===== */
const RULES={
  hand0:7,handMax:10,
  // ★ガソリン（虎雪 11-06 07:32）：5目盛り・番のはじめに満タン
  gasMax:5,gasUp:1,gasPerfect:2,gasDown:1,gasPark:2,gasSpeed:0.1,
  // ★つながり（虎雪 11-06 07:26）
  chainStep:0.10,chainMax:10,bandMul:1.5,
  // 止め（design 0-6）
  shiftCap:3,cardCap:12,multCap:5,frzCap:40,
  red:{MT:7000,AT:6000},areaHeal:0.3,
  atMult:0.9,atLimiter:0.5,atAutoDown:3500,atFirstGas:0,/* ★v0.22.46 AT の1ターン最初の自動シフトも +1（LD 11-30・チーフ 21:40） */
  overDmg:8,overDmgCool:4,money0:30,partsMax:5,
  gold:{battle:[18,28],elite:40,boss:40,otk:15,cat:10},ticketRate:0.15,
  featRate:0.25,saleRate:0.25,featPrice:60,sale:0.7,ticket:0.5,
  carryCardP:0.15,otherCardW:0.3,sellRate:0.4,sellOwnAdd:10,/* ★v0.22.37 design 10-14（持ちこんだミニカー）・10-19（パーツの売却） */
  restRate:0.3,upMult:1.5,
  mtLockDraw:1,atLowDraw:2,frzDelayCap:2,// ★v0.22.1 design v0.9 0-8・5-1b（MT の詰み・AT の詰まり・凍結の上限）
  deckSize:20,deckLimit:{C:4,R:2,E:1,SK:1},rarityW:{C:60,R:30,E:10},// 上限は★RA-01（ラン前のデッキだけ）
};
const TUNE={tire:["タイヤ","防御：ギアが上がるほど、受けるダメージが減る（段ごとに強く）"],
 shift:["シフト","グッド・パーフェクトの帯が広がる"],engine:["エンジン","エンジン耐久（体力）の最大 +10"],
 light:["軽量化","段3・段5でガソリンの最大 +1"],ecu:["ECU","攻撃力 +10%"]};
const TUNE_PRICE=[30,45,65,90,120];
/* ミニカー */
const RANKS=["E","D","C","B","A","S","SS","SSS"];
const RANK_TH=[20,35,50,65,80,95,110];/* ★v0.22.65 LD 11-39（★虎雪 08:45） */
const MC_BONUS={hp:[2,3,4,6,8,10,12,15],atk:[0,0,2,3,4,6,8,10]};
const MINICAR_MAX=60,BRING_MAX=2,MC_CARDS=2,MC_DRAW=10;
/* マップ：[種類,重み,出はじめる段(0始まり)]（design 付録） */
const NODE_W=[["battle",50,1],["elite",12,3],["shop",10,2],["sim",10,2],["lucky",8,2],["garage",10,4]];
