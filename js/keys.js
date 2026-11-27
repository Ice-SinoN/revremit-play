/* ★v0.22.190 キーボード／筐体のボタン（技術メモ 2-1・β のあとの宿題 ⑮・虎雪 11-27「全部勝手にやって」で 2-1 の案のまま入れる）
   ・マウス／タッチは今までと同じ。キーを押したときだけ「今えらんでいる所」にライムの枠を出し、マウスやタッチで消す。
   ・えらべる所＝押せる所（button・onclick のある所）で、その真ん中で一番上に出ている物（小窓や会話の幕の下にある物はえらばない）。
   ・←→↑↓：画面の上で、その向きの近い順にとなりへ。Enter・左Ctrl：決定（手札は1回目で予告、もう1回で打つ＝タッチと同じ）。
   ・Esc・左Alt：戻る（小窓を閉じる・カードをえらぶのをやめる・「戻る」ボタン）。Space：↓シフト（AT はパーキング）。
   ・左Shift：0.4秒おしっぱなしでターン終了。Z：カードの説明。X（おしっぱなし）：早送り（会話・演出）。1・Tab：会話を「とばす」。
   ・割り当ては localStorage「revremit_keys」で変えられる（データとは別の全体の設定）。例：{"ok":["Enter","KeyA"]} */
const KEYS={def:{ok:["Enter","NumpadEnter","ControlLeft"],back:["Escape","AltLeft","Backspace"],down:["Space"],end:["ShiftLeft"],help:["KeyZ"],ff:["KeyX"],skip:["Digit1","Tab"],
  up:["ArrowUp"],dn:["ArrowDown"],lf:["ArrowLeft"],rt:["ArrowRight"]},on:false,cur:null,last:null,endT:0,endS:0,sel:'button,[onclick],a[href],input,select,textarea'};
KEYS.map=(()=>{let m=Object.assign({},KEYS.def);try{const o=JSON.parse(localStorage.getItem("revremit_keys")||"null");if(o&&typeof o==="object")for(const k in o)if(Array.isArray(o[k])&&KEYS.def[k])m[k]=o[k].map(String)}catch(e){}return m})();
function kAct(code){for(const k in KEYS.map)if(KEYS.map[k].includes(code))return k;return null}
function kVis(el){if(!el||!el.isConnected||el.disabled)return null;if(!el.matches("button,a[href],input,select,textarea")&&!(el.getAttribute("onclick")||"").trim())return null;/* onclick="" は押しても何もおきない（チュートリアルの文の帯など） */const r=el.getBoundingClientRect();if(r.width<6||r.height<6)return null;
  const cs=getComputedStyle(el);if(cs.visibility==="hidden"||cs.pointerEvents==="none"||+cs.opacity===0)return null;
  const x=Math.min(innerWidth-1,Math.max(0,r.left+r.width/2)),y=Math.min(innerHeight-1,Math.max(0,r.top+r.height/2));if(r.right<0||r.bottom<0||r.left>innerWidth||r.top>innerHeight)return null;
  const h=document.elementFromPoint(x,y);if(!h||!(h===el||el.contains(h)))return null;
  const hc=h.closest(KEYS.sel);if(hc&&hc!==el&&el.contains(hc))return null;/* 中にもっと小さい押せる物があるときは、そちらをえらぶ */
  return r}
function kList(){const md=document.getElementById("modal"),st=(md&&md.children.length&&md.querySelector(KEYS.sel))?md:(document.getElementById("stage")||document.body),out=[];/* 小窓が開いているときは小窓の中だけ */st.querySelectorAll(KEYS.sel).forEach(el=>{const r=kVis(el);if(r)out.push({el,r,x:r.left+r.width/2,y:r.top+r.height/2,big:r.width*r.height})});
  const big=innerWidth*innerHeight*0.5;const small=out.filter(o=>o.big<big);return small.length?small:out}/* 画面いっぱいの「タップで進む」は、ほかに押せる物がないときだけ */
function kRing(){document.querySelectorAll(".kf").forEach(e=>{if(e!==KEYS.cur||!KEYS.on)e.classList.remove("kf")});if(KEYS.on&&KEYS.cur&&KEYS.cur.isConnected)KEYS.cur.classList.add("kf")}
function kSet(el){KEYS.cur=el;if(el){const r=el.getBoundingClientRect();KEYS.last={x:r.left+r.width/2,y:r.top+r.height/2,s:window.SCREEN}}kRing()}
function kDefault(L){if(window.SCREEN==="battle"&&!window.TUTORIAL_ON){const H=kHand(L);if(H.length){const sel=typeof S!=="undefined"&&S.sel>=0?H.find(o=>(o.el.getAttribute("onclick")||"")==="clickCard("+S.sel+")"):null;
    const md=document.getElementById("modal");if(!(md&&md.children.length)){const two=L.find(o=>/^doPlay\(/.test(o.el.getAttribute("onclick")||""));if(sel&&two){const sh=L.find(o=>/doPlay\([^)]*true\)/.test(o.el.getAttribute("onclick")||"")),st=L.find(o=>/doPlay\([^)]*false\)/.test(o.el.getAttribute("onclick")||""));return((sh&&/パーフェクト/.test(sh.el.textContent))?sh:(st||sh||two)).el}/* 2択の最初の位置：パーフェクトになるときだけ「シフトして打つ」（2-1） */let nb=null;if(!sel&&KEYS.last&&KEYS.last.s==="battle"){let bd=1e9;H.forEach(o=>{const d=Math.abs(o.x-KEYS.last.x)+Math.abs(o.y-KEYS.last.y)*0.2;if(d<bd){bd=d;nb=o}})}return(sel||nb||H[0]).el}}}/* 戦闘は手札から（かき直しのあとは前の位置に近いカード）（カードをえらんでいるときは「打つ」の2択から） */
