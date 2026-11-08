"use strict";
/* ===== 計算（α2・v0.10）：ランと戦闘。画面（DOM）にはさわらない =====
   結果は戻り値で返す："ok"（続く）/ "turn"（相手の番が終わって自分の番）/ "win"（敵をたおした）/ "dead"（ランが終わった）
   ボットはこのファイルとデータだけで、画面なしに何千回も回せる（qa/sim.js）
   v0.9：起きたことを B.ev に順に積む（画面がモーションを決めるため）。
     {k:"card",id,mo,shift} {k:"shift",g} {k:"ehit",v,blk} {k:"pblk",v} {k:"frz",v} {k:"burn",v} {k:"noise",v} {k:"heal",v} {k:"draw",n}
     {k:"revdown"} {k:"over"} {k:"blow"} {k:"eact",p} {k:"phit",v,blk} {k:"eblk",v} {k:"eburn",v} {k:"turn"} {k:"win"} {k:"dead"} */
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};

let G=null,B=null,uidN=1;
const inst=(id,up=false)=>({id,up,uid:uidN++});
const has=p=>!!G&&G.parts.includes(p);
const car=()=>G.car;

/* ---- カードの読みかた ---- */
function CD(c){const d=CARDS[c.id||c];if(G&&G.mode==="AT"&&d.at)return Object.assign({},d,d.at);return d}
function rnum(x,ref){return Number.isInteger(ref)?Math.round(x):Math.round(x*100)/100}
function cardVal(c,up){const d=CD(c);up=up===undefined?!!c.up:up;if(!up)return d.v;if(d.vu!=null)return d.vu;const x=d.v*RULES.upMult;return Number.isInteger(d.v)?Math.round(x):Math.round(x*100)/100}// 整数は四捨五入（ブレーキング 5→8）
function baseCost(c,up,gear){const d=CD(c);up=up===undefined?!!c.up:up;
  if(d.costGear){const[s,st,mn]=d.costGear;return Math.max(mn,s-st*(gear||0))}
  return up&&d.cu!=null?d.cu:d.c}
function costOf(c){const d=CD(c);let x=baseCost(c,undefined,B?B.gear:0);if(d.t==="atk"&&B&&B.atkDown)x=Math.max(0,x-B.atkDown);return x}
function descOf(c,up,gear){const d=CD(c);up=up===undefined?!!c.up:up;const v=cardVal(c,up);
  return d.d.replace(/\{v\}/g,v).replace(/\{gv\}/g,Math.round(v*((gear||0)+1)))}
function argOf(a,v){return a==="v"?v:a}
/* 回転を下げる量（見込み用） */
function revDownOf(c){const v=cardVal(c);return CD(c).fx.filter(f=>f[0]==="revDown").reduce((s,f)=>s+argOf(f[1],v),0)}
/* 強化で何か変わるか（変わらないカードはシムトレーニングに出さない） */
function canUpgrade(c){const d=CD(c);if(c.up||d.gen)return false;return descOf(c,false,0)!==descOf(c,true,0)||baseCost(c,false,0)!==baseCost(c,true,0)||(d.gasu!=null&&d.gasu!==d.gas)}

function motionOf(c){const d=CD(c);return d.mo||TYPE_MOTION[d.t]||"rev"}
function rarityOf(c){return CARDS[c.id||c].r||"C"}
/* ---- デッキ（ラン前に組む：上限 C4・R2・E1・SK1、20枚） ---- */
function deckPool(charId){return Object.keys(CARDS).filter(id=>!CARDS[id].gen&&(CARDS[id].own==="N"||CARDS[id].own===(charId||"YUKI")))}
function defaultDeck(charId){const out={};CHARS[charId||"YUKI"].deck.forEach(([id,n])=>{out[id]=(out[id]||0)+n});return out}
function deckCount(dk){return Object.values(dk).reduce((a,b)=>a+b,0)}
function deckLimitOf(id){return RULES.deckLimit[rarityOf(id)]||1}
/* 組んだデッキの確認。問題がなければ []（文で返す） */
function deckErrors(dk,charId){const e=[],pool=deckPool(charId);
  Object.entries(dk).forEach(([id,n])=>{if(!n)return;if(!pool.includes(id))e.push(`${id} は使えない`);else if(n>deckLimitOf(id))e.push(`${CARDS[id].n} は${deckLimitOf(id)}枚まで`)});
  const t=deckCount(dk);if(t!==RULES.deckSize)e.push(`デッキは${RULES.deckSize}枚（今 ${t}枚）`);return e}

/* ---- ラン（3エリア。マップは design 付録の作り方）---- */
function genMap(){
  const map=[];AREAS.forEach((a,ai)=>{
    for(let r=0;r<a.rows;r++){let row;
      if(r===0)row=[{k:"battle"},{k:"battle"}];
      else if(r===a.rows-1)row=[{k:"garage"}];
      else{const n=rnd(2,4);row=[];let prevElite=false;
        for(let i=0;i<n;i++){const w=NODE_W.filter(x=>r>=x[2]);const t=w.reduce((s,x)=>s+x[1],0);let q=Math.random()*t,k="battle";
          for(const x of w){q-=x[1];if(q<0){k=x[0];break}}row.push({k})}
        if(r===a.mid&&!row.some(n=>n.k==="shop"||n.k==="sim"))row[0]={k:Math.random()<0.5?"shop":"sim"};}
      row.forEach(n=>{n.a=ai;n.r=r;if(n.k==="shop"){n.feat=Math.random()<RULES.featRate;n.sale=Math.random()<RULES.saleRate}});
      map.push(row)}
    map.push([{k:"boss",a:ai,r:a.rows}]);
  });return map}
