# ★v0.21 セーブ v2（1スロット＝1人の進み具合）・夜・解放・ログ・テスト用の口
# 使い方：python qa/save_beta.py <v0.21 の html> <v0.19.1 の html> <v0.20 の html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
H=[pathlib.Path(x).resolve().as_uri() for x in sys.argv[1:4]];new,v19,v20=H;R={};errs=[]
W="window.SCREEN==='data'||window.SCREEN==='title'"
MK="(id,cl,rank)=>({v:2,id,char:'YUKI',rank:rank||'B',mode:'MT',clear:cl,score:100,cards:[{id:'hyouga',up:false},{id:'hakusen',up:true}],part:null,tune:{},at:Date.now()})"
with sync_playwright() as p:
  b=p.chromium.launch();ctx=b.new_context(viewport={"width":1280,"height":720});pg=ctx.new_page();pg.on("pageerror",lambda e:errs.append(str(e)))
  # 1) v0.19.1 のデータ → v0.21：スロット1・クリアしたミニカーから解放
  pg.goto(v19);pg.wait_for_function("window.SCREEN==='title'",timeout=60000)
  pg.evaluate(f"()=>{{localStorage.clear();localStorage.setItem('revremit_tutorial_done','1');window.showScene=(k,d)=>{{seenSet(k);d&&d()}};newRun('MT');const mk={MK};saveMinicars([mk('a',true,'S'),mk('b',false)])}}")
  pg.goto(new);pg.wait_for_function(W,timeout=60000)
  R["from_v19"]=pg.evaluate("()=>({screen:SCREEN,slot:SAVE.slot,migrated:SAVE.migrated,mc:loadMinicars().length,tut:tutDone(),run:!!loadRun(),areas:PRF().unlock.areas,nightMax:PRF().unlock.nightMax,sCount:PRF().unlock.sCount,cards:unlockedCards(PRF()).length,v:JSON.parse(localStorage.getItem('revremit_save_1')).v})")
  # 2) v0.20 のデータ（スロット2にセーブ → そのあとオートだけ進んだ）→ v0.21：スロット2 がオートの中身になる
  pg.evaluate('()=>localStorage.clear()');pg.goto(v20);pg.wait_for_function(W,timeout=60000)
  pg.evaluate(f"()=>{{localStorage.clear();const mk={MK};SAVE.cur.profile.tutorial=true;saveMinicars([mk('a',true)]);SAVE.saveTo(2);const a=loadMinicars();a.push(mk('b',false));a.push(mk('c',false));saveMinicars(a)}}")
  pg.goto(new);pg.wait_for_function(W,timeout=60000)
  R["from_v20"]=pg.evaluate("()=>({slot:SAVE.slot,mc:loadMinicars().length,slot2:JSON.parse(localStorage.getItem('revremit_save_2')).profile.minicars.length,v:JSON.parse(localStorage.getItem('revremit_save_2')).v,migrated:SAVE.migrated})")
  # 3) スロット：空のスロット3ではじめる → 自動でスロット3に書く → スロット2 に切りかえ → 3 にもどしても残る
  R["slots"]=pg.evaluate(f"""()=>{{const mk={MK};SAVE.use(3);const t=tutDone();saveMinicars([mk('z',false)]);const s3=JSON.parse(localStorage.getItem('revremit_save_3')).profile.minicars.length;
    SAVE.use(2);const m2=loadMinicars().length;SAVE.use(3);return{{tutKept:t,s3,m2,m3:loadMinicars().length,auto:JSON.parse(localStorage.getItem('revremit_save_auto')).slot}}}}""")
  # 4) こわれた・新しい版・消す・オートからもどす
  R["robust"]=pg.evaluate("""()=>{localStorage.setItem('revremit_save_1','{bad');const L=SAVE.list(),br=L.find(x=>x.k===1).broken,bk=Object.keys(localStorage).some(k=>k.startsWith('revremit_save_broken_1_'));
    localStorage.setItem('revremit_save_1',JSON.stringify({fmt:'revremit-save',v:99,profile:{unlock:{cards:['future'],nightMax:7,newList:['x']},future:1},top:2}));SAVE.use(1);
    const c=SAVE.cur,keep=c.profile.future===1&&c.top===2&&c.profile.unlock.newList[0]==='x';SAVE.unlock('cards','drift');const s1=JSON.parse(localStorage.getItem('revremit_save_1'));
    SAVE.use(3);const before=loadMinicars().length;localStorage.setItem('revremit_save_3','{bad');const k=SAVE.restore();
    SAVE.erase(2);return{broken:br,backup:bk,newer:c.newer,keep,nightMax:s1.profile.unlock.nightMax,cards:s1.profile.unlock.cards,v:s1.v,restored:k,restoredMc:loadMinicars().length===before,erased:localStorage.getItem('revremit_save_2')===null}}""")
  # 5) テスト用の口・夜・解放
  R["hooks"]=pg.evaluate("""()=>{localStorage.clear();SAVE.boot();const a=qaSetProgress({slot:1,cards:'start',parts:'start',nightMax:0});const r1=qaNewRun({mode:'MT'});
    const b1=noBlow(),n1=G.night;const c=qaSetProgress({cards:'all',parts:'all',nightMax:3,night:4});const r4=qaNewRun({mode:'MT'});
    startBattleState('van');const hp4=B.e.maxhp;qaSetProgress({night:1});qaNewRun({mode:'MT'});startBattleState('van');const hp1=B.e.maxhp;
    qaSetProgress({night:3});qaNewRun({mode:'MT'});const b3=noBlow();
    qaSetProgress({night:10,nightMax:10});qaNewRun({mode:'MT'});const jam=G.deck.filter(c=>c.id==='mud').length;
    qaSetProgress({night:11});qaNewRun({mode:'MT'});const hp11=G.maxhp;
    return{start:a,run1:r1,noBlowN1:b1,night1:n1,all:c,run4:r4,hpRatio:Math.round(hp4/hp1*100)/100,noBlowN3:b3,jamN10:jam,maxhpN11:hp11}}""")
  # 6) ランの終わり：エリア・夜・ログ・S ランク
  R["runEnd"]=pg.evaluate("""()=>{localStorage.clear();SAVE.boot();qaSetProgress({cards:'start',parts:'start',nightMax:0});qaNewRun({mode:'MT'});
    G.st.bosses=3;G.st.elites=2;const log0=PRF().log;showResult(true);const u=PRF().unlock,got=S.runGot.slice();
    const m={rank:'S'};afterCar(m);const after=PRF().unlock.sCount,lines=document.querySelectorAll('#modal .scroll .small').length;
    return{areas:u.areas,nightMax:u.nightMax,log:PRF().log-log0,cards:unlockedCards(PRF()).length,parts:unlockedParts(PRF()).length,got:got.length,lines,sCount:after,chars:u.chars}}""")
  pg.screenshot(path=str(pathlib.Path(__file__).parent/"shots"/"v21_runend.png"));pg.evaluate("()=>closeModal()")
  # 7) 強化ショップ
  R["lab"]=pg.evaluate("""()=>{PRF().log=120;showLab();const b0=[...document.querySelectorAll('#ui button')].some(x=>x.textContent.includes('ログ 100 で開く'));labBuy('drift');
    return{opened:SCREEN==='lab',btn:b0,log:PRF().log,has:unlockedCards(PRF()).includes('drift'),saved:JSON.parse(localStorage.getItem('revremit_save_'+SAVE.slot)).profile.unlock.cards.includes('drift')}}""")
  pg.screenshot(path=str(pathlib.Path(__file__).parent/"shots"/"v21_lab.png"))
  pg.evaluate("()=>showData()");pg.screenshot(path=str(pathlib.Path(__file__).parent/"shots"/"v21_data.png"))
  # ★v0.22.143 E13：夜の小窓（pickNight）は消した＝この撮りはなし
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False,indent=1))
