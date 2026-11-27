/* ★v0.22.197〜 ①のつなぎ（②・③のファイルの上に、①の決めを足す所）。②・③のファイルは書きかえない。
   ★v0.22.201 audio v0.37〜0.39（窓口 11-27 15:44）：
   ・ZERO の1回目の終わりの話（zero_ed）のあとにスタッフロール（js/credits.js）→ リザルト
   ・ZERO を1回倒したあと（PRF().zeroClear）は、タイトル・データの曲を title_morning
   ・各子の初クリアの終わりの話（{子}_ed）は bgmFor("ending",子)（YUKI の ed1 は今のまま）
   ・残響（hw_boss）が出るとき zankyou_enter */
(function(){
  const W=(name,fn)=>{const f=window[name];if(typeof f!=="function")return;window[name]=fn(f)};
  W("showScene",f=>function(key,done){if(key==="zero_ed"&&typeof showCredits==="function"){const d=done;done=function(){showCredits(d)}}
    const r=f.call(this,key,done);
    try{const m=/^([a-z]+)_ed$/.exec(key);if(m&&m[1]!=="zero"&&TEXT.scenes[key]){const who=m[1];SND.cur="ending_"+who;SND.call(A=>A.bgmFor?A.bgmFor("ending",who):A.bgm("ending"))}}catch(e){}
    return r});
  if(typeof SND==="object"){const b=SND.bgm;SND.bgm=function(id){try{if(id==="title"&&(+PRF().zeroClear||0)>0&&window.AUDIO&&AUDIO.BGM_IDS&&AUDIO.BGM_IDS.includes("title_morning"))id="title_morning"}catch(e){}return b.call(this,id)}}
  W("enterBattle",f=>function(){const r=f.apply(this,arguments);try{if(B&&(B.key==="hw_boss")&&!B.sim&&!(G&&G.fullAuto))SND.se("zankyou_enter")}catch(e){}return r});
})();
