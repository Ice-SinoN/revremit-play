/* ★v0.22.108 キャラ選択 案1（design 15章・15-2・15-4）：タイトル「自分で走る」→ ①えらぶ（showCharSel）→ ②準備（showReady）→ 演出 → ラン。
   部品（グラフィック班 23-20・ui/c2/revremit_ui_charsel_*）が届くまでは ui640 の板・ボタンで組む（置けば絵に変わる所は csPart で見る）。
   文はシナリオ班待ち＝仮（TEXT.ui.cs_* があればそれ）。並びは加わる順・名前はローマ字。β ではまだ加わっていない6人はロック中で並べる。 */
const CS_ALL=["YUKI","HINA","MOMO","NANA","SORA","KAEDE","RIN","LUNA","MIO","KURO"];
/* 型の札（design 15-4 の例＝★決定）・札の色・解放の夜（progression 1-39）・走りかた。CHARS にない子（③の線）はここの仮の値 */
const CS_INFO={
 YUKI:{tag:"守りと凍結",col:"#7FE8FF"},HINA:{tag:"速攻",col:"#FF9A3D",join:1},MOMO:{tag:"チェイン",col:"#FF7FB6",join:2},NANA:{tag:"シフト連打",col:"#FF4F5E",join:3},
 SORA:{tag:"音色",col:"#B9A8FF",join:4,line:["リズムに合わせて手数を重ねる。","音の波が、敵の動きをずらす。"]},
 KAEDE:{tag:"レッドゾーン",col:"#8FE05A",join:5,line:["回転をレッドまで引っぱる。","一撃の重さで押し切る。"]},
 RIN:{tag:"弓と駒",col:"#6FB7FF",join:6,line:["敵の動きを読んで、先に止める。","駒をならべて、弓で決める。"]},
 LUNA:{tag:"星読み",col:"#C9A8FF",join:7,line:["山札の先を読んで、並べかえる。","星の巡りで、流れを変える。"]},
 MIO:{tag:"CVT",col:"#46E6FF",join:8,mode:"CVT",line:["ギアの段がない車。自動で走る。","先を読んで、むだなく回す。"]},
 KURO:{tag:"トリックスター",col:"#B04FFF",join:9,mode:"BIKE",line:["心拍で払って、グリッチを積む。","ルールの裏をかく、いたずらの型。"]}};
const CS_MODE_TXT={MT:"シフトの瞬間を自分で決める。パーフェクトを続けるほど伸びる。",AT:"シフトは自動・ブローしない。戦闘中にエコ／スポーツを選べる。",CVT:"ギアの段がない車。自動で走る。",BIKE:"自転車。ギアもシフトもない。"};
function CST(k,d){return(TEXT.ui&&TEXT.ui[k])||d}
function csInGame(c){return !!CHARS[c]}
function csOpen(c){return c==="YUKI"||(csInGame(c)&&charsOpen().includes(c))}
function csModes(c){const m=(CS_INFO[c]||{}).mode;return m?[m]:["MT","AT"]}
function csTag(c){const I=CS_INFO[c]||{};const tp=csPart("tag_"+c.toLowerCase());return`<span class="cstag${tp?" img":""}" style="--tc:${I.col||"#C5FF45"};${tp?`--ti:url('${tp}')`:""}">${esc(CST("cs_tag_"+c,I.tag||(CHARS[c]&&CHARS[c].type)||""))}</span>`}
function csLine(c){const I=CS_INFO[c]||{},t=TEXT.ui&&TEXT.ui["cs_line_"+c];return(t?String(t).split("\n"):(CHAR_STYLE[c]||I.line||[])).slice(0,2)}
/* 初期デッキの特徴：アタック・ガード・引くの数を初期デッキから数える（design 15-4） */
function csDeckCount(c){const o={atk:0,grd:0,drw:0};(CHARS[c]&&CHARS[c].deck||[]).forEach(([id,n])=>{const d=CARDS[id];if(!d)return;if(d.t==="atk")o.atk+=n;else if(d.t==="grd")o.grd+=n;else if(d.t==="drw"||(d.fx||[]).some(f=>f[0]==="draw"))o.drw+=n});return o}
function csPart(n){const p=`assets/c2/ui/c2/charsel/revremit_ui_charsel_${n}.png`;return typeof artHave==="function"&&artHave(p)?artURL(p):null}
/* 部品のボタン（23-20：normal／pressed／grey・影 2px こみ）。部品がなければ ui640 の u9 */
function csBtn(kind,cls,label,on,dis,pos){const n=csPart(kind+"_normal");pos=pos||"";const ps=pos.replace(/^style="|"$/g,"");
  if(!n)return`<button class="u9 ${kind==="btn120sub"?"":"main"} ${cls}" ${pos} ${dis?"disabled":`onclick="${on}"`}>${label}</button>`;
  return`<button class="csimg ${kind} ${cls}" style="${ps}--bn:url('${n}');--bp:url('${csPart(kind+"_pressed")}');--bg:url('${csPart(kind+"_grey")}')" ${dis?"disabled":`onclick="${on}"`}>${label}</button>`}
