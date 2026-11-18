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
/* ★v0.22 仲間3人の解放（design 9-10-5 の形。数がそろわないので、プログラム班のおすすめで割りふった＝tech-notes 1-16）
   初めから：◎5＋固有スキル＋3／その子でエリア1・2 を初めて突破：2ずつ／その子で初めての全クリア：エピック2／その子で S 以上のミニカー：1／その子で裏道：1。
   エリアの記録は "HINA:a1" の形（YUKI の表は今までどおり "a1"＝どのキャラでも）。パーツ：初めから1・エリア1 で1・全クリアで1 */
UNLOCK.chars={
  HINA:{start:["h_youda","h_gouda","h_kagerou","h_kneegrip","h_saitenka","h_sunrise","h_kickstart","h_hibana","h_hidamari"],
    a1:["h_asayake","h_nukiuchi"],a2:["h_shippu","h_mahiru"],clear:["h_nichirin","h_fullthrottle"],sRank:["h_fullbrake"],hidden:["h_memo"],
    parts:{start:["h_wheelie"],a1:["h_12inch"],clear:["h_bigbore"]}},
  MOMO:{start:["m_touka","m_rinjin","m_hanaguruma","m_softtop","m_kinen","m_hougou","m_cruise","m_harukaze","m_hanawa"],
    a1:["m_haruichiban","m_hanaakari"],a2:["m_hanafubuki","m_musubime"],clear:["m_mankai","m_kaerizaki"],sRank:["m_openair"],hidden:["m_hanami"],
    parts:{start:["m_horo"],a1:["m_light"],clear:["m_jinba"]}},
  NANA:{start:["n_koutotsu","n_hosaki","n_hachiren","n_downforce","n_houyoku","n_phoenix","n_paddle","n_teatime","n_teppeki"],
    a1:["n_hiiro","n_recordline"],a2:["n_totsugeki","n_shukumei"],clear:["n_gaisen","n_taikan"],sRank:["n_hokori"],hidden:["n_tenshou"],
    parts:{start:["n_seat"],a1:["n_paddleshifter"],clear:["n_activediff"]}},
};
function hiddenList(ch){return UNLOCK.chars[ch]?UNLOCK.chars[ch].hidden:UNLOCK.hidden}
function sRankList(ch){return UNLOCK.chars[ch]?UNLOCK.chars[ch].sRank:UNLOCK.sRank}
function sCountOf(p,ch){const u=p.unlock;return UNLOCK.chars[ch]?+((u.sCountC||{})[ch]||0):(u.sCount||0)}
function unlockedCards(p){const u=p.unlock,s=new Set(UNLOCK.startCards);
  (u.areas||[]).forEach(a=>(UNLOCK.area[a]||[]).forEach(id=>s.add(id)));
  UNLOCK.sRank.slice(0,u.sCount||0).forEach(id=>s.add(id));(u.cards||[]).forEach(id=>s.add(id));
  Object.entries(UNLOCK.chars).forEach(([ch,t])=>{t.start.forEach(id=>s.add(id));["a1","a2","clear"].forEach(a=>{if((u.areas||[]).includes(ch+":"+a))t[a].forEach(id=>s.add(id))});
    t.sRank.slice(0,sCountOf(p,ch)).forEach(id=>s.add(id))});
  return[...s].filter(id=>CARDS[id])}
function unlockedParts(p){const u=p.unlock,s=new Set(UNLOCK.startParts);
  (u.areas||[]).forEach(a=>(UNLOCK.areaParts[a]||[]).forEach(id=>s.add(id)));
  NIGHTS.filter(x=>x.n<=(u.nightMax||0)).forEach(x=>(x.open.parts||[]).forEach(id=>s.add(id)));(u.parts||[]).forEach(id=>s.add(id));
  Object.entries(UNLOCK.chars).forEach(([ch,t])=>{t.parts.start.forEach(id=>s.add(id));["a1","clear"].forEach(a=>{if((u.areas||[]).includes(ch+":"+a))t.parts[a].forEach(id=>s.add(id))})});
  return[...s].filter(id=>PARTS[id])}
/* 移行のあと・読みこみのあと：数で持っている解放（S の回数）を一覧にも入れる（減らさない） */
function unlockRecalc(p){const u=p.unlock;UNLOCK.sRank.slice(0,u.sCount||0).forEach(id=>{if(!u.cards.includes(id))u.cards.push(id)});
  Object.keys(UNLOCK.chars).forEach(ch=>sRankList(ch).slice(0,sCountOf(p,ch)).forEach(id=>{if(!u.cards.includes(id))u.cards.push(id)}));return p}
