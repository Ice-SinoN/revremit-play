"use strict";
/* ===== 敵とエリア（α2：design v0.3 2章）=====
   pat 行動の順：atk 攻撃 / multi [v,回数] / blk 防御 / buf 攻撃アップ / rev 回転＋ / jam [id,枚数] 山札にジャマ / apd 次の番のガソリン −1 / prc 防御を無視する攻撃
   gim（特徴）：rage 動くたびに攻撃＋ / five 1ターンに5枚ごとに受けるダメージ −30% / blkKeep 防御を次へ残す割合 / first 先に動く
     accel 動くたびに速く（6まで）/ halfFrz 凍結が半分 / cap 1ターンのアタックの枚数 / mirror 防御の割合を次の攻撃に / morph 形が変わる / phase 体力の割合で第2形態
   体力・攻撃はエリアの倍率（hpMul・bossMul・atkMul）をかける前。
   見た目：art＝絵のもと（ENEMY_ART）、pal＝色変え（js/pixel.js の PALS）、scale。★エリートは雑魚の色変え */
const ENEMIES={
 van:{art:"van",n:"ゴーストバン",hp:44,spd:9,pat:[["atk",10],["atk",10],["blk",10]]},
 bike:{art:"bike",n:"グリッチバイク",hp:32,spd:14,pat:[["atk",6],["multi",4,2]]},
 sedan:{art:"sedan",n:"シャドウセダン",hp:54,spd:8,pat:[["blk",12],["atk",15],["atk",12]]},
 minivan:{art:"minivan",n:"スモークミニバン",hp:48,spd:8,pat:[["blk",14],["atk",9],["atk",9]],blkKeep:1,gimTxt:"防御が次の番まで残る"},
 wraith:{art:"wraith",n:"ナイトレイス",rank:"elite",hp:110,spd:11,pat:[["atk",11],["multi",4,3],["atk",14]],rage:1,gimTxt:"動くたびに攻撃 +1"},
 boss1:{wx2:"rain",/* ★v0.22.128 第2形態の天候 */weakGear:"low",/* ★v0.22.123 design 10-16-2 弱点ギア */art:"boss1",n:"残光",rank:"boss",hp:230,spd:10,pat:[["blk",18],["atk",16],["rev",1500],["multi",6,3],["atk",22]],blkKeep:0.5,gimTxt:"防御の半分が次の番まで残る"},
 coupe:{art:"coupe",n:"ヘアピンクーペ",hp:62,spd:11,pat:[["atk",12],["multi",5,2],["atk",14]],first:1,gimTxt:"先に動く"},
 kei:{art:"kei",n:"ラスティケイトラ",hp:80,spd:7,pat:[["blk",15],["atk",22]]},
 offbike:{art:"offbike",n:"ミストバイク",hp:50,spd:15,pat:[["multi",4,3],["atk",8]]},
 rally:{art:"rally",n:"マッドラリー",hp:66,spd:10,pat:[["atk",10],["jam","mud",2],["atk",12]]},
 downhill:{art:"downhill",n:"ランナウェイ",rank:"elite",hp:170,spd:9,pat:[["atk",16],["blk",15],["atk",24]],accel:1,gimTxt:"動くたびに速くなる"},
 boss2:{wx2:"snow",/* ★v0.22.128 第2形態の天候 */weakGear:"mid",/* ★v0.22.123 design 10-16-2 弱点ギア */art:"boss2",n:"白夜",rank:"boss",hp:380,spd:10,pat:[["atk",18],["multi",7,3],["blk",25],["atk",28]],five:1,mirror:0.5,gimTxt:"5枚ごとに受けるダメージ −30%・防御の半分を次の攻撃に"},
 touring:{art:"touring",n:"ファントムツーリング",hp:95,spd:10,pat:[["atk",16],["blk",16],["atk",18]]},
 formula:{art:"formula",n:"グリッチフォーミュラ",hp:72,spd:16,pat:[["multi",6,3],["atk",10]]},
 gtcar:{art:"gtcar",n:"ヴォイドGT",hp:105,spd:9,pat:[["blk",20],["prc",26]]},
 safety:{art:"safety",n:"イエローセーフティ",hp:85,spd:8,pat:[["blk",12],["apd",20],["atk",14]]},
 wrecker:{art:"wrecker",n:"アンカー",rank:"elite",hp:260,spd:10,pat:[["atk",18],["multi",6,4],["rev",2000],["atk",26]],halfFrz:1,gimTxt:"凍結が半分しか効かない"},
 boss3:{wx2:"fog",/* ★v0.22.128 第2形態の天候 */weakGear:["high","mid","low"],/* ★v0.22.123 design 10-16-2 弱点ギア */art:"boss3",n:"零号",rank:"boss",hp:560,spd:11,cap:4,gimTxt:"1ターンにアタック4枚まで・形が変わる",
   forms:["剣","槍","盾"],
   morph:[[["atk",20],["multi",8,3]],[["prc",26],["jam","crosstalk",2]],[["blk",24],["atk",30]]],
   phase:{at:0.5,spd:14,glitch:1,morph:[[["atk",24],["multi",10,3]],[["prc",32],["apd",20]],[["blk",30],["atk",36]]]}},
};
/* ★v0.22.3 その子のボス（story 7-4・text 11-6／13-6／14-6）。サーキットで、その子で走るときだけ零号の前に1戦（連戦・置き方は仮のまま）。
   ★v0.22.7 design v0.10 10-4 の数値と行動（測りなおし待ち）。art は kuuten／sanka／miketsu（graphics-hq 18-B）→ 絵がまだないので、ENEMY_ART にないときは
   今までの仮の絵（残光・白夜の色変え）で出す（js/screens.js の ALLY_BOSS_FB） */
