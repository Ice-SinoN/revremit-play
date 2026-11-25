// 不具合の直りと v0.9 の決まりを関数で確かめる。使い方：node qa/check_bugs.js
const fs=require("fs"),path=require("path"),vm=require("vm");
const root=path.join(__dirname,"..");
const files=["data/rules.js","data/chars.js","data/cards.js","data/enemies.js","data/parts.js","js/engine.js"];
const ctx=vm.createContext({console,structuredClone,Math,JSON,Object,Array,Set,String,Number});
vm.runInContext(files.map(f=>fs.readFileSync(path.join(root,f),"utf8").replace(/^"use strict";/,"")).join("\n;\n")+`
;globalThis.T=(code)=>eval(code);`,ctx);
const T=ctx.T;const res=[];
const ok=(id,cond,info)=>res.push(`${cond?"OK":"NG"} ${id}${info!==undefined?" "+JSON.stringify(info):""}`);
const fresh=(mode,enemy)=>T(`newRunState("${mode}","YUKI",[]);startBattleState("${enemy||"sedan"}");B.hand=[];`);

// BUG-01：パーツ5つで目玉商品、入れ替え先を選ばない（やめる）→ お金も売り切れも変わらない
fresh("MT");T(`G.parts=["turbo","nitro","lsd","closs","cat"];G.money=100;globalThis.shop={k:"shop",feat:true,featPart:"grip"}`);
ok("BUG-01 やめる",T(`buyFeat(shop,60,false,-1)===false&&G.money===100&&!shop.featBought&&!G.parts.includes("grip")`));
ok("BUG-01 入れ替える",T(`buyFeat(shop,60,false,2)===true&&G.money===40&&shop.featBought&&G.parts[2]==="grip"&&G.parts.length===5`));
// BUG-02：強化で変わらないカードがない（MT・AT）
// ★v0.21：design 9-2 のドリフト（v 1→1）・フューエルカット（強化の値なし）は強化で変わらない → デザイン班に強化の値を頼んだ。来るまで除く（シムでは強化できない＝canUpgrade false）
const BUG02_WAIT=[];// ★v0.22.7 BUG-31：design 10-1 で4枚とも強化の値が入った
for(const mode of["MT","AT"]){fresh(mode);
  const bad=T(`Object.keys(CARDS).filter(id=>!CARDS[id].gen).filter(id=>!canUpgrade(inst(id)))`).filter(id=>!(mode==="AT"&&id==="qshift")).filter(id=>!BUG02_WAIT.includes(id));ok(`BUG-02 ${mode}`,bad.length===0,bad)}
