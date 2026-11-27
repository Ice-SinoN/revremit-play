# ★v0.22.199 ③ v1.9 の合流（10人の full）：①NIGHT 4 の初クリアで ally_next → next_sora → join_sora、β の締めは出ない ②6人それぞれ1戦（はじめのデッキで打って番を回す）・その子のボスの絵 ③図鑑・キャラえらびが10人 ④エラー 0。python qa/ally22199.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
with sync_playwright() as p:
  b=p.chromium.launch()
  pg=b.new_page(viewport={"width":1280,"height":720});pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
  q=pg.evaluate
  q("()=>{qaSetProgress({slot:1,nightMax:3,tutorial:true,chars:['HINA','MOMO','NANA']});OPTS.banter=false;PRF().modeHelp={MT:1,AT:1,CVT:1}}")
  # ① N4 の初クリア
  r=q("""async()=>{window.__sc=[];const ss=window.showScene;window.showScene=function(k,d){__sc.push(k);return d&&setTimeout(d,0)};let be=0;const sb=window.showBetaEnd;window.showBetaEnd=function(n){be++;n&&n()};
    PRF().char='YUKI';qaNewRun({mode:'MT',night:4});S.runEndG=null;S.joinQ=[];runEnd(true,'S');const jq=(S.joinQ||[]).slice();S.joinQ=[];let done=0;
    playJoins(jq,()=>{done=1});for(let i=0;i<40&&!done;i++)await new Promise(r=>setTimeout(r,100));
    window.showScene=ss;window.showBetaEnd=sb;return {jq,sc:__sc,be,done,open:charsOpen(),mx:nightMaxAvail()}}""")
  R["n4"]=r
  s=[k for k in r["sc"] if k in("ally_next","next_sora","join_sora")]
  if s!=["ally_next","next_sora","join_sora"]:R["ng"].append(["N4 の流れ",r["sc"]])
  if r["be"]:R["ng"].append(["β の締めが出た",r["be"]])
  if "SORA" not in r["open"] or r["mx"]<5:R["ng"].append(["SORA・NIGHT 5",r["open"],r["mx"]])
  # ② 6人で1戦
  q("()=>{closeModal();qaSetProgress({slot:1,nightMax:10,tutorial:true,chars:['HINA','MOMO','NANA','SORA','KAEDE','RIN','LUNA','MIO','KURO']})}")
  one={}
  for ch in ["SORA","KAEDE","RIN","LUNA","MIO","KURO"]:
    one[ch]=q(f"""async()=>{{PRF().char='{ch}';qaNewRun({{mode:csModes('{ch}')[0],night:5}});startBattleState('kei');enterBattle();await new Promise(r=>setTimeout(r,900));
      let n=0;for(let t=0;t<3&&!B.over;t++){{for(let i=0;i<6&&B.hand.length&&!B.over;i++){{try{{const r=playCard(0,false);if(r!==false)n++}}catch(e){{return 'err '+e}}}}if(!B.over){{try{{doEndTurn()}}catch(e){{return 'end '+e}}await new Promise(r=>setTimeout(r,1500))}}}}
      return [G.char,G.deck.length,n,!!B]}}""")
    if not isinstance(one[ch],list):R["ng"].append([ch,one[ch]])
  R["one"]=one
  q("()=>{closeModal();S.flow={mode:'MT'};showCharSel()}");pg.wait_for_timeout(600)
  R["cs"]=q("()=>[...document.querySelectorAll('#ui .csface,#ui [onclick*=csPick],#ui [onclick*=csSel]')].length")
  b.close()
R["errs"]=errs[:5]
print(json.dumps(R,ensure_ascii=False))
