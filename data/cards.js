"use strict";
/* ===== カード（α2：design v0.3 の表をそのまま）=====
   r レア度（C・R・E・SK）/ mo モーション（なければ種類から）/ own "N"＝ニュートラル・キャラ名＝専用
   t 種類（atk・grd・dbf・drw・rev・sk・jam）/ c 回転 / cu 強化後の回転 / costGear [はじめ,ギア1段ごとに下がる,いちばん下]
   gas ガソリンの目盛り / gasu 強化後 / v 数値 / vu 強化後（なければ v×1.5 を四捨五入）
   band 打ちごろの帯（L・M・R）/ bm 帯のときの数値の倍率（なければ RULES.bandMul）/ charge 大技（条件のたびに gas −1）
   fx 効果の並び（"v" は v に置きかわる）。v0.9 からの効果に加えて：
     atkHits [v,回数,シフトしていたら回数] / atkBlk 今の防御×v / atkFrz 凍結の合計×k（40まで）/ atkChain k×先に打った枚数
     onUp [効果,…] この戦闘の間、シフトアップのたびに / perfTwice パーフェクトのあと次のアタック2回
     heelToe このターン、シフトダウン0目盛り・そのたびに次の倍率＋v / kickDown AT：1段シフトダウン / genHand 手札に生成
   しるし：shiftCard そのままシフトアップ / redOnly レッドゾーンだけ / sup 補助 / gen 生成（使うと消える）/ exile 使うとこの戦闘から消える
   num カードの面の数字（design：アタックはダメージ・ガードは防御）。書かなければ fx から自動
   at：AT のときの差しかえ */