function newRunState(mode,charId,bring,dk){
  charId=charId||"YUKI";const ch=CHARS[charId];
  if(!dk||deckErrors(dk,charId).length)dk=defaultDeck(charId);
  const deck=[];Object.entries(dk).forEach(([id,n])=>{for(let i=0;i<n;i++)deck.push(inst(id))});
  bring=(Array.isArray(bring)?bring:[]).slice(0,BRING_MAX);
  G={char:charId,car:JSON.parse(JSON.stringify(ch.car)),mode,hp:ch.car.hp,maxhp:ch.car.hp,money:RULES.money0,tickets:0,
     tune:{tire:0,shift:0,engine:0,light:0,ecu:0},parts:[],deck,map:genMap(),row:0,path:[],cageUsed:false,seen:{},
     st:{shiftTry:0,perfect:0,good:0,otk:0,battles:0,clear:false,rowsDone:0,maxTurnDmg:0,maxChain:0,area:0},bring,atkBonus:0};
  bring.forEach(m=>{const b=mcBonus(m);G.maxhp+=b.hp;G.hp+=b.hp;G.atkBonus+=b.atk/100;
    m.cards.forEach(c=>{const x=inst(c.id,c.up);x.mc=1;deck.push(x)});
    if(m.part&&!G.parts.includes(m.part)&&G.parts.length<RULES.partsMax)G.parts.push(m.part)});
  return G;
}
function mcBonus(m){const i=Math.max(0,RANKS.indexOf(m.rank));return{hp:MC_BONUS.hp[i],atk:MC_BONUS.atk[i]}}
function areaIdx(){const r=G.map[Math.min(G.row,G.map.length-1)];return r[0].a}
function curArea(){return AREAS[areaIdx()]}
/* マスの敵：最初の3段はやさしい雑魚だけ */
function nodeEnemy(n){const a=AREAS[n.a];if(n.k==="elite")return a.elite;if(n.k==="boss")return a.boss;return n.r<3?pick(a.easy):pick(a.pool)}
/* 次の段へ。ボスのあとは耐久を 30% 回復（design 付録）。戻り値 "map"｜"area"（次のエリアに入った）｜"clear" */
function advanceRow(){const prev=G.map[G.row][0];G.row++;G.st.rowsDone=G.row;
  if(G.row>=G.map.length){G.st.clear=true;return"clear"}
  if(prev.k==="boss"){const h=Math.round(G.maxhp*RULES.areaHeal);G.hp=Math.min(G.maxhp,G.hp+h);G.st.area=areaIdx();return"area"}
  return"map"}
/* 候補に出るパーツ：共通＋自分の専用＋持ち込んだミニカーのキャラの専用。持っているものは除く */
function partPool(){const own=new Set([G.char,...G.bring.map(m=>m.char)]);
  return Object.keys(PARTS).filter(p=>!G.parts.includes(p)&&(PARTS[p].own==="N"||own.has(PARTS[p].own)))}
function partOptions(n){return shuffle(partPool()).slice(0,n||3)}
/* パーツを取る。5つあるときは idx の枠と入れ替える（idx なしで5つなら false） */
function addPart(p,idx){if(G.parts.length<RULES.partsMax){G.parts.push(p);return true}
  if(idx==null||idx<0||idx>=G.parts.length)return false;G.parts[idx]=p;return true}
/* 戦闘のあとの3択。先にレア度を C60・R30・E10 で引く。エリートは R 以上を1枚、ボスは E を1枚約束 */
function rewardOptions(rank){
  const pool=[...new Set(CHARS[G.char].pool)].filter(id=>CARDS[id]&&!CARDS[id].gen&&rarityOf(id)!=="SK");
  const out=[];
  const draw=list=>{const rs=[...new Set(list.map(rarityOf))],t=rs.reduce((a,r)=>a+(RULES.rarityW[r]||10),0);let x=Math.random()*t,r=rs[rs.length-1];
    for(const q of rs){x-=RULES.rarityW[q]||10;if(x<0){r=q;break}}return pick(list.filter(id=>rarityOf(id)===r))};
  if(rank==="elite"){const hi=pool.filter(id=>rarityOf(id)!=="C");if(hi.length)out.push(draw(hi))}
  if(rank==="boss"){const hi=pool.filter(id=>rarityOf(id)==="E");if(hi.length)out.push(pick(hi))}
  while(out.length<3){const rest=pool.filter(id=>!out.includes(id));if(!rest.length)break;out.push(draw(rest))}
  return shuffle(out);
}
function upgradeTargets(){return G.deck.map((c,i)=>[c,i]).filter(([c])=>canUpgrade(c)).map(([,i])=>i)}
function tunePrice(k,shop,useTicket){const lv=G.tune[k];if(lv>=5)return null;return shopPrice(TUNE_PRICE[lv],shop,useTicket)}
function shopPrice(x,shop,useTicket){let v=x;if(shop&&shop.sale)v=Math.round(v*RULES.sale);if(has("etc"))v=Math.round(v*0.8);if(useTicket)v=Math.round(v*RULES.ticket);return v}
function buyTune(k,price,useTicket){if(G.tune[k]>=5||G.money<price)return false;G.money-=price;if(useTicket&&G.tickets>0)G.tickets--;G.tune[k]++;
  if(k==="engine"){G.maxhp+=10;G.hp+=10}return true}
