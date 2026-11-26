# ★v0.22.189 名前の行の上が、絵の枠の線（1px）より下。★v0.22.188 AD：負けの画面（ショーケース）のカードの名前は1行で、絵（.cw）の下にあり、カードの幅 70 からはみ出さない。python qa/case22188.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={"width":1280,"height":720});pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
  r=pg.evaluate("""async()=>{qaSetProgress({slot:1,nightMax:3,tutorial:true});OPTS.banter=false;qaNewRun({mode:'MT',night:2});
    G.deck=['slip','counter','qshift','slip','counter','f_y_rinkaitsurara','f_n_gaisenhachiren','hyouga','whiteout','hakusen','braking','quickshift','f_h_dainichirin'].filter(id=>CARDS[id]).map(id=>inst(id));showResult(false);await new Promise(r=>setTimeout(r,800));
    const k=document.querySelector('#stage').getBoundingClientRect().height/360;
    return [...document.querySelectorAll('#ui .case')].map(c=>{const n=c.querySelector('.cn'),w=c.querySelector('.cw'),cr=c.getBoundingClientRect(),nr=n.getBoundingClientRect(),wr=w?w.getBoundingClientRect():null;
      return{t:n.textContent,lines:Math.round(nr.height/k/10),under:wr?nr.top>=wr.bottom+1*k:true/* ★v0.22.189 枠の線（1px）より下 */,gapNext:0,inL:nr.left>=cr.left-1,inR:nr.right<=cr.right+1}})}""")
  R["r"]=r
  for x in r:
    if x["lines"]!=1 or not x["under"] or not x["inL"] or not x["inR"]:R["ng"].append(x)
  if len(r)<10:R["ng"].append(["枚数",len(r)])
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False))
