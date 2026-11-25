# ★v0.22.2：仲間の編（text 11〜15章）の流れ・通信の印・音のきっかけ。python qa/beta22.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={};errs=[]
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={"width":1280,"height":720});pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=90000)
  R["flow"]=pg.evaluate("""()=>{localStorage.clear();SAVE.boot();qaSetProgress({slot:1,nightMax:1,night:2,chars:['HINA']});const seen=[];const ss=window.showScene;
    window.showScene=(k,d)=>{seen.push(k);ss.call(null,k,()=>{});const sk=S.sc&&S.sc.key;sceneEnd();seen[seen.length-1]+=(sk&&sk!==k?'→'+sk:'');d&&d()};
    const out={};try{
    PRF().char='YUKI';newRun('MT');G.st.bosses=3;runEnd(true,'B');afterCar({rank:'B'});out.n2=seen.splice(0);
    PRF().night=3;newRun('MT');G.st.bosses=3;runEnd(true,'B');afterCar({rank:'B'});out.n3=seen.splice(0);
    PRF().night=4;newRun('MT');G.st.bosses=3;runEnd(true,'B');afterCar({rank:'B'});out.n4=seen.splice(0);
    out.chars=PRF().unlock.chars.slice();
    for(const c of ['HINA','MOMO','NANA']){PRF().char=c;PRF().night=1;newRun('MT');out[c+'_first']=seen.splice(0);newRun('MT');out[c+'_2nd']=seen.splice(0);
      G.row=G.map.length-1;nextRow();out[c+'_clear1']=seen.splice(0);newRun('MT');G.row=G.map.length-1;nextRow();out[c+'_clear2']=seen.splice(0)}
    }finally{window.showScene=ss}return out}""")
  R["comm"]=pg.evaluate("""()=>{const out={};G.char='HINA';for(const[k,i]of[['ed1',1],['ed1',4],['hina_op',1],['hina_op',9]]){showScene(k,()=>{});S.sc.i=i;sceneLine();
    out[S.sc.key+':'+i]={who:S.sc.sc.lines[i][0],mark:!!document.querySelector('.scband .commk')};sceneEnd()}G.char='MOMO';showScene('ed1',()=>{});out.momo_ed=S.sc.key;sceneEnd();return out}""")
  R["names"]=pg.evaluate("()=>({MOMO:TEXT.names.MOMO,NANA:TEXT.names.NANA,SORA:TEXT.names.SORA,op_road5:TEXT.scenes.op_road.lines[4][1],ses:['photo_shutter','gate_boot','blow_warn'].every(x=>AUDIO.SE_IDS.includes(x))})")
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False,indent=1))
