"use strict";
/* ===== キャラと車（v0.8）=====
   車の type："mt"＝段つきのギア（今はこれだけ）。MIO の CVT・KURO の心拍は、あとで type を足してシフトの処理を分ける。
   数値はすべて仮。正本は revremit-concept.md・revremit-cards.md */
const CHARS={
  YUKI:{
    name:"YUKI",carName:"スイフトスポーツ ZC33S",
    car:{type:"mt",gears:6,mult:[1.0,1.2,1.4,1.6,1.8,2.0],
      red:7000,limit:8000,band:[5500,6500],core:[5800,6200],
      idle:1000,brake:3000,hp:60,spd:10,minShift:4000,
      upDrop:0.6,earlyDrop:0.45,downDiv:0.6,
      bands:{L:[1000,3000],M:[3000,5500],R:[7000,8000]}},// ★回転数の帯（打つ前の回転。R はレッドゾーン〜リミット）
    deck:[["hyouga",4],["braking",2],["qshift",2],["hakusen",2],["slip",2],["blip",2],["sasame",2],["counter",2],["whiteout",1],["shironeko",1]],
    pool:null,// 報酬の候補：生成・固有スキル以外の全部（data/cards.js の最後で入れる）
    skill:"shironeko",
  },
};
