# ブラウザで画面をとおすボット（v0.9）。Python＋Playwright。
# 使い方：python qa/revremit_qa_bot.py <HTML のパス> smart|random|garage|mouse|layout [回数=20] [画面 480|640]
#   smart / random：MT と AT を回数ずつ。画面の関数を押して（カードは「選ぶ→打つ」）、クリア率・ページのエラー・止まりを数える。
#   garage：60台＋壊れたデータ → 2台持ち込み → リザルト → 入れ替え。デッキを組む画面（上限）。
#   mouse：本物のマウス（page.mouse.click で座標を押す）でタイトル → デッキ → ガレージ → マップ → 戦闘（カードの説明 → 打つ → ターン終了）→ 勝ち → 報酬 … を、各サイズで（BUG-19）。
#   layout：844×390・932×430・1280×720・1920×1080 で、各画面のスクショと「480×270 の中に収まるか・文字がはみ出さないか」。
import sys, json, pathlib
class Stop(Exception): pass
from playwright.sync_api import sync_playwright

page_path = pathlib.Path(sys.argv[1]).resolve()
kind = sys.argv[2] if len(sys.argv) > 2 else "smart"
n = int(sys.argv[3]) if len(sys.argv) > 3 else 20
RESK = sys.argv[4] if len(sys.argv) > 4 else "640"
policy = (pathlib.Path(__file__).parent / "policy.js").read_text(encoding="utf-8")
shots = pathlib.Path(__file__).parent / "shots"; shots.mkdir(exist_ok=True)
SIZES = [(844, 390, 3), (932, 430, 3), (1280, 720, 1), (1920, 1080, 1)]

# ★v0.20.1 touch：mouse と同じ道を、タッチ画面の PC の大きさで本物のタップ（touchscreen.tap）で押す
TOUCH = kind == "touch"
PC_SIZES = [(1920, 1080, 1), (1366, 768, 1), (2560, 1440, 1), (1536, 864, 1.25)]
def open_page(b, w=1280, h=720, dpr=1):
    pg = b.new_context(viewport={"width": w, "height": h}, device_scale_factor=dpr, has_touch=TOUCH).new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append("console:" + m.text) if m.type == "error" else None)
    pg.route("**/fonts.g*/**", lambda r: r.abort())
    pg.goto(page_path.as_uri() + "#res" + RESK)
    pg.wait_for_function("window.SCREEN==='title'", timeout=15000)
    pg.add_script_tag(content=policy)
    return pg, errs

RUN = """([kind,mode,bring])=>{showMinicarGarage(mode);let st=0,last="",cards=0;
  while(st<60000){const r=botUiStep(kind,{bring});st++;if(r==="done")break;if(r!=="ok"){last=r;break}}
  return{steps:st,last,clear:!!(G&&G.st.clear),row:G?G.row:-1}}"""