/* 目玉商品：お金はパーツが本当に入ったときだけ払う（BUG-01） */
function buyFeat(shop,price,useTicket,idx){if(shop.featBought||G.money<price)return false;
  if(!addPart(shop.featPart,idx))return false;G.money-=price;if(useTicket&&G.tickets>0)G.tickets--;shop.featBought=true;return true}
function restAmount(){return Math.round(G.maxhp*RULES.restRate)}

/* ---- 戦闘 ---- */
function startBattleState(key){
  const E=ENEMIES[key];const C=car();const AR=curArea();
  const hp=Math.round(E.hp*(AR.hpMul||1)*(E.rank==="boss"?(AR.bossMul||1):1));
  B={key,am:AR.atkMul||1,e:{...E,hp,maxhp:hp,block:0,burn:0,noise:0,atkUp:0,pi:0,mi:0,spdUp:0,mAdd:0,next:100/E.spd,phased:false,mirrorArm:false},
     rpm:C.idle+(has("boost")?1500:0),gear:0,hand:[],draw:shuffle(G.deck.slice()),disc:[],block:0,
     pNext:0,shifts:0,shiftsT:0,nextBonus:0,forcePerfect:false,nitroUsed:false,nextTurnAdd:0,nextTurnDouble:false,
     curAdd:0,curDouble:false,wideAdd:0,cards:0,atks:0,atkDown:0,atShiftDraw:0,gas:0,charge:0,chain5:false,chain:0,chainBefore:0,turnDmg:0,
     onUp:[],perfTwice:false,atkTwice:false,htTurn:false,htBonus:0,clutchT:false,launchUsed:false,frozeTotal:0,apPen:0,
     enemyActed:false,log:[],ev:[],over:false,result:null};
  G.st.battles++;
  addLog(`${E.n} があらわれた。${E.gimTxt?"（"+E.gimTxt+"）":""}`);
  if(E.first){addLog(`${E.n} が先に動いた`);const r=enemyStep();if(r)return finish(r),B}
  startPlayerTurn(true);
  return B;
}
function addLog(s){B.log.push(s);if(B.log.length>60)B.log.shift()}
function ev(o){B.ev.push(o);if(B.ev.length>200)B.ev.shift()}
/* 画面が読む：たまったイベントを取り出して空にする */
function takeEvents(){const a=B?B.ev:[];if(B)B.ev=[];return a}
/* 引く。本当に引けた枚数を返す（BUG-03） */
function drawN(n){let k=0;for(let i=0;i<n;i++){if(B.hand.length>=RULES.handMax)break;if(!B.draw.length){if(!B.disc.length)break;B.draw=shuffle(B.disc);B.disc=[]}B.hand.push(B.draw.pop());k++}return k}
function canDraw(){return B.hand.length<RULES.handMax&&(B.draw.length+B.disc.length)>0}
function limit(){return car().limit+(has("limiter")?500:0)}
function bandExt(){return 150*G.tune.shift+(has("closs")?200:0)}
function bandRange(){const C=car(),x=bandExt();return{lo:C.band[0]-x,hi:C.band[1]+x,clo:C.core[0]-x/2,chi:C.core[1]+x/2}}
function grade(rpm){const b=bandRange();if(B.forcePerfect)return"perfect";if(has("launch")&&!B.launchUsed)return"perfect";if(rpm>=b.clo&&rpm<=b.chi)return"perfect";if(rpm>=b.lo&&rpm<=b.hi)return"good";return rpm<b.lo?"early":"late"}
const GRADE_JP={perfect:"パーフェクト",good:"グッド",early:"早すぎ",late:"遅い"};
/* ★ガソリン（design 0-1） */
function maxGas(){return RULES.gasMax+(G.tune.light>=3?1:0)+(G.tune.light>=5?1:0)}
function gasBase(c){const d=CD(c);return c.up&&d.gasu!=null?d.gasu:(d.gas||0)}
function gasOf(c){const d=CD(c);let a=gasBase(c);if(d.charge)a=Math.max(0,a-B.charge);if(has("aero")&&B.gear===car().gears-1&&a>=2)a--;return a}
function addGas(n){B.gas=Math.min(maxGas(),B.gas+n)}
function addCharge(why){B.charge++;ev({k:"charge",n:B.charge,why});if(B.hand.concat(B.draw,B.disc).some(c=>CD(c).charge))addLog(`大技の条件（${why}）：ガソリン −1`)}
/* ★回転数の帯（design 0-3）：打つ前の回転で判定 */
function redLo(){return RULES.red[G.mode]-(has("hicam")?1000:0)}
function bandRangeOf(c){const d=CD(c);if(!d.band)return null;if(d.band==="R")return[redLo(),limit()];return car().bands[d.band]}
function inBand(c){const r=bandRangeOf(c);if(!r)return false;return B.rpm>=r[0]&&(CD(c).band==="R"?B.rpm<=r[1]:B.rpm<r[1])}
function inRed(){return B.rpm>=redLo()&&B.rpm<=limit()}
/* ★チェイン（design 0-2） */
function chainStep(){return RULES.chainStep+(has("slick")?0.05:0)}
function chainMul(n){return 1+chainStep()*Math.min(n==null?B.chain:n,RULES.chainMax)}
function isTopGear(){return B.gear>=car().gears-1}
function shiftLeft(){return B.shiftsT<RULES.shiftCap}
/* 今のギアの倍率（表示用。AT の ×0.9 も入れる：BUG-06） */
function gearMult(){return Math.round(car().mult[B.gear]*(G.mode==="AT"?RULES.atMult:1)*100)/100}
function startPlayerTurn(first){
  B.block=0;B.cards=0;B.atks=0;B.shifts=0;B.shiftsT=0;B.gas=Math.max(0,maxGas()-B.apPen);
  if(B.apPen)addLog(`ガソリン −${B.apPen}（イエローフラッグ）`);B.apPen=0;B.chain5=false;B.chain=0;B.turnDmg=0;B.htTurn=false;B.htBonus=0;B.clutchT=false;
  B.curAdd=B.nextTurnAdd;B.nextTurnAdd=0;B.curDouble=B.nextTurnDouble;B.nextTurnDouble=false;
  if(first)drawN(RULES.hand0+(has("hook")?1:0));
  else if(B.hand.length===0&&drawN(1))addLog("手札がないので1枚引いた（救済）");
  // AT：番のはじめに回転が低ければ自動で1段シフトダウン（design 0-7）
  if(!first&&G.mode==="AT"&&RULES.atAutoDown&&B.gear>0&&B.rpm<RULES.atAutoDown){B.gear--;B.rpm=Math.round(B.rpm/car().downDiv/100)*100;addLog(`自動シフトダウン → ${B.gear+1}速`);ev({k:"down"})}
  addLog(`— あなたの番（${B.gear+1}速・${B.rpm}回転・ガソリン ${B.gas}）`);
}
/* 自動シフト（AT）／シフトできるか（MT） */
function wouldAutoShift(c,nr){const b=bandRange();return G.mode==="AT"&&!isTopGear()&&shiftLeft()&&nr>=b.lo&&costOf(c)>0}
/* カードを打つ前の見込み（打てるか・シフト・危ない）。数字は simulateCard */
function preview(c){
  const d=CD(c),C=car(),cost=costOf(c),nr=B.rpm+cost,L=limit();
  if(d.redOnly&&!inRed())return{ok:false,txt:"レッドゾーンでないと打てない"};
  if(B.cards>=RULES.cardCap)return{ok:false,txt:`このターンはもう打てない（${RULES.cardCap}枚まで）`};
  const g=gasOf(c);if(g>B.gas)return{ok:false,txt:d.charge&&g>maxGas()?`大技：あと ${g-B.gas} 目盛り（条件で減る）`:`ガソリンが足りない（${g}目盛り）`};
  if(d.t==="atk"&&B.e.cap&&B.atks>=B.e.cap)return{ok:false,txt:`このターンはもうアタックできない（${B.e.cap}枚まで）`};
  if(d.shiftCard&&G.mode==="MT"&&isTopGear())return{ok:false,txt:"もう最大ギア（シフトできない）"};// BUG-04
  if(d.shiftCard&&G.mode==="MT"&&!shiftLeft())return{ok:false,txt:`シフトアップは1ターン${RULES.shiftCap}回まで`};
  const canShift=G.mode==="MT"&&!isTopGear()&&shiftLeft()&&((nr>=C.minShift&&cost>0)||!!d.shiftCard);
  const auto=wouldAutoShift(c,nr);
  const after=Math.max(0,nr-revDownOf(c));// BUG-05・BUG-16
  let txt=`→ ${after}回転`;let danger=null;
  if(G.mode==="MT"){
    if(canShift)txt+=`　シフト可（${GRADE_JP[grade(nr)]}）`;
    if(nr>L){if(isTopGear()){danger="blow";txt+="　⚠ブロー"}else{danger="over";txt+=canShift?"　（シフトしないとオーバーレブ）":"　⚠オーバーレブ"}}
  }else{if(auto)txt+="　自動シフト";else if(nr>L)txt+="　リミッター（火力 半分）"}
  txt+=`　ガソリン\u00a0−${g}`;// BUG-22：「−2」だけ折り返さない
  return{ok:true,txt,canShift,auto,nr,after,danger,gas:g,band:inBand(c),grade:canShift?grade(nr):null};
}
/* 効果の手助け */
function mkCtx(m){return{
  attack(v,raw){let d=raw?v:v*m*(1+0.1*G.tune.ecu+(G.atkBonus||0));
    if(!raw){if(B.curDouble){d*=2;B.curDouble=false}d+=B.curAdd;B.curAdd=0;d+=B.wideAdd;B.wideAdd=0}
    if(B.e.five){const k=Math.floor((B.cards-1)/5);if(k>0)d*=Math.pow(0.7,k)}d=Math.max(0,Math.round(d));hitEnemy(d)},
  block(v){const x=Math.round(v*m)+(has("grip")?3:0);B.block+=x;addLog(`防御 +${x}`);ev({k:"pblk",v:x})},
  blockRaw(v){B.block+=v;addLog(`防御 +${v}`);ev({k:"pblk",v})},
  freeze(v){const x=Math.round(v*m)*(has("emblem")?2:1);B.frozeTotal+=x;B.e.next+=x*1.5*(B.e.halfFrz?0.5:1);addLog(`凍結 ${x}：敵の番が遅れる`);ev({k:"frz",v:x})},
  burn(v){const x=Math.round(v*m);B.e.burn+=x;addLog(`炎上 +${x}`);ev({k:"burn",v:x})},
  noise(v){const x=Math.round(v*m);B.e.noise+=x;addLog(`ノイズ +${x}`);ev({k:"noise",v:x})},
  heal(v){const x=Math.round(v*m);G.hp=Math.min(G.maxhp,G.hp+x);addLog(`エンジン耐久 +${x}`);ev({k:"heal",v:x})},
  draw(n){const k=drawN(n+(has("pacenote")?1:0));addLog(k?`${k}枚引いた`:"手札がいっぱい（引けなかった）");ev({k:"draw",n:k})},
  revDown(n){B.rpm=Math.max(0,B.rpm-n);addLog(`回転 −${n}`);ev({k:"revdown",v:n})},
  gen(id,n){for(let k=0;k<n;k++){const x=inst(id);x.temp=1;B.draw.splice(Math.floor(Math.random()*(B.draw.length+1)),0,x)}addLog(`山札に「${CARDS[id].n}」を${n}枚まぜた`)},
  genHand(id,n){let k=0;for(;k<n;k++){if(B.hand.length>=RULES.handMax)break;const x=inst(id);x.temp=1;B.hand.push(x)}if(k)addLog(`手札に「${CARDS[id].n}」${k}枚`)},
}}
const OPS={
 atk:(x,a)=>x.attack(a),atkGear:(x,a)=>x.attack(a*(B.gear+1)),
 blk:(x,a)=>x.block(a),blkGear:(x,a)=>x.block(a*(B.gear+1)),blkRaw:(x,a)=>x.blockRaw(a),
 frz:(x,a)=>x.freeze(a),noise:(x,a)=>x.noise(a),burn:(x,a)=>x.burn(a),heal:(x,a)=>x.heal(a),
 draw:(x,a)=>x.draw(a),revDown:(x,a)=>x.revDown(a),
 gen:(x,id,n)=>x.gen(id,n),genHand:(x,id,n)=>x.genHand(id,n),nextBonus:(x,a)=>{B.nextBonus=Math.round((B.nextBonus+a)*100)/100},
 forcePerfect:()=>{B.forcePerfect=true},atShiftDraw:(x,a)=>{B.atShiftDraw+=a;addLog("次の自動シフトで1枚引く")},
 atkDown:(x,a)=>{B.atkDown+=a;addLog(`次のアタックの回転 −${a}`)},
 counterAdd:()=>{B.nextTurnAdd+=Math.floor(B.block/2)},nextDouble:()=>{B.nextTurnDouble=true},
 // α2（design 1章・5章）
 atkHits:(x,v,n,ns)=>{const k=B.shifts>0?ns:n;for(let i=0;i<k;i++)x.attack(v)},
 atkBlk:(x,r)=>x.attack(B.block*r),
 atkFrz:(x,k)=>x.attack(Math.min(B.frozeTotal*k,RULES.frzCap),true),
 atkChain:(x,k)=>x.attack(k*Math.min(B.chainBefore,RULES.chainMax)),
 onUp:(x,op,...a)=>{B.onUp.push([op,...a]);addLog("この戦闘の間、シフトアップのたびに効く");ev({k:"onset"})},
 perfTwice:()=>{B.perfTwice=true},
 heelToe:(x,v)=>{B.htTurn=true;B.htBonus=Math.round((B.htBonus+v)*100)/100;addLog(`このターン、シフトダウン 0目盛り・次の倍率 +${v}`)},
 kickDown:()=>{if(B.gear>0){B.gear--;B.rpm=Math.min(limit(),Math.round(B.rpm/car().downDiv/100)*100);addLog(`キックダウン → ${B.gear+1}速`);ev({k:"down"})}},
};
function hitEnemy(d){const e=B.e;const blk=Math.min(e.block,d);e.block-=blk;e.hp-=d-blk;B.turnDmg+=d;
  addLog(`${d}ダメージ${blk?`（防御で −${blk}）`:""}`);ev({k:"ehit",v:d-blk,blk});checkPhase()}
