/* ★v0.22.197 ①のつなぎ（②のファイルの上に、①の音などを足す所）。②のファイルは書きかえない。
   嵐の夜（②nface.js）：3ターン目に天候が変わった番に storm_shift（audio v0.33・design 26-5）。フルオートでは鳴らさない */
(function(){
  if(typeof startPlayerTurn!=="function")return;
  const f=startPlayerTurn;
  window.startPlayerTurn=startPlayerTurn=function(){const was=!!(B&&B.storm&&!B.storm.done);const r=f.apply(this,arguments);
    try{if(was&&B&&B.storm&&B.storm.done&&!(G&&G.fullAuto)&&!(window.FARM&&FARM.on))SND.se("storm_shift")}catch(e){}return r};
})();
