"use strict";
/* ===== ドットの絵（v0.9）=====
   原寸 480×270。キャラの枠 128×96（足元 48,92）、敵の枠 160×112（足元 100,108）、足元の線 y=176（graphics-list 5章）。
   ・絵（PNG＋Aseprite の json-array）が assets/ にあれば、それを使う（ART_SRC）。
   ・なければ、ここでコードで描いた「仮のドット」を使う（ラウンド3の絵が来るまでのつなぎ。形はラウンド3の構図に合わせた）。
   ・どちらも同じ形 {frames:[canvas], dur:[ms], tags:{名前:[from,to]}} にそろえる。
   ・エリートなどの色変えは PALS（色相ずらし、または 色→色 の表）。 */
const PX={get W(){return RES.W},get H(){return RES.H},get FLOOR(){return RES.FLOOR},
  C:{ink:"#171B22",white:"#F7F9F5",lime:"#C5FF45",red:"#FF4040",navy:"#1E243A",grey:"#8B95A3",dark:"#2A2F3A",mint:"#7FE3C8",gold:"#FFD34D",cyan:"#7FD8FF"}};

/* 絵のファイル（グラフィック班の名前のまま。assets/ に置くと読む） */
const ART_SRC={
  // ★本番の絵（C2・グラフィック班 2026-11-06）。枠 224（足元 112,220）、ボスは 288（144,284）。敵は左向きで描いてある
  YUKI:{sheet:"assets/c2/characters/YUKI/c2/revremit_chr_YUKI_c2_sheet.png",json:"assets/c2/characters/YUKI/c2/revremit_chr_YUKI_c2_sheet.json",foot:[112,220]},
  van:{sheet:"assets/c2/characters/enemy/c2/revremit_chr_enemy_van_c2_sheet.png",json:"assets/c2/characters/enemy/c2/revremit_chr_enemy_van_c2_sheet.json",foot:[112,220]},
  bike:{sheet:"assets/c2/characters/enemy/c2/revremit_chr_enemy_bike_c2_sheet.png",json:"assets/c2/characters/enemy/c2/revremit_chr_enemy_bike_c2_sheet.json",foot:[112,220]},
  minivan:{sheet:"assets/c2/characters/enemy/c2/revremit_chr_enemy_minivan_c2_sheet.png",json:"assets/c2/characters/enemy/c2/revremit_chr_enemy_minivan_c2_sheet.json",foot:[112,220]},
  sedan:{sheet:"assets/c2/characters/enemy/c2/revremit_chr_enemy_sedan_c2_sheet.png",json:"assets/c2/characters/enemy/c2/revremit_chr_enemy_sedan_c2_sheet.json",foot:[112,220]},
  wraith:{sheet:"assets/c2/characters/enemy/c2/revremit_chr_enemy_wraith_c2_sheet.png",json:"assets/c2/characters/enemy/c2/revremit_chr_enemy_wraith_c2_sheet.json",foot:[112,220]},
  boss1:{sheet:"assets/c2/characters/enemy/c2/revremit_chr_enemy_boss1_c2_sheet.png",json:"assets/c2/characters/enemy/c2/revremit_chr_enemy_boss1_c2_sheet.json",foot:[144,284]},
  // 演出の効果（64×64×4コマ・真ん中が基準）
  fx_perfect:{sheet:"assets/c2/fx/c2/revremit_fx_perfect_shift_sheet.png",grid:[64,64,4],ms:80},
  fx_blow:{sheet:"assets/c2/fx/c2/revremit_fx_blow_sheet.png",grid:[64,64,4],ms:110},
  fx_overrev:{sheet:"assets/c2/fx/c2/revremit_fx_overrev_sheet.png",grid:[64,64,4],ms:100},
  fx_remit:{sheet:"assets/c2/fx/c2/revremit_fx_remit_sheet.png",grid:[64,64,4],ms:90},
  fx_stall:{sheet:"assets/c2/fx/c2/revremit_fx_stall_sheet.png",grid:[64,64,4],ms:140},
  fx_win:{sheet:"assets/c2/fx/c2/revremit_fx_win_sheet.png",grid:[64,64,4],ms:100},
};
/* ★エリア2・3 の敵とボス2・3（グラフィック班 2026-11-07）。枠 224／ボス 288 */
["coupe","kei","offbike","rally","downhill","touring","formula","gtcar","safety","wrecker","boss2","boss3"].forEach(k=>{const b=k.startsWith("boss"),f=`assets/c2/characters/enemy/c2/revremit_chr_enemy_${k}_c2_sheet`;
  ART_SRC[k]={sheet:f+".png",json:f+".json",foot:b?[144,284]:[112,220]}});