function checkPhase(){const e=B.e;if(e.phase&&!e.phased&&e.hp>0&&e.hp<=e.maxhp*e.phase.at){e.phased=true;e.spd=e.phase.spd;
  if(e.phase.morph){e.morph=e.phase.morph;e.mi=0;e.pi=0}if(e.phase.pat){e.pat=e.phase.pat;e.pi=0}addLog(`${e.n} の形がくずれていく……`);ev({k:"phase",pal:e.phase.pal||null,glitch:!!e.phase.glitch})}}
function overRev(){const dmg=has("oilcool")?RULES.overDmgCool:RULES.overDmg;G.hp-=dmg;B.rpm=limit();addLog(`オーバーレブ！エンジン耐久 −${dmg}`);ev({k:"over",v:dmg});return dead()}
/* ロールケージ：ランに1回、1で耐える */
function dead(){if(G.hp<=0&&has("cage")&&!G.cageUsed){G.cageUsed=true;G.hp=1;addLog("ロールケージ：耐久1で耐えた");ev({k:"cage"})}return G.hp<=0}
/* ★シフトアップで起きること（1ターン shiftCap 回まで・design 0-1・0-4） */
function onShiftUp(g){
  B.shiftsT++;if(B.shiftsT>RULES.shiftCap)return;
  const k=g==="perfect"||(G.mode==="AT"&&RULES.atFirstGas&&B.shiftsT===1)?RULES.gasPerfect:RULES.gasUp,g0=B.gas;addGas(k);
  if(B.gas>g0){addLog(`ガソリン +${B.gas-g0}`);ev({k:"gas",v:B.gas-g0})}
  if(g==="perfect"||G.mode==="AT")addCharge(G.mode==="AT"?"自動シフト":"パーフェクト");
  if(B.onUp.length){const m=car().mult[B.gear]*(G.mode==="AT"?RULES.atMult:1),x=mkCtx(m);ev({k:"onup"});
    B.onUp.forEach(([op,...a])=>{if(OPS[op])OPS[op](x,...a)})}
  if(B.perfTwice&&(g==="perfect"||G.mode==="AT")){B.perfTwice=false;B.atkTwice=true;addLog("次のアタックは2回当たる")}
}
/* ---- カードの面の数字・予告（★虎雪 2026-11-06 14:47）----
   今そのカードを打ったらどうなるかを「写しの上でためしに打つ」で出す（計算は playCard そのもの）。
   だから、カードの面の数字＝予告＝実際の結果が必ずそろう（チェイン・帯・シフト効果・大技も入る）。
   戻り値：{hits:[1発ごとのダメージ（敵の防御で減る前）], block, win, dead, rpm, gear, gas, ehp:打ったあとの敵の体力, eblk, chain} */