# 画面の中の要素が原寸（RES）に収まっているか、ボタン・文字がはみ出していないか
CHECK = """()=>{const st=document.querySelector('#stage').getBoundingClientRect(),s=window.FIT.s,bad=[];
  document.querySelectorAll('#ui *').forEach(el=>{if(el.closest('.scroll')&&!el.classList.contains('scroll'))return;const r=el.getBoundingClientRect();if(!r.width||!r.height)return;
    const x=(r.left-st.left)/s,y=(r.top-st.top)/s,x2=(r.right-st.left)/s,y2=(r.bottom-st.top)/s;
    if(x<-0.5||y<-0.5||x2>RES.W+0.5||y2>RES.H+0.5)bad.push('外:'+(el.className||el.tagName)+' '+el.textContent.slice(0,10));
    if(el.tagName==='BUTTON'&&(el.scrollWidth>el.clientWidth+1||el.scrollHeight>el.clientHeight+1))bad.push('はみ出し:'+el.textContent.slice(0,12))});
  const vw=innerWidth,vh=innerHeight;if(st.right>vw+1||st.bottom>vh+1||st.left<-1||st.top<-1)bad.push('画面の外');
  return{screen:window.SCREEN,fit:window.FIT,bad:[...new Set(bad)].slice(0,8)}}"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    if kind in ("smart", "random"):
        out = {}
        for mode in ("MT", "AT"):
            pg, errs = open_page(b)
            clear = 0; stuck = []
            for i in range(n):
                r = pg.evaluate(RUN, [kind, mode, False])
                if r["clear"]: clear += 1
                if r["last"] or r["steps"] >= 60000: stuck.append(r)
            out[mode] = {"clear": clear, "n": n, "rate": round(clear / n * 100, 1), "pageErrors": errs[:5], "stuck": stuck[:3]}
            pg.close()
        print(json.dumps({"kind": kind, **out}, ensure_ascii=False))
    elif kind == "bug21":
        # BUG-21：読めない絵（チュートリアルの矢印・通信アイコン、背景の部品）があっても止まらない
        pg, errs = open_page(b)
        r = pg.evaluate("""async()=>{const ks=Object.keys(ART_EMBED||{}).filter(k=>/tut_arrow_down|tut_comm/.test(k));ks.forEach(k=>{ART_EMBED[k]='data:image/png;base64,AAAA'});
          for(const k in TUTP)delete TUTP[k];await buildTutParts(new Set(Object.keys(ART_EMBED)));
          localStorage.clear();S.deck=null;newRun('MT');for(let i=0;i<6;i++)tutTap();await new Promise(r=>setTimeout(r,400));
          const ok1=TUTS.ph==='wait'&&!!document.querySelector('#tut .tband');
          closeModal();tutFinish();sceneSkip();sceneSkip();sceneSkip();sceneSkip();const ok2=SCREEN==='map';
          return {broken:ks.length,arrowDirs:Object.keys(TUTP.arrow||{}).filter(k=>TUTP.arrow[k]&&TUTP.arrow[k].urls),comm:!!TUTP.comm,tutWait:ok1,map:ok2}}""")
        r["pageErrors"] = errs[:5]; r["ok"] = r["tutWait"] and r["map"] and not errs
        print(json.dumps(r, ensure_ascii=False))
    elif kind == "garage":
        res = {}
        pg, errs = open_page(b)
        res["seed"] = pg.evaluate("""()=>{const a=[];for(let i=0;i<60;i++)a.push({v:2,id:"seed"+i,char:"YUKI",rank:RANKS[i%8],mode:i%2?"AT":"MT",clear:i%3===0,score:i,
           cards:[{id:"hakusen",up:i%2===0},{id:"rikka",up:false}],part:i%4===0?"turbo":null,tune:{},at:1000+i});
          a.push(null,{v:1,name:"old"},{v:2,id:"bad",rank:"ZZZ",cards:[{id:"nope"},{id:"oil"}],part:"nope"},"str");
          localStorage.setItem(LS_KEY,JSON.stringify(a));return{loaded:loadMinicars().length}}""")
        res["bring"] = pg.evaluate("""()=>{showMinicarGarage('MT');toggleBring(0);toggleBring(1);toggleBring(2);const sel=S.mcSel.length;startWithMinicars();
           return{sel,bring:G.bring.length,deck:G.deck.length,maxhp:G.maxhp,parts:G.parts.slice()}}""")
        res["run"] = pg.evaluate("""()=>{let st=0;while(st<60000&&window.SCREEN!=="result"&&window.SCREEN!=="title"){botUiStep("smart",{});st++}
           const sc=window.SCREEN;if(sc!=="result")return{sc};
           const b=document.querySelector("#mkcar");const dis0=b.disabled;saveCar();const still=window.SCREEN;
           togglePick(0);const dis1=b.disabled;togglePick(1);const dis2=b.disabled;saveCar();
           return{sc,disabledAt0:dis0,stayedOnResult:still==="result",disabledAt1:dis1,disabledAt2:dis2,after:window.SCREEN,count:loadMinicars().length}}""")
        pg.screenshot(path=str(shots / "release_1280.png"))
        res["release"] = pg.evaluate("""()=>{S.relSel="new";releaseMinicar();const c1=loadMinicars().length;
           newRunState("MT","YUKI",[]);showResult(false);togglePick(0);togglePick(1);saveCar();S.relSel=0;releaseMinicar();
           return{afterKeepOld:c1,afterSwap:loadMinicars().length}}""")
        res["deck"] = pg.evaluate("""()=>{localStorage.removeItem(DECK_KEY);showDeck();S.deck=defaultDeck('YUKI');renderDeck();
           const plusHy=[...document.querySelectorAll('.dr')].find(r=>r.textContent.includes('氷牙')).querySelectorAll('button')[1].disabled;// 4/4 で20枚 → 押せない
           deckAdd('hyouga',-1);deckAdd('hyouga',-1);deckAdd('rinkai',1);deckAdd('rinkai',1);const rk=S.deck.rinkai;deckAdd('rikka',1);
           const ok=!document.querySelector('#ui .col .main').disabled;document.querySelector('#ui .col .main').click();
           const saved=loadDeck('YUKI');newRun('MT');return{plusAtFull:plusHy,rinkai:rk,canSave:ok,savedRinkai:saved.rinkai,runHas:G.deck.filter(c=>c.id==='rinkai').length,size:G.deck.length}}""")
        res["pageErrors"] = errs
        pg.close()
        print(json.dumps(res, ensure_ascii=False))
    elif kind in ("mouse", "touch"):
        # その点で一番上にある要素が、押したい要素（かその中）のときだけ押す。ふさがれていたら「ふさがれ」として記録
        HIT = """(sel)=>{const els=[...document.querySelectorAll(sel)].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&!e.disabled});
          if(!els.length)return{none:true};const el=els[0],r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,top=document.elementFromPoint(x,y);
          return{x,y,ok:!!top&&(top===el||el.contains(top)),top:top?(top.id||top.className||top.tagName):null}}"""
        res = {}
        for w, h, d in (PC_SIZES if TOUCH else SIZES):
            pg, errs = open_page(b, w, h, d); log = []; bad = []
            def click(sel, label, after=None):
                r = pg.evaluate(HIT, sel)
                if r.get("none"): bad.append(f"{label}：ない（{sel}）"); raise Stop()
                if not r["ok"]: bad.append(f"{label}：ふさがれ（上に {r['top']}）"); raise Stop()
                before = pg.evaluate("()=>window.SCREEN+'|'+(window.B&&B.hand?B.hand.length:'')+'|'+(window.S&&S.sel)")
                (pg.touchscreen.tap if TOUCH else pg.mouse.click)(r["x"], r["y"]); pg.wait_for_timeout(60)
                aft = pg.evaluate("()=>window.SCREEN+'|'+(window.B&&B.hand?B.hand.length:'')+'|'+(window.S&&S.sel)")
                if after and not pg.evaluate(after): bad.append(f"{label}：押しても変わらない（{before}→{aft}）")
                log.append(label); return True
            try:
              pg.evaluate("()=>{localStorage.clear();showTitle()}")
              click("#ui .col button:nth-child(3)", "タイトル→デッキを組む", "()=>SCREEN==='deck'")
              click("#ui .dr button.mini:not([disabled])", "デッキ：−を押す", "()=>deckCount(S.deck)===19")
              click("#ui button.back", "デッキ：もどる", "()=>SCREEN==='title'")
              click("#ui .col button.main", "タイトル→MT", "()=>SCREEN==='garage'")
              click("#ui .col button:nth-child(2)", "ガレージ→ミニカーなし（チュートリアル）", "()=>window.TUTORIAL_ON===true")
              click("#tut .tband", "チュートリアル：あいさつを送る", "()=>TUTS.li===1")
              click("#tut .tband", "チュートリアル：あいさつを送る（2）", "()=>TUTS.li===2")
              click("#tut .tband", "チュートリアル：最初の段へ", "()=>TUTS.i===0&&TUTS.ph==='lines'")
              click("#tut .tband", "チュートリアル：説明を送る", "()=>TUTS.li===1")
              click("#tut .tband", "チュートリアル：操作を待つ", "()=>TUTS.ph==='wait'")
              click("#ui button.cs", "チュートリアル：光っているカードを押す", "()=>S.sel===0&&TUTS.ph==='done'")
              click("#tut .tskip", "チュートリアル：スキップ（確認の小窓）", "()=>!!document.querySelector('#modal .box')")
              click("#modal .box button.main", "スキップする（オープニングへ）", "()=>SCREEN==='scene'&&!window.TUTORIAL_ON")
              click("#ui .scband", "会話：帯を押す（文を全部出す）", "()=>S.sc&&S.sc.shown>=sceneText().length")
              click("#ui .scband", "会話：帯を押す（次の文）", "()=>S.sc&&S.sc.i===1")
              click("#ui button.mini", "導入：とばす（オープニングへ）", "()=>S.sc&&S.sc.key==='op'")
              click("#ui button.mini", "オープニング：とばす（ROAD に入るへ）", "()=>S.sc&&S.sc.key==='op_road'")
              click("#ui button.mini", "ROAD に入る：とばす（エリアの入り口へ）", "()=>S.sc&&S.sc.key==='area1'")
              click("#ui button.mini", "エリアの入り口：とばす", "()=>SCREEN==='map'")
              pg.evaluate("()=>{G.map[0]=[{k:'battle',a:0,r:0}]}"); pg.evaluate("()=>showMap()")
              click("#ui button.node", "マップ→戦闘", "()=>SCREEN==='battle'")
              pg.evaluate("()=>{B.e.hp=3;B.hand.unshift(inst('hyouga'));B.rpm=1000;B.gear=0;renderBattle()}")
              click("#ui button.cs", "カードを1回押す（説明）", "()=>S.sel===0")
              click("#ui .detail button", "説明の「打つ」", "()=>B.over===true||S.sel===-1")
              click("#ui .tap", "画面を押す（モーションを飛ばす）", None)
              pg.wait_for_timeout(1500)
              if pg.evaluate("()=>SCREEN==='scene'"): click("#ui button.mini", "初めての REMIT の会話：とばす", "()=>SCREEN==='win'")
              ok_win = pg.evaluate("()=>SCREEN==='win'")
              if not ok_win: bad.append("勝ちの画面にならない")
              else:
                  click("#ui button.cb", "報酬のカードを取る", "()=>SCREEN==='map'")
                  pg.evaluate("()=>{G.row=1;G.map[1]=[{k:'shop',feat:false,a:0,r:1}];G.money=200;showMap()}")
                  click("#ui button.node", "マップ→ショップ", "()=>SCREEN==='shop'")
                  click("#ui .shoprow button:not([disabled])", "ショップ：上げる", "()=>Object.values(G.tune).some(v=>v>0)")
                  click("#ui button.main", "店を出る", "()=>SCREEN==='map'")
                  pg.evaluate("()=>{G.row=2;G.map[2]=[{k:'sim',a:0,r:2}];G.deck.forEach(c=>c.up=false);showMap()}")
                  click("#ui button.node", "マップ→シム", "()=>SCREEN==='sim'")
                  click("#ui .simrow + button.arr", "シム：▶（列を送る）", None)
                  click("#ui .simrow .sw:nth-child(6) button.cs", "シム：カードを選ぶ（モニターに前と後）", "()=>S.simSel!=null")
                  click("#ui .monitor button.main", "シム：強化する", "()=>SCREEN==='map'&&G.deck.some(c=>c.up)")
                  pg.evaluate("()=>{G.hp=10;showRest()}")
                  click("#ui button.main", "休憩：エンジンを直す", "()=>G.hp>10")
                  pg.evaluate("()=>{G.parts=['boost'];showResult(true)}")
                  click("#ui #pk0", "リザルト：ショーケースのカード1", "()=>S.pickSel.length===1")
                  click("#ui #pk3", "リザルト：ショーケースのカード2", "()=>S.pickSel.length===2")
                  click("#ui #pp1", "リザルト：パーツなし", "()=>S.partSel===-1")
                  click("#ui #mkcar", "リザルト：ミニカーを作る", "()=>SCREEN!=='result'")
                  if pg.evaluate("()=>!!document.querySelector('#modal .box button.main')"): click("#modal .box button.main", "このランで（ログ・解放）：OK", "()=>!document.querySelector('#modal .modal')")
                  pg.evaluate("()=>{startBattleState('van');enterBattle()}")
                  click("#ui button.end", "ターン終了", "()=>B.log.some(s=>s.includes('ターン終わり'))")
                  click("#ui button.sub:not([disabled])", "シフトダウン／パーキング（押せるとき）", None) if pg.evaluate("()=>!!document.querySelector('#ui button.sub:not([disabled])')") else None
                  pg.evaluate("()=>showHowto()")
                  click("#modal .box button.main", "小窓をとじる", "()=>!document.querySelector('#modal .modal')")
            except Stop:
              pass
            res[f"{w}x{h}"] = {"pushed": len(log), "bad": bad, "errors": errs[:3]}
            pg.close()
        print(json.dumps(res, ensure_ascii=False, indent=1))
    else:
        res = {}
        for w, h, d in SIZES:
            pg, errs = open_page(b, w, h, d); r = {}
            def snap(name, js):
                pg.evaluate(js); pg.wait_for_timeout(120); pg.screenshot(path=str(shots / f"{name}_{RESK}_{w}.png")); r[name] = pg.evaluate(CHECK)
            snap("title", "()=>showTitle()")
            snap("deck", "()=>showDeck()")
            snap("tutorial", "()=>{localStorage.removeItem(SEEN_KEY);localStorage.removeItem(TUT_KEY);S.deck=null;newRun('MT');for(let i=0;i<5;i++)tutTap()}")
            snap("tutorial_wait", "()=>{tutTap()}")
            snap("tutorial_skip", "()=>{tutSkip()}")
            snap("scene_op", "()=>{closeModal();tutFinish();sceneTap()}")
            snap("scene_area", "()=>{sceneSkip()}")
            snap("map", "()=>{sceneSkip()}")
            snap("battle", "()=>{startBattleState('wraith');enterBattle();for(let i=0;i<3;i++)B.hand.push(inst('rikka'));renderBattle()}")
            snap("battle_sel", "()=>{B.rpm=4500;clickCard(1)}")
            snap("battle_motion", "()=>{const i=B.hand.findIndex(c=>CD(c).t==='atk');doPlay(i<0?0:i,true);}")
            snap("boss", "()=>{flushAnim();G.row=44;startBattleState('boss3');enterBattle();B.hand=['nadare','eikyu','whiteout','kazahana','hyoujin','shironeko','rinkai','muhyou'].map(id=>inst(id,true));B.chain=6;B.onUp=[['blk',4],['genHand','hyoushou',1]];renderBattle()}")
            snap("scene_ed", "()=>{flushAnim();showScene('ed1',()=>{});sceneTap();sceneTap()}")
            snap("scene_log", "()=>{showScene('roadlog_001',()=>{});sceneTap()}")
            snap("win", "()=>{flushAnim();showWin()}")
            snap("parts", "()=>partsChoice('ラッキー！パーツを1つ選ぶ',()=>{})")
            snap("shop", "()=>{G.money=500;G.tickets=1;showShop({k:'shop',feat:true,sale:true})}")
            snap("sim", "()=>showSim()")
            snap("result", "()=>showResult(true)")
            snap("rest", "()=>{G.hp=20;showRest()}")
            snap("release", "()=>{const r=S.res,a=[];for(let i=0;i<12;i++)a.push(makeMinicar(r,[0,1],-1));showReleaseMinicar(a,makeMinicar(r,[2,3],-1));S.relSel=0;renderRelease()}")
            snap("garage_mc", "()=>{const r=S.res;saveMinicars([makeMinicar(r,[0,1],-1),makeMinicar(r,[2,3],-1)]);showMinicarGarage('MT');toggleBring(0)}")
            r["errors"] = errs[:5]
            res[f"{w}x{h}"] = {k: (v if k == "errors" else {"fit": v["fit"], "bad": v["bad"]}) for k, v in r.items()}
            pg.close()
        print(json.dumps(res, ensure_ascii=False, indent=1))
    b.close()