/* 絵がまだない敵のもと（色変えで仮に出す。いまは全部そろったので使われない） */
const ART_FALLBACK={coupe:"bike",kei:"van",touring:"van",formula:"bike",boss2:"boss1",boss3:"boss1"};
/* 色の入れかえ。hue＝色相を回す（度）、sat・lit＝倍率、map＝{"#元":"#先"}（グラフィック班の表が来たらこちら） */
const PALS={
  // design 付録の仮の色（グラフィック班の色変えの表が来たら map で置きかえ）
  elite_wraith:{hue:150,lit:0.9},elite_downhill:{hue:200,sat:1.2},elite_wrecker:{hue:40},
  z_sedan:{hue:60},z_minivan:{sat:0.5},z_offbike:{sat:0.6,lit:1.15},z_rally:{hue:20},z_gtcar:{hue:240},z_safety:{hue:50,sat:1.4},boss3_p2:{hue:180},
  // 絵がまだない敵の仮（ゴーストバンの色変えで見分ける）
  f_bike:{hue:70,sat:1.1},f_boss1:{hue:200,sat:0.6,lit:1.15},f_coupe:{hue:-40},f_kei:{hue:110,sat:0.7},f_boss2:{sat:0.1,lit:1.4},
  f_touring:{hue:-120},f_formula:{hue:30,sat:1.3},f_boss3:{hue:260,sat:0.4},
};
const SPR={};// 読みこんだ／描いた絵

function mkCanvas(w,h){const c=document.createElement("canvas");c.width=w;c.height=h;return c}
function hex(c){return[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)]}

/* ---- 仮のドット：小さな絵筆 ---- */
function pen(cv){const g=cv.getContext("2d");
  return{g,r(x,y,w,h,c){g.fillStyle=c;g.fillRect(x|0,y|0,w|0,h|0)},p(x,y,c){g.fillStyle=c;g.fillRect(x|0,y|0,1,1)},
    // 文字の絵（1文字＝1色。. は透明）
    map(x,y,rows,pal){rows.forEach((row,j)=>{for(let i=0;i<row.length;i++){const k=row[i];if(k!=="."&&pal[k]){g.fillStyle=pal[k];g.fillRect(x+i,y+j,1,1)}}})}}}

/* YUKI（右向き・背64）。pose：stand・guard・jab0〜5・charge・hit・kneel */
const YK={ink:"#171B22",hair:"#F7F9F5",hairS:"#C9D3DC",mint:"#5FE0B7",skin:"#F2C9A8",skinS:"#D9A184",eye:"#B6F23A",
  jk:"#2A2F3A",jkS:"#1E243A",lime:"#C5FF45",wht:"#F7F9F5",car:"#4FB33A",carS:"#2E7A2A",lamp:"#FFF6B0",tire:"#3A4250",steel:"#8B95A3"};