function simulateCard(i,shift){
  if(!B||B.over||!B.hand[i]||!preview(B.hand[i]).ok)return null;
  const og=G,ob=B,su=uidN;G=structuredClone(og);B=structuredClone(ob);let r=null;
  B.ev=[];B.sim=true;try{r=playCard(i,shift)}catch(e){}
  const hits=[];let block=0;
  for(const e of B.ev){if(e.k==="eact"||e.k==="turn")break;if(e.k==="ehit")hits.push(e.v+(e.blk||0));if(e.k==="pblk")block+=e.v}
  const out={hits,block,win:r==="win",dead:r==="dead",rpm:B.rpm,gear:B.gear,gas:r==="turn"?0:B.gas,ehp:Math.max(0,B.e.hp),eblk:B.e.block,chain:B.chain,turn:r==="turn"};
  G=og;B=ob;uidN=su;return out}
/* カードに書いてある元の数字（倍率・帯なし）：色を変える基準。num の書き方は cards.js */
function baseNumbers(c){const d=CD(c),v=cardVal(c),hits=[];let block=0;
  d.fx.forEach(f=>{const a=argOf(f[1],v);if(f[0]==="atk"||f[0]==="atkGear")hits.push(a);if(f[0]==="atkHits")for(let k=0;k<f[2];k++)hits.push(a);
    if(f[0]==="blk"||f[0]==="blkGear"||f[0]==="blkRaw")block+=a});
  if(d.fx.some(f=>f[0]==="atkBlk"||f[0]==="atkChain"||f[0]==="atkFrz")&&!hits.length)hits.push(0);
  return{hits,block}}