const go=L.find(o=>o.el.matches(".rdgo,.csgo:not(.off)"));if(go)return go.el;/* 「走る」「この子で走る」 */
  const mains=L.filter(o=>o.el.classList.contains("main")).sort((a,b)=>b.big-a.big);const pri=mains[0]||L.find(o=>o.el.classList.contains("sel")||o.el.classList.contains("on")||o.el.classList.contains("now")||o.el.classList.contains("pri"));
  if(pri)return pri.el;const L2=L.filter(o=>!o.el.matches(".tskip,.skip,[onclick*='Skip(']"));if(L2.length)L=L2;/* 「スキップ」は最初にえらばない */if(KEYS.last&&KEYS.last.s===window.SCREEN){let b=null,bd=1e9;L.forEach(o=>{const d=Math.hypot(o.x-KEYS.last.x,o.y-KEYS.last.y);if(d<bd){bd=d;b=o}});if(b)return b.el}
  const st=document.getElementById("stage"),sr=st?st.getBoundingClientRect():{left:0,top:0,width:innerWidth,height:innerHeight},cx=sr.left+sr.width/2,cy=sr.top+sr.height/2;
  return L.slice().sort((a,b)=>Math.hypot(a.x-cx,a.y-cy)-Math.hypot(b.x-cx,b.y-cy))[0].el}/* 何もないときは画面のまん中に近い物（すみの「もどる」「記録を見る」を最初にえらばない） */
