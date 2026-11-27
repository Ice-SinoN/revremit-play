"use strict";
/* ★③ MIO（特殊・CVT＝段のない変速）。NIGHT 8 の初クリアで加わる。数値は【仮・③】
   CVT の作り（③の簡単にした形）：ギアは1段だけ（シフトはない）。かわりに
   ・回転が帯（3500〜6500）の中で打つと、そのカードの数値 ×1.2、真ん中（4500〜5500）なら ×1.4
   ・番のはじめに回転が 4000 にもどる（変速比を自動で合わせる）。2ターン目からはガソリン +1・1枚多く引く（シフトでガソリンがもどらない分）
   ・いちばん上のギアなので、NIGHT 3 からはリミットをこえるとブロー（予告に出る） */
(function(){const A3=globalThis.ALLY3;if(!A3||CHARS.MIO)return;
const cvtMul=()=>{const r=RULE().cvt;if(!r||B.cvtRpm==null)return 1;const x=B.cvtRpm,w=(RULE().cvtWide||0)+(has("mi_logger")?250:0);
  return x>=r.clo-w&&x<=r.chi+w?r.cm:x>=r.lo&&x<=r.hi?r.bm:1};
A3.register({id:"MIO",night:8,treeBase:"mi_obiuchi",
 char:{carName:"N-ONE",weapon:"ベルトウィップ",type:"CVT",join:8,
  car:{type:"mt",gears:1,mult:[2.0],red:7000,limit:8000,band:[4500,5500],core:[4800,5200],
   idle:1000,brake:3000,hp:85,spd:11,minShift:99999,upDrop:0.6,earlyDrop:0.45,downDiv:0.6,bands:{L:[1000,3500],M:[3500,6500],R:[7000,8000]}},
  deck:[["mi_obiuchi",4],["mi_namiuchi",2],["mi_rokkaku",2],["mi_kaiseki",2],["mi_stepless",2],["mi_sango",2],["mi_emerald",1],["braking",2],["slip",2],["blip",1]],
  skill:"mi_emerald",rule:{cvt:{lo:3500,hi:6500,clo:4500,chi:5500,bm:1.2,cm:1.4}},ruleTxt:"CVT：シフトはなく、ブローもしない。強い回転を保つほど、帯の倍率が続く・番のはじめは回転 4000。回転 3500〜6500 で打つと ×1.2、4500〜5500 なら ×1.4。2ターン目からガソリン +1・1枚多く引く"},
 cards:{
  mi_obiuchi:{r:"C",mo:"atk_light",own:"MIO",n:"帯打ち",t:"atk",c:1000,gas:1,v:7,vu:10,fx:[["atk","v"]],d:"{v}ダメージ"},
  mi_namiuchi:{r:"C",mo:"atk_light",own:"MIO",n:"波打ち",t:"atk",c:1000,gas:1,v:4,vu:6,fx:[["atkHits","v",2,2]],d:"{v}ダメージを2回"},
  mi_rokkaku:{r:"C",mo:"guard",own:"MIO",n:"六角",t:"grd",c:500,gas:1,v:6,vu:9,fx:[["blk","v"]],d:"防御 {v}"},
  mi_kaiseki:{r:"C",mo:"draw",own:"MIO",n:"解析",t:"drw",c:500,gas:0,v:1,vu:2,fx:[["draw","v"]],d:"{v}枚引く"},
  mi_stepless:{r:"C",mo:"rev",own:"MIO",n:"ステップレス",t:"rev",c:0,gas:0,v:5000,vu:5000,sup:1,fx:[["rpmTo","v"]],d:"回転を {v} にする（帯の真ん中）"},
  mi_emerald:{r:"SK",mo:"skill",own:"MIO",n:"エメラルド・アナライズ",t:"sk",c:0,gas:2,v:10,vu:15,sup:1,fx:[["blk","v"],["purgeJam"],["draw",1]],d:"防御 {v}。手札のジャマを全部消して、1枚引く"},
  mi_enzan:{r:"E",mo:"atk_finisher",own:"MIO",n:"演算全開",t:"atk",c:1000,gas:2,v:10,vu:15,fx:[["atkHits","v",2,2]],d:"{v}ダメージを2回（帯の真ん中で打つと ×1.4 がかかる）"},
  mi_saitekikai:{r:"R",mo:"atk_heavy",own:"MIO",n:"最適解",t:"atk",c:1500,gas:1,v:8,vu:12,fx:[["atkCenter","v"]],d:"{v}ダメージ。帯の真ん中で打つと、さらに ×1.5"},
  mi_shiokaze:{r:"R",mo:"guard",own:"MIO",n:"潮風",t:"grd",c:1500,gas:1,v:6,vu:9,fx:[["blk","v"],["heal",3]],d:"防御 {v}・エンジン耐久 +3"},
  mi_kaigansen:{r:"R",mo:"atk_light",own:"MIO",n:"海岸線",t:"atk",c:1000,gas:1,v:4,vu:6,fx:[["atkPlayed","v",2,10]],d:"{v}＋このターン先に打ったカードの数 ×2（最大 +10）ダメージ"},
  mi_debug:{r:"R",mo:"rev",own:"MIO",n:"デバッグ",t:"rev",c:0,gas:0,v:1,vu:2,sup:1,fx:[["purgeJam"],["draw","v"]],d:"手札のジャマを全部消して、{v}枚引く"},
  mi_rironjou:{r:"R",mo:"draw",own:"MIO",n:"理論上",t:"drw",c:500,gas:0,v:1,vu:2,fx:[["draw","v"],["drawIfBand",1]],d:"{v}枚引く。回転が帯の中なら、もう1枚"},
  mi_highbeam:{r:"C",mo:"draw",own:"MIO",n:"ハイビーム",t:"drw",c:0,gas:1,v:1,vu:2,sup:1,fx:[["draw","v"],["blkFlat",2]],d:"{v}枚引く・防御 2"},
  mi_sango:{r:"C",mo:"guard",own:"MIO",n:"珊瑚",t:"grd",c:500,gas:0,v:3,vu:5,fx:[["blk","v"]],d:"防御 {v}（ガソリン 0）"},
  mi_shinshuku:{r:"R",mo:"atk_heavy",own:"MIO",n:"伸縮",t:"atk",c:1000,gas:1,v:4,vu:6,fx:[["atkRpm","v",1000,12]],d:"{v}＋打つ前の回転 ÷1000（最大 +12）ダメージ"},
  mi_souteigai:{r:"R",mo:"guard",own:"MIO",n:"想定外",t:"grd",c:1000,gas:1,v:6,vu:9,fx:[["blkLowHp","v"]],d:"防御 {v}。エンジン耐久が半分以下なら2倍"},
  mi_tsuushin:{r:"R",mo:"draw",own:"MIO",n:"通信",t:"drw",c:0,gas:1,v:1,vu:2,sup:1,fx:[["fromDisc","v"]],d:"捨て札から {v} 枚を手札に（新しいほうから）"}},
 parts:{mi_logger:{own:"MIO",n:"自作ロガー",d:"CVT の「真ん中」の幅が上下 250 ずつ広がる"},
  mi_belt:{own:"MIO",n:"強化ベルト",d:"回転を動かす補助を打つと防御 +3"},
  mi_roundlight:{own:"MIO",n:"丸目のライト",d:"戦闘の最初のターン、ガソリン +1"}},
 unlock:{start:["mi_obiuchi","mi_namiuchi","mi_rokkaku","mi_kaiseki","mi_stepless","mi_emerald","mi_sango","mi_highbeam","mi_saitekikai"],
  a1:["mi_shiokaze","mi_rironjou"],a2:["mi_kaigansen","mi_shinshuku"],clear:["mi_enzan","mi_souteigai"],sRank:["mi_debug"],hidden:["mi_tsuushin"],
  parts:{start:["mi_roundlight"],a1:["mi_belt"],clear:["mi_logger"]}},
 boss:{key:"shiosai",enemy:{art:"shiosai",n:"潮騒",rank:"boss",ally:"MIO",hp:250,spd:10,bgm:"boss_shiosai",
  pat:[["atk",14],["blk",14],["multi",6,3],["rev",1500]],phase:{at:0.5,spd:11,art:"shiosai_p2",pat:[["multi",7,3],["rev",2000],["atk",20]]},wpn:"波の形の大鎌"}},
 tree:[
  {id:"mi_opt",n:"最適解",d:"真ん中を狙う型",entry:["mi_saitekikai","mi_rironjou"],cards:["mi_saitekikai","mi_enzan","mi_stepless","mi_rironjou","mi_obiuchi"],parts:["closs","turbo","nitro","mi_logger"],top:"CVT の真ん中が ×1.4 → ×1.6",tip:"回転 4500〜5500 で打つと ×1.6。"},
  {id:"mi_ana",n:"解析",d:"見て消す型",entry:["mi_debug","mi_highbeam"],cards:["mi_debug","mi_highbeam","mi_kaiseki","mi_emerald","mi_tsuushin"],parts:["pacenote","hook","dashcam","mi_roundlight"],top:"ジャマを消すたび、防御 +4",tip:"デバッグ・エメラルド・アナライズでジャマを1枚消すたび、防御 +4。"},
  {id:"mi_coast",n:"海岸線",d:"長くつなぐ型",entry:["mi_kaigansen","mi_shiokaze"],cards:["mi_kaigansen","mi_namiuchi","mi_shiokaze","mi_sango","mi_shinshuku"],parts:["grip","carbon","jack","mi_belt"],top:"CVT の帯が 3000〜7000 に広がる",tip:"×1.2 になる帯が 3000〜7000 に広がる。"}],
 style:["ギアの段がない特殊な型（CVT）。シフトのかわりに、帯の中の回転で打つと強い（真ん中なら ×1.4）。","ねらい：ステップレスで回転を 5000 に合わせて、最適解・演算全開で決める。"],
 ops:{
  rpmTo:(x,v)=>{B.rpm=Math.min(limit(),v);addLog(`回転を ${B.rpm} に`);ev({k:"revdown",v:0})},
  purgeJam:()=>{let k=0;for(let i=B.hand.length-1;i>=0;i--)if(CD(B.hand[i]).t==="jam"){B.hand.splice(i,1);k++}if(k){addLog(`ジャマを ${k} 枚消した`);if(A3.treeTopIs("mi_ana")){B.block+=4*k;ev({k:"pblk",v:4*k})}}},
  atkCenter:(x,v)=>{const r=RULE().cvt,y=B.cvtRpm;x.attack(r&&y>=r.clo&&y<=r.chi?v*1.5:v)},
  drawIfBand:(x,n)=>{const r=RULE().cvt;if(r&&B.cvtRpm>=r.lo&&B.cvtRpm<=r.hi)x.draw(n)},
  atkRpm:(x,v,k,max)=>x.attack(v+Math.min(max,Math.floor((B.cvtRpm||0)/k))),
  blkLowHp:(x,v)=>x.block(G.hp<=G.maxhp/2?v*2:v),
  fromDisc:(x,n)=>{let k=0;for(let i=B.disc.length-1;i>=0&&k<n;i--){if(B.hand.length>=RULES.handMax)break;const c=B.disc[i];if(c.uid===B.playUid)continue;B.hand.push(B.disc.splice(i,1)[0]);k++}addLog(k?`捨て札から${k}枚手札に`:"捨て札にカードがない");if(k)ev({k:"draw",n:k})}},
 rule:r=>{if(!r.cvt)return r;let c=r.cvt;if(A3.treeTopIs("mi_opt"))c=Object.assign({},c,{cm:A3.mioTopCm||1.6});/* ★v2.2 4段目の芯の倍率は ld で変える */if(A3.treeTopIs("mi_coast"))c=Object.assign({},c,{lo:3000,hi:7000});return c===r.cvt?r:Object.assign({},r,{cvt:c})},
 before:x=>{B.cvtRpm=Math.min(limit(),B.rpm+(x.cost||0))},/* ★v0.8 ふぐあい：倍率は「打ったあとの回転」で（画面の光と同じ）。前は打つ前の回転だった */
 attack:(v,m)=>A3.isChar("MIO")?v*cvtMul():v,
 after:x=>{if(has("mi_belt")&&x.d.sup&&x.d.fx.some(f=>["rpmTo","revDown","revUp","revUpCap"].includes(f[0]))){B.block+=3;addLog("強化ベルト：防御 +3");ev({k:"pblk",v:3})}},
 turn:first=>{if(A3.isChar("MIO")){B.rpm=4000;if(!first){B.gas+=1;if(drawN(1))addLog("CVT：回転 4000・ガソリン +1・1枚引いた");const lw=RULE().lowDraw;if(lw!=null&&B.hand.length<=lw&&drawN(1))addLog(`手札が${lw}枚以下：もう1枚引いた`)}}/* ★v0.27 design 13-5：lowDraw */if(first&&has("mi_roundlight")){B.gas+=1;addLog("丸目のライト：ガソリン +1")}},
});
/* CVT：ガードの防御にも帯の倍率（mkCtx の block を包む） */
{const mk=mkCtx;mkCtx=function(m){const x=mk(m),b0=x.block;x.block=function(v){if(B&&A3.isChar("MIO"))v*=cvtMul();return b0.call(this,v)};return x}}
/* MIO 編は通信がこゆき（text 23-0・23-9-1）：MIO で走るとき、その子の場面の YUKI の行に通信の印 */
/* ★v0.18 design v0.11.66：MIO（CVT＝AT 扱い）は AT の最終倍率 ×0.9 をかけない（A3.mioAtMul1 が立っているとき＝ally3_ld の v0.18）。RULES.atMult を読む所はどれも同じ値になる */
{let am=RULES.atMult;Object.defineProperty(RULES,"atMult",{configurable:true,enumerable:true,get(){return A3.mioAtMul1&&typeof G!=="undefined"&&G&&G.char==="MIO"?1:am},set(v){am=v}})}
/* ★v0.8 ふぐあい：CVT はオートマ。MT だと1速のままシフトダウンもパーキングもできず、ガソリンを引く力に変えられなかった（ガソリンが余って手札が2枚で止まる）。MIO のランはいつも AT（パーキングレンジ：ガソリン2で1枚引く が使える） */
{const nr=newRunState;newRunState=function(mode,ch,...a){return nr.call(this,ch==="MIO"?"AT":mode,ch,...a)}}
if(typeof mioComm==="function"){const mc=mioComm;mioComm=function(s,i){if(!(G&&G.char==="MIO"&&/_mio$|^link_mio/.test(s.key||"")))return mc(s,i);
  const l=s.sc.lines[i];if(!l||l[0]!=="YUKI")return false;const L=s.sc.lines,at=re=>L.findIndex(x=>re.test(x[1]||""));
  if(/^ed1/.test(s.key)&&!/after/.test(s.key)){const g=at(/^\.50 CAL のガレージ/);return g<0||i<g}
  if(/_op$/.test(s.key)){const r=at(/^ROAD。/);return r>=0&&i>=r}
  return!/^join_|ed1_after/.test(s.key)}}
})();