function csIcon(n){const u=csPart(n);return u?`<img class="px csico" src="${u}" alt="">`:""}
function csNewSeen(c){const p=PRF();p.csSeen=p.csSeen||{};return !!p.csSeen[c]}
/* 顔（52×52）：部品の顔があればそれ、なければ立ち絵 normal の顔あたり、なければ戦闘の待機の頭 */
function csFace(c,lock){const f=csPart("face_"+c.toLowerCase());/* ロック中は顔の部品（四角い背景つき）を使わず、待機の絵のシルエット＝だれか分からない形 */if(f&&!lock)return`<img class="px csface${lock?" sil":""}" src="${f}" alt="">`;
  const b=`assets/c2/story/c2/revremit_story_bust_${c.toLowerCase()}_normal.png`;if(!lock&&typeof artHave==="function"&&artHave(b))return`<span class="csface bust${lock?" sil":""}" style="background-image:url('${artURL(b)}')"></span>`;
  return`<canvas class="chav csface" data-ch="${c}" data-z="2.4" data-top="1" ${lock?'data-sil="1"':""} width="52" height="52"></canvas>`}
/* ---- ① えらぶ ---- */
function showCharSel(){try{termPrep()}catch(e){}S.flow=S.flow||{mode:null};S.flowReady=false;setScreen("chars");setScene("dim");setBg("garage");closeModal();SND.bgm("select");
  if(!S.csSel||!CS_ALL.includes(S.csSel))S.csSel=curChar();{const p=PRF();p.csSeen=p.csSeen||{};p.csSeen[S.csSel]=1}ensureSpr(CS_ALL.filter(c=>ART_SRC[c])).then(()=>{if(window.SCREEN==="chars")renderCharSel()}).catch(()=>{});renderCharSel()}
