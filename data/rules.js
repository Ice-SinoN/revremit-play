"use strict";
/* ===== ランの決まりと数値（α2：design v0.3 4章）===== */
const RULES={
  hand0:7,handMax:10,
  // ★ガソリン（虎雪 11-06 07:32）：5目盛り・番のはじめに満タン
  perfChain:{step:0.1,max:0.5},drive:{eco:{mult:0.85,gas:1},sport:{mult:1.0,gas:0}},driveGasCap:7,/* ★v0.22.98 design 14-3③ ドライブモード（AT の ×0.9 のかわり） *//* ★v0.22.96 design 14-3② パーフェクトの倍率は連続で +0.3 → +0.4 → +0.5（最大） */gasMax:5,gasUp:1,gasPerfect:2,gasDown:1,gasPark:2,gasSpeed:0.1,
  // ★つながり（虎雪 11-06 07:26）
  chainStep:0.10,chainMax:10,bandMul:1.5,
  // 止め（design 0-6）
  shiftCap:3,cardCap:12,multCap:5,weakMul:1.3,/* ★v0.22.123 弱点ギアのダメージ（最終倍率の上限の中）。★v0.22.129 LD 11-86：×1.5 → ×1.3 */frzCap:40,
  red:{MT:7000,AT:6000},areaHeal:0.3,
  atMult:0.9,atLimiter:0.5,atAutoDown:3500,atFirstGas:0,/* ★v0.22.46 AT の1ターン最初の自動シフトも +1（LD 11-30・チーフ 21:40） */
  overDmg:8,overDmgCool:4,money0:30,partsMax:5,
  gold:{battle:[18,28],elite:40,boss:40,otk:15,cat:10},ticketRate:0.15,
  featRate:0.25,saleRate:0.25,featPrice:60,sale:0.7,ticket:0.5,
  carryCardP:0.15,otherCardW:0.3,sellRate:0.4,sellOwnAdd:10,/* ★v0.22.37 design 10-14（持ちこんだミニカー）・10-19（パーツの売却） */
  restRate:0.3,upMult:1.5,
  mtLockDraw:1,atLowDraw:2,frzDelayCap:2,// ★v0.22.1 design v0.9 0-8・5-1b（MT の詰み・AT の詰まり・凍結の上限）
  deckSize:20,deckLimit:{C:4,R:2,E:1,SK:1,OG:1},ogMultCap:3,ogDeckMax:1,ogRewardP:{boss:0.03,elite:0.01},ogNight:4,rarityW:{C:60,R:30,E:10},// 上限は★RA-01（ラン前のデッキだけ）
};
const TUNE={tire:["タイヤ","防御：ギアが上がるほど、受けるダメージが減る（段ごとに強く）"],
 shift:["シフト","グッド・パーフェクトの帯が広がる"],engine:["エンジン","エンジン耐久（体力）の最大 +10"],
 light:["軽量化","段3・段5でガソリンの最大 +1"],ecu:["ECU","攻撃力 +10%"]};
const TUNE_PRICE=[30,45,65,90,120];
/* ミニカー */
const RANKS=["E","D","C","B","A","S","SS","SSS"];
const RANK_TH={E:0,D:20,C:35,B:50,A:65,S:78,SS:90,SSS:100};/* ★v0.22.71 design 10-23：走りの中身だけ・夜の加点なし */
const RANK_LOSS_CAP={1:"C",2:"B",3:"A"};/* ★v0.22.73 design：負けたランは負けたエリアで上限（S 以上は全クリアだけ） */
function rankLossCap(n,N){N=N||3;return N===3&&RANK_LOSS_CAP[n]?RANK_LOSS_CAP[n]:n>=N?"A":n===N-1?"B":"C"}/* エリアが4・5：最後 A・1つ前 B・ほか C */
const RANK_CAP={1:"S",2:"S",3:"SS",4:"SS",5:"SS"};/* ★v0.22.71 design 10-23：夜ごとの上限（6〜11 は SSS） */
const MC_BONUS={hp:[2,3,4,6,8,10,12,15],atk:[0,0,2,3,4,6,8,10]};
const MINICAR_MAX=60,BRING_MAX=2,MC_CARDS=2,MC_DRAW=10;
/* マップ：[種類,重み,出はじめる段(0始まり)]（design 付録） */
const NODE_W=[["battle",50,1],["elite",12,3],["shop",10,2],["sim",10,2],["lucky",8,2],["garage",10,4]];
/* ★v0.22.130 LD 11-87：雨のチェイン +5% → +3%。★v0.22.126 路面コンディション（天候・design 10-16-1）。今は雨・雪だけ出す（霧・夜明けは背景が届いてから＝WX_ON に足す）。数は仮・LD と確かめる */
const WEATHER={dry:{n:"ドライ"},rain:{n:"雨",chainAdd:0.03,coreMul:0.5},snow:{n:"雪",frzMul:1.5,bandMul:0.7},fog:{n:"霧",shiftBlk:2,hideIntent:1},dawn:{n:"夜明け",gas1:1,redDown:500,eAtk:1.1}};
const WX_W={street:{dry:50,rain:25,snow:0,fog:15,dawn:10},touge:{dry:30,rain:10,snow:30,fog:20,dawn:10},circuit:{dry:45,rain:25,snow:5,fog:5,dawn:20}};
const WX_ON=["dry","rain","snow"];
/* ★v0.22.131 ヒート（design 10-17-1）：0〜5。勝つ +1・エリート（裏道も）+2・悪い所が効く天候で勝つ +1。ガレージで 0・ショップ／シム／ラッキー −1・ボスに勝つ −2。1段につき パーツ代 +10%・レア度 C −6／R +4／E +2・敵の体力と攻撃 +3%（ボスにも） */
RULES.heat={max:5,win:1,elite:2,badWx:1,garage:0,shop:-1,boss:-2,gold:0.1,hpAtk:0.03,rar:[-6,4,2]};
