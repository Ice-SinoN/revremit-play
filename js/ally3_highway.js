"use strict";
/* ★③ design 13-2（v0.5）：NIGHT 5〜8 は4エリア＝ストリート → 峠 → 高速 → サーキット（段 12・12・12・13）。NIGHT 1〜4 は今の3エリアのまま。
   ①の AREAS（const の配列）は、そのランの夜に合わせて中身を入れかえる（ランを始めるとき・続きから・マップ・戦闘のとき）。
   ALLY3.FOUR_AREAS=false で今の3エリアだけにもどる（★虎雪の決め待ち＝progression 1-38）。
   絵がまだない敵は今の敵の絵の色変え（仮）、背景はストリートの絵（仮）。 */
(function(){const A3=globalThis.ALLY3;if(!A3||A3.highway)return;
/* ★v1.4 ②の night2.js（v0.5.20〜・高速と港・window.applyAreas）があれば、②の並びにまかせる（③の仮の高速は使わない）。読む順はどちらでもよい */
const P2=()=>typeof window!=="undefined"&&typeof window.applyAreas==="function";if(P2()){A3.highway=true;return}
A3.FOUR_AREAS=true;
Object.assign(ENEMIES,{
 hw_trailer:{art:"kei",pal:"hw_trailer",n:"ナイトトレーラー",hp:90,spd:8,pat:[["blk",16],["atk",20]]},
 hw_booster:{art:"formula",pal:"hw_booster",n:"ブースター",hp:60,spd:15,pat:[["multi",5,3],["atk",12]]},
 hw_shadow:{art:"safety",pal:"hw_shadow",n:"ハイウェイシャドウ",hp:75,spd:11,pat:[["atk",14],["apd",1],["atk",14]],first:1,gimTxt:"先に動く"},
 hw_lane:{art:"coupe",pal:"hw_lane",n:"レーンチェンジャー",hp:70,spd:13,pat:[["atk",10],["multi",4,2],["blk",10]],accel:1,gimTxt:"動くたびに速くなる"},
 hw_long:{art:"formula",pal:"hw_long",n:"ロングストレート",rank:"elite",hp:200,spd:12,pat:[["multi",6,3],["atk",22],["blk",18]],rage:1,gimTxt:"動くたびに攻撃 +1"},
 hw_boss:{art:"boss2",pal:"hw_boss",n:"残響",rank:"boss",hp:300,spd:11,pat:[["atk",18],["multi",5,4],["rev",2000],["atk",24]],blkKeep:0.3,gimTxt:"防御の3割が次の番まで残る",
   phase:{at:0.5,spd:13,pat:[["multi",6,4],["atk",28]],pal:"hw_boss2",wx:"rain"}},
});
if(typeof PALS!=="undefined")Object.assign(PALS,{hw_trailer:{hue:200,sat:0.8},hw_booster:{hue:-60,sat:1.3},hw_shadow:{hue:180,lit:0.85},hw_lane:{hue:120,sat:1.2},hw_long:{hue:-90,sat:1.4,lit:0.9},hw_boss:{hue:160,sat:0.7},hw_boss2:{hue:200,sat:1.1}});
if(typeof addEventListener==="function")addEventListener("DOMContentLoaded",()=>{if(!P2()&&typeof AREA_BG!=="undefined"&&!Object.getOwnPropertyDescriptor(AREA_BG,"highway"))AREA_BG.highway="street"});
const HW={key:"highway",n:"高速",rows:12,pool:["hw_trailer","hw_booster","hw_shadow","hw_lane"],easy:["hw_trailer","hw_shadow"],elite:"hw_long",boss:"hw_boss",mid:6,hpMul:1.72,bossMul:1.0,atkMul:1.25};
const BASE=AREAS.map(a=>Object.assign({},a));
const FOUR=[Object.assign({},BASE[0],{rows:12}),Object.assign({},BASE[1],{rows:12}),HW,Object.assign({},BASE[2],{rows:13,mid:6})];
A3.areasFor=n=>A3.FOUR_AREAS&&n>=5?FOUR:BASE;
A3.syncAreas=n=>{if(P2())return;const L=A3.areasFor(n);if(AREAS.length===L.length&&AREAS[2].key===L[2].key&&AREAS[0].rows===L[0].rows)return;AREAS.splice(0,AREAS.length,...L.map(a=>Object.assign({},a)))};
const sync=()=>{try{if(G)A3.syncAreas(G.night||0)}catch(e){}};
const _nrs=newRunState;newRunState=function(mode,ch,bring,dk,opt){if(!P2())A3.syncAreas(Math.max(0,+(opt&&opt.night)||0));return _nrs(mode,ch,bring,dk,opt)};
["areaIdx","nodeEnemy","advanceRow","startBattleState"].forEach(f=>{const g=globalThis[f];if(typeof g!=="function")return;globalThis[f]=function(){sync();return g.apply(this,arguments)}});
/* 画面：エリアの入り口の一言は key で（高速は名前だけ・話はシナリオ班待ち）。高速のボスの前後の話はまだないので出ない */
if(typeof areaIntro==="function"){const _ai=areaIntro;areaIntro=function(ai,done){if(P2())return _ai.apply(this,arguments);sync();const a=AREAS[ai];if(!a)return done();const bi=["street","touge","circuit"].indexOf(a.key);
  if(bi>=0)return _ai(bi,done);TEXT.scenes.__t.title=`エリア${ai+1}　${a.n}`;showScene("__t",done)}}
A3.highway=true;
})();