function renderCharSel(){const c=S.csSel,open=csOpen(c),I=CS_INFO[c]||{},C=CHARS[c],p=PRF();
  let h=`<div class="cshead" ${at(0,0,640,24)}></div><button class="csback" ${at(4,1,72,22)} onclick="csBack()">◀ ${esc(CST("cs_back","もどる"))}</button>
   <div class="hdr" ${at(78,4,300,18)}>${esc(CST("cs_head","キャラをえらぶ"))}</div><div class="small dim" ${at(470,6,164,14)} style="text-align:right">ミニカー ${loadMinicars().length}/60</div>
   <div class="csstage" ${at(20,30,200,260)}><canvas class="chav csbig" data-ch="${c}" ${open?"":'data-sil="1"'} width="200" height="236"></canvas>
    <div class="small cscar">${open&&C?`${esc(C.carName)} → ${esc(C.weapon||"")}`:""}</div></div>
   <div class="${csPart("board")?"csboard":"sign"} csdesc" style="left:236px;top:30px;width:384px;height:260px;${csPart("board")?`--bd:url('${csPart("board")}')`:""}">`;
  if(open){const dc=csDeckCount(c),modes=csModes(c);
    h+=`<div class="csname">${esc(c)}</div>${csTag(c)}<div class="csline">${csLine(c).map(esc).join("<br>")}</div>
     <div class="csdeck"><span class="csd a">${csIcon("deck_atk")}アタック <b>${dc.atk}</b></span><span class="csd g">${csIcon("deck_grd")}ガード <b>${dc.grd}</b></span><span class="csd d">${csIcon("deck_drw")}引く <b>${dc.drw}</b></span></div>
     <div class="small dim csdline">${esc(CST("cs_deck_"+c,""))}</div>
     <div class="csrow"><span class="dim small">走りかた</span>${modes.map(m=>`<span class="csmode">${m==="BIKE"?"自転車":m}</span>`).join("")}</div>
     <div class="csrow csnights"><span class="dim small">夜</span>${NIGHTS.map((x,i)=>`<i class="csn${clearedNight(c,"MT",i+1)||clearedNight(c,"AT",i+1)?" on":""}">${i+1}</i>`).join("")}</div>`}
  else h+=`<div class="csname">？？？</div>${csTag(c)}<div class="csline">${csLine(c).map(esc).join("<br>")}</div>
     <div class="small gold csjoin">${esc(CST("cs_join","NIGHT {n} をクリアすると加わる").replace("{n}",(CHARS[c]&&CHARS[c].join)||I.join||"?"))}</div>`;
  h+=csBtn(open?"btn140":"btn140",open?"csgo":"csgo off",esc(open?CST("cs_go","この子で走る"):CST("cs_locked","まだ走れない")),"csPick()",!open)+`</div><div class="csfaces" ${at(0,292,640,68)}>`;
  CS_ALL.forEach((k,i)=>{const op=csOpen(k),sel=k===c,x=20+i*60,isNew=op&&k!=="YUKI"&&!csNewSeen(k);
    h+=`<button class="csfb${sel?" sel":""}${op?"":" lock"}${csPart("faceframe_normal")?" fr":""}" ${at(x-2,sel?0:4,56,56)} onclick="csSelect('${k}')">${csFace(k,!op)}${csPart("faceframe_normal")?`<img class="px csframe" src="${csPart("faceframe_"+(sel?"select":op?"normal":"locked"))}" alt="">`:op?"":`<span class="cslock">🔒</span>`}${isNew?`<span class="csnew">NEW</span>`:""}</button>`});
  h+=`</div>`;ui().innerHTML=h;chavStart()}
function csSelect(k){if(S.csSel===k){if(csOpen(k))csPick();return}S.csSel=k;SND.se(csOpen(k)?"ui_ok":"card_cant");if(csOpen(k)&&k!=="YUKI"){const p=PRF();p.csSeen=p.csSeen||{};if(!p.csSeen[k]){p.csSeen[k]=1;SAVE.auto()}}renderCharSel()}
function csBack(){SND.se("ui_cancel");S.flow=null;S.flowReady=false;showTitle()}
function csPick(){const c=S.csSel;if(!csOpen(c))return;SND.se("ui_ok");const p=PRF();p.char=c;SAVE.auto();S.deck=null;S.flowBring=[];S.mcSel=[];showReady()}
/* ---- ② 準備 ---- */
function showReady(){S.flowReady=true;setScreen("runok");setScene("dim");setBg("garage");closeModal();S.flow=S.flow||{mode:null};const ch=curChar(),ms=csModes(ch);
  if(!S.flow.mode||!ms.includes(S.flow.mode))S.flow.mode=ms.includes(PRF().lastMode)?PRF().lastMode:ms[0];S.flowBring=S.flowBring||[];renderReady()}