const ALLY_BOSS={HINA:"kuuten",MOMO:"sanka",NANA:"miketsu"};
Object.assign(ENEMIES,{
 kuuten:{wx2:"rain",/* ★v0.22.128 */weakGear:"low",/* ★v0.22.123 design 10-16-2 弱点ギア */art:"kuuten",n:"空転",rank:"boss",ally:"HINA",hp:220,spd:9,rage:1,
   pat:[["rev",2000],["atk",14],["blk",12],["multi",5,3]],gimTxt:"回転を上げてくる・動くたびに攻撃 +1",
   phase:{art:"kuuten_p2",at:0.5,spd:11,pat:[["rev",2500],["atk",17],["multi",6,3]]}},
 sanka:{wx2:"fog",/* ★v0.22.128 */weakGear:"mid",/* ★v0.22.123 design 10-16-2 弱点ギア */art:"sanka",n:"散花",rank:"boss",ally:"MOMO",hp:240,spd:10,
   pat:[["atk",14],["jam","mud",2],["multi",4,4],["blk",16]],gimTxt:"花びら（泥はね）を山札に混ぜる",
   phase:{art:"sanka_p2",at:0.5,spd:11,pat:[["multi",5,4],["jam","mud",2],["atk",20]]}},
 miketsu:{wx2:"dawn",/* ★v0.22.128 */weakGear:["low","high"],/* ★v0.22.123 design 10-16-2 弱点ギア */art:"miketsu",n:"未決",rank:"boss",ally:"NANA",hp:240,spd:10,forms:["緑","金"],
   morph:[[["atk",16],["blk",12]],[["multi",6,3],["prc",18]]],gimTxt:"緑の車と金のクーペ、2つの形が入れかわる",
   phase:{art:"miketsu_p2",at:0.5,spd:12,morph:[[["atk",18],["apd",1]],[["multi",7,3],["prc",22]]]}},
});
const AREAS=[
 {key:"street",n:"ストリート",rows:13,pool:["van","bike","sedan","minivan"],easy:["van","bike"],elite:"wraith",boss:"boss1",mid:6,hpMul:1.38,bossMul:1.5,atkMul:1.3},
 {key:"touge",n:"峠",rows:14,pool:["coupe","kei","offbike","rally"],easy:["coupe","offbike"],elite:"downhill",boss:"boss2",mid:6,hpMul:1.61,bossMul:1.1,atkMul:1.3},
 {key:"circuit",n:"サーキット",rows:15,pool:["touring","formula","gtcar","safety"],easy:["touring","formula"],elite:"wrecker",boss:"boss3",mid:7,hpMul:1.84,bossMul:0.85,atkMul:1.2},
];
