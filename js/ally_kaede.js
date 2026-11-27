"use strict";
/* ★③ KAEDE（レッドゾーン型＝パワーで押し切る）。NIGHT 5 の初クリアで加わる。数値は【仮・③】 */
(function(){const A3=globalThis.ALLY3;if(!A3||CHARS.KAEDE)return;
const redAdd=()=>RULE().redAtk||0;
A3.register({id:"KAEDE",night:5,treeBase:"k_momijigiri",
 char:{carName:"フェアレディZ",weapon:"ツインターボブレード",type:"レッドゾーン",join:5,
  car:{type:"mt",gears:6,mult:[1.0,1.25,1.5,1.75,2.0,2.25],red:6500,limit:8000,band:[4500,5500],core:[4800,5200],
   idle:1000,brake:3000,hp:95,spd:10,minShift:3000,upDrop:0.6,earlyDrop:0.45,downDiv:0.6,bands:{L:[1000,2500],M:[2500,4500],R:[6500,8000]}},
  deck:[["k_momijigiri",4],["k_benigiri",2],["k_oofuri",2],["k_fullbucket",2],["k_overtake",2],["k_hinoko",2],["k_guren",1],["braking",2],["qshift",2],["slip",1]],
  skill:"k_guren",rule:{redAtk:4},ruleTxt:"紅蓮：レッドゾーンで打つアタック +4"},
 cards:{
  k_benigiri:{r:"C",mo:"atk_heavy",own:"KAEDE",n:"紅斬り",t:"atk",c:2000,gas:2,v:10,vu:15,band:"M",fx:[["atk","v"]],d:"{v}ダメージ"},
  k_momijigiri:{r:"C",mo:"atk_light",own:"KAEDE",n:"紅葉斬り",t:"atk",c:1500,gas:1,v:8,vu:12,band:"L",fx:[["atk","v"]],d:"{v}ダメージ"},
  k_oofuri:{r:"C",mo:"atk_heavy",own:"KAEDE",n:"大振り",t:"atk",c:3000,gas:2,v:13,vu:20,band:"R",fx:[["atk","v"]],d:"{v}ダメージ"},
  k_fullbucket:{r:"C",mo:"guard",own:"KAEDE",n:"フルバケット",t:"grd",c:1000,gas:1,v:6,vu:9,band:"L",fx:[["blk","v"]],d:"防御 {v}"},
  k_overtake:{r:"C",mo:"draw",own:"KAEDE",n:"オーバーテイク",t:"drw",c:0,gas:0,v:1,vu:2,sup:1,fx:[["draw","v"],["revUpCap",1000]],d:"{v}枚引く・回転 +1000（リミットで止まる）"},
  k_guren:{r:"SK",mo:"skill",own:"KAEDE",n:"紅蓮ブレイクスルー",t:"sk",c:0,gas:2,v:5,vu:8,sup:1,fx:[["blk",8],["turnAdd","gurenAdd","v"]],d:"防御 8。このターン、レッドゾーンで打つアタック +{v}"},
  k_twinturbo:{r:"R",mo:"rev",own:"KAEDE",n:"ツインターボ",t:"rev",c:0,gas:0,v:2500,vu:3000,sup:1,fx:[["revUpCap","v"],["blkFlat",2]],d:"回転 +{v}（リミットで止まる）・防御 2"},
  k_momijiarashi:{r:"E",mo:"atk_finisher",own:"KAEDE",n:"紅葉嵐",t:"atk",c:1000,gas:2,v:7,vu:10,fx:[["atkRedHalf","v",3]],d:"{v}ダメージを3回。レッドゾーンの外では ×0.5"},
  k_rouga:{r:"R",mo:"atk_heavy",own:"KAEDE",n:"狼牙",t:"atk",c:1500,gas:1,v:8,vu:12,band:"R",bm:2,fx:[["atk","v"]],d:"{v}ダメージ（レッドゾーンで2倍）"},
  k_enjin:{r:"R",mo:"guard",own:"KAEDE",n:"炎陣",t:"grd",c:1500,gas:1,v:6,vu:9,fx:[["blkRed","v"]],d:"防御 {v}（レッドゾーンで2倍）"},
  k_ichigeki:{r:"R",mo:"atk_finisher",own:"KAEDE",n:"一撃",t:"atk",c:4000,gas:2,v:22,vu:33,fx:[["atk","v"]],d:"{v}ダメージ"},
  k_fullboost:{r:"R",mo:"rev",own:"KAEDE",n:"フルブースト",t:"rev",c:0,gas:1,v:0.5,vu:0.7,sup:1,fx:[["nextBonus","v"],["revUpCap",1500]],d:"次のカードの倍率 +{v}・回転 +1500（オーバーレブに注意）"},
  k_boostcut:{r:"C",mo:"rev",own:"KAEDE",n:"ブーストカット",t:"rev",c:0,gas:0,v:1500,vu:2000,sup:1,fx:[["revDown","v"],["nextAtkAdd",2]],d:"回転 −{v}・次のアタック +2"},
  k_hinoko:{r:"C",mo:"atk_light",own:"KAEDE",n:"火の粉",t:"atk",c:500,gas:0,v:3,vu:4,fx:[["atk","v"]],d:"{v}ダメージ（ガソリン 0）"},
  k_sotosen:{r:"R",mo:"atk_heavy",own:"KAEDE",n:"外線",t:"atk",c:2000,gas:1,v:8,vu:12,band:"M",fx:[["atkIfTurn2","v"]],d:"{v}ダメージ。2ターン目から ×1.5"},
  k_shoubu:{r:"E",mo:"atk_finisher",own:"KAEDE",n:"勝負",t:"atk",c:2500,gas:2,v:10,vu:15,fx:[["atkLost","v",0.5,30]],d:"{v}＋失ったエンジン耐久の半分（最大 +30）ダメージ"},
  k_noroshi:{r:"R",mo:"rev",own:"KAEDE",n:"狼煙",t:"rev",c:0,gas:1,v:2,vu:3,sup:1,fx:[["flagBattle","noroshi","v"]],d:"この戦闘の間、レッドゾーンでアタックを打つたび、次のアタック +{v}"}},
 parts:{k_bigturbo:{own:"KAEDE",n:"大型タービン",d:"レッドゾーンで打つアタック +2"},
  k_bov:{own:"KAEDE",n:"ブローオフバルブ",d:"戦闘で1回、オーバーレブしても耐久が減らない"},
  k_longnose:{own:"KAEDE",n:"ロングノーズ",d:"回転 3000 以上のアタック +3"}},
 unlock:{start:["k_benigiri","k_momijigiri","k_oofuri","k_fullbucket","k_overtake","k_guren","k_hinoko","k_boostcut","k_enjin"],
  a1:["k_rouga","k_twinturbo"],a2:["k_ichigeki","k_sotosen"],clear:["k_momijiarashi","k_shoubu"],sRank:["k_fullboost"],hidden:["k_noroshi"],
  parts:{start:["k_longnose"],a1:["k_bov"],clear:["k_bigturbo"]}},
 boss:{key:"kagesen",enemy:{art:"kagesen",n:"影線",rank:"boss",ally:"KAEDE",hp:240,spd:11,bgm:"boss_kagesen",
  pat:[["atk",16],["rev",1500],["multi",5,3],["atk",20]],phase:{at:0.5,spd:12,art:"kagesen_p2",pat:[["rev",2000],["atk",22],["multi",6,3]]},wpn:"同じ線を走る影の大剣"}},
 tree:[
  {id:"k_guren",n:"紅蓮",d:"レッドで押し切る型",entry:["k_rouga","k_twinturbo"],cards:["k_benigiri","k_oofuri","k_rouga","k_momijiarashi","k_twinturbo"],parts:["hicam","pipe","limiter","k_bigturbo"],top:"紅蓮：レッドゾーンのアタック +4 → +6",tip:"レッドゾーンで打つアタックの上乗せが +6 になる。"},
  {id:"k_shoubu",n:"勝負師",d:"追いつめられて強い型",entry:["k_enjin","k_boostcut"],cards:["k_shoubu","k_enjin","k_fullbucket","k_boostcut"],parts:["cage","jack","widebody","k_bov"],top:"耐久が半分以下で、アタック +3",tip:"エンジン耐久が最大の半分以下のあいだ、アタック +3。"},
  {id:"k_soto",n:"外線",d:"自分の線で抜く型",entry:["k_sotosen","k_ichigeki"],cards:["k_sotosen","k_ichigeki","k_overtake","k_hinoko","k_momijigiri"],parts:["turbo","launch","nitro","k_longnose"],top:"2ターン目から、最初のアタックの倍率 +0.5",tip:"2ターン目からの各ターン、最初に打つアタックの倍率 +0.5。"}],
 style:["回転をレッドゾーンまで上げて、強い一撃で押し切るパワー型。レッドゾーンで打つアタックは +4。","ねらい：ツインターボ・オーバーテイクで回転を上げ、狼牙・紅葉嵐で決める。オーバーレブに注意。"],
 rule:r=>A3.treeTopIs("k_guren")?Object.assign({},r,{redAtk:6}):r,
 attack:(v,m)=>{/* ★v0.19 design v0.11.66 redBonusAT：AT は帯の上半分〜レッドの手前で打っても +2（レッドの +4 は今のまま） */
   if(A3.isChar("KAEDE")&&G.mode==="AT"&&!B.playRed&&RULE().redBonusAT){const b=bandRange();if(B.rpm>=(b.lo+b.hi)/2)v+=RULE().redBonusAT}
   if(B.playRed){if(A3.isChar("KAEDE"))v+=redAdd()+A3.turnVal("gurenAdd");if(has("k_bigturbo"))v+=2}
   if(has("k_longnose")&&B.curCost>=3000)v+=3;
   if(A3.isChar("KAEDE")&&A3.treeTopIs("k_shoubu")&&G.hp<=G.maxhp/2)v+=3;return v},
 before:x=>{if(A3.isChar("KAEDE")&&A3.treeTopIs("k_soto")&&x.d.t==="atk"&&B.pTurns>=1&&B.atks===0&&!A3.sameTurn("soto")){B.sotoTurn=B.pTurns;B.nextBonus=Math.round(((B.nextBonus||0)+0.5)*100)/100}},
 after:x=>{if(B.noroshi&&x.d.t==="atk"&&x.red){B.atkAdd=Math.min(A3.noroshiMax||15,(B.atkAdd||0)+B.noroshi);addLog(`狼煙：次のアタック +${B.noroshi}`)}},
});
})();
