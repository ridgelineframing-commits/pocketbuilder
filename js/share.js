/* ---------- Share / Copy the tape ---------- */
(function(){
  function tapeOK(){ return typeof c!=="undefined" && c.steps && c.steps.length>0; }
  function fallbackCopy(t){
    try{
      var ta=document.createElement("textarea"); ta.value=t;
      ta.style.position="fixed"; ta.style.left="-9999px"; ta.style.top="0";
      document.body.appendChild(ta); ta.focus(); ta.select();
      var ok=document.execCommand("copy"); document.body.removeChild(ta);
      toast(ok?"Copied to clipboard":"Copy not supported here");
    }catch(e){ toast("Copy not supported here"); }
  }
  function copyTape(){
    if(!tapeOK()){ toast("Tape is empty"); return; }
    var t=tapeText();
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(t).then(function(){ toast("Copied to clipboard"); try{closeMenu();}catch(e){} }).catch(function(){ fallbackCopy(t); });
    } else { fallbackCopy(t); }
  }
  function shareTape(){
    if(!tapeOK()){ toast("Tape is empty"); return; }
    var t=tapeText();
    if(navigator.share){
      navigator.share({title:"PocketBuilder tape", text:t}).then(function(){ try{closeMenu();}catch(e){} }).catch(function(){});
    } else {
      copyTape();   /* desktop: no share sheet -> copy so they can paste into a text/email */
    }
  }
  window.copyTape=copyTape; window.shareTape=shareTape;
  function addBtns(){
    var rows=document.getElementsByClassName("menubtns"); if(!rows.length) return;
    var row=rows[0], save=document.getElementById("mSave");
    if(document.getElementById("mShare")) return;
    function mk(id,label){ var b=document.createElement("button"); b.className="btn alt"; b.id=id; b.textContent=label; b.style.padding="11px 6px"; return b; }
    var cp=mk("mCopy","Copy"), sh=mk("mShare","Share");
    if(save){ row.insertBefore(cp,save); row.insertBefore(sh,save); } else { row.appendChild(cp); row.appendChild(sh); }
    cp.addEventListener("click",copyTape); sh.addEventListener("click",shareTape);
    var n=document.getElementById("mNew"); if(n){ n.textContent="New"; n.style.padding="11px 6px"; }
    if(save){ save.textContent="Save"; save.style.padding="11px 6px"; }
    var dn=document.getElementById("menuClose"); if(dn){ dn.style.padding="11px 6px"; }
  }
  if(document.readyState!=="loading") addBtns(); else document.addEventListener("DOMContentLoaded",addBtns);
})();
