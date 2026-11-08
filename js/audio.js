/* Rev:Remit audio.js v0.4（サウンド班 2026-11-07。v0.3 は同日、v0.2 は 2026-11-05）
 * SE 26本・本物寄りの合成エンジン音・BGM（方向 B：チップ＋シンセ）・ジングル。音のファイルなし（WebAudio で合成）。ライブラリなし。
 * ★虎雪 08:19：音の方向 B／エンジン音は本物寄り／SE はこのまま。★08:20：エンジン音は回転が変わったときだけ約2秒。★07:31：ボイスなし。
 * 正本：revremit-audio-list.md（6章に使い方とつなぎ方の表）。
 *
 *   AUDIO.unlock()                    タイトルの最初のタップで1回
 *   AUDIO.se(id) / AUDIO.attack(ダメージ)
 *   AUDIO.setCar({idle,bandLo,bandHi,red,limit})   ラン開始で G.car から
 *   AUDIO.engineBurst(前の回転, 新しい回転)        回転が変わったら（約2秒で消える。続けて呼ぶと前を切る）
 *   AUDIO.overrev() / AUDIO.blow() / AUDIO.engineStop()
 *   AUDIO.bgm(id) / AUDIO.bgmStop() / AUDIO.redFilter(bool) / AUDIO.jingle(id)
 *   AUDIO.setVolume("master"|"se"|"engine"|"bgm", 0〜1) / AUDIO.mute(bool)
 * v0.3：BGM（title・shop・result・pzlog・talk・ending・tutorial）、SE 17本（固有スキル・状態異常・ショップ・パーツ・ミニカー・評価・会話・チュートリアル）、
 *       AUDIO.se(id,{lv}) で強化の段、AUDIO.se('rank_high',{tier:1〜3}) で S・SS・SSS。
 * v0.4：chain_up（{lv:チェインの段}で段ごとに高く）・gas_refill（{perfect:true}でもう一段明るく）・gas_empty。
 */
