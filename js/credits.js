/* ★v0.22.201 スタッフロール（text-add 53章・audio v0.38 credits／credits_end・窓口 11-27 15:44）
   流れ：ZERO の1回目の終わりの話（zero_ed）→ スタッフロール → リザルト → 朝のタイトル（title_morning）。2回目からは showCredits(null,{replay:1}) で見返す（棚の口は②へ）。
   87秒：12枚を秒の表どおりにフェードで出す。地の色は黒い夜から朝の色へ。画面を1秒長押しで「とばす」の札（1回目もとばせる）。
   10枚目「使った道具」は案A／案B の虎雪の返事待ち＝CREDITS_TOOLS（"A"|"B"）。★虎雪 11-27 16:39＝案A。 */
var CREDITS_TOOLS=window.CREDITS_TOOLS||"A";/* ★v0.22.204 虎雪 11-27 16:39：案A（名前を書く）で決め */
const CREDITS=[
 [0,"","Rev:Remit<br>― .50 CAL シリーズ ―"],
 [6,"プロデューサー","虎雪"],
 [13,"出てくれた10人","五十嵐 虎雪／日向 陽菜／桃瀬 百花／鳳城 菜々美／蒼井 空音<br>紅刃 楓／黒瀬 凛／月城 瑠奈／夜神 黒羽／喜屋武 澪"],
 [20,"ディレクション","チーフディレクター／窓口"],
 [27,"ゲームデザイン","ゲームデザイン班／レベルデザイン（LD）"],
 [34,"シナリオ・テキスト","シナリオ・テキスト班／メディアミックス班"],
 [41,"アート","アートディレクター（AD）／グラフィック班"],
 [48,"サウンド","サウンド班"],
 [55,"プログラム","プログラム班 ①・②・③／QA 班"],
 [62,"使った道具",null],
 [70,"テストプレイ","β を走ってくれた、みなさん<br>感想を送ってくれた、みなさん"],
 [78,"","このゲームの絵・音・文・プログラムの多くは、<br>生成 AI を使って作りました。<br>キャラクターと世界、遊びの手ざわりは、<br>ひとつずつ人が決めています。<br><br>走ってくれて、ありがとう。<br>――また、次の夜に。"]];
const CREDITS_TOOL_TXT={A:"開発チーム：Claude（Anthropic）<br>絵：PixAI ほか画像生成 AI ／ ドット絵：Aseprite<br>声と音：ElevenLabs ほか<br>公開：GitHub Pages",
 B:"開発チーム：対話型の生成 AI<br>絵：画像生成 AI ／ ドット絵の編集ソフト<br>声と音：音声・音楽の生成 AI<br>公開：Web の公開サービス"};
const CREDITS_LEN=87;
function showCredits(done,opt){opt=opt||{};const T=(TEXT.ui||{});closeModal();setScreen("credits");setScene("dim");SND.bgm("credits");
  const u=ui();u.innerHTML=`<div class="crroot" ${at(0,0,640,360)}><div class="crsky"></div><div class="crpage" ${at(40,90,560,180)}></div>
    <button class="u9 crskip" ${at(540,320,88,28)} style="display:none" onclick="creditsEnd()">${esc(T.credits_skip||"とばす")}</button></div>`;
  const C={done,t0:performance.now(),i:-1,timer:null,hold:null,opt};window.__CR=C;
  const pg=u.querySelector(".crpage"),sky=u.querySelector(".crsky"),root=u.querySelector(".crroot");
  const show=i=>{const[,h,b]=CREDITS[i];const body=b==null?CREDITS_TOOL_TXT[CREDITS_TOOLS]||CREDITS_TOOL_TXT.B:b;pg.classList.remove("on");
    setTimeout(()=>{pg.innerHTML=(h?`<div class="crh">${esc(h)}</div>`:"")+`<div class="crb${i===0?" crt":""}">${body}</div>`;pg.classList.add("on")},i?400:0)};
  C.timer=setInterval(()=>{const s=(performance.now()-C.t0)/1000;sky.style.setProperty("--k",Math.min(1,s/CREDITS_LEN).toFixed(3));
    let k=0;CREDITS.forEach(([t],j)=>{if(s>=t)k=j});if(k!==C.i){C.i=k;show(k)}if(s>=CREDITS_LEN)creditsEnd()},100);
  const hs=()=>{clearTimeout(C.hold);C.hold=setTimeout(()=>{const b=u.querySelector(".crskip");if(b)b.style.display=""},1000)},he=()=>clearTimeout(C.hold);
  root.addEventListener("pointerdown",hs);root.addEventListener("pointerup",he);root.addEventListener("pointerleave",he);
  if(opt.replay){const b=u.querySelector(".crskip");if(b)b.style.display=""}/* 見返すときは最初から「とばす」 */}
function creditsEnd(){const C=window.__CR;if(!C||C.ended)return;C.ended=1;clearInterval(C.timer);clearTimeout(C.hold);SND.call(A=>A.jingle("credits_end"));
  try{const p=PRF();p.creditsSeen=1;SAVE.auto()}catch(e){}
  setTimeout(()=>{window.__CR=null;if(C.done)C.done();else showTitle()},C.opt&&C.opt.replay?300:1800)}
window.showCredits=showCredits;window.creditsEnd=creditsEnd;
try{const st=document.createElement("style");st.textContent=`.crroot{position:absolute;overflow:hidden}
.crsky{position:absolute;inset:0;--k:0;background:linear-gradient(to top,rgb(calc(10 + 230*var(--k)),calc(12 + 150*var(--k)),calc(28 + 90*var(--k))) 0%,rgb(calc(6 + 60*var(--k)),calc(8 + 90*var(--k)),calc(20 + 140*var(--k))) 55%,rgb(4,6,16) 100%)}
.crpage{position:absolute;text-align:center;color:#fff;opacity:0;transition:opacity .4s;display:flex;flex-direction:column;justify-content:center;gap:10px}
.crpage.on{opacity:1}.crh{font-size:12px;color:#c5d0ff;letter-spacing:1px}.crb{font-size:15px;line-height:24px}.crb.crt{font-size:26px;line-height:34px}
.crskip{position:absolute}`;document.head.appendChild(st)}catch(e){}