function drawYuki(pose){
  const cv=mkCanvas(128,96),P=pen(cv),c=YK;
  const fx=48,fy=92;// 足元
  let lean=0,gx=0,gy=0,gv=false,crouch=0,kneel=false;
  const jab=[[0,0],[3,0],[12,-1],[18,-1],[8,0],[0,0]];
  if(pose.startsWith("jab")){const k=+pose.slice(3);gx=jab[k][0];gy=jab[k][1];lean=k>=1&&k<=3?2:0}
  if(pose==="guard"){gv=true}
  if(pose==="charge"){gx=-4;gy=-2;crouch=2}
  if(pose==="hit"){lean=-3}
  if(pose==="kneel"){kneel=true;crouch=10}
  const top=fy-64+crouch;// 髪のてっぺん
  // 足
  if(!kneel){P.r(fx-6+lean/2,fy-20,5,18,c.jkS);P.r(fx+2+lean/2,fy-20,5,18,c.jk);P.r(fx-7+lean/2,fy-3,7,3,c.wht);P.r(fx+2+lean/2,fy-3,8,3,c.wht);P.r(fx-7+lean/2,fy-1,7,1,c.ink);P.r(fx+2+lean/2,fy-1,8,1,c.ink)}
  else{P.r(fx-8,fy-8,14,6,c.jkS);P.r(fx+4,fy-14,5,12,c.jk);P.r(fx-10,fy-3,8,3,c.wht);P.r(fx+4,fy-3,8,3,c.wht)}
  const bx=fx-8+lean,by=top+22;// 体の左上
  // 後ろの腕
  P.r(bx-2,by+4,4,15,c.jkS);P.r(bx-2,by+18,4,3,c.skinS);
  // 体（ジャケット：白黒＋ライムの線）
  P.r(bx,by,16,24,c.jk);P.r(bx+9,by,2,24,c.lime);P.r(bx+1,by,6,3,c.wht);P.r(bx,by+21,16,3,c.wht);P.r(bx+12,by+3,3,16,c.jkS);
  // 首・頭
  P.r(bx+6,by-3,5,4,c.skinS);
  const hx=bx+1,hy=top;
  P.r(hx+2,hy+4,13,14,c.skin);P.r(hx+2,hy+14,13,4,c.skinS);
  // 目（右向き）・口
  P.r(hx+11,hy+10,2,3,c.eye);P.p(hx+11,hy+10,c.ink);P.r(hx+10,hy+9,4,1,c.hairS);P.r(hx+11,hy+15,2,1,c.skinS);
  // 髪（白・後ろに長い）＋ミントのメッシュ
  P.r(hx,hy,15,6,c.hair);P.r(hx-3,hy+2,6,22,c.hair);P.r(hx-4,hy+8,3,14,c.hairS);P.r(hx+1,hy+5,4,10,c.hair);
  P.r(hx+12,hy+3,4,7,c.hair);P.r(hx+14,hy+5,2,6,c.hairS);P.r(hx+5,hy,10,2,c.hairS);
  P.r(hx+9,hy+1,2,8,c.mint);P.r(hx-2,hy+10,2,10,c.mint);
  P.r(hx-1,hy-1,14,1,c.ink);
  // 前の腕＋ガントレット（緑のハッチバック：ボンネット＝手の甲、ホイール＝盾、肘から2本のマフラー）
  const ax=bx+10+gx,ay=by+5+gy;
  if(gv){// ガード：前に立てる
    P.r(bx+12,by+4,6,8,c.jk);
    P.r(bx+16,by-6,13,24,c.carS);P.r(bx+17,by-5,11,22,c.car);P.r(bx+18,by-4,4,8,c.lamp);P.r(bx+25,by-4,2,20,c.carS);
    P.r(bx+20,by+6,7,7,c.tire);P.r(bx+22,by+8,3,3,c.steel);P.r(bx+12,by+12,3,2,c.steel);P.r(bx+12,by+15,3,2,c.steel);
  }else{
    P.r(ax,ay,8,6,c.jk);P.r(ax-1,ay+6,3,2,c.steel);P.r(ax-1,ay+9,3,2,c.steel);
    P.r(ax+6,ay-2,20,12,c.carS);P.r(ax+7,ay-1,18,10,c.car);P.r(ax+8,ay,12,3,"#6FCF3A");P.r(ax+22,ay+1,3,4,c.lamp);
    P.r(ax+11,ay+6,7,6,c.tire);P.r(ax+13,ay+8,3,2,c.steel);P.r(ax+24,ay+7,2,2,c.red||"#FF4040");
  }
  // 縁取り（とても暗い紺）
  outline(cv,"#171B22");
  return cv;
}
/* 敵：霧のゴースト＋軽バンの槌（左向き・背64）。pose：stand・raise・swing */
function drawVan(pose){
  const cv=mkCanvas(160,112),P=pen(cv);
  const fx=100,fy=108,top=fy-64;
  const mist="#3A2F4A",mistS="#2A2238",mistL="#56486A",eye="#F7F9F5",cap="#2A2F3A",van="#C9CED6",vanS="#8B95A3",lamp="#FFF6B0",red="#FF4040";
  // 霧の足元（ぼやけ＝市松）
  for(let y=fy-14;y<fy;y++)for(let x=fx-14;x<fx+14;x++){if(((x+y)&1)===0&&Math.abs(x-fx)<14-(fy-y)/2)P.p(x,y,mistS)}
  P.r(fx-11,top+20,22,34,mist);P.r(fx-13,top+28,26,20,mist);P.r(fx-9,top+22,6,30,mistL);
  // 頭（影の顔・白い目）・キャップ
  P.r(fx-9,top+4,18,17,mistS);P.r(fx-7,top+10,3,2,eye);P.r(fx-2,top+10,3,2,eye);P.p(fx-7,top+11,red);
  P.r(fx-11,top+1,20,5,cap);P.r(fx-16,top+5,9,2,cap);P.r(fx-5,top+2,4,2,"#C5FF45");
  // 腕と槌
  if(pose==="stand"){
    P.r(fx-16,top+26,6,18,mistL);P.r(fx-30,top+40,3,26,vanS);
    P.r(fx-42,top+50,26,16,vanS);P.r(fx-41,top+51,24,14,van);P.r(fx-41,top+52,4,5,lamp);P.r(fx-36,top+60,5,5,"#3A4250");P.r(fx-24,top+60,5,5,"#3A4250");
  }else if(pose==="raise"){
    P.r(fx-6,top+12,6,16,mistL);P.r(fx+2,top-6,3,26,vanS);
    P.r(fx-6,top-22,26,16,vanS);P.r(fx-5,top-21,24,14,van);P.r(fx+15,top-20,4,5,lamp);
  }else{
    P.r(fx-24,top+24,14,6,mistL);P.r(fx-48,top+24,26,3,vanS);
    P.r(fx-70,top+20,24,30,vanS);P.r(fx-69,top+21,22,28,van);P.r(fx-69,top+43,10,5,lamp);P.r(fx-60,top+22,5,5,"#3A4250");
  }
  outline(cv,"#171B22");
  return cv;
}
/* 透明の所に接している画素の外側に1ドットの縁 */
function outline(cv,col){const g=cv.getContext("2d"),w=cv.width,h=cv.height,d=g.getImageData(0,0,w,h),a=d.data,o=new Uint8ClampedArray(a);
  const [r,gg,b]=hex(col);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;if(a[i+3])continue;
    const n=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>{const X=x+dx,Y=y+dy;return X>=0&&Y>=0&&X<w&&Y<h&&a[(Y*w+X)*4+3]});
    if(n){o[i]=r;o[i+1]=gg;o[i+2]=b;o[i+3]=255}}
  g.putImageData(new ImageData(o,w,h),0,0)}
