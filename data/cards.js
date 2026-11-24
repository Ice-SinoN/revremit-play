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
 qshift:{r:"C",own:"N",n:"クイックシフト",t:"rev",c:1000,cu:500,gas:0,v:0,shiftCard:1,fx:[["draw",1]],/* ★v0.22.43 MT は1枚引く（design 10-12-3・LD 11-27・text v0.22.12） */d:"回転を少し上げて、そのままシフトアップする（低い回転でもできる）。1枚引く。",dDeck:"回転を上げてシフトアップ・1枚引く。\nAT：キックダウン（手札3枚以下で1枚引く）",/* text 27-1（design 10-12-5）・dDeck＝デッキを組む画面の2行（v0.22.23） */
   at:{n:"キックダウン",shiftCard:0,c:0,cu:0,fx:[["kickDown"],["drawIfLow",1,3]],d:"［AT］1段シフトダウン。ほかの手札が3枚以下なら1枚引く。"}},/* text v0.22.4：打ったあと・自分を除いて数える（drawIfLow は手札から抜いたあとに数える） */
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
 fubuki:{r:"R",own:"YUKI",n:"吹雪の檻",t:"dbf",c:2500,gas:1,v:3,vu:5,band:"M",fx:[["frz","v"],["noise",2]],d:"凍結 {v}・ノイズ 2"},
 kazahana:{r:"C",mo:"atk_light",own:"YUKI",n:"風花",t:"atk",c:1500,gas:1,v:4,vu:6,band:"L",fx:[["atkHits","v",2,3]],d:"{v}ダメージを2回（このターンにシフトしていたら3回）"},
 hyoujin:{r:"R",mo:"atk_heavy",own:"YUKI",n:"氷刃返し",t:"atk",c:2000,gas:1,v:0.5,vu:0.75,fx:[["atkBlk","v"]],d:"今の防御×{v}のダメージ"},
 eikyu:{r:"E",mo:"atk_finisher",own:"YUKI",n:"永久凍土",t:"atk",c:4500,gas:2,v:20,vu:30,fx:[["atk","v"],["atkFrz",2]],d:"{v}ダメージ＋この戦闘で与えた凍結×2（40まで）",num:"sum"},
 rikkamai:{r:"R",own:"YUKI",n:"六花の舞",t:"rev",c:0,gas:0,sup:1,v:1,vu:2,fx:[["onUp","genHand","hyoushou","v"]],d:"この戦闘の間、シフトアップのたびに手札に氷晶を{v}枚"},
 nadare:{r:"E",mo:"atk_finisher",own:"YUKI",n:"雪崩",t:"atk",c:3000,gas:8,charge:1,v:30,vu:45,fx:[["atk","v"]],d:"大技。{v}ダメージ。ガソリン8。パーフェクト・チェイン5・レッドゾーンで打つ、のたびに −1"},
 muhyou:{r:"C",mo:"guard",own:"YUKI",n:"霧氷",t:"grd",c:1500,gas:1,v:4,vu:6,fx:[["blk","v"],["onUp","frz",1],["onUp","blk",2]],d:"防御 {v}。この戦闘の間、シフトアップのたびに凍結 1・防御 2"},
 hakunetsu:{r:"R",mo:"atk_heavy",own:"YUKI",n:"白熱",t:"atk",c:1000,gas:2,v:12,vu:18,band:"R",bm:2,fx:[["atk","v"]],d:"{v}ダメージ（レッドゾーンで2倍）"},
 /* ===== ★v0.21：β で足す10種（design v0.6 9-2・名前は仮＝シナリオ班が text.md で決める）===== */
 hyouen:{r:"R",mo:"atk_heavy",own:"YUKI",n:"氷炎",t:"atk",c:1500,gas:2,v:9,vu:14,band:"R",bm:2,fx:[["atk","v"],["redStay",1000]],d:"{v}ダメージ（レッドゾーンで打つと2倍）。レッドゾーンで打ったら、そのあと回転 −1000"},
 kyokkou:{r:"E",mo:"atk_finisher",own:"YUKI",n:"紅雪",t:"atk",c:1000,gas:2,v:10,vu:15,fx:[["kousetsu","v",8]],d:"{v}＋このターンにレッドで打った数 ×8。レッドの外では全部半分。"},
 fuelcut:{r:"R",mo:"rev",own:"N",n:"フューエルカット",t:"rev",c:0,gas:0,v:0,sup:1,exile:1,upKeep:2,fx:[["limitGuard"]],d:"このターン、回転はリミットで止まる（オーバーレブ・ブローにならない）。戦闘で1回",du:"このターン、回転はリミットで止まる（オーバーレブ・ブローにならない）。戦闘で2回まで"},
 renpou:{r:"R",mo:"atk_light",own:"YUKI",n:"霰打ち",t:"atk",c:1500,gas:1,v:3,vu:4,band:"M",fx:[["atkShifts","v"]],d:"{v}ダメージを（このターンのシフトアップの回数＋1）回"},
 dblclutch:{r:"R",mo:"rev",own:"N",n:"ダブルクラッチ",t:"rev",c:0,gas:1,gasu:0,v:0,fx:[["down1"],["draw",1],["forcePerfect"]],d:"1段シフトダウンして1枚引く。次のシフトアップは必ずパーフェクト",
   at:{fx:[["kickDown"],["atShiftDraw",1]],d:"1段シフトダウン。次の自動シフトで1枚引く"}},
 setsuka:{r:"E",mo:"rev",own:"YUKI",n:"雪華の陣",t:"rev",c:0,gas:1,v:5,vu:7,sup:1,fx:[["onUp","nextAtkAdd","v"]],d:"この戦闘の間、シフトアップのたびに、次のアタックのダメージ +{v}（重なる。+15 まで）"},
 hyouheki:{r:"C",mo:"guard",own:"YUKI",n:"氷壁",t:"grd",c:1500,gas:1,v:4,vu:6,band:"L",fx:[["blk","v"],["blkFrz",0.5]],d:"防御 {v}＋この戦闘で与えた凍結の半分（最大 +15）"},
 saihyou:{r:"R",mo:"atk_heavy",own:"YUKI",n:"砕氷",t:"atk",c:2500,gas:2,v:3,vu:4,fx:[["atkShatter","v"]],d:"この戦闘で与えた凍結の合計 ×{v} ダメージ（最大 60）。そのあと合計は 0 にもどる"},
 drift:{r:"C",mo:"draw",own:"N",n:"ドリフト",t:"drw",c:1000,gas:0,v:1,vu:2,band:"M",fx:[["draw","v"]],d:"{v}枚引く"},
 senbon:{r:"E",mo:"atk_finisher",own:"YUKI",n:"千本氷柱",t:"atk",c:3000,gas:2,v:4,vu:6,fx:[["atkHitsChain","v"]],d:"{v}ダメージを、このターンのチェインの数だけ（最大 6回）"},
 /* ===== ★v0.22 β の仲間3人の専用カード 17種ずつ（design v0.8 9-10-2〜4。数値・名前は仮）===== */
 // --- HINA（速攻）---
 h_youda:{r:"C",mo:"atk_light",own:"HINA",n:"陽打",t:"atk",c:1000,gas:1,v:6,vu:9,band:"L",fx:[["atk","v"]],d:"{v}ダメージ"},
 h_gouda:{r:"C",mo:"atk_heavy",own:"HINA",n:"轟打",t:"atk",c:2500,gas:2,v:11,vu:16,band:"M",fx:[["atk","v"]],d:"{v}ダメージ"},
 h_kagerou:{r:"R",mo:"atk_light",own:"HINA",n:"陽炎連打",t:"atk",c:1500,gas:1,v:4,vu:6,fx:[["atkHits","v",3,3]],d:"{v}ダメージを3回"},
 h_kneegrip:{r:"C",mo:"guard",own:"HINA",n:"ニーグリップ",t:"grd",c:1000,gas:1,v:5,vu:8,band:"L",fx:[["blk","v"],["nextTurnAtk",2]],d:"防御 {v}。次の番の最初のアタック +2",num:"blk"},
 h_saitenka:{r:"C",mo:"atk_light",own:"HINA",n:"再点火",t:"atk",c:1000,/* ★v0.22.42 1500→1000（design 10-12-3・LD 11-26） */gas:1,v:7,vu:10,fx:[["atk","v"],["retryIfBlocked"]],d:"{v}ダメージ。相手の防御で全部受けられたら手札にもどる"},
 h_sunrise:{r:"SK",own:"HINA",n:"サンライズ・ダッシュ",t:"sk",c:0,gas:2,v:4,vu:6,fx:[["gearUp2"],["turnAtkAdd","v"]],d:"ギア +2（パーフェクト扱い・シフトアップ2回に数える）。この番のアタック +{v}"},
 h_asayake:{r:"R",mo:"atk_heavy",own:"HINA",n:"朝焼け",t:"atk",c:1000,gas:1,v:8,vu:12,fx:[["atkFirstTurn","v"]],d:"{v}ダメージ（戦闘の最初のターンなら2倍）"},
 h_kickstart:{r:"C",mo:"rev",own:"HINA",n:"キックスタート",t:"rev",c:0,gas:0,sup:1,v:2000,vu:2500,fx:[["revUp","v"],["draw",1]],d:"回転 +{v}（リミットで止まる）・1枚引く"},
 h_nichirin:{r:"E",mo:"atk_finisher",own:"HINA",n:"日輪落とし",t:"atk",c:3000,gas:2,v:18,vu:27,fx:[["atk","v"],["atkAtks",5]],d:"{v}ダメージ＋このターン先に打ったアタックの数 ×5",num:"sum"},
 h_nukiuchi:{r:"R",mo:"atk_light",own:"HINA",n:"抜き撃ち",t:"atk",c:1000,gas:1,v:6,vu:9,fx:[["atkHits","v",1,2]],d:"{v}ダメージ（このターンにシフトアップしていたら2回）"},
 h_fullbrake:{r:"R",mo:"guard",own:"HINA",n:"フルブレーキ",t:"grd",c:0,gas:1,v:8,vu:12,fx:[["blk","v"],["revDown",1500]],d:"防御 {v}・回転 −1500",num:"blk"},
 h_hibana:{r:"C",mo:"atk_light",own:"HINA",n:"火花",t:"atk",c:500,gas:0,v:3,vu:5,fx:[["atk","v"]],d:"{v}ダメージ（ガソリン 0）"},
 h_mahiru:{r:"R",mo:"atk_heavy",own:"HINA",n:"真昼",t:"atk",c:2000,gas:2,v:10,vu:15,band:"R",bm:2,fx:[["atk","v"]],d:"{v}ダメージ（レッドゾーンで2倍）"},
 h_memo:{r:"R",mo:"draw",own:"HINA",n:"整備メモ",t:"rev",c:0,gas:1,gasu:0,sup:1,v:1,fx:[["tutorAtk"]],d:"山札からいちばん強いアタックを1枚手札に"},
 h_fullthrottle:{r:"E",mo:"rev",own:"HINA",n:"フルスロットル",t:"rev",c:0,gas:1,sup:1,v:0.1,vu:0.15,fx:[["fullThrottle","v"],["draw",1]],d:"このターン、アタックを打つたびに倍率 +{v}（重なる・最大 +0.5）。1枚引く"/* ★v0.22.42 1枚引く（design 10-12-3） */},
 h_hidamari:{r:"C",mo:"guard",own:"HINA",n:"陽だまり",t:"grd",c:1500,gas:1,v:4,vu:6,fx:[["blk","v"],["heal",2]],d:"防御 {v}・エンジン耐久 +2",num:"blk"},
 h_shippu:{r:"R",mo:"atk_light",own:"HINA",n:"疾風",t:"atk",c:1500,gas:1,v:5,vu:8,band:"M",fx:[["atk","v"],["draw",1]],d:"{v}ダメージ・1枚引く"},
 // --- MOMO（チェイン）---
 m_touka:{r:"C",mo:"atk_light",own:"MOMO",n:"桃花",t:"atk",c:1000,gas:1,v:5,vu:8,band:"L",fx:[["atkIfChain","v",3,4]],d:"{v}ダメージ。チェインが3以上なら +4"},
 m_rinjin:{r:"C",mo:"atk_heavy",own:"MOMO",n:"輪刃",t:"atk",c:2000,gas:2,v:11,vu:16,band:"M",fx:[["atk","v"]],d:"{v}ダメージ"},
 m_hanaguruma:{r:"C",mo:"atk_light",own:"MOMO",n:"花車",t:"atk",c:500,gas:0,v:2,vu:3,fx:[["atk","v"]],d:"{v}ダメージ（ガソリン 0）"},
 m_softtop:{r:"C",mo:"guard",own:"MOMO",n:"ソフトトップ",t:"grd",c:1500,gas:1,v:6,vu:9,fx:[["blk","v"]],d:"防御 {v}"},
 m_kinen:{r:"R",mo:"draw",own:"MOMO",n:"記念写真",t:"drw",c:0,gas:1,sup:1,v:2,vu:3,fx:[["draw","v"]],d:"{v}枚引く"},
 m_hougou:{r:"SK",own:"MOMO",n:"桃花の抱擁",t:"sk",c:0,gas:2,v:15,vu:22,fx:[["blk","v"],["heal",5],["chainAdd",2]],d:"防御 {v}・エンジン耐久 +5・チェイン +2",num:"blk"},
 m_mankai:{r:"E",mo:"atk_finisher",own:"MOMO",n:"満開",t:"atk",c:3000,gas:2,v:6,vu:9,fx:[["atk","v"],["atkChainNow",6]],d:"{v}ダメージ＋チェインの数 ×6",num:"sum"},
 m_haruichiban:{r:"R",mo:"atk_light",own:"MOMO",n:"春一番",t:"atk",c:1500,gas:1,v:3,vu:4,fx:[["atkHitsChain3","v"]],d:"{v}ダメージを2回。チェイン3つごとに +1回"},
 m_musubime:{r:"R",mo:"rev",own:"MOMO",n:"結び目",t:"rev",c:0,gas:0,sup:1,v:2,vu:3,fx:[["chainDouble","v"]],d:"次に打つカードはチェインを{v}つ数える"},
 m_cruise:{r:"C",mo:"rev",own:"MOMO",n:"クルーズ",t:"rev",c:0,gas:0,sup:1,v:1000,vu:1500,fx:[["revDown","v"],["blkRaw",2]],d:"回転 −{v}・防御 2",num:"blk"},
 m_hanaakari:{r:"R",mo:"guard",own:"MOMO",n:"花灯り",t:"grd",c:1000,gas:1,v:4,vu:6,fx:[["blk","v"],["blkChain"]],d:"防御 {v}＋チェインの数",num:"blk"},
 m_kaerizaki:{r:"E",mo:"atk_finisher",own:"MOMO",n:"返り咲き",t:"atk",c:2000,gas:2,v:12,vu:18,fx:[["atkLowHp","v"]],d:"{v}ダメージ（エンジン耐久が半分以下なら2倍）"},
 m_openair:{r:"R",mo:"rev",own:"MOMO",n:"オープンエア",t:"rev",c:0,gas:1,sup:1,v:2,vu:3,fx:[["openAir","v"]],d:"このターン、補助のカードを打つたびに {v}ダメージ"},
 m_hanafubuki:{r:"R",mo:"atk_light",own:"MOMO",n:"花吹雪",t:"atk",c:2500,gas:2,v:2,vu:3,band:"M",fx:[["atkHits","v",5,5]],d:"{v}ダメージを5回"},
 m_harukaze:{r:"C",mo:"guard",own:"MOMO",n:"春風",t:"grd",c:1000,gas:1,v:3,vu:5,band:"L",fx:[["blk","v"],["healUp",1,2]],d:"防御 {v}・エンジン耐久 +1",du:"防御 {v}・エンジン耐久 +2",num:"blk"},/* ★design 10-12-2：+3 → +1（強化 +2） */
 m_hanawa:{r:"C",mo:"atk_light",own:"MOMO",n:"花輪",t:"atk",c:1500,gas:1,v:5,vu:8,band:"L",fx:[["atk","v"],["chainAdd",1]],d:"{v}ダメージ・チェイン +1"},
 m_hanami:{r:"R",mo:"draw",own:"MOMO",n:"花見",t:"rev",c:0,gas:1,sup:1,v:1,vu:2,fx:[["hanami","v"]],d:"捨て札から回転0のカードを {v}枚手札に（花見はもどさない）"},/* ★design 10-12-2：2 → 1（強化 3 → 2） */
 // --- NANA（シフト連打）---
 n_koutotsu:{r:"C",mo:"atk_heavy",own:"NANA",n:"紅突",t:"atk",c:2000,gas:2,v:10,vu:15,band:"M",fx:[["atk","v"]],d:"{v}ダメージ"},
 n_hosaki:{r:"C",mo:"atk_light",own:"NANA",n:"穂先",t:"atk",c:1000,gas:1,v:5,vu:8,band:"L",fx:[["atk","v"]],d:"{v}ダメージ"},
 n_hachiren:{r:"R",mo:"atk_heavy",own:"NANA",n:"八連",t:"atk",c:2500,gas:2,v:3,vu:4,band:"M",fx:[["atkGear","v"]],d:"{v} ×今のギアのダメージ（今：{gv}）"},
 n_downforce:{r:"C",mo:"guard",own:"NANA",n:"ダウンフォース",t:"grd",c:1500,gas:1,v:6,vu:9,fx:[["blk","v"],["blkIfGear",3,4]],d:"防御 {v}。4速以上なら +4",num:"blk"},
 n_houyoku:{r:"R",mo:"atk_heavy",own:"NANA",n:"鳳翼",t:"atk",c:1500,gas:1,v:6,vu:9,fx:[["atkIfPerf","v"]],d:"{v}ダメージ（直前のシフトがパーフェクトなら2倍）"},
 n_phoenix:{r:"SK",own:"NANA",n:"クリムゾン・フェニックス",t:"sk",c:0,gas:2,v:12,vu:18,fx:[["blk","v"],["phoenix",15]],d:"防御 {v}。この戦闘で1回、エンジン耐久が0になる攻撃を 15 で耐える",num:"blk"},
 n_paddle:{r:"C",mo:"rev",own:"NANA",n:"パドルシフト",t:"rev",c:0,gas:0,v:0,vu:3,shiftCard:1,atShift:1,fx:[["blkFlat","v"]],d:"シフトアップだけする（回転0。AT でも打てる）",du:"シフトアップだけする（回転0。AT でも打てる）。防御 {v}"},
 n_gaisen:{r:"E",mo:"atk_finisher",own:"NANA",n:"凱旋",t:"atk",c:1500,/* ★design 10-11：3000 → 1500 */gas:2,v:8,vu:12,fx:[["atk","v"],["atkShiftsN",8]],d:"{v}ダメージ＋このターンのシフトアップの数 ×8",num:"sum"},
 n_hiiro:{r:"R",mo:"guard",own:"NANA",n:"緋色",t:"grd",c:2000,gas:1,v:8,vu:12,fx:[["blk","v"],["onPerf","blk",3]],d:"防御 {v}。この戦闘の間、パーフェクトのたびに防御 +3",num:"blk"},
 n_totsugeki:{r:"R",mo:"atk_heavy",own:"NANA",n:"突撃",t:"atk",c:3500,gas:2,v:16,vu:24,band:"R",fx:[["atk","v"]],d:"{v}ダメージ（レッドゾーンで ×1.5）"},
 n_teatime:{r:"C",mo:"rev",own:"NANA",n:"ティータイム",t:"rev",c:0,gas:0,/* ★v0.22.92 LD balance 11-48：MT もガソリン 0（v0.22.41 の gasMT:1 を外した） */sup:1,v:1500,vu:2000,fx:[["revDown","v"],["draw",1]],d:"回転 −{v}・1枚引く"},
 n_hokori:{r:"R",mo:"rev",own:"NANA",n:"誇り",t:"rev",c:0,gas:1,sup:1,v:1,vu:1,k:5,ku:7,fx:[["onPerf","atkAllAdd","v","k"]],d:"この戦闘の間、パーフェクトのたびに、アタックが全部 +{v}（最大 +{k}）。"},/* ★v0.22.24 design v0.11.12 10-12-4d・text 28-1 */
 n_taikan:{r:"E",mo:"atk_finisher",own:"NANA",n:"戴冠",t:"atk",c:4000,gas:2,v:20,vu:30,fx:[["taikan","v"]],d:"{v} ダメージ。最大ギアなら先に相手の防御を0に。最大ギアでなければ半分。"}/* ★design 10-11・10-12（条件の外は ×0.5） */,
 n_shukumei:{r:"R",mo:"atk_heavy",own:"NANA",n:"宿命",t:"atk",c:2000,gas:1,v:7,vu:10,fx:[["atkVsBig","v"]],d:"{v}ダメージ（エリート・ボスに1.5倍）"},
 n_recordline:{r:"C",mo:"draw",own:"NANA",n:"レコードライン",t:"drw",c:1000,gas:0,v:1,vu:2,/* ★v0.22.39 帯 M のボーナスを外した（チーフ 18:03・QA の本測り） */band:null,fx:[["draw","v"],["drawIfShift",1]],d:"{v}枚引く。このターンにシフトアップしていたら +1枚"},
 n_teppeki:{r:"C",mo:"guard",own:"NANA",n:"鉄壁",t:"grd",c:2000,gas:1,v:8,vu:12,fx:[["blk","v"]],d:"防御 {v}"},
 n_tenshou:{r:"R",mo:"atk_light",own:"NANA",n:"天翔",t:"atk",c:1500,gas:1,v:7,vu:10,/* ★v0.22.24 10-12-4d：4（6）→7（10） */halfDrop:1,fx:[["atk","v"]],d:"{v}ダメージ。「シフトして打つ」で打つと、シフトのあとの回転が ×0.5"},
 // --- 生成・ジャマ（30種に数えない。チェインには数える）---
 oil:{r:"C",own:"N",n:"エンジンオイル",t:"rev",c:0,gas:0,sup:1,gen:1,v:500,fx:[["atkDown","v"],["draw",1]],d:"次に打つアタックの回転 −{v}・1枚引く（使うと消える）"},
 hyoushou:{r:"C",mo:"atk_light",own:"YUKI",n:"氷晶",t:"atk",c:0,gas:0,gen:1,v:3,fx:[["atk","v"]],d:"{v}ダメージ（使うと消える）"},
 pitsign:{r:"C",own:"N",n:"ローテーション",t:"drw",c:1000,gas:0,v:2,vu:3,fx:[["rotate","v"]],d:"打てないカードを {v} 枚まで捨てて、同じ枚数引く（1ターン1回）。"},/* ★design 11-1（名前は text 27-3） */
 mud:{r:"C",own:"N",n:"泥はね",t:"jam",c:0,gas:1,gen:1,v:0,fx:[],d:"ジャマ：何も起きない（使うと消える）"},
 crosstalk:{r:"C",own:"N",n:"混線",t:"jam",c:1000,gas:0,gen:1,v:0,fx:[],d:"ジャマ：何も起きない（使うと消える）"},
};
const RARITY_JP={C:"コモン",R:"レア",E:"エピック",SK:"固有スキル",OG:"奥義"};
/* ★v0.22.102 奥義カード（design 10-15・text 30-1）。r:"OG"・ガソリン 2・帯なし・1戦に1回（exile＝その戦闘は除外・次の戦闘でもどる）・1発の最終倍率は ×3 まで（RULES.ogMultCap）。
   og：絵・音・一言の ID（OUGI_ART・audio の ougi_*・text 30-1）。「最大 n」のついた4枚（凍結・カウンター・逆転・完璧）と花の守りの防御は、倍率をかけない値（k が最大・強化で ku）＝プログラム班の読み（デザイン班に確認） */
