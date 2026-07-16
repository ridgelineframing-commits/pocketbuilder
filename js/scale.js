/* ---------- Grow the calculator to fill the display (keep portrait proportions) ---------- */
(function(){
  var BW=432, BH=900;   /* design canvas; scaled up/down to fit the window */
  var st=document.createElement("style"); st.id="bt-grow-css";
  st.textContent=
    "#device{width:"+BW+"px !important;height:"+BH+"px !important;max-width:none !important;max-height:none !important;"+
      "transform-origin:center center;will-change:transform;}"+
    "html,body{overflow:hidden !important;}";
  (document.head||document.documentElement).appendChild(st);
  function fit(){
    var dev=document.getElementById("device"); if(!dev) return;
    var vw=window.innerWidth||BW, vh=window.innerHeight||BH;
    var s=Math.min(vw/BW, vh/BH);
    if(!(s>0)) s=1;
    dev.style.transform="scale("+(Math.round(s*1000)/1000)+")";
  }
  function boot(){
    fit();
    try{ window.addEventListener("resize",fit); window.addEventListener("orientationchange",fit); }catch(e){}
    setTimeout(fit,250); setTimeout(fit,800);
  }
  if(document.readyState!=="loading") boot(); else document.addEventListener("DOMContentLoaded",boot);
})();