function procSet(list){// [[タグ,[ポーズ…],[時間…]]…]
  const frames=[],dur=[],tags={};
  list.forEach(([tag,poses,ms,fn])=>{const from=frames.length;poses.forEach((p,i)=>{frames.push(fn(p));dur.push(ms[i]||ms[0])});tags[tag]=[from,frames.length-1]});
  return{frames,dur,tags,proc:true};
}
function makeProcSprites(){
  SPR.YUKI=procSet([["stand",["stand"],[200],drawYuki],["guard",["guard"],[200],drawYuki],
    ["atk_light",["jab0","jab1","jab2","jab3","jab4","jab5"],[90,70,60,120,80,90],drawYuki],
    ["charge",["charge"],[200],drawYuki],["hit",["hit"],[200],drawYuki],["kneel",["kneel"],[200],drawYuki]]);
  SPR.YUKI.foot=[48,92];
  SPR.van=procSet([["stand",["stand"],[200],drawVan],["atk",["raise","swing"],[160,200],drawVan]]);
  SPR.van.foot=[100,108];
  SPR.bg_street={layers:[drawStreet()],proc:true};
}
/* 仮の背景：夜のストリート（480×270。舞台は上の176） */
function drawStreet(){
  const cv=mkCanvas(480,270),P=pen(cv);
  const sky=["#0D1020","#121630","#171B3A","#1E243A","#262B48"];
  for(let y=0;y<120;y++){const k=Math.min(4,Math.floor(y/24)),n=Math.min(4,k+1);const c=((y%24)>18&&((y+0)%2===0))?sky[n]:sky[k];P.r(0,y,480,1,c)}
  // 遠くのビル
  let s=7;const R=()=>{s=(s*1103515245+12345)&0x7fffffff;return s/0x7fffffff};
  for(let x=0;x<480;){const w=18+Math.floor(R()*30),h=40+Math.floor(R()*60);P.r(x,120-h,w,h+10,"#141833");
    for(let wy=120-h+4;wy<118;wy+=6)for(let wx=x+3;wx<x+w-3;wx+=5)if(R()<0.35)P.r(wx,wy,2,2,R()<0.15?"#C5FF45":R()<0.2?"#FF5FA2":"#5E6A9A");x+=w+2}
  // 近いビル（ネオン）
  for(let x=-10;x<480;){const w=40+Math.floor(R()*50),h=60+Math.floor(R()*40);P.r(x,130-h,w,h,"#0F1226");P.r(x,130-h,w,2,"#262B48");
    if(R()<0.6){const nx=x+6+Math.floor(R()*(w-20)),ny=130-h+10+Math.floor(R()*20),nc=R()<0.5?"#C5FF45":"#FF5FA2";P.r(nx,ny,14,6,nc);P.r(nx+1,ny+1,12,4,"#0F1226");P.r(nx+3,ny+2,8,2,nc)}
    x+=w+6}
  // 高架
  P.r(0,112,480,6,"#2A2F3A");P.r(0,118,480,2,"#171B22");for(let x=10;x<480;x+=70)P.r(x,120,8,26,"#1E243A");
  P.r(0,110,480,2,"#8B95A3");
  // 歩道・ガードレール
  P.r(0,146,480,14,"#262B3A");for(let x=0;x<480;x+=24){P.r(x,140,2,8,"#8B95A3")}P.r(0,141,480,2,"#C9CED6");
  // 白猫の看板（文字なし）とチェッカー
  P.r(380,62,30,22,"#0F1226");P.r(381,63,28,20,"#1E243A");P.map(388,66,["w...w","ww.ww","wwwww","wbwbw","wwwww",".www."],{w:"#F7F9F5",b:"#171B22"});
  for(let i=0;i<8;i++)for(let j=0;j<3;j++)if((i+j)%2===0)P.r(60+i*3,70+j*3,3,3,"#F7F9F5");else P.r(60+i*3,70+j*3,3,3,"#171B22");
  // 路面（濡れて映りこむ）
  P.r(0,160,480,110,"#141826");
  for(let y=162;y<270;y+=2)P.r(0,y,480,1,"#171B2C");
  for(let x=0;x<480;x+=40)P.r(x+10,206,20,2,"#8B95A3");
  for(let i=0;i<40;i++){const x=Math.floor(R()*480),y=165+Math.floor(R()*90),w=2+Math.floor(R()*8);P.r(x,y,w,1,R()<0.5?"#3E5A2A":"#4A2A44")}
  P.r(0,174,480,2,"#262B48");
  return cv;
}

