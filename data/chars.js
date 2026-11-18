"use strict";
/* ===== キャラと車（v0.8）=====
   車の type："mt"＝段つきのギア（今はこれだけ）。MIO の CVT・KURO の心拍は、あとで type を足してシフトの処理を分ける。
   数値はすべて仮。正本は revremit-concept.md・revremit-cards.md */
const CHARS={
  YUKI:{
    name:"YUKI",carName:"スイフトスポーツ ZC33S",weapon:"スノークロウ",type:"凍結・守り",join:0,
    car:{type:"mt",gears:6,mult:[1.0,1.2,1.4,1.6,1.8,2.0],
      red:7000,limit:8000,band:[5500,6500],core:[5800,6200],
      idle:1000,brake:3000,hp:60,spd:10,minShift:4000,
      upDrop:0.6,earlyDrop:0.45,downDiv:0.6,
      bands:{L:[1000,3000],M:[3000,5500],R:[7000,8000]}},// ★回転数の帯（打つ前の回転。R はレッドゾーン〜リミット）
    deck:[["hyouga",4],["braking",2],["qshift",2],["hakusen",2],["slip",2],["blip",2],["sasame",2],["counter",2],["whiteout",1],["shironeko",1]],
    pool:null,// 報酬の候補：生成・固有スキル以外の全部（data/cards.js の最後で入れる）
    skill:"shironeko",rule:{},ruleTxt:"",
  },
  /* ===== ★v0.22 β の仲間3人（design v0.8 9-10。数値は全部仮・名前は仮）=====
     rule：キャラの決まり。firstGas＝戦闘の最初のターンのガソリン +n／chainStep＝チェイン1つの伸び／shiftCap＝1ターンのシフトアップの回数
     join：その夜を初めてクリアしたら加わる（NIGHTS の open.chars）。絵はまだないので YUKI の絵で出す（仮） */
  HINA:{
    name:"HINA",carName:"モンキー125",weapon:"ピストンハンマー",type:"速攻",join:1,
    car:{type:"mt",gears:5,mult:[1,1.3,1.6,1.9,2.2],/* ★v0.22.7 design 10-3 */
      red:7500,limit:8500,band:[4500,5500],core:[4800,5200],
      idle:1000,brake:3000,hp:60,spd:16,minShift:3000,
      upDrop:0.6,earlyDrop:0.45,downDiv:0.6,
      bands:{L:[1500,3500],M:[3500,6000],R:[7500,8500]}},
    deck:[["h_youda",3],["h_gouda",2],["h_kagerou",2],["h_kneegrip",2],["h_hidamari",2],["h_sunrise",1],["h_kickstart",2],["braking",2],["qshift",2],["slip",1],["blip",1]],
    pool:null,skill:"h_sunrise",rule:{firstGas:2,halfDmg:2},ruleTxt:"戦闘の最初のターンはガソリン +2・最初の2ターンは受けるダメージ半分",
  },
  MOMO:{
    name:"MOMO",carName:"ロードスター ND",weapon:"ロードスピナー",type:"チェイン",join:2,
    car:{type:"mt",gears:6,mult:[1.0,1.15,1.3,1.45,1.6,1.75],
      red:6800,limit:8000,band:[4000,5000],core:[4300,4700],/* ★v0.22.7 design 10-3 */
      idle:1000,brake:3000,hp:75,spd:14,minShift:3000,
      upDrop:0.6,earlyDrop:0.45,downDiv:0.6,
      bands:{L:[1000,2500],M:[2500,4000],R:[6800,8000]}},
    deck:[["m_touka",4],["m_rinjin",2],["m_hanawa",2],["m_softtop",1],["m_hanaakari",1],["m_kinen",2],["m_hougou",1],["braking",2],["qshift",2],["slip",1],["blip",2]],
    pool:null,skill:"m_hougou",rule:{chainStep:0.15,chainBlk:10},ruleTxt:"チェインのボーナスが1つ +15%（ほかは +10%）・ターンの終わりにチェインの数だけ防御（10まで）",
  },
  NANA:{
    name:"NANA",carName:"GR スープラ",weapon:"ストレートシックス",type:"シフト連打",join:3,
    car:{type:"mt",gears:8,mult:[1.0,1.12,1.24,1.36,1.48,1.6,1.72,1.84],
      red:6500,limit:7000,band:[4500,5500],core:[4800,5200],
      idle:1000,brake:3000,hp:70,spd:9,minShift:3000,
      upDrop:0.6,earlyDrop:0.45,downDiv:0.6,
      bands:{L:[1000,2500],M:[2500,4500],R:[6500,7000]}},
    deck:[["n_koutotsu",2],["n_hosaki",4],["n_hachiren",2],["n_downforce",2],["n_houyoku",2],["n_phoenix",1],["braking",2],["qshift",2],["slip",2],["blip",1]],
    pool:null,skill:"n_phoenix",rule:{shiftCap:4,perfBlk:3},ruleTxt:"シフトアップは1ターン4回まで（ほかは3回）・パーフェクトのたびに防御 +3",
  },
};
const CHAR_ORDER=["YUKI","HINA","MOMO","NANA"];