function kValid(L){if(KEYS.cur&&L.some(o=>o.el===KEYS.cur))return KEYS.cur;return null}
function kHand(L){return L.filter(o=>/^clickCard\(/.test(o.el.getAttribute("onclick")||"")).sort((a,b)=>a.x-b.x)}
function kMove(dir){const L=kList();if(!L.length)return;let c=kValid(L);if(!c){kSet(kDefault(L));return}
  /* 戦闘：↓は手札へ（今えらんでいるカード、なければ左はし）。手札の中の ←→ は となりのカードへ */
  if(window.SCREEN==="battle"){const H=kHand(L),inH=H.some(o=>o.el===c);
    if(dir==="dn"&&!inH&&H.length){const sel=typeof S!=="undefined"&&S.sel>=0?H.find(o=>(o.el.getAttribute("onclick")||"")==="clickCard("+S.sel+")"):null;kSet((sel||H[0]).el);return}
    if(inH&&dir==="dn")return;/* 手札の下には何もない（右下の「ターン終了」に飛ばない） */
    if(inH&&(dir==="lf"||dir==="rt")){const i=H.findIndex(o=>o.el===c),j=i+(dir==="rt"?1:-1);if(j>=0&&j<H.length)kSet(H[j].el);return}}
  const r=c.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,v={up:[0,-1],dn:[0,1],lf:[-1,0],rt:[1,0]}[dir];let best=null,bs=1e9;
  L.forEach(o=>{if(o.el===c)return;const dx=o.x-cx,dy=o.y-cy,along=dx*v[0]+dy*v[1];if(along<=2)return;const perp=Math.abs(dx*v[1]-dy*v[0]);
    /* その向きに近い物を先に：横ずれは2.5倍の重み（重なりがある列・行は横ずれを小さく見る） */
    const ov=v[0]?(o.r.top<r.bottom&&o.r.bottom>r.top):(o.r.left<r.right&&o.r.right>r.left);if(!ov&&perp>along*2.5)return;/* 向きからずれすぎた物（ななめ遠く）には飛ばない */const s=along+perp*(ov?0.3:2.5);if(s<bs){bs=s;best=o}});
  if(best)kSet(best.el)}
function kClick(el){if(!el)return;if(el.matches("input,textarea,select")){el.focus();return}el.click()}
function kFind(re){return kList().find(o=>re.test((o.el.getAttribute("onclick")||"")+"|"+(o.el.textContent||"").trim()))}
function kBack(){const m=document.getElementById("modal");if(m&&m.children.length){const b=kFind(/^[^|]*\|\s*(閉じる|とじる|もどる|戻る|やめる|キャンセル|いいえ|×)\s*$/);if(b){kClick(b.el)}else closeModal();KEYS.cur=null;return}
  if(window.SCREEN==="battle"&&typeof S!=="undefined"&&S.sel>=0){S.sel=-1;if(window.A)A.pv=null;renderBattle();return}
  const b=kFind(/^[^|]*\|\s*(←\s*)?(戻る|もどる|閉じる|とじる|やめる|タイトルへ)/);if(b)kClick(b.el)}
function kHelp(){const c=KEYS.cur;if(!c)return;const pd=c.getAttribute("onpointerdown")||"";const m=pd.match(/cardLP\((\d+)\)/);
  if(m&&typeof B!=="undefined"&&B&&B.hand&&B.hand[+m[1]]){const i=+m[1],c=B.hand[i];if(typeof lpOf==="function"&&lpOf(c)){lpShow(c);return}if(S.sel!==i&&typeof clickCard==="function")clickCard(i);return}/* 長押しの説明があればそれ、なければ予告を出す（打たない＝タッチの1回目と同じ） */
  if(c.title&&typeof toast2==="function")toast2(c.title,56,3000)}
function kSkip(){const b=kFind(/^[^|]*\|\s*(とばす|スキップ|SKIP)\s*$/i);if(b)kClick(b.el)}
function kFF(){if(typeof busy==="function"&&busy()&&typeof uiSkip==="function"){uiSkip();return}if(typeof S!=="undefined"&&S.sc&&typeof sceneTap==="function")sceneTap()}
document.addEventListener("keydown",e=>{const t=e.target;if(t&&t.matches&&t.matches("input,textarea,select")&&e.code!=="Escape")return;
  if(KEYS.mod&&KEYS.mod.code!==e.code)KEYS.mod.x=1;/* Ctrl・Alt をおしながらほかのキー（Ctrl+R・Alt+Tab など）は、決定・戻るにしない */
  const a=kAct(e.code);if(!a)return;if(/^(Control|Alt|Meta)/.test(e.code)){if(!e.repeat)KEYS.mod={code:e.code,a,x:0};if(e.code.startsWith("Alt"))e.preventDefault();return}
  e.preventDefault();e.stopPropagation();kDo(a,e)},true);
function kDo(a,e){const was=KEYS.on;KEYS.on=true;e=e||{};
  if(a==="end"){if(!e.repeat&&!KEYS.endT){KEYS.endS=Date.now();KEYS.endT=setTimeout(()=>{KEYS.endT=0;const b=kFind(/doEndTurn\(/);if(b)kClick(b.el)},400)}return}
  if(a==="ff"){kFF();return}
  if(e.repeat&&a!=="up"&&a!=="dn"&&a!=="lf"&&a!=="rt")return;
  if(a==="up"||a==="dn"||a==="lf"||a==="rt"){kMove(a);return}
  if(a==="ok"){const L=kList();if(!L.length)return;let c=kValid(L);if(!c){c=kDefault(L);kSet(c);if(L.length>1)return}/* えらんでいる所がまだ無いときは、1回目は枠を出すだけ（押せる物が1つだけなら、そのまま押す） */
    kClick(c);requestAnimationFrame(()=>{const L2=kList();if(!kValid(L2)&&L2.length)kSet(kDefault(L2));else kRing()});return}
  if(a==="back"){kBack();return}
  if(a==="down"){const b=kFind(/do(DownShift|Parking)\(/);if(b)kClick(b.el);return}
  if(a==="help"){kHelp();return}
  if(a==="skip"){kSkip();return}}
document.addEventListener("keyup",e=>{if(kAct(e.code)==="end"&&KEYS.endT){clearTimeout(KEYS.endT);KEYS.endT=0}
  if(KEYS.mod&&KEYS.mod.code===e.code){const m=KEYS.mod;KEYS.mod=null;if(!m.x){e.preventDefault();kDo(m.a,{})}}},true);/* Ctrl・Alt は、はなしたときに（ほかのキーをおさなかったときだけ） */
addEventListener("blur",()=>{KEYS.mod=null;if(KEYS.endT){clearTimeout(KEYS.endT);KEYS.endT=0}});
KEYS.mx=null;["pointerdown","mousemove"].forEach(t=>document.addEventListener(t,e=>{if(t==="mousemove"){const p=e.clientX+","+e.clientY,was=KEYS.mx;KEYS.mx=p;if(was===null||was===p)return}if(KEYS.on){KEYS.on=false;kRing()}},true));/* マウスが本当に動いたとき・押したときだけ枠を消す */
/* 画面がかき直されたら、前にえらんでいた所に一番近い物に枠をうつす */
(function(){let q=0;const mo=new MutationObserver(()=>{if(!KEYS.on||q)return;q=requestAnimationFrame(()=>{q=0;const L=kList();if(!L.length)return;if(!kValid(L))kSet(kDefault(L));else kRing()})});
  const go=()=>{const st=document.getElementById("stage");if(st)mo.observe(st,{childList:true,subtree:true});else setTimeout(go,200)};go()})();
