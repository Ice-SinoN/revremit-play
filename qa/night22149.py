# ★v0.22.149 A4 上の夜の得：ログの夜のボーナス ×(1+0.2×(夜−1))・全クリアのツリーのポイント ＋夜の数の半分（切り上げ）。負けたランは夜の分なし。python qa/night22149.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page();pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
  o=pg.evaluate("""()=>{qaSetProgress({slot:1,nightMax:4,tutorial:true});const o={};
    for(const n of [1,2,3,4])for(const cl of [true,false]){qaNewRun({mode:'MT',night:n});G.st.bosses=cl?3:1;G.st.rowsDone=cl?40:10;G.st.clear=cl;const t0=treeData('YUKI').pts||0;S.runEndG=null;const lg=runEnd(cl,'B');
      const L=runLog(cl,'B');o[n+(cl?'c':'l')]={tp:(treeData('YUKI').pts||0)-t0,log:lg,mul:L.mul||null,got:(S.runGot||[]).find(x=>/型のポイント/.test(x))||''}}return o}""")
  R["o"]=o
  exp={"1c":5,"2c":5,"3c":6,"4c":6,"1l":1,"2l":1,"3l":1,"4l":1}  # エリア突破 1+1・全クリア 2・夜の半分（切り上げ）
  for k,v in exp.items():
    if o[k]["tp"]!=v:R["ng"].append([k,"tree",o[k]["tp"],v])
  r=o["4c"]["log"]/o["1c"]["log"] if o["1c"]["log"] else 0
  if abs(r-1.6)>0.08:R["ng"].append(["log ratio N4/N1",round(r,3)])
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False))
