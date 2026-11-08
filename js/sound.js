"use strict";
/* ===== 音のつなぎ（α3・プログラム班）=====
   音そのものはサウンド班の js/audio.js v0.4（window.AUDIO。合成・ファイルなし）。ここは「いつ鳴らすか」だけ。
   つなぎ方は revremit-audio-list.md 6章の表のとおり。
   ★音の方向 B・エンジン音は本物寄り・SE は試聴ページのまま（虎雪 08:19）。
   ★エンジン音は回転数が変わったあと約2秒だけ（AUDIO.engineBurst。続けて呼ぶと前を切る）。 */
const SND={on:true,
  ok(){return SND.on&&window.AUDIO},
  call(f){if(!SND.ok())return;try{f(AUDIO)}catch(e){}},
  unlock(){if(window.AUDIO){try{AUDIO.unlock();AUDIO.setEngineType("real");AUDIO.mute(!SND.on)}catch(e){}}},
  car(){const C=G?G.car:CHARS.YUKI.car,b=G&&B?bandRange():{lo:C.band[0],hi:C.band[1]};return{idle:C.idle,bandLo:b.lo,bandHi:b.hi,red:G&&B?redLo():C.red,limit:G?limit():C.limit}},
  setCar(){SND.call(A=>A.setCar(SND.car()))},
  se(id,o){SND.call(A=>A.se(id,o))},
  attack(v){SND.call(A=>A.attack(v))},
  engineBurst(from,to){if(from===to)return;SND.call(A=>{A.setCar(SND.car());A.engineBurst(from,to)});SND.red(to)},
  engineStop(){SND.call(A=>A.engineStop())},
  limiter(){SND.call(A=>A.overrev())},
  blow(){SND.call(A=>A.blow())},
  /* BGM：同じ曲なら鳴らしなおさない（audio.js 側で判定） */
  bgm(id){SND.call(A=>A.bgm(id))},
  bgmStop(){SND.call(A=>A.bgmStop())},
  jingle(id){SND.call(A=>A.jingle(id))},
  /* レッドゾーンにいるあいだ BGM にハイパス */
  redOn:false,red(rpm){const on=!!(G&&B&&rpm>=redLo()&&!B.over);if(on!==SND.redOn){SND.redOn=on;SND.call(A=>A.redFilter(on))}},
  /* 場面ごとの曲（audio-list 6章）。ショップ・会話などの曲がまだないところはマップの曲を流用 */
  areaBgm(kind){const a=G?curArea().key:"street",k={street:"street",touge:"touge",circuit:"circuit"}[a]||"street";
    if(kind==="battle"){const E=ENEMIES[B.key];SND.bgm(E.rank==="boss"?{boss1:"boss_zankou",boss2:"boss_byakuya",boss3:"boss_zerogou"}[B.key]:E.rank==="elite"?"elite":"battle_"+k)}
    else SND.bgm("map_"+k)},
  toggle(){SND.on=!SND.on;try{localStorage.setItem("revremit_sound",SND.on?"1":"0")}catch(e){}if(window.AUDIO)try{AUDIO.mute(!SND.on);if(!SND.on)AUDIO.engineStop()}catch(e){}},
};
try{SND.on=localStorage.getItem("revremit_sound")!=="0"}catch(e){}
/* スマホは最初のタップのあとでないと鳴らない */
addEventListener("pointerdown",()=>SND.unlock(),{once:true});
