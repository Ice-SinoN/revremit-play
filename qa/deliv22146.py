# ★v0.22.146 B5 送り届けた記録の数：雑魚 1・エリート 3・裏道 3・ゴースト 3・ボス 10／負けても入る／練習・フルオートは数えない／ガレージの見出しの下・「このランで」に出る／スロットごと・セーブに残る／街の段・次の節目。python qa/deliv22146.py <html>  ★v0.22.197：試作は full（節目10か所）なので 1000 の次は 1500
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
with sync_playwright() as p:
  b=p.chromium.launch()
  for vw,vh in [(667,375),(1280,720)]:
    pg=b.new_page(viewport={"width":vw,"height":vh});pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    o=pg.evaluate("""async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));qaSetProgress({slot:1,nightMax:3,tutorial:true});const p=PRF();p.deliv=0;const o={};
      const win=k=>{startBattleState(k);B.e.hp=0;winRewards()};
      qaNewRun({mode:'MT',night:2});win('kei');o.a=p.deliv;win(AREAS[0].elite);o.b=p.deliv;startBattleState(AREAS[0].elite);B.hidden=true;B.e.hp=0;winRewards();o.c=p.deliv;win('boss1');o.d=p.deliv;o.g=G.deliv;
      G.practice=true;win('kei');o.prac=p.deliv;G.practice=false;G.fullAuto=true;win('kei');o.farm=p.deliv;G.fullAuto=false;
      runEnd(false,'C');o.runDeliv=S.runDeliv;afterCarShow(S.runGot||[]);await w(200);o.modal=(document.querySelector('#modal')||{}).innerText||'';
      SAVE.auto();o.saved=JSON.parse(localStorage.getItem('revremit_save_auto_1')||'{}').profile?.deliv;
      o.city=[delivCity(99),delivCity(100),delivCity(3000)];o.next=[delivNext(0),delivNext(50),delivNext(1000)];
      showHub();await w(200);const e=document.querySelector('.hubdeliv');o.hub=e&&e.innerText;const st=document.querySelector('#stage').getBoundingClientRect(),r=e.getBoundingClientRect();
      o.hubHit=[...document.querySelectorAll('#ui > button,#ui > .hdr')].some(x=>{const q=x.getBoundingClientRect();return r.left<q.right&&q.left<r.right&&r.top<q.bottom&&q.top<r.bottom&&x!==e});
      SAVE.use(2);o.slot2=delivCount();SAVE.use(1);o.slot1=delivCount();return o}""")
    R[str(vw)]=o
    exp=dict(a=1,b=4,c=7,d=17,g=17,prac=17,farm=17,runDeliv=17,saved=17,city=[0,1,5],next=[50,100,1500],slot2=0,slot1=17)
    for k,v in exp.items():
      if o.get(k)!=v:R["ng"].append([vw,k,o.get(k)])
    if "届けた記録 +17（合計 17）" not in o["modal"]:R["ng"].append([vw,"modal",o["modal"][:120]])
    if not o["hub"] or "17" not in o["hub"] or o["hubHit"]:R["ng"].append([vw,"hub",o["hub"],o["hubHit"]])
    pg.screenshot(path=f"/tmp/deliv_hub_{vw}.png");pg.close()
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False))
