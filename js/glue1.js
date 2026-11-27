/* ★v0.22.197〜 ①のつなぎ（②・③のファイルの上に、①の決めを足す所）。②・③のファイルは書きかえない。
   ★v0.22.198：嵐の夜の storm_shift は②v0.5.26 が鳴らすようになったので①の分は外した。
   ZERO の形が変わる音 zero_form は audio.js の会話の行の音（CUES の zero_phase2・3）が鳴らすので、②zero.js が直接鳴らす分は通さない（二重になるため）。 */
(function(){
  if(typeof SND!=="object"||typeof SND.se!=="function")return;
  const se=SND.se;
  SND.se=function(id){try{if(id==="zero_form"&&window.AUDIO&&typeof AUDIO.cueKeys==="function"&&AUDIO.cueKeys().includes("zero_phase2"))return}catch(e){}return se.apply(this,arguments)};
})();