/* カードを打つ。shift：MT でシフトアップするか（AT は自動で決まる） */
function playCard(i,shift){
  if(B.over)return B.result;
  const c=B.hand[i];if(!c)return"ok";
  const p=preview(c);if(!p.ok)return"ok";
  const d=CD(c),C=car(),cost=costOf(c);
  if(G.mode==="AT")shift=p.auto;else shift=!!shift&&p.canShift;
  const band=p.band,red=inRed();// ★打つ前の回転で判定
  B.gas-=p.gas;B.hand.splice(i,1);B.cards++;if(d.t==="atk")B.atks++;
  if(d.t==="atk"&&B.atkDown)B.atkDown=0;
  B.chainBefore=B.chain;
  let nr=B.rpm+cost,bonus=0;
  addLog(`▶ ${d.n}${c.up?"+":""}（+${cost}回転・ガソリン ${p.gas}）${band?"　帯！":""}`);
  ev({k:"card",id:c.id,up:!!c.up,t:d.t,mo:motionOf(c),band,chain:B.chain+1,shift:shift?(G.mode==="AT"?"good":grade(nr)):null});
  if(shift){
    const g=G.mode==="AT"?"good":grade(nr);B.forcePerfect=false;B.launchUsed=true;
    const drop=g==="early"?C.earlyDrop:has("flywheel")?0.5:C.upDrop;
    B.gear++;G.st.shiftTry++;B.shifts++;
    if(g==="perfect"){bonus=0.3;G.st.perfect++}else if(g==="good"){bonus=0.1;G.st.good++}
    nr=Math.round(nr*drop/100)*100;B.rpm=nr;
    addLog(`シフトアップ → ${B.gear+1}速（${GRADE_JP[g]}）回転 ${nr}`);ev({k:"shift",g,gear:B.gear});
    if(g==="perfect"){addLog(drawN(1)?"パーフェクト：1枚引いた":"パーフェクト：手札がいっぱい");if(has("lsd")){B.block+=5;addLog("LSD：防御 +5")}}
    if(g==="good"&&has("clutch")&&!B.clutchT){B.clutchT=true;if(drawN(1))addLog("強化クラッチ：1枚引いた")}// BUG-14：1ターン1回
    if(G.mode==="AT"&&B.atShiftDraw>0){B.atShiftDraw--;if(drawN(1))addLog("クラッチ蹴り：1枚引いた")}
    onShiftUp(g);
  }else B.rpm=nr;
  let m=C.mult[B.gear]+bonus;
  m+=B.nextBonus;B.nextBonus=0;
  if(has("turbo")&&B.gear>=2)m+=0.5;
  if(d.t==="atk"&&has("nitro")&&!B.nitroUsed){m+=1;B.nitroUsed=true;addLog("ニトロ！倍率 +1.0")}
  if(G.mode==="AT")m*=RULES.atMult;
  const L=limit();
  if(B.rpm>L){// BUG-15：リミットを「こえたら」
    if(G.mode==="AT"){m*=RULES.atLimiter;B.rpm=L;addLog("リミッター：火力が半分")}
    else if(isTopGear()){B.rpm=L;addLog("エンジンブロー！");ev({k:"blow"});G.hp=0;return finish("dead")}
    else if(overRev())return finish("dead");
  }
  m*=chainMul();// ★チェイン
  m=Math.min(m,RULES.multCap);// ★最終倍率の上限
  B.chain++;G.st.maxChain=Math.max(G.st.maxChain,B.chain);
  if(B.chain>=5&&!B.chain5){B.chain5=true;addCharge("チェイン5")}
  if(red)addCharge("レッドゾーン");
  if(d.sup&&has("carbon")){B.block+=2;ev({k:"pblk",v:2})}
  if(d.t==="atk"&&band&&d.band==="R"&&has("pipe")){B.e.burn+=2;ev({k:"burn",v:2})}
  m=Math.round(m*100)/100;
  let v=cardVal(c);if(band)v=rnum(v*(d.bm||RULES.bandMul),v);// ★帯
  const x=mkCtx(m);
  const runFx=()=>d.fx.forEach(f=>{const op=OPS[f[0]];if(op)op(x,...f.slice(1).map(a=>argOf(a,v)))});
  runFx();
  if(d.t==="atk"&&B.atkTwice&&!c.temp){B.atkTwice=false;addLog("もう1回！");runFx()}// ★パーフェクトのあと2回
  G.st.maxTurnDmg=Math.max(G.st.maxTurnDmg,B.turnDmg);
  if(!c.temp&&!d.exile)B.disc.push(c);
  if(B.e.hp<=0)return finish("win");
  if(G.hp<=0&&dead())return finish("dead");
  return checkAP();
}
function finish(r){if(!B.over)ev({k:r});B.over=true;B.result=r;if(r==="dead")G.hp=Math.max(0,G.hp);return r}
/* ガソリン0で、0目盛りで打てるカードがないなら相手の番 */
function checkAP(){if(B.gas<=0&&!B.hand.some(c=>gasOf(c)===0&&preview(c).ok)){addLog("ガソリンを使い切った → 相手の番へ");ev({k:"gasout"});return turnEnd()}return"ok"}
function parkCost(){return has("seq")||B.htTurn?RULES.gasPark-1:RULES.gasPark}
function downCost(){return has("seq")||B.htTurn?0:RULES.gasDown}
function parking(){
  if(B.over||G.mode!=="AT"||!canDraw())return"ok";const k=parkCost();if(B.gas<k)return"ok";
  B.gas-=k;ev({k:"down"});const n=drawN(1);ev({k:"draw",n});addLog(`パーキングレンジ：1枚引く（ガソリン ${k}）`);
  if(B.htBonus)B.nextBonus=Math.round((B.nextBonus+B.htBonus)*100)/100;return checkAP();
}
function downShiftRpm(){return Math.round(B.rpm/car().downDiv/100)*100}
function downShift(){
  if(B.over||B.gear===0||G.mode!=="MT"||!canDraw())return"ok";const k=downCost();if(B.gas<k)return"ok";
  B.gas-=k;B.gear--;B.rpm=downShiftRpm();ev({k:"down"});const n=drawN(1);ev({k:"draw",n});
  addLog(`シフトダウン → ${B.gear+1}速（回転 ${B.rpm}）・1枚引く（ガソリン ${k}）`);
  if(B.htBonus)B.nextBonus=Math.round((B.nextBonus+B.htBonus)*100)/100;
  if(B.rpm>limit()&&overRev())return finish("dead");
  return checkAP();
}
/* ターン終了（外から呼ぶのは endTurn。中では turnEnd を使う） */
function endTurn(){return turnEnd()}
function turnEnd(){
  if(B.over)return B.result;
  B.rpm=Math.max(car().idle,B.rpm-car().brake-(has("icool")?2000:0));
  B.pNext+=curDelay();
  addLog(`ターン終わり：回転 ${B.rpm}`);
  let guard=0;
  while(B.e.next<B.pNext&&guard++<20){const r=enemyStep();if(r)return finish(r)}
  startPlayerTurn(false);ev({k:"turn"});
  return"turn";
}
function curPat(e){return e.morph?e.morph[e.mi%e.morph.length]:e.pat}
function curAct(e){const p=curPat(e);return p[e.pi%p.length]}
function formOf(e){return e.morph&&e.forms?e.forms[e.mi%e.forms.length]:""}
function eAtk(e,v){return Math.max(0,Math.round(v*B.am)+e.atkUp-e.noise)}
function intent(e){const p=curAct(e);
  switch(p[0]){case"atk":return`攻撃 ${eAtk(e,p[1])}`;case"multi":return`攻撃 ${eAtk(e,p[1])}×${p[2]}`;case"prc":return`貫通 ${eAtk(e,p[1])}`;
   case"blk":return`防御 ${p[1]}`;case"buf":return`攻撃アップ ${p[1]}`;case"rev":return`回転 +${p[1]}`;case"jam":return`ジャマ（${CARDS[p[1]].n}×${p[2]}）`;case"apd":return"ガソリン −1";}return""}