(function(){
"use strict";
// ---------- 共通 ----------
const NB=new WeakMap();
function noiseBuf(c){let b=NB.get(c);if(b)return b;b=c.createBuffer(1,c.sampleRate*2,c.sampleRate);const d=b.getChannelData(0);let s=12345;for(let i=0;i<d.length;i++){s=(s*1103515245+12345)>>>0;d[i]=(s/4294967296)*2-1;}NB.set(c,b);return b;}
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
const WV=new WeakMap();
function pulse(c,d){let m=WV.get(c);if(!m){m={};WV.set(c,m);}if(m[d])return m[d];const N=48,re=new Float32Array(N),im=new Float32Array(N);for(let n=1;n<N;n++){re[n]=2/(n*Math.PI)*Math.sin(2*Math.PI*n*d);im[n]=2/(n*Math.PI)*(1-Math.cos(2*Math.PI*n*d));}return m[d]=c.createPeriodicWave(re,im);}
const mf=m=>440*Math.pow(2,(m-69)/12);
function tone(c,o,t,p){const{type='sine',f=440,f2=null,dur=.2,g=.5,a=.003,lin=false,wave=null,det=0,lp=null,hold=0}=p;
 const os=c.createOscillator();if(wave)os.setPeriodicWave(pulse(c,wave));else os.type=type;
 os.frequency.setValueAtTime(f,t);if(f2){lin?os.frequency.linearRampToValueAtTime(f2,t+dur):os.frequency.exponentialRampToValueAtTime(f2,t+dur);}os.detune.value=det;
 const gn=c.createGain();gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(g,t+a);if(hold)gn.gain.setValueAtTime(g,t+a+hold);gn.gain.exponentialRampToValueAtTime(.0001,t+dur);
 let n=os;if(lp){const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=lp;os.connect(f);n=f;}
 n.connect(gn).connect(o);os.start(t);os.stop(t+dur+.03);return os;}
function nz(c,o,t,p){const{dur=.2,g=.5,a=.002,ft='bandpass',f=1000,f2=null,q=1,hold=0}=p;
 const s=c.createBufferSource();s.buffer=noiseBuf(c);s.loop=true;const fl=c.createBiquadFilter();fl.type=ft;fl.Q.value=q;fl.frequency.setValueAtTime(f,t);if(f2)fl.frequency.exponentialRampToValueAtTime(f2,t+dur);
 const gn=c.createGain();gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(g,t+a);if(hold)gn.gain.setValueAtTime(g,t+a+hold);gn.gain.exponentialRampToValueAtTime(.0001,t+dur);
 s.connect(fl).connect(gn).connect(o);s.start(t,Math.random()*1.5);s.stop(t+dur+.03);}
const click=(c,o,t,g=.5)=>{nz(c,o,t,{ft:'highpass',f:4000,dur:.025,g});tone(c,o,t,{type:'square',f:2200,dur:.015,g:g*.25});};

// ---------- SE（◎） ----------
const SE=[
{id:'card_draw',name:'カードを引く',dur:.25,fn:(c,o,t)=>{nz(c,o,t,{f:2500,f2:6000,dur:.12,g:.45,q:1.5});tone(c,o,t+.05,{wave:.25,f:1568,dur:.06,g:.12});}},
{id:'card_attack_s',name:'アタック（小）',dur:.3,fn:(c,o,t)=>{tone(c,o,t,{type:'square',f:220,f2:80,dur:.08,g:.35});nz(c,o,t,{f:3000,q:2,dur:.1,g:.5});tone(c,o,t+.01,{type:'triangle',f:1200,dur:.15,g:.12});tone(c,o,t+.02,{type:'triangle',f:1750,dur:.12,g:.08});}},
{id:'card_attack_m',name:'アタック（中）',dur:.45,fn:(c,o,t)=>{tone(c,o,t,{f:170,f2:50,dur:.18,g:.75});nz(c,o,t,{ft:'lowpass',f:4500,f2:900,dur:.16,g:.55});tone(c,o,t+.01,{type:'triangle',f:900,dur:.28,g:.12});tone(c,o,t+.02,{type:'triangle',f:1310,dur:.24,g:.09});click(c,o,t+.03,.3);}},
{id:'card_attack_l',name:'アタック（大）',dur:.8,fn:(c,o,t)=>{tone(c,o,t,{f:140,f2:35,dur:.38,g:.95});nz(c,o,t,{ft:'lowpass',f:3000,f2:300,dur:.45,g:.75});tone(c,o,t,{type:'square',f:90,f2:40,dur:.22,g:.22,lp:900});[700,1020,1530].forEach((f,i)=>tone(c,o,t+.01*i,{type:'triangle',f,dur:.55,g:.1}));click(c,o,t+.04,.4);}},
{id:'card_guard',name:'ガードを打つ',dur:.4,fn:(c,o,t)=>{tone(c,o,t,{f:110,f2:60,dur:.25,g:.8});nz(c,o,t,{f:1500,dur:.06,g:.3});tone(c,o,t+.01,{type:'triangle',f:620,dur:.32,g:.14});tone(c,o,t+.01,{type:'triangle',f:930,dur:.26,g:.09});}},
{id:'card_cant',name:'打てない（＝ui_error・お金が足りないも同じ）',dur:.22,fn:(c,o,t)=>{tone(c,o,t,{type:'square',f:110,dur:.18,g:.18,a:.005,hold:.1,lp:1800});tone(c,o,t,{type:'square',f:116,dur:.18,g:.14,a:.005,hold:.1,lp:1800});}},
{id:'rev_up',name:'回転が上がる（1000→4000・本物寄り）',dur:2.2,fn:(c,o,t)=>burst(c,o,t,1000,4000,'real')},
{id:'shift_good',name:'シフトアップ：グッド',dur:.35,fn:(c,o,t)=>{click(c,o,t,.3);tone(c,o,t,{type:'sawtooth',f:300,f2:120,dur:.14,g:.15,lp:900});tone(c,o,t+.05,{wave:.25,f:988,dur:.08,g:.17});tone(c,o,t+.11,{wave:.25,f:1319,dur:.16,g:.17});}},
{id:'shift_perfect',name:'シフトアップ：パーフェクト',dur:.9,fn:(c,o,t)=>{click(c,o,t,.3);tone(c,o,t,{type:'sawtooth',f:300,f2:120,dur:.14,g:.15,lp:900});nz(c,o,t+.03,{f:3200,f2:1200,dur:.3,g:.3,q:.8});[1319,1760,2637].forEach((f,i)=>tone(c,o,t+.05+i*.05,{wave:.25,f,dur:.12,g:.15}));[2093,2637,3136].forEach((f,i)=>{tone(c,o,t+.2+i*.06,{f,dur:.6,g:.12});tone(c,o,t+.2+i*.06,{f:f*2.76,dur:.25,g:.03});});}},
{id:'shift_early',name:'シフトアップ：早すぎ',dur:.35,fn:(c,o,t)=>{click(c,o,t,.4);tone(c,o,t,{type:'sawtooth',f:140,f2:55,dur:.25,g:.25,lp:500});tone(c,o,t+.02,{f:95,f2:50,dur:.16,g:.6});tone(c,o,t+.05,{type:'square',f:220,f2:196,dur:.15,g:.08});}},
{id:'shift_down',name:'シフトダウン（MT）',dur:.45,fn:(c,o,t)=>{const os=tone(c,o,t,{type:'sawtooth',f:70,dur:.32,g:.3,a:.02,hold:.18,lp:1100});os.frequency.linearRampToValueAtTime(170,t+.15);os.frequency.linearRampToValueAtTime(135,t+.3);tone(c,o,t,{type:'square',f:35,dur:.3,g:.12,lp:400});click(c,o,t+.2,.5);}},
{id:'parking',name:'パーキングレンジ（AT）',dur:.4,fn:(c,o,t)=>{tone(c,o,t,{f:90,f2:55,dur:.3,g:.8});nz(c,o,t,{ft:'lowpass',f:800,dur:.12,g:.5});tone(c,o,t+.18,{type:'square',f:1800,dur:.025,g:.18});nz(c,o,t+.18,{ft:'highpass',f:5000,dur:.03,g:.4});}},
{id:'overrev',name:'オーバーレブ（耐久が減る）',dur:.7,fn:(c,o,t)=>{for(let i=0;i<10;i++)tone(c,o,t+i*.045,{type:'sawtooth',f:235,dur:.035,g:.28,lp:1600});tone(c,o,t,{type:'triangle',f:2400,f2:2050,dur:.55,g:.045});[0,.18].forEach(d=>tone(c,o,t+.1+d,{type:'square',f:1760,dur:.08,g:.13,hold:.05}));}},
{id:'redzone_warn',name:'レッドゾーンの警告（1回分。ゲームではくり返す）',dur:.22,fn:(c,o,t)=>{tone(c,o,t,{type:'square',f:2093,dur:.06,g:.16,hold:.04});tone(c,o,t+.09,{type:'square',f:2093,dur:.06,g:.16,hold:.04});}},
{id:'engine_blow',name:'エンジンブロー（即死）',dur:1.9,fn:(c,o,t)=>{tone(c,o,t,{f:80,f2:28,dur:.9,g:1});nz(c,o,t,{ft:'lowpass',f:3500,f2:150,dur:1.1,g:.9});const r=rng(7);for(let i=0;i<7;i++)tone(c,o,t+.1+r()*.6,{type:'triangle',f:1500+r()*2500,dur:.15,g:.07});const os=tone(c,o,t+.25,{type:'sawtooth',f:75,f2:18,dur:1.4,g:.22,lp:420});}},
{id:'hit_enemy',name:'敵にダメージ',dur:.25,fn:(c,o,t)=>{nz(c,o,t,{f:2000,dur:.08,g:.5});tone(c,o,t,{type:'square',f:180,f2:70,dur:.1,g:.28});[0,.03,.06].forEach(d=>tone(c,o,t+.04+d,{type:'square',f:3200,dur:.018,g:.07}));}},
{id:'hit_player',name:'自分にダメージ（耐久が減る）',dur:.6,fn:(c,o,t)=>{tone(c,o,t,{f:120,f2:50,dur:.2,g:.7});[520,780,1170].forEach(f=>tone(c,o,t,{type:'triangle',f,dur:.3,g:.08}));nz(c,o,t,{f:1200,dur:.08,g:.4});[.18,.3,.38].forEach((d,i)=>tone(c,o,t+d,{type:'sawtooth',f:62-i*6,dur:.07,g:.22,lp:500}));}},
{id:'guard_block',name:'防御で受けた',dur:.3,fn:(c,o,t)=>{tone(c,o,t,{type:'triangle',f:1800,dur:.25,g:.24});tone(c,o,t,{f:2700,dur:.2,g:.1});nz(c,o,t,{ft:'highpass',f:6000,dur:.02,g:.3});}},
{id:'enemy_turn',name:'敵の番が来た',dur:.5,fn:(c,o,t)=>{nz(c,o,t,{f:1200,f2:3000,dur:.18,g:.18});tone(c,o,t+.1,{type:'triangle',f:147,dur:.38,g:.45});}},
{id:'enemy_attack_warn',name:'敵の攻撃の予告',dur:.2,fn:(c,o,t)=>{tone(c,o,t,{type:'square',f:1175,dur:.06,g:.15,hold:.04});tone(c,o,t+.09,{type:'square',f:880,dur:.07,g:.15,hold:.04});}},
{id:'enemy_attack',name:'敵の攻撃（実行・共通）',dur:.45,fn:(c,o,t)=>{nz(c,o,t,{f:800,f2:2500,dur:.15,g:.3,a:.06});tone(c,o,t+.12,{f:150,f2:45,dur:.25,g:.8});nz(c,o,t+.12,{ft:'lowpass',f:2500,dur:.15,g:.5});}},
{id:'turn_end',name:'ターン終了（エンジンブレーキ）',dur:.75,fn:(c,o,t)=>{nz(c,o,t,{ft:'highpass',f:3000,dur:.03,g:.4});tone(c,o,t+.03,{type:'triangle',f:1400,dur:.04,g:.15});tone(c,o,t+.05,{type:'sawtooth',f:160,f2:60,dur:.6,g:.2,a:.03,lp:600});}},
{id:'enemy_down',name:'敵を倒した（ゴーストがほどける）',dur:.75,fn:(c,o,t)=>{const r=rng(3);for(let i=0;i<14;i++)nz(c,o,t+i*.035,{f:4000-i*220,dur:.03,g:.25,q:3});for(let i=0;i<8;i++)tone(c,o,t+i*.03,{type:'square',f:200+r()*1800,dur:.03,g:.08});tone(c,o,t+.2,{type:'triangle',f:800,f2:100,dur:.45,g:.15});}},
{id:'ui_ok',name:'決定',dur:.15,fn:(c,o,t)=>{tone(c,o,t,{wave:.25,f:1047,dur:.04,g:.18});tone(c,o,t+.04,{wave:.25,f:1568,dur:.07,g:.18});}},
{id:'ui_cancel',name:'戻る',dur:.15,fn:(c,o,t)=>{tone(c,o,t,{type:'triangle',f:392,f2:262,dur:.11,g:.4});}},
{id:'map_select',name:'マスを選ぶ・進む',dur:.4,fn:(c,o,t)=>{nz(c,o,t,{ft:'lowpass',f:700,dur:.22,g:.35,a:.03});for(let i=0;i<4;i++)nz(c,o,t+i*.05,{f:1200,dur:.02,g:.12,q:4});tone(c,o,t+.18,{wave:.25,f:784,dur:.05,g:.16});tone(c,o,t+.23,{wave:.25,f:1175,dur:.09,g:.16});}},
];

// ---------- エンジン ----------
function Engine(c,out,variant){
 const game=variant==='game';const g=c.createGain();g.gain.value=0;g.connect(out);
 const lp=c.createBiquadFilter();lp.type='lowpass';lp.Q.value=game?3:1.1;lp.connect(g);
 const fparams=[],oscs=[];let rate=[];
 function osc(type,mul,gain,dest,det=0){const o=c.createOscillator();o.type=type;o.detune.value=det;const gg=c.createGain();gg.gain.value=gain;o.connect(gg).connect(dest||lp);fparams.push(o.frequency);rate.push(mul);oscs.push(o);return o;}
 const fq=r=>game?40+r*.022:r/30, lf=r=>game?400+r*.42:220+r*.55;
 let lfo=null;
 if(game){osc('sawtooth',1,.32);osc('sawtooth',1,.26,null,14);osc('square',.5,.2);}
 else{const sh=c.createWaveShaper();const cv=new Float32Array(1024);for(let i=0;i<1024;i++){const x=i/511.5-1;cv[i]=Math.tanh(x*3.2);}sh.curve=cv;sh.connect(lp);
  const pre=c.createGain();pre.gain.value=.9;pre.connect(sh);osc('sawtooth',1,.5,pre);osc('sine',.5,.6,pre);osc('triangle',2,.12,pre);
  const s=c.createBufferSource();s.buffer=noiseBuf(c);s.loop=true;const bp=c.createBiquadFilter();bp.type='bandpass';bp.Q.value=2;bp.frequency.value=900;const am=c.createGain();am.gain.value=.12;s.connect(bp).connect(am).connect(lp);
  lfo=osc('square',1,.12,am.gain);oscs.push(s);fparams.push(bp.frequency);rate.push(5);}
 return{start(t,vol=.3){oscs.forEach(o=>o.start(t));g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.06);this.vol=vol;},
  set(rpm,t,glide=.25){const f=fq(rpm);fparams.forEach((p,i)=>glide?p.setTargetAtTime(f*rate[i],t,glide/3):p.setValueAtTime(f*rate[i],t));glide?lp.frequency.setTargetAtTime(lf(rpm),t,glide/3):lp.frequency.setValueAtTime(lf(rpm),t);},
  cut(t,d=.03){g.gain.setValueAtTime(this.vol,t);g.gain.linearRampToValueAtTime(this.vol*.15,t+.005);g.gain.setValueAtTime(this.vol*.15,t+d);g.gain.linearRampToValueAtTime(this.vol,t+d+.005);},
  fade(t,d){g.gain.setValueAtTime(this.vol,t);g.gain.linearRampToValueAtTime(0,t+d);},
  stop(t){g.gain.cancelScheduledValues(t);g.gain.setTargetAtTime(0,t,.04);oscs.forEach(o=>o.stop(t+.3));}};
}
const LV={shift_good:1.4,shift_perfect:1.5,card_draw:3,card_attack_s:1.3,card_attack_m:.9,card_attack_l:.6,card_cant:1.8,rev_up:1.6,shift_down:1.2,overrev:1.8,redzone_warn:3,engine_blow:.6,hit_enemy:1.6,guard_block:1.5,enemy_turn:1.5,enemy_attack_warn:3,turn_end:1.6,enemy_down:3,ui_ok:3,ui_cancel:1.5,map_select:3.5};

// ---------- SE 追加（v0.3・2026-11-07）：固有スキル・状態異常・ショップ・パーツ・ミニカー・評価・会話・チュートリアル ----------
SE.push(
{id:'card_skill',name:'固有スキル（白猫の護り）',dur:1.4,fn:(c,o,t)=>{[2093,2637,3136,4186].forEach((f,i)=>{tone(c,o,t+i*.06,{f,dur:.7,g:.1});tone(c,o,t+i*.06,{f:f*2.76,dur:.25,g:.025});});
 for(let i=0;i<8;i++)nz(c,o,t+.15+i*.04,{f:3000+i*500,dur:.03,g:.18,q:4});tone(c,o,t+.45,{f:110,f2:55,dur:.5,g:.85});tone(c,o,t+.46,{type:'triangle',f:620,dur:.5,g:.12});tone(c,o,t+.46,{type:'triangle',f:930,dur:.45,g:.08});nz(c,o,t+.45,{ft:'highpass',f:5000,f2:9000,dur:.8,g:.06,a:.05,hold:.2});}},
{id:'freeze',name:'凍結（かかる）',dur:.7,fn:(c,o,t)=>{const r=rng(31);for(let i=0;i<10;i++)nz(c,o,t+r()*.4,{f:3000+r()*4000,dur:.025,g:.3,q:5});tone(c,o,t+.05,{f:2637,dur:.45,g:.09});tone(c,o,t+.05,{f:2637*2.76,dur:.15,g:.02});}},
{id:'burn',name:'炎上（かかる・番のはじめのダメージ）',dur:.6,fn:(c,o,t)=>{nz(c,o,t,{ft:'lowpass',f:1600,dur:.05,g:.9});tone(c,o,t,{f:95,f2:40,dur:.12,g:.6});nz(c,o,t+.04,{f:800,f2:2200,dur:.45,g:.3,a:.06,q:.7});}},
{id:'noise',name:'ノイズ（かかる）',dur:.55,fn:(c,o,t)=>{for(let i=0;i<5;i++)nz(c,o,t+i*.08,{ft:'highpass',f:2000,dur:.06,g:.3});const r=rng(41);for(let i=0;i<6;i++)tone(c,o,t+i*.06,{type:'square',f:300+r()*2000,dur:.04,g:.05});}},
{id:'shop_buy',name:'買った（チューニング）',dur:.6,fn:(c,o,t)=>{tone(c,o,t,{f:2637,dur:.25,g:.12});tone(c,o,t+.06,{f:3520,dur:.3,g:.1});for(let i=0;i<6;i++)tone(c,o,t+.2+i*.035,{type:'square',f:1200,dur:.025,g:.06});nz(c,o,t+.2,{ft:'highpass',f:3000,dur:.2,g:.08});}},
{id:'shop_sale',name:'セール・目玉商品',dur:.6,fn:(c,o,t)=>{[1568,1976,2349,3136].forEach((f,i)=>{tone(c,o,t+i*.07,{f,dur:.35,g:.1});tone(c,o,t+i*.07,{wave:.25,f,dur:.06,g:.06});});}},
{id:'tune_up',name:'部位を強化（段が上がるほど高い）',dur:.5,fn:(c,o,t,p)=>{const k=Math.pow(2,(((p&&p.lv)||1)-1)*2/12);[784,988,1319].forEach((f,i)=>tone(c,o,t+i*.07,{wave:.25,f:f*k,dur:.12,g:.15}));tone(c,o,t+.21,{f:2637*k,dur:.3,g:.05});}},
{id:'part_get',name:'パーツを取った',dur:.8,fn:(c,o,t)=>{[523,659,784,1047,1319].forEach((f,i)=>tone(c,o,t+i*.06,{wave:.25,f,dur:.12,g:.14}));tone(c,o,t+.34,{type:'triangle',f:1800,dur:.18,g:.15});tone(c,o,t+.34,{type:'triangle',f:2600,dur:.14,g:.1});nz(c,o,t+.34,{ft:'highpass',f:5000,dur:.03,g:.35});tone(c,o,t+.36,{f:2093,dur:.4,g:.06});}},
{id:'part_swap',name:'パーツの入れ替え',dur:.5,fn:(c,o,t)=>{click(c,o,t,.4);tone(c,o,t,{type:'triangle',f:1400,f2:900,dur:.1,g:.12});click(c,o,t+.22,.5);tone(c,o,t+.22,{type:'triangle',f:1800,dur:.12,g:.14});}},
{id:'card_upgrade',name:'カード強化・合成（シム）',dur:.7,fn:(c,o,t)=>{[0,2,4,5,7,9,11,12].forEach((s,i)=>tone(c,o,t+i*.035,{wave:.125,f:mf(76+s),dur:.05,g:.1}));tone(c,o,t+.3,{f:mf(100),dur:.35,g:.06});nz(c,o,t+.3,{ft:'highpass',f:6000,dur:.3,g:.05,a:.03});}},
{id:'minicar_make',name:'ミニカー完成',dur:.9,fn:(c,o,t)=>{tone(c,o,t,{f:600,dur:.05,g:.4});tone(c,o,t,{type:'triangle',f:1200,dur:.04,g:.15});nz(c,o,t,{ft:'lowpass',f:2000,dur:.03,g:.3});
 [1568,2093,2637,3136].forEach((f,i)=>tone(c,o,t+.18+i*.08,{f,dur:.45,g:.08}));}},
{id:'rank_low',name:'評価 E・D・C',dur:.6,fn:(c,o,t)=>{tone(c,o,t,{type:'triangle',f:523,dur:.25,g:.3});tone(c,o,t+.18,{type:'triangle',f:659,dur:.35,g:.3});}},
{id:'rank_mid',name:'評価 B・A',dur:.7,fn:(c,o,t)=>{[659,784,1047].forEach((f,i)=>tone(c,o,t+i*.1,{wave:.25,f,dur:i===2?.4:.12,g:.16,hold:i===2?.15:0}));}},
{id:'rank_high',name:'評価 S・SS・SSS（{tier:1〜3} で重ねる）',dur:1.6,fn:(c,o,t,p)=>{const n=Math.max(1,Math.min(3,(p&&p.tier)||1));
 for(let k=0;k<n;k++){const m=Math.pow(2,k*4/12),d=k*.28;[784,988,1175,1568].forEach((f,i)=>tone(c,o,t+d+i*.06,{wave:.25,f:f*m,dur:.12,g:.13}));}
 const e=.3+(n-1)*.28;[784,988,1175].forEach(f=>[-8,8].forEach(dt=>tone(c,o,t+e,{type:'sawtooth',f,det:dt,dur:.9,g:.04,a:.02,hold:.4,lp:2400})));tone(c,o,t+e,{wave:.25,f:1568*Math.pow(2,(n-1)*4/12),dur:.8,g:.13,hold:.3});tone(c,o,t+e,{f:130,f2:42,dur:.3,g:.6});}},
{id:'text_blip',name:'会話の文字送り（1文字）',dur:.04,fn:(c,o,t)=>{tone(c,o,t,{wave:.25,f:1568,dur:.02,g:.06});}},
{id:'text_next',name:'会話のページ送り',dur:.12,fn:(c,o,t)=>{tone(c,o,t,{wave:.25,f:1047,dur:.04,g:.12});tone(c,o,t+.04,{wave:.25,f:1319,dur:.05,g:.12});}},
{id:'tut_ok',name:'チュートリアル「できた」',dur:.5,fn:(c,o,t)=>{tone(c,o,t,{f:1319,dur:.3,g:.12});tone(c,o,t+.08,{f:1760,dur:.35,g:.12});tone(c,o,t+.08,{f:1760*2.76,dur:.12,g:.02});}},
);
Object.assign(LV,{card_skill:1.2,freeze:3,burn:1.2,noise:1.6,shop_buy:2,shop_sale:2.2,tune_up:2,part_get:1.8,part_swap:2,card_upgrade:2.2,minicar_make:1.6,rank_low:1.5,rank_mid:2,rank_high:1.6,text_blip:4,text_next:2,tut_ok:2.2});

// ---------- SE 追加（v0.4・2026-11-07）：チェイン・ガソリン（窓口 11:07「レースみたいな爽快感・コンビネーション感」） ----------
// チェイン：A マイナー・ペンタトニックを段ごとに1音ずつ上がる。4段から きらめき、6段から 吹け上がりの「シュッ」と低い「ドン」を足す。8段より上は8段の音＋もっと明るく
const CHAIN_N=[81,84,86,88,91,93,96,98];
SE.push(
{id:'chain_up',name:'チェインが伸びた（{lv:段} で段ごとに高く）',dur:.6,fn:(c,o,t,p)=>{const lv=Math.max(1,(p&&p.lv)||1),k=Math.min(lv,8)-1,m=CHAIN_N[k],x=lv>8?12:0;
 tone(c,o,t,{wave:.25,f:mf(m-12+x),dur:.07,g:.12});tone(c,o,t+.035,{wave:.25,f:mf(m+x),dur:.16,g:.16,hold:.04});tone(c,o,t+.035,{wave:.125,f:mf(m+7+x),dur:.12,g:.06});
 tone(c,o,t+.035,{f:mf(m+12+x),dur:.35,g:.06});nz(c,o,t,{ft:'highpass',f:5000,dur:.05,g:.18});
 if(lv>=4)[0,1,2].forEach(i=>tone(c,o,t+.09+i*.04,{f:mf(m+12+[0,4,7][i]+x),dur:.25,g:.04}));
 if(lv>=6){nz(c,o,t,{f:1500,f2:6000,dur:.18,g:.18,a:.05,q:.8});tone(c,o,t,{f:120,f2:50,dur:.18,g:.5});}
 if(lv>8)tone(c,o,t+.2,{f:mf(m+24),dur:.4,g:.04});}},
{id:'gas_refill',name:'ガソリンがもどった（{perfect:true} でもう一段明るく）',dur:.7,fn:(c,o,t,p)=>{const pf=p&&p.perfect;
 nz(c,o,t,{f:800,f2:pf?7000:4500,dur:.22,g:.2,a:.06,q:1.2});tone(c,o,t+.05,{wave:.25,f:mf(76),dur:.08,g:.13});tone(c,o,t+.11,{wave:.25,f:mf(81),dur:.14,g:.14});
 if(pf){[88,93,96].forEach((n,i)=>{tone(c,o,t+.17+i*.05,{f:mf(n),dur:.4,g:.08});tone(c,o,t+.17+i*.05,{f:mf(n)*2.76,dur:.15,g:.02});});tone(c,o,t+.17,{wave:.25,f:mf(88),dur:.18,g:.12});}}},
{id:'gas_empty',name:'ガソリンが空になった（相手の番へ）',dur:.8,fn:(c,o,t)=>{nz(c,o,t,{f:3000,f2:400,dur:.45,g:.28,a:.01,q:.9});
 tone(c,o,t+.05,{wave:.25,f:mf(69),f2:mf(57),dur:.3,g:.12});tone(c,o,t+.32,{type:'triangle',f:mf(45),dur:.4,g:.35});tone(c,o,t+.32,{type:'square',f:mf(45),dur:.25,g:.04,lp:600});}},
);
Object.assign(LV,{chain_up:2.2,gas_refill:2.4,gas_empty:1.8});

// ---------- エンジン：本物寄り（★RA-03 2026-11-05 08:19） ----------
// 録音は使わない合成（ライセンスの心配なし・ファイル0）。4気筒の爆発の間隔（回転÷30 Hz）を音の芯にして、
// 排気の共鳴（160Hz・650Hz）・吸気のノイズ・回転のゆらぎ・踏んだときのうなり・戻したときのパンパン（アフターファイア）を足す。
const PW=new WeakMap();
function firingWave(c){let w=PW.get(c);if(w)return w;const N=40,re=new Float32Array(N),im=new Float32Array(N),r=rng(21);
 for(let n=1;n<N;n++){const a=Math.pow(n,-.75)*(n%2?1:1.35);const ph=r()*Math.PI*2;re[n]=a*Math.cos(ph);im[n]=a*Math.sin(ph);}w=c.createPeriodicWave(re,im);PW.set(c,w);return w;}
function EngineReal(c,out){
 const g=c.createGain();g.gain.value=0;g.connect(out);
 const load=c.createGain();load.gain.value=.75;load.connect(g);
 const lp=c.createBiquadFilter();lp.type='lowpass';lp.Q.value=.8;lp.connect(load);
 const pk2=c.createBiquadFilter();pk2.type='peaking';pk2.frequency.value=650;pk2.Q.value=1.4;pk2.gain.value=7;pk2.connect(lp);
 const pk1=c.createBiquadFilter();pk1.type='peaking';pk1.frequency.value=160;pk1.Q.value=1.1;pk1.gain.value=6;pk1.connect(pk2);
 const sh=c.createWaveShaper();const cv=new Float32Array(1024);for(let i=0;i<1024;i++){const x=i/511.5-1;cv[i]=Math.tanh(x*2.6);}sh.curve=cv;sh.connect(pk1);
 const pre=c.createGain();pre.gain.value=.85;pre.connect(sh);
 const o1=c.createOscillator();o1.setPeriodicWave(firingWave(c));const g1=c.createGain();g1.gain.value=.5;o1.connect(g1).connect(pre);
 const o2=c.createOscillator();o2.type='sine';const g2=c.createGain();g2.gain.value=.38;o2.connect(g2).connect(pre);   // 半分の次数（クランク2回転で1周）
 // 回転のゆらぎ（少しだけ不規則に）
 const jn=c.createBufferSource();jn.buffer=noiseBuf(c);jn.loop=true;const jl=c.createBiquadFilter();jl.type='lowpass';jl.frequency.value=7;const jg=c.createGain();jg.gain.value=180;
 jn.connect(jl).connect(jg);jg.connect(o1.detune);jg.connect(o2.detune);
 // 吸気のノイズ（爆発に合わせてゆれる）
 const ns=c.createBufferSource();ns.buffer=noiseBuf(c);ns.loop=true;const bp=c.createBiquadFilter();bp.type='bandpass';bp.Q.value=1.2;bp.frequency.value=1600;
 const am=c.createGain();am.gain.value=.05;ns.connect(bp).connect(am).connect(lp);
 const mo=c.createOscillator();mo.type='square';const mg=c.createGain();mg.gain.value=.05;mo.connect(mg).connect(am.gain);
 const srcs=[o1,o2,jn,ns,mo];let prev=1000,vol=.34;
 const ff=r=>Math.max(8,r/30);
 return{start(t,v=.34){vol=v;srcs.forEach(s=>s.start(t));g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.05);},
  set(rpm,t,glide=.3){const f=ff(rpm),tc=glide?glide/3:0;
   const S=(p,v)=>glide?p.setTargetAtTime(v,t,tc):p.setValueAtTime(v,t);
   S(o1.frequency,f);S(o2.frequency,f/2);S(mo.frequency,f);S(lp.frequency,350+rpm*.6);S(bp.frequency,1200+rpm*.15);
   if(glide){if(rpm>prev+300){load.gain.setTargetAtTime(1.15,t,.03);load.gain.setTargetAtTime(.75,t+glide+.25,.25);lp.frequency.setTargetAtTime(900+rpm*.8,t,.03);lp.frequency.setTargetAtTime(350+rpm*.6,t+glide+.2,.3);}
    else if(rpm<prev-800){load.gain.setTargetAtTime(.55,t,.08);const r=rng(Math.round(t*1000));for(let i=0;i<3;i++)nz(c,g,t+.15+r()*.6,{ft:'lowpass',f:1400,dur:.03,g:.9});}}
   prev=rpm;},
  cut(t,d=.03){g.gain.setValueAtTime(vol,t);g.gain.linearRampToValueAtTime(vol*.12,t+.005);g.gain.setValueAtTime(vol*.12,t+d);g.gain.linearRampToValueAtTime(vol,t+d+.005);},
  fade(t,d){g.gain.setValueAtTime(vol,t);g.gain.linearRampToValueAtTime(0,t+d);},
  stop(t){g.gain.cancelScheduledValues(t);g.gain.setTargetAtTime(0,t,.04);srcs.forEach(s=>s.stop(t+.3));},
  get vol(){return vol;}};
}
function makeEngine(c,o,type){return type==='game'?Engine(c,o,'game'):EngineReal(c,o);}
// ★虎雪 08:20：エンジン音は鳴りっぱなしにしない。回転が変わったときだけ「前の回転 → 新しい回転」を約2秒鳴らして消す。
// 1回分の音（WAV の書き出しにも使う）
function burst(c,o,t,from,to,type,opt){opt=opt||{};const dur=opt.dur||2.0,car=Object.assign({},YUKI,opt.car||{});
 const e=makeEngine(c,o,type);const v=type==='game'?.28:.34;e.start(t,v);e.set(from,t,0);
 const up=to>from;e.set(to,t+.05,up?.35:.6);
 if(opt.limiter){const L=car.limit;for(let i=0;i<8;i++){e.set(i%2?L+80:L-260,t+.35+i*.055,0);e.cut(t+.35+i*.055,.02);}e.set(L,t+.8,.05);}
 if(up&&to>=car.bandLo&&to<=car.bandHi&&from<car.bandLo)tone(c,o,t+.3,{type:'square',f:3400,dur:.02,g:.05});
 const fadeAt=t+dur*.45;e.fade(fadeAt,dur*.55);e.stop(t+dur+.05);return e;
}
const YUKI={idle:1000,bandLo:5500,bandHi:6500,red:7000,limit:8000};

