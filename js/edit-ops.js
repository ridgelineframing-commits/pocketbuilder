/* ---------- Edit a line's OPERATION on the tape (3+3 -> tap line, press x -> 3x3) ---------- */
(function(){
  var OPMAP={add:"+",sub:"-",mul:"*",div:"/"};
  /* re-derive the whole chain so carried-forward totals + printed subtotals stay correct */
  function recomputeChain(){
    var prev=null, i=0, n=c.steps.length, j;
    while(i<n){
      var st=i, en=n;
      for(j=i;j<n;j++){ if(c.steps[j].sep){ en=j; break; } }
      for(j=st;j<en;j++){ var s=c.steps[j]; if(s.info) continue; if(s.val){ if(s.carry && prev) s.val={n:prev.n,dim:prev.dim,u:prev.u}; break; } }
      var res=PB.fold(c.steps.slice(st,en)).acc;
      for(j=en-1;j>=st;j--){ if(c.steps[j].sub){ c.steps[j].text="= "+fv(res); break; } }
      prev=res; i=en+1;
    }
  }
  /* change the operation tied to a tapped line. tapping the first number changes the op that follows it. */
  function changeOp(i,op){
    if(!c.steps[i]||!c.steps[i].val||c.steps[i].info) return false;
    var st=0,j; for(j=i-1;j>=0;j--){ if(c.steps[j].sep){ st=j+1; break; } }
    var firstVal=-1; for(j=st;j<c.steps.length;j++){ var s=c.steps[j]; if(s.sep) break; if(s.val&&!s.info){ firstVal=j; break; } }
    var target=i;
    if(i===firstVal){ for(j=i+1;j<c.steps.length;j++){ var s2=c.steps[j]; if(s2.sep) break; if(s2.val&&!s2.info){ target=j; break; } } }
    if(target===firstVal) return false;                 /* nothing after the first number to re-operate */
    if(!c.steps[target]||!c.steps[target].val||c.steps[target].info) return false;
    c.steps[target].op=op; recomputeChain(); return true;
  }
  window.changeOp=changeOp; window.recomputeChain=recomputeChain;

  var orig=press;
  window.press=function(k){
    if(typeof editTarget!=="undefined" && editTarget!=null && (k==="add"||k==="sub"||k==="mul"||k==="div")
       && (typeof isPristineLoaded!=="function" || isPristineLoaded())
       && c.steps[editTarget] && c.steps[editTarget].val && !c.steps[editTarget].info){
      if(window.pushUndo) pushUndo();
      if(changeOp(editTarget, OPMAP[k])){ try{toast("Changed to "+(k==="mul"?"×":k==="div"?"÷":k==="sub"?"−":"+"));}catch(e){} render(); return; }
    }
    return orig(k);
  };
})();