function renderReady(){const ch=curChar(),mode=S.flow.mode,ms=csModes(ch),n=curNight(),mx=nightMaxAvail(),U=TEXT.ui,lab=n===NIGHTS.length?U.night_last:U.night_label.replace("{n}",n),bring=S.flowBring||[];
  let h=`<div class="cshead" ${at(0,0,640,24)}></div><button class="csback" ${at(4,1,72,22)} onclick="readyBack()">◀ ${esc(CST("cs_back","もどる"))}</button>
   <div class="hdr" ${at(78,4,300,18)}>${esc(CST("cs_ready","準備"))}</div>
   <div class="sign" ${at(12,30,150,230)}><canvas class="chav" data-ch="${ch}" width="120" height="160" style="display:block;margin:0 auto"></canvas><div class="csname sm">${esc(ch)}</div>${csTag(ch)}</div>
   <div class="sign rdy" ${at(172,30,456,230)}>
    <div class="rdr"><span class="rl">${esc(CST("cs_mode","走りかた"))}</span>${ms.map(m=>csBtn(m===mode?"btn120":"btn120sub","rdm",m==="BIKE"?"自転車":m,`readyMode('${m}')`)).join("")}</div>
    <div class="small dim rdt">${esc(CST("cs_mode_"+mode,CS_MODE_TXT[mode]||""))}</div>
    <div class="rdr"><span class="rl">${esc(CST("cs_night","夜"))}</span>${csArrow("l",n<=1,"readyNight(-1)")}<b class="rdn">${esc(lab)}</b>${csArrow("r",n>=mx,"readyNight(1)")}${starHTML(clearedNight(ch,mode==="AT"?"AT":"MT",n),"")}<span class="small dim">${nightRules(n).noBlow||n<3?"ブローなし":"ブローあり"}</span></div>
    ${TREE[ch]?`<div class="rdr"><span class="rl">${esc(CST("cs_tree","型"))}</span>${[0,1,2].map(i=>`<button class="u9 rdtr${(treeData(ch).cur||0)===i?" main":""}" onclick="readyTree(${i})">${esc(treeName(ch,i))}</button>`).join("")}</div>`:""}
    <div class="rdr"><span class="rl">${esc(CST("cs_mc","ミニカー"))}</span>${[0,1].map(i=>{const m=bring[i];return`<button class="rdmc${m?" on":""}${csPart("minicar_empty")?" img":""}" style="${csPart("minicar_empty")?`--mi:url('${csPart(m?"minicar_filled":"minicar_empty")}')`:""}" onclick="readyMc()">${m?`${typeof mcIcon==="function"?mcIcon(m,24,"mci"):""}<span class="small">${esc(m.char)}・${esc(m.rank)}</span>`:`<span class="small dim">＋</span>`}</button>`}).join("")}</div>
    ${readyTicket()}</div>
   ${csBtn("btn160","rdgo",esc(CST("cs_run","走る")),"readyGo()",false,at(468,300,160,44))}`;
  ui().innerHTML=h;chavStart()}
function csArrow(d,dis,on){const n=csPart("arrow_"+d+"_normal");if(!n)return`<button class="u9 rda" ${dis?"disabled":`onclick="${on}"`}>${d==="l"?"◀":"▶"}</button>`;
  return`<button class="csimg rda" style="--bn:url('${n}');--bp:url('${csPart("arrow_"+d+"_pressed")}');--bg:url('${csPart("arrow_"+d+"_grey")}')" ${dis?"disabled":`onclick="${on}"`}></button>`}
function readyMode(m){if(S.flow.mode===m)return;SND.se("ui_ok");S.flow.mode=m;try{PRF().lastMode=m;SAVE.auto()}catch(e){}renderReady()}
function readyNight(d){const n=Math.max(1,Math.min(nightMaxAvail(),curNight()+d));if(n===curNight())return;SND.se("night_select",{lv:n});PRF().night=n;SAVE.auto();renderReady()}
function readyTree(i){const t=treeData(curChar());if((t.cur||0)===i){SND.se("ui_ok");S.treeHub=false;S.treeFromReady=true;showTree();return}t.cur=i;SND.se("ui_ok");SAVE.auto();renderReady()}
function readyMc(){SND.se("ui_ok");S.mcSel=(S.flowBring||[]).map(m=>m.id);showMinicarGarage(S.flow.mode)}
function readyTicket(){if(typeof farmData!=="function")return"";const t=farmData().tickets||[];if(!t.length)return"";const nm=k=>(typeof FARM_TICKET_JP!=="undefined"&&FARM_TICKET_JP[k])||k,u=[...new Set(t)],cur=S.flowTicket;
  return`<div class="rdr"><span class="rl">${esc(CST("cs_ticket","チケット"))}</span><button class="u9 rdtk${cur?" main":""}" onclick="readyTk()">${esc(cur?nm(cur):"使わない")}</button><span class="small dim">${esc(cur?(TICKET_TXT[cur]||""):"")}</span></div>`}
function readyTk(){const t=[...new Set((farmData().tickets||[]))],L=[null].concat(t),i=L.indexOf(S.flowTicket||null);S.flowTicket=L[(i+1)%L.length];SND.se("ui_ok");renderReady()}
function readyBack(){SND.se("ui_cancel");S.flowReady=false;showCharSel()}
function readyGo(){S.flowReady=false;runGo()}