// ---------- BGM（★RA-02＝B チップ＋シンセ。WebAudio で演奏・ファイル0） ----------
const N={A2:45,C3:48,D3:50,E2:40,F2:41,G2:43,B2:47,D2:38,Eb2:39,C2:36,Bb2:46};
const CHD={Am:[57,60,64],F:[53,57,60],C:[55,60,64],G:[55,59,62],E:[56,59,64],Dm:[57,62,65],Em:[55,59,64],D:[54,57,62],Bm:[54,59,62],B:[54,59,63],Gm:[55,58,62],Eb:[55,58,63],Cm:[55,60,63],Dmaj:[54,57,62]};
const ROOT={Am:45,F:41,C:48,G:43,E:40,Dm:50,Em:40,D:50,Bm:47,B:47,Gm:43,Eb:39,Cm:48,Dmaj:38};
// 曲：ch＝和音（1小節ずつ）、ld＝主旋律 [16分の位置, 音, 長さ]、dr＝ドラムの型、pass＝くり返しの2周目の変化
const SONGS={
 battle_street:{bpm:150,dr:'four',bells:true,
  ch:['Am','F','C','G','Am','F','G','E','Dm','Em','F','G','F','G','E','E'],
  ld:[[[0,69,4],[4,72,4],[8,76,8]],[[0,74,6],[6,72,2],[8,71,8]],[[0,72,4],[4,76,4],[8,79,4],[12,76,4]],[[0,74,12],[12,71,4]],
      [[0,69,4],[4,72,4],[8,76,4],[12,81,4]],[[0,79,4],[4,77,4],[8,76,8]],[[0,74,4],[4,76,4],[8,77,4],[12,74,4]],[[0,76,8],[8,68,8]],
      [[0,77,4],[4,76,4],[8,74,8]],[[0,76,4],[4,74,4],[8,71,8]],[[0,72,4],[4,74,4],[8,76,4],[12,77,4]],[[0,79,12],[12,77,4]],
      [[0,81,6],[6,79,2],[8,77,8]],[[0,79,4],[4,77,4],[8,76,4],[12,74,4]],[[0,76,16]],[[0,71,4],[4,74,4],[8,76,4],[12,80,4]]]},
 battle_touge:{bpm:160,dr:'dnb',bells:true,arpHi:true,
  ch:['Em','C','D','Bm','Em','C','Am','B'],
  ld:[[[0,76,4],[4,79,4],[8,83,8]],[[0,81,6],[6,79,2],[8,78,8]],[[0,78,4],[4,81,4],[8,86,4],[12,81,4]],[[0,83,12],[12,78,4]],
      [[0,76,4],[4,79,4],[8,83,4],[12,88,4]],[[0,86,4],[4,84,4],[8,83,8]],[[0,81,4],[4,83,4],[8,84,4],[12,81,4]],[[0,83,8],[8,75,8]]],
  pass2:'break'},
 battle_circuit:{bpm:165,dr:'drive',brass:true,
  ch:['Gm','Eb','F','D','Gm','Eb','Cm','D'],
  ld:[[[0,67,4],[4,70,4],[8,74,8]],[[0,72,6],[6,70,2],[8,69,8]],[[0,72,4],[4,74,4],[8,77,4],[12,74,4]],[[0,78,12],[12,74,4]],
      [[0,79,4],[4,77,4],[8,74,4],[12,70,4]],[[0,72,4],[4,74,4],[8,75,8]],[[0,75,4],[4,74,4],[8,72,4],[12,70,4]],[[0,69,8],[8,66,8]]],
  pass2:'up'},
 boss:{bpm:170,dr:'boss',enemy:true,
  ch:['Am','Am','F','F','Dm','Dm','E','E'],
  ld:[[[0,69,4],[4,72,4],[8,76,8]],[[0,74,6],[6,72,2],[8,71,8]],[[0,72,4],[4,76,4],[8,81,8]],[[0,79,8],[8,77,8]],
      [[0,77,4],[4,76,4],[8,74,8]],[[0,72,4],[4,74,4],[8,77,8]],[[0,76,12],[12,75,4]],[[0,76,8],[8,68,8]]],
  pass2:'double'},
 map:{bpm:96,dr:'half',soft:true,
  ch:['Am','F','C','G','Am','F','G','E'],
  ld:[[[0,69,4],[4,72,4],[8,76,8]],[],[[0,72,4],[4,76,4],[8,79,8]],[],[[0,69,4],[4,72,4],[8,76,4],[12,81,4]],[],[[0,74,4],[4,76,4],[8,77,8]],[[0,76,8]]]},
};
// ID → 曲と味つけ（α版：ボス3体は1曲の味つけ違い、マップ3つは1曲の味つけ違い）
const BGM={
 battle_street:{s:'battle_street'},battle_touge:{s:'battle_touge'},battle_circuit:{s:'battle_circuit'},
 elite:{s:'battle_street',tr:-2,dark:true},
 boss_zankou:{s:'boss'},boss_byakuya:{s:'boss',tr:2,bells:true},boss_zerogou:{s:'boss',tr:-1,glitch:true},
 map_street:{s:'map'},map_touge:{s:'map',tr:-5,bells:true,wind:true},map_circuit:{s:'map',tr:-2,hum:true},
};
// ---------- BGM 追加（v0.3・2026-11-07）：タイトル・ショップ・リザルト・記録ファイル・会話・エンディング・チュートリアル ----------
Object.assign(CHD,{Fmaj7:[57,60,64],Gm7:[58,62,65],Am7:[60,64,67],Bbmaj7:[57,62,65],FA:[57,60,65],BbC:[58,62,65],C7:[58,60,64],A:[57,61,64],
 P1:[57,64,69],P2:[58,65,70],P3:[57,63,69],P4:[56,62,68]});