const CARDS={
 // --- ニュートラル 12 ---
 braking:{r:"C",own:"N",n:"ブレーキング",t:"grd",c:1000,gas:1,v:5,vu:8,band:"L",fx:[["blk","v"]],d:"防御 {v}"},
 qshift:{r:"C",own:"N",n:"クイックシフト",t:"rev",c:1000,cu:500,gas:0,v:0,shiftCard:1,fx:[],d:"そのままシフトアップする（4000回転未満でもできる）",
   at:{n:"キックダウン",shiftCard:0,c:0,cu:0,fx:[["kickDown"],["draw",1]],d:"［AT］1段シフトダウン・1枚引く"}},
 slip:{r:"C",mo:"draw",own:"N",n:"スリップストリーム",t:"drw",c:2000,gas:0,v:2,vu:3,band:"M",fx:[["draw","v"]],d:"{v}枚引く"},
 blip:{r:"C",own:"N",n:"ブリッピング",t:"rev",c:1500,gas:0,v:0.1,vu:0.2,band:"L",bm:3,fx:[["nextBonus","v"]],d:"次に打つカードの倍率 +{v}（L の帯なら3倍）",
   at:{c:0,fx:[["nextBonus","v"],["revDown",500]],d:"［AT］回転0。次に打つカードの倍率 +{v}・回転 −500"}},
 clutchk:{r:"R",own:"N",n:"クラッチ蹴り",t:"rev",c:1000,cu:0,gas:0,v:0,fx:[["forcePerfect"],["perfTwice"]],d:"次のシフトは帯の外でもパーフェクト。そのあと次のアタックは2回当たる",
   at:{fx:[["atShiftDraw",1],["perfTwice"]],d:"［AT］次の自動シフトで1枚引く。そのあと次のアタックは2回当たる"}},
 backfire:{r:"C",own:"N",n:"アフターファイア",t:"dbf",c:1500,gas:1,v:3,vu:5,band:"R",bm:2,fx:[["burn","v"]],d:"炎上 {v}（レッドゾーンで2倍）"},
 pitin:{r:"R",own:"N",n:"ピットイン",t:"grd",c:3000,gas:1,v:5,vu:8,exile:1,fx:[["heal","v"]],d:"エンジン耐久を {v} 回復（使うとこの戦闘から消える）"},
 ebrake:{r:"C",own:"N",n:"エンジンブレーキ",t:"rev",c:0,gas:0,sup:1,v:2000,vu:3000,fx:[["revDown","v"]],d:"回転を −{v}"},
 cooldown:{r:"C",own:"N",n:"クーリング",t:"rev",c:0,gas:0,sup:1,v:3,vu:5,band:"R",bm:2,fx:[["revDown",1500],["blkRaw","v"]],d:"回転 −1500・防御 {v}（レッドゾーンで防御2倍）",num:"blk"},
 oilchange:{r:"R",own:"N",n:"オイル交換",t:"rev",c:0,gas:0,sup:1,v:3,vu:4,fx:[["gen","oil","v"]],d:"山札に「エンジンオイル」を{v}枚まぜる"},
 heeltoe:{r:"R",own:"N",n:"ヒール＆トゥ",t:"rev",c:0,gas:0,sup:1,v:0.2,vu:0.3,fx:[["heelToe","v"]],d:"このターン、シフトダウン 0目盛り。シフトダウンのたびに次のカードの倍率 +{v}"},
 pitboard:{r:"C",mo:"draw",own:"N",n:"ピットボード",t:"drw",c:0,gas:1,gasu:0,sup:1,v:1,vu:1,fx:[["draw","v"]],d:"{v}枚引く"},
 // --- YUKI 専用 18 ---
 hyouga:{r:"C",mo:"atk_light",own:"YUKI",n:"氷牙",t:"atk",c:1000,gas:1,v:6,vu:9,band:"L",fx:[["atk","v"]],d:"{v}ダメージ"},
 hakusen:{r:"C",mo:"atk_heavy",own:"YUKI",n:"白閃",t:"atk",c:2000,gas:2,v:10,vu:15,band:"M",fx:[["atk","v"]],d:"{v}ダメージ"},
 sasame:{r:"C",own:"YUKI",n:"細雪",t:"dbf",c:1500,gas:1,v:2,vu:3,band:"L",fx:[["frz","v"]],d:"凍結 {v}"},
 counter:{r:"R",mo:"guard",own:"YUKI",n:"カウンターステア",t:"grd",c:2500,gas:1,v:8,vu:12,band:"M",fx:[["blk","v"],["counterAdd"]],d:"防御 {v}。次の番の最初のアタックに、今の防御の半分を上乗せ"},
 whiteout:{r:"R",mo:"atk_finisher",own:"YUKI",n:"ホワイトアウト",t:"atk",c:4000,gas:2,v:12,vu:18,fx:[["atk","v"],["atkChain",3],["frz",3]],d:"{v}ダメージ＋このターン先に打ったカードの数×3＋凍結 3",num:"sum"},
 shironeko:{r:"SK",own:"YUKI",n:"白猫の護り",t:"sk",c:5000,gas:2,v:20,vu:30,fx:[["blk","v"],["nextDouble"],["onUp","blk",4]],d:"防御 {v}。次の番の最初のアタックが2倍。この戦闘の間、シフトアップのたびに防御 +4",num:"blk"},
 rikka:{r:"R",mo:"atk_heavy",own:"YUKI",n:"六花連撃",t:"atk",c:3000,gas:2,v:4,vu:6,band:"M",fx:[["atkGear","v"]],d:"ギア×{v}ダメージ（今：{gv}）"},
 tsurara:{r:"R",mo:"atk_heavy",own:"YUKI",n:"氷柱落とし",t:"atk",c:3500,costGear:[3500,500,1000],gas:2,v:14,vu:21,band:"R",fx:[["atk","v"]],d:"{v}ダメージ。ギアが上がるほど回転が少なくてすむ（レッドゾーンで ×1.5）"},
 rinkai:{r:"E",mo:"atk_finisher",own:"YUKI",n:"臨界氷華",t:"atk",c:500,gas:1,v:30,vu:45,redOnly:1,fx:[["atk","v"]],d:"レッドゾーンのときだけ打てる。{v}ダメージ"},
 shimo:{r:"C",mo:"guard",own:"YUKI",n:"霜纏い",t:"grd",c:2000,gas:1,v:3,vu:5,band:"M",fx:[["blkGear","v"]],d:"ギア×{v}の防御（今：{gv}）"},
 fubuki:{r:"R",own:"YUKI",n:"吹雪の檻",t:"dbf",c:2500,gas:1,v:4,vu:6,band:"M",fx:[["frz","v"],["noise",2]],d:"凍結 {v}・ノイズ 2"},
 kazahana:{r:"C",mo:"atk_light",own:"YUKI",n:"風花",t:"atk",c:1500,gas:1,v:4,vu:6,band:"L",fx:[["atkHits","v",2,3]],d:"{v}ダメージを2回（このターンにシフトしていたら3回）"},
 hyoujin:{r:"R",mo:"atk_heavy",own:"YUKI",n:"氷刃返し",t:"atk",c:2000,gas:1,v:0.5,vu:0.75,fx:[["atkBlk","v"]],d:"今の防御×{v}のダメージ"},
 eikyu:{r:"E",mo:"atk_finisher",own:"YUKI",n:"永久凍土",t:"atk",c:4500,gas:2,v:20,vu:30,fx:[["atk","v"],["atkFrz",2]],d:"{v}ダメージ＋この戦闘で与えた凍結×2（40まで）",num:"sum"},
 rikkamai:{r:"R",own:"YUKI",n:"六花の舞",t:"rev",c:0,gas:0,sup:1,v:1,vu:2,fx:[["onUp","genHand","hyoushou","v"]],d:"この戦闘の間、シフトアップのたびに手札に氷晶を{v}枚"},
 nadare:{r:"E",mo:"atk_finisher",own:"YUKI",n:"雪崩",t:"atk",c:3000,gas:10,charge:1,v:30,vu:45,fx:[["atk","v"]],d:"大技。{v}ダメージ。ガソリン10。パーフェクト・チェイン5・レッドゾーンで打つ、のたびに −1"},
 muhyou:{r:"C",mo:"guard",own:"YUKI",n:"霧氷",t:"grd",c:1500,gas:1,v:4,vu:6,fx:[["blk","v"],["onUp","frz",1],["onUp","blk",3]],d:"防御 {v}。この戦闘の間、シフトアップのたびに凍結 1・防御 3"},
 hakunetsu:{r:"R",mo:"atk_heavy",own:"YUKI",n:"白熱",t:"atk",c:1000,gas:2,v:12,vu:18,band:"R",bm:2,fx:[["atk","v"]],d:"{v}ダメージ（レッドゾーンで2倍）"},
 // --- 生成・ジャマ（30種に数えない。チェインには数える）---
 oil:{r:"C",own:"N",n:"エンジンオイル",t:"rev",c:0,gas:0,sup:1,gen:1,v:500,fx:[["atkDown","v"]],d:"次に打つアタックの回転 −{v}（使うと消える）"},
 hyoushou:{r:"C",mo:"atk_light",own:"YUKI",n:"氷晶",t:"atk",c:0,gas:0,gen:1,v:3,fx:[["atk","v"]],d:"{v}ダメージ（使うと消える）"},
 mud:{r:"C",own:"N",n:"泥はね",t:"jam",c:0,gas:1,gen:1,v:0,fx:[],d:"ジャマ：何も起きない（使うと消える）"},
 crosstalk:{r:"C",own:"N",n:"混線",t:"jam",c:1000,gas:0,gen:1,v:0,fx:[],d:"ジャマ：何も起きない（使うと消える）"},
};
const RARITY_JP={C:"コモン",R:"レア",E:"エピック",SK:"固有スキル"};
/* モーションのキー（revremit-yuki-motion-list.md 1章）。mo がなければ種類から */
const TYPE_MOTION={atk:"atk_light",grd:"guard",dbf:"debuff",drw:"draw",rev:"rev",sk:"skill",jam:"rev"};
const TYPE_JP={atk:"アタック",grd:"ガード",dbf:"デバフ",drw:"ドロー",rev:"回転操作",sk:"固有スキル",jam:"ジャマ"};
const BAND_JP={L:"低回転",M:"中回転",R:"レッド"};
/* 報酬の候補（キャラごと）：生成・固有スキル以外の共通と専用 */
Object.values(CHARS).forEach((ch,_,a)=>{const id0=Object.keys(CHARS).find(k=>CHARS[k]===ch);ch.pool=Object.keys(CARDS).filter(id=>!CARDS[id].gen&&CARDS[id].r!=="SK"&&(CARDS[id].own==="N"||CARDS[id].own===id0))});
