"use strict";
/* ===== ★v0.21 解放の表：design v0.6 9-5・9-6・9-7（おすすめで進めた・★progression 1-5）=====
   セーブには「とったもの」だけを書く（unlock.cards・parts・chars・story・areas・nightMax・sCount）。
   使えるもの＝START ＋ 条件（areas・nightMax）＋ とったもの。unlockedCards(p)・unlockedParts(p) で出す。 */
const UNLOCK={
  startCards:["braking","qshift","slip","blip","hyouga","hakusen","sasame","counter","whiteout","shironeko","ebrake","pitboard","backfire","cooldown","shimo","kazahana","rikka","tsurara"],
  area:{a1:["pitin","fubuki","hyoujin"],a2:["hakunetsu","muhyou","clutchk"],clear:["rinkai","eikyu","nadare"]},
  sRank:["heeltoe","rikkamai","setsuka","senbon"],             // S 以上のミニカーを作るたびに、この順で1枚
  hidden:["hyouen","kyokkou","renpou","saihyou"],             // 裏道で勝つと、まだのものから1枚
  shop:[["drift",100],["hyouheki",100],["oilchange",150],["fuelcut",150],["dblclutch",150]],   // ラン後の強化ショップ（ログ）
  startParts:["turbo","nitro","lsd","closs","clutch","oilcool","boost","cat","hook","grip","cage","jack","launch","pacenote","widebody"],
  areaParts:{a1:["flywheel","icool","carbon"],a2:["limiter","hicam","pipe"],clear:["seq","slick","emblem"]},
  // ログ（ラン後のマネー・名前は案 A）
  log:{a1:20,a2:30,clear:50,elite:5,hidden:10,rank:{E:0,D:2,C:5,B:8,A:12,S:20,SS:30,SSS:40},nightBonus:0.1},
  hiddenRate:0.35,hiddenRows:[3,8],hiddenTurns:5,hiddenMul:1.1,hiddenGold:30,hiddenAllGold:50,
};
function unlockedCards(p){const u=p.unlock,s=new Set(UNLOCK.startCards);
  (u.areas||[]).forEach(a=>(UNLOCK.area[a]||[]).forEach(id=>s.add(id)));
  UNLOCK.sRank.slice(0,u.sCount||0).forEach(id=>s.add(id));(u.cards||[]).forEach(id=>s.add(id));
  return[...s].filter(id=>CARDS[id])}
function unlockedParts(p){const u=p.unlock,s=new Set(UNLOCK.startParts);
  (u.areas||[]).forEach(a=>(UNLOCK.areaParts[a]||[]).forEach(id=>s.add(id)));
  NIGHTS.filter(x=>x.n<=(u.nightMax||0)).forEach(x=>(x.open.parts||[]).forEach(id=>s.add(id)));(u.parts||[]).forEach(id=>s.add(id));
  return[...s].filter(id=>PARTS[id])}
/* 移行のあと・読みこみのあと：数で持っている解放（S の回数）を一覧にも入れる（減らさない） */
function unlockRecalc(p){const u=p.unlock;UNLOCK.sRank.slice(0,u.sCount||0).forEach(id=>{if(!u.cards.includes(id))u.cards.push(id)});return p}
