"use strict";
/* ===== β のボット（v14 の後継・v0.21）：qa/policy.js（v14）のあとに読む =====
   v14 の考え方（1手先読み・カードの好み）はそのまま。足したもの：
   ・夜・キャラ・解放の状態を指定してランを始める（BETA.run(mode,{night,char,ul,hidden,pref})）
   ・裏道のマス（hidden）：エリートと同じ扱いで選ぶ。逃げられた（escape）ら報酬なしで次へ
   ・新しいカード10種の好み（pref:"beta"）。pref:"v14"＝v14 の好みのまま（新しいカードは取らない）、pref:"noepic"＝エピックをいちばん後ろに
   ゲームの engine.js・data/*.js をそのまま使う（数字はゲームと同じ）。 */
const BETA={
  PREF:{v14:null,
    beta:["nadare","eikyu","rinkai","senbon","kyokkou","whiteout","rikka","renpou","rikkamai","setsuka","tsurara","hakunetsu","hyouen","saihyou","hakusen","muhyou","fubuki","kazahana","shimo","hyouheki","slip","drift","pitsign"/* ★v0.22.151 E14 */,"counter","clutchk","dblclutch","hyoujin","heeltoe","backfire","sasame","pitin","cooldown","ebrake","oilchange","fuelcut","pitboard","qshift","braking","blip","hyouga"]},
  NODE_PREF:{hi:["shop","lucky","hidden","elite","battle","sim","garage","boss"],lo:["garage","shop","lucky","battle","sim","hidden","elite","boss"]},
  /* ★v0.22 仲間：その子の専用カードを E → R → C（アタック先）の順で前に足す（仮の好み） */
  allyPref(ch){const rk={R:0,C:1,E:2};return Object.keys(CARDS).filter(id=>CARDS[id].own===ch&&CARDS[id].r!=="SK").sort((a,b)=>rk[CARDS[a].r]-rk[CARDS[b].r]||(CARDS[a].t==="atk"?0:1)-(CARDS[b].t==="atk"?0:1))},
  pref(name,ch){if(ch&&ch!=="YUKI")return BETA.allyPref(ch).concat(BOT.CARD_PREF.filter(id=>CARDS[id]&&CARDS[id].own==="N"));const base=BOT.CARD_PREF.slice();if(!name||name==="v14")return base;
    if(name==="noepic"){const e=base.filter(id=>CARDS[id]&&CARDS[id].r==="E");return base.filter(id=>!e.includes(id)).concat(e)}
    return BETA.PREF[name]||base},
  /* ★v0.22.133 LD：道の選び方 ROUTE=hot（★v0.22.137）／fight（戦闘・エリート・裏道を先に＝熱い道）／garage（ボスの前の段にガレージがあれば必ず選ぶ＝冷ます道）／なし＝今のまま */
  route:null,
  /* ★v0.22.151 E14（design 24-4）：ボットも合成する（遊ぶ人に近い測りに）。FUSE=0 で前の形（合成しない）。合成できる組が複数なら、エピックになる組 → 先の組（★v0.22.155 から強化ずみ同士の組だけ） */
  fuse:true,cnt:{fuse:0,rot:0},
  fusePick(){const fo=fuseOptions().filter(o=>o.up);/* ★v0.22.155 design 24-7（C）：材料が2枚とも強化ずみのときだけ合成（②のフルオートと同じ形） */if(!fo.length)return null;const rk=o=>(rarityOf(o.id)==="E"?2:0)+(o.up?1:0);return fo.slice().sort((x,y)=>rk(y)-rk(x))[0]},
  node(){const r=G.map[G.row];if(BETA.route==="fight"){const P=["elite","hidden","battle","shop","lucky","sim","garage","boss"];let bi=0,bv=99;r.forEach((n,j)=>{const v=P.indexOf(n.k);if(v>=0&&v<bv){bv=v;bi=j}});return bi}
    if(BETA.route==="hot"){const lo=G.hp<G.maxhp*0.5,P=lo?["garage","shop","lucky","sim","battle","hidden","elite","boss"]:["elite","hidden","battle","shop","lucky","sim","garage","boss"];let bi=0,bv=99;r.forEach((n,j)=>{const v=P.indexOf(n.k);if(v>=0&&v<bv){bv=v;bi=j}});return bi}/* ★v0.22.137 ROUTE=hot：戦闘を先に・体力が半分より下ならガレージ */
    if(BETA.route==="garage"){const nx=G.map[G.row+1];if(nx&&nx[0]&&nx[0].k==="boss"){const g=r.findIndex(n=>n.k==="garage");if(g>=0)return g}}
    const pref=G.hp<G.maxhp*0.5?BETA.NODE_PREF.lo:BETA.NODE_PREF.hi;
    let bi=0,bv=99;r.forEach((n,j)=>{let v=pref.indexOf(n.k);if(v<0)v=50;if(n.k==="shop"&&G.money<40)v+=3;if(v<bv){bv=v;bi=j}});return bi},
  /* ul：{cards:[...],parts:[...]}（null＝全部）。戻り値：{clear,area,row,hp,night,hidden,elites,log,steps,err} */
  run(mode,o){o=o||{};const kind=o.kind||"smart",save=BOT.CARD_PREF;BOT.CARD_PREF=BETA.pref(o.pref,o.char);
    try{newRunState(mode,o.char||"YUKI",[],null,{ghost:o.ghost||null,night:o.night||1,ul:o.ul?{cards:o.ul.cards.slice(),parts:o.ul.parts.slice()}:null,hidden:!!o.hidden});if(BETA.wx)G.map.flat().forEach(x=>{if(x.wx&&x.k!=="boss")x.wx=BETA.wx});
      let steps=0;const max=o.maxSteps||20000;
      while(G.row<G.map.length){const j=kind==="random"?Math.floor(Math.random()*G.map[G.row].length):BETA.node(),n=G.map[G.row][j];G.path[G.row]=j;
        if(n.k==="battle"||n.k==="elite"||n.k==="boss"||n.k==="hidden"){/* ★v0.22.3 その子のボス（零号の前に連戦）。o.noAllyBoss で外す */
          const ab=!o.noAllyBoss&&n.k==="boss"&&typeof ALLY_BOSS!=="undefined"&&ALLY_BOSS[G.char]&&AREAS[n.a].boss==="boss3"?ALLY_BOSS[G.char]:null;
          for(const ek of ab?[ab,nodeEnemy(n)]:[nodeEnemy(n)]){startBattleState(ek);let r=B.over?B.result:"ok";
          const wst=B.e.weakGear&&o.stats?(o.stats[ek]=o.stats[ek]||{n:0,win:0,atk:0,weak:0}):null;if(wst)wst.n++;
          if(BETA.weak===2&&B.e.weakGear){const wg=B.e.weakGear;G.weakSeen=G.weakSeen||{};(Array.isArray(wg)?wg.map((x,i)=>ek+":"+i):[ek]).forEach(k=>G.weakSeen[k]=1)}/* ★v0.22.126 WEAK=2：はじめから知っている（図鑑に残っている2回目からのラン） */
          while(r!=="win"&&r!=="dead"&&r!=="escape"){if(++steps>max)return BETA.out(false,n,steps,"止まった（手数が多すぎる）");const a=BOT.battle(kind);
            const isAtk=wst&&a.t==="play"&&B.hand[a.i]&&CD(B.hand[a.i]).t==="atk",e0=B.ev.length;r=BOT.run(a);
            if(isAtk){wst.atk++;if(B.ev.slice(e0).some(x=>x.k==="weakFound"||x.k==="weakHit"))wst.weak++}}
          if(wst&&r==="win")wst.win++;
          if(r==="dead")return BETA.out(false,n,steps);
          if(r==="win"&&ENEMIES[ek]&&ENEMIES[ek].ghost){winRewards();const own=Object.keys(PARTS).filter(p=>PARTS[p].own===G.char&&!G.parts.includes(p));const op=own.length?own:partOptions(3);if(op.length)addPart(op[0],0);if(o.gstat)o.gstat.won++}/* ★v0.22.137 ゴーストの報酬（ボットは自分の専用パーツ） */
          else if(r==="win"){const w=winRewards();if(w.rank!=="hidden"){const id=BOT.reward(kind,rewardOptions(w.rank));if(id)G.deck.push(inst(id))}
            if(w.rank==="elite"||w.rank==="boss"){const op=partOptions(3);if(op.length)addPart(op[0],0)}}}}
        else if(n.k==="shop"){for(const k of BOT.TUNE_PREF){const pr=tunePrice(k,n,false);if(pr!=null&&G.money>=pr+10)buyTune(k,pr,false)}
          if(n.feat){const pool=partPool();n.featPart=pool.length?pick(pool):null;if(n.featPart)buyFeat(n,shopPrice(featCost(),n,false),false,G.parts.length>=RULES.partsMax?0:-1)}}
        else if(n.k==="sim"){const fo=BETA.fuse&&kind!=="random"?BETA.fusePick():null;if(fo){fuseCards(fo);BETA.cnt.fuse++}else{const i=BOT.upgrade(kind);if(i>=0)G.deck[i].up=true}}/* ★v0.22.151 E14：合成できるならシムで合成（強化1回ぶん） */
        else if(n.k==="lucky"){const op=partOptions(3);if(op.length)addPart(op[0],0)}
        else if(n.k==="garage"){G.hp=Math.min(G.maxhp,G.hp+restAmount())}
        advanceRow()}
      return BETA.out(true,{a:3},steps)}finally{BOT.CARD_PREF=save}},
  /* ★v0.22.126 LD balance 11-84：弱点ギアを狙うボット。WEAK=0 狙わない（今のまま）／1 見つけたらその戦闘（形ごと）は弱点のギアに合わせて打つ／2 はじめから知っている。
     ギアの合わせ方：MT はシフトアップ・ダウン、AT は低い方へはパーキング・キックダウン（高い方は自動にまかせる）。先読みの点に「弱点のギアで当てる」と「弱点のギアへ近づく」を足す */
  weak:0,WEAK_HIT:25,WEAK_STEP:15,
  weakDist(gear){const w=weakOf(B.e);if(!w)return 0;const g=gear+1,[a,b]=weakRange(w);return g<a?a-g:g>b?g-b:0},
  weakOn(){return BETA.weak>0&&B&&B.e&&B.e.weakGear&&weakKnown(B.e)},
  out(clear,n,steps,err){const lg=runLog(clear,null);return{rec:{char:G.char,result:clear?"clear":"lose",reach:{area:clear?3:(n.a||0)+1,row:G.row},deck:G.deck.filter(c=>!c.gen).map(c=>({id:c.id,up:c.up?1:0}))},ghostMet:G.ghostMet||0,ghostWon:G.ghostWon||0,heatMax:G.heatMax||0,clear,area:clear?3:n.a,row:G.row,hp:G.hp,night:G.night,hidden:G.st.hidden,hiddenCards:(G.hiddenWon||[]).slice(),elites:G.st.elites,log:lg.total,steps,err}},
  /* 解放の状態から ul を作る（ゲームの unlockedCards・unlockedParts と同じ）。prog：{areas,nightMax,sCount,cards,parts} または "start"｜"all" */
  ul(prog){if(prog==="all")return null;const u=Object.assign({chars:["YUKI"],sCountC:{},cards:[],parts:[],story:[],stages:[],nightMax:0,sCount:0,areas:[]},prog==="start"?{}:prog||{});
    const p={unlock:u};return{cards:unlockedCards(p),parts:unlockedParts(p)}},
};

