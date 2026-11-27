"use strict";
/* ★③ SORA（音色のスタック・design 17章 案1・★虎雪 11-24 15:13 で作り直し）。NIGHT 4 の初クリアで加わる。車は 13-1、カード・決まりは 17-2（数は仮） */
(function(){const A3=globalThis.ALLY3;if(!A3||CHARS.SORA)return;

A3.register({id:"SORA",night:4,treeBase:"s_kizami",
 char:{carName:"フィット RS",weapon:"スイッチロッド",type:"音色",join:4,wxFav:"rain",
  car:{type:"mt",gears:6,mult:[1.0,1.12,1.24,1.36,1.48,1.6],red:7500,limit:8500,band:[5000,6000],core:[5300,5700],
   idle:1000,brake:3000,hp:65,spd:12,minShift:3500,upDrop:0.6,earlyDrop:0.45,downDiv:0.6,bands:{L:[1000,3000],M:[3000,5500],R:[7500,8500]}},
  deck:[["s_kizami",3],["s_hyoushi",2],["s_sansetsu",2],["s_headphone",2],["s_soundcheck",2],["s_blue",1],["s_kyuufu",2],["braking",2],["qshift",2],["slip",1],["blip",1]],
  skill:"s_blue",rule:{notes:{cap:8,red:1,redMax:4,blue:0.05,blueMax:0.4,green:1,greenMax:4,white:1,whiteMax:2,up:1.5,strong:2}},ruleTxt:"音色のスタック：打つとカードの色の音符が五線に並ぶ（8つまで・番をまたぐ）。赤1つでアタック +1（最大 +4）・青1つで火力 +5%（最大 +40%）・緑1つで番の終わりに防御 +1（最大 +4）・白1つで番の終わりに耐久 +1（最大 +2）。シフトアップで白（パーフェクトは2つ）。締めのカードで音符を使う"},
 cards:{
  s_kizami:{r:"C",mo:"atk_light",own:"SORA",n:"刻み",t:"atk",col:"r",c:1000,gas:1,v:5,vu:8,band:"L",fx:[["atk","v"]],d:"{v}ダメージ"},
  s_hyoushi:{r:"C",mo:"atk_light",own:"SORA",n:"拍子打ち",t:"atk",col:"r",c:1500,gas:1,v:4,vu:6,band:"M",fx:[["atkNotes","v","r",1]],d:"{v}ダメージ。並んでいる赤の音符1つにつき +1"},
  s_sansetsu:{r:"C",mo:"atk_heavy",own:"SORA",n:"三節",t:"atk",col:"b",c:2000,gas:1,v:3,vu:5,fx:[["atkHits","v",3,3]],d:"{v}ダメージを3回"},
  s_headphone:{r:"C",mo:"guard",own:"SORA",n:"ヘッドホン",t:"grd",col:"g",c:1500,gas:1,v:6,vu:9,fx:[["blk","v"]],d:"防御 {v}"},
  s_soundcheck:{r:"C",mo:"draw",own:"SORA",n:"サウンドチェック",t:"drw",col:"w",c:0,gas:0,v:1,vu:2,fx:[["draw","v"]],d:"{v}枚引く"},
  s_blue:{r:"SK",mo:"skill",own:"SORA",n:"ブルー・シンフォニー",t:"sk",col:"w",fin:1,c:0,gas:2,v:5,vu:7,sup:1,fx:[["symphony","v"]],d:"音符を全部使う：赤・青・緑それぞれの締めを、数の半分で鳴らす。さらに並び（上り・強音）1つにつき {v} ダメージ"},
  s_onkai:{r:"R",mo:"atk_heavy",own:"SORA",n:"音階",t:"atk",col:"b",fin:1,c:1500,gas:1,v:6,vu:8,fx:[["finOnkai","v"]],d:"締め：青の音符を2つまで使い、1つにつき {v} ダメージ。1枚引く"},
  s_dropbeat:{r:"E",mo:"atk_finisher",own:"SORA",n:"ドロップ・ザ・ビート",t:"atk",col:"r",fin:1,c:3000,gas:2,v:8,vu:10,fx:[["finAll","v","r"]],d:"締め：赤の音符を全部使う。赤の数 × {v} ダメージ"},
  s_waon:{r:"R",mo:"atk_heavy",own:"SORA",n:"和音",t:"atk",col:"g",fin:1,c:2000,gas:1,v:5,vu:7,fx:[["finAll","v","g"]],d:"締め：緑の音符を全部使う。緑の数 × {v} ダメージ（防御を無視）"},
  s_kyuufu:{r:"C",mo:"rev",own:"SORA",n:"休符",t:"rev",col:"w",c:0,gas:0,v:2,vu:3,sup:1,fx:[["blk","v"],["addNote","w",1]],d:"防御 {v}。白の音符をもう1つ（回転は下げない）"},
  s_tanbou:{r:"C",mo:"atk_light",own:"SORA",n:"短棒",t:"atk",col:"r",c:0,gas:0,v:3,vu:5,fx:[["atk","v"]],d:"{v}ダメージ（回転 0・ガソリン 0）"},
  s_hankyou:{r:"R",mo:"guard",own:"SORA",n:"反響",t:"grd",col:"g",c:1500,gas:1,v:6,vu:9,fx:[["blk","v"],["echoNote"]],d:"防御 {v}。このターン最後に使った締めの色の音符を1つもどす"},
  s_loop:{r:"R",mo:"draw",own:"SORA",n:"ループ",t:"drw",col:"x",c:0,gas:0,v:1,vu:2,sup:1,fx:[["loopNote","v"]],d:"いちばん右の音符を {v} つ写して並べる（色はその音符の色）"},
  s_metronome:{r:"R",mo:"rev",own:"SORA",n:"メトロノーム",t:"rev",col:"w",c:0,gas:0,v:5,vu:7,sup:1,fx:[["metro","v"]],d:"この戦闘の間、五線に音符が8つそろうたびに防御 {v}"},
  s_sabi:{r:"E",mo:"atk_finisher",own:"SORA",n:"サビ",t:"atk",col:"b",fin:1,c:2500,gas:2,v:4,vu:6,fx:[["finHits","v","b"]],d:"締め：青の音符を全部使う。{v} ダメージを、青の数だけ"},
  s_sokkyou:{r:"R",mo:"draw",own:"SORA",n:"即興",t:"drw",col:"w",c:0,gas:1,v:2,vu:3,sup:1,fx:[["randNotes","v"]],d:"赤・青・緑のどれかの音符を {v} つ足す"},
  s_yoin:{r:"C",mo:"guard",own:"SORA",n:"余韻",t:"grd",col:"g",c:1000,gas:1,v:4,vu:6,fx:[["blkNotes","v","g",1]],d:"防御 {v}。並んでいる緑の音符1つにつき防御 +1（音符は消さない）"}},
 parts:{s_mic:{own:"SORA",n:"録音マイク",d:"締めのカードを打つたびに防御 +4"},
  s_woofer:{own:"SORA",n:"ウーファー",d:"2回以上当たるアタックは、1発ごとに +1"},
  s_silenttire:{own:"SORA",n:"静音タイヤ",d:"回転0のカードを打つたびに防御 +2（1ターン3回まで）"}},
 unlock:{start:["s_kizami","s_hyoushi","s_sansetsu","s_headphone","s_soundcheck","s_blue","s_kyuufu","s_tanbou","s_yoin"],
  a1:["s_onkai","s_hankyou"],a2:["s_waon","s_loop"],clear:["s_dropbeat","s_sabi"],sRank:["s_metronome"],hidden:["s_sokkyou"],
  parts:{start:["s_silenttire"],a1:["s_mic"],clear:["s_woofer"]}},
 boss:{key:"muon",enemy:{art:"muon",n:"無音",rank:"boss",ally:"SORA",hp:230,spd:10,bgm:"boss_muon",bgmPhase2:1,muffle:1,
  pat:[["blk",14],["atk",15],["apd",1],["multi",4,4]],phase:{at:0.5,spd:11,art:"muon_p2",pat:[["atk",18],["apd",1],["multi",5,4]]},wpn:"音を吸う平たい盾と短い棒"}},
 tree:[
  {id:"s_tempo",n:"強音",d:"同じ色をそろえて締める型",entry:["s_tanbou","s_onkai"],cards:["s_kizami","s_hyoushi","s_tanbou","s_onkai","s_dropbeat"],parts:["slick","pacenote","qrelease","s_mic"],top:"強音の上乗せ +2 → +3",tip:"右の3つが同じ色のとき、その色の締めは音符1つにつき +3。"},
  {id:"s_waon",n:"和音",d:"色をめぐらせる型",entry:["s_waon","s_hankyou"],cards:["s_waon","s_hankyou","s_sansetsu","s_sokkyou"],parts:["turbo","clutch","carbon","s_woofer"],top:"上りの締め ×1.5 → ×2",tip:"右の3つが赤 → 青 → 緑のとき、次の締めは ×2。"},
  {id:"s_yoin",n:"余韻",d:"音を残して守る型",entry:["s_yoin","s_loop"],cards:["s_yoin","s_headphone","s_hankyou","s_kyuufu","s_metronome"],parts:["grip","cage","jack","s_silenttire"],top:"五線が 10 まで",tip:"五線に音符を10まで並べられる（並んでいるだけの効き目の最大は同じ）。"}],
 style:["カードの色の音符を五線に並べて、締めのカードでまとめて鳴らす「音色のスタック」型。赤は火力・青は手数・緑は守り・白は休符（どの色にも数える）。","ねらい：同じ色を3つ（強音）か 赤 → 青 → 緑（上り）を作ってから、締めで鳴らす。"],
 ops:{
  atkNotes:(x,v,c,k)=>x.attack(v+k*A3.notes.cnt(c)),
  blkNotes:(x,v,c,k)=>x.block(v+k*A3.notes.cnt(c)),
  addNote:(x,c,n)=>{for(let i=0;i<(n||1);i++)A3.notes.push(c)},
  randNotes:(x,n)=>{for(let i=0;i<n;i++)A3.notes.push(pick(["r","b","g"]))},
  loopNote:(x,n)=>{const st=B.staff||[];const c=st[st.length-1];if(!c){addLog("ループ：写す音符がない");return}for(let i=0;i<n;i++)A3.notes.push(c)},
  echoNote:x=>{if(A3.sameTurn("finCol")&&B.finCol){A3.notes.push(B.finCol);addLog("反響：音符を1つもどした")}},
  metro:(x,v)=>{B.metroBlk=(B.metroBlk||0)+v;addLog(`メトロノーム：音符が8つそろうたびに防御 ${B.metroBlk}`);ev({k:"onset"})},
  finAll:(x,v,c)=>{const f=A3.notes.fin(c),n=A3.notes.take(c,99);if(!n){addLog("締め：使う音符がない");return}const d=Math.round(n*(v+f.add)*f.mul);
    A3.se(c==="g"?"sora_waon":"sora_drop",{n});if(c==="g")A3.pierce(()=>x.attack(d));else x.attack(d)},
  finHits:(x,v,c)=>{const f=A3.notes.fin(c),n=A3.notes.take(c,99);if(!n){addLog("締め：使う音符がない");return}A3.se("sora_sabi",{n});for(let i=0;i<n;i++)x.attack(Math.round((v+f.add)*f.mul))},
  finOnkai:(x,v)=>{const f=A3.notes.fin("b"),n=A3.notes.take("b",2);for(let i=0;i<n;i++)x.attack(Math.round((v+f.add)*f.mul));drawN(1)},
  symphony:(x,v)=>{const N=A3.notes,pat=N.pats(),st=(B.staff||[]).slice(),k={r:0,b:0,g:0,w:0};st.forEach(c=>k[c]++);
    A3.se("sora_blue");const big=["r","b","g"].sort((a,b)=>k[b]-k[a])[0];k[big]+=k.w;B.staff=[];N.ui();
    const R=Math.floor(k.r/2),Bl=Math.floor(k.b/2),Gr=Math.floor(k.g/2);addLog(`ブルー・シンフォニー：赤 ${R}・青 ${Bl}・緑 ${Gr}・並び ${pat.n}`);
    if(R)x.attack(R*8);for(let i=0;i<Bl;i++)x.attack(4);if(Gr)A3.pierce(()=>x.attack(Gr*5));if(pat.n)x.attack(pat.n*v);B.finCol=big;B.finColTurn=B.pTurns;B.lastFin=1}},
 before:x=>{B.lastFin=0},
 attack:(v,m)=>{if(A3.isChar("SORA")&&B.staff){const R=RULE().notes||{},N=A3.notes;v+=Math.min(R.redMax,R.red*N.cnt("r"));v*=1+Math.min(R.blueMax,R.blue*N.cnt("b"))}
   if(has("s_woofer")){if(B.wfUid===B.playUid){B.wfN++;v+=(B.wfN===2?2:1)/(m||1)}else{B.wfUid=B.playUid;B.wfN=1}}return v},
 after:x=>{const{d,cost}=x;if(!A3.isChar("SORA"))return;
  const c=d.col||(d.t==="atk"?"r":d.t==="grd"?"g":d.t==="drw"?"b":"w");
  if(d.fin){if(has("s_mic")){B.block+=4;addLog("録音マイク：防御 +4");ev({k:"pblk",v:4})}}
  else if(c!=="x")A3.notes.push(c);
  if(has("s_silenttire")&&cost===0){const n=A3.turnVal("stN");if(n<3){A3.turnVal("stN",n+1);B.block+=2;addLog("静音タイヤ：防御 +2");ev({k:"pblk",v:2})}}},
 sceneSE:{
  join_sora:{2:()=>SND.se("gate_boot",{part:"start"}),3:()=>SND.se("gate_boot",{part:"melody"})},
  sora_op:{7:()=>SND.se("rod_swing",{form:"three"})},
  area1_sora:{0:()=>SND.se("amb_signal")},area2_sora:{0:()=>SND.se("amb_tire")},area3_sora:{0:A=>A&&A.bgmDuck&&A.bgmDuck(1.5)},
  sora_boss_pre:{0:A=>A&&A.quiet&&A.quiet(.15,1.5),7:A=>A&&A.quiet&&A.quiet(.4),10:A=>{A&&A.quiet&&A.quiet(1,.3);SND.se("rod_swing",{form:"three"})},end:A=>A&&A.quiet&&A.quiet(1,.3)},
  sora_boss_post:{0:A=>{SND.se("rod_swing");A&&A.engineMuffle&&A.engineMuffle(false);try{SND.engineBurst&&SND.engineBurst(900,2600)}catch(e){}}},
  boss3_pre_sora:{5:A=>{SND.se("sora_hum");A&&A.bgmDuck&&A.bgmDuck(2.2,.08)}},
  ed1_sora:{8:()=>{SND.bgmStop();SND.se("gate_boot",{part:"start"});setTimeout(()=>SND.se("gate_boot",{part:"melody"}),1800);setTimeout(()=>SND.bgm("ending"),4200)},19:()=>SND.bgm("garage_sora")}},
});
/* ★v0.30 音色のスタック（17-2）：B.staff＝五線（左が古い）。白は並び・締めでどの色にも数える */
const N=A3.notes={
 cap:()=>((RULE().notes||{}).cap||8)+(A3.treeTopIs("s_yoin")?2:0),
 cnt:c=>(B.staff||[]).filter(x=>x===c).length,
 push(c){if(!B.staff)B.staff=[];const L=N.cap(),was=B.staff.length,p0=N.pats();B.staff.push(c);
   {const t=Date.now(),dl=t-(N.seT||0)<80?80:0;N.seT=t+dl;A3.se("sora_note",{color:c},dl);const p1=N.pats();if((p1.up&&!p0.up)||(p1.strong&&p1.strong!==p0.strong))A3.fx&&A3.fx("sora_melody_flash_sheet",24,24,5,184+Math.min(196,30+22*(B.staff.length-1)-6)-6,236+3,1,400);if(p1.up&&!p0.up)A3.se("sora_rise",null,dl+200);else if(p1.strong&&p1.strong!==p0.strong)A3.se("sora_strong",{color:p1.strong},dl+200)}while(B.staff.length>L)B.staff.shift();
   if(B.metroBlk&&was<L&&B.staff.length>=L){B.block+=B.metroBlk;addLog(`メトロノーム：五線がそろった・防御 +${B.metroBlk}`);ev({k:"pblk",v:B.metroBlk})}
   N.ui()},
 pats(){const s=(B.staff||[]).slice(-3),ok=(a,b)=>a===b||a==="w";if(s.length<3)return{up:false,strong:null,n:0};
   const up=ok(s[0],"r")&&ok(s[1],"b")&&ok(s[2],"g");let strong=null;for(const c of["r","b","g"])if(s.every(x=>ok(x,c))){strong=s.every(x=>x==="w")?"w":c;break}
   return{up,strong,n:(up?1:0)+(strong?1:0)}},
 fin(c){const R=RULE().notes||{},p=N.pats();const mul=p.up?(A3.treeTopIs("s_waon")?2:R.up||1.5):1,add=(p.strong&&(p.strong===c||p.strong==="w"))?(A3.treeTopIs("s_tempo")?3:R.strong||2):0;
   if(p.up)addLog(`上り：締め ×${mul}`);if(add)addLog(`強音：音符1つにつき +${add}`);return{mul,add}},
 take(c,max){const st=B.staff||[];let n=0;for(let i=st.length-1;i>=0&&n<max;i--)if(st[i]===c){st.splice(i,1);n++}for(let i=st.length-1;i>=0&&n<max;i--)if(st[i]==="w"){st.splice(i,1);n++}
   if(n){B.finCol=c;B.finColTurn=B.pTurns;B.lastFin=1;addLog(`締め：音符を ${n} つ使った`)}N.ui();return n},
 ui(){}};
A3.pierce=f=>{const e=B.e,b=e.block;e.block=0;try{f()}finally{e.block+=b}};
/* 番の終わり：緑＝防御・白＝耐久。シフトアップ：白（パーフェクトは2つ） */
{const te=turnEnd;turnEnd=function(){try{if(B&&G&&!B.over&&A3.isChar("SORA")&&B.staff){const R=RULE().notes||{},g=Math.min(R.greenMax,R.green*N.cnt("g")),w=Math.min(R.whiteMax,R.white*N.cnt("w"));
  if(g){B.block+=g;addLog(`緑の音符：防御 +${g}`);ev({k:"pblk",v:g})}if(w&&G.hp<G.maxhp){const h=Math.min(w,G.maxhp-G.hp);G.hp+=h;addLog(`白の音符：耐久 +${h}`)}}}catch(e){}return te.apply(this,arguments)}}
{const su=onShiftUp;onShiftUp=function(g){const r=su.apply(this,arguments);try{if(B&&A3.isChar("SORA")){A3.notes.push("w");if(g==="perfect")A3.notes.push("w")}}catch(e){}return r}}
{const sb=startBattleState;startBattleState=function(){const r=sb.apply(this,arguments);if(B)B.staff=[];return r}}
/* β の終わり（next_sora）の続きとして加わる：NIGHT 4 の「次の仲間は……？」は加わる話の前に出す（ally3_ui.js） */
delete NIGHTS[3].open.next;CHARS.SORA.preJoin=["ally_next","next_sora"];
})();
