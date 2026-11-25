# ★v0.22 β2：仲間3人・キャラ選び・夜（β は NIGHT 4 まで）・加わる話・night3_first・通信の印・BUG-27・BUG-28 案①
# 使い方：python qa/beta2.py <v0.22 の html> [v0.21 の html]
import sys,json,pathlib
from playwright.sync_api import sync_playwright
H=[pathlib.Path(x).resolve().as_uri() for x in sys.argv[1:3]];new=H[0];old=H[1] if len(H)>1 else None
R={};errs=[];W="window.SCREEN==='data'||window.SCREEN==='title'"
with sync_playwright() as p:
  b=p.chromium.launch();ctx=b.new_context(viewport={"width":1280,"height":720});pg=ctx.new_page();pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto(new);pg.wait_for_function(W,timeout=90000);pg.evaluate("()=>{localStorage.clear();SAVE.boot()}")
  # 1) BUG-27：こわれたスロットの保管は1回だけ
  R["bug27"]=pg.evaluate("""()=>{localStorage.setItem('revremit_save_3','{broken'+'x'.repeat(1000));for(let i=0;i<6;i++){SAVE.list();showData()}
    return Object.keys(localStorage).filter(k=>k.startsWith('revremit_save_broken_3_')).length}""")
  # 2) BUG-28 案①：オートセーブはスロットごと。スロット1で遊ぶ → スロット2に切りかえても、スロット1のオートは残る
  R["bug28"]=pg.evaluate("""()=>{localStorage.clear();SAVE.boot();SAVE.use(1);PRF().log=999;SAVE.auto();SAVE.use(2);PRF().log=111;SAVE.auto();
    const a1=JSON.parse(localStorage.getItem('revremit_save_auto_1')),a2=JSON.parse(localStorage.getItem('revremit_save_auto_2'));
    localStorage.setItem('revremit_save_1','{bad');const L=SAVE.list();const row1=L.find(x=>x.k===1);showData();const btn=!!document.querySelector('[onclick="dataRestore(1)"]');
    const k=SAVE.restore(1);return{auto1:a1.profile.log,auto2:a2.profile.log,last:localStorage.getItem('revremit_save_last'),row1broken:row1.broken,restoreBtn:btn,restored:k,log:PRF().log,slot:SAVE.slot}}""")
  # 3) 夜を選ぶ：β は NIGHT 4 まで・ブローあり（3・4）・まだ開いていない夜
  R["night"]=pg.evaluate("""()=>{localStorage.clear();SAVE.boot();qaSetProgress({slot:1,nightMax:2});/* ★v0.22.143 E13：夜の小窓は消した → 準備の画面で選べる夜の数 */const rows=[nightMaxAvail()];
    qaSetProgress({nightMax:11});return{rows,avail:nightMaxAvail()}}""")
  # 4) キャラ選び：最初は YUKI だけ（ボタンなし）→ HINA が加わるとボタン。ロックの子は NIGHT の条件
  R["chars"]=pg.evaluate("""()=>{localStorage.clear();SAVE.boot();qaSetProgress({slot:1,nightMax:1});const open0=charsOpen().slice();/* ★v0.22.143 前のキャラ画面（タイトルのキャラのボタン）は v0.22.108 で今のキャラ選択に */
    qaSetProgress({chars:['HINA']});const open1=charsOpen().slice();S.farmChoiceMode=null;farmChoiceSelf();csSelect('HINA');document.querySelector('.csgo').click();
    return{open0,open1,cur:curChar(),screen:window.SCREEN}}""")
  # 5) HINA で走る：hina_op（1回目）→ マップ。2回目は run_start_hina。デッキ・決まり
  R["hina_run"]=pg.evaluate("""()=>{const seen=[];const ss=window.showScene;window.showScene=(k,d)=>{seen.push(k);seenSet(k);d&&d()};
    try{newRun('MT')}finally{window.showScene=ss}const a={char:G.char,hp:G.maxhp,gears:G.car.gears,seen:seen.slice(),deck:G.deck.length,deckOwn:[...new Set(G.deck.map(c=>CARDS[c.id].own))]};
    seen.length=0;window.showScene=(k,d)=>{seen.push(k);seenSet(k);d&&d()};try{newRun('MT')}finally{window.showScene=ss}a.seen2=seen.slice();
    startBattleState('van');a.gas1=B.gas;a.screen=SCREEN;return a}""")
  # 6) 加わる話：YUKI で NIGHT 1 を初クリア → join_hina（HINA が開く）。NIGHT 4 のクリア → 「次の仲間は……？」
  R["join"]=pg.evaluate("""()=>{localStorage.clear();SAVE.boot();qaSetProgress({slot:1,nightMax:0,night:1});PRF().char='YUKI';
    const seen=[];const ss=window.showScene;window.showScene=(k,d)=>{seen.push(k);seenSet(k);d&&d()};
    try{newRun('MT');G.st.bosses=3;runEnd(true,'B');afterCar({rank:'B'});
      const a={seen:seen.slice(),chars:PRF().unlock.chars.slice(),areas:PRF().unlock.areas.slice(),modal:(document.querySelector('#modal')||{}).textContent||''};
      seen.length=0;qaSetProgress({nightMax:3,night:4});newRun('MT');G.st.bosses=3;runEnd(true,'B');afterCar({rank:'B'});a.seen4=seen.slice();a.nightMax=PRF().unlock.nightMax;a.avail=nightMaxAvail();
      a.chars4=PRF().unlock.chars.slice();return a}finally{window.showScene=ss}}""")
  # 7) NIGHT 3 に初めて入る：night3_first（4行目は走るキャラ）。2回目は出ない。NIGHT 1 は出ない
  R["night3"]=pg.evaluate("""()=>{localStorage.clear();SAVE.boot();qaSetProgress({slot:1,nightMax:2,night:1,chars:['HINA']});PRF().char='HINA';
    const seen=[];let last=null;const ss=window.showScene;window.showScene=(k,d)=>{seen.push(k);if(k==='night3_first')last=TEXT.scenes.night3_first.lines[3];seenSet(k);d&&d()};
    try{newRun('MT');const n1=seen.includes('night3_first');seen.length=0;PRF().night=3;newRun('MT');const n3=seen.slice();seen.length=0;newRun('MT');
      return{n1,n3,last,again:seen.includes('night3_first'),blowPreview:(()=>{startBattleState('van');B.gear=G.car.gears-1;B.rpm=8000;const c=B.hand.find(c=>CD(c).c>0);return preview(c).txt})()}}finally{window.showScene=ss}}""")
  # 8) 通信の印：op_road の MIO は印あり・prologue の MIO は印なし
  R["comm"]=pg.evaluate("""()=>{const out={};if(G)G.char='YUKI';for(const[k,i]of[['op_road',4],['prologue',7],['first_remit',3]]){showScene(k,()=>{});S.sc.i=i;sceneLine();
    out[k]={who:TEXT.scenes[k].lines[i][0],mark:!!document.querySelector('.scband .commk'),comm:document.querySelector('.scband').classList.contains('comm')};sceneEnd()}
    out.se=AUDIO&&AUDIO.SE_IDS.includes('comm_open')&&AUDIO.SE_IDS.includes('comm_blip');return out}""")
  # 9) 仲間のカード：全部 OPS があり、予告→打つで止まらない（各キャラで 3戦ずつボット）
  R["ally_battles"]=pg.evaluate("""()=>{const out={};for(const ch of ['HINA','MOMO','NANA']){let ok=0,err=null;for(let n=0;n<3;n++){try{newRunState('MT',ch,[],null,{night:1});
      G.deck=Object.keys(CARDS).filter(id=>CARDS[id].own===ch).map(id=>inst(id));startBattleState('boss1');let r='ok',s=0;
      while(r!=='win'&&r!=='dead'&&s++<400){const i=B.hand.findIndex(c=>preview(c).ok);r=i>=0?playCard(i,preview(B.hand[i]).canShift):endTurn()}ok++}catch(e){err=String(e)}}out[ch]={ok,err}}return out}""")
  # 10) 裏道に入る：hidden_in の3行目は走るキャラ・1回だけ
  R["hidden_in"]=pg.evaluate("""()=>{localStorage.clear();SAVE.boot();qaSetProgress({slot:1,nightMax:1,night:1,chars:['HINA']});PRF().char='HINA';
    const ss=window.showScene;const seen=[];window.showScene=(k,d)=>{seen.push(k);if(k==='hidden_in')seen.push(TEXT.scenes.hidden_in.lines[2][1]);seenSet(k);d&&d()};
    try{newRun('MT');G.map[G.row][0]={k:'hidden',a:0,r:G.row};enterNode(0);const a=seen.slice();showMap();seen.length=0;G.map[G.row][0]={k:'hidden',a:0,r:G.row};enterNode(0);return{first:a,again:seen.slice(),screen:SCREEN}}finally{window.showScene=ss}}""")
  if old:
    # 11) v0.21 のデータ（オートが1つ）→ v0.22：そのスロットのオートへ写す
    pg2=ctx.new_page();pg2.on("pageerror",lambda e:errs.append("old:"+str(e)));pg2.goto(old);pg2.wait_for_function(W,timeout=90000)
    pg2.evaluate("()=>{localStorage.clear();SAVE.boot();SAVE.use(2);PRF().log=222;SAVE.auto()}");pg2.close()
    pg.goto(new);pg.wait_for_function(W,timeout=90000)
    R["from_v21"]=pg.evaluate("()=>({slot:SAVE.slot,log:PRF().log,auto2:!!localStorage.getItem('revremit_save_auto_2'),last:localStorage.getItem('revremit_save_last')})")
  b.close()
R["errors"]=errs
print(json.dumps(R,ensure_ascii=False,indent=1))
