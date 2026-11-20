/* js/glossary.js（プログラム班②） */
"use strict";
/* ===== 用語のヘルプ（progression 1-25 の 2）=====
   ・カード・パーツの説明・予告の中の用語に点線の下線。タップで意味の小窓（1〜2行）。小窓の外をタップで閉じる（そのタップは下に通さない＝打ちまちがえない）。
     ★長押しは使わない（手札の拡大と重なる・design 1-25）。
   ・1つの窓の中では、同じ用語の下線は最初の1回だけ（「回転」だらけにならないように）。
   ・用語集：図鑑の「用語集」タブ（codex.js が GLOSS.list() を出す）と、ルール一覧（あそびかた）の下のボタン。
   ・文の正本はシナリオ班（text の term_*）。TEXT.terms があればそれを使う。いまは仮の文（prov）。数字は書かない。 */
const GLOSS_DEF=[
 /* [見出し, よみ（五十音の並び）, 型, 仮の文] */
 ["回転","かいてん","エンジン","エンジンの回転数。カードを打つと上がる。カードの左上の数が上がる量。"],
 ["シフトアップ","しふとあっぷ","エンジン","ギアを1段上げる。回転が下がって、カードの倍率が上がる。"],
 ["シフトダウン","しふとだうん","エンジン","ギアを1段下げる。回転が上がる。ガソリンを使う。"],
 ["パーキングレンジ","ぱーきんぐれんじ","エンジン","AT のシフトダウン。"],
 ["キックダウン","きっくだうん","エンジン","AT で1段シフトダウンする。"],
 ["パーフェクト","ぱーふぇくと","シフト","シフトの帯の芯でシフトアップしたとき。いちばん得をする。"],
 ["グッド","ぐっど","シフト","シフトの帯の中でシフトアップしたとき。"],
 ["早すぎ","はやすぎ","シフト","回転が帯に届く前にシフトアップしたとき。得がない。"],
 ["帯","おび","カード","カードの打ちごろの回転（L 低い・M なか・R 高い）。帯の中で打つと強くなる。"],
 ["レッドゾーン","れっどぞーん","エンジン","リミットの手前の高い回転。強くなるカードもあるが、こえると危ない。"],
 ["リミット","りみっと","エンジン","回転の上限。こえるとオーバーレブ。"],
 ["オーバーレブ","おーばーれぶ","エンジン","回転がリミットをこえたとき。エンジン耐久が減る。"],
 ["ブロー","ぶろー","エンジン","いちばん上のギアでリミットをこえると、エンジンが壊れてランが終わる。"],
 ["ガソリン","がそりん","エンジン","カードを打つのに使う。シフトアップでもどる。"],
 ["エンジン耐久","えんじんたいきゅう","エンジン","自分の体力。0 になるとエンジンが止まって負け。"],
 ["チェイン","ちぇいん","カード","1ターンに続けて打ったカードの数。多いほど、あとのカードが強くなる。"],
 ["大技","おおわざ","カード","強いかわりに、条件を満たすたびにガソリンが重くなるカード。"],
 ["場の効果","ばのこうか","カード","打ったあと、その戦闘のあいだずっと効く効果。"],
 ["強化","きょうか","カード","シムトレーニングでカードを強くすること。名前に「＋」がつく。"],
 ["生成","せいせい","カード","戦闘の中で作られるカード。使うと消える。"],
 ["ジャマ","じゃま","カード","敵がまぜてくる、いらないカード。"],
 ["消える","きえる","カード","使うと、その戦闘のあいだ山札にもどらない。"],
 ["防御","ぼうぎょ","戦闘","受けるダメージを先に減らす。ふつうはターンが変わると消える。"],
 ["貫通","かんつう","戦闘","防御を無視して入る攻撃。"],
 ["凍結","とうけつ","状態","敵の番を遅らせる。"],
 ["炎上","えんじょう","状態","敵の番のたびに、続けてダメージを与える。"],
 ["ノイズ","のいず","状態","ゴーストのじゃま。"],
 ["ワンターンキル","わんたーんきる","戦闘","敵が1回も動く前に倒すこと。"],
 ["花の便り","はなのたより","キャラの決まり","もも の決まり。チェインが続いているのに打てるアタックが手札にないとき、1枚引ける。"],
];
const GLOSS={
  /* 見出し → {w,yomi,cat,t,prov}。TEXT.terms（シナリオ班）があれば文を差しかえ */
  map(){if(this._m)return this._m;const T=(window.TEXT&&TEXT.terms)||{},m={};
    GLOSS_DEF.forEach(([w,yomi,cat,t])=>{const x=T[w]||T["term_"+w];m[w]={w,yomi,cat,t:x?(x.t||x):t,prov:!x}});
    Object.keys(T).forEach(k=>{const w=k.replace(/^term_/,"");if(!m[w]){const x=T[k];m[w]={w,yomi:x.yomi||w,cat:x.cat||"そのほか",t:x.t||x,prov:false}}});
    return this._m=m},
  list(by){const a=Object.values(this.map());return by==="cat"?a.sort((x,y)=>x.cat.localeCompare(y.cat,"ja")||x.yomi.localeCompare(y.yomi,"ja")):a.sort((x,y)=>x.yomi.localeCompare(y.yomi,"ja"))},
  re(){if(this._re)return this._re;const ws=Object.keys(this.map()).sort((a,b)=>b.length-a.length).map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"));return this._re=new RegExp(ws.join("|"),"g")},
  /* 下線をつける所（①の画面の class）。[data-gloss] をつければどこでも */
  SCOPE:".dtx,.bd,.dkdet,.pt .small,.psl .small,.pdiff,.chdet,[data-gloss]",
  SKIP:".gl,.dn,.cn,.bn,button.main,button.warn,.glpop",
  /* el の中の文字に下線（同じ用語は1つの窓で1回） */
  mark(el){if(!el||el.__gl)return;el.__gl=1;const re=this.re(),done=new Set(),skip=this.SKIP;
    const tw=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement&&n.parentElement.closest(skip)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
    const nodes=[];while(tw.nextNode())nodes.push(tw.currentNode);
    nodes.forEach(n=>{const s=n.nodeValue;re.lastIndex=0;let m,last=0,frag=null;
      while((m=re.exec(s))){if(done.has(m[0]))continue;done.add(m[0]);frag=frag||document.createDocumentFragment();
        frag.appendChild(document.createTextNode(s.slice(last,m.index)));const u=document.createElement("u");u.className="gl";u.dataset.t=m[0];u.textContent=m[0];frag.appendChild(u);last=m.index+m[0].length}
      if(frag){frag.appendChild(document.createTextNode(s.slice(last)));n.parentNode.replaceChild(frag,n)}})},
  scan(root){if(!root||!this.on())return;root.querySelectorAll(this.SCOPE).forEach(e=>this.mark(e))},
  on(){return!window.TUTORIAL_ON},
  /* 小窓 */
  show(w,cx,cy){const d=this.map()[w];if(!d)return;this.close();const st=$("#stage");if(!st)return;
    const r=st.getBoundingClientRect(),s=(window.FIT&&FIT.s)||1;let x=(cx-r.left)/s,y=(cy-r.top)/s;
    const p=document.createElement("div");p.className="glpop";p.innerHTML=`<b>${rr2Esc(d.w)}</b>${d.prov?'<i class="prov">仮</i>':""}<div>${rr2Esc(d.t)}</div>`;
    st.appendChild(p);const W=p.offsetWidth,H=p.offsetHeight;x=Math.max(4,Math.min(RES.W-W-4,x-W/2));y=y-H-10<4?y+14:y-H-10;y=Math.max(4,Math.min(RES.H-H-4,y));
    p.style.left=x+"px";p.style.top=y+"px";this.pop=p;try{SND.se("ui_ok")}catch(e){}},
  close(){if(this.pop){this.pop.remove();this.pop=null;return true}return false}};
window.GLOSS=GLOSS;
/* タップ：下線 → 小窓（下の部品には通さない）／小窓が出ている間の外のタップ → 閉じるだけ */
["pointerdown","click"].forEach(t=>document.addEventListener(t,e=>{
  const u=e.target.closest&&e.target.closest("u.gl");
  if(GLOSS.pop&&!(e.target.closest&&e.target.closest(".glpop"))){e.stopPropagation();e.preventDefault();if(t==="pointerdown"){const same=u&&GLOSS.pop.__w===u.dataset.t;GLOSS.close();if(u&&!same){GLOSS.show(u.dataset.t,e.clientX,e.clientY);GLOSS.pop.__w=u.dataset.t}}return}
  if(u){e.stopPropagation();e.preventDefault();if(t==="pointerdown"){GLOSS.show(u.dataset.t,e.clientX,e.clientY);if(GLOSS.pop)GLOSS.pop.__w=u.dataset.t}}
},true));
/* 画面が書きかわるたびに下線（#ui と #modal を見張る。①が mark を直接呼ぶ形にしてもよい） */
(function(){let q=0;const run=()=>{q=0;GLOSS.scan($("#ui"));GLOSS.scan($("#modal"))};
  const mo=new MutationObserver(()=>{if(!q){q=1;requestAnimationFrame(run)}});
  const go=()=>{["#ui","#modal"].forEach(s=>{const e=$(s);if(e)mo.observe(e,{childList:true,subtree:true})})};
  if(document.readyState==="loading")addEventListener("DOMContentLoaded",go);else go()})();
/* ルール一覧（あそびかた）の下に「用語集」 */
RRHOOK.on("screen",o=>{if(o.n!=="howto")return;const b=$("#modal .box");if(!b||b.querySelector(".glbtn"))return;
  const row=b.querySelector(".row")||b;const k=document.createElement("button");k.className="glbtn";k.textContent="用語集";
  k.onclick=()=>{closeModal();if(typeof showCodex==="function")showCodex("gloss",window.SCREEN==="title"?"title":null)};
  if(!G||window.SCREEN==="title")row.appendChild(k)});