fresh("MT");ok("BUG-02 スリップ+ 3枚",T(`descOf(inst("slip",true))`).startsWith("3枚"));
ok("BUG-02 クイックシフト+ 回転500",T(`B.gear=0;costOf(inst("qshift",true))===500`));
ok("BUG-02 クラッチ蹴り+ 回転0",T(`costOf(inst("clutchk",true))===0`));
// BUG-03：手札10枚で引く → 0枚・ログが正しい。シフトダウン・パーキングは押せない（何も起きない）
fresh("MT");T(`for(let i=0;i<10;i++)B.hand.push(inst("hyouga"));B.hand.push(inst("slip"));B.hand.splice(9,1);`);
ok("BUG-03 drawN",T(`drawN(2)===0`));
T(`B.rpm=1000;B.log=[];playCard(9,false)`);ok("BUG-03 ログ（打って9枚→1枚だけ引ける）",T(`B.log.includes("1枚引いた")&&B.hand.length===10`),T(`B.log`));
T(`B.hand[0]=inst("pitin");B.log=[];OPS.draw(mkCtx(1),2)`);ok("BUG-03 ログ（10枚のまま）",T(`B.log.includes("手札がいっぱい（引けなかった）")`),T(`B.log`));
T(`B.hand.push(inst("hyouga"));B.gear=2;globalThis.u0=B.gas;`);ok("BUG-03 シフトダウン",T(`canDraw()===false&&downShift()==="ok"&&B.gas===u0&&B.gear===2`));
fresh("AT");T(`for(let i=0;i<10;i++)B.hand.push(inst("hyouga"));globalThis.u0=B.gas`);ok("BUG-03 パーキング",T(`parking()==="ok"&&B.gas===u0`));
// BUG-04：MT 6速でクイックシフトは打てない
fresh("MT");T(`B.gear=5;B.hand=[inst("qshift")]`);ok("BUG-04",T(`preview(B.hand[0]).ok===false&&playCard(0,true)==="ok"&&B.hand.length===1&&B.gear===5`));
// BUG-05：回転を下げるカードの見込みは下げたあと
fresh("AT");T(`B.rpm=7200;B.gear=5`);ok("BUG-05 AT ブリッピング 7200→6700",T(`preview(inst("blip")).after===6700`),T(`preview(inst("blip")).txt`));
fresh("MT");T(`B.rpm=5000`);ok("BUG-05 エンジンブレーキ 5000→3000",T(`preview(inst("ebrake")).after===3000`));
ok("BUG-05 クーリング 5000→3500",T(`preview(inst("cooldown")).after===3500`));
ok("BUG-05 強化エンジンブレーキ 5000→2000",T(`preview(inst("ebrake",true)).after===2000`));
// BUG-06：AT のタコメーターの倍率
fresh("AT");T(`B.gear=5`);ok("BUG-06 AT 6速 ×1.7（エコ ×0.85）・スポーツ ×2（v0.22.98 ドライブモード）",T(`(()=>{const a=gearMult();B.drive="sport";const b=gearMult();B.drive="eco";return a===1.7&&b===2})()`));fresh("MT");T(`B.gear=5`);ok("BUG-06 MT 6速 ×2",T(`gearMult()===2`));
// v0.8 で見つけたもの：ホワイトアウトの凍結に倍率が2回かかっていた（3速で 3×1.4×1.4）→ 1回だけ
fresh("MT");T(`B.gear=2;B.rpm=1000;B.hand=[inst("whiteout")];globalThis.n0=B.e.next;playCard(0,false)`);
ok("新 ホワイトアウトの凍結",T(`Math.abs((B.e.next-n0)-Math.round(3*1.4)*1.5)<1e-9`),T(`B.e.next-n0`));
// 複数キャラの車：G.car から読む
fresh("MT");ok("構成 G.car",T(`G.car!==CHARS.YUKI.car&&G.car.gears===6&&limit()===8000`));
ok("構成 専用パーツの候補",T(`partPool().includes("widebody")&&(G.char="MOMO",!partPool().includes("widebody"))`));
ok("10-14 持ちこみの専用パーツは候補に出ない",T(`(G.char="YUKI",G.bring=[{char:"MOMO",cards:[],part:null}],partPool().every(p=>PARTS[p].own==="N"||PARTS[p].own==="YUKI"))`));
ok("10-19 売値 目玉の40%＋専用10",T(`sellPrice(Object.keys(PARTS).find(p=>PARTS[p].own==="N"))===20&&sellPrice(Object.keys(PARTS).find(p=>PARTS[p].own!=="N"))===30`));
// v0.9：レア度と上限（★RA-01：C4・R2・E1・SK1、20枚。ラン中は上限なし）
ok("v0.9 最初のデッキは決まりどおり",T(`deckErrors(defaultDeck("YUKI"),"YUKI").length===0`));
ok("v0.9 コモン5枚はだめ",T(`deckErrors(Object.assign(defaultDeck("YUKI"),{hyouga:5,braking:1}),"YUKI").some(e=>e.includes("4枚まで"))`));
ok("v0.9 エピック2枚はだめ",T(`const d=defaultDeck("YUKI");d.hyouga=2;d.rinkai=2;deckErrors(d,"YUKI").some(e=>e.includes("1枚まで"))`));
ok("v0.9 19枚はだめ",T(`const d=defaultDeck("YUKI");d.hyouga=3;deckErrors(d,"YUKI").some(e=>e.includes("20枚"))`));
ok("v0.9 組んだデッキでラン",T(`const d=defaultDeck("YUKI");d.hyouga=2;d.rinkai=1;d.rikka=1;newRunState("MT","YUKI",[],d);G.deck.filter(c=>c.id==="rinkai").length===1&&G.deck.length===20`));
ok("v0.9 だめなデッキは最初のデッキに戻す",T(`newRunState("MT","YUKI",[],{hyouga:20});G.deck.filter(c=>c.id==="hyouga").length===4`));
ok("v0.9 全カードにレア度",T(`Object.keys(CARDS).every(id=>["C","R","E","SK","OG"].includes(CARDS[id].r))`));
{const cnt={C:0,R:0,E:0};fresh("MT");for(let i=0;i<3000;i++)T(`rewardOptions("battle")`).forEach(id=>cnt[T(`rarityOf("${id}")`)]++);
 const tot=cnt.C+cnt.R+cnt.E;ok("v0.9 報酬のレア度の出かた（1枚目はほぼ C60・R30・E10。3枚は重ならないので E がやや上がる）",cnt.E/tot>0.07&&cnt.E/tot<0.2&&cnt.C/tot>0.45,cnt);
 let el=true;for(let i=0;i<500;i++)if(!T(`rewardOptions("elite").some(id=>rarityOf(id)!=="C")`))el=false;ok("v0.9 エリートは R 以上を1枚約束",el);}
