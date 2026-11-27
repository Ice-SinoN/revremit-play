"use strict";
/* ★③ RIN（弓と駒・design 19章・★虎雪 11-24 15:13 で作り直し）。NIGHT 6 の初クリアで加わる。数は仮 */
(function(){const A3=globalThis.ALLY3;if(!A3||CHARS.RIN)return;

A3.register({id:"RIN",night:6,treeBase:"r_kinya",
 char:{carName:"IS350 F SPORT",weapon:"クイーンズボウ",type:"弓と駒",join:6,
  car:{type:"mt",gears:8,mult:[1.0,1.12,1.24,1.36,1.48,1.6,1.72,1.84],red:6500,limit:7500,band:[4000,5000],core:[4300,4700],
   idle:1000,brake:3000,hp:75,spd:11,minShift:3000,upDrop:0.6,earlyDrop:0.45,downDiv:0.6,bands:{L:[1000,2500],M:[2500,4500],R:[6500,7500]}},
  deck:[["r_kinya",4],["r_nuidome",2],["r_renya",2],["r_castling",2],["r_techou",2],["r_reroute",2],["r_queens",1],["braking",2],["qshift",2],["slip",1]],
  skill:"r_queens",rule:{range:{start:3,max:3},bowPct:[-25,0,25,50],piece:{th:[2,3,4,5],turns:[3,3,3,2]}},ruleTxt:"弓と駒：間合いは 3（遠）から始まり、敵の番のたびに −1。弓のアタックは 遠 +50%・中 +25%・近づかれると ×0.75。番の終わりに、そのターンに打った枚数で駒が昇格（2 ルーク・3 ビショップ・4 ナイト・5 クイーン）"},
 cards:{
  r_kinya:{r:"C",mo:"atk_light",own:"RIN",n:"金矢",t:"atk",bow:1,c:1500,gas:1,v:6,vu:9,band:"M",fx:[["atk","v"]],d:"弓・{v}ダメージ"},
  r_nuidome:{r:"C",mo:"atk_light",own:"RIN",n:"縫い止め",t:"atk",bow:1,c:1000,gas:1,v:3,vu:5,band:"L",fx:[["atk","v"],["range",1]],d:"弓・{v}ダメージ・間合い +1"},
  r_renya:{r:"C",mo:"atk_light",own:"RIN",n:"連矢",t:"atk",bow:1,c:1000,gas:1,v:3,vu:5,fx:[["atkHits","v",2,2]],d:"弓・{v}ダメージを2回"},
  r_castling:{r:"C",mo:"guard",own:"RIN",n:"キャスリング",t:"grd",c:1000,gas:1,v:5,vu:8,band:"L",fx:[["castling","v"]],d:"防御 {v}。場がルークなら、駒の残る番を満タンに＋防御 +3"},
  r_techou:{r:"C",mo:"draw",own:"RIN",n:"手帳",t:"drw",c:1000,gas:0,v:1,vu:2,band:"M",fx:[["draw","v"]],d:"{v}枚引く"},
  r_queens:{r:"SK",mo:"skill",own:"RIN",n:"クイーンズ・オーダー",t:"sk",c:0,gas:2,v:0,vu:0,sup:1,fx:[["queensOrder"]],d:"このターンの弓のアタックを、場の駒で倍に：ルーク ×1.2／ビショップ ×1.5／ナイト ×1.8／クイーン ×2.5。クイーンなら残る番を満タンに"},
  r_check:{r:"R",mo:"atk_heavy",own:"RIN",n:"チェック",t:"atk",bow:1,c:2000,gas:1,v:6,vu:9,fx:[["atkPiece","v",["knight","queen"],2]],d:"弓・{v}ダメージ。場がナイトかクイーンなら ×2"},
  r_checkmate:{r:"E",mo:"atk_finisher",own:"RIN",n:"チェックメイト・アロー",t:"atk",bow:1,c:3000,gas:2,v:10,vu:14,fx:[["checkmate","v"]],d:"弓・{v} × 駒の段（ルーク1〜クイーン4）ダメージ。間合い 2 以上なら防御をこえる"},
  r_kuroneko:{r:"R",mo:"atk_light",own:"RIN",n:"黒猫",t:"atk",bow:1,c:1500,gas:1,v:5,vu:7,fx:[["kuroneko","v"]],d:"弓・{v}ダメージ。間合い 3 なら2回"},
  r_kanzashi:{r:"R",mo:"guard",own:"RIN",n:"金簪",t:"grd",c:1500,gas:1,v:7,vu:10,fx:[["blk","v"],["dmgCut",3]],d:"防御 {v}・次に受けるダメージ −3。"/* text v0.22.35 */},
  r_reroute:{r:"C",mo:"rev",own:"RIN",n:"リルート",t:"rev",c:0,gas:0,v:1000,vu:1500,sup:1,fx:[["revDown","v"],["range",1]],d:"回転 −{v}・間合い +1"},
  r_itomaki:{r:"C",mo:"guard",own:"RIN",n:"糸巻き",t:"grd",c:1000,gas:1,v:4,vu:6,fx:[["blk","v"],["nextBow",3]],d:"防御 {v}。次の弓のアタック +3"},
  r_yomisuji:{r:"R",mo:"draw",own:"RIN",n:"読み筋",t:"drw",c:0,gas:1,v:1,vu:2,sup:1,fx:[["yomisuji","v"]],d:"敵の次の2手が見える。{v}枚引く"},
  r_sutegoma:{r:"R",mo:"rev",own:"RIN",n:"捨て駒",t:"rev",c:0,gas:0,v:1,vu:1,sup:1,fx:[["sutegoma"]],d:"手札のいちばん右を捨てる。捨てたカードも、このターンに打った枚数に数える（1ターン1回）"},
  r_fukuhei:{r:"R",mo:"atk_heavy",own:"RIN",n:"伏兵",t:"atk",bow:1,c:2000,gas:1,v:8,vu:12,fx:[["fukuhei","v"]],d:"弓・{v}ダメージ。場がビショップかクイーンなら、敵の防御を全部こえる"},
  r_houi:{r:"E",mo:"atk_finisher",own:"RIN",n:"包囲",t:"atk",bow:1,c:2500,gas:2,v:4,vu:6,fx:[["houi","v"]],d:"弓・この戦闘で昇格した回数 × {v} ダメージ"},
  r_idling:{r:"C",mo:"rev",own:"RIN",n:"アイドリング",t:"rev",c:0,gas:0,v:1500,vu:2000,sup:1,fx:[["revDown","v"],["blkFlat",3]],d:"回転 −{v}・防御 3"}},
 parts:{r_queen:{own:"RIN",n:"クイーンの駒",d:"戦闘のはじめにルークを置く"},
  r_radar:{own:"RIN",n:"前方レーダー",d:"間合いが 1 減るのを、1戦に1回止める"},
  r_hairpin:{own:"RIN",n:"金のヘアピン",d:"戦闘の最初のターン、手札 +1"}},
 unlock:{start:["r_kinya","r_nuidome","r_renya","r_castling","r_techou","r_queens","r_reroute","r_idling","r_itomaki"],
  a1:["r_check","r_kanzashi"],a2:["r_kuroneko","r_fukuhei"],clear:["r_checkmate","r_houi"],sRank:["r_yomisuji"],hidden:["r_sutegoma"],
  parts:{start:["r_hairpin"],a1:["r_radar"],clear:["r_queen"]}},
 boss:{key:"ketsuban",enemy:{art:"ketsuban",n:"欠番",rank:"boss",ally:"RIN",hp:250,spd:10,bgm:"boss_ketsuban",halfFrz:1,
  pat:[["blk",16],["atk",15],["jam","crosstalk",2],["multi",4,4]],phase:{at:0.5,spd:11,art:"ketsuban_p2",pat:[["atk",19],["jam","crosstalk",2],["multi",5,4]]},wpn:"番号札の束と針"}},
 tree:[
  {id:"r_nui",n:"弓",d:"遠くから削る型",entry:["r_kuroneko","r_reroute"],cards:["r_nuidome","r_reroute","r_kuroneko","r_kinya","r_renya"],parts:["emblem","studless","dashcam","r_radar"],top:"弓の上乗せ 1.5倍（遠 +75%・中 +38%）",tip:"間合いの上乗せ（遠 +50%・中 +25%）が 1.5倍。近づかれたときの ×0.75 は同じ。"},
  {id:"r_qmove",n:"駒",d:"駒を育てて残す型",entry:["r_castling","r_sutegoma"],cards:["r_castling","r_sutegoma","r_check","r_fukuhei","r_houi"],parts:["turbo","nitro","limiter","r_queen"],top:"駒の残る番 +1",tip:"どの駒も残る番が1つ多い。"},
  {id:"r_fuku",n:"決め",d:"詰ませる型",entry:["r_check","r_itomaki"],cards:["r_checkmate","r_queens","r_check","r_itomaki","r_idling"],parts:["grip","cage","jack","r_hairpin"],top:"チェックメイト・アローとクイーンズ・オーダー ×1.25",tip:"チェックメイト・アローのダメージと、クイーンズ・オーダーの倍率が 1.25倍。"}],
 style:["弓で遠くから削り、チェスの駒を昇格させる「弓と駒」型。間合いは 3 から始まり、敵の番のたびに近づかれる。番の終わりに、打った枚数で駒が上がる。","ねらい：近づかれる前に、駒をクイーンまで上げて、クイーンズ・オーダーとチェックメイト・アローで詰ませる。"],
 ops:{
  range:(x,n)=>A3.rin.range(n),
  castling:(x,v)=>{const R=A3.rin;let b=v;if(B.piece==="rook"){B.pieceT=R.turns("rook");b+=3;addLog("キャスリング：ルークの残る番が満タンに")}else if(!B.piece&&A3.rinFix){B.piece="rook";B.pieceT=R.turns("rook");B.wallUsed=0;addLog("キャスリング：ルークを置いた");A3.se("rin_promote",{lv:1})}x.block(b)},
  queensOrder:x=>{const k={rook:1.2,bishop:1.5,knight:1.8,queen:2.5}[B.piece]||1;const m=A3.treeTopIs("r_fuku")?1+(k-1)*1.25:k;A3.turnVal("qOrder",m);A3.se("rin_order",{lv:["rook","bishop","knight","queen"].indexOf(B.piece)+1});if(B.piece==="queen")B.pieceT=A3.rin.turns("queen");addLog(`クイーンズ・オーダー：このターンの弓 ×${Math.round(m*100)/100}`)},
  atkPiece:(x,v,ps,k)=>x.attack(ps.includes(B.piece)?v*k:v),
  checkmate:(x,v)=>{const t={rook:1,bishop:2,knight:3,queen:4}[B.piece]||0;if(!t){addLog("チェックメイト・アロー：駒がない");return}let d=v*t;if(A3.treeTopIs("r_fuku"))d=Math.round(d*1.25);if(B.range>=2)B.curPierce=99;x.attack(d);B.curPierce=0},
  kuroneko:(x,v)=>{x.attack(v);if(B.range>=(A3.rinFix?2:3))x.attack(v)},
  dmgCut:(x,n)=>{B.rinCut=(B.rinCut||0)+n;addLog(`次に受けるダメージ −${B.rinCut}`)},
  nextBow:(x,n)=>{B.nextBow=(B.nextBow||0)+n;addLog(`次の弓のアタック +${B.nextBow}`)},
  yomisuji:(x,n)=>{const e=B.e,p=curPat(e),a=[0,1].map(i=>p[(e.pi+i)%p.length]).map(q=>({atk:"攻撃",multi:"連撃",prc:"貫通",blk:"防御",rev:"回転",jam:"ジャマ",apd:"強化"}[q[0]]||q[0])+(typeof q[1]==="number"?" "+q[1]:""));addLog(`読み筋：敵の次の2手は「${a.join("」→「")}」`);drawN(n)},
  sutegoma:x=>{if(A3.turnVal("sutegoma")){addLog("捨て駒：このターンはもう使った");return}const c=B.hand.pop();if(!c){addLog("捨て駒：捨てるカードがない");return}B.disc.push(c);A3.turnVal("sutegoma",1);A3.turnVal("extraN",A3.turnVal("extraN")+1);addLog(`捨て駒：「${CD(c).n}」を捨てた（打った枚数 +1）`);
   /* ★v0.47 design 19-6：捨てたのがアタックなら数の半分の弓ダメージ・ガードなら防御を半分 */if(A3.rinFix){const d=CD(c),h=Math.floor(cardVal(c)/2);if(d.t==="atk"&&h>0){B.curBow=true;x.attack(h);B.curBow=false}else if(d.t==="grd"&&h>0)x.block(h)}},
  fukuhei:(x,v)=>{if(["bishop","queen"].includes(B.piece))B.curPierce=99;else if(A3.rinFix)B.curPierce=3;x.attack(v);B.curPierce=0},
  houi:(x,v)=>x.attack((A3.rinFix?6:0)+v*(B.promoN||0))},
 before:x=>{B.curBow=!!(A3.isChar("RIN")&&x.d.bow);B.curPierce=0;if(B.curBow)A3.se("rin_bow",{range:B.range})},
 attack:(v,m)=>{if(!B.curBow)return v;const R=A3.rin;
   if(B.nextBow){v+=B.nextBow;B.nextBow=0}
   v*=R.bowMul();if(B.piece==="queen")v+=2;const q=A3.turnVal("qOrder");if(q)v*=q;
   if(["bishop","queen"].includes(B.piece)&&!B.curPierce)B.curPierce=3;return v},
 after:x=>{B.curBow=false;B.curPierce=0},
 turn:first=>{if(!A3.isChar("RIN"))return;A3.rin.init();if(first&&has("r_hairpin")&&drawN(1))addLog("金のヘアピン：1枚多く引いた");
   if(["knight","queen"].includes(B.piece)){const a=curAct(B.e)||[];if(["atk","multi","prc"].includes(a[0])&&B.e.hp>0){addLog("ナイト：跳び矢 5ダメージ");A3.se("rin_leap");hitEnemy(5);ev({k:"onset"})}}},
});
/* ★v0.31 弓と駒（design 19章・案A＋案1）。13-4-1 の妨害（凍結・ノイズ・その止め）は外した */
const PI=["rook","bishop","knight","queen"],PN={rook:"ルーク",bishop:"ビショップ",knight:"ナイト",queen:"クイーン"};
const R=A3.rin={
 rule:()=>RULE().range?RULE():{range:{start:3,max:3},bowPct:[-25,0,25,50],piece:{th:[2,3,4,5],turns:[3,3,3,2]}},
 turns:p=>R.rule().piece.turns[PI.indexOf(p)]+(A3.treeTopIs("r_qmove")?1:0),
 bowMul:()=>{const st=(G&&G.mode==="AT"&&R.rule().bowStepAT)||0;/* ★v0.51 design 19章：AT は間合いを st 段上に数える */const pct=R.rule().bowPct[Math.max(0,Math.min(3,B.range+st))];return 1+(pct>0&&A3.treeTopIs("r_nui")?pct*1.5:pct)/100},
 init(){if(B.rinInit)return;B.rinInit=1;B.range=R.rule().range.start;B.piece=null;B.pieceT=0;B.promoN=0;B.wallUsed=0;B.radarUsed=0;
   if(has("r_queen")){B.piece="rook";B.pieceT=R.turns("rook");addLog("クイーンの駒：ルークを置いた")}
   if(B.range>=3&&B.e&&B.e.hp>0){addLog("先制の矢：4ダメージ");A3.se("rin_first");hitEnemy(4)}},
 range(n){const mx=R.rule().range.max,o=B.range;B.range=Math.max(0,Math.min(mx,B.range+n));if(B.range!==o)addLog(`間合い ${B.range}（${["近","近め","中","遠","遠"][B.range]}）`)},
 tierFor:n=>{const th=R.rule().piece.th;let t=-1;th.forEach((v,i)=>{if(n>=v-(A3.turnVal("thDown")?1:0))t=i});return t}};
{const es=enemyStep;enemyStep=function(){if(B&&G&&A3.isChar("RIN"))R.init();const r=es.apply(this,arguments);
  try{if(!r&&B&&!B.over&&A3.isChar("RIN")&&B.range>0){if(B.piece&&["rook","queen"].includes(B.piece)&&!B.wallUsed){B.wallUsed=1;addLog(`${PN[B.piece]}：城壁で間合いを保った`)}
    else if(has("r_radar")&&!B.radarUsed){B.radarUsed=1;addLog("前方レーダー：間合いを保った")}else R.range(-1)}}catch(e){}return r}}
{const te=turnEnd;turnEnd=function(){try{if(B&&G&&!B.over&&A3.isChar("RIN")){R.init();
  if(["rook","queen"].includes(B.piece)){B.block+=4;addLog(`${PN[B.piece]}：防御 +4`);ev({k:"pblk",v:4})}
  const n=B.cards+A3.turnVal("extraN"),t=R.tierFor(n),cur=PI.indexOf(B.piece);
  if(t>cur){B.piece=PI[t];B.pieceT=R.turns(B.piece);B.wallUsed=0;if(cur>=0||t>=0)B.promoN++;addLog(`昇格：${PN[B.piece]}（${n}枚）`);A3.se("rin_promote",{lv:t+1});A3.fx&&A3.fx("rin_promote_sheet",40,40,8,178,232,1,500);ev({k:"onset"})}
  else if(t===cur&&t>=0){B.pieceT=R.turns(B.piece)}
  else if(B.piece){B.pieceT--;if(B.pieceT<=0){const d=cur-1;B.piece=d>=0?PI[d]:null;B.pieceT=B.piece?R.turns(B.piece):0;B.wallUsed=0;addLog(B.piece?`駒が下がった：${PN[B.piece]}`:"駒がいなくなった");A3.se("rin_demote")}}}}catch(e){}const r=te.apply(this,arguments);/* ★v0.34 ナイトの跳び矢でとどめ（design 19 の答え）：番のはじめに倒したらそのまま勝ち */if(r==="turn"&&B&&!B.over&&B.e&&B.e.hp<=0&&A3.isChar("RIN"))return finish("win");return r}}
{const eh=enemyHit;enemyHit=function(v,pierce){if(B&&B.rinCut&&A3.isChar("RIN")){const c=Math.min(B.rinCut,v);v-=c;B.rinCut=0;addLog(`金簪：ダメージ −${c}`)}return eh.call(this,v,pierce)}}
{const he=hitEnemy;hitEnemy=function(d){const e=B&&B.e;if(e&&B.curPierce>0&&e.block>0){const k=Math.min(e.block,B.curPierce);e.block-=k;try{return he.call(this,d)}finally{e.block+=k}}return he.call(this,d)}}
})();
