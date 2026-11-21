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
    car:{type:"mt",gears:5,mult:[1,1.35,1.7,2.05,2.4],/* ★v0.22.7 design 10-3・★v0.22.8 10-6（仮）5速 2.4 */
      red:7500,limit:8500,band:[4500,5500],core:[4800,5200],
      idle:1000,brake:3000,hp:80/* ★v0.22.92 LD balance 11-48：70→80（v0.22.71 で 60→70） */,spd:15,minShift:3000,
      upDrop:0.6,earlyDrop:0.45,downDiv:0.6,
      bands:{L:[1500,3500],M:[3500,6000],R:[7500,8500]}},
    deck:[["h_youda",4],["h_gouda",2],["h_kagerou",2],["h_saitenka",2],["braking",1],["h_kneegrip",2],["h_hidamari",1],["h_sunrise",1],["h_kickstart",2],["qshift",2],["slip",1]],/* ★v0.22.83 design 10-12-3・LD 案 A（★虎雪 16:10）：アタック 7→10 */
    pool:null,skill:"h_sunrise",rule:{firstGas:2,halfDmg:2,areaBossHp:0.75/* ★v0.22.90 LD balance 11-47 A：NIGHT 2 からエリアのボスの体力 ×0.75 */},ruleTxt:"戦闘の最初のターンはガソリン +2・最初の2ターンは受けるダメージ半分",
  },
  MOMO:{
    name:"MOMO",carName:"ロードスター ND",weapon:"ロードスピナー",type:"チェイン",join:2,
    car:{type:"mt",gears:6,mult:[1.0,1.15,1.3,1.45,1.6,1.75],
      red:6800,limit:8000,band:[4000,5000],core:[4300,4700],/* ★v0.22.7 design 10-3 */
      idle:1000,brake:3000,hp:85/* ★v0.22.71 design 10-23：75→85 */,spd:14,minShift:3000,
      upDrop:0.6,earlyDrop:0.45,downDiv:0.6,
      bands:{L:[1000,2500],M:[2500,4000],R:[6800,8000]}},
    deck:[["m_touka",4],["m_rinjin",2],["m_hanawa",2],["m_softtop",1],["m_hanaakari",1],["m_kinen",2],["m_hougou",1],["braking",2],["qshift",2],["slip",2],["blip",1]],/* ★v0.22.8 10-6 ブリッピング1枚をスリップに */
    pool:null,skill:"m_hougou",rule:{chainStep:0.15,rescue:3,rescueN:1,atShiftAt:5500/* ★v0.22.93 LD balance 11-51：5000→5500（AT だけ） */},/* ★v0.22.25 10-12-4c：AT の自動シフトは帯の上のはし *//* ★v0.22.23 design v0.11.11 10-12-4c：チェインの守りをなくした（花の便りは残す） */ruleTxt:"チェインのボーナスが1つ +15%（ほかは +10%）・花の便り：チェイン3以上で、打てる攻撃が手札にないとき1枚引く（1ターン1回）",atRuleTxt:"AT：自動シフトは、5500回転まで引っぱってから上がる"/* ★v0.22.94 text v0.22.22 27-2 rule_momo_at *//* text v0.22.7 27-2：AT を選んでいるときだけ3つ目に */,
  },
  NANA:{
    name:"NANA",carName:"GR スープラ",weapon:"ストレートシックス",type:"シフト連打",join:3,
    car:{type:"mt",gears:8,mult:[1.0,1.12,1.24,1.36,1.48,1.6,1.72,1.84],
      red:6500,limit:7000,band:[4500,5500],core:[4800,5200],
      idle:1000,brake:3000,hp:80,/* ★v0.22.33 design v0.11.16 10-12-4d：70→80 */spd:11,/* ★v0.22.71 design 10-23：10→11 */ /* ★v0.22.30 design v0.11.15 10-12-4d：9→10 */minShift:3000,
      upDrop:0.6,earlyDrop:0.45,downDiv:0.6,
      bands:{L:[1000,2500],M:[2500,4500],R:[6500,7000]}},
    deck:[["n_koutotsu",2],["n_hosaki",4],["n_hachiren",2],["n_downforce",2],["n_houyoku",2],["n_phoenix",1],["braking",2],["qshift",2],["slip",2],["blip",1]],
    pool:null,skill:"n_phoenix",rule:{shiftCap:4,perfBlk:3,atFirstGas:2,areaBossHp:0.75/* ★v0.22.90 LD 11-47 A */}/* ★v0.22.51 QA 本測り NIGHT 4 AT −19.7（チーフ 02:16）：NANA だけ AT の最初の自動シフト +2 */,ruleTxt:"シフトアップは1ターン4回まで（ほかは3回）・パーフェクトのたびに防御 +3",
  },
};
const CHAR_ORDER=["YUKI","HINA","MOMO","NANA"];
