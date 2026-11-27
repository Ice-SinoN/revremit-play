"use strict";
/* ★③ LUNA（星読み＝月の満ち欠け＋星座・design 20章・★虎雪 11-24 15:14 で作り直し）。NIGHT 7 の初クリアで加わる。数は仮 */
(function(){const A3=globalThis.ALLY3;if(!A3||CHARS.LUNA)return;

A3.register({id:"LUNA",night:7,treeBase:"l_hoshikuzu",
 char:{carName:"GR86",weapon:"ツインペンデュラム",type:"星読み",join:7,
  car:{type:"mt",gears:6,mult:[1.0,1.22,1.44,1.66,1.88,2.1],red:7500,limit:8500,band:[4500,5500],core:[4800,5200],
   idle:1000,brake:3000,hp:80,spd:11,minShift:3000,upDrop:0.6,earlyDrop:0.45,downDiv:0.6,bands:{L:[1000,3000],M:[3000,5000],R:[7500,8500]}},
  deck:[["l_hoshikuzu",4],["l_tsukikage",2],["l_furikouchi",2],["l_tsukigasa",2],["l_seizu",2],["l_yurimodoshi",2],["l_oracle",1],["braking",2],["qshift",2],["slip",1]],
  skill:"l_oracle",rule:{moon:{carry:1,mul:[0.8,1.0,1.15,1.5],newGrd:3,newStar:1,cresGrd:1},sky:{line:6,lineMaxTurn:2,tri:8,full:30,fullMoonMul:2}},ruleTxt:"星読み：月は番ごとに 新月 → 三日月 → 半月 → 満月 と進む（戦闘をまたぐ）。新月 アタック ×0.8・ガード +3・番の終わりに星1つ／三日月 ガード +1／半月 ×1.15／満月 ×1.5・星座 ×2。カードを打つと3×3の夜空に星が灯り、直線で流れ星 6・三角で防御 8・9つで星座の完成 30"},
 cards:{
  l_hoshikuzu:{r:"C",mo:"atk_light",own:"LUNA",n:"星屑",t:"atk",star:5,c:1500,gas:1,v:5,vu:8,band:"M",fx:[["atk","v"]],d:"{v}ダメージ（星：真ん中）"},
  l_tsukikage:{r:"C",mo:"atk_light",own:"LUNA",n:"月影",t:"atk",star:1,c:500,gas:0,v:4,vu:6,fx:[["atkMoonNewBlk","v",4]],d:"{v}ダメージ。新月なら防御 +4 も（星：1）"},
  l_furikouchi:{r:"C",mo:"atk_light",own:"LUNA",n:"振り子打ち",t:"atk",star:3,c:1500,gas:1,v:3,vu:5,band:"L",fx:[["atkHits","v",2,2]],d:"{v}ダメージを2回（星：3）"},
  l_tsukigasa:{r:"C",mo:"guard",own:"LUNA",n:"月暈",t:"grd",star:7,c:1000,gas:1,v:5,vu:8,band:"L",fx:[["blk","v"]],d:"防御 {v}（星：7）"},
  l_seizu:{r:"C",mo:"draw",own:"LUNA",n:"星図",t:"drw",star:"any",c:1000,gas:0,v:1,vu:2,fx:[["draw","v"]],d:"{v}枚引く（星：形に近いマス）"},
  l_oracle:{r:"SK",mo:"skill",own:"LUNA",n:"ルナティック・オラクル",t:"sk",c:0,gas:2,v:3,vu:3,sup:1,fx:[["oracle","v"]],d:"月を満月にする。星を {v} つ（形に近いマス）。1戦に1回"},
  l_ryuuseigun:{r:"E",mo:"atk_finisher",own:"LUNA",n:"流星群",t:"atk",c:3000,gas:2,v:4,vu:6,fx:[["ryuuseigun","v"]],d:"灯っている星の数 × {v} ダメージ（星は消えない）。満月なら ×2"},
  l_mikazuki:{r:"R",mo:"atk_light",own:"LUNA",n:"三日月",t:"atk",star:2,c:1500,gas:1,v:6,vu:9,fx:[["atkMoon","v",1,2]],d:"{v}ダメージ。三日月の番は ×2（星：2）"},
  l_tenkyuu:{r:"R",mo:"rev",own:"LUNA",n:"天球",t:"rev",c:0,gas:1,v:1,vu:1,sup:1,fx:[["moonMove",1]],d:"月を1つ進める（1ターン1回）"},
  l_suiheisen:{r:"R",mo:"atk_heavy",own:"LUNA",n:"水平線",t:"atk",star:4,c:2000,gas:1,v:6,vu:9,band:"M",fx:[["atkRow","v",8]],d:"{v}ダメージ。横の線（4・5・6）がそろっていれば +8（星：4）"},
  l_suisei:{r:"R",mo:"atk_heavy",own:"LUNA",n:"彗星",t:"atk",star:"diag",c:2000,gas:1,v:4,vu:6,fx:[["atk","v"]],d:"{v}ダメージ。ななめに星を2つ（1 と 9。空いていなければ 3 と 7）"},
  l_shingetsu:{r:"R",mo:"guard",own:"LUNA",n:"新月",t:"grd",star:8,c:1000,gas:1,v:6,vu:9,fx:[["blk","v"],["newMoonStars",2]],d:"防御 {v}。新月の番は、さらに星を2つ（形に近いマス）（星：8）"},
  l_mangetsu:{r:"R",mo:"atk_finisher",own:"LUNA",n:"満月",t:"atk",star:6,c:2500,gas:2,v:8,vu:12,fx:[["atkFull","v",3]],d:"{v}ダメージ。満月の番は、灯っている星の数 ×3 を足す（星：6）"},
  l_myoujou:{r:"R",mo:"draw",own:"LUNA",n:"明星",t:"drw",star:3,c:0,gas:1,v:1,vu:2,sup:1,fx:[["draw","v"],["nextTurnDraw",1]],d:"{v}枚引く。次の番のはじめにも1枚（星：3）"},
  l_teijuushin:{r:"C",mo:"guard",own:"LUNA",n:"低重心",t:"grd",star:9,c:1500,gas:1,v:7,vu:10,fx:[["blk","v"]],d:"防御 {v}（星：9）"},
  l_yurimodoshi:{r:"C",mo:"rev",own:"LUNA",n:"揺り戻し",t:"rev",c:0,gas:0,v:5,vu:8,sup:1,fx:[["revDown",1500],["blk","v"],["moonMove",-1]],d:"回転 −1500・防御 {v}。月を1つもどす（1ターン1回）"},
  l_hoshiyomi:{r:"R",mo:"rev",own:"LUNA",n:"星読み",t:"rev",c:0,gas:1,v:6,vu:9,sup:1,fx:[["flagBattle","fullFirst","v"]],d:"この戦闘、満月の番の最初のアタック +{v}"}},
 parts:{l_armillary:{own:"LUNA",n:"天球儀",d:"戦闘のはじめに、真ん中に星を1つ"},
  l_boxer:{own:"LUNA",n:"水平対向",d:"横の線の流れ星 +3"},
  l_starnote:{own:"LUNA",n:"星図のノート",d:"満月の番、星座の効果の倍率 +0.5（×2 → ×2.5）"}},
 unlock:{start:["l_hoshikuzu","l_tsukikage","l_furikouchi","l_tsukigasa","l_seizu","l_oracle","l_yurimodoshi","l_teijuushin","l_mikazuki"],
  a1:["l_suiheisen","l_shingetsu"],a2:["l_suisei","l_tenkyuu"],clear:["l_ryuuseigun","l_mangetsu"],sRank:["l_hoshiyomi"],hidden:["l_myoujou"],
  parts:{start:["l_starnote"],a1:["l_boxer"],clear:["l_armillary"]}},
 boss:{key:"itoboshi",enemy:{art:"itoboshi",n:"凍星",rank:"boss",ally:"LUNA",hp:250,spd:9,bgm:"boss_itebosi",
  pat:[["blk",15],["atk",17],["apd",1],["multi",5,3]],phase:{at:0.5,spd:10,art:"itoboshi_p2",pat:[["atk",20],["apd",1],["multi",6,3]]},wpn:"凍った星の振り子"}},
 tree:[
  {id:"l_seizu",n:"月",d:"満月に合わせる型",entry:["l_tenkyuu","l_mikazuki"],cards:["l_mikazuki","l_mangetsu","l_tenkyuu","l_yurimodoshi","l_hoshiyomi"],parts:["pacenote","hook","dashcam","l_starnote"],top:"満月のアタック +0.2",tip:"満月の番のアタックの倍率に +0.2（満月 ×1.3 なら ×1.5）。"},
  {id:"l_ryusei",n:"星",d:"線と三角で削る型",entry:["l_suisei","l_suiheisen"],cards:["l_suisei","l_suiheisen","l_hoshikuzu","l_furikouchi","l_seizu"],parts:["turbo","nitro","limiter","l_boxer"],top:"流れ星 +3・三角の防御 +4",tip:"流れ星のダメージ +3、三角の防御 +4。"},
  {id:"l_shin",n:"夜空",d:"夜空を育てる型",entry:["l_shingetsu","l_teijuushin"],cards:["l_shingetsu","l_ryuuseigun","l_teijuushin","l_tsukigasa","l_myoujou"],parts:["grip","cage","jack","l_armillary"],top:"流星群と星座の完成 ×1.5",tip:"流星群と、星座の完成のダメージが 1.5倍。"}],
 style:["月の満ち欠けと3×3の夜空で戦う「星読み」型。月は番ごとに進み（戦闘をまたぐ）、満月の番はアタック ×1.5・星座 ×2。打ったカードのマスに星が灯り、形がそろうと自動で効く。","ねらい：新月で守って星を仕込み、満月の番に形をそろえて大きく削る。"],
 ops:{
  atkMoonNewBlk:(x,v,b)=>{x.attack(v);if(A3.luna.moon()===0)x.block(b)},
  atkMoon:(x,v,ph,k)=>x.attack(A3.luna.moon()===ph?v*k:v),
  atkRow:(x,v,a)=>{const s=B.sky||[];x.attack(s[3]&&s[4]&&s[5]?v+a:v)},
  atkFull:(x,v,k)=>x.attack(A3.luna.moon()===3?v+k*A3.luna.lit():v),
  ryuuseigun:(x,v)=>{let d=v*A3.luna.lit();if(A3.luna.moon()===3)d*=2;if(A3.treeTopIs("l_shin"))d=Math.round(d*1.5);x.attack(d)},
  moonMove:(x,n)=>A3.luna.move(n),
  newMoonStars:(x,n)=>{if(A3.luna.moon()===0)for(let i=0;i<n;i++)A3.luna.star("any")},
  oracle:(x,n)=>{if(B.oracleUsed){addLog("ルナティック・オラクル：この戦闘ではもう使った");return}B.oracleUsed=1;A3.luna.set(3);for(let i=0;i<n;i++)A3.luna.star("any")}},
 before:x=>{if(!A3.isChar("LUNA"))return;B.curFullFirst=false;if(B.fullFirst&&x.d.t==="atk"&&A3.luna.moon()===3&&!A3.turnVal("ffUsed")){A3.turnVal("ffUsed",1);B.curFullFirst=true}},
 attack:(v,m)=>{if(!A3.isChar("LUNA"))return v;const L=A3.luna;if(B.curFullFirst){v+=B.fullFirst;B.curFullFirst=false;addLog(`星読み：満月の最初のアタック +${B.fullFirst}`)}
   let k=L.mul();if(L.moon()===3&&A3.treeTopIs("l_seizu"))k+=L.rule().moon.fullAdd!=null?L.rule().moon.fullAdd:0.2;/* ★v0.39 design 20：月の枝は満月に足す（moonFullAdd +0.2） */return v*k},
 block:v=>{if(!A3.isChar("LUNA")||B.curType!=="grd")return v;const R=A3.luna.rule().moon,p=A3.luna.moon();return v+(p===0?R.newGrd:p===1?R.cresGrd:0)},
 after:x=>{if(!A3.isChar("LUNA"))return;const s=x.d.star;if(s==null)return;if(s==="diag"){const k=B.sky||[];if(!k[0]&&!k[8]){A3.luna.star(1);A3.luna.star(9)}else{A3.luna.star(3);A3.luna.star(7)}}else A3.luna.star(s)},
 turn:first=>{if(!A3.isChar("LUNA"))return;A3.luna.advance()},
 battle:key=>{if(!A3.isChar("LUNA"))return;B.sky=Array(9).fill(0);B.skyLines={};B.skyTris={};if(has("l_armillary"))A3.luna.star(5)},
});
/* ★v0.32 月の満ち欠け＋星座（design 20章）。13-4-3 の「山札の上2枚」・山札をいじる力（星読みの引き・並べかえ・選ぶ小窓）は外した */
const MN=["新月","三日月","半月","満月"],LINES=[[1,2,3],[4,5,6],[7,8,9],[1,4,7],[2,5,8],[3,6,9],[1,5,9],[3,5,7]],TRIS=[[2,7,9],[1,3,8]],RING=[1,2,3,6,9,8,7,4];
const L=A3.luna={
 rule:()=>RULE().moon?RULE():{moon:{mul:[0.8,1,1.15,1.5],newGrd:3,newStar:1,cresGrd:1},sky:{line:6,lineMaxTurn:2,tri:8,full:30,fullMoonMul:2}},
 moon:()=>((G&&G.moon)||0)%4, mul:()=>L.rule().moon.mul[L.moon()], name:p=>MN[p==null?L.moon():p],
 advance(){if(G.moon==null){G.moon=0;return}G.moon=(G.moon+1)%4;addLog(`月：${L.name()}`);A3.se("luna_moon",{phase:G.moon});if(G.moon===3)ev({k:"onset"})},
 move(n){if(A3.turnVal("moonMv")){addLog("月はこのターン、もう動かした");return}A3.turnVal("moonMv",1);G.moon=((G.moon||0)+n+4)%4;addLog(`月：${L.name()}`);A3.se("luna_moon",{phase:G.moon})},
 set(p){G.moon=p;addLog(`月：${L.name()}`);A3.se("luna_moon",{phase:p})},
 lit:()=>(B.sky||[]).filter(Boolean).length,
 /* ★v0.37 星の置き場：sk＝夜空の写し（9）。pick は B.lunaPicks（人が選んだマス）を先に使う */
 autoPick(sk){let best=-1,bs=-1;for(let c=1;c<=9;c++){if(sk[c-1])continue;let sc=(c===5?2:c%2?1:0);LINES.forEach(l=>{if(l.includes(c)){const k=l.filter(q=>sk[q-1]).length;sc+=k===2?20:k}});TRIS.forEach(t=>{if(t.includes(c)&&t.filter(q=>sk[q-1]).length===2)sc+=12});if(sc>bs){bs=sc;best=c}}return best},
 pick(){const s=B.sky;while(B.lunaPicks&&B.lunaPicks.length){const c=B.lunaPicks.shift();if(c>=1&&c<=9&&!s[c-1])return c}return L.autoPick(s)},
 slot(sk,c){if(c<1)return -1;if(!sk[c-1])return c;const i=c===5?-1:RING.indexOf(c);for(let k=1;k<=8;k++){const q=RING[(i+k+8)%8];if(!sk[q-1])return q}return -1},
 anyN(c){const d=CD(c);let n=d.star==="any"?1:0;d.fx.forEach(f=>{if(f[0]==="newMoonStars"&&L.moon()===0)n+=f[1];if(f[0]==="oracle"&&!B.oracleUsed)n+=(c.up?CARDS[c.id].vu:CARDS[c.id].v)||3});return n},
 /* カードを打ったら、どこに灯って、どの形がそろうか（画面の予告・効きは打つまで出ない） */
 sim(c,picks){const d=CD(c),sk=(B.sky||Array(9).fill(0)).slice(),used={l:Object.assign({},B.skyLines),t:Object.assign({},B.skyTris)},out={cells:[],lines:[],tris:[],full:false};const pk=(picks||[]).slice();
  const put=c0=>{let c=c0;if(c==="any"){while(pk.length&&sk[pk[0]-1])pk.shift();c=pk.length?pk.shift():L.autoPick(sk)}c=L.slot(sk,c);if(c<0)return;sk[c-1]=1;out.cells.push(c);
    LINES.forEach((l,i)=>{if(l.includes(c)&&!used.l[i]&&l.every(q=>sk[q-1])){used.l[i]=1;out.lines.push(l)}});TRIS.forEach((t,i)=>{if(t.includes(c)&&!used.t[i]&&t.every(q=>sk[q-1])){used.t[i]=1;out.tris.push(t)}});if(sk.every(Boolean))out.full=true};
  if(d.star==="diag"){if(!sk[0]&&!sk[8]){put(1);put(9)}else{put(3);put(7)}}else if(d.star!=null)put(d.star);
  d.fx.forEach(f=>{if(f[0]==="newMoonStars"&&L.moon()===0)for(let i=0;i<f[1];i++)put("any");if(f[0]==="oracle"&&!B.oracleUsed)for(let i=0;i<3;i++)put("any")});return out},
 star(c){if(!B.sky)B.sky=Array(9).fill(0);const s=B.sky;if(c==="any")c=L.pick();c=L.slot(s,c);if(c<0)return;s[c-1]=1;addLog(`星：マス ${c}`);A3.se("luna_star",{cell:c});L.check(c)},
 fx:()=>{const R=L.rule().sky;return L.moon()===3?R.fullMoonMul+(has("l_starnote")?0.5:0):1},/* ★v0.39 星図のノートは +0.5 の足し算 */
 hit(d){const e=B.e;if(!e||e.hp<=0)return;const b=e.block;e.block=0;try{hitEnemy(d)}finally{e.block=b}},
 check(c){const R=L.rule().sky,s=B.sky,on=q=>s[q-1],k=L.fx();
   LINES.forEach((l,i)=>{if(!l.includes(c)||B.skyLines[i]||!l.every(on))return;B.skyLines[i]=1;const n=A3.turnVal("lineN");if(n>=R.lineMaxTurn)return;A3.turnVal("lineN",n+1);
     let d=R.line+(A3.treeTopIs("l_ryusei")?3:0)+(has("l_boxer")&&i<3?3:0);d=Math.round(d*k);addLog(`流れ星（${l.join("・")}）：${d}ダメージ`);A3.se("luna_line",{full:L.moon()===3},250);ev({k:"onset"});L.hit(d)});
   TRIS.forEach((t,i)=>{if(!t.includes(c)||B.skyTris[i]||!t.every(on))return;B.skyTris[i]=1;const b=Math.round((R.tri+(A3.treeTopIs("l_ryusei")?4:0))*k);B.block+=b;addLog(`三角（${t.join("・")}）：防御 +${b}`);A3.se("luna_tri",{full:L.moon()===3},250);ev({k:"pblk",v:b})});
   if(s.every(Boolean)){let d=Math.round(R.full*k*(A3.treeTopIs("l_shin")?1.5:1));addLog(`星座の完成：${d}ダメージ`);A3.se("luna_full",{full:L.moon()===3},250);A3.fx&&A3.fx("luna_complete_sheet",64,64,8,198,216,1,700);ev({k:"onset"});L.hit(d);B.sky=Array(9).fill(0);B.skyLines={};B.skyTris={}}}};
{const te=turnEnd;turnEnd=function(){try{if(B&&G&&!B.over&&A3.isChar("LUNA")&&L.moon()===0){const n=L.rule().moon.newStar||0;for(let i=0;i<n;i++)L.star("any")}}catch(e){}return te.apply(this,arguments)}}
{const nr=newRunState;newRunState=function(){const r=nr.apply(this,arguments);try{if(G&&G.char==="LUNA")G.moon=null}catch(e){}return r}}
})();