Object.assign(CARDS,{
 y_og_frz:{r:"OG",mo:"atk_finisher",own:"YUKI",og:"ougi_yuki_fubuki",n:"白魔",t:"atk",c:3000,gas:2,v:2,vu:2.5,k:80,ku:100,exile:1,fx:[["atkFrozeTotal","v","k"],["delay1"]],d:"この戦闘で与えた凍結の合計 ×{v} ダメージ（最大 {k}・倍率なし）。敵の次の番を1回おくらせる。1戦に1回。"},
 y_og_cnt:{r:"OG",mo:"atk_finisher",own:"YUKI",og:"ougi_yuki_shironeko",n:"白猫一閃",t:"atk",c:2500,gas:2,v:1.5,vu:2,k:90,ku:120,exile:1,fx:[["atkBlkMul","v","k",15]],d:"防御 15 を得てから、今の防御 ×{v} ダメージ（最大 {k}・倍率なし）。1戦に1回。"},
 y_og_red:{r:"OG",mo:"atk_finisher",own:"YUKI",og:"ougi_yuki_kousetsu",n:"緋雪閃",t:"atk",c:1000,gas:2,v:30,vu:45,exile:1,fx:[["kousetsu","v",10],["setRpmRed"]],d:"{v}＋このターン R で打った数 ×10 ダメージ。レッドゾーンでなければ半分。打ったあと回転をレッドに入れる。1戦に1回。"},
 h_og_rush:{r:"OG",mo:"atk_finisher",own:"HINA",og:"ougi_hina_zenkai",n:"暁天突破",t:"atk",c:2000,gas:2,v:40,vu:60,exile:1,fx:[["lateHalf","v",2]],d:"{v} ダメージ。戦闘の3ターン目からは半分。1戦に1回。"},
 h_og_combo:{r:"OG",mo:"atk_finisher",own:"HINA",og:"ougi_hina_hibana",n:"陽炎百連",t:"atk",c:1500,gas:2,v:5,vu:7,exile:1,fx:[["atkHitsAtk","v",2,10]],d:"{v} ダメージを（このターンに打ったアタックの数＋2）回（最大 10回）。1戦に1回。"},
 h_og_pit:{r:"OG",mo:"guard",own:"HINA",og:"ougi_hina_memo",n:"日向の盾",t:"grd",c:0,gas:2,v:15,vu:20,exile:1,fx:[["ogPit","v",15]],d:"エンジン耐久 +{v}・防御 15。次の番の終わりまで受けるダメージ半分。1戦に1回。"},
 m_og_chain:{r:"OG",mo:"atk_finisher",own:"MOMO",og:"ougi_momo_mankai",n:"百花繚乱",t:"atk",c:2000,gas:2,v:6,vu:8,exile:1,fx:[["atkChainNow","v"]],d:"チェインの数 ×{v} ダメージ（チェインの倍率もかかる）。1戦に1回。"},
 m_og_guard:{r:"OG",mo:"guard",own:"MOMO",og:"ougi_momo_hanaiyashi",n:"花霞",t:"grd",c:0,gas:2,v:3,vu:4,k:36,ku:48,exile:1,fx:[["blkChainV","v","k"],["gasDiscRest"]],d:"防御＝チェインの数 ×{v}（最大 {k}）。このターン、このあと打つカードのガソリン −1。1戦に1回。"},
 m_og_rev:{r:"OG",mo:"atk_finisher",own:"MOMO",og:"ougi_momo_kaerizaki",n:"狂い咲き",t:"atk",c:2500,gas:2,v:1,vu:1.5,k:60,ku:90,exile:1,fx:[["atkLostHp","v","k"]],d:"失っているエンジン耐久 ×{v} ダメージ（最大 {k}・倍率なし）。耐久が半分以下なら ×1.5。1戦に1回。"},
 n_og_shift:{r:"OG",mo:"atk_finisher",own:"NANA",og:"ougi_nana_houyoku",n:"千里鳳翔",t:"atk",c:1500,gas:2,v:12,vu:16,exile:1,fx:[["atkShiftsN","v"]],d:"このターンのシフトアップの数 ×{v} ダメージ。1戦に1回。"},
 n_og_perf:{r:"OG",mo:"atk_finisher",own:"NANA",og:"ougi_nana_oukyuu",n:"紅玉の城",t:"atk",c:2000,gas:2,v:5,vu:7,k:50,ku:70,exile:1,fx:[["atkPerfCount","v","k"]],d:"この戦闘のパーフェクトの数 ×{v} ダメージ（最大 {k}・倍率なし）。相手の防御を無視。1戦に1回。"},
 n_og_crown:{r:"OG",mo:"atk_finisher",own:"NANA",og:"ougi_nana_taikan",n:"鳳凰戴天",t:"atk",c:4000,gas:2,v:45,vu:65,exile:1,fx:[["taikan","v"]],d:"最大ギアなら先に相手の防御を0にして {v} ダメージ。最大ギアでなければ半分。1戦に1回。"},
});
const OG_OF_BRANCH={y_frz:"y_og_frz",y_cnt:"y_og_cnt",y_red:"y_og_red",h_rush:"h_og_rush",h_combo:"h_og_combo",h_pit:"h_og_pit",m_chain:"m_og_chain",m_guard:"m_og_guard",m_rev:"m_og_rev",n_shift:"n_og_shift",n_perf:"n_og_perf",n_crown:"n_og_crown"};
/* モーションのキー（revremit-yuki-motion-list.md 1章）。mo がなければ種類から */

