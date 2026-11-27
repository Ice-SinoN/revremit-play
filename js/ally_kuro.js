"use strict";
/* ★③ KURO（トリックスター＝心拍で払ってグリッチを積む・design 16章 案1・転倒 A・★虎雪 11-24 15:14）。NIGHT 9 の初クリアで加わる（story 7-1・design 9-4）。数は仮
   ギア・シフト・回転の帯・ブローは通らない：車の形は「1速・倍率 1.0」、カードの回転は 0。走りかたは MT を中で使い、画面は「自転車」だけ。戦闘のオートのボタンは出さない（フルオート周回は走れる） */
(function(){const A3=globalThis.ALLY3;if(!A3||CHARS.KURO)return;
const K=A3.kuro={
 R:()=>RULE().heart||{start:60,cap:200,rest:40,fallHp:8,fallHp3:16,fallNext:120,glMax:10,turnDraw:3},
 glMax:()=>(B&&B.kRule&&B.kRule.gl15?15:K.R().glMax),
 gl(n){const o=B.gl||0;B.gl=Math.max(0,Math.min(K.glMax(),o+n));if(n<0&&o>0){K.used(o-B.gl);A3.se("kuro_glitch_use",{n:o-B.gl})}if(B.gl>o)A3.se("kuro_glitch_add",{n:B.gl});return B.gl-o},
 use(n){const k=Math.min(B.gl||0,n);B.gl=(B.gl||0)-k;if(k){K.used(k);A3.se("kuro_glitch_use",{n:k})}return k},
 /* ★v0.42 準備（design 16 KURO の火力の土台 案A・LD の本測りのあとで入れる＝ld の v0.42）：心拍の帯で倍率（払ったあとの心拍） */
 /* ★v0.44 design 16 案1「ひと息」：番の終わり、心拍が下がる前の値で次の敵の番の防御 */
 feintTo(e){const p=curPat(e),cur=e.pi%p.length,isA=a=>["atk","multi","prc"].includes(a[0]),dmg=a=>a[0]==="atk"?a[1]:a[0]==="multi"?a[1]*a[2]:a[1]*1.5;if(!isA(p[cur]))return -1;let bj=-1,bd=1e9;p.forEach((a,j)=>{if(j!==cur&&isA(a)&&dmg(a)<bd){bd=dmg(a);bj=j}});return bj},
 /* ★v0.74 design 16-16 グリッチの盾：番の終わりに残ったグリッチ per つにつき防御 +1（最大 max）。rule glitchBlk:{per,max} */
 /* ★v0.75 design 16-19 グリッチの刃：場のグリッチ per つにつきアタック +1（最大 max）。心拍の帯はこのあと。rule glitchAtk:{per,max} */
 glAtk(g){const r=RULE().glitchAtk;if(!r)return 0;return Math.min(r.max||5,Math.floor((g||0)/(r.per||2))*(r.add||1))},/* ★v0.80 add：per つで +add（design「3つで +2」） */
 glBlk(g){const r=RULE().glitchBlk;if(!r)return 0;return Math.min(r.max||10,Math.floor((g||0)/(r.per||1)))},
 restBlk(hr){const t=RULE().restBlk;if(!t)return 0;let b=0;t.forEach(([hi,v])=>{if(b===0&&hr<=hi)b=v});return b},
 hrMul(hr){const t=(RULE().hrMul)||null;if(!t)return 1;let m=1;t.forEach(([lo,k])=>{if(hr>=lo)m=k});return Math.min(5,m)},/* 最終 ×5 まで */
 heart(v){if(B&&B.sim)return;try{if(typeof AUDIO!=="undefined"&&AUDIO.kuroHeart)AUDIO.kuroHeart(v)}catch(e){}},
 used(k){if(B.kSystem&&A3.turnVal("sysN")<2){A3.turnVal("sysN",A3.turnVal("sysN")+1);if(drawN(1))addLog("KURO SYSTEM：1枚引いた")}},
 hrOf(c){const d=CD(c);let h=d.hr||0;if(c.up&&d.hru!=null)h=d.hru;if(h>0&&has("ku_crank"))h=Math.max(0,h-5);if(h>0&&B.kRule&&B.kRule.half)h=Math.ceil(h/2);if(B.flipNext&&B.flipNextT===B.pTurns)h=-Math.abs(h);return h},
 fall(){const R=K.R();if(B.kRule&&B.kRule.noFall){B.kRule.noFall=0;B.hr=R.cap;addLog("グリッチ・トリック：転倒を1回なしに");return false}
   B.gl=0;const d=G.night>=3?R.fallHp3:R.fallHp;G.hp=Math.max(1,G.hp-d);B.fallNext=1;addLog(`転倒！ グリッチ 0・体力 −${d}`);ev({k:"onset"});K.heart(null);A3.se("kuro_fall");A3.fx&&A3.fx("kuro_tentou_sheet",160,90,8,240,110,1,800);
   if(!B.sim&&typeof toast2==="function"&&typeof document!=="undefined"){const L=(TEXT.ui&&TEXT.ui.kuro_fall)||"KURO：わわっ、転んだ〜……！　グリッチ、ぜんぶ落としちゃった。";try{toast2(L,56,2600)}catch(e){}}return true}};
A3.register({id:"KURO",night:9,treeBase:"ku_koumori",
 char:{carName:"ロードバイク（仮）",weapon:"コウモリの傘",type:"トリックスター",join:9,noAuto:1,
  car:{type:"bike",gears:1,mult:[1.0],red:7000,limit:8000,band:[0,0],core:[0,0],idle:1000,brake:3000,hp:75,spd:12,minShift:99999,upDrop:1,earlyDrop:1,downDiv:1,bands:{}},
  deck:[["ku_koumori",4],["ku_shoukei",3],["ku_freewheel",3],["ku_drafting",2],["ku_kusariwana",2],["ku_ikitsugi",1],["ku_glitch",1]],
  skill:"ku_glitch",rule:{heart:{start:60,cap:200,rest:40,fallHp:8,fallHp3:16,fallNext:120,glMax:10,turnDraw:3}},
  ruleTxt:"心拍とグリッチ：カードは回転のかわりに心拍で払う（60 から・番の終わりに −40）。200 をこえると転倒（その番は終わり・グリッチ 0・体力 −8、NIGHT 3 から −16・次の番は 120 から）。グリッチは 0〜10 を積んで、大技で使う・2ターン目から番のはじめに3枚引く"},
 cards:{
  ku_koumori:{r:"C",mo:"atk_light",own:"KURO",n:"蝙蝠",t:"atk",c:0,gas:1,hr:15,v:5,vu:8,fx:[["atk","v"],["kGl",1]],d:"{v}ダメージ・グリッチ +1"},
  ku_shoukei:{r:"C",mo:"atk_light",own:"KURO",n:"小径",t:"atk",c:0,gas:0,hr:10,v:4,vu:6,fx:[["atk","v"]],d:"{v}ダメージ"},
  ku_freewheel:{r:"C",mo:"guard",own:"KURO",n:"フリーホイール",t:"grd",c:0,gas:1,hr:-20,v:5,vu:8,fx:[["blk","v"]],d:"防御 {v}"},
  ku_drafting:{r:"C",mo:"draw",own:"KURO",n:"ドラフティング",t:"drw",c:0,gas:0,hr:10,v:1,vu:1,fx:[["kDraft"]],d:"山札の上2枚を見て、1枚を引き、1枚を下へ"},
  ku_kusariwana:{r:"C",mo:"rev",own:"KURO",n:"鎖罠",t:"rev",c:0,gas:0,hr:10,v:2,vu:3,sup:1,fx:[["kChain","v"]],d:"次に打つアタックに +（グリッチの数 ×{v}）（グリッチは減らない）"},
  ku_dancing:{r:"R",mo:"rev",own:"KURO",n:"ダンシング",t:"rev",c:0,gas:1,hr:50,v:4,vu:5,sup:1,fx:[["kGl","v"]],d:"グリッチ +{v}"},
  ku_ikitsugi:{r:"C",mo:"draw",own:"KURO",n:"息継ぎ",t:"rev",c:0,gas:0,hr:-40,v:2,vu:3,sup:1,fx:[["kGl",-2],["draw","v"]],d:"グリッチ −2・{v}枚引く"},
  ku_nukemichi:{r:"R",mo:"draw",own:"KURO",n:"抜け道",t:"drw",c:0,gas:1,hr:20,v:3,vu:4,fx:[["kExile",3],["kGl","v"]],d:"山札の上3枚を抹消（この戦闘から除外）・グリッチ +{v}"},
  ku_uragaeshi:{r:"R",mo:"rev",own:"KURO",n:"裏返し",t:"rev",c:0,gas:0,hr:0,v:1,vu:1,sup:1,fx:[["kFlip"]],d:"次に打つカード1枚は、心拍が上がるかわりに同じだけ下がる（1ターン1回）"},
  ku_doukefuda:{r:"R",mo:"draw",own:"KURO",n:"道化札",t:"drw",c:0,gas:1,hr:15,v:1,vu:2,fx:[["kSwap"],["kGl","v"]],d:"手札1枚と山札の上1枚をすりかえる・グリッチ +{v}"},
  ku_kakushifuda:{r:"C",mo:"rev",own:"KURO",n:"隠し札",t:"rev",c:0,gas:0,hr:5,v:1,vu:1,sup:1,fx:[["kCopy"]],d:"手札1枚を写して、写しを手札に（この戦闘だけ・写しを打つと消える）"},
  ku_karaburi:{r:"R",mo:"guard",own:"KURO",n:"空振り誘い",t:"grd",c:0,gas:1,hr:20,v:4,vu:6,fx:[["blk","v"],["kFeint"]],d:"防御 {v}。敵の次の行動の予告を、敵のもう1つの行動とすりかえる"},
  ku_kodou:{r:"R",mo:"atk_heavy",own:"KURO",n:"鼓動",t:"atk",c:0,gas:1,hr:20,v:10,vu:8,fx:[["kBeat","v"]],d:"心拍 ÷{v} のダメージ（150 で 15・190 で 19）"},
  ku_akaikusari:{r:"R",mo:"atk_heavy",own:"KURO",n:"赤い鎖",t:"atk",c:0,gas:1,hr:15,v:18,vu:24,glNeed:3,fx:[["kUseAtk",3,"v"]],d:"グリッチを3使う・{v}ダメージ"},
  ku_kurosystem:{r:"E",mo:"rev",own:"KURO",n:"KURO SYSTEM",t:"rev",c:0,gas:1,hr:25,v:1,vu:1,sup:1,fx:[["flagBattle","kSystem",1]],d:"この戦闘、グリッチを使うたびに1枚引く（1ターン2回）"},
  ku_bagurase:{r:"E",mo:"atk_finisher",own:"KURO",n:"バグらせちゃえ",t:"atk",c:0,gas:2,hr:30,v:6,vu:7,glNeed:1,fx:[["kBug","v"]],d:"グリッチを全部使う・グリッチ × {v} ダメージ（10 で 60）"},
  ku_glitch:{r:"SK",mo:"skill",own:"KURO",n:"グリッチ・トリック",t:"sk",c:0,gas:0,hr:0,v:40,vu:40,sup:1,glFull:1,fx:[["kTrick","v"]],d:"グリッチが上限のときだけ打てる・全部使う：{v}ダメージ＋この戦闘のルールを1つ書きかえ（①カードの心拍が半分 ②転倒を1回なしに ③グリッチの上限 15 ④引くときはいつも2枚から選ぶ）"}},
 parts:{ku_bat:{own:"KURO",n:"赤いコウモリ",d:"戦闘のはじめにグリッチ +2"},
  ku_crank:{own:"KURO",n:"軽量クランク",d:"カードの心拍 −5（上がるカードだけ）"},
  ku_display:{own:"KURO",n:"自作ディスプレイ",d:"山札の上1枚がいつも見える"}},
 unlock:{start:["ku_koumori","ku_shoukei","ku_freewheel","ku_drafting","ku_kusariwana","ku_glitch","ku_ikitsugi","ku_dancing","ku_kakushifuda"],
  a1:["ku_nukemichi","ku_uragaeshi"],a2:["ku_doukefuda","ku_kodou"],clear:["ku_bagurase","ku_kurosystem"],sRank:["ku_akaikusari"],hidden:["ku_karaburi"],
  parts:{start:["ku_bat"],a1:["ku_crank"],clear:["ku_display"]}},
 boss:{key:"uramen",enemy:{art:"uramen",n:"裏面",rank:"boss",ally:"KURO",hp:260,spd:11,bgm:"boss_uramen",bgmPhase2:1,
  pat:[["atk",16],["blk",14],["multi",4,4],["atk",20]],phase:{at:0.5,spd:12,art:"uramen_p2",pat:[["multi",5,4],["atk",22],["blk",16]]},wpn:"裏返った画面の欠片"}},
 tree:[
  {id:"ku_t1",n:"積む",d:"グリッチを一気にためる型",entry:["ku_dancing","ku_nukemichi"],cards:["ku_dancing","ku_nukemichi","ku_koumori","ku_doukefuda"],parts:["turbo","nitro","limiter","ku_bat"],top:"ダンシングのグリッチ +4 → +5",tip:"ダンシングで積むグリッチが 1 多い。"},
  {id:"ku_t2",n:"引く",d:"心拍を下げて回す型",entry:["ku_ikitsugi","ku_drafting"],cards:["ku_ikitsugi","ku_drafting","ku_freewheel","ku_uragaeshi","ku_kurosystem"],parts:["grip","cage","jack","ku_crank"],top:"息継ぎで3枚引く",tip:"息継ぎで引く枚数が 1 多い。"},
  {id:"ku_t3",n:"撃つ",d:"積んで大技で撃つ型",entry:["ku_akaikusari","ku_kodou"],cards:["ku_bagurase","ku_akaikusari","ku_kodou","ku_kusariwana"],parts:["pacenote","hook","dashcam","ku_display"],top:"バグらせちゃえ ×6 → ×7",tip:"バグらせちゃえのグリッチ1つあたりのダメージが 1 多い。"}],
 style:["ギアも回転もない自転車のトリックスター。カードは心拍で払い、グリッチを積んで大技で使う。200 をこえると転倒して、積んだグリッチが消える。","ねらい：ダンシング・抜け道で一気に積み、息継ぎ・フリーホイール・裏返しで心拍を下げ、グリッチ・トリックやバグらせちゃえでドーン。"],
 ops:{
  kGl:(x,n)=>{const v=B.kCur==="ku_dancing"&&A3.treeTopIs("ku_t1")&&!A3.kuTree2?n+1:n;const k=K.gl(v);if(k)addLog(`グリッチ ${k>0?"+":""}${k}（${B.gl}）`)},
  kDraft:x=>{const L=B.draw.length;if(!L)return;const a=B.draw[L-1],b=B.draw[L-2];if(!b){drawN(1);return}const sc=c=>{const d=CD(c);return(d.t==="atk"?2:1)*(d.v||0)+(d.r==="E"?20:0)};
   const pk=B.kPick;B.kPick=null;const take=pk===b.uid?b:pk===a.uid?a:(sc(a)>=sc(b)?a:b),other=take===a?b:a;B.draw.splice(B.draw.indexOf(other),1);B.draw.unshift(other);B.draw.splice(B.draw.indexOf(take),1);B.draw.push(take);drawN(1);addLog(`ドラフティング：「${CD(take).n}」を引き、「${CD(other).n}」を下へ`)},
  kChain:(x,k)=>{const a=(B.gl||0)*k;B.atkAdd=(B.atkAdd||0)+a;addLog(`鎖罠：次のアタック +${a}`)},
  kExile:(x,n)=>{let out=B.draw.splice(Math.max(0,B.draw.length-n));/* ★v0.60 design 16章①：アタックは抹消せず山札の下へ（抹消でアタックが消えきって止まる戦闘の直し） */if(RULE().exileKeepAtk){const ak=out.filter(c=>CD(c).t==="atk");out=out.filter(c=>CD(c).t!=="atk");if(ak.length){B.draw.unshift(...ak);addLog(`抜け道：${ak.map(c=>CD(c).n).join("・")} は山札のいちばん下へ`)}}B.exiled=(B.exiled||[]).concat(out);addLog(out.length?`抜け道：${out.map(c=>CD(c).n).join("・")} をこの戦闘から消した`:"抜け道：消すカードがない")/* text v0.22.38：「抹消」→「この戦闘から消す」 */},
  kFlip:x=>{if(A3.turnVal("flipU")){addLog("裏返し：このターンはもう使った");return}A3.turnVal("flipU",1);B.flipNext=1;B.flipNextT=B.pTurns;addLog("裏返し：次のカードは心拍が下がる")},
  kSwap:x=>{const top=B.draw.pop();if(!top)return;let wi=-1,ws=1e9;const pk=B.kPick;B.kPick=null;if(pk!=null)wi=B.hand.findIndex(c=>c.uid===pk);if(wi<0)B.hand.forEach((c,i)=>{const s=(CD(c).v||0)+(CD(c).r==="E"?50:0);if(s<ws){ws=s;wi=i}});if(wi<0){B.draw.push(top);return}const h=B.hand[wi];B.hand[wi]=top;B.draw.push(h);addLog(`道化札：「${CD(h).n}」と「${CD(top).n}」をすりかえた`)},
  kCopy:x=>{let bi=-1,bs=-1;const pk=B.kPick;B.kPick=null;if(pk!=null)bi=B.hand.findIndex(c=>c.uid===pk);if(bi<0)B.hand.forEach((c,i)=>{const d=CD(c);if(d.r==="SK"||c.tmp)return;const s=(d.v||0)+(d.r==="E"?50:d.r==="R"?10:0);if(s>bs){bs=s;bi=i}});if(bi<0){addLog("隠し札：写すカードがない");return}if(B.hand.length>=RULES.handMax)return;
   const c=B.hand[bi],cp={id:c.id,uid:(B.uidN=(B.uidN||900000)+1),up:c.up,tmp:1};B.hand.push(cp);addLog(`隠し札：「${CD(c).n}」を写した`)},
  kFeint:x=>{const e=B.e,p=curPat(e),cur=e.pi%p.length;const dmg=a=>a[0]==="atk"?a[1]:a[0]==="multi"?a[1]*a[2]:a[0]==="prc"?a[1]*1.5:0;let bj=-1,bd=dmg(p[cur]);if(RULE().feintAtk){/* ★v0.58 design 16章②：防御の行動にはすりかえない＝今の予告が攻撃で、ほかに攻撃があるときだけ（候補は一番弱い攻撃）。ないときは防御だけ */const t=K.feintTo(e);bj=t>=0&&dmg(p[t])<bd?t:-1;if(B.kPick!=null&&t<0)B.kPick=null}else p.forEach((a,j)=>{if(j!==cur&&dmg(a)<bd){bd=dmg(a);bj=j}});if(B.kPick!=null){bj=B.kPick===cur?-2:B.kPick;B.kPick=null}if(bj===-2){addLog("空振り誘い：予告はそのまま");return}
   if(bj<0){addLog("空振り誘い：すりかえる行動がない");return}e.pi=e.pi-cur+bj;addLog("空振り誘い：敵の次の行動をすりかえた");ev({k:"onset"})},
  kBeat:(x,v)=>x.attack(Math.floor((B.hr||0)/v)),
  kUseAtk:(x,n,v)=>{if(K.use(n)<n){addLog("赤い鎖：グリッチが足りない");return}x.attack(v)},
  kBug:(x,v)=>{const per=v+(A3.treeTopIs("ku_t3")&&!A3.kuTree2?1:0);if(RULE().bugOnce)A3.turnVal("bugOnce",1);B.a3bugN=(B.a3bugN||0)+1;/* qa の数え（AI の読みでは B ごともどる） */if(RULE().bugHalf){/* ★v0.87 design 16-24：全部は使わない。グリッチ ×v（0 なら bugZero）を打ってから、グリッチを半分に（切り捨て）＝使うのは残りの半分。打つときは今のグリッチのまま（刃もかかる） */const k=B.gl||0;if(k)x.attack(k*per);else if(RULE().bugZero)x.attack(RULE().bugZero);const u=k-Math.floor(k/2);if(u)K.use(u);return}
   const k=K.use(99);if(k)x.attack(k*per);else if(RULE().bugZero)x.attack(RULE().bugZero)/* ★v0.67 design 16-14 の2：グリッチ 0 なら bugZero ダメージ */},
  kTrick:(x,v)=>{K.use(99);x.attack(v);const rs=[["half","カードの心拍が半分"],["noFall","転倒を1回なしに"],["gl15","グリッチの上限 15"],["pick2","引くときはいつも2枚から選ぶ"]];B.kRule=B.kRule||{};
   const pk=B.kPick;B.kPick=null;const r=(pk&&rs.find(q=>q[0]===pk))||(B.hr>=140&&!B.kRule.half?rs[0]:null)||rs.find(q=>!B.kRule[q[0]])||rs[0];A3.se("kuro_trick",{rule:rs.indexOf(r)+1});A3.fx&&A3.fx("kuro_trick_sheet",320,180,8,0,0,2,900,4);try{AUDIO.bgmDuck&&AUDIO.bgmDuck(2,.3)}catch(e){}B.kRule[r[0]]=1;addLog(`グリッチ・トリック：この戦闘「${r[1]}」`);ev({k:"onset"})}},
 before:x=>{if(!A3.isChar("KURO"))return;B.kCur=x.c.id;const h=K.hrOf(x.c);B.hrPrev=B.hr;B.hr=Math.max(0,(B.hr||0)+h);if(B.flipNext&&B.flipNextT===B.pTurns){B.flipNext=0;addLog(`裏返し：心拍 −${Math.abs(h)}`)}if(x.c.tmp)B.curTmp=x.c.uid;if(h)K.heart(B.hr)},
 attack:(v,m)=>{if(!A3.isChar("KURO"))return v;v+=K.glAtk(B.gl);/* ★v0.75 刃を足してから帯 */if(!RULE().hrMul)return v;return v*K.hrMul(B.hr||0)},
 after:x=>{if(x.c&&x.c.tmp){const i=B.disc.findIndex(c=>c.uid===x.c.uid);if(i>=0)B.disc.splice(i,1)}},
 turn:first=>{if(!A3.isChar("KURO"))return;const R=K.R();if(first){B.hr=R.start;B.gl=0;if(has("ku_bat"))K.gl(2)}else if(B.fallNext){B.hr=R.fallNext;B.fallNext=0}K.heart(B.hr);
   /* ★③の仮（design 待ち）：KURO はシフトで引けないので、2ターン目から番のはじめに turnDraw 枚引く（ほかの子のシフトの引く・MIO の CVT の1枚にあたる） */
   if(!first&&R.turnDraw){const k=drawN(R.turnDraw);if(k)addLog(`ペダルを回す：${k}枚引いた`)}},
 sceneSE:{join_kuro:{0:()=>SND.se("kuro_glitch")},kuro_boss_post:{0:()=>SND.se("kuro_glitch")}},
});
/* 心拍：番の終わりに −40（60 より下へは下げない）。上限をこえたら転倒（カードの効果は出たあと・その番はすぐ終わり） */
{const te=turnEnd;turnEnd=function(){try{if(B&&G&&!B.over&&A3.isChar("KURO")){const R=K.R(),rb=K.restBlk(B.hr||0);const nm=(typeof TEXT!=="undefined"&&TEXT.ui&&TEXT.ui.kuro_rest_name)||"すまし顔",bb=(RULE().baseBlk||0)+K.glBlk(B.gl),gb=K.glBlk(B.gl),r2=B.fallNext?0:rb;/* ★v0.57 design 16章 案1：番の終わりの防御 +baseBlk（心拍に関係なく）。すまし顔はその上に（転倒の次の番はすまし顔だけ消える） */if(bb||r2){B.block+=bb+r2;addLog(bb?`番の終わり：防御 +${bb-gb}（${nm} ${r2?"+"+r2:"なし"}${gb?`・${(typeof TEXT!=="undefined"&&TEXT.ui&&TEXT.ui.kuro_shield_name)||"グリッチの盾"} +${gb}`:""}）`:`${nm}：防御 +${r2}`)/* ★v0.74 text v0.22.42 広い形「防御 +5（すまし顔 +6・グリッチの盾 +3）」 */;ev({k:"pblk",v:bb+r2})}B.hr=Math.max(R.start,(B.hr||0)-R.rest)}}catch(e){}return te.apply(this,arguments)}}
{const pc=playCard;playCard=function(i,shift){if(!B||B.over||!B.hand[i]||!A3.isChar("KURO"))return pc.apply(this,arguments);const t0=B.pTurns;const r=pc.apply(this,arguments);
  try{if(!B.over&&(B.hr||0)>K.R().cap){if(K.fall()&&B.pTurns===t0)return turnEnd()}}catch(e){}return r}}
/* 打てるか：グリッチが足りない・上限でないときは打てない。転倒するカードは打てる（⚠転倒） */
{const pv=preview;preview=function(c){const p=pv.apply(this,arguments);try{if(B&&A3.isChar("KURO")&&p&&p.ok){const d=CD(c);
  if(d.glNeed&&(B.gl||0)<d.glNeed)return Object.assign({},p,{ok:false,txt:`グリッチ ${d.glNeed} 以上`});
  if(RULE().bugOnce&&c.id==="ku_bagurase"&&A3.turnVal("bugOnce"))return Object.assign({},p,{ok:false,txt:((typeof TEXT!=="undefined"&&TEXT.ui&&TEXT.ui.kuro_bug_once)||"1ターン1回")});/* ★v0.95 LD 11-114・v0.96 字を text v0.22.55 の「1ターン1回」にそろえた */
  if(d.glFull&&(B.gl||0)<K.glMax())return Object.assign({},p,{ok:false,txt:`グリッチ ${K.glMax()} のとき`});
  if((B.hr||0)+K.hrOf(c)>K.R().cap)return Object.assign({},p,{danger:"fall"})}}catch(e){}return p}}
/* グリッチ・トリック ④：引くときは山札の上2枚から良いほうを（③の自動） */
A3.drawHook=(prev=>function(){if(prev)prev();if(!B||!A3.isChar("KURO")||!(B.kRule&&B.kRule.pick2))return;const L=B.draw.length;if(L<2)return;const a=B.draw[L-1],b=B.draw[L-2];if(A3.human()){(B.kPend=B.kPend||[]).push({d:a.uid,alt:b.uid});return}/* 人：引いたあと「2枚から選ぶ」小窓（ally3_ui） */const s=c=>(CD(c).v||0)+(CD(c).t==="atk"?3:0);if(s(b)>s(a)){B.draw[L-1]=b;B.draw[L-2]=a}})(A3.drawHook);
/* 息継ぎ：ツリー「引く」で3枚 */
{const d0=OPS.draw;OPS.draw=(x,n)=>{if(B&&A3.isChar("KURO")&&B.kCur==="ku_ikitsugi"&&A3.treeTopIs("ku_t2")&&!A3.kuTree2)n=(n||0)+1;return d0(x,n)}}
{const fi=finish;finish=function(){const r=fi.apply(this,arguments);try{if(G&&G.char==="KURO")K.heart(null)}catch(e){}return r}}
/* ★v0.38 KURO の AI（design 16 の答え：③が作る。LD・QA はこれで測る・②はフルオートで呼ぶだけ）。ALLY3.policy.kuro({weak}) → {t:"play",i,shift:false}｜{t:"end"}
   1手ずつ「ためしに打って」点をつける（心拍・グリッチ・転倒を見る）。weak＝オート用の少し弱い形（心拍の線を低く・グリッチの値うちを小さく・たまに早めに終える） */
A3.policy=A3.policy||{};
A3.policy.kuro=function(o){o=o||{};const weak=!!o.weak,R=K.R(),cap=R.cap;
  const snap=()=>({g:structuredClone(G),b:structuredClone(B),u:uidN}),load=s=>{G=s.g;B=s.b;uidN=s.u};
  const val=(r,s0)=>{if(r==="dead")return -1e6;if(r==="win")return 1e5+G.hp*20;const g0=s0.g,b0=s0.b;
    let v=(b0.e.hp-B.e.hp)*10-(g0.hp-G.hp)*(weak?12:15);
    const it=curAct(B.e);if(B.pTurns===b0.pTurns&&(it[0]==="atk"||it[0]==="multi"))v+=Math.min(B.block,(it[1]+(B.e.atkUp||0))*(it[2]||1))*3;
    v+=((B.gl||0)-(b0.gl||0))*(weak?4:7)+(B.hand.length-(b0.hand.length-1))*(weak?6:10)+(B.block-b0.block>0&&B.pTurns===b0.pTurns?Math.min(B.block-b0.block,8):0)+((B.atkAdd||0)-(b0.atkAdd||0))*4;
    if(B.fallNext&&!b0.fallNext)v-=weak?150:400;
    /* ★v0.42 LD 11-67 の確かめ：準備のカード（KURO SYSTEM・裏返し）も打つ */
    if(B.kSystem&&!b0.kSystem)v+=Math.max(10,40-8*(B.pTurns||0));
    if(B.flipNext&&!b0.flipNext){const mx=Math.max(0,...B.hand.map(c=>CD(c).hr||0));v+=(B.hr||0)+mx>(weak?120:110)?mx*1.5:4}
    /* ★v0.74 グリッチの盾：使って減る盾の分。長い戦闘（3番目から）で次の敵の攻撃が大きい（体力の 15% 以上）番は重く＝グリッチを使わずに番を終える */if(RULE().glitchBlk&&B.pTurns===b0.pTurns){const dm=(it[0]==="atk"||it[0]==="multi")?(it[1]+(B.e.atkUp||0))*(it[2]||1):0,hard=(B.pTurns||0)>=3&&dm>=(G.car.hp||95)*0.15*(typeof heatMul==="function"&&!globalThis.__KURO_NOHEAT?heatMul():1);/* ★v0.89 LD 11-97：ヒートで敵の攻撃が上がったぶん、線も上げる（ヒートなしの番の数にそろえる・ゲームの数は変えない） */v+=(K.glBlk(B.gl)-K.glBlk(b0.gl))*(hard?(weak?8:10):(weak?1.5:2))}
    /* ★v0.44 ひと息：番の終わりの心拍で防御が変わる分（次の予告が攻撃なら） */if(B.pTurns===b0.pTurns&&(it[0]==="atk"||it[0]==="multi"))v+=(K.restBlk(B.hr||0)-K.restBlk(b0.hr||0))*(weak?2:3);
    const line=weak?150:165;if(B.pTurns===b0.pTurns&&(B.hr||0)>line)v-=((B.hr||0)-line)*(weak?3:2);return v};
  const acts=[];B.hand.forEach((c,i)=>{if(preview(c).ok)acts.push({t:"play",i,shift:false})});
  if(weak&&acts.length&&Math.random()<0.06)return{t:"end"};
  let best={t:"end"},bs=0;
  let alt=null,as=-1e9;for(const a of acts){const s0=snap();let r;try{r=playCard(a.i,false)}catch(e){r="err"}const v=val(r,s0);load(s0);if(v>bs){bs=v;best=a}if(v>as&&v>-1e5){as=v;alt=a}}
  /* ★v0.74 手札づまりの止め：グリッチの盾でグリッチを持つようになり、グリッチが上限で打つ値が0のカード（ダンシングなど）で手札がいっぱい→アタックを引けず千日手（③の止まる戦闘）。アタックがなく手札がいっぱいに近い番は、いちばんましな1枚を打って空ける */
  if(best.t==="end"&&alt&&B.hand.length>=((typeof RULES!=="undefined"&&RULES.handMax)||10)-1&&!B.hand.some(c=>CD(c).t==="atk"))best=alt;
  return best};
if(typeof AUTOBOT!=="undefined"&&AUTOBOT.battle){const ab=AUTOBOT.battle;AUTOBOT.battle=function(kind){if(G&&G.char==="KURO"&&kind!=="random")return A3.policy.kuro({weak:true});return ab.apply(this,arguments)}}
/* ★v0.47 text v0.22.31 37-3b：「ひと息」の名前は「すまし顔」 */
if(typeof TEXT!=="undefined"){TEXT.ui=TEXT.ui||{};Object.assign(TEXT.ui,Object.assign({kuro_rest_name:"すまし顔",kuro_rest_btn:"すまし顔 +{n}",kuro_rest_help:"番の終わりに心拍が低いほど、次の敵の番の防御が増える。",kuro_rest_line1:"防御 +{a}",kuro_rest_line2:"すまし顔 +{n}",kuro_rest_line3:"グリッチの盾 +{n}",kuro_shield_name:"グリッチの盾",kuro_shield_help:"番の終わりに、残っているグリッチ1つにつき防御 +1（10 まで）。グリッチは減らない。",rule_kuro_shield:"グリッチの盾：番の終わりに、残ったグリッチの数だけ防御（10 まで）"/* text v0.22.42 37-3b */,kuro_blade_name:"グリッチの刃",kuro_blade_short:"刃 +{n}",kuro_shield_short:"盾 +{n}"/* text v0.22.45 37-3b（メーターの行） */,kuro_blade_help:"残っているグリッチ2つにつき、アタックのダメージ +2（8 まで）。グリッチは減らない。",rule_kuro_blade:"グリッチの刃：残ったグリッチ2つにつき、アタックのダメージ +2（8 まで）"/* text v0.22.48 37-3b */,rule_kuro_rest:"すまし顔：番の終わりに心拍が低いほど、防御が増える"/* text v0.22.43・44 37-3b */},TEXT.ui.kuro_rest_name?{kuro_rest_name:TEXT.ui.kuro_rest_name}:{}));
  TEXT.terms=Object.assign(TEXT.terms||{},{"term_すまし顔":{t:TEXT.ui.kuro_rest_help,cat:"仲間の決まり"},["term_"+(TEXT.ui.kuro_shield_name||"グリッチの盾")]:{t:TEXT.ui.kuro_shield_help,cat:"仲間の決まり"},["term_"+(TEXT.ui.kuro_blade_name||"グリッチの刃")]:{t:TEXT.ui.kuro_blade_help,cat:"仲間の決まり"}})}
/* 戦闘のオートは出さない（フルオート周回は走れる）・走りかたは MT を中で使う */
if(typeof autoOk==="function"){const ao=autoOk;autoOk=function(){if(G&&G.char==="KURO"&&B&&!(typeof FARM!=="undefined"&&FARM.on))return false;return ao.apply(this,arguments)}}
{const nr=newRunState;newRunState=function(mode,ch,...a){return nr.call(this,ch==="KURO"?"MT":mode,ch,...a)}}
})();