/* ---- 絵ファイルを読む（Aseprite の json-array）。読めなければ仮のドットのまま ---- */
const PRE={img:{},json:{}};// ★v0.18.1：先にまとめて読んだもの（読みこみの％を出すため）
function loadImg0(src){return new Promise(res=>{const im=new Image();im.onload=()=>res(im);im.onerror=()=>res(null);im.src=(window.ART_EMBED&&ART_EMBED[src])||src})}
async function loadJSON0(src){if(window.ART_EMBED&&ART_EMBED[src])return JSON.parse(ART_EMBED[src]);try{const r=await fetch(src);return r.ok?await r.json():null}catch(e){return null}}
function loadImg(src){return src in PRE.img?Promise.resolve(PRE.img[src]):loadImg0(src)}
async function loadJSON(src){if(src in PRE.json)return PRE.json[src];return loadJSON0(src)}
/* 置いてある絵をぜんぶ先に読む（6本ずつ）。onProg(読んだ数, ぜんぶの数) */
async function preloadAll(have,onProg){const list=[...have].filter(f=>/\.(png|json)$/i.test(f)&&!f.includes("/_review/"));let done=0;const n=list.length;onProg&&onProg(0,n);
  let i=0;const worker=async()=>{while(i<list.length){const f=list[i++];try{if(/\.png$/i.test(f))PRE.img[f]=await loadImg0(f);else PRE.json[f]=await loadJSON0(f)}catch(e){}done++;onProg&&onProg(done,n)}};
  await Promise.all(Array.from({length:6},worker))}
/* 置いてある絵の一覧：1ファイル版は ART_EMBED、分けた版は assets/manifest.json（build.py が作る）。どちらもなければ仮のドットだけ */
async function artList(){if(window.ART_EMBED)return new Set(Object.keys(ART_EMBED));
  try{const r=await fetch("assets/manifest.json");if(r.ok)return new Set((await r.json()).map(f=>"assets/"+f))}catch(e){}return new Set()}
async function loadArt(){
  makeProcSprites();
  const have=await artList();window.ART_HAVE=have;
  await preloadAll(have,(d,n)=>{if(window.loadingProg)loadingProg(d,n)});
  for(const[k,a]of Object.entries(ART_SRC)){
    const need=a.layers?a.layers:a.grid?[a.sheet]:[a.sheet,a.json];if(!need.every(f=>have.has(f)))continue;
    try{
      if(a.layers){const ims=await Promise.all(a.layers.map(loadImg));if(ims.every(Boolean)){SPR[k]={layers:ims.map(im=>{const cv=mkCanvas(im.width,im.height);cv.getContext("2d").drawImage(im,0,0);return cv})}}continue}// 層は分けたまま（動く層を層ごとに重ねるため）
      if(a.grid){const im=await loadImg(a.sheet);if(!im)continue;const[w,h,n]=a.grid,frames=[];for(let i=0;i<n;i++){const cv=mkCanvas(w,h);cv.getContext("2d").drawImage(im,i*w,0,w,h,0,0,w,h);frames.push(cv)}
        SPR[k]={frames,dur:frames.map(()=>a.ms),tags:{play:[0,n-1],stand:[0,0]},foot:[w/2,h/2]};continue}
      const[js,im]=await Promise.all([loadJSON(a.json),loadImg(a.sheet)]);if(!js||!im)continue;
      const frames=[],dur=[],tags={};
      (Array.isArray(js.frames)?js.frames:Object.values(js.frames)).forEach(f=>{const r=f.frame,cv=mkCanvas(r.w,r.h);cv.getContext("2d").drawImage(im,r.x,r.y,r.w,r.h,0,0,r.w,r.h);frames.push(cv);dur.push(f.duration||100)});
      ((js.meta&&js.meta.frameTags)||[]).forEach(t=>{tags[t.name]=[t.from,t.to]});
      if(!tags.stand)tags.stand=[0,0];
      // 絵にないタグは、仮のドットの同じ名前を使わず、今ある絵（stand）＋動きで出す
      SPR[k]={frames,dur,tags,foot:a.foot};
    }catch(e){}
  }
  window.ART_STATE=Object.fromEntries(Object.keys(ART_SRC).map(k=>[k,SPR[k]&&!SPR[k].proc?"絵":"仮"]));
  await buildStages(have);await buildStagesC2(have);await buildMeter(have);await buildTutParts(have);applyUi640(have);
  // 絵ファイル（背景・アイコン・カード）を名前で引けるように
  window.IMG={};await Promise.all([...have].filter(f=>f.endsWith(".png")&&f.includes("/c2/")&&!f.includes("/characters/")).map(async f=>{IMG[f]=await loadImg(f)}));
}
/* ---- 背景の動く層（data/stages.js）を、読みこんだ絵で組み立てる ---- */
const STAGE_RT={};
async function buildStages(have){
  for(const[name,st]of Object.entries(STAGES)){
    let move=st.move.slice();const mj="assets/revremit_bg_"+name+"_move.json";
    if(have.has(mj)){const j=await loadJSON(mj);if(Array.isArray(j))move=j;else if(j&&Array.isArray(j.move))move=j.move}
    const base=SPR[st.art]&&SPR[st.art].layers?SPR[st.art].layers:[];
    const rt={layers:base,move:[]};
    for(const m of move){const o=Object.assign({},m);
      try{
        if(o.t==="sheet"){if(!have.has(o.src)||!have.has(o.json))continue;const[js,im]=await Promise.all([loadJSON(o.json),loadImg(o.src)]);if(!js||!im)continue;
          o.frames=[];o.dur=[];(Array.isArray(js.frames)?js.frames:Object.values(js.frames)).forEach(f=>{const r=f.frame,cv=mkCanvas(r.w,r.h);cv.getContext("2d").drawImage(im,r.x,r.y,r.w,r.h,0,0,r.w,r.h);o.frames.push(cv);o.dur.push(f.duration||100)});
          o.total=o.dur.reduce((a,b)=>a+b,0)}
        else if(o.t==="blink"||(o.t==="flow"&&o.src)){if(!have.has(o.src))continue;o.img=await loadImg(o.src);if(!o.img)continue}
        else if(o.t==="glow"){const L=base[o.layer||0];if(!L)continue;o.mask=glowMask(L)}
        else if(o.t==="wave"){if(!base[o.layer])continue}
      }catch(e){continue}
      rt.move.push(o)}
    // 雪の粒
    const sn=rt.move.find(m=>m.t==="snow");if(sn){sn.p=[];for(let i=0;i<(sn.n||50);i++)sn.p.push({x:Math.random(),y:Math.random(),v:6+Math.random()*10,s:Math.random()<0.2?2:1})}
    STAGE_RT[name]=rt;
  }
}
/* 明るくて色の強い画素（ネオン）だけを抜き出した絵 */
function glowMask(src){const w=src.width,h=src.height,cv=mkCanvas(w,h),g=cv.getContext("2d");g.drawImage(src,0,0);
  const d=g.getImageData(0,0,w,h),a=d.data;
  for(let i=0;i<a.length;i+=4){if(!a[i+3]){continue}const[hh,s,l]=rgb2hsl(a[i],a[i+1],a[i+2]);if(!(s>0.45&&l>0.55)){a[i+3]=0}}
  g.putImageData(d,0,0);return cv}