Object.assign(ROOT,{Fmaj7:41,Gm7:43,Am7:45,Bbmaj7:46,FA:45,BbC:48,C7:48,A:45,P1:45,P2:46,P3:45,P4:44});
const TALK_LD=[[[0,69,4],[4,72,4],[8,76,8]],[[0,74,6],[6,72,2],[8,70,8]],[[0,72,4],[4,69,4],[8,67,4],[12,69,4]],[[0,65,12]],
 [[0,69,4],[4,72,4],[8,77,8]],[[0,76,4],[4,74,4],[8,72,8]],[[0,74,6],[6,72,2],[8,70,4],[12,69,4]],[[0,67,12],[12,72,4]]];
const TALK_CH=['Fmaj7','Gm7','Am7','Bbmaj7','FA','Gm7','BbC','C7'];
Object.assign(SONGS,{
 // タイトル：雪の夜の街。シリーズのフレーズをゆっくり、鈴とパッド。軽いドラム
 title:{bpm:100,dr:'half',soft:true,lead:'pulse',bells:true,
  ch:['Am','F','C','G','Am','F','G','E','F','G','Em','Am','F','G','E','E'],
  ld:[[[0,69,8],[8,72,8]],[[0,76,16]],[[0,74,8],[8,72,8]],[[0,71,16]],[[0,69,8],[8,72,8]],[[0,76,8],[8,81,8]],[[0,79,8],[8,77,8]],[[0,76,16]],
      [[0,77,8],[8,76,8]],[[0,74,16]],[[0,76,8],[8,79,8]],[[0,81,16]],[[0,77,8],[8,76,8]],[[0,74,8],[8,71,8]],[[0,76,16]],[]]},
 // ショップ：ファンク寄りのベースとエレピ、工具の音
 shop:{bpm:110,dr:'funk',lead:'pulse',ep:true,
  ch:['Dm','G','Dm','G','Em','A','Dm','G'],
  ld:[[],[[8,74,2],[10,77,2],[12,79,4]],[],[[8,81,2],[10,79,2],[12,77,4]],[],[[8,76,2],[10,79,2],[12,81,4]],[[0,77,4],[4,76,4],[8,74,8]],[]]},
 // リザルト：夜明け前の静かな達成感。フレーズをゆっくり、最後は明るく
 result:{bpm:90,dr:'half',soft:true,lead:'soft',bells:true,
  ch:['F','G','Em','Am','F','G','C','C'],
  ld:[[[0,69,8],[8,72,8]],[[0,76,16]],[[0,74,8],[8,72,8]],[[0,71,8],[8,69,8]],[[0,72,8],[8,74,8]],[[0,76,8],[8,79,8]],[[0,79,16]],[[0,72,16]]]},
 // 記録ファイル（PROJECT ZERO）：不穏で機械的。16分のきざみと心音（SNOW DROP! の file と同じ考え）
 pzlog:{bpm:100,dr:'pulse',lead:'bell',
  ch:['P1','P1','P1','P1','P2','P2','P2','P2','P3','P3','P3','P4'],
  ld:[[],[[0,76,2],[2,77,2],[4,76,4]],[],[[8,75,4],[12,76,4]],[],[[0,77,2],[2,78,2],[4,77,4]],[],[[8,76,4],[12,77,4]],[],[[0,75,2],[2,76,2],[4,75,4]],[[4,81,2],[6,82,2],[8,81,8]],[[0,74,8],[8,73,8]]]},
 // 会話：story_talk（SNOW DROP!）の主題そのまま。ドラムなし、会話のじゃまをしない
 talk:{bpm:75,dr:'none',soft:true,lead:'soft',ch:TALK_CH,ld:TALK_LD},
 // エンディング：会話の主題にドラム。2周目は全音上げて明るく
 ending:{bpm:90,dr:'half',soft:true,lead:'pulse',bells:true,ch:TALK_CH,ld:TALK_LD,pass2:'keyup'},
});
Object.assign(BGM,{title:{s:'title'},shop:{s:'shop'},result:{s:'result'},pzlog:{s:'pzlog'},talk:{s:'talk'},ending:{s:'ending'},
 tutorial:{s:'talk'}}); // ★チュートリアルは会話の曲を流用（窓口：title の流用でもよい → 教える文を読むので静かな talk にした）

