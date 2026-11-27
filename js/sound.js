"use strict";
/* ===== 音のつなぎ（α3・プログラム班）=====
   音そのものはサウンド班の js/audio.js v0.10（window.AUDIO。合成・ファイルなし）。ここは「いつ鳴らすか」だけ。
   つなぎ方は revremit-audio-list.md 6章の表のとおり。
   ★音の方向 B・エンジン音は本物寄り・SE は試聴ページのまま（虎雪 08:19）。
   ★エンジン音は回転数が変わったあと約2秒だけ（AUDIO.engineBurst。続けて呼ぶと前を切る）。 */
const SND={on:true,
  ok(){return SND.on&&window.AUDIO},
  call(f){if(!SND.ok())return;try{f(AUDIO)}catch(e){}},
  unlock(){if(window.AUDIO){try{AUDIO.unlock();AUDIO.setEngineType("real");AUDIO.mute(!SND.on)}catch(e){}}},
  car(){const C=G?G.car:CHARS.YUKI.car,b=G&&B?bandRange():{lo:C.band[0],hi:C.band[1]};return{idle:C.idle,bandLo:b.lo,bandHi:b.hi,red:G&&B?redLo():C.red,limit:G?limit():C.limit,cvt:!!(G&&G.char==="MIO")}},/* ★v0.22.194 audio v0.32 23-1：MIO は CVT のエンジン音（β にはいない＝今は何も変わらない） */
  setCar(){SND.call(A=>A.setCar(SND.car()))},
  se(id,o){SND.call(A=>A.se(id,o))},
  attack(v){SND.call(A=>A.attack(v))},
  /* ★v0.22.4 audio v0.10：ブローのある夜（NIGHT 3〜）で、いちばん上のギアなら {top:true}（レッドの警告が速く） */
  engineTop(){return!!(G&&B&&!B.over&&typeof isTopGear==="function"&&isTopGear()&&!noBlow())},
  engineBurst(from,to){if(from===to)return;const top=SND.engineTop();SND.call(A=>{A.setCar(SND.car());A.engineBurst(from,to,top?{top:true}:undefined)});SND.red(to)},
  engineStop(){SND.call(A=>A.engineStop())},
  limiter(){SND.call(A=>A.overrev())},
  blow(){SND.call(A=>A.blow())},
  /* BGM：同じ曲なら鳴らしなおさない（audio.js 側で判定） */
  bgm(id){SND.cur=id;SND.call(A=>A.bgm(id));SND.gear(true)},
  bgmStop(){SND.call(A=>A.bgmStop())},
  jingle(id,o){SND.call(A=>A.jingle(id,o))},
  /* レッドゾーンにいるあいだ BGM にハイパス */
  redOn:false,red(rpm){const on=!!(G&&B&&rpm>=redLo()&&!B.over);if(on!==SND.redOn){SND.redOn=on;SND.call(A=>{A.redFilter(on);A.redLoop&&A.redLoop(on,{level:SND.redLv()})})}}/* ★v0.22.64 ⑤・★v0.22.127 設定の強さ */,
  redLv(){const m=(typeof OPTS!=="undefined"&&OPTS.redFx)||"full";return m==="off"?0:m==="weak"?0.5:1},
  /* ★v0.22.127 ギアで重なる BGM（design 10-18 F）：エリアの戦闘曲3曲（battle_*）だけ、今のギア／段の数で4パート（いつも・中・高い・最大）。AT も同じ。ほかの曲・設定「切」は全部のパート */
  gearOn(){return!(typeof OPTS!=="undefined"&&OPTS.bgmLayer===false)&&/^battle_/.test(SND.cur||"")&&window.SCREEN==="battle"&&B&&!B.over},
  gear(force){const on=SND.gearOn(),key=on?(B.gear+1)+"/"+car().gears:"all";if(!force&&key===SND.gKey)return;SND.gKey=key;SND.call(A=>{if(!A.bgmGear)return;if(on)A.bgmGear(B.gear+1,{max:car().gears});else A.bgmLayers("DBHMX")})},
  /* 場面ごとの曲（audio-list 6章）。ショップ・会話などの曲がまだないところはマップの曲を流用 */
  areaBgm(kind){const a=G?curArea().key:"street",k={street:"street",touge:"touge",circuit:"circuit"}[a]||"street";
    if(kind==="battle"){const E=ENEMIES[B.key],ally=G.char&&G.char!=="YUKI"?"theme_"+G.char.toLowerCase():null;// ★v0.22.1 仲間のランはふつうの戦闘を3エリアともその子のテーマ・裏道は hidden（audio-list 6-2）
      SND.bgm(B.hidden?"hidden":E.rank==="boss"?(window.AUDIO&&AUDIO.bossBgm&&AUDIO.bossBgm(B.key))/* ★② v0.5.19 audio v0.29 20-1：新しい6体も */||{boss1:"boss_zankou",boss2:"boss_byakuya",boss3:"boss_zerogou",kuuten:"boss_kuuten",sanka:"boss_sanka",miketsu:"boss_miketsu"}[B.key]:E.rank==="elite"?"elite":ally||"battle_"+k)}
    else SND.bgm("map_"+k)},
  toggle(){SND.on=!SND.on;try{localStorage.setItem("revremit_sound",SND.on?"1":"0")}catch(e){}if(window.AUDIO)try{AUDIO.mute(!SND.on);if(!SND.on)AUDIO.engineStop()}catch(e){}},
};
try{SND.on=localStorage.getItem("revremit_sound")!=="0"}catch(e){}
/* スマホは最初のタップのあとでないと鳴らない */
addEventListener("pointerdown",()=>SND.unlock(),{once:true});