/* タグのコマ（なければ stand） */
function frameOf(set,tag,i){const t=set.tags[tag]||set.tags.stand||[0,0];const n=t[1]-t[0]+1;return set.frames[t[0]+Math.max(0,Math.min(n-1,i|0))]}
function tagLen(set,tag){const t=set.tags[tag];return t?t[1]-t[0]+1:0}

/* ---- 色変え ---- */
const PAL_CACHE=new Map();
function palCanvas(src,palKey){
  if(!palKey||!PALS[palKey])return src;
  const key=palKey;let m=PAL_CACHE.get(src);if(!m){m={};PAL_CACHE.set(src,m)}if(m[key])return m[key];
  const P=PALS[palKey],cv=mkCanvas(src.width,src.height),g=cv.getContext("2d");g.drawImage(src,0,0);
  const d=g.getImageData(0,0,cv.width,cv.height),a=d.data;
  const map=P.map?Object.fromEntries(Object.entries(P.map).map(([f,t])=>[hex(f).join(","),hex(t)])):null;
  for(let i=0;i<a.length;i+=4){if(!a[i+3])continue;
    if(map){const t=map[a[i]+","+a[i+1]+","+a[i+2]];if(t){a[i]=t[0];a[i+1]=t[1];a[i+2]=t[2]}continue}
    let[h,s,l]=rgb2hsl(a[i],a[i+1],a[i+2]);if(l<0.12)continue;// 縁取りは変えない
    h=(h+(P.hue||0)/360+1)%1;s=Math.min(1,s*(P.sat||1));l=Math.min(1,l*(P.lit||1));const[r,gg,b]=hsl2rgb(h,s,l);a[i]=r;a[i+1]=gg;a[i+2]=b}
  g.putImageData(d,0,0);m[key]=cv;return cv;
}
function rgb2hsl(r,g,b){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b);let h=0,s=0;const l=(mx+mn)/2;
  if(mx!==mn){const d=mx-mn;s=l>0.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h/=6}return[h,s,l]}
function hsl2rgb(h,s,l){if(!s){const v=Math.round(l*255);return[v,v,v]}const q=l<0.5?l*(1+s):l+s-l*s,p=2*l-q;
  const f=t=>{t=(t+1)%1;return t<1/6?p+(q-p)*6*t:t<1/2?q:t<2/3?p+(q-p)*(2/3-t)*6:p};return[f(h+1/3),f(h),f(h-1/3)].map(v=>Math.round(v*255))}