const barDur=sg=>60/sg.bpm*4;
function renderBar(c,o,id,b,T){
 const v=BGM[id],sg=SONGS[v.s],st=60/sg.bpm/4,n=sg.ch.length,i=b%n,pass=Math.floor(b/n)%2,tr=(v.tr||0)+(pass===1&&sg.pass2==='keyup'?2:0);
 const cn=sg.ch[i],ch=CHD[cn].map(x=>x+tr),rt=ROOT[cn]+tr,r=rng(b*97+7);
 const brk=pass===1&&sg.pass2==='break'&&i<4, dbl=pass===1&&sg.pass2==='double', up=pass===1&&sg.pass2==='up'?12:0;
 const at=s=>T+s*st;
 // ドラム（80年代のドラムマシン風）
 for(let s=0;s<16;s++){const t=at(s);
  if(sg.dr==='four'){if(s%4===0)tone(c,o,t,{f:130,f2:42,dur:.26,g:.85});if(s===4||s===12){nz(c,o,t,{f:1800,dur:.18,g:.42,q:.7});tone(c,o,t,{type:'triangle',f:190,f2:150,dur:.1,g:.2});}if(s%4===2)nz(c,o,t,{ft:'highpass',f:9000,dur:.05,g:.13});else if(s%2===1)nz(c,o,t,{ft:'highpass',f:9000,dur:.025,g:.05});}
  if(sg.dr==='dnb'){if(!brk){if(s===0||s===10)tone(c,o,t,{f:120,f2:40,dur:.24,g:.85});if(s===4||s===12||s===15&&i%2)nz(c,o,t,{f:2000,dur:.16,g:s===15?.2:.45,q:.7});}nz(c,o,t,{ft:'highpass',f:9500,dur:s%2?.02:.04,g:s%2?.04:.1});}
  if(sg.dr==='drive'){if(s%4===0||s===6)tone(c,o,t,{f:125,f2:42,dur:.24,g:.85});if(s===4||s===12){nz(c,o,t,{f:1700,dur:.2,g:.45,q:.7});tone(c,o,t,{type:'triangle',f:200,f2:160,dur:.1,g:.2});}if(s%2===0)nz(c,o,t,{ft:'highpass',f:8500,dur:.04,g:.11});}
  if(sg.dr==='boss'){const k=dbl?(s%2===0):(s%4===0||s===10);if(k)tone(c,o,t,{f:115,f2:38,dur:.24,g:.9});if(s===4||s===12){nz(c,o,t,{f:1600,dur:.22,g:.5,q:.6});tone(c,o,t,{type:'triangle',f:170,f2:120,dur:.12,g:.25});}if(s%2===1)nz(c,o,t,{ft:'highpass',f:9000,dur:.03,g:.07});}
  if(sg.dr==='funk'){if(s===0||s===7||s===10)tone(c,o,t,{f:120,f2:45,dur:.22,g:.75});if(s===4||s===12){nz(c,o,t,{f:1900,dur:.15,g:.38,q:.8});}nz(c,o,t,{ft:'highpass',f:9000,dur:s%4===2?.05:.02,g:s%4===2?.11:.04});
   if(i%4===3&&s===14)for(let k=0;k<4;k++)tone(c,o,t+k*.03,{type:'square',f:1100,dur:.02,g:.04});}
  if(sg.dr==='pulse'){if(s===0||s===6)tone(c,o,t,{f:62,f2:38,dur:.25,g:.75});if(s%2===1)nz(c,o,t,{ft:'highpass',f:7000,dur:.015,g:.03});
   const pn=[ch[0],ch[0]+12,ch[1],ch[0],ch[0]+1,ch[0],ch[1],ch[0]+1];tone(c,o,t,{wave:.25,f:mf(pn[s%8]),dur:st*.8,g:.035});}
  if(sg.dr==='half'){if(s===0||s===10)tone(c,o,t,{f:110,f2:45,dur:.28,g:.6});if(s===8)nz(c,o,t,{f:1500,dur:.22,g:.25,q:.6});if(s%4===2)nz(c,o,t,{ft:'highpass',f:8000,dur:.04,g:.06});}
 }
 // ベース（シンセのノコギリ波）
 if(sg.dr==='funk')[[0,0],[3,12],[6,0],[8,7],[10,12],[13,0]].forEach(([s,d])=>tone(c,o,at(s),{type:'sawtooth',f:mf(rt+d),dur:st*1.6,g:.28,hold:st*.5,lp:700}));
 else if(sg.dr==='pulse')tone(c,o,T,{type:'sawtooth',f:mf(rt-12),dur:barDur(sg),g:.18,a:.05,hold:barDur(sg)*.7,lp:280});
 else if(sg.soft)[0,6,8,14].forEach(s=>tone(c,o,at(s),{type:'sawtooth',f:mf(rt),dur:st*1.8,g:.2,hold:st*.6,lp:420}));
 else for(let s=0;s<16;s+=2)tone(c,o,at(s),{type:'sawtooth',f:mf(rt+(sg.dr==='dnb'&&s%8===6?12:0)),dur:st*1.8,g:.26,hold:st*.8,lp:520+(s%4?0:300)});
 // 和音（パッド）
 ch.forEach(x=>[-8,8].forEach(d=>tone(c,o,T,{type:'sawtooth',f:mf(x),det:d,dur:barDur(sg),g:sg.soft?.04:.032,a:.25,hold:barDur(sg)*.6,lp:sg.soft?1100:1600})));
 // エレピの刻み（ショップ）
 if(sg.ep)[2,6,10,14].forEach(s=>ch.forEach(x=>{tone(c,o,at(s),{f:mf(x+12),dur:st*1.6,g:.06,a:.005});tone(c,o,at(s),{f:mf(x+24),dur:st*.6,g:.015});}));
 // アルペジオ（チップの音）
 if(sg.arpHi||sg.soft||brk)for(let s=0;s<16;s+=sg.soft?2:1)tone(c,o,at(s),{wave:.125,f:mf(ch[s%3]+(sg.arpHi?24:12)),dur:st*.9,g:sg.soft?.035:.045});
 // 雪の鈴
 if(sg.bells||v.bells){const f=mf(ch[2]+24);tone(c,o,at(14),{f,dur:.5,g:.06});tone(c,o,at(14),{f:f*2.76,dur:.18,g:.015});if(sg.soft||v.bells){tone(c,o,at(6),{f:mf(ch[1]+24),dur:.5,g:.045});}}
 // 主旋律（チップのリード／サーキットはブラス風）
 const ld=sg.ld[i]||[];
 if(!brk)ld.forEach(([s,m,l])=>{const t=at(s),d=l*st,f=mf(m+tr+up);
  const lt=sg.lead||(sg.brass?'brass':sg.soft?'soft':'pulse');
  if(lt==='brass'){tone(c,o,t,{type:'sawtooth',f,dur:d*.95,g:.09,a:.02,hold:d*.6,lp:2600});tone(c,o,t,{wave:.25,f,det:6,dur:d*.95,g:.08,hold:d*.6});}
  else if(lt==='soft')tone(c,o,t,{f,dur:d*.95,g:.14,a:.01,hold:d*.4}),tone(c,o,t,{f:f*2.76,dur:.2,g:.02});
  else if(lt==='bell')tone(c,o,t,{f,dur:Math.max(.6,d),g:.12}),tone(c,o,t,{f:f*2.76,dur:.3,g:.03}),tone(c,o,t,{f:f*5.4,dur:.12,g:.01});
  else tone(c,o,t,{wave:.25,f,dur:d*.95,g:sg.soft?.12:.17,hold:d*.6});
  if(lt==='pulse'||lt==='brass')tone(c,o,t+st*3,{wave:.25,f,dur:d*.8,g:.04,hold:d*.4}); // こだま
 });
 // ボス：敵のフレーズ（半音で下がる低い声）とぶつける
 if(sg.enemy){[[0,57],[3,56],[6,55],[9,54]].forEach(([s,m],k)=>tone(c,o,at((s+(i%2?8:0))%16),{wave:.5,f:mf(m+tr-12),dur:st*(k===3?4:2),g:.07,hold:st,lp:900}));}
 // 味つけ
 if(v.glitch&&r()<.5){const s=Math.floor(r()*12);for(let k=0;k<4;k++)tone(c,o,at(s)+k*st/2,{type:'square',f:200+r()*2400,dur:st/2.2,g:.05});}
 if(v.wind)nz(c,o,T,{f:900,f2:500,q:.5,dur:barDur(sg),g:.03,a:.6,hold:barDur(sg)*.4});
 if(v.hum)tone(c,o,T,{type:'sawtooth',f:mf(rt+12),dur:barDur(sg),g:.015,a:.5,hold:barDur(sg)*.5,lp:500});
 if(v.dark)tone(c,o,T,{type:'square',f:mf(rt-12),dur:barDur(sg)*.9,g:.05,a:.05,hold:barDur(sg)*.5,lp:300});
}
// ジングル（1回きり）
const JINGLES={
 win:{dur:2.6,fn:(c,o,t)=>{[[0,69],[.12,73],[.24,76],[.36,81]].forEach(([d,m])=>tone(c,o,t+d,{wave:.25,f:mf(m),dur:.14,g:.17}));
  [69,73,76].forEach(m=>[-8,8].forEach(dt=>tone(c,o,t+.5,{type:'sawtooth',f:mf(m),det:dt,dur:1.6,g:.05,a:.02,hold:.8,lp:2200})));tone(c,o,t+.5,{wave:.25,f:mf(81),dur:1.4,g:.15,hold:.6});
  tone(c,o,t+.5,{f:130,f2:42,dur:.3,g:.8});nz(c,o,t+.5,{f:1800,dur:.25,g:.4,q:.7});
  const os=tone(c,o,t+1.9,{type:'sawtooth',f:60,dur:.4,g:.18,a:.02,hold:.12,lp:900});os.frequency.linearRampToValueAtTime(140,t+2.05);os.frequency.linearRampToValueAtTime(90,t+2.3);
  tone(c,o,t+.9,{f:mf(93),dur:.8,g:.05});}},
 one_turn_kill:{dur:3,fn:(c,o,t)=>{[69,72,76,81,84,88,93].forEach((m,k)=>tone(c,o,t+k*.07,{wave:.25,f:mf(m),dur:.18,g:.14}));JINGLES.win.fn(c,o,t+.45);}},
 gameover:{dur:4.2,fn:(c,o,t)=>{const os=tone(c,o,t,{type:'sawtooth',f:55,f2:14,dur:1.4,g:.25,lp:380});
  [[1.1,[57,60,64]],[2.0,[53,56,60]]].forEach(([d,ch])=>ch.forEach(m=>[-8,8].forEach(dt=>tone(c,o,t+d,{type:'sawtooth',f:mf(m-12),det:dt,dur:1.9,g:.05,a:.05,hold:.7,lp:900}))));
  [[1.1,64],[1.5,62],[2.0,60],[2.6,57]].forEach(([d,m])=>tone(c,o,t+d,{wave:.25,f:mf(m),dur:.6,g:.1,hold:.25}));tone(c,o,t+2.0,{f:mf(81),dur:1.5,g:.04});}},
};

