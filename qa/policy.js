"use strict";
/* ===== ボットの考え方（α2：design のシムのボットにそろえた）=====
   smart：打てる手を1つずつ「ためしに打って」点をつけ、いちばんよい手を選ぶ（1手先読み）。
   random：でたらめ。
   画面なし（qa/sim.js）でも、ページの中（Playwright）でも同じものを使う。engine.js のグローバル（G・B など）を見る。 */
const BOT={
  snap(){return{g:structuredClone(G),b:structuredClone(B),u:uidN}},
  load(s){G=s.g;B=s.b;uidN=s.u},
  score(r,hp0,ehp0,gear0,hand0){
    if(r==="dead")return -1e6;
    if(r==="win")return 1e5+G.hp*20;
    let s=(ehp0-B.e.hp)*10-(hp0-G.hp)*15+(B.gear-gear0)*8+(B.hand.length-hand0)*2;
    const it=curAct(B.e);
    if(it[0]==="atk"||it[0]==="multi")s+=Math.min(B.block,(it[1]+B.e.atkUp)*(it[2]||1))*3;
    if(B.rpm>=redLo()&&G.mode==="MT"&&isTopGear())s-=20;// ブローの手前は危ない
    return s;
  },
  /* 戦闘の1手：{t:"play",i,shift}｜{t:"end"}｜{t:"down"}｜{t:"park"} */
  battle(kind){
    const acts=[];
    B.hand.forEach((c,i)=>{const p=preview(c);if(!p.ok)return;/* ★v0.22.22 LD 11-17（チーフ承認 A）：「入れかえる意味がなければ打たない」を外した。オート（js/bot.js）はデザイン班の決めまでそのまま */
      if(G.mode==="MT"&&p.canShift){acts.push({t:"play",i,shift:true});if(!CD(c).shiftCard)acts.push({t:"play",i,shift:false})}
      else acts.push({t:"play",i,shift:false})});
    if(canDraw()){if(G.mode==="MT"&&B.gear>0&&B.gas>=downCost())acts.push({t:"down"});if(G.mode==="AT"&&B.gas>=parkCost())acts.push({t:"park"})}
    acts.push({t:"end"});
    if(kind==="random"){
      const safe=acts.filter(a=>!(a.t==="play"&&preview(B.hand[a.i]).danger==="blow"&&!a.shift));
      return Math.random()<0.12?{t:"end"}:pick(safe.length?safe:acts);
    }
    let best=null,bs=-Infinity;
    for(const a of acts){
      const s0=BOT.snap(),hp0=G.hp,ehp0=B.e.hp,gear0=B.gear,hand0=B.hand.length;
      const r=BOT.run(a);let s=BOT.score(r,hp0,ehp0,gear0,hand0);
      if(a.t==="end")s-=5;if(a.t==="down")s-=12;if(a.t==="park")s-=10;
      BOT.load(s0);
      if(s>bs){bs=s;best=a}
    }
    return best;
  },
  run(a){return a.t==="play"?playCard(a.i,a.shift):a.t==="down"?downShift():a.t==="park"?parking():endTurn()},
  /* マップ：どのマスに入るか */
  node(kind){const r=G.map[G.row];if(kind==="random")return Math.floor(Math.random()*r.length);
    const pref=G.hp<G.maxhp*0.5?["garage","shop","lucky","battle","sim","elite","boss"]:["shop","lucky","elite","battle","sim","garage","boss"];
    let bi=0,bv=99;r.forEach((n,j)=>{let v=pref.indexOf(n.k);if(n.k==="shop"&&G.money<40)v+=3;if(v<bv){bv=v;bi=j}});return bi},
  CARD_PREF:["nadare","eikyu","rinkai","whiteout","rikka","rikkamai","tsurara","hakunetsu","hakusen","muhyou","fubuki","kazahana","shimo","slip","counter","clutchk","hyoujin","heeltoe","backfire","sasame","pitin","cooldown","ebrake","oilchange","pitboard","qshift","blip","braking","hyouga"],
  reward(kind,opts){if(kind==="random")return Math.random()<0.2?null:pick(opts);
    let b=null,bv=99;opts.forEach(id=>{const v=BOT.CARD_PREF.indexOf(id);if(v>=0&&v<bv){bv=v;b=id}});return b},
  UP_PREF:["whiteout","nadare","hakusen","rikka","hyouga","shironeko","counter","muhyou","slip","tsurara","shimo","kazahana"],
  upgrade(kind){const t=upgradeTargets();if(!t.length)return -1;if(kind==="random")return pick(t);
    for(const id of BOT.UP_PREF){const i=t.find(k=>G.deck[k].id===id);if(i!=null)return i}return t[0]},
  TUNE_PREF:["ecu","engine","light","tire","shift"],
};
/* 画面なしで1ラン走る（qa/sim.js 用）。戻り値：{clear,hp,row,steps,err} */
function botRunHeadless(mode,kind,maxSteps){
  maxSteps=maxSteps||20000;newRunState(mode,"YUKI",[]);let steps=0;
  while(G.row<G.map.length){
    const j=BOT.node(kind),n=G.map[G.row][j];G.path[G.row]=j;
    if(n.k==="battle"||n.k==="elite"||n.k==="boss"){
      startBattleState(nodeEnemy(n));let r=B.over?B.result:"ok";
      while(r!=="win"&&r!=="dead"){if(++steps>maxSteps)return{clear:false,row:G.row,area:n.a,steps,err:"止まった（手数が多すぎる）"};r=BOT.run(BOT.battle(kind))}
      if(r==="dead")return{clear:false,hp:0,row:G.row,area:n.a,steps};
      const w=winRewards();
      {const id=BOT.reward(kind,rewardOptions(w.rank));if(id)G.deck.push(inst(id))}
      if(w.rank!=="battle"){const o=partOptions(3);if(o.length)addPart(o[0],0)}
    }else if(n.k==="shop"){
      for(const k of BOT.TUNE_PREF){const pr=tunePrice(k,n,false);if(pr!=null&&G.money>=pr+(kind==="random"?0:10))buyTune(k,pr,false)}
      if(n.feat){const pool=partPool();n.featPart=pool.length?pick(pool):null;if(n.featPart)buyFeat(n,shopPrice(featCost(),n,false),false,G.parts.length>=RULES.partsMax?0:-1)}
    }else if(n.k==="sim"){const i=BOT.upgrade(kind);if(i>=0)G.deck[i].up=true}
    else if(n.k==="lucky"){const o=partOptions(3);if(o.length)addPart(o[0],0)}
    else if(n.k==="garage"){G.hp=Math.min(G.maxhp,G.hp+restAmount())}
    advanceRow();
  }
  return{clear:true,hp:G.hp,row:G.row,area:3,steps};
}
/* ページの中で1歩すすめる（Playwright 用）。画面を見て、画面の関数を押す。ランが終わってタイトルにもどったら "done" */
function botUiStep(kind,o){if(window.TUTORIAL_ON){closeModal();tutFinish();return"ok"}
  o=o||{};const sc=window.SCREEN;
  if(typeof busy==="function"&&busy())uiSkip();// モーションは飛ばす（押したら次へ）
  if(document.querySelector("#modal .modal"))closeModal();
  switch(sc){
    case"title":return"done";
    case"scene":sceneSkip();return"ok";
    case"garage":if(o.bring&&S.mcAll.length){toggleBring(0);if(S.mcAll.length>1)toggleBring(1);startWithMinicars()}else newRun(S.mcMode);return"ok";
    case"map":enterNode(BOT.node(kind));return"ok";
    case"battle":{if(B.over){uiSkip();return"ok"}const a=BOT.battle(kind);
      if(a.t==="play"){
        // 画面の道をとおす：1回目のタップで説明（選ぶ）、説明の小窓のボタンで打つ
        clickCard(a.i);doPlay(a.i,a.shift)}
      else if(a.t==="down")doDownShift();else if(a.t==="park")doParking();else doEndTurn();return"ok"}
    case"win":takeCard(S.rewards.length?BOT.reward(kind,S.rewards):null);return"ok";
    case"parts":if(S.partOpts.length&&(kind==="random"?Math.random()<0.8:true)){const full=G.parts.length>=RULES.partsMax;takePart(S.partOpts[0]);if(full&&S.slotOk){closeModal();S.slotOk(0)}}else S.pdone();return"ok";
    case"shop":{for(const k of BOT.TUNE_PREF){const pr=tunePrice(k,S.shop,false);if(pr!=null&&G.money>=pr+(kind==="random"?0:10))uiBuyTune(k)}
      if(S.shop.feat&&S.shop.featPart&&!S.shop.featBought&&G.money>=featCost()){const full=G.parts.length>=RULES.partsMax;uiBuyFeat();if(full&&S.slotOk){closeModal();S.slotOk(0)}}
      S.useTicket=false;nextRow();return"ok"}
    case"sim":{const i=BOT.upgrade(kind);if(i>=0)uiUpgrade(i);else nextRow();return"ok"}
    case"rest":G.hp=Math.min(G.maxhp,G.hp+restAmount());nextRow();return"ok";
    case"result":{for(let i=0;i<S.need;i++)togglePick(i);saveCar();return"ok"}
    case"release":S.relSel=0;releaseMinicar();return"ok";
  }
  return"unknown:"+sc;
}
