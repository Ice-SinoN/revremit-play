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
  atMult:0.9,atLimiter:0.5,atAutoDown:3500,atFirstGas:1,
  overDmg:8,overDmgCool:4,money0:30,partsMax:5,
  gold:{battle:[18,28],elite:40,boss:40,otk:15,cat:10},ticketRate:0.15,
  featRate:0.25,saleRate:0.25,featPrice:60,sale:0.7,ticket:0.5,
  restRate:0.3,upMult:1.5,
  deckSize:20,deckLimit:{C:4,R:2,E:1,SK:1},rarityW:{C:60,R:30,E:10},// 上限は★RA-01（ラン前のデッキだけ）
};
const TUNE={tire:["タイヤ","防御：ギアが上がるほど、受けるダメージが減る（段ごとに強く）"],
 shift:["シフト","グッド・パーフェクトの帯が広がる"],engine:["エンジン","エンジン耐久（体力）の最大 +10"],
 light:["軽量化","段3・段5でガソリンの最大 +1"],ecu:["ECU","攻撃力 +10%"]};
const TUNE_PRICE=[30,45,65,90,120];
/* ミニカー */
const RANKS=["E","D","C","B","A","S","SS","SSS"];
const RANK_TH=[10,25,40,55,80,95,110];
const MC_BONUS={hp:[2,3,4,6,8,10,12,15],atk:[0,0,2,3,4,6,8,10]};
const MINICAR_MAX=60,BRING_MAX=2,MC_CARDS=2,MC_DRAW=10;
/* マップ：[種類,重み,出はじめる段(0始まり)]（design 付録） */
const NODE_W=[["battle",50,1],["elite",12,3],["shop",10,2],["sim",10,2],["lucky",8,2],["garage",10,4]];