/* ★v0.22.45 合成（design 10-21・★虎雪 16:45 案1）。決まった2枚 → 新しい1枚（fused:1）。報酬・ショップ・裏道・ラッキー・ラン前のデッキの候補には出ない（ミニカーで持ちこめる）。
   数は 10-21-2 の「上限の外の直し」のあと（チーフ 21:40）：春のクルーズ・凍界・霜刃・逆ハン・ブレーキターン・春嵐。名前は仮（design）、直した文は text 28-4 */
const FUSE=[
 {a:"sasame",b:"hakusen",id:"f_y_hyoukasen"},{a:"fubuki",b:"eikyu",id:"f_y_tokai"},{a:"braking",b:"counter",id:"f_y_gyakuhan"},{a:"shimo",b:"hyoujin",id:"f_y_soujin"},
 {a:"hakunetsu",b:"backfire",id:"f_y_shakusetsu"},{a:"tsurara",b:"rinkai",id:"f_y_rinkaitsurara"},
 {a:"h_youda",b:"h_asayake",id:"f_h_akebono"},{a:"h_gouda",b:"h_nichirin",id:"f_h_dainichirin"},{a:"h_kagerou",b:"h_hibana",id:"f_h_kagerouhibana"},
 {a:"h_nukiuchi",b:"h_shippu",id:"f_h_shippunuki"},{a:"h_hidamari",b:"h_kneegrip",id:"f_h_hidamarigrip"},{a:"h_fullbrake",b:"h_kickstart",id:"f_h_braketurn"},
 {a:"m_touka",b:"m_hanawa",id:"f_m_toukarin"},{a:"m_haruichiban",b:"m_hanafubuki",id:"f_m_shunran"},{a:"m_hanaakari",b:"m_softtop",id:"f_m_hanaakarihoro"},
 {a:"m_harukaze",b:"m_cruise",id:"f_m_harucruise"},{a:"m_kaerizaki",b:"m_rinjin",id:"f_m_kaeririnjin"},{a:"m_openair",b:"m_hanami",id:"f_m_hanamidrive"},
 {a:"n_paddle",b:"n_tenshou",id:"f_n_tenshoupaddle"},{a:"n_hachiren",b:"n_gaisen",id:"f_n_gaisenhachiren"},{a:"n_houyoku",b:"n_hiiro",id:"f_n_hiyoku"},
 {a:"n_hokori",b:"n_koutotsu",id:"f_n_hokorikoutotsu"},{a:"n_taikan",b:"n_totsugeki",id:"f_n_taikantotsugeki"},{a:"n_shukumei",b:"n_teppeki",id:"f_n_shukumeikabe"}];