/* 1色で塗る（光る・赤くなる） */
const TINT_CACHE=new Map();
function tintCanvas(src,col){let m=TINT_CACHE.get(src);if(!m){m={};TINT_CACHE.set(src,m)}if(m[col])return m[col];
  const cv=mkCanvas(src.width,src.height),g=cv.getContext("2d");g.drawImage(src,0,0);g.globalCompositeOperation="source-in";g.fillStyle=col;g.fillRect(0,0,cv.width,cv.height);m[col]=cv;return cv}

/* ---- 数字のドット（3×5。大きい数字は整数倍） ---- */
const DIG={"0":"111101101101111","1":"010110010010111","2":"111001111100111","3":"111001111001111","4":"101101111001001","5":"111100111001111","6":"111100111101111","7":"111001010010010","8":"111101111101111","9":"111101111001111","+":"000010111010000","-":"000000111000000","×":"000101010101000",".":"000000000000010","/":"001001010100100"};
function digits(g,str,x,y,col,s){s=s||1;str=String(str);g.fillStyle=col;let cx=x;
  for(const ch of str){const m=DIG[ch];if(m){for(let j=0;j<5;j++)for(let i=0;i<3;i++)if(m[j*3+i]==="1")g.fillRect(cx+i*s,y+j*s,s,s)}cx+=4*s}return cx-x}
function digitsW(str,s){return String(str).length*4*(s||1)-(s||1)}

/* ===== ★C2 の背景（bg\c2 の base＋fx json）：ネオンの部品・映りこみのシート・窓のまたたき・車のライト・雪 ===== */
const STAGE_C2={};
async function buildStagesC2(have){
  for(const name of["street","pass","circuit"]){const dir="assets/c2/bg/c2/",js=dir+`revremit_bg_${name}_fx.json`,bp=dir+`revremit_bg_${name}_base.png`;
    if(!have.has(bp))continue;const base=await loadImg(bp);if(!base)continue;const st={base,neon:[],sheets:[],pixels:null,cars:null,snow:null};
    const j=have.has(js)?await loadJSON(js):null;
    if(j)for(const L of j.layers||[]){
      try{
      if(L.type==="parts")for(const it of L.items){const im=have.has(dir+it.part)?await loadImg(dir+it.part):null;if(im)st.neon.push(Object.assign({im,ph:Math.random()*10000},it))}
      else if(L.type==="sheet"){const im=await loadImg(dir+L.sheet);if(im){const[w,h]=L.frame,fr=[];for(let i=0;i<L.frames;i++){const cv=mkCanvas(w,h);cv.getContext("2d").drawImage(im,i*w,0,w,h,0,0,w,h);fr.push(cv)}st.sheets.push({fr,x:L.x,y:L.y,ms:L.frame_ms})}}
      else if(L.type==="pixels")st.pixels={col:`rgb(${L.dim_color.join(",")})`,pts:L.pixels.map(p=>({x:p[0],y:p[1],next:Math.random()*L.period_ms[1],off:0})),per:L.period_ms};
      else if(L.type==="path"){const r=await loadImg(dir+L.parts.right),l=await loadImg(dir+L.parts.left);if(r&&l)st.cars={r,l,path:L.path,sp:L.speed_px_s,spawn:L.spawn_ms,alpha:L.alpha,list:[],next:500}}
      else if(L.type==="particles"){const ims=await Promise.all(L.parts.map(f=>have.has(dir+f)?loadImg(dir+f):null));const p=[];L.count.forEach((n,k)=>{if(!ims[k])return;// BUG-21：読めない絵の粒は作らない
        for(let i=0;i<n;i++)p.push({k,x:Math.random()*L.area[2],y:Math.random()*L.area[3],v:L.fall_px_s[k][0]+Math.random()*(L.fall_px_s[k][1]-L.fall_px_s[k][0]),ph:Math.random()*6.28,sw:L.sway_px[k]})});
        st.snow={ims,p,area:L.area,alpha:L.alpha}}
      }catch(e){}}
    STAGE_C2[name]=st}
}
/* ===== ★メーター（ui\c2 のメーターの絵）：絵の中の「動く所」（LED の弧・ギアの数字・回転の数字・燃料のコマ・−1）を消した下地を作り、そこへ今の値を描く ===== */
const METER={};
async function buildMeter(have){
  // ★v0.15：グラフィック班の「枠だけ」の絵（revremit_ui_meter_c2_frame.json）。LED の区切りは led_index の赤の値（1〜32・1区切り 250rpm）
  const fr="assets/c2/ui/c2/revremit_ui_meter_c2_frame.png",li="assets/c2/ui/c2/revremit_ui_meter_c2_led_index.png";
  if(have.has(fr)&&have.has(li)){const [im,ix]=await Promise.all([loadImg(fr),loadImg(li)]);
    if(im&&ix){const W=im.width,H=im.height,cv=mkCanvas(W,H);cv.getContext("2d").drawImage(im,0,0);
      const c2=mkCanvas(W,H),g2=c2.getContext("2d");g2.drawImage(ix,0,0);const a=g2.getImageData(0,0,W,H).data,ring=[];
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4;if(a[i+3]>0&&a[i]>=1&&a[i]<=32)ring.push({x,y,seg:a[i]-1})}
      const cells=[[33,42],[47,56],[61,70],[75,84],[89,98]];// 上から（json の fuel_cells の1つ外）
      Object.assign(METER,{blank:cv,ring,frame:true,segs:32,segRpm:250,cx:60,cy:57,gearCy:53,arcR:47,cells,cellX:[123,148],useX:157,useY:65,W,H});return}}
  const f="assets/c2/ui/c2/revremit_ui_meter_c2_01.png";if(!have.has(f))return;const im=await loadImg(f);if(!im)return;
  const W=im.width,H=im.height,cv=mkCanvas(W,H),g=cv.getContext("2d");g.drawImage(im,0,0);const d=g.getImageData(0,0,W,H),a=d.data,bg=[10,8,18];
  const cx=60,cy=61,ring=[];const set=(x,y)=>{const i=(y*W+x)*4;a[i]=bg[0];a[i+1]=bg[1];a[i+2]=bg[2]};
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const dx=x-cx,dy=y-cy,r=Math.hypot(dx,dy);if(r<35.5||r>48.5)continue;
    let ang=Math.atan2(dx,-dy)*180/Math.PI;if(Math.abs(ang)>140)continue;const i=(y*W+x)*4,mx=Math.max(a[i],a[i+1],a[i+2]),mn=Math.min(a[i],a[i+1],a[i+2]);
    if(mx-mn>40&&mx>50){ring.push({x,y,t:(ang+135)/270});set(x,y)}}
  const clr=(x0,y0,x1,y1)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)set(x,y)};
  clr(48,36,72,66);clr(47,73,73,81);clr(152,58,170,72);
  const cells=[[33,40],[47,55],[62,69],[76,83],[90,97]];cells.forEach(([y0,y1])=>clr(121,y0,147,y1));
  g.putImageData(d,0,0);Object.assign(METER,{blank:cv,ring,cx,cy,gearCy:50,cells,cellX:[121,147],useX:153,useY:63,W,H})}

