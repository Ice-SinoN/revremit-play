# ★v0.22.197 design 26-7 ①：BUILD（beta／full）・② v0.5.21〜25 を入れたあと①の夜の顔が残っていない・text 48-2 の ROAD LOG・嵐の夜の storm_shift・audio v0.35。python qa/build22197.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
def ng(*a):R["ng"].append(a)
with sync_playwright() as p:
  b=p.chromium.launch()
  for build in ["full","beta"]:
    pg=b.new_page(viewport={"width":1280,"height":720});pg.on("pageerror",lambda e:errs.append(str(e)))
    if build=="beta":pg.add_init_script('window.RR_BUILD="beta"')
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    q=pg.evaluate
    q("()=>{qaSetProgress({slot:1,nightMax:11,tutorial:true,chars:['HINA','MOMO','NANA','SORA','KAEDE','RIN','LUNA','MIO','KURO']})}")
    o=q("""()=>({build:BUILD,bn:BETA_NIGHTS,mx:nightMaxAvail(),open:charsOpen(),saved:PRF().unlock.chars.slice(),marks:DELIV.marks.slice(),
      rl1500:!!TEXT.scenes.roadlog_remit_1500,rl5000:(TEXT.scenes.roadlog_remit_5000||{lines:[]}).lines.length,n4:(NIGHTS[3].open.chars||[]).slice(),
      f5:(NIGHT_FACE[5]||{}).n,f11:(NIGHT_FACE[11]||{}).n,old:typeof nightFaceBattle,ghN:typeof ghostN,a3:typeof ALLY3!=="undefined",av:AUDIO.VERSION,
      se:['storm_shift','zero_form','zero_borrow'].map(x=>AUDIO.SE_IDS.filter(i=>i===x).length)})""")
    R[build]=o
    if o["build"]!=build:ng("build",build,o["build"])
    if "KAEDE" not in o["saved"]:ng("save lost",build)
    if o["old"]!="undefined" or o["ghN"]!="undefined":ng("①の夜の顔が残っている",build)
    if float(o["av"])<0.35 or o["se"]!=[1,1,1]:ng("audio",o["av"],o["se"])
    if build=="full":
      if o["bn"] is not None or o["mx"]<10:ng("full nights",o["bn"],o["mx"])
      if len(o["marks"])!=10 or o["marks"][-1]!=5000:ng("full marks",o["marks"])
      if o["n4"]!=["SORA"]:ng("full N4 SORA",o["n4"])
      if o["a3"] and len(o["open"])!=10:ng("full 10人",o["open"])
      if o["f5"]!="湾岸の夜" or o["f11"]!="最後の夜":ng("face",o["f5"],o["f11"])
      if not o["rl1500"] or o["rl5000"]!=5:ng("roadlog",o["rl1500"],o["rl5000"])
      # 嵐の夜：3ターン目に storm_shift（フルオートでは鳴らない）
      s=q("""()=>{const out=[];const se=SND.se;let got=[];SND.se=(id,p)=>{got.push(id);return se.call(SND,id,p)};
        for(const fa of [false,true]){got=[];window.nightMaxAvail=()=>11;PRF().char='YUKI';qaNewRun({mode:'MT',night:7});G.fullAuto=fa;startBattleState('kei');B.e.hp=B.e.maxhp=9999;
          if(!B.storm)B.storm={wx:'rain',at:3};for(let i=0;i<4&&!B.storm.done;i++){B.pTurns=(B.pTurns||0)+1;startPlayerTurn(false)}out.push([fa,!!B.storm.done,got.filter(x=>x==='storm_shift').length])}
        SND.se=se;return out}""")
      R["storm"]=s
      if s[0][2]!=1 or s[1][2]!=0:ng("storm_shift",s)
    else:
      if o["bn"]!=4 or o["mx"]!=4:ng("beta nights",o["bn"],o["mx"])
      if o["open"]!=["YUKI","HINA","MOMO","NANA"]:ng("beta chars",o["open"])
      if len(o["marks"])!=5:ng("beta marks",o["marks"])
      if o["n4"]!=[] and not o["a3"]:ng("beta N4",o["n4"])  # ★v0.22.199 ③が読まれている試作では③が N4 に SORA を置く（公開βの play は③を読まない＝下の play の確かめ）
    pg.close()
  b.close()
import re,os
pl="/home/claude/rr/play/index.html"
if os.path.exists(pl):
  t=open(pl,encoding="utf-8").read();R["play"]=[re.search(r'RR_BUILD="(\w+)"',t).group(1),"ally3_core" in t]
  if R["play"][0]=="beta" and R["play"][1]:ng("公開βに③",R["play"])
R["errs"]=errs[:5]
if errs:ng("errs",len(errs))
print(json.dumps(R,ensure_ascii=False))