Object.assign(CARDS,{
 f_y_hyoukasen:{fused:1,r:"R",mo:"atk_heavy",own:"YUKI",n:"氷華閃",t:"atk",c:2000,gas:2,v:12,vu:18,band:"M",fx:[["atk","v"],["frz",3]],d:"{v} ダメージ・凍結 3。"},
 f_y_tokai:{fused:1,r:"E",mo:"atk_finisher",own:"YUKI",n:"凍界",t:"atk",c:4500,gas:2,v:20,vu:30,fx:[["atk","v"],["frz",2]],d:"{v} ダメージ・凍結 2。"},/* 直し：v 24→20・凍結 4→2・上乗せなし */
 f_y_gyakuhan:{fused:1,r:"R",mo:"guard",own:"YUKI",n:"逆ハン",t:"grd",c:2500,gas:1,v:10,vu:15,fx:[["blk","v"],["counterAdd"]],d:"防御 {v}。次の番の最初のアタックに、この防御の半分を足す。",num:"blk"},/* 直し：14→10 */
 f_y_soujin:{fused:1,r:"R",mo:"atk_heavy",own:"YUKI",n:"霜刃",t:"atk",c:2500,gas:2,v:0.35,vu:0.5,fx:[["blkGear",3],["atkBlk","v"]],d:"ギア ×3 の防御を得てから、今の防御 ×{v} ダメージ。"},/* 直し：×0.7→×0.35 */
 f_y_shakusetsu:{fused:1,r:"R",mo:"atk_heavy",own:"YUKI",n:"灼雪",t:"atk",c:1500,gas:2,v:14,vu:21,band:"R",bm:2,fx:[["atk","v"],["burn",4]],d:"{v} ダメージ・炎上 4（レッドで2倍）。"},
 f_y_rinkaitsurara:{fused:1,r:"E",mo:"atk_finisher",own:"YUKI",n:"臨界氷柱",t:"atk",c:1000,gas:2,v:40,vu:60,fx:[["kousetsu","v",0]],d:"{v} ダメージ。レッドの外では半分。"},
 f_h_akebono:{fused:1,r:"R",mo:"atk_heavy",own:"HINA",n:"曙打",t:"atk",c:1000,gas:1,v:12,vu:18,fx:[["atkFirstTurn","v"]],d:"{v} ダメージ。戦闘の最初のターンなら2倍。"},
 f_h_dainichirin:{fused:1,r:"E",mo:"atk_finisher",own:"HINA",n:"大日輪",t:"atk",c:3000,gas:2,v:26,vu:39,fx:[["atk","v"],["atkAtks",5]],d:"{v} ダメージ＋このターン先に打ったアタックの数 ×5。",num:"sum"},
 f_h_kagerouhibana:{fused:1,r:"R",mo:"atk_light",own:"HINA",n:"陽炎火花",t:"atk",c:1500,gas:1,v:3,vu:5,fx:[["atkHits","v",4,4]],d:"{v} ダメージを4回。"},
 f_h_shippunuki:{fused:1,r:"R",mo:"atk_light",own:"HINA",n:"疾風抜き",t:"atk",c:1500,gas:1,v:7,vu:11,fx:[["atkHits","v",1,2],["draw",1]],d:"{v} ダメージ・1枚引く。シフトアップしていたら2回当たる。"},
 f_h_hidamarigrip:{fused:1,r:"R",mo:"guard",own:"HINA",n:"陽だまりグリップ",t:"grd",c:1500,gas:1,v:8,vu:12,fx:[["blk","v"],["heal",2],["nextTurnAtk",3]],d:"防御 {v}・エンジン耐久 +2。次の番の最初のアタック +3。",num:"blk"},
 f_h_braketurn:{fused:1,r:"R",mo:"guard",own:"HINA",n:"ブレーキターン",t:"rev",c:0,gas:1,sup:1,v:3,vu:5,fx:[["blk","v"],["revDown",1500],["draw",1]],d:"防御 {v}・回転 −1500・1枚引く。",num:"blk"},/* 直し：防御 6→3 */
 f_m_toukarin:{fused:1,r:"R",mo:"atk_light",own:"MOMO",n:"桃花輪",t:"atk",c:1000,gas:1,v:6,vu:9,fx:[["atkIfChain","v",3,5],["chainAdd",1]],d:"{v} ダメージ・チェイン +1。チェイン3以上なら +5。"},
 f_m_shunran:{fused:1,r:"E",mo:"atk_finisher",own:"MOMO",n:"春嵐",t:"atk",c:2500,gas:2,v:3,vu:5,fx:[["atkHitsChainN","v",5,9]],d:"{v} ダメージを5回。チェイン3つごとに +1回（9回まで）。"},/* 直し：2→3 */
 f_m_hanaakarihoro:{fused:1,r:"R",mo:"guard",own:"MOMO",n:"花灯りの幌",t:"grd",c:1500,gas:1,v:8,vu:12,fx:[["blk","v"],["blkChain"]],d:"防御 {v}＋チェインの数。",num:"blk"},
 f_m_harucruise:{fused:1,r:"R",mo:"rev",own:"MOMO",n:"春のクルーズ",t:"rev",c:1000,gas:1,sup:1,v:2,vu:3,fx:[["revDown",1000],["blkRaw","v"]],d:"回転 −1000・防御 {v}。",num:"blk"},/* 直し：回転 0→1000・防御 4→2・耐久 +1 なし */
 f_m_kaeririnjin:{fused:1,r:"E",mo:"atk_finisher",own:"MOMO",n:"返り輪刃",t:"atk",c:2000,gas:2,v:16,vu:24,fx:[["atkLowHp","v"]],d:"{v} ダメージ。エンジン耐久が半分以下なら2倍。"},
 f_m_hanamidrive:{fused:1,r:"R",mo:"rev",own:"MOMO",n:"花見ドライブ",t:"rev",c:0,gas:1,sup:1,v:2,vu:3,fx:[["hanami",1],["openAir","v"]],d:"捨て札から回転0のカードを1枚手札に。このターン、補助を打つたびに {v} ダメージ。"},
 f_n_tenshoupaddle:{fused:1,r:"R",mo:"atk_light",own:"NANA",n:"天翔パドル",t:"atk",c:0,gas:1,v:8,vu:12,shiftCard:1,atShift:1,fx:[["atk","v"]],d:"シフトアップしてから {v} ダメージ（AT でも打てる）。"},
 f_n_gaisenhachiren:{fused:1,r:"E",mo:"atk_finisher",own:"NANA",n:"凱旋八連",t:"atk",c:3000,gas:2,v:3,vu:5,fx:[["atkGear6","v"],["atkShiftsN",5]],d:"{v} ×今のギア（6まで）＋このターンのシフトアップの数 ×5。",num:"sum"},
 f_n_hiyoku:{fused:1,r:"R",mo:"atk_heavy",own:"NANA",n:"緋翼",t:"atk",c:1500,gas:1,v:7,vu:11,fx:[["perfBoth","v",5]],d:"{v} ダメージ・防御 5。直前のシフトがパーフェクトなら両方2倍。"},
 f_n_hokorikoutotsu:{fused:1,r:"R",mo:"atk_heavy",own:"NANA",n:"誇りの紅突",t:"atk",c:2000,gas:2,v:10,vu:15,fx:[["atkPerfCnt","v",2,10]],d:"{v} ダメージ＋この戦闘のパーフェクトの数 ×2（+10まで）。"},
 f_n_taikantotsugeki:{fused:1,r:"E",mo:"atk_finisher",own:"NANA",n:"戴冠突撃",t:"atk",c:4000,gas:2,v:26,vu:39,fx:[["taikan","v"]],d:"{v} ダメージ。最大ギアなら先に相手の防御を0に。最大ギアでなければ半分。"},
 f_n_shukumeikabe:{fused:1,r:"R",mo:"atk_heavy",own:"NANA",n:"宿命の壁",t:"atk",c:2000,gas:1,v:8,vu:12,fx:[["vsBigBoth","v"]],d:"防御 {v}・{v} ダメージ。エリート・ボスには両方1.5倍。"}});
const FUSE_OF=id=>FUSE.find(f=>f.id===id);
const TYPE_MOTION={atk:"atk_light",grd:"guard",dbf:"debuff",drw:"draw",rev:"rev",sk:"skill",jam:"rev"};
const TYPE_JP={atk:"アタック",grd:"ガード",dbf:"デバフ",drw:"ドロー",rev:"回転操作",sk:"固有スキル",jam:"ジャマ"};
const BAND_JP={L:"低回転",M:"中回転",R:"レッド"};
/* 報酬の候補（キャラごと）：生成・固有スキル以外の共通と専用 */
Object.values(CHARS).forEach((ch,_,a)=>{const id0=Object.keys(CHARS).find(k=>CHARS[k]===ch);ch.pool=Object.keys(CARDS).filter(id=>!CARDS[id].gen&&!CARDS[id].fused&&CARDS[id].r!=="SK"&&CARDS[id].r!=="OG"&&(CARDS[id].own==="N"||CARDS[id].own===id0))});