/* ★v0.22.126 WEAK：BOT の先読みの点に足す（BETA.weak が 0 なら何も変えない） */
(function(){const sc=BOT.score,bt=BOT.battle;
  BOT.battle=function(kind){BETA._on=BETA.weakOn();BETA._ev0=B?B.ev.length:0;BETA._d0=BETA._on?BETA.weakDist(B.gear):0;return bt.call(BOT,kind)};
  BOT.score=function(r,hp0,ehp0,gear0,hand0){let s=sc.call(BOT,r,hp0,ehp0,gear0,hand0);if(!BETA._on||r==="dead"||r==="win"||!B)return s;
    if(B.ev.slice(BETA._ev0).some(x=>x.k==="weakHit"||x.k==="weakFound"))s+=BETA.WEAK_HIT;
    const d1=BETA.weakDist(B.gear),dd=BETA._d0-d1;if(dd&&!(G.mode==="AT"&&B.gear>gear0))s+=dd*BETA.WEAK_STEP;/* AT の高い方は自動にまかせる（上がった分は数えない） */
    return s}})();

/* ★v0.22.151 E14：本当の手で打ったローテーションを数える（BOT.battle の中の試し打ちは数えない） */
(function(){let tr=0;const b=BOT.battle;BOT.battle=function(k){tr++;try{return b.call(BOT,k)}finally{tr--}};
  const r=BOT.run;BOT.run=function(a){if(!tr&&a&&a.t==="play"&&B&&B.hand&&B.hand[a.i]&&B.hand[a.i].id==="pitsign")BETA.cnt.rot++;return r.call(BOT,a)}})();