// ---------- ここから AUDIO ----------
const ALIAS={ui_error:'card_cant',shop_cant:'card_cant'};
const BYID=Object.fromEntries(SE.map(s=>[s.id,s]));
const LVJ={win:1,one_turn_kill:1,gameover:1};
let C=null,M=null,BUS={},vol={master:.8,se:.9,engine:.75,bgm:.55},muted=false,engType='real',car=Object.assign({},YUKI);
let bgmIn=null,hp=null,trem=null,tremLfo=null;
const live={};
function ctx(){
 if(C)return C;
 const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;
 C=new AC();M=C.createGain();const lim=C.createDynamicsCompressor();lim.threshold.value=-6;lim.knee.value=0;lim.ratio.value=20;lim.attack.value=.002;lim.release.value=.1;
 M.connect(lim).connect(C.destination);
 ['se','engine','bgm'].forEach(k=>{BUS[k]=C.createGain();BUS[k].connect(M);});
 // BGM の入口：コンプ → ハイパス（レッドのとき）→ ゆれ → BGM の音量
 const comp=C.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=4;
 hp=C.createBiquadFilter();hp.type='highpass';hp.frequency.value=20;trem=C.createGain();trem.gain.value=1;
 tremLfo=C.createOscillator();tremLfo.frequency.value=7;const td=C.createGain();td.gain.value=0;tremLfo.connect(td).connect(trem.gain);tremLfo.start();trem._d=td;
 comp.connect(hp).connect(trem).connect(BUS.bgm);bgmIn=comp;
 applyVol();
 document.addEventListener('visibilitychange',()=>{if(!C)return;if(document.hidden)C.suspend();else C.resume();});
 return C;
}
function applyVol(){if(!C)return;M.gain.value=muted?0:vol.master*.6;Object.keys(BUS).forEach(k=>BUS[k].gain.value=vol[k]);}
function ok(){const c=ctx();if(!c)return null;if(c.state==='suspended')c.resume();return c;}
function playSE(id,o){
 id=ALIAS[id]||id;const s=BYID[id];if(!s){console.warn('AUDIO: SE がない',id);return;}
 const c=ok();if(!c)return;const n=(live[id]||0);if(n>=(id==='text_blip'?8:id==='chain_up'?6:3))return;live[id]=n+1;setTimeout(()=>live[id]--,(s.dur+.1)*1000);
 const g=c.createGain();g.gain.value=(LV[id]||1)*((o&&o.vol!=null)?o.vol:1);g.connect(BUS.se);s.fn(c,g,c.currentTime+.01,o||{});
}

