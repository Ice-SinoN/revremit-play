# ★v0.22.194 audio.js v0.32 と audio-list 22-3 のつなぎ：①会話の行で cue（港の入口）②埠頭の第2形態の頭で futou_phase ③zero_link・zero_ed の会話では BGM を talk に変えない ④roadlog_ はみな pzlog。python qa/audio22194.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={"width":1280,"height":720});pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
  q=pg.evaluate
  q("()=>{qaSetProgress({slot:1,nightMax:11,tutorial:true});OPTS.banter=false;window.__L={se:[],bgm:[],cue:[]};const s=SND.se,bg=SND.bgm;SND.se=(id,o)=>{__L.se.push(id);return s.call(SND,id,o)};SND.bgm=id=>{__L.bgm.push(id);return bg.call(SND,id)};const c=AUDIO.cue;AUDIO.cue=(k,i)=>{__L.cue.push(k+'#'+i);return c(k,i)}}")
  R["ver"]=q("()=>AUDIO.VERSION")
  if float(R["ver"])<0.35:  # ★v0.22.200 0.36 から車ごとのエンジン音
   R["ng"].append(["版",R["ver"]])
  # ①③④ 会話
  r=q("""async()=>{const out={};const sc=TEXT.scenes;
    const fake=k=>{if(!sc[k])sc[k]={lines:[['','…'],['','…']]}};['zero_link','zero_ed','roadlog_harbor','harbor_area'].forEach(fake);
    for(const k of ['harbor_area','zero_link','zero_ed','roadlog_harbor']){__L.bgm=[];__L.cue=[];SND.bgm('map_street');__L.bgm=[];showScene(k,()=>{});await new Promise(r=>setTimeout(r,200));out[k]={bgm:__L.bgm.slice(),cue:__L.cue.slice()};closeModal()}
    return out}""")
  R["scene"]=r
  if "harbor_area#0" not in r["harbor_area"]["cue"]:R["ng"].append(["cue",r["harbor_area"]])
  for k in ["zero_link","zero_ed"]:
    if "talk" in r[k]["bgm"]:R["ng"].append([k,"talk に変わった",r[k]["bgm"]])
  if r["roadlog_harbor"]["bgm"]!=["pzlog"]:R["ng"].append(["roadlog",r["roadlog_harbor"]["bgm"]])
  # ② 埠頭の第2形態
  r=q("""async()=>{qaNewRun({mode:'MT',night:9});startBattleState('hb_boss');enterBattle();await new Promise(r=>setTimeout(r,2500));__L.se=[];
    B.e.hp=Math.floor(B.e.mhp*0.45);B.e.hpMax&&0;const r0=B.rpm;try{B.ev=[{k:'phase',art:'hb_boss_p2'}];playEvents(B.ev)}catch(e){};await new Promise(r=>setTimeout(r,800));
    return {se:__L.se.slice(),key:B.key}}""")
  R["phase"]=r
  # ★v0.22.204：futou_phase は②の night2.js（checkWx2＝第2形態の天候が入った番）だけで鳴らす。①の phase の演出では鳴らさない（二重だった）
  w=q("()=>typeof checkWx2==='function'&&checkWx2.toString().includes('futou_phase')")
  if "futou_phase" in r["se"] or not w:R["ng"].append(["futou_phase",r,w])
  # 埠頭でないボスでは鳴らない
  r=q("""async()=>{qaNewRun({mode:'MT',night:2});startBattleState('boss1');enterBattle();await new Promise(r=>setTimeout(r,2500));__L.se=[];try{B.ev=[{k:'phase'}];playEvents(B.ev)}catch(e){};await new Promise(r=>setTimeout(r,800));return __L.se.slice()}""")
  if "futou_phase" in r:R["ng"].append(["ほかのボスでも鳴った",r])
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False))