function enemyHit(v,pierce){const e=B.e;let d=eAtk(e,v)+(e.mAdd||0);e.mAdd=0;const tire=Math.floor(B.gear*(0.5+0.25*G.tune.tire));d=Math.max(0,d-tire);
  const blk=pierce?0:Math.min(B.block,d);B.block-=blk;const hp=d-blk;G.hp-=hp;if(has("widebody")&&hp>0)B.wideAdd+=Math.floor(hp/2);ev({k:"phit",v:hp,blk});
  addLog(`${e.n} の${pierce?"貫通":"攻撃"}：${hp}ダメージ${blk?`（防御 −${blk}）`:""}${tire?`（タイヤ −${tire}）`:""}`)}
const ENEMY_OPS={
 atk:(e,v)=>enemyHit(v),
 multi:(e,v,n)=>{for(let k=0;k<n;k++)enemyHit(v)},
 prc:(e,v)=>enemyHit(v,true),
 blk:(e,v)=>{e.block+=v;if(e.mirror)e.mirrorArm=true;addLog(`${e.n} は防御 ${v}`);ev({k:"eblk",v})},
 buf:(e,v)=>{e.atkUp+=v;addLog(`${e.n} の攻撃 +${v}`)},
 rev:(e,v)=>{B.rpm=Math.min(limit(),B.rpm+v);addLog(`${e.n}：回転 +${v}`)},
 jam:(e,id,n)=>{for(let k=0;k<n;k++){const x=inst(id);x.temp=1;B.draw.splice(Math.floor(Math.random()*(B.draw.length+1)),0,x)}addLog(`${e.n}：山札に「${CARDS[id].n}」${n}枚`)},
 apd:(e,v)=>{B.apPen+=1;addLog(`${e.n}：次の番のガソリン −1`)},
};
/* 敵が1回動く。終わったら "win" / "dead"、続くなら null */
function enemyAct(){return enemyStep()}
function enemyStep(){
  const e=B.e;B.enemyActed=true;
  if(e.mirrorArm){e.mAdd=Math.floor(e.block*e.mirror);e.mirrorArm=false}
  e.block=e.blkKeep?Math.floor(e.block*e.blkKeep):0;
  if(e.burn>0){e.hp-=e.burn;addLog(`炎上で ${e.burn}ダメージ`);ev({k:"eburn",v:e.burn});e.burn--;if(e.hp<=0)return"win";checkPhase()}
  const pat=curPat(e),p=pat[e.pi%pat.length];e.pi++;
  if(e.morph&&e.pi>=pat.length){e.pi=0;e.mi++}
  ev({k:"eact",p:p[0]});
  ENEMY_OPS[p[0]](e,...p.slice(1));
  if(e.rage)e.atkUp+=e.rage;
  if(e.accel&&e.spdUp<6)e.spdUp+=e.accel;
  if(e.noise>0)e.noise--;
  e.next+=100/(e.spd+e.spdUp);
  if(G.hp<=0&&dead())return"dead";
  return null;
}
/* ガソリンを残すほど次の番が早い（1目盛り −10%・最大 −50%） */
function curDelay(){return(100/car().spd)*(1-RULES.gasSpeed*Math.min(5,Math.max(0,B.gas)))}
function timeline(){const out=[];let p=B.pNext,e=B.e.next;const pd=100/car().spd,ed=100/(B.e.spd+B.e.spdUp);let first=true;
  for(let i=0;i<7;i++){if(p<=e){out.push("p");p+=first?curDelay():pd;first=false}else{out.push("e");e+=ed}}return out}