// エンジン：回転が変わったときだけ約2秒（★虎雪 08:20）。続けて呼んだら前の音を切って新しい音に（重ねない）
let cur=null,warnT=[];
function engineStopNow(){warnT.forEach(clearTimeout);warnT=[];if(cur&&C){cur.stop(C.currentTime);}cur=null;}
function engineBurst(from,to,opt){
 const c=ok();if(!c)return;opt=opt||{};engineStopNow();
 const dur=opt.dur||(to<from?1.6:2.0);
 cur=burst(c,BUS.engine,c.currentTime+.01,from,to,engType,{dur,car,limiter:opt.limiter});
 // レッドの警告は SE として別に（2秒の間に2〜3回。リミットに近いほど速く）
 if(to>=car.red&&!opt.limiter){const k=Math.min(1,(to-car.red)/Math.max(1,car.limit-car.red)),gap=420-260*k;
  for(let i=0;i<3;i++){const d=300+i*gap;if(d<dur*1000-200)warnT.push(setTimeout(()=>playSE('redzone_warn',{vol:.5}),d));}}
}

// BGM（ループは小節ごとに先読みで並べる）
let P=null;
function bgm(id){const c=ok();if(!c)return;if(!BGM[id]){console.warn('AUDIO: BGM がない',id);return;}
 if(P&&P.id===id)return;bgmStop(.4);
 const g=c.createGain();g.gain.setValueAtTime(0,c.currentTime);g.gain.linearRampToValueAtTime(.7,c.currentTime+.3);g.connect(bgmIn);
 const sg=SONGS[BGM[id].s];P={id,g,b:0,t:c.currentTime+.08,bd:barDur(sg)};
 const me=P;const tick=()=>{if(P!==me)return;while(me.t<C.currentTime+.7){renderBar(C,me.g,id,me.b,me.t);me.t+=me.bd;me.b++;}};
 tick();me.timer=setInterval(tick,100);
}
function bgmStop(fade){if(!P||!C){P=null;return;}const p=P;P=null;clearInterval(p.timer);const t=C.currentTime,f=fade==null?.5:fade;
 p.g.gain.cancelScheduledValues(t);p.g.gain.setValueAtTime(p.g.gain.value,t);p.g.gain.linearRampToValueAtTime(0,t+f);setTimeout(()=>p.g.disconnect(),(f+(p.bd||2)+.5)*1000);}