/* ===== ★戦闘以外の画面の部品（ui\\c2\\revremit_ui640_parts.json）：CSS の変数に入れて、body に u640 をつける（無ければ前の見た目） ===== */
function applyUi640(have){const d="assets/c2/ui/c2/revremit_ui640_",ks=["panel","panel_cyan","header","btn_main","btn_main_down","btn_sub","btn_sub_down","btn_off","btn_danger","price","price_sale","badge_sale","badge_feature","badge_new","slot","slot_special","slot_select","slot_sold","card_select_01","card_select_02","coin","cursor","star","rare_c","rare_r","rare_e","rare_sk","divider"];
  if(!have.has(d+"panel.png")||!have.has(d+"btn_main.png"))return;const r=document.documentElement.style;
  ks.forEach(k=>{const f=d+k+".png";if(have.has(f))r.setProperty("--u-"+k.replace(/_/g,"-"),`url(${(window.ART_EMBED&&ART_EMBED[f])||f})`)});
  document.body.classList.add("u640")}
/* ===== ★チュートリアルの部品（ui\c2\revremit_ui_tut_c2.json）：コマを切って data URL に（DOM で使う） ===== */
const TUTP={};
async function buildTutParts(have){const dir="assets/c2/ui/c2/",j=dir+"revremit_ui_tut_c2.json";if(!have.has(j))return;const J=await loadJSON(j);if(!J)return;
  const cut=async(file,cell,n)=>{const im=await loadImg(dir+file);if(!im)return null;const out=[];for(let i=0;i<n;i++){const cv=mkCanvas(cell[0],cell[1]);cv.getContext("2d").drawImage(im,i*cell[0],0,cell[0],cell[1],0,0,cell[0],cell[1]);out.push(cv.toDataURL())}return out};
  // ★BUG-21 の追記：部品ごとに読む。読めない絵（null）は入れない＝その部品だけ出さない（チュートリアルは止まらない）
  const ok=u=>Array.isArray(u)&&u.length&&u.every(Boolean);
  try{const u=await cut(J.frame.file,J.frame.cell,J.frame.frames);if(ok(u))TUTP.frame={urls:u,ms:J.frame.ms[0],slice:J.frame.nine_slice.left}}catch(e){}
  try{TUTP.arrow={ms:J.arrow.ms[0],cell:J.arrow.cell};for(const d of["up","down","left","right"]){try{const u=await cut(J.arrow.files[d],J.arrow.cell,J.arrow.frames);if(ok(u))TUTP.arrow[d]={urls:u,tip:J.arrow.tip[d]}}catch(e){}}}catch(e){TUTP.arrow=null}
  try{const u=await cut(J.comm_mio.file,J.comm_mio.cell,J.comm_mio.frames);if(ok(u))TUTP.comm={urls:u,ms:J.comm_mio.ms[0]}}catch(e){}}
