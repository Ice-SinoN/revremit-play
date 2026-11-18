/* Rev:Remit audio.js v0.13（サウンド班 2026-11-18。v0.11：SORA 編（β のあと）の音を貯めた。試作ではまだ呼ばない。v0.10.1：gate_boot {rec:true} の奥の旋律を起動音の旋律にそろえた。v0.9〜v0.5 も 2026-11-18、v0.4・v0.3 は 2026-11-07、v0.2 は 2026-11-05）
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
 * v0.5（β）：BGM theme_hina・theme_momo・theme_nana・select・upgrade・hidden、ジングル night_select・night_up・story_unlock・ally_join（{who}）、
 *       SE upgrade_buy・card_unlock・save_ok・load_ok・overwrite_warn・autosave。chain_up は12段まで1段ずつ高く（12段は MAX の音）。
 * v0.6：BGM boss_kuuten・boss_sanka・boss_miketsu（仲間の話のボス）、SE comm_open・comm_close・comm_blip・comm_glitch（MIO の通信）。
 *       night_select・night_up は {lv:1〜11} で段ごとに半音ずつ高く（6段から低い音を足す）。
 * v0.7：ジングル hidden_win・hidden_escape（裏道のロストライン）。BGM lab（＝upgrade。強化ショップ「みおのラボ」の名前に合わせた別名）。
 * v0.8：SE photo_shutter（写真の「カシャ」。text 13-6・13-8 の MOMO 編）。
 * v0.9：SE gate_boot（CROSS GATE の起動音＝エンジンの始動音＋シリーズのフレーズ）・blow_warn（ブローの確認の小窓 text 12-1-2）。
 * v0.10：エンジン音を 6800 回転から荒く（ひずみ・ゆらぎ・吸気が増える）、7500 から「ガラガラ」（ブローの直前）。engineBurst(前,後,{top:true}) で
 *       いちばん上のギアのレッドは警告を速く。仲間のテーマ3曲は3周目の前半を「息つぎ」（主旋律とアルペジオを休む）にして、HINA の高い音を控えめに。
 *       ジングル ally_next（次の仲間は……？）、gate_boot に {rec:true}（録った起動音をスピーカーで流す＋奥の細い旋律。text 15章 9行目）。
 * v0.11：SORA 編（β のあと）：theme_sora・garage_sora・boss_muon（AUDIO.bgmPhase(2)）・gate_boot {part}・rod_swing・sora_hum。
 * v0.12：KAEDE・RIN・LUNA・KURO・MIO 編（β のあと・試作ではまだ呼ばない）：theme_kaede／rin／luna／kuro／mio、話のボス boss_kagesen（影線）・
 *       boss_ketsuban（欠番）・boss_itebosi（凍星）・boss_uramen（裏面）・boss_shiosai（潮騒）、SE turbo_swing・bow_draw・bow_shot・page_flip・num_tag・
 *       pendulum・shooting_star・kuro_glitch・heartbeat・flip_back・belt_whip・mio_kit。AUDIO.engineGhost(bool)（影線の2台目のエンジン）・
 *       AUDIO.heart(耐久の割合|null)（KURO の心拍）・AUDIO.ambient('wave')／ambientVol／ambientStop（潮騒の波）。ally_join の who に5人。
 * v0.13：design 11章の画面の音（試作には画面ができたときに）：SE card_toss・card_mod（{lv,br}）・mod_switch（{to}）・tree_cap・tree_reset。
 *       ほかは今の SE を使い回す（audio-list 11章）。
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
// チェイン：ペンタトニックを段ごとに1音ずつ上がる（12段まで。design 0-6 の止め＝1ターン12枚）。4段から きらめき、6段から 吹け上がりの「シュッ」と低い「ドン」、
// 9段から もう1つ低い音と1オクターブ上の重ね、12段（MAX）は和音がはじける
const CHAIN_N=[76,79,81,84,86,88,91,93,96,98,100,103];
SE.push(
{id:'chain_up',name:'チェインが伸びた（{lv:段} で12段まで段ごとに高く）',dur:.9,fn:(c,o,t,p)=>{const lv=Math.max(1,Math.min(12,(p&&p.lv)||1)),m=CHAIN_N[lv-1];
 tone(c,o,t,{wave:.25,f:mf(m-12),dur:.07,g:.12});tone(c,o,t+.035,{wave:.25,f:mf(m),dur:.16,g:.16,hold:.04});tone(c,o,t+.035,{wave:.125,f:mf(m+7),dur:.12,g:.06});
 tone(c,o,t+.035,{f:mf(m+12),dur:.35,g:.06});nz(c,o,t,{ft:'highpass',f:5000,dur:.05,g:.18});
 if(lv>=4)[0,1,2].forEach(i=>tone(c,o,t+.09+i*.04,{f:mf(m+12+[0,4,7][i]),dur:.25,g:.04}));
 if(lv>=6){nz(c,o,t,{f:1500,f2:6000,dur:.18,g:.18,a:.05,q:.8});tone(c,o,t,{f:120,f2:50,dur:.18,g:.5});}
 if(lv>=9){tone(c,o,t+.035,{wave:.25,f:mf(m-24),dur:.2,g:.07});tone(c,o,t+.2,{f:mf(m+24),dur:.35,g:.035});}
 if(lv>=12){[0,4,7,12].forEach((d,i)=>tone(c,o,t+.22+i*.04,{wave:.25,f:mf(81+d),dur:.4,g:.09}));[69,73,76].forEach(n=>[-8,8].forEach(dt=>tone(c,o,t+.22,{type:'sawtooth',f:mf(n),det:dt,dur:.6,g:.04,a:.01,hold:.2,lp:2600})));nz(c,o,t+.22,{ft:'highpass',f:6000,dur:.5,g:.1});}}},
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
 const load=c.createGain();load.gain.value=.75;
 const lp=c.createBiquadFilter();lp.type='lowpass';lp.Q.value=.8;lp.connect(load);
 const pk2=c.createBiquadFilter();pk2.type='peaking';pk2.frequency.value=650;pk2.Q.value=1.4;pk2.gain.value=7;pk2.connect(lp);
 const pk1=c.createBiquadFilter();pk1.type='peaking';pk1.frequency.value=160;pk1.Q.value=1.1;pk1.gain.value=6;pk1.connect(pk2);
 const sh=c.createWaveShaper();const cv=new Float32Array(1024);for(let i=0;i<1024;i++){const x=i/511.5-1;cv[i]=Math.tanh(x*2.6);}sh.curve=cv;sh.connect(pk1);
 const pre=c.createGain();pre.gain.value=.85;pre.connect(sh);
 // ブローの直前の「ガラガラ」：爆発の半分の速さで音量を細かく切る（7500 回転から深く）
 const rat=c.createGain();rat.gain.value=1;const ratO=c.createOscillator();ratO.type='square';const ratD=c.createGain();ratD.gain.value=0;ratO.connect(ratD).connect(rat.gain);
 const o1=c.createOscillator();o1.setPeriodicWave(firingWave(c));const g1=c.createGain();g1.gain.value=.5;o1.connect(g1).connect(pre);
 const o2=c.createOscillator();o2.type='sine';const g2=c.createGain();g2.gain.value=.38;o2.connect(g2).connect(pre);   // 半分の次数（クランク2回転で1周）
 // 回転のゆらぎ（少しだけ不規則に）
 const jn=c.createBufferSource();jn.buffer=noiseBuf(c);jn.loop=true;const jl=c.createBiquadFilter();jl.type='lowpass';jl.frequency.value=7;const jg=c.createGain();jg.gain.value=180;
 jn.connect(jl).connect(jg);jg.connect(o1.detune);jg.connect(o2.detune);
 // 吸気のノイズ（爆発に合わせてゆれる）
 const ns=c.createBufferSource();ns.buffer=noiseBuf(c);ns.loop=true;const bp=c.createBiquadFilter();bp.type='bandpass';bp.Q.value=1.2;bp.frequency.value=1600;
 const am=c.createGain();am.gain.value=.05;ns.connect(bp).connect(am).connect(lp);
 const mo=c.createOscillator();mo.type='square';const mg=c.createGain();mg.gain.value=.05;mo.connect(mg).connect(am.gain);
 load.connect(rat).connect(g);
 const srcs=[o1,o2,jn,ns,mo,ratO];let prev=1000,vol=.34;
 const ff=r=>Math.max(8,r/30);
 return{start(t,v=.34){vol=v;srcs.forEach(s=>s.start(t));g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.05);},
  set(rpm,t,glide=.3){const f=ff(rpm),tc=glide?glide/3:0;
   const S=(p,v)=>glide?p.setTargetAtTime(v,t,tc):p.setValueAtTime(v,t);
   const rg=Math.max(0,Math.min(1,(rpm-6800)/1200)),r2=Math.max(0,Math.min(1,(rpm-7400)/500));
   S(o1.frequency,f);S(o2.frequency,f/2);S(mo.frequency,f);S(ratO.frequency,f/2);S(lp.frequency,350+rpm*.6+rg*1800);S(bp.frequency,1200+rpm*.15);
   // レッド（6800〜）で荒く：ひずみ・ゆらぎ・吸気・650Hz の共鳴が増える。7500〜で「ガラガラ」
   S(pre.gain,.85+rg*1.6);S(jg.gain,180+rg*520);S(am.gain,.05+rg*.22);S(mg.gain,.05+rg*.1);S(pk2.gain,7+rg*5);S(ratD.gain,r2*.5);S(rat.gain,1-rg*.5);
   if(glide){if(rpm>prev+300){load.gain.setTargetAtTime(1.15,t,.03);load.gain.setTargetAtTime(.75,t+glide+.25,.25);lp.frequency.setTargetAtTime(900+rpm*.8,t,.03);lp.frequency.setTargetAtTime(350+rpm*.6+rg*1800,t+glide+.2,.3);}
    else if(rpm<prev-800){load.gain.setTargetAtTime(.55,t,.08);const r=rng(Math.round(t*1000));for(let i=0;i<3;i++)nz(c,g,t+.15+r()*.6,{ft:'lowpass',f:1400,dur:.03,g:.9});}}
   prev=rpm;},
  cut(t,d=.03){g.gain.setValueAtTime(vol,t);g.gain.linearRampToValueAtTime(vol*.12,t+.005);g.gain.setValueAtTime(vol*.12,t+d);g.gain.linearRampToValueAtTime(vol,t+d+.005);},
  fade(t,d){g.gain.setValueAtTime(vol,t);g.gain.linearRampToValueAtTime(0,t+d);},
  stop(t){g.gain.cancelScheduledValues(t);g.gain.setTargetAtTime(0,t,.04);srcs.forEach(s=>s.stop(t+.3));},
  get vol(){return vol;}};
}
function makeEngine(c,o,type){return EngineReal(c,o);} // ★RA-03 で本物寄りに決まったので、ゲームっぽい合成（v0.2 まで）は外した
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
let PHASE=1; // v0.11：AUDIO.bgmPhase(n) で曲の後半に切りかえる（ボス「無音」）
function renderBar(c,o,id,b,T){
 const v=BGM[id],sg=SONGS[v.s],st=60/sg.bpm/4,n=sg.ch.length,i=b%n,pass=Math.floor(b/n)%2,tr=(v.tr||0)+(pass===1&&sg.pass2==='keyup'?2:0);
 const cn=sg.ch[i],ch=CHD[cn].map(x=>x+tr),rt=ROOT[cn]+tr,r=rng(b*97+7);
 const brk=pass===1&&sg.pass2==='break'&&i<4, dbl=pass===1&&sg.pass2==='double', up=pass===1&&sg.pass2==='up'?12:0;
 const cyc=Math.floor(b/n)%3, rest=sg.rest&&cyc===2&&i<4; // 息つぎ（3周目の前半は主旋律とアルペジオを休む）
 const at=s=>T+s*st;
 const mu=sg.muon&&PHASE<2, gap=mu&&i%4===3; // 無音の前半：キック・ベース・主旋律なし。4小節目はほぼ無音（うすい部屋の音だけ）
 // ドラム（80年代のドラムマシン風）
 const fz=freezeCut(sg,i),fr=sg.frozen&&i%4===3,lim=fz?8:fr?0:16; // fr：凍星。4小節目は時が止まる（ドラム・ベースなし、和音と長い音だけ）
 for(let s=0;s<lim;s++){const t=at(s);
  if(mu){if(!gap&&s%2===0)nz(c,o,t,{ft:'highpass',f:9000,dur:.03,g:s%4===0?.08:.035});continue;}
  if(sg.dr==='four'){if(s%4===0)tone(c,o,t,{f:130,f2:42,dur:.26,g:.85});if(s===4||s===12){nz(c,o,t,{f:1800,dur:.18,g:.42,q:.7});tone(c,o,t,{type:'triangle',f:190,f2:150,dur:.1,g:.2});}if(s%4===2)nz(c,o,t,{ft:'highpass',f:9000,dur:.05,g:.13});else if(s%2===1)nz(c,o,t,{ft:'highpass',f:9000,dur:.025,g:.05});}
  if(sg.dr==='dnb'){if(!brk){if(s===0||s===10)tone(c,o,t,{f:120,f2:40,dur:.24,g:.85});if(s===4||s===12||s===15&&i%2)nz(c,o,t,{f:2000,dur:.16,g:s===15?.2:.45,q:.7});}nz(c,o,t,{ft:'highpass',f:9500,dur:s%2?.02:.04,g:s%2?.04:.1});}
  if(sg.dr==='drive'){if(s%4===0||s===6)tone(c,o,t,{f:125,f2:42,dur:.24,g:.85});if(s===4||s===12){nz(c,o,t,{f:1700,dur:.2,g:.45,q:.7});tone(c,o,t,{type:'triangle',f:200,f2:160,dur:.1,g:.2});}if(s%2===0)nz(c,o,t,{ft:'highpass',f:8500,dur:.04,g:.11});}
  if(sg.dr==='boss'){const k=dbl?(s%2===0):(s%4===0||s===10);if(k)tone(c,o,t,{f:115,f2:38,dur:.24,g:.9});if(s===4||s===12){nz(c,o,t,{f:1600,dur:.22,g:.5,q:.6});tone(c,o,t,{type:'triangle',f:170,f2:120,dur:.12,g:.25});}if(s%2===1)nz(c,o,t,{ft:'highpass',f:9000,dur:.03,g:.07});}
  if(sg.dr==='funk'){if(s===0||s===7||s===10)tone(c,o,t,{f:120,f2:45,dur:.22,g:.75});if(s===4||s===12){nz(c,o,t,{f:1900,dur:.15,g:.38,q:.8});}nz(c,o,t,{ft:'highpass',f:9000,dur:s%4===2?.05:.02,g:s%4===2?.11:.04});
   if(i%4===3&&s===14)for(let k=0;k<4;k++)tone(c,o,t+k*.03,{type:'square',f:1100,dur:.02,g:.04});}
  if(sg.dr==='pulse'){if(s===0||s===6)tone(c,o,t,{f:62,f2:38,dur:.25,g:.75});if(s%2===1)nz(c,o,t,{ft:'highpass',f:7000,dur:.015,g:.03});
   const pn=[ch[0],ch[0]+12,ch[1],ch[0],ch[0]+1,ch[0],ch[1],ch[0]+1];tone(c,o,t,{wave:.25,f:mf(pn[s%8]),dur:st*.8,g:.035});}
 if(sg.dr==='rock'){if(s===0||s===8||s===10||(s===14&&i%2))tone(c,o,t,{f:120,f2:40,dur:.26,g:.95});if(s===4||s===12){nz(c,o,t,{f:1700,dur:.22,g:.5,q:.6});tone(c,o,t,{type:'triangle',f:180,f2:130,dur:.12,g:.25});}if(s%2===0)nz(c,o,t,{ft:'highpass',f:7500,dur:s%4===0?.06:.03,g:s%4===0?.1:.06});if(s===0&&i%4===0)nz(c,o,t,{ft:'highpass',f:5000,dur:1.2,g:.12});}
  if(sg.dr==='bounce'){if(s===0||s===6||s===8||s===14)tone(c,o,t,{f:125,f2:44,dur:.2,g:s===14?.5:.8});if(s===4||s===12){nz(c,o,t,{f:2200,dur:.13,g:.4,q:.9});}if(s%2===0||s===15)nz(c,o,t,{ft:'highpass',f:9000,dur:.02,g:s%4===2?.1:.04});}
  if(sg.dr==='half'){if(s===0||s===10)tone(c,o,t,{f:110,f2:45,dur:.28,g:.6});if(s===8)nz(c,o,t,{f:1500,dur:.22,g:.25,q:.6});if(s%4===2)nz(c,o,t,{ft:'highpass',f:8000,dur:.04,g:.06});}
 }
 // ベース（シンセのノコギリ波）
 if(mu||fr);else if(sg.dr==='funk'||sg.dr==='bounce')[[0,0],[3,12],[6,0],[8,7],[10,12],[13,0]].forEach(([s,d])=>tone(c,o,at(s),{type:'sawtooth',f:mf(rt+d),dur:st*1.6,g:.28,hold:st*.5,lp:700}));
 else if(sg.dr==='pulse')tone(c,o,T,{type:'sawtooth',f:mf(rt-12),dur:barDur(sg),g:.18,a:.05,hold:barDur(sg)*.7,lp:280});
 else if(sg.soft)[0,6,8,14].forEach(s=>tone(c,o,at(s),{type:'sawtooth',f:mf(rt),dur:st*1.8,g:.2,hold:st*.6,lp:420}));
 else for(let s=0;s<lim;s+=2)tone(c,o,at(s),{type:'sawtooth',f:mf(rt+(sg.dr==='dnb'&&s%8===6?12:0)),dur:st*1.8,g:.26,hold:st*.8,lp:520+(s%4?0:300)});
 // 和音（パッド）
 if(gap)nz(c,o,T,{ft:'lowpass',f:500,dur:barDur(sg),g:.012,a:.2,hold:barDur(sg)*.6});
 if(!gap)ch.forEach(x=>[-8,8].forEach(d=>tone(c,o,T,{type:'sawtooth',f:mf(x),det:d,dur:barDur(sg)*(fz?.5:fr?1.6:1),g:sg.soft?.04:.032,a:.25,hold:barDur(sg)*.6,lp:sg.soft?1100:1600})));
 // エレピの刻み（ショップ）
 if(sg.ep)[2,6,10,14].forEach(s=>ch.forEach(x=>{tone(c,o,at(s),{f:mf(x+12),dur:st*1.6,g:.06,a:.005});tone(c,o,at(s),{f:mf(x+24),dur:st*.6,g:.015});}));
 // アルペジオ（チップの音）
 if((sg.arpHi||sg.soft||brk)&&!rest)for(let s=0;s<lim;s+=sg.soft?2:1)tone(c,o,at(s),{wave:.125,f:mf(ch[s%3]+(sg.arpHi?24:12)),dur:st*.9,g:(sg.soft?.035:.045)*(sg.arpG||1)});
 // 雪の鈴
 if(sg.bells||v.bells){const f=mf(ch[2]+24);tone(c,o,at(14),{f,dur:.5,g:.06});tone(c,o,at(14),{f:f*2.76,dur:.18,g:.015});if(sg.soft||v.bells){tone(c,o,at(6),{f:mf(ch[1]+24),dur:.5,g:.045});}}
 // 主旋律（チップのリード／サーキットはブラス風）
 const ld=sg.ld[i]||[];
 if(!brk&&!rest&&!mu&&!fr)ld.forEach(([s,m,l],k)=>{const t=at(s),d=l*st,f=mf(m+tr+up);
  if(sg.holes&&(b*5+k*3)%7===2)return; // 欠番：番号が抜けたように、ときどき音が抜ける
  if(sg.shadow)tone(c,o,Math.max(.001,t-st),{wave:.5,f:f*.998,dur:d*.9,g:.05,hold:d*.4,lp:1400}); // 影線：1手先を走る影（同じ線を16分だけ先に）
  if(sg.fore){const nx=ld[k+1];if(nx)tone(c,o,at(nx[0])-st*2,{f:mf(nx[1]+tr+up+12),dur:st*1.5,g:.025});} // 先読み：次の音が、少し先に小さく聞こえる
  if(sg.rev){tone(c,o,t,{wave:.25,f,dur:d*.98,g:.15,a:d*.85,lp:3000});tone(c,o,t,{f:f*2,dur:d*.98,g:.03,a:d*.9});return;} // 裏面：逆回しのように、ふくらんでぷつっと切れる
  if(sg.glide&&k>0){const pv=mf(ld[k-1][1]+tr+up);tone(c,o,t,{wave:.25,f:pv,f2:f,dur:.05,g:.12});tone(c,o,t+.05,{wave:.25,f,dur:Math.max(.05,d*.95-.05),g:.16,hold:d*.5});tone(c,o,t+st*3,{wave:.25,f,dur:d*.8,g:.04,hold:d*.4});return;} // 段のない変速（CVT）：前の音からなめらかにすべる
  const lt=sg.lead==='reed'?'reed':sg.swap?['pulse','bell','brass'][Math.floor(b/4)%3]:(sg.lead||(sg.brass?'brass':sg.soft?'soft':'pulse')); // swap：4小節ごとに音色が替わる（スイッチロッド）
  if(lt==='reed'){tone(c,o,t,{type:'sawtooth',f,dur:d*.95,g:.1,a:.03,hold:d*.6,lp:1500});tone(c,o,t,{f,det:5,dur:d*.95,g:.06,a:.03,hold:d*.6});}
  else if(lt==='brass'){tone(c,o,t,{type:'sawtooth',f,dur:d*.95,g:.09,a:.02,hold:d*.6,lp:2600});tone(c,o,t,{wave:.25,f,det:6,dur:d*.95,g:.08,hold:d*.6});}
  else if(lt==='soft')tone(c,o,t,{f,dur:d*.95,g:.14,a:.01,hold:d*.4}),tone(c,o,t,{f:f*2.76,dur:.2,g:.02});
  else if(lt==='bell')tone(c,o,t,{f,dur:Math.max(.6,d),g:.12}),tone(c,o,t,{f:f*2.76,dur:.3,g:.03}),tone(c,o,t,{f:f*5.4,dur:.12,g:.01});
  else tone(c,o,t,{wave:.25,f,dur:d*.95,g:(sg.soft?.12:.17)*(sg.ldG||1),hold:d*.6});
  if(lt==='pulse'||lt==='brass')tone(c,o,t+st*3,{wave:.25,f,dur:d*.8,g:.04,hold:d*.4}); // こだま
 });
 // ボス：敵のフレーズ（半音で下がる低い声）とぶつける
 if(sg.enemy&&!gap&&!fr){[[0,57],[3,56],[6,55],[9,54]].forEach(([s,m],k)=>((s+(i%2?8:0))%16)<lim&&tone(c,o,at((s+(i%2?8:0))%16),{wave:.5,f:mf(m+tr-12),dur:st*(k===3?4:2),g:.07,hold:st,lp:900}));}
 // 味つけ
 if(v.glitch&&r()<.5){const s=Math.floor(r()*12);for(let k=0;k<4;k++)tone(c,o,at(s)+k*st/2,{type:'square',f:200+r()*2400,dur:st/2.2,g:.05});}
 if(v.wind)nz(c,o,T,{f:900,f2:500,q:.5,dur:barDur(sg),g:.03,a:.6,hold:barDur(sg)*.4});
 if(v.hum)tone(c,o,T,{type:'sawtooth',f:mf(rt+12),dur:barDur(sg),g:.015,a:.5,hold:barDur(sg)*.5,lp:500});
 if((v.mystic||sg.mystic)&&i%2===1)nz(c,o,T,{ft:'highpass',f:1500,f2:9000,dur:barDur(sg),g:.05,a:barDur(sg)*.85});
 extraBar(c,o,v,sg,i,ch,T,st);extraBar2(c,o,v,sg,i,ch,T,st,b,rt,fr);
 if(fz){nz(c,o,at(8),{ft:'highpass',f:3000,dur:.06,g:.25});tone(c,o,at(8),{f:mf(ch[2]+24),dur:barDur(sg)/2,g:.05});}
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

const LVJ={win:1,one_turn_kill:1,gameover:1};
// ---------- β（v0.5・2026-11-18）：仲間3人のテーマ・キャラ選び・強化ショップ・隠しステージ・難易度／解放のジングル・セーブの SE ----------
// 正本：revremit-progression.md v0.4。仲間はシナリオ班のおすすめ HINA・MOMO・NANA（虎雪に確認中）。
Object.assign(CHD,{Bb:[53,58,62],Ab:[56,60,63],Aaug:[57,61,65],Baug:[59,63,67],Gaug:[55,59,63],Faug:[53,57,61]});
Object.assign(ROOT,{Bb:46,Ab:44,Aaug:45,Baug:47,Gaug:43,Faug:41});
Object.assign(SONGS,{
 // HINA（モンキー125・体育会系の後輩・速攻）：明るい D メジャー、速い8ビート、16分で駆け上がる。シリーズのフレーズを長調に
 theme_hina:{bpm:172,dr:'drive',lead:'pulse',arpHi:true,arpG:.55,ldG:.8,rest:true,pass2:'keyup',
  ch:['D','A','Bm','G','D','A','G','A'],
  ld:[[[0,74,2],[2,78,2],[4,81,4],[8,86,4],[12,81,4]],[[0,79,6],[6,78,2],[8,76,8]],[[0,78,2],[2,79,2],[4,81,2],[6,83,2],[8,86,8]],[[0,83,4],[4,81,4],[8,79,4],[12,78,4]],
      [[0,74,2],[2,78,2],[4,81,4],[8,86,4],[12,90,4]],[[0,88,4],[4,86,4],[8,85,8]],[[0,83,4],[4,85,4],[8,86,4],[12,88,4]],[[0,90,8],[8,88,4],[12,85,4]]]},
 // MOMO（ND ロードスター・お姉さんで甘えんぼ・大連鎖で逆転）：F メジャーのディスコ寄り、はねるベースとエレピ、鈴
 theme_momo:{bpm:124,dr:'funk',lead:'pulse',ep:true,bells:true,rest:true,pass2:'keyup',
  ch:['F','Dm','Bb','C','F','Am','Bb','C'],
  ld:[[[0,69,4],[4,72,4],[8,76,8]],[[0,74,6],[6,72,2],[8,69,8]],[[0,70,4],[4,74,4],[8,77,4],[12,74,4]],[[0,72,12],[12,67,4]],
      [[0,69,4],[4,72,4],[8,77,6],[14,76,2]],[[0,76,4],[4,74,4],[8,72,8]],[[0,74,4],[4,77,4],[8,81,8]],[[0,79,8],[8,76,8]]]},
 // NANA（GR スープラ・高飛車お嬢様・最大のライバル）：C マイナーの華やかなブラスと速いアルペジオ（チェンバロ風）
 theme_nana:{bpm:158,dr:'drive',lead:'brass',arpHi:true,arpG:.75,rest:true,
  ch:['Cm','Ab','Eb','Bb','Cm','Ab','G','G'],
  ld:[[[0,75,4],[4,79,4],[8,84,8]],[[0,82,6],[6,80,2],[8,79,8]],[[0,79,4],[4,82,4],[8,87,4],[12,82,4]],[[0,86,12],[12,82,4]],
      [[0,84,2],[2,86,2],[4,87,4],[8,91,4],[12,87,4]],[[0,86,4],[4,84,4],[8,80,8]],[[0,79,4],[4,83,4],[8,86,4],[12,89,4]],[[0,91,8],[8,86,4],[12,83,4]]]},
 // キャラ選び：期待が高まる中くらいのテンポ。フレーズを間をあけて
 select:{bpm:112,dr:'half',soft:true,lead:'pulse',bells:true,
  ch:['Am','F','C','G','Dm','F','G','E'],
  ld:[[[0,69,4],[4,72,4],[8,76,8]],[],[[0,74,6],[6,72,2],[8,71,8]],[],[[0,76,4],[4,79,4],[8,81,8]],[],[[0,79,4],[4,77,4],[8,76,4],[12,74,4]],[[0,76,8],[8,80,8]]]},
 // ラン後の強化ショップ：ガレージで落ち着いて買い物。エレピとやわらかい主旋律
 upgrade:{bpm:96,dr:'half',soft:true,lead:'soft',ep:true,
  ch:['C','Am','F','G','C','Am','Dm','G'],
  ld:[[[0,76,4],[4,79,4],[8,84,8]],[],[[0,81,4],[4,79,4],[8,77,8]],[],[[0,76,4],[4,77,4],[8,79,8]],[],[[0,77,4],[4,76,4],[8,74,8]],[[0,79,8]]]},
 // 隠しステージ：ふだんの戦闘のノリのまま、全音音階（増三和音）で不思議に。逆回しのようにふくらむ音
 hidden:{bpm:138,dr:'four',lead:'bell',mystic:true,
  ch:['Aaug','Baug','Aaug','Gaug','Faug','Gaug','Aaug','Baug'],
  ld:[[[0,69,4],[4,73,4],[8,77,8]],[[0,75,6],[6,73,2],[8,71,8]],[[0,73,4],[4,77,4],[8,81,8]],[[0,79,12]],
      [[0,77,4],[4,75,4],[8,73,8]],[[0,71,4],[4,73,4],[8,75,8]],[[0,77,4],[4,81,4],[8,85,4],[12,81,4]],[[0,83,16]]]},
});
Object.assign(BGM,{theme_hina:{s:'theme_hina'},theme_momo:{s:'theme_momo'},theme_nana:{s:'theme_nana'},select:{s:'select'},upgrade:{s:'upgrade'},hidden:{s:'hidden'}});

// ジングル（β）。仲間が加わった：{who:'hina'|'momo'|'nana'} でその子の高さ・色に
const WHO={yuki:0,hina:5,momo:-4,nana:3,sora:7};
Object.assign(JINGLES,{
 night_select:{dur:1.6,fn:(c,o,t,p)=>{const lv=Math.max(1,Math.min(11,(p&&p.lv)||1)),k=lv-1;click(c,o,t,.5);click(c,o,t+.25,.5);tone(c,o,t+.45,{f:mf(33+k),dur:1.0,g:.5,a:.1,hold:.3});
  [57,60,64].forEach((m,i)=>tone(c,o,t+.5+i*.08,{wave:.25,f:mf(m+12+k),dur:.5,g:.09}));tone(c,o,t+.75,{f:mf(88+k),dur:.8,g:.05});
  if(lv>=6)tone(c,o,t+.45,{type:'sawtooth',f:mf(33+k-12),dur:1.0,g:.12,a:.05,hold:.3,lp:300});}},
 night_up:{dur:2.8,fn:(c,o,t,p)=>{const lv=Math.max(1,Math.min(11,(p&&p.lv)||1)),k=lv-1;[45,48,52,57,60,64].forEach((m,i)=>tone(c,o,t+i*.09,{type:'sawtooth',f:mf(m+12+k),dur:.25,g:.08,lp:2400}));
  nz(c,o,t,{f:400,f2:5000,dur:.6,g:.2,a:.5,q:.7});tone(c,o,t+.6,{f:110,f2:38,dur:.5,g:.9});nz(c,o,t+.6,{f:1600,dur:.3,g:.4,q:.6});
  [57,59,60,64].forEach(m=>[-8,8].forEach(d=>tone(c,o,t+.6,{type:'sawtooth',f:mf(m+k),det:d,dur:2,g:.04,a:.02,hold:.9,lp:1800})));if(lv>=6)tone(c,o,t+.6,{type:'sawtooth',f:mf(33+k),dur:1.6,g:.15,a:.03,hold:.6,lp:320});
  const r=rng(77);for(let i=0;i<6;i++)tone(c,o,t+1.0+r()*.9,{type:'square',f:300+r()*2500,dur:.03,g:.05});}},
 story_unlock:{dur:3.2,fn:(c,o,t)=>{[65,69,72,76,79,84].forEach((m,i)=>{tone(c,o,t+i*.12,{f:mf(m+12),dur:1.2,g:.08});tone(c,o,t+i*.12,{f:mf(m+12)*2.76,dur:.3,g:.02});});
  [53,57,60,64].forEach(m=>[-8,8].forEach(d=>tone(c,o,t+.3,{type:'sawtooth',f:mf(m),det:d,dur:2.6,g:.03,a:.8,hold:1,lp:1400})));
  for(let i=0;i<10;i++)tone(c,o,t+.9+i*.06,{wave:.125,f:mf(84+(i%4)*3),dur:.04,g:.05});tone(c,o,t+1.6,{wave:.25,f:mf(81),dur:1,g:.1,hold:.4});}},
 ally_join:{dur:3.2,fn:(c,o,t,p)=>{const k=WHO[(p&&p.who)||'yuki']||0;
  [[0,69],[.1,72],[.2,76],[.45,74],[.55,72],[.65,76]].forEach(([d,m])=>tone(c,o,t+d,{wave:.25,f:mf(m+k),dur:.12,g:.16}));
  tone(c,o,t+.85,{f:130,f2:42,dur:.3,g:.85});nz(c,o,t+.85,{f:1800,dur:.25,g:.4,q:.7});
  [69,73,76].forEach(m=>[-8,8].forEach(d=>tone(c,o,t+.85,{type:'sawtooth',f:mf(m+k),det:d,dur:2,g:.05,a:.02,hold:1,lp:2400})));
  tone(c,o,t+.85,{wave:.25,f:mf(81+k),dur:1.6,g:.15,hold:.7});[93,97,100].forEach((m,i)=>tone(c,o,t+1.0+i*.08,{f:mf(m+k),dur:.6,g:.05}));}},
});
Object.assign(LVJ,{night_select:1,night_up:1,story_unlock:2.5,ally_join:1});

SE.push(
{id:'upgrade_buy',name:'強化ショップで買った（マネーを払う）',dur:.8,fn:(c,o,t)=>{const r=rng(55);for(let i=0;i<7;i++)tone(c,o,t+r()*.25,{f:2600+r()*1800,dur:.18,g:.07});
 tone(c,o,t+.28,{f:2637,dur:.3,g:.12});tone(c,o,t+.34,{f:3520,dur:.35,g:.1});nz(c,o,t,{ft:'highpass',f:4000,dur:.25,g:.08});}},
{id:'card_unlock',name:'カードが解放された',dur:1.1,fn:(c,o,t)=>{nz(c,o,t,{f:1000,f2:6000,dur:.18,g:.25,a:.04,q:.8});
 [76,81,84,88,93].forEach((m,i)=>tone(c,o,t+.12+i*.05,{wave:.25,f:mf(m),dur:.12,g:.13}));tone(c,o,t+.4,{f:mf(100),dur:.6,g:.07});tone(c,o,t+.4,{f:mf(100)*2.76,dur:.2,g:.02});
 [69,76,81].forEach(m=>tone(c,o,t+.4,{type:'sawtooth',f:mf(m),dur:.6,g:.03,a:.02,hold:.2,lp:2400}));}},
{id:'save_ok',name:'セーブした',dur:.55,fn:(c,o,t)=>{click(c,o,t,.35);[72,76,79].forEach((m,i)=>tone(c,o,t+.04+i*.06,{wave:.25,f:mf(m+12),dur:.1,g:.13}));tone(c,o,t+.22,{f:mf(91),dur:.3,g:.06});}},
{id:'load_ok',name:'ロードした',dur:.6,fn:(c,o,t)=>{nz(c,o,t,{f:5000,f2:1200,dur:.18,g:.18,q:.8});[91,86,84].forEach((m,i)=>tone(c,o,t+.08+i*.07,{wave:.25,f:mf(m),dur:.1,g:.12}));tone(c,o,t+.3,{f:mf(72),dur:.3,g:.12});}},
{id:'overwrite_warn',name:'上書きの確認（「上書きしますか？」が出たとき）',dur:.45,fn:(c,o,t)=>{[0,.17].forEach(d=>{tone(c,o,t+d,{wave:.5,f:mf(81),dur:.07,g:.1,hold:.03});tone(c,o,t+d+.07,{wave:.5,f:mf(76),dur:.08,g:.1,hold:.03});});}},
{id:'autosave',name:'オートセーブ（小さく）',dur:.2,fn:(c,o,t)=>{tone(c,o,t,{wave:.25,f:mf(84),dur:.04,g:.06});tone(c,o,t+.05,{wave:.25,f:mf(91),dur:.06,g:.05});}},
);
Object.assign(LV,{upgrade_buy:2,card_unlock:2.8,save_ok:2.6,load_ok:2.6,overwrite_warn:3,autosave:2});

// ---------- v0.6（2026-11-18）：仲間の話のボス3体（その子のテーマのボス・アレンジ）・MIO の通信の SE ----------
// 正本：revremit-story.md 7-4（HINA＝空転・MOMO＝散花・NANA＝未決）。★チーフ 11-18：その子の話のボスだけ、その子のテーマのアレンジでよい。
Object.assign(CHD,{Fm:[56,60,65],Db:[56,61,65],Bbm:[53,58,61],Csus:[55,60,65]});
Object.assign(ROOT,{Fm:41,Db:49,Bbm:46,Csus:48});
Object.assign(SONGS,{
 // 空転（くうてん）：HINA のテーマを D マイナーに。タイヤが空回りするように、同じ2音の16分がぐるぐる回りつづける（spin）。2周目はキックが倍
 boss_kuuten:{bpm:176,dr:'boss',enemy:true,spin:true,lead:'pulse',pass2:'double',
  ch:['Dm','Dm','Bb','A','Dm','Dm','Bb','A'],
  ld:[[[0,74,2],[2,77,2],[4,81,4],[8,86,4],[12,81,4]],[[0,79,6],[6,77,2],[8,76,8]],[[0,77,2],[2,79,2],[4,81,2],[6,82,2],[8,86,8]],[[0,85,8],[8,81,8]],
      [[0,74,2],[2,77,2],[4,81,4],[8,74,2],[10,77,2],[12,81,4]],[[0,74,2],[2,77,2],[4,81,4],[8,74,2],[10,77,2],[12,81,4]],[[0,82,4],[4,81,4],[8,79,4],[12,77,4]],[[0,76,8],[8,73,8]]]},
 // 散花（さんか）：MOMO のテーマを F マイナーに。解散したクラブの最後のツーリング。はねるベースは残して、鈴とさみしい和音。2周目の前半はブレイク
 boss_sanka:{bpm:128,dr:'boss',enemy:true,ep:true,bells:true,lead:'pulse',pass2:'break',
  ch:['Fm','Db','Bbm','C','Fm','Db','Bbm','C'],
  ld:[[[0,68,4],[4,72,4],[8,77,8]],[[0,75,6],[6,73,2],[8,68,8]],[[0,70,4],[4,73,4],[8,77,4],[12,73,4]],[[0,72,12],[12,67,4]],
      [[0,68,4],[4,72,4],[8,77,6],[14,75,2]],[[0,75,4],[4,73,4],[8,72,8]],[[0,73,4],[4,77,4],[8,80,8]],[[0,79,8],[8,76,8]]]},
 // 未決（みけつ）：NANA のテーマのブラスを、止まった決勝の時計の「チッ、チッ」の上で（clock）。4小節ごとに一瞬止まる（freeze）
 boss_miketsu:{bpm:162,dr:'boss',enemy:true,lead:'brass',arpHi:true,clock:true,freeze:true,
  ch:['Cm','Ab','Eb','G','Cm','Ab','Csus','G'],
  ld:[[[0,75,4],[4,79,4],[8,84,8]],[[0,82,6],[6,80,2],[8,79,8]],[[0,79,4],[4,82,4],[8,87,4],[12,82,4]],[[0,86,8]],
      [[0,84,2],[2,86,2],[4,87,4],[8,91,4],[12,87,4]],[[0,86,4],[4,84,4],[8,80,8]],[[0,84,4],[4,82,4],[8,79,4],[12,77,4]],[[0,79,8]]]},
});
Object.assign(BGM,{boss_kuuten:{s:'boss_kuuten'},boss_sanka:{s:'boss_sanka'},boss_miketsu:{s:'boss_miketsu'}});
// 味つけ（renderBar の最後で呼ぶ）
function extraBar(c,o,v,sg,i,ch,T,st){const at=s=>T+s*st;
 if(sg.spin)for(let s=0;s<16;s++)tone(c,o,at(s),{wave:.125,f:mf(ch[0]+(s%2?26:24)),dur:st*.7,g:.03});
 if(sg.spin&&i%2===1)nz(c,o,T+st*8,{f:600,f2:2400,dur:st*8,g:.05,a:st*6,q:2});
 if(sg.clock)for(let s=0;s<16;s+=4){if(sg.freeze&&i%4===3&&s>=8)break;nz(c,o,at(s),{ft:'highpass',f:6000,dur:.02,g:.14});tone(c,o,at(s),{type:'square',f:s?2400:3200,dur:.012,g:.05});}
}
// 4小節目の後半を止める（未決）：その小節は 8 の位置で全部切る
function freezeCut(sg,i){return sg.freeze&&i%4===3;}

// MIO の通信（会話の場面。MIO 編では YUKI の通信にも使う）
SE.push(
{id:'comm_open',name:'通信が入った（MIO）',dur:.5,fn:(c,o,t)=>{nz(c,o,t,{f:2500,dur:.09,g:.25,q:.6});tone(c,o,t+.1,{wave:.5,f:mf(88),dur:.07,g:.1,hold:.03});tone(c,o,t+.19,{wave:.5,f:mf(93),dur:.1,g:.1,hold:.04});nz(c,o,t+.1,{f:3500,dur:.3,g:.02,a:.02,hold:.15,q:.5});}},
{id:'comm_close',name:'通信が切れた',dur:.4,fn:(c,o,t)=>{tone(c,o,t,{wave:.5,f:mf(93),dur:.06,g:.09,hold:.02});tone(c,o,t+.08,{wave:.5,f:mf(86),dur:.08,g:.09,hold:.02});nz(c,o,t+.17,{f:2200,f2:600,dur:.12,g:.2,q:.7});}},
{id:'comm_blip',name:'通信の文字送り（1文字・text_blip より少しこもる）',dur:.05,fn:(c,o,t)=>{tone(c,o,t,{wave:.5,f:mf(84),dur:.025,g:.05,lp:2400});nz(c,o,t,{f:3000,dur:.015,g:.03,q:.8});}},
{id:'comm_glitch',name:'通信が乱れた（ボスの前など）',dur:.7,fn:(c,o,t)=>{const r=rng(91);for(let i=0;i<7;i++){const d=r()*.5;nz(c,o,t+d,{f:1000+r()*4000,dur:.04,g:.22,q:1.5});if(r()<.5)tone(c,o,t+d,{type:'square',f:400+r()*2000,dur:.03,g:.04});}
 tone(c,o,t+.05,{wave:.5,f:mf(88),f2:mf(76),dur:.4,g:.05,lin:true});}},
);
Object.assign(LV,{comm_open:2.6,comm_close:2.4,comm_blip:4,comm_glitch:2});

// ---------- v0.7（2026-11-18）：裏道（ロストライン）のジングル・みおのラボ ----------
// 正本：revremit-design.md 9-6・text.md 12-5。勝つ＝不思議な全音音階から明るい和音へほどける（このあと card_unlock）。
// 逃げられた＝負けではないので暗くしない。全音音階が下りながら遠ざかり、ほどけないまま消える
Object.assign(JINGLES,{
 hidden_win:{dur:2.6,fn:(c,o,t)=>{[69,71,73,75,77,79].forEach((m,i)=>{tone(c,o,t+i*.06,{f:mf(m+12),dur:.6,g:.07});tone(c,o,t+i*.06,{f:mf(m+12)*2.76,dur:.2,g:.015});});
  nz(c,o,t,{ft:'highpass',f:1500,f2:9000,dur:.45,g:.08,a:.4});
  tone(c,o,t+.45,{f:130,f2:42,dur:.3,g:.8});nz(c,o,t+.45,{f:1800,dur:.25,g:.4,q:.7});
  [69,73,76].forEach(m=>[-8,8].forEach(d=>tone(c,o,t+.45,{type:'sawtooth',f:mf(m),det:d,dur:1.8,g:.05,a:.02,hold:.8,lp:2400})));
  [[.45,81],[.57,85],[.69,88]].forEach(([d,m])=>tone(c,o,t+d,{wave:.25,f:mf(m),dur:.14,g:.15}));tone(c,o,t+.81,{wave:.25,f:mf(93),dur:1.2,g:.14,hold:.5});
  tone(c,o,t+.9,{f:mf(100),dur:.9,g:.05});}},
 hidden_escape:{dur:2.6,fn:(c,o,t)=>{nz(c,o,t,{f:4000,f2:500,dur:1.2,g:.2,a:.15,q:.7});
  [81,79,77,75,73,71].forEach((m,i)=>tone(c,o,t+.1+i*.12,{f:mf(m),dur:.7,g:.08-i*.008}));
  [57,61,65].forEach(m=>[-8,8].forEach(d=>tone(c,o,t+.4,{type:'sawtooth',f:mf(m),det:d,dur:2,g:.035,a:.3,hold:.6,lp:1200})));
  tone(c,o,t+1.0,{wave:.25,f:mf(77),dur:.9,g:.06,hold:.2});}},
});
Object.assign(LVJ,{hidden_win:1,hidden_escape:1.6});
// v0.10：β の終わり「次の仲間は……？」（text 12-2 ally_next・15章 next_sora の前）。ally_join のファンファーレの頭だけ鳴って、決めの音の手前で止まる（問いかけ）
Object.assign(JINGLES,{ally_next:{dur:2.6,fn:(c,o,t)=>{[[0,69],[.1,72],[.2,76],[.45,74],[.55,72]].forEach(([d,m])=>tone(c,o,t+d,{wave:.25,f:mf(m+2),dur:.12,g:.15}));
 tone(c,o,t+.7,{wave:.25,f:mf(80),dur:.9,g:.1,hold:.2});[69,73,77].forEach(m=>[-8,8].forEach(d=>tone(c,o,t+.7,{type:'sawtooth',f:mf(m),det:d,dur:1.8,g:.035,a:.3,hold:.6,lp:1600})));
 [0,.18,.36].forEach((d,i)=>tone(c,o,t+1.3+d,{f:mf(88+i*2),dur:.6,g:.04}));}}});
Object.assign(LVJ,{ally_next:3.5});
Object.assign(BGM,{lab:{s:'upgrade'}}); // 強化ショップ「みおのラボ」（text.md 12-4）。upgrade と同じ曲。どちらで呼んでもよい

// ---------- v0.8（2026-11-18）：写真の「カシャ」（text.md 13-6 momo_boss_post 3行目・13-8 momo_ed 21行目） ----------
SE.push({id:'photo_shutter',name:'写真を撮った（カシャ）',dur:.35,fn:(c,o,t)=>{nz(c,o,t,{ft:'highpass',f:3000,dur:.03,g:.5});tone(c,o,t,{f:220,f2:120,dur:.05,g:.35});
 nz(c,o,t+.07,{f:2500,f2:1200,dur:.06,g:.35,q:1.2});nz(c,o,t+.13,{ft:'highpass',f:4000,dur:.025,g:.4});tone(c,o,t+.13,{type:'square',f:1600,dur:.012,g:.05});}});
Object.assign(LV,{photo_shutter:.8});

// ---------- v0.9（2026-11-18）：CROSS GATE の起動音・ブローの確認 ----------
// 起動音：セルモーターの「キュキュキュ」→ エンジンがかかる（本物寄りのエンジン音で 900→1400）→ シリーズのフレーズ「ラ・ド・ミ｜レ・ド・シ♭」がベルで鳴り、白い光のように広がる
// （story：起動音がエンジンの始動音に似ている＝YUKI のひみつ。ROAD LOG No.001「波形がぴったり重なる」）。text の「起動音。白い光。」の行で1回
SE.push({id:'gate_boot',name:'CROSS GATE の起動音（エンジンの始動音に似ている。{rec:true} で録った音を小さく流す＋奥の細い旋律）',dur:3.2,fn:(c,o,t,p)=>{
 if(p&&p.rec){const bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1400;bp.Q.value=.6;const gg=c.createGain();gg.gain.value=.7;bp.connect(gg).connect(o);o=bp;
  // そらの未公開の曲＝起動音の旋律（シリーズのフレーズ「ラ・ド・ミ｜レ・ド・シ♭」。text 15章 9行目「起動音の奥に、細い旋律」）：
  // ベルのフレーズより先に、細い 12.5% の音で高く小さく（v0.10.1：別の旋律にしていたのを、起動音の旋律と同じにそろえた）
  [[0,69],[.16,72],[.32,76],[.56,74],[.72,72],[.88,70],[1.2,69]].forEach(([d,m])=>tone(c,gg,t+.75+d,{wave:.125,f:mf(m+24),dur:.3,g:.045,hold:.08}));nz(c,gg,t,{ft:'highpass',f:3000,dur:3,g:.015,a:.05,hold:2.6});}
 const pt=p&&p.part; // v0.11（SORA 編）：{part:'start'}＝始動音だけ／{part:'melody'}＝旋律だけ
 if(pt!=='melody'){for(let i=0;i<6;i++){tone(c,o,t+i*.1,{type:'square',f:70+i*4,dur:.08,g:.12,lp:900});nz(c,o,t+i*.1,{f:1200,dur:.05,g:.12,q:2});}
 burst(c,o,t+.6,900,1400,'real',{dur:1.8});}
 if(pt==='start')return;
 if(pt==='melody'){const mg=c.createGain();mg.gain.value=2.4;mg.connect(o);o=mg;} // 旋律だけのときは、始動音のぶん大きく
 [[0,69],[.18,72],[.36,76],[.62,74],[.8,72],[.98,70]].forEach(([d,m])=>{tone(c,o,t+1.0+d,{f:mf(m+12),dur:1.1,g:.07});tone(c,o,t+1.0+d,{f:mf(m+12)*2.76,dur:.3,g:.018});});
 [57,62,65].forEach(m=>[-8,8].forEach(d=>tone(c,o,t+1.3,{type:'sawtooth',f:mf(m),det:d,dur:1.9,g:.025,a:.9,hold:.5,lp:1600})));
 nz(c,o,t+1.3,{ft:'highpass',f:2000,f2:9000,dur:1.8,g:.06,a:1.2});}},
// ブローの確認の小窓（「ブローします。打ちますか？」）：上書きの確認よりはっきり強い注意。低い「ドゥン」＋下がる2音を2回。エラーの音（card_cant）とは別
{id:'blow_warn',name:'ブローの確認の小窓が出た（⚠ブロー）',dur:.6,fn:(c,o,t)=>{tone(c,o,t,{f:90,f2:55,dur:.25,g:.5});
 [0,.2].forEach(d=>{tone(c,o,t+d,{type:'square',f:mf(81),dur:.08,g:.1,hold:.04,lp:3000});tone(c,o,t+d+.09,{type:'square',f:mf(75),dur:.09,g:.1,hold:.04,lp:3000});});}});
Object.assign(LV,{gate_boot:.8,blow_warn:2.2});

// ---------- v0.11（2026-11-18）：SORA 編（β のあと）。試作ではまだ呼ばない（チーフ 19:29「未実装キャラの素材を貯めておく」） ----------
// 正本：revremit-audio-list.md 9章・story 7-8。そらの曲＝起動音の旋律（ラ・ド・ミ｜レ・ド・シ♭）から始まって、そらが明るく続けた曲（案 A・チーフ 15:01）
const SORA_LD=[[[0,69,4],[4,72,4],[8,76,8]],[[0,74,4],[4,72,4],[8,70,4],[12,72,4]],[[0,76,2],[2,79,2],[4,81,4],[8,79,2],[10,76,2],[12,74,4]],[[0,74,2],[2,76,2],[4,79,6],[10,77,2],[12,74,4]],
 [[0,77,4],[4,76,2],[6,74,2],[8,72,8]],[[0,74,2],[2,76,2],[4,77,2],[6,79,2],[8,83,8]],[[0,84,6],[6,83,2],[8,79,8]],[[0,76,4],[4,79,4],[8,84,8]]];
Object.assign(SONGS,{
 // SORA で走るランのふつうの戦闘：テンポの型（手数）に合わせて、はねるベースと16分のハイハット。4小節ごとに主旋律の音色が替わる（棒＝矩形波 → 三節＝ベル → 短棒＝ブラス）
 theme_sora:{bpm:140,dr:'funk',swap:true,ep:true,bells:true,rest:true,pass2:'keyup',ch:['Am','F','C','G','F','G','C','C'],ld:SORA_LD},
 // エンディングで、そらがガレージの BGM を勝手に変えた曲（theme_sora のゆったりした版）
 garage_sora:{bpm:84,dr:'half',soft:true,lead:'soft',ep:true,bells:true,ch:['Am','F','C','G','F','G','C','C'],ld:SORA_LD},
 // そらの話のボス「無音」：前半（PHASE 1）はキック・ベース・主旋律なし、4小節目はほぼ無音。AUDIO.bgmPhase(2)（体力50％の行のあと）で、そらの旋律が入ってボス曲がもどる
 boss_muon:{bpm:150,dr:'boss',enemy:true,muon:true,pass2:'double',ch:['Am','Am','F','E','Am','F','Dm','E'],ld:SORA_LD},
});
Object.assign(BGM,{theme_sora:{s:'theme_sora'},garage_sora:{s:'garage_sora'},boss_muon:{s:'boss_muon'}});
SE.push(
// スイッチロッド（そらの武器）を振った：{form:'rod'|'three'|'short'}（棒・三節・短棒）。振ると音が鳴る
{id:'rod_swing',name:'スイッチロッドを振った（{form:rod|three|short}）',dur:.45,fn:(c,o,t,p)=>{const f=(p&&p.form)||'rod';
 if(f==='rod'){nz(c,o,t,{f:800,f2:3500,dur:.18,g:.3,a:.04,q:1.2});tone(c,o,t+.08,{wave:.25,f:mf(72),dur:.25,g:.14,hold:.05});tone(c,o,t+.08,{f:mf(84),dur:.3,g:.04});}
 else if(f==='three'){nz(c,o,t,{f:1500,f2:5000,dur:.12,g:.22,a:.02,q:1.5});[76,79,84].forEach((m,i)=>tone(c,o,t+.05+i*.05,{f:mf(m),dur:.25,g:.08}));[76,79,84].forEach((m,i)=>tone(c,o,t+.05+i*.05,{f:mf(m)*2.76,dur:.1,g:.02}));}
 else{nz(c,o,t,{f:2000,dur:.09,g:.4,q:.7});tone(c,o,t,{type:'triangle',f:220,f2:160,dur:.08,g:.25});tone(c,o,t+.02,{wave:.25,f:mf(81),dur:.08,g:.1});}}},
// 零号の前、そらが旋律を口ずさむ（声ではなく、やわらかい笛のような音）：起動音の旋律の頭5音
{id:'sora_hum',name:'そらが起動音の旋律を口ずさむ（笛のような音）',dur:2.4,fn:(c,o,t)=>{
 const os=c.createOscillator();os.type='sine';const lfo=c.createOscillator();lfo.frequency.value=5.2;const ld=c.createGain();ld.gain.value=0;lfo.connect(ld).connect(os.frequency);
 const g=c.createGain();g.gain.value=0;os.connect(g).connect(o);const N=[[0,69],[.36,72],[.72,76],[1.2,74],[1.56,72]];
 N.forEach(([d,m],k)=>{const tt=t+d,f=mf(m+12);os.frequency.setTargetAtTime(f,tt,.02);g.gain.setTargetAtTime(.16,tt,.03);g.gain.setTargetAtTime(.09,tt+.25,.06);});
 ld.gain.setValueAtTime(0,t);ld.gain.linearRampToValueAtTime(6,t+.6);g.gain.setTargetAtTime(0,t+2.0,.12);
 os.start(t);lfo.start(t);os.stop(t+2.4);lfo.stop(t+2.4);nz(c,o,t,{ft:'bandpass',f:2500,q:.8,dur:2.1,g:.02,a:.1,hold:1.6});}},
);
Object.assign(LV,{rod_swing:2,sora_hum:2.2});


// ---------- v0.12（2026-11-18）：KAEDE・RIN・LUNA・KURO・MIO 編（β のあと）。試作ではまだ呼ばない（★虎雪 19:12・20:15「止まっている班は素材を貯める」・チーフ 20:15） ----------
// 正本：revremit-audio-list.md 10章・text 19〜23章（各章の X-10）。曲の頭は、どれもシリーズのフレーズ（ラ・ド・ミ｜レ・ド・シ♭）をその子の調にしたもの
Object.assign(CHD,{Em7:[55,59,62],Fmaj:[53,57,60],Cmaj7:[59,64,67],Abmaj7:[55,60,63]});
Object.assign(ROOT,{Em7:40,Fmaj:41,Cmaj7:48,Abmaj7:44});
const RYU=[0,4,5,7,11]; // 琉球の音階（ド・ミ・ファ・ソ・シ）＝みおの故郷の南の島の歌の感じ
Object.assign(SONGS,{
 // KAEDE（Z・パワーで押し切る・豪快な勝負好き）：E マイナーのロック。重いキックと刻むパワーコード、ブラスの主旋律。2周目は1オクターブ上
 theme_kaede:{bpm:152,dr:'rock',lead:'brass',power:true,rest:true,pass2:'up',
  ch:['Em','C','D','B','Em','C','Am','B'],
  ld:[[[0,76,4],[4,79,4],[8,83,8]],[[0,81,6],[6,79,2],[8,77,4],[12,79,4]],[[0,79,2],[2,81,2],[4,83,4],[8,86,4],[12,83,4]],[[0,87,12],[12,83,4]],
      [[0,76,4],[4,79,4],[8,83,4],[12,88,4]],[[0,86,4],[4,84,4],[8,83,8]],[[0,84,4],[4,83,4],[8,81,4],[12,79,4]],[[0,78,8],[8,75,4],[12,71,4]]]},
 // RIN（IS・読んで妨害・やわらかい大人）：G マイナーの夜のジャズ寄り。はじく弦の刻み、リードの音色（クラリネット風）。4小節目の終わりに「止める」一撃
 theme_rin:{bpm:132,dr:'funk',lead:'reed',stab:true,ep:true,rest:true,pass2:'keyup',
  ch:['Gm','Eb','Cm','D','Gm','Eb','Ab','D'],
  ld:[[[0,67,4],[4,70,4],[8,74,8]],[[0,72,6],[6,70,2],[8,68,8]],[[0,70,3],[3,72,1],[4,74,4],[8,79,4],[12,77,4]],[[0,78,8],[12,74,4]],
      [[0,67,4],[4,70,4],[8,74,4],[12,79,4]],[[0,77,3],[3,75,1],[4,74,8],[12,70,4]],[[0,72,4],[4,75,4],[8,79,4],[12,75,4]],[[0,74,12]]]},
 // LUNA（86・未来を読む・穏やかで詩的）：Eb メジャーの夜空。オルゴールのアルペジオとベルの主旋律。次の音が少し先に小さく聞こえる（先読み）
 theme_luna:{bpm:132,dr:'half',lead:'bell',arpHi:true,arpG:.6,bells:true,fore:true,rest:true,pass2:'keyup',
  ch:['Eb','Cm','Ab','Bb','Eb','Cm','Ab','Bb'],
  ld:[[[0,75,4],[4,79,4],[8,82,8]],[[0,80,6],[6,79,2],[8,77,8]],[[0,79,4],[4,82,4],[8,87,8]],[[0,86,12]],
      [[0,84,4],[4,82,4],[8,79,8]],[[0,79,4],[4,80,4],[8,84,8]],[[0,82,4],[4,80,4],[8,79,4],[12,77,4]],[[0,79,16]]]},
 // KURO（モールトン・罠と作戦変更・いたずら好き）：G マイナーのはねるリズム。半音でずれる主旋律、ときどき音が「つまずく」グリッチ、8小節目に「ざーんねん♪」
 theme_kuro:{bpm:146,dr:'bounce',lead:'pulse',glitchy:true,rest:true,pass2:'keyup',
  ch:['Gm','Gm','Eb','D','Gm','Bb','Eb','D'],
  ld:[[[0,67,3],[3,70,1],[4,74,4],[8,73,2],[10,74,6]],[[0,72,4],[4,70,2],[6,69,2],[8,68,8]],[[0,67,2],[2,70,2],[4,74,2],[6,79,2],[8,78,4],[12,79,4]],[[0,74,6],[8,73,2],[10,74,2],[12,66,4]],
      [[0,79,3],[3,78,1],[4,79,4],[8,82,4],[12,79,4]],[[0,77,4],[4,74,4],[8,70,8]],[[0,75,2],[2,74,2],[4,75,2],[6,79,2],[8,82,8]],[[0,81,4],[4,78,4],[8,74,2],[10,73,2],[12,74,4]]]},
 // MIO（N-ONE・先読みと最適化・南の島の出身）：C の琉球の音階。正確な16分のアルペジオ、音から音へなめらかにすべる主旋律（CVT）
 theme_mio:{bpm:128,dr:'four',lead:'pulse',glide:true,ryu:true,bells:true,rest:true,pass2:'keyup',
  ch:['Am','F','C','G','Am','F','G','E'],
  ld:[[[0,69,4],[4,72,4],[8,76,8]],[[0,74,6],[6,72,2],[8,71,8]],[[0,72,4],[4,76,4],[8,77,4],[12,79,4]],[[0,83,8],[8,84,8]],
      [[0,84,4],[4,83,4],[8,79,4],[12,77,4]],[[0,76,4],[4,77,4],[8,79,8]],[[0,77,4],[4,76,4],[8,72,4],[12,71,4]],[[0,76,16]]]},
 // 影線（KAEDE のボス）：theme_kaede をボス曲に。主旋律の16分前を、同じ線の「影」が先に走る（shadow）
 boss_kagesen:{bpm:168,dr:'boss',enemy:true,lead:'brass',power:true,shadow:true,pass2:'double',
  ch:['Em','Em','C','B','Em','C','Am','B'],
  ld:[[[0,76,4],[4,79,4],[8,83,8]],[[0,81,6],[6,79,2],[8,77,8]],[[0,79,4],[4,83,4],[8,88,8]],[[0,87,8],[8,83,8]],
      [[0,76,2],[2,79,2],[4,83,4],[8,76,2],[10,79,2],[12,83,4]],[[0,84,4],[4,83,4],[8,79,8]],[[0,81,4],[4,79,4],[8,77,4],[12,76,4]],[[0,75,8],[8,71,8]]]},
 // 欠番（RIN のボス）：theme_rin をボス曲に。ところどころ音が抜け（holes）、ページをめくる音と番号札の音
 boss_ketsuban:{bpm:136,dr:'boss',enemy:true,lead:'reed',stab:true,holes:true,ketsu:true,pass2:'break',
  ch:['Gm','Gm','Eb','D','Cm','Eb','Ab','D'],
  ld:[[[0,67,2],[2,70,2],[4,74,4],[8,79,4],[12,74,4]],[[0,72,4],[4,70,4],[8,68,8]],[[0,70,2],[2,72,2],[4,74,2],[6,75,2],[8,79,8]],[[0,78,8],[8,74,8]],
      [[0,75,4],[4,74,4],[8,72,4],[12,70,4]],[[0,70,2],[2,72,2],[4,74,4],[8,79,4],[12,77,4]],[[0,75,4],[4,77,4],[8,79,8]],[[0,78,8],[8,74,8]]]},
 // 凍星（LUNA のボス）：theme_luna を C マイナーのボス曲に。4小節ごとに時が止まり、音が凍ったように伸びる（frozen）。後ろでずっと凍った高い音
 boss_itebosi:{bpm:144,dr:'boss',enemy:true,lead:'bell',arpHi:true,arpG:.5,frozen:true,fore:true,
  ch:['Cm','Ab','Eb','G','Cm','Ab','Fm','G'],
  ld:[[[0,72,4],[4,75,4],[8,79,8]],[[0,77,6],[6,75,2],[8,74,8]],[[0,75,4],[4,79,4],[8,84,8]],[[0,83,12]],
      [[0,84,4],[4,82,4],[8,79,8]],[[0,80,4],[4,79,4],[8,77,8]],[[0,77,4],[4,75,4],[8,74,4],[12,72,4]],[[0,71,12]]]},
 // 裏面（KURO のボス）：theme_kuro をボス曲に。主旋律が逆回しのようにふくらんでぷつっと切れる（rev）、逆回しのシンバル。勝ったら win でもとにもどる
 boss_uramen:{bpm:150,dr:'boss',enemy:true,rev:true,glitchy:true,pass2:'double',
  ch:['Gm','Gm','Eb','D','Gm','Bb','Eb','D'],
  ld:[[[0,74,4],[4,70,4],[8,67,8]],[[0,68,6],[6,69,2],[8,72,8]],[[0,79,4],[4,74,4],[8,70,4],[12,67,4]],[[0,66,8],[8,74,8]],
      [[0,79,4],[4,82,4],[8,79,8]],[[0,70,4],[4,74,4],[8,77,8]],[[0,82,4],[4,79,4],[8,75,4],[12,74,4]],[[0,73,4],[4,74,12]]]},
 // 潮騒（MIO のボス）：theme_mio を A マイナーのボス曲に。後ろで波がよせて返し（waves）、強い小節と弱い小節がかわるがわる来る（tide）
 boss_shiosai:{bpm:140,dr:'boss',enemy:true,lead:'pulse',glide:true,ryu:true,waves:true,tide:true,
  ch:['Am','Am','F','E','Am','F','Dm','E'],
  ld:[[[0,69,4],[4,72,4],[8,76,8]],[[0,74,6],[6,72,2],[8,71,8]],[[0,72,4],[4,76,4],[8,77,4],[12,79,4]],[[0,83,8],[8,80,8]],
      [[0,81,4],[4,83,4],[8,84,8]],[[0,83,4],[4,79,4],[8,77,8]],[[0,76,4],[4,77,4],[8,79,4],[12,76,4]],[[0,76,16]]]},
});
Object.assign(BGM,{theme_kaede:{s:'theme_kaede'},theme_rin:{s:'theme_rin'},theme_luna:{s:'theme_luna'},theme_kuro:{s:'theme_kuro'},theme_mio:{s:'theme_mio'},
 boss_kagesen:{s:'boss_kagesen'},boss_ketsuban:{s:'boss_ketsuban'},boss_itebosi:{s:'boss_itebosi'},boss_uramen:{s:'boss_uramen'},boss_shiosai:{s:'boss_shiosai'}});
Object.assign(WHO,{kaede:-2,rin:-7,luna:10,kuro:1,mio:8});
// 波の音（潮騒・ROAD の港）：ゆっくりよせて返す。renderBar（waves）と AUDIO.ambient('wave') の両方で使う
function waveSwell(c,o,t,len,g,r){nz(c,o,t,{ft:'lowpass',f:350,f2:1600+r()*600,dur:len,g,a:len*.55,q:.4});nz(c,o,t+len*.45,{ft:'highpass',f:2500,f2:6000,dur:len*.6,g:g*.35,a:len*.15});}
function extraBar2(c,o,v,sg,i,ch,T,st,b,rt,fr){const at=s=>T+s*st,r=rng(b*131+3),bd=barDur(sg);
 if(sg.power&&!fr)for(let s=0;s<16;s+=2){const big=s===0||s===8;[0,7].forEach(d=>tone(c,o,at(s),{type:'sawtooth',f:mf(rt+12+d),dur:big?st*3:st*.9,g:big?.06:.045,lp:big?1800:900}));}
 if(sg.stab&&!fr){[0,3,6,8,11,14].forEach(s=>tone(c,o,at(s),{type:'triangle',f:mf(ch[(s/3|0)%3]+12),dur:.09,g:.07}));
  if(i%4===3){ch.forEach(x=>tone(c,o,at(12),{type:'sawtooth',f:mf(x+12),dur:.12,g:.06,lp:2400}));nz(c,o,at(12),{ft:'highpass',f:3000,dur:.04,g:.2});}}
 if(sg.ketsu){if(i%2===1)nz(c,o,at(8),{f:1800,f2:5000,dur:.16,g:.08,q:.9});if(r()<.6){const s=4+Math.floor(r()*10);tone(c,o,at(s),{type:'triangle',f:1300,dur:.04,g:.05});tone(c,o,at(s)+.035,{type:'triangle',f:900,dur:.05,g:.04});}}
 if(sg.frozen){if(fr){ch.forEach((x,k)=>tone(c,o,T+k*.05,{f:mf(x+24),dur:bd*1.4,g:.04,a:.02,hold:bd*.6}));nz(c,o,T,{ft:'highpass',f:6000,dur:bd,g:.03,a:bd*.4});}
  else tone(c,o,T,{f:mf(ch[2]+36),dur:bd,g:.012,a:bd*.3,hold:bd*.5});}
 if(sg.rev&&i%2===1)nz(c,o,at(4),{ft:'highpass',f:3000,f2:9000,dur:st*8,g:.12,a:st*7.8}); // 逆回しのシンバル（ふくらんで切れる）
 if(sg.glitchy){if(r()<.45){const s=Math.floor(r()*12),f=mf(ch[0]+24+Math.floor(r()*3)*3);for(let k=0;k<3;k++)tone(c,o,at(s)+k*st/2,{wave:.125,f,dur:st/2.3,g:.05});}
  if(i%8===7)tone(c,o,at(12),{wave:.25,f:mf(79),f2:mf(67),dur:st*4,g:.08,lin:true}); // 「ざーんねん♪」
  if(r()<.3)tone(c,o,at(Math.floor(r()*16)),{type:'square',f:300+r()*2500,dur:.02,g:.035});}
 if(sg.ryu&&!fr)for(let s=0;s<16;s++){const k=[0,1,2,3,4,3,2,1][s%8],oc=s>=8&&i%2?12:0;tone(c,o,at(s),{wave:.125,f:mf(60+RYU[k]+24+oc),dur:st*.8,g:.03});}
 if(sg.waves&&i%2===0)waveSwell(c,o,T,bd*2,.07,r);
 if(sg.tide&&i%2===1)for(let s=2;s<16;s+=4)tone(c,o,at(s),{f:110,f2:40,dur:.18,g:.45}); // 強い波の小節（キックがふえる）
}
SE.push(
// KAEDE：ツインターボ・ブレイカーを振った（タービンの「キューン」が上がって、重い風切り、ブローオフの「プシュッ」）
{id:'turbo_swing',name:'ツインターボ・ブレイカーを振った（KAEDE）',dur:.7,fn:(c,o,t)=>{[0,7].forEach(d=>tone(c,o,t,{f:1800+d*20,f2:6500+d*40,dur:.32,g:.06,a:.2}));
 nz(c,o,t+.18,{f:400,f2:1800,dur:.28,g:.45,a:.06,q:.8});tone(c,o,t+.24,{f:90,f2:45,dur:.2,g:.35});nz(c,o,t+.38,{ft:'highpass',f:3500,f2:7000,dur:.28,g:.18,a:.01});}},
// RIN：スピンドルボウ（弓）。引く＝糸がきしむ音が上がる、放つ＝弦の「ビン」と細い風切り
{id:'bow_draw',name:'弓を引いた（RIN）',dur:.55,fn:(c,o,t)=>{tone(c,o,t,{type:'sawtooth',f:80,f2:150,dur:.5,g:.06,a:.35,lp:700});nz(c,o,t,{f:900,f2:2400,dur:.5,g:.07,a:.4,q:3});
 for(let k=0;k<5;k++)nz(c,o,t+.06+k*.08,{f:1500+k*200,dur:.02,g:.06,q:4});}},
{id:'bow_shot',name:'弓を放った（RIN）',dur:.5,fn:(c,o,t)=>{tone(c,o,t,{type:'triangle',f:196,dur:.35,g:.3});tone(c,o,t,{f:392,dur:.2,g:.08});nz(c,o,t,{ft:'highpass',f:3000,dur:.03,g:.25});
 nz(c,o,t+.02,{f:2500,f2:6000,dur:.3,g:.18,a:.02,q:2});tone(c,o,t+.05,{f:mf(91),dur:.2,g:.03});}},
// 欠番：ページをめくる音／番号札の音（{miss:true} で抜けた番号＝こもった「コッ」）
{id:'page_flip',name:'ページをめくる（欠番）',dur:.35,fn:(c,o,t)=>{nz(c,o,t,{f:1500,f2:4500,dur:.13,g:.3,a:.04,q:.8});nz(c,o,t+.11,{f:3500,f2:1800,dur:.12,g:.22,a:.01,q:.8});nz(c,o,t+.2,{ft:'lowpass',f:700,dur:.06,g:.15});}},
{id:'num_tag',name:'番号札の音（欠番。{miss:true}＝抜けた番号）',dur:.25,fn:(c,o,t,p)=>{if(p&&p.miss){tone(c,o,t,{type:'triangle',f:300,dur:.08,g:.25,lp:600});nz(c,o,t,{ft:'lowpass',f:500,dur:.05,g:.15});return;}
 tone(c,o,t,{type:'triangle',f:1400,dur:.05,g:.18});tone(c,o,t+.06,{type:'triangle',f:950,dur:.08,g:.15});nz(c,o,t,{ft:'highpass',f:4000,dur:.015,g:.15});}},
// LUNA：ホライゾン・ペンデュラム（振り子）。ゆっくり左右に揺れる鈴「チーン…コーン」。流れ星（凍星に勝った）
{id:'pendulum',name:'振り子が揺れた（LUNA）',dur:1.7,fn:(c,o,t)=>{[[0,-.7,88],[.7,.7,83]].forEach(([d,pn,m])=>{let n=o;if(c.createStereoPanner){n=c.createStereoPanner();n.pan.value=pn;n.connect(o);}
 nz(c,n,t+Math.max(0,d-.2),{f:1200,f2:600,dur:.3,g:.04,a:.2,q:.6});tone(c,n,t+d,{f:mf(m),dur:.9,g:.12});tone(c,n,t+d,{f:mf(m)*2.76,dur:.35,g:.03});tone(c,n,t+d,{f:mf(m-24),dur:.5,g:.04});});}},
{id:'shooting_star',name:'流れ星（凍星に勝った・止まっていた星が動きだす）',dur:2,fn:(c,o,t)=>{for(let k=0;k<14;k++){const m=100-k*1.6;tone(c,o,t+k*.07,{f:mf(m),dur:.4,g:.06-k*.003});tone(c,o,t+k*.07,{f:mf(m)*2.76,dur:.15,g:.012});}
 nz(c,o,t,{ft:'highpass',f:7000,f2:2500,dur:1.2,g:.08,a:.1});[75,79,82,87].forEach((m,k)=>tone(c,o,t+1.0+k*.07,{f:mf(m+12),dur:.9,g:.05}));}},
// KURO：赤いグリッチ（join_kuro 1行目）。心拍（{hp:0〜1}。耐久が減るほど速く・強く。ゲームでは AUDIO.heart() で回す）
{id:'kuro_glitch',name:'赤いグリッチ（KURO）',dur:.8,fn:(c,o,t)=>{const r=rng(66);for(let k=0;k<9;k++){const d=r()*.55;tone(c,o,t+d,{type:'square',f:120+r()*3000,dur:.025+r()*.04,g:.07});if(r()<.5)nz(c,o,t+d,{f:500+r()*5000,dur:.03,g:.15,q:2});}
 tone(c,o,t,{type:'sawtooth',f:mf(55),f2:mf(43),dur:.5,g:.08,lp:900});[0,.05,.1].forEach(d=>tone(c,o,t+.6+d,{wave:.125,f:mf(91),dur:.03,g:.05}));}},
{id:'heartbeat',name:'心拍（KURO。{hp:0〜1}）',dur:.5,fn:(c,o,t,p)=>{const h=(p&&p.hp!=null)?p.hp:1,g=.5+(1-h)*.25;
 tone(c,o,t,{f:70,f2:45,dur:.16,g});tone(c,o,t+.14,{f:62,f2:42,dur:.18,g:g*.7});if(h<.3)nz(c,o,t,{ft:'lowpass',f:300,dur:.1,g:.12});}},
// 裏面に勝った：逆さのコースが「くるり」と裏返って、色がもどる（逆回しのふくらみ → 決めの音）
{id:'flip_back',name:'裏返ってもとにもどる（裏面に勝った）',dur:1.2,fn:(c,o,t)=>{nz(c,o,t,{ft:'highpass',f:2500,f2:9000,dur:.6,g:.2,a:.58});tone(c,o,t,{wave:.25,f:mf(67),f2:mf(79),dur:.6,g:.08,a:.5});
 tone(c,o,t+.6,{wave:.25,f:mf(79),dur:.08,g:.14});tone(c,o,t+.68,{wave:.25,f:mf(86),dur:.4,g:.12,hold:.1});nz(c,o,t+.6,{ft:'highpass',f:4000,dur:.05,g:.3});}},
// MIO：ベルトウィップ（ムチ）。ベルトが伸びる「ミョーン」→ はじける「パシッ」。みおの電子工作の音（エンディング 20行目。南の島の歌みたいな、やさしい音・短く）
{id:'belt_whip',name:'ベルトウィップを振った（MIO）',dur:.5,fn:(c,o,t)=>{tone(c,o,t,{type:'sawtooth',f:180,f2:620,dur:.24,g:.08,a:.05,lp:1400});tone(c,o,t,{f:360,f2:1240,dur:.24,g:.04,a:.05});
 nz(c,o,t+.24,{ft:'highpass',f:2500,dur:.05,g:.55});tone(c,o,t+.24,{type:'square',f:1800,dur:.02,g:.08});nz(c,o,t+.27,{f:3000,f2:1200,dur:.15,g:.1,q:.8});}},
{id:'mio_kit',name:'みおの電子工作の音（南の島の歌みたいな、やさしい音）',dur:4.2,fn:(c,o,t)=>{
 const N=[[0,72,2],[2,76,2],[4,77,2],[6,79,4],[10,83,2],[12,84,6],[18,83,2],[20,79,2],[22,77,2],[24,76,4],[28,72,8]],sp=.115;
 N.forEach(([s,m,l])=>{tone(c,o,t+s*sp,{type:'triangle',f:mf(m),dur:l*sp*.95,g:.16,hold:l*sp*.4});tone(c,o,t+s*sp,{wave:.5,f:mf(m+12),dur:.08,g:.03});});
 [[0,48],[8,53],[16,55],[24,48]].forEach(([s,m])=>tone(c,o,t+s*sp,{type:'triangle',f:mf(m),dur:sp*8,g:.08,hold:sp*4}));tone(c,o,t,{type:'square',f:2000,dur:.015,g:.04});}},
);
Object.assign(LV,{turbo_swing:.8,bow_draw:3.3,bow_shot:1.8,page_flip:1.9,num_tag:2.2,pendulum:2.5,shooting_star:2.4,kuro_glitch:2.5,heartbeat:.7,flip_back:.8,belt_whip:.5,mio_kit:.9});


// ---------- v0.13（2026-11-18）：design 11章の新しい仕組みの画面の音（カード改造・スキルツリー・ピットサイン・デッキ構築）。試作には画面ができたときに ----------
// 正本：revremit-audio-list.md 11章。今の UI の SE を使い回し、足すのは5本だけ（card_toss・card_mod・mod_switch・tree_cap・tree_reset）
SE.push(
// カードを捨てる・デッキから外す（ピットサインで捨てる／デッキ構築で外す）：下へ払う紙の「サッ」＋小さな「トン」
{id:'card_toss',name:'カードを捨てる・デッキから外す',dur:.25,fn:(c,o,t)=>{nz(c,o,t,{f:3200,f2:1100,dur:.11,g:.35,a:.01,q:1.1});tone(c,o,t+.07,{type:'triangle',f:330,f2:160,dur:.07,g:.18});}},
// カード改造（ログ・ずっと残る）：{lv:1}＝1段目（工具の「カチカチ」→ 上がる3音）／{lv:2,br:'A'|'B'}＝2段目の分かれ道（A は明るく上へ、B は深く別の色へ）
{id:'card_mod',name:'カードを改造した（{lv:1}／{lv:2,br:"A"|"B"}）',dur:1.1,fn:(c,o,t,p)=>{const lv=(p&&p.lv)||1,br=(p&&p.br)||'A';
 for(let k=0;k<3;k++){nz(c,o,t+k*.06,{ft:'highpass',f:3500,dur:.02,g:.3});tone(c,o,t+k*.06,{type:'square',f:1400+k*200,dur:.015,g:.05});}
 if(lv<2){[76,81,88].forEach((m,i)=>tone(c,o,t+.22+i*.07,{wave:.25,f:mf(m),dur:.14,g:.13}));tone(c,o,t+.43,{f:mf(100),dur:.45,g:.05});return;}
 const N=br==='B'?[74,77,81,86]:[76,80,83,88];N.forEach((m,i)=>tone(c,o,t+.22+i*.07,{wave:br==='B'?.5:.25,f:mf(m),dur:.15,g:br==='B'?.1:.12}));
 N.slice(1).forEach(m=>[-8,8].forEach(d=>tone(c,o,t+.5,{type:'sawtooth',f:mf(m-12),det:d,dur:.6,g:.035,a:.02,hold:.2,lp:br==='B'?1400:2600})));
 tone(c,o,t+.5,{f:mf(N[3]+12),dur:.5,g:.05});tone(c,o,t+.5,{f:mf(N[3]+12)*2.76,dur:.2,g:.012});}},
// 分かれ道を A ↔ B に変えた（ログ 20）：「カチャッ」＋2音が入れかわる
{id:'mod_switch',name:'改造の分かれ道を変えた（{to:"A"|"B"}）',dur:.4,fn:(c,o,t,p)=>{const b=(p&&p.to)==='B';click(c,o,t,.4);tone(c,o,t,{type:'triangle',f:900,f2:1300,dur:.05,g:.1});
 const a=b?[83,79]:[79,83];tone(c,o,t+.08,{wave:b?.5:.25,f:mf(a[0]),dur:.09,g:b?.09:.13});tone(c,o,t+.17,{wave:b?.5:.25,f:mf(a[1]),dur:.14,g:b?.09:.13});}},
// スキルツリーの4段目（型の決め）を取った：ドン＋上がる4音＋和音（1〜3段目は tune_up {lv:段} を使い回す）
{id:'tree_cap',name:'スキルツリーの4段目（型の決め）を取った',dur:1.3,fn:(c,o,t)=>{tone(c,o,t,{f:120,f2:45,dur:.3,g:.7});nz(c,o,t,{f:1800,dur:.2,g:.3,q:.7});
 [69,73,76,81].forEach((m,i)=>tone(c,o,t+.05+i*.07,{wave:.25,f:mf(m+12),dur:.14,g:.13}));
 [69,73,76].forEach(m=>[-8,8].forEach(d=>tone(c,o,t+.33,{type:'sawtooth',f:mf(m),det:d,dur:.9,g:.04,a:.02,hold:.35,lp:2600})));
 tone(c,o,t+.33,{wave:.25,f:mf(93),dur:.8,g:.1,hold:.25});tone(c,o,t+.45,{f:mf(100),dur:.6,g:.04});}},
// スキルツリーを振り直した（ポイントが全部もどる）：上から下りる「シュッ」＋下がる4音
{id:'tree_reset',name:'スキルツリーを振り直した',dur:.6,fn:(c,o,t)=>{nz(c,o,t,{f:5000,f2:900,dur:.3,g:.18,q:.8});[88,84,81,76].forEach((m,i)=>tone(c,o,t+.04+i*.06,{wave:.25,f:mf(m),dur:.1,g:.12}));tone(c,o,t+.3,{f:mf(64),dur:.25,g:.12});}},
);
Object.assign(LV,{card_toss:2,card_mod:1.3,mod_switch:2.5,tree_cap:1.8,tree_reset:2.6});

// ---------- ここから AUDIO ----------
const ALIAS={ui_error:'card_cant',shop_cant:'card_cant'};
const BYID=Object.fromEntries(SE.map(s=>[s.id,s]));
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
 const c=ok();if(!c)return;const n=(live[id]||0);if(n>=(id==='text_blip'||id==='comm_blip'?8:id==='chain_up'?6:3))return;live[id]=n+1;setTimeout(()=>live[id]--,(s.dur+.1)*1000);
 const g=c.createGain();g.gain.value=(LV[id]||1)*((o&&o.vol!=null)?o.vol:1);g.connect(BUS.se);s.fn(c,g,c.currentTime+.01,o||{});
}

// エンジン：回転が変わったときだけ約2秒（★虎雪 08:20）。続けて呼んだら前の音を切って新しい音に（重ねない）
let cur=null,warnT=[];
let ghost=false,cur2=null; // v0.12：影線（KAEDE のボス）の間だけ、影のエンジンがもう1台、少し先の回転で重なる（AUDIO.engineGhost）
function engineStopNow(){warnT.forEach(clearTimeout);warnT=[];if(cur&&C){cur.stop(C.currentTime);}cur=null;if(cur2&&C){cur2.stop(C.currentTime);}cur2=null;}
// 影のエンジン：同じ回転の動きを、0.12秒先に・250回転上で・小さく・こもらせて
function ghostBurst(c,o,t,from,to,dur){const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1800;const g=c.createGain();g.gain.value=.4;lp.connect(g).connect(o);return burst(c,lp,t,from+250,to+250,'real',{dur,car});}
function engineBurst(from,to,opt){
 const c=ok();if(!c)return;opt=opt||{};engineStopNow();
 const dur=opt.dur||(to<from?1.6:2.0);
 cur=burst(c,BUS.engine,c.currentTime+(ghost?.13:.01),from,to,engType,{dur,car,limiter:opt.limiter});if(ghost)cur2=ghostBurst(c,BUS.engine,c.currentTime+.01,from,to,dur);
 // レッドの警告は SE として別に（2秒の間に2〜3回。リミットに近いほど速く）
 if(to>=car.red&&!opt.limiter){const k=Math.min(1,(to-car.red)/Math.max(1,car.limit-car.red)),gap=opt.top?160:420-260*k,n=opt.top?5:3;
  // {top:true}＝いちばん上のギア（ブローがある）：警告を速く・少し大きく
  for(let i=0;i<n;i++){const d=300+i*gap;if(d<dur*1000-200)warnT.push(setTimeout(()=>playSE('redzone_warn',{vol:opt.top?.75:.5}),d));}}
}

// BGM（ループは小節ごとに先読みで並べる）
let P=null,hbT=null,hbHP=1,AMB=null;
function ambStop(f){if(!AMB||!C){AMB=null;return;}const A=AMB;AMB=null;clearInterval(A.timer);const t=C.currentTime;A.g.gain.cancelScheduledValues(t);A.g.gain.setValueAtTime(A.g.gain.value,t);A.g.gain.linearRampToValueAtTime(0,t+f);setTimeout(()=>A.g.disconnect(),(f+7)*1000);}
function bgm(id){const c=ok();if(!c)return;if(!(P&&P.id===id))PHASE=1;if(!BGM[id]){console.warn('AUDIO: BGM がない',id);return;}
 if(P&&P.id===id)return;bgmStop(.4);
 const g=c.createGain();g.gain.setValueAtTime(0,c.currentTime);g.gain.linearRampToValueAtTime(.7,c.currentTime+.3);g.connect(bgmIn);
 const sg=SONGS[BGM[id].s];P={id,g,b:0,t:c.currentTime+.08,bd:barDur(sg)};
 const me=P;const tick=()=>{if(P!==me)return;while(me.t<C.currentTime+.7){renderBar(C,me.g,id,me.b,me.t);me.t+=me.bd;me.b++;}};
 tick();me.timer=setInterval(tick,100);
}
function bgmStop(fade){if(!P||!C){P=null;return;}const p=P;P=null;clearInterval(p.timer);const t=C.currentTime,f=fade==null?.5:fade;
 p.g.gain.cancelScheduledValues(t);p.g.gain.setValueAtTime(p.g.gain.value,t);p.g.gain.linearRampToValueAtTime(0,t+f);setTimeout(()=>p.g.disconnect(),(f+(p.bd||2)+.5)*1000);}
function redFilter(on){if(!C)return;const t=C.currentTime;hp.frequency.setTargetAtTime(on?650:20,t,.15);trem._d.gain.setTargetAtTime(on?.12:0,t,.15);}
function jingle(id,opt){const c=ok();if(!c)return;const j=JINGLES[id];if(!j){console.warn('AUDIO: ジングルがない',id);return;}bgmStop(.15);
 const g=c.createGain();g.gain.value=LVJ[id]||1;g.connect(bgmIn);j.fn(c,g,c.currentTime+.05,opt||{});}

window.AUDIO={
 VERSION:'0.13',SE_IDS:SE.map(s=>s.id).concat(Object.keys(ALIAS)),BGM_IDS:Object.keys(BGM),JINGLE_IDS:Object.keys(JINGLES),
 unlock(){const c=ok();if(c){const b=c.createBuffer(1,1,22050),s=c.createBufferSource();s.buffer=b;s.connect(c.destination);s.start(0);}return !!c;},
 se:playSE,
 attack(dmg){playSE(dmg>=20?'card_attack_l':dmg>=10?'card_attack_m':'card_attack_s');},
 setCar(cr){car=Object.assign({},YUKI,cr||{});},
 engineBurst,
 overrev(){engineBurst(car.limit-400,car.limit,{limiter:true,dur:1.4});playSE('overrev');},
 blow(){engineStopNow();playSE('engine_blow');bgmStop(.05);},
 engineStop:engineStopNow,
 setEngineType(t){engType='real';}, // 本物寄りだけ（呼んでも変わらない）
 bgm,bgmStop,redFilter,jingle,
 bgmPhase(n){PHASE=n||1;}, // v0.11：曲の後半へ（次の小節から）。bgm() で別の曲にすると 1 にもどる
 // v0.12（β のあと）：影線の2台目のエンジン（勝ったら false で1台にもどす）／KURO の心拍（耐久の割合 0〜1。null で止める）／場面の環境音（今は 'wave'＝潮騒の波）
 engineGhost(on){ghost=!!on;if(!on&&cur2&&C){cur2.fade?cur2.fade(C.currentTime,.4):0;}},
 heart(hp){clearTimeout(hbT);hbT=null;if(hp==null)return;hbHP=Math.max(0,Math.min(1,hp));const go=()=>{playSE('heartbeat',{hp:hbHP});hbT=setTimeout(go,60000/(70+(1-hbHP)*90));};go();},
 ambient(id,v,fade){ambStop(.3);const c=ok();if(!c||id!=='wave')return;const g=c.createGain();g.gain.setValueAtTime(0,c.currentTime);g.gain.linearRampToValueAtTime(v==null?.6:v,c.currentTime+(fade==null?2:fade));g.connect(BUS.se);
  const r=rng(17),A={g,t:c.currentTime+.05};A.timer=setInterval(()=>{while(A.t<C.currentTime+1.5){const len=3.5+r()*2.5;waveSwell(C,g,A.t,len,.3,r);A.t+=len*.7;}},250);AMB=A;},
 ambientVol(v,fade){if(AMB&&C){const t=C.currentTime;AMB.g.gain.cancelScheduledValues(t);AMB.g.gain.setValueAtTime(AMB.g.gain.value,t);AMB.g.gain.linearRampToValueAtTime(v,t+(fade==null?1:fade));}},
 ambientStop(fade){ambStop(fade==null?3:fade);},
 setVolume(k,v){if(k in vol){vol[k]=Math.max(0,Math.min(1,v));applyVol();}},
 mute(m){muted=!!m;applyVol();},
 get state(){return C?C.state:'none';},
 // 試聴ページ・書き出し用（ゲームからは使わない）
 _lab:{SE,LV,burst,ghostBurst,waveSwell,rng,renderBar,SONGS,BGM,JINGLES,barDur,YUKI,setPhase(n){PHASE=n||1;}}
};
})();