function redFilter(on){if(!C)return;const t=C.currentTime;hp.frequency.setTargetAtTime(on?650:20,t,.15);trem._d.gain.setTargetAtTime(on?.12:0,t,.15);}
function jingle(id){const c=ok();if(!c)return;const j=JINGLES[id];if(!j){console.warn('AUDIO: ジングルがない',id);return;}bgmStop(.15);
 const g=c.createGain();g.gain.value=LVJ[id]||1;g.connect(bgmIn);j.fn(c,g,c.currentTime+.05);}

window.AUDIO={
 VERSION:'0.4',SE_IDS:SE.map(s=>s.id).concat(Object.keys(ALIAS)),BGM_IDS:Object.keys(BGM),JINGLE_IDS:Object.keys(JINGLES),
 unlock(){const c=ok();if(c){const b=c.createBuffer(1,1,22050),s=c.createBufferSource();s.buffer=b;s.connect(c.destination);s.start(0);}return !!c;},
 se:playSE,
 attack(dmg){playSE(dmg>=20?'card_attack_l':dmg>=10?'card_attack_m':'card_attack_s');},
 setCar(cr){car=Object.assign({},YUKI,cr||{});},
 engineBurst,
 overrev(){engineBurst(car.limit-400,car.limit,{limiter:true,dur:1.4});playSE('overrev');},
 blow(){engineStopNow();playSE('engine_blow');bgmStop(.05);},
 engineStop:engineStopNow,
 setEngineType(t){engType=(t==='game')?'game':'real';},
 bgm,bgmStop,redFilter,jingle,
 setVolume(k,v){if(k in vol){vol[k]=Math.max(0,Math.min(1,v));applyVol();}},
 mute(m){muted=!!m;applyVol();},
 get state(){return C?C.state:'none';},
 // 試聴ページ・書き出し用（ゲームからは使わない）
 _lab:{SE,LV,burst,renderBar,SONGS,BGM,JINGLES,barDur,YUKI}
};
})();