/* 勝ったあと：お金など。画面は結果だけ受け取る */
function winRewards(){
  const key=B.key,E=ENEMIES[key],gd=RULES.gold;
  let gold=E.rank==="boss"?gd.boss:E.rank==="elite"?gd.elite:rnd(gd.battle[0],gd.battle[1]);if(has("cat"))gold+=gd.cat;
  const otk=!B.enemyActed;if(otk){gold+=gd.otk+(has("dashcam")?15:0);G.st.otk++}if(has("jack"))G.hp=Math.min(G.maxhp,G.hp+3);
  G.money+=gold;const ticket=Math.random()<RULES.ticketRate;if(ticket)G.tickets++;
  return{key,rank:E.rank||"battle",name:E.n,gold,otk,ticket};
}
/* リザルト（ミニカーの評価） */
function calcResult(clear){
  const st=G.st,rate=st.shiftTry?st.perfect/st.shiftTry:0,tuneSum=Object.values(G.tune).reduce((a,b)=>a+b,0),rows=G.map.length;
  const pts={到達:Math.min(st.rowsDone,rows)*5+(clear?20:0),最終ステータス:tuneSum*2,走りの質:Math.round(rate*20)+st.otk*4,MTボーナス:G.mode==="MT"?12:0,難易度:0};
  const total=Object.values(pts).reduce((a,b)=>a+b,0);
  let ri=0;RANK_TH.forEach(t=>{if(total>=t)ri++});ri=Math.min(ri,RANKS.length-1);
  return{pts,total,ri,rank:RANKS[ri],ten:shuffle(G.deck.slice()).slice(0,MC_DRAW)};
}