ok("v0.9 固有スキルは報酬に出ない",T(`Array.from({length:300},()=>rewardOptions("elite")).flat().every(id=>rarityOf(id)!=="SK")`));
// v0.9 で見つけたもの（BUG-18）：強化した整数の数値に小数が出ていた（v0.8）
ok("BUG-18 ブレーキング+ 防御8・アフターファイア+ 炎上5・ピットイン+ 8",T(`cardVal(inst("braking",true))===8&&cardVal(inst("backfire",true))===5&&cardVal(inst("pitin",true))===8&&cardVal(inst("blip",true))===0.2`));
ok("BUG-18 強化した数値がぜんぶ整数（倍率のブリッピング・氷刃返し・ヒール＆トゥだけ小数）",T(`Object.keys(CARDS).filter(id=>!["blip","hyoujin","heeltoe","h_fullthrottle","f_y_soujin","y_og_frz","y_og_cnt","m_og_rev"].includes(id)&&!Number.isInteger(cardVal(inst(id,true)))).length===0`));
// BUG-15：リミット 8000 は「こえたら」。ちょうど 8000 はセーフ
fresh("MT");T(`B.gear=1;B.rpm=7000;B.hand=[inst("hyouga")];globalThis.h0=G.hp;playCard(0,false)`);ok("BUG-15 2速 7000＋1000＝8000 はセーフ",T(`G.hp===h0&&B.rpm===8000`),T(`[G.hp,h0,B.rpm]`));
fresh("MT");T(`B.gear=1;B.rpm=7500;B.hand=[inst("hyouga")];globalThis.h0=G.hp;playCard(0,false)`);ok("BUG-15 8500 はオーバーレブ（−8・8000 にもどる）",T(`h0-G.hp===8&&B.rpm===8000`));
fresh("MT");T(`B.gear=5;B.rpm=7000;B.hand=[inst("hyouga")]`);ok("BUG-15 6速 7000＋1000 はブローしない",T(`preview(B.hand[0]).danger===null&&playCard(0,false)!=="dead"`));
// BUG-16：見込みは実際の合計
fresh("MT");T(`B.gear=1;B.rpm=7500`);ok("BUG-16 7500＋2000 →9500",T(`preview(inst("hakusen")).after===9500`),T(`preview(inst("hakusen")).txt`));
// v0.9：演出用のイベント
fresh("MT");T(`B.rpm=4000;B.hand=[inst("hakusen")];takeEvents();playCard(0,true)`);
ok("v0.9 イベント（カード→シフト→当たり）",T(`const e=takeEvents().map(x=>x.k);e[0]==="card"&&e.includes("shift")&&e.includes("ehit")`),T(`B.ev`));
// α2（design v0.3）
fresh("MT");ok("α2 ガソリンは番のはじめに5",T(`B.gas===5`));
T(`B.hand=[inst("hakusen"),inst("hyouga")];B.rpm=1000;playCard(0,false)`);ok("α2 白閃でガソリン −2・チェイン1",T(`B.gas===3&&B.chain===1`));
T(`globalThis.d0=simulateCard(0,false).hits[0]`);ok("α2 2枚目はチェイン ×1.1（氷牙 帯 L の外 3000：6×1×1.1＝7）",T(`B.rpm===3000&&d0===7`),T(`d0`));
fresh("MT");T(`B.rpm=1000;B.hand=[inst("hyouga")]`);ok("α2 帯 L（1000）で氷牙 6×1.5＝9",T(`simulateCard(0,false).hits[0]===9`));
fresh("MT");T(`B.rpm=4500;B.hand=[inst("hakusen")];globalThis.g0=B.gas;playCard(0,true)`);ok("α2 シフトアップでガソリンがもどる（グッド・+1）",T(`B.gas===g0-2+1&&B.gear===1`),T(`[B.gas,B.gear]`));
fresh("MT");T(`B.gas=5;B.hand=[inst("muhyou"),inst("qshift"),inst("qshift"),inst("qshift"),inst("qshift")];B.rpm=1000;playCard(0,false);playCard(0,true);playCard(0,true);playCard(0,true)`);
ok("α2 シフトアップは1ターン3回まで（4枚目のクイックシフトは打てない）",T(`B.shiftsT===3&&preview(B.hand[0]).ok===false`));
ok("α2 霧氷：シフトアップのたびに凍結1・防御2（3回）★v0.22.1 design 0-8",T(`B.frozeTotal>=3&&B.block>=4+6`),T(`[B.frozeTotal,B.block]`));
fresh("MT");T(`B.hand=[inst("nadare")];B.charge=5;B.gas=5`);ok("α2 雪崩：条件3回で5目盛り（打てる・v0.10 はガソリン 8）",T(`B.charge=3;gasOf(B.hand[0])===5&&preview(B.hand[0]).ok`));
T(`B.charge=2`);ok("α2 雪崩：条件2回では打てない",T(`preview(B.hand[0]).ok===false`));
fresh("MT");T(`B.rpm=7200;B.gear=1;B.hand=[inst("braking"),inst("nadare")];playCard(0,false)`);ok("α2 レッドゾーンで打つと大技 −1",T(`B.charge===1`));
fresh("MT");T(`B.gas=99;B.hand=Array.from({length:10},()=>inst("ebrake"));for(let i=0;i<12;i++){B.hand.push(inst("ebrake"));playCard(0,false)}`);ok("α2 1ターン12枚まで",T(`B.cards===12&&preview(B.hand[0]).ok===false`));
fresh("MT");T(`B.gear=5;B.nextBonus=3;B.chain=10;B.rpm=1000;B.hand=[inst("hyouga")]`);ok("α2 最終倍率 ×5 まで（氷牙 帯 9×5＝45）",T(`simulateCard(0,false).hits[0]===45`),T(`simulateCard(0,false)`));
fresh("AT");T(`G.parts=["clutch"];B.rpm=5000;B.hand=[inst("hakusen"),inst("hakusen"),inst("braking"),inst("braking")];playCard(0);playCard(0)`);ok("BUG-14 強化クラッチのドローは1ターン1回（AT で2回自動シフト → 引くのは1枚。★v0.22.1 手札を4枚にして atLowDraw を外した）",T(`B.shiftsT===2&&B.hand.length===3`),T(`[B.shiftsT,B.hand.length]`));
fresh("AT");T(`B.rpm=5000;B.hand=[inst("hakusen")];playCard(0)`);ok("v0.22.46 AT 1ターン最初の自動シフトもガソリン +1（atFirstGas なし・LD 11-30）",T(`B.gas===maxGas()-2+1&&maxGas()===6&&B.gear===1`),T(`[B.gas,B.gear]`));
fresh("AT");T(`B.gear=2;B.rpm=4500;endTurn()`);ok("α2 AT 番のはじめ 3500未満で自動シフトダウン",T(`B.gear===1`),T(`[B.gear,B.rpm]`));
fresh("MT");T(`B.hand=[inst("clutchk"),inst("hakusen"),inst("hyouga")];B.rpm=1000;playCard(0,false);globalThis.n=simulateCard(0,true).hits.length`);ok("α2 クラッチ蹴り：パーフェクトのあと次のアタック（シフトして打った白閃）は2回",T(`n===2`),T(`n`));
fresh("MT");T(`newRunState("MT","YUKI",[]);`);ok("α2 マップ 3エリア（13＋14＋15段＋ボス3）",T(`G.map.length===45&&G.map[13][0].k==="boss"&&G.map[44][0].k==="boss"`));
T(`G.row=13;startBattleState("boss1")`);ok("α2 残光の体力 230×1.38×1.5＝476（v0.10）",T(`B.e.hp===476`));
T(`G.row=44;startBattleState("boss3");B.e.hp=300;B.hand=[inst("hyouga")];B.rpm=1000;playCard(0,false)`);ok("α2 零号 50% で第2形態",T(`B.e.phased===true&&B.e.spd===14`));
fresh("MT","safety");T(`G.row=30;startBattleState("safety");B.e.pi=1;B.e.next=0;B.pNext=0;endTurn()`);ok("α2 イエローセーフティ：次の番のガソリン −1",T(`B.gas===4`),T(`B.gas`));
fresh("MT");T(`G.row=0;B.am=1;B.e.pat=[["prc",10]];B.e.pi=0;B.block=50;globalThis.h0=G.hp;enemyStep()`);ok("α2 貫通は防御を無視",T(`G.hp===h0-10`));
fresh("MT");T(`G.row=40;startBattleState("boss3");B.atks=4;B.hand=[inst("hyouga")]`);ok("α2 零号：アタック4枚まで",T(`preview(B.hand[0]).ok===false`));
// ★14:47：カードの面の数字＝予告＝実際の結果（いろいろな状態で 2000回）
{let bad=0,tried=0,ex=null;
 for(let k=0;k<2000;k++){const mode=k%2?"AT":"MT";
  T(`newRunState("${mode}","YUKI",[]);startBattleState(pick(Object.keys(ENEMIES)));
    G.parts=shuffle(Object.keys(PARTS)).slice(0,rnd(0,5));G.tune.ecu=rnd(0,5);G.tune.shift=rnd(0,5);
    B.gear=rnd(0,5);B.rpm=rnd(0,79)*100;B.nextBonus=pick([0,0,0.1,0.2]);B.curDouble=Math.random()<0.2;B.curAdd=pick([0,0,4]);B.wideAdd=pick([0,0,3]);
    B.cards=rnd(0,11);B.e.block=pick([0,0,5,12]);B.atkDown=pick([0,0,500]);B.forcePerfect=Math.random()<0.2;B.gas=rnd(0,7);
    B.chain=rnd(0,12);B.charge=rnd(0,9);B.shiftsT=rnd(0,3);B.shifts=rnd(0,2);B.frozeTotal=rnd(0,30);B.block=pick([0,0,8,20]);B.perfTwice=Math.random()<0.2;B.atkTwice=Math.random()<0.2;B.htTurn=Math.random()<0.3;
    B.onUp=Math.random()<0.4?[["blk",4],["frz",1],["genHand","hyoushou",1]]:[];B.atks=rnd(0,4);B.launchUsed=Math.random()<0.5;
    B.hand=shuffle(Object.keys(CARDS)).slice(0,7).map(id=>inst(id,Math.random()<0.3));
    if(B.e.weakGear){G.weakSeen={};if(Math.random()<0.7)for(let i=0;i<3;i++){B.e.mi=i;G.weakSeen[weakKey()]=1}B.e.mi=0}/* ★v0.22.123 弱点ギア：見つけたあとは予告＝実際。見つける前は「予告にふくめない」の例外（下で数えない） */`);
  const n=T(`B.hand.length`),wkU=T(`!!(B.e.weakGear&&!weakKnown(B.e))`);if(wkU)continue;for(let i=0;i<n;i++)for(const sh of[false,true]){
    const sim=T(`simulateCard(${i},${sh})`);if(!sim)continue;tried++;
    const act=T(`(()=>{const sg=structuredClone(G),sb=structuredClone(B),su=uidN;B.ev=[];const r=playCard(${i},${sh});const h=[];let b=0;for(const e of B.ev){if(e.k==="eact"||e.k==="turn")break;if(e.k==="ehit")h.push(e.v+(e.blk||0));if(e.k==="pblk")b+=e.v}G=sg;B=sb;uidN=su;return{h,b,r}})()`);
    if(JSON.stringify(sim.hits)!==JSON.stringify(act.h)||sim.block!==act.b||sim.win!==(act.r==="win")){bad++;if(!ex)ex={sim,act}}}}
 ok("14:47 カードの数字＝実際の結果（ためしに打って比べる）",bad===0&&tried>1000,{tried,bad,ex});
 // 状態が変わると数字が変わる：ギア・次のカードの倍率・ECU
 fresh("MT");T(`B.hand=[inst("hyouga")];B.rpm=1000`);const a=T(`simulateCard(0,false).hits[0]`);
 T(`B.gear=3`);const b=T(`simulateCard(0,false).hits[0]`);T(`B.nextBonus=0.2`);const c=T(`simulateCard(0,false).hits[0]`);T(`G.tune.ecu=3`);const d=T(`simulateCard(0,false).hits[0]`);
 ok("14:47 ギア・次の倍率・ECU で数字が上がる",a<b&&b<c&&c<d,[a,b,c,d]);
 // ためしても状態は変わらない
 fresh("MT");T(`B.hand=[inst("hakusen"),inst("slip")];B.rpm=4000;globalThis.snapA=JSON.stringify([G,B])`);T(`simulateCard(0,true);simulateCard(1,false)`);
 ok("14:47 ためしに打っても状態は変わらない",T(`JSON.stringify([G,B])===snapA`));
 fresh("MT");T(`B.hand=[inst("hyouga"),inst("hakusen"),inst("rikka")];B.rpm=1000;globalThis.hRef=B.hand;globalThis.bRef=B`);
 const ids=T(`B.hand.map((c,i)=>{simulateCard(i,false);return c.id}).join()`);
 ok("14:47 ためしても手札の並び・同じもの（参照）がそのまま",ids==="hyouga,hakusen,rikka"&&T(`B===bRef&&B.hand===hRef&&B.hand.length===3`),ids);}
console.log(res.join("\n"));console.log(`合計 ${res.length}・NG ${res.filter(s=>s.startsWith("NG")).length}`);
