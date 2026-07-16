/* ===================== PocketBuilder UI ===================== */
var c = new PB.Calc();
window._pendingNote="";
(function(){ var oc=PB.Calc.prototype._commit;
  PB.Calc.prototype._commit=function(op){ var had=this.hasInput(); oc.call(this,op);
    if(had && window._pendingNote){
      for(var i=this.steps.length-1;i>=0;i--){ var st=this.steps[i]; if(st.val && !st.info){ st.note=(st.note? st.note+" ":"")+window._pendingNote.trim(); break; } }
      window._pendingNote="";
    } };
})();
var convMode = false, SYS = "imp", FRAC = 16, STYLE="graphite", PAPER="white", LAYOUT="full";
var editTarget = null;
function el(id){return document.getElementById(id);}
var T = { tape:el("tape"), grand:el("grand"), gdim:el("gdim"), mem:el("mem") };

function fv(v){
  if(!v) return "0";
  if(SYS==="met") return PB.fmtMetric(v);
  if(v.dim===PB.LINEAR){
    if(v.u==="in") return PB.fmtInchesOnly(v.n, FRAC);
    if(v.u==="yd") return PB.fmtYards(v.n);
    return PB.fmtFtIn(v.n, FRAC);
  }
  return PB.fmtVal(v);
}
function lin(n){ return {n:n,dim:PB.LINEAR}; }
function fvL(n){ return n==null ? "—" : fv(lin(n)); }
function fvIn(n){ return n==null ? "—" : (SYS==="met" ? PB.fmtNum(n*25.4,0)+" mm" : PB.fmtFtIn(n,FRAC)); }

/* ===== CASE SKINS ===== */
function texURL(svg){ try{ return 'url("data:image/svg+xml;base64,'+btoa(svg)+'")'; }catch(e){ return "none"; } }
function woodSVG(){
  var W=440,H=900,cols=["#6a3c18","#5a3214","#7a4a26","#4e2c12","#714224"],g="",x,i;
  for(x=6;x<W;x+=11){ var col=cols[x%cols.length], w=(0.8+(x*7%10)/10*1.5).toFixed(2), op=(0.20+(x*3%10)/10*0.30).toFixed(2);
    g+="<path d='M"+x+" -10 V"+(H+10)+"' stroke='"+col+"' stroke-width='"+w+"' opacity='"+op+"'/>"; }
  var cx=W*0.42;
  for(i=0;i<10;i++){ var rx=40+i*30, top=(H*0.42)-(160+i*60)*0.15;
    g+="<path d='M"+(cx-rx)+" "+(H+10)+" C "+(cx-rx)+" "+top+", "+(cx+rx)+" "+top+", "+(cx+rx)+" "+(H+10)+"' fill='none' stroke='#4e2c12' stroke-width='1.6' opacity='0.55'/>"; }
  return "<svg xmlns='http://www.w3.org/2000/svg' width='"+W+"' height='"+H+"'><defs>"+
    "<filter id='wp' x='-10%' y='-3%' width='120%' height='106%'><feTurbulence type='fractalNoise' baseFrequency='0.006 0.018' numOctaves='3' seed='4' result='n'/><feDisplacementMap in='SourceGraphic' in2='n' scale='20' xChannelSelector='R' yChannelSelector='G'/></filter>"+
    "<linearGradient id='wb' x1='0' y1='0' x2='1' y2='0'><stop offset='0' stop-color='#c79b74'/><stop offset='0.5' stop-color='#d3ad8b'/><stop offset='1' stop-color='#c2926a'/></linearGradient>"+
    "</defs><rect width='"+W+"' height='"+H+"' fill='url(#wb)'/><g filter='url(#wp)'>"+g+"</g></svg>";
}
var SVG_CONC="<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='c' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='5' seed='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/><feComponentTransfer><feFuncR type='linear' slope='0.6' intercept='0.38'/><feFuncG type='linear' slope='0.6' intercept='0.38'/><feFuncB type='linear' slope='0.6' intercept='0.39'/></feComponentTransfer></filter><rect width='200' height='200' filter='url(#c)'/></svg>";
var SVG_CIRC="<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='200' height='200' fill='#07120f'/><g stroke='#1fd187' stroke-width='2' fill='none' opacity='0.85' stroke-linecap='round'><path d='M0 28 H64 L84 48 H200'/><path d='M0 92 H38 L58 72 H128 L148 92 H200'/><path d='M0 152 H96 L116 132 H200'/><path d='M28 0 V58 L48 78 V200'/><path d='M112 0 V42 L132 62 V128'/><path d='M172 0 V200'/></g><g fill='#1fd187'><circle cx='64' cy='28' r='4'/><circle cx='38' cy='92' r='4'/><circle cx='96' cy='152' r='4'/><circle cx='48' cy='78' r='3'/><circle cx='132' cy='62' r='3'/></g><g fill='#37e0d6'><rect x='148' y='88' width='18' height='8' rx='2'/><rect x='114' y='130' width='8' height='18' rx='2'/></g><g fill='#d24bd2'><rect x='128' y='40' width='6' height='22' rx='2'/><circle cx='172' cy='150' r='3'/></g><g fill='#1fd187' opacity='0.45'><rect x='10' y='172' width='3' height='3'/><rect x='182' y='20' width='3' height='3'/><rect x='88' y='186' width='3' height='3'/><rect x='150' y='168' width='3' height='3'/></g></svg>";
var TEX_WOOD=texURL(woodSVG()), TEX_CONC=texURL(SVG_CONC), TEX_CIRC=texURL(SVG_CIRC);
var CASES={
  graphite:"repeating-linear-gradient(90deg,rgba(255,255,255,.05) 0 1px,rgba(0,0,0,.05) 1px 3px), linear-gradient(180deg,#3a3f47,#20242a)",
  steel:"repeating-linear-gradient(90deg,rgba(255,255,255,.13) 0 1px,rgba(0,0,0,.05) 1px 3px), linear-gradient(180deg,#d3d8de,#9aa1a9)",
  navy:"repeating-linear-gradient(90deg,rgba(255,255,255,.06) 0 1px,rgba(0,0,0,.06) 1px 3px), linear-gradient(180deg,#2d4c75,#15263d)",
  forest:"repeating-linear-gradient(90deg,rgba(255,255,255,.06) 0 1px,rgba(0,0,0,.06) 1px 3px), linear-gradient(180deg,#2f5a3a,#16301f)",
  sand:"repeating-linear-gradient(90deg,rgba(255,255,255,.08) 0 1px,rgba(0,0,0,.05) 1px 3px), linear-gradient(180deg,#c2a472,#8a6f44)",
  crimson:"repeating-linear-gradient(90deg,rgba(255,255,255,.07) 0 1px,rgba(0,0,0,.06) 1px 3px), linear-gradient(180deg,#9c2c23,#5f1813)",
  wood:"linear-gradient(180deg,rgba(0,0,0,.03),rgba(0,0,0,.15)), "+TEX_WOOD+" center/cover",
  concrete:"linear-gradient(180deg,rgba(0,0,0,.04),rgba(0,0,0,.16)), "+TEX_CONC+" top left/200px 200px repeat",
  circuit:"radial-gradient(120% 90% at 50% 28%, rgba(31,209,135,.06), rgba(0,0,0,.40)), "+TEX_CIRC+" top left/132px 132px repeat, #07120f",
  water:"linear-gradient(180deg, rgba(255,255,255,0) 49.3%, rgba(255,255,255,.6) 49.6%, rgba(255,255,255,.6) 50%, rgba(255,255,255,0) 50.4%), radial-gradient(3px 3px at 30% 72%, rgba(255,255,255,.55), transparent 60%), radial-gradient(2px 2px at 62% 84%, rgba(255,255,255,.5), transparent 60%), linear-gradient(180deg,#eef6fc 0%,#e3eef8 49%,#5aa3d4 51%,#2f81bf 100%)"
};
function applyStyle(name){ STYLE=(CASES[name]?name:"graphite"); document.documentElement.style.setProperty("--shell", CASES[STYLE]); }
function applyLayout(name){ LAYOUT=(name==="reduced"||name==="minimal")?name:"full"; var k=el("keys"); if(k){ k.classList.remove("reduced","minimal"); if(LAYOUT!=="full") k.classList.add(LAYOUT); } }

var PAPERS={
  white:{paper:"#ffffff",line:"#e1e1e1",margin:"#f0c4bd",txt:"#1d1f22",mut:"#a6a09a",note:"#14806a"},
  manila:{paper:"#ecdcba",line:"#d3c197",margin:"#cf9d7e",txt:"#2a2417",mut:"#897c5f",note:"#0f6b52"},
  sky:{paper:"#e3edfb",line:"#bdd2ef",margin:"#e7b3ab",txt:"#16243d",mut:"#7a8aa6",note:"#0e7a63"},
  charcoal:{paper:"#2b2e33",line:"#3d424a",margin:"#7a3b34",txt:"#f1f1ee",mut:"#9aa0a8",note:"#5fd0b2"},
  navy:{paper:"#19233b",line:"#33415e",margin:"#7a4a52",txt:"#eef2fb",mut:"#94a2bd",note:"#63cdb4"},
  forest:{paper:"#1b2a1d",line:"#34452f",margin:"#6a4a3a",txt:"#eef3ea",mut:"#93a896",note:"#8fd9b8"}
};
function applyPaper(name){ PAPER=(PAPERS[name]?name:"white"); var p=PAPERS[PAPER], r=document.documentElement.style;
  r.setProperty("--paper",p.paper);r.setProperty("--paperline",p.line);r.setProperty("--papermargin",p.margin);
  r.setProperty("--papertxt",p.txt);r.setProperty("--papermut",p.mut);r.setProperty("--papernote",p.note||p.mut); }

var UNIT_SETS = { imp: [["yd","Yds"],["feet","Feet"],["inch","Inch"]], met: [["m","m"],["cm","cm"],["mm","mm"]] };
function applySystem(){
  var set=UNIT_SETS[SYS];
  for(var i=0;i<3;i++){ var b=el("u"+i); if(b){ b.dataset.k=set[i][0]; b.textContent=set[i][1]; } }
  el("fracKey").style.opacity = SYS==="met" ? .4 : 1;
  render();
}

/* ---------- roof / stair solver ---------- */
function makeRoofD(){ return {pitch:null,run:null,rise:null,diag:null,hip:null,angle:null,given:[]}; }
function makeStairD(){ return {rise:null,target:7.75,tread:10,n:null,riser:null,treads:null,run:null,stringer:null,landRiser:null,surface:0.75,landFinish:null,landFrame:null}; }
var roofD=makeRoofD(), stairD=makeStairD();
function roofSetField(d,key,val){ if(key==="pitch") d.pitch=val; else d[key]=val; d.given=d.given.filter(function(k){return k!==key;}); d.given.push(key); if(d.given.length>2) d.given.shift(); solveRoof(d); }
function solveRoof(d){
  var g=d.given; if(g.length<2) return;
  var kv={}; kv[g[0]]=d[g[0]]; kv[g[1]]=d[g[1]];
  var rise=('rise'in kv)?kv.rise:null, run=('run'in kv)?kv.run:null, diag=('diag'in kv)?kv.diag:null, pitch=('pitch'in kv)?kv.pitch:null;
  if(rise!=null&&run!=null){}
  else if(rise!=null&&diag!=null){ if(diag<rise)return; run=Math.sqrt(diag*diag-rise*rise); }
  else if(run!=null&&diag!=null){ if(diag<run)return; rise=Math.sqrt(diag*diag-run*run); }
  else if(rise!=null&&pitch!=null){ run=pitch!==0?rise*12/pitch:0; }
  else if(run!=null&&pitch!=null){ rise=run*pitch/12; }
  else if(diag!=null&&pitch!=null){ var th=Math.atan2(pitch,12); rise=diag*Math.sin(th); run=diag*Math.cos(th); }
  if(rise==null||run==null) return;
  d.rise=rise; d.run=run; d.diag=Math.sqrt(rise*rise+run*run); d.pitch=run!==0?rise/run*12:0;
  d.hip=Math.sqrt((run*Math.SQRT2)*(run*Math.SQRT2)+rise*rise); d.angle=Math.atan2(rise,run)*180/Math.PI;
}
function stairSetField(d,key,val){ d[key]=val; solveStair(d); }
function solveStair(d){
  if(d.rise==null||d.rise<=0){ d.n=d.riser=d.treads=d.run=d.stringer=d.landFinish=d.landFrame=null; return; }
  var mx=(d.target==null?7.75:d.target), td=(d.tread==null?10:d.tread);
  d.n=Math.max(1,Math.ceil(d.rise/mx)); d.riser=d.rise/d.n; d.treads=d.n-1; d.run=d.treads*td; d.stringer=Math.sqrt(d.rise*d.rise+d.run*d.run);
  if(d.landRiser!=null && d.landRiser>0 && d.riser!=null){ d.landFinish=d.landRiser*d.riser; d.landFrame=d.landFinish-(d.surface==null?0.75:d.surface); }
  else { d.landFinish=null; d.landFrame=null; }
}
function asInches(cur){ if(cur.dim!==PB.SCALAR) return cur.n; return SYS==="met" ? cur.n*39.37007874015748 : cur.n*12; }
function pcell(kind,field,label,val,editable){ return '<div class="cc'+(editable?' ed':'')+'"'+(editable?' data-kind="'+kind+'" data-f="'+field+'"':'')+'><span>'+label+'</span><b>'+val+'</b></div>'; }
function renderRoofPop(){ var d=roofD; el("roofcells").innerHTML=
  pcell("roof","pitch","Pitch", d.pitch!=null?PB.fmtNum(d.pitch,2)+"/12":"—", true)+pcell("roof",null,"Angle", d.angle!=null?PB.fmtNum(d.angle,1)+"°":"—", false)+
  pcell("roof","run","Run", fvL(d.run), true)+pcell("roof","rise","Rise", fvL(d.rise), true)+pcell("roof","diag","Diag", fvL(d.diag), true)+pcell("roof",null,"Hip/V", fvL(d.hip), false); }
function renderStairPop(){ var d=stairD; el("staircells").innerHTML=
  pcell("stair","rise","Total rise", fvL(d.rise), true)+pcell("stair","target","Max riser", fvIn(d.target), true)+pcell("stair","tread","Tread depth", fvIn(d.tread), true)+
  pcell("stair",null,"Risers", d.n!=null?d.n:"—", false)+pcell("stair",null,"Riser height", fvL(d.riser), false)+pcell("stair",null,"Treads", d.treads!=null?d.treads:"—", false)+
  pcell("stair",null,"Total run", fvL(d.run), false)+pcell("stair",null,"Stringer", fvL(d.stringer), false)+
  '<div class="lblrow">Landing</div>'+
  pcell("stair","landRiser","At riser #", d.landRiser!=null?d.landRiser:"—", true)+pcell("stair","surface","Surface thick", fvIn(d.surface), true)+
  pcell("stair",null,"Finish height", fvL(d.landFinish), false)+pcell("stair",null,"Frame height", fvL(d.landFrame), false); }
function openRoofPop(){ renderRoofPop(); el("roofpop").classList.add("on"); }
function openStairPop(){ renderStairPop(); el("stairpop").classList.add("on"); }
function fillField(kind,field){
  if(!c.hasInput()){ toast("Type a value, then tap a field"); return; }
  var cur=c.current(), d=(kind==="roof")?roofD:stairD;
  if(kind==="roof"){ if(field==="pitch") roofSetField(d,"pitch",cur.n); else roofSetField(d,field,asInches(cur)); renderRoofPop(); }
  else {
    if(field==="rise") stairSetField(d,"rise",asInches(cur));
    else if(field==="target"||field==="tread"||field==="surface") stairSetField(d,field,(cur.dim===PB.SCALAR&&SYS==="met")?cur.n/25.4:cur.n);
    else if(field==="landRiser") stairSetField(d,"landRiser",Math.max(0,Math.round(cur.n)));
    renderStairPop();
  }
  c.clearEntry(); render();
}
function answerVal(){ if(c.hasInput()) return c.current(); var a=c.result().acc; return (a && a.n!==0) ? a : null; }
function popCellsClick(e){ var cc=e.target.closest(".cc.ed"); if(!cc) return; fillField(cc.dataset.kind, cc.dataset.f); }
el("roofcells").addEventListener("click",popCellsClick);
el("staircells").addEventListener("click",popCellsClick);

/* ---------- entry / active line display ---------- */
function entryMain(){
  var e=c.e;
  if(e.loaded && e.buf==="" && !e.hasUnit && e.num==null) return fv(e.loaded);
  if(e.hasUnit || e.num!=null){
    var s=fv({n:e.inches,dim:PB.LINEAR,u:(e.basis|| (e.num!=null?"in":null))});
    if(e.num!=null) s += " "+e.num+"/"+(e.buf||"_");
    else if(e.buf!=="") s += " +"+e.buf;
    return s;
  }
  return e.buf===""?"":e.buf;
}
function activeMain(){
  if(c.hasInput()) return entryMain();
  if(c.justEval) return fv(c.result().acc);
  return "";
}
function esc(s){return (s+"").replace(/[&<>]/g,function(ch){return{"&":"&amp;","<":"&lt;",">":"&gt;"}[ch];});}

function render(){
  var fr=c.result(), html="", idx=0;
  for(var k=0;k<c.steps.length;k++){
    var s=c.steps[k];
    if(s.sep){ html+='<div class="tline sep" data-i="'+k+'"></div>'; continue; }
    if(s.info){
      if(s.sub){ html+='<div class="tline subtotal" data-i="'+k+'"><div class="op"></div><div class="val">'+esc((s.text||"").replace(/^= /,""))+'</div><div class="note"></div><span class="cpy" title="Copy value">\u29c9</span></div>'; continue; }
      if(s.vtext){ html+='<div class="tline calcnote'+(editTarget===k?' sel':'')+'" data-i="'+k+'"><div class="op"></div><div class="val">'+esc(s.vtext)+'</div><div class="note">'+esc(s.text||"")+'</div><span class="cpy" title="Copy value">\u29c9</span></div>'; continue; }
      html+='<div class="tline prose'+(editTarget===k?' sel':'')+'" data-i="'+k+'"><div class="op"></div><div class="txt">'+esc(s.text)+'</div></div>'; continue;
    }
    idx++;
    var opSym = s.op==="+"?"+":s.op==="-"?"−":s.op==="*"?"×":"÷";
    var opShown = s.carry ? "↳" : (idx===1?"":opSym);
    var sel = editTarget===k;
    var valHtml = sel ? esc(activeMain()) : esc(fv(s.val));
    html+='<div class="tline'+(sel?' sel active caret':'')+(s.carry?' carry':'')+'" data-i="'+k+'">'+
      '<div class="op">'+opShown+'</div>'+
      '<div class="val">'+valHtml+'</div>'+
      '<div class="note">'+esc(s.note||"")+'</div>'+
      '<span class="cpy" title="Copy value">\u29c9</span></div>';
  }
  if(editTarget==null){
    var am=activeMain();
    if(c.steps.length>0 || am!==""){
      var pend = (!c.justEval && c.pendingOp && c.steps.length>0) ? ({"+":"+","-":"−","*":"×","/":"÷"}[c.pendingOp]) : "";
      html+='<div class="tline active caret">'+
        '<div class="op">'+pend+'</div><div class="val">'+esc(am)+'</div><div class="note">'+esc(window._pendingNote||"")+'</div></div>';
    }
  }
  if(html==="") html='<div class="emptytape">Tape is empty. Type a value, choose an operator, repeat.<br>Tap a line to edit it; tap <b>abc</b> to add a note.</div>';
  var atBottom = (T.tape.scrollHeight - T.tape.scrollTop - T.tape.clientHeight) < 24;
  T.tape.innerHTML=html;
  if(atBottom) T.tape.scrollTop=T.tape.scrollHeight;

  var gt=grandTotal();
  if(fr.error||gt.error){ T.grand.textContent="Error"; T.gdim.textContent=fr.error||gt.error; }
  else if(gt.mixed){ T.grand.textContent=fv(gt.last); T.gdim.textContent="mixed \u2014 last calc"; }
  else { T.grand.textContent=fv(gt.acc); T.gdim.textContent=PB.dimName(gt.acc.dim)||"Number"; }
  T.mem.style.display = c.memory? "inline-block":"none";
  if(c.memory) T.mem.textContent="M "+fv(c.memory);
  save();
}

function addInfo(text){ c.steps.push({info:true,text:text}); }
function toast(m){var t=el("toast");t.textContent=m;t.classList.add("on");clearTimeout(window._tt);window._tt=setTimeout(function(){t.classList.remove("on");},1600);}

function blockValueCount(){ var n=0; for(var i=c.steps.length-1;i>=0;i--){ var s=c.steps[i]; if(s.sep) break; if(!s.info && !s.card && s.val) n++; } return n; }
function grandTotal(){
  var res=null, start=0, err=null;
  for(var i=0;i<=c.steps.length;i++){
    if(i===c.steps.length || c.steps[i].sep){
      var seg=c.steps.slice(start,i); start=i+1;
      var has=false; for(var q=0;q<seg.length;q++){ if(seg[q].val && !seg[q].info){ has=true; break; } }
      if(!has) continue;
      var f=PB.fold(seg);
      if(f.error){ err=f.error; continue; }
      if(!res) res={n:f.acc.n,dim:f.acc.dim,u:f.acc.u};
      else { var r=PB.combine(res,"+",f.acc); if(r.error){ return {mixed:true,last:f.acc,error:err}; } res={n:r.n,dim:r.dim,u:r.u}; }
    }
  }
  return {acc:res||{n:0,dim:0}, error:err};
}
function doEquals(){
  if(c.hasInput()){ c.equals(); }
  var bc=blockValueCount();
  if(bc>=2){ var tot=c.result().acc; c.steps.push({info:true, sub:true, text:"= "+fv(tot)}); }
  if(c.steps.length>0) c.steps.push({sep:true});
  c.pendingOp="+"; c.justEval=false; c.clearEntry(); editTarget=null;
}

/* ---------- inline edit helpers ---------- */
function commitEdit(){
  if(editTarget!=null && c.steps[editTarget] && c.steps[editTarget].val && c.hasInput()){
    c.steps[editTarget].val=c.finalizeEntry();
  }
  c.clearEntry(); editTarget=null; c.justEval=true;
  if(window.recomputeChain) recomputeChain();
}
function deleteLine(i){ c.steps.splice(i,1); editTarget=null; c.clearEntry(); c.justEval=true; if(window.recomputeChain) recomputeChain(); }
function lastNotableLine(){ for(var i=c.steps.length-1;i>=0;i--){ var s=c.steps[i]; if(!s.sep && !s.info && s.val) return i; } return -1; }
function isPristineLoaded(){ var e=c.e; return !!(e.loaded && e.buf==="" && !e.hasUnit && e.num==null); }
function undoLast(){ if(c.steps.length===0) return; c.steps.pop(); while(c.steps.length && (c.steps[c.steps.length-1].sep || c.steps[c.steps.length-1].sub)) c.steps.pop(); editTarget=null; c.clearEntry(); c.justEval=true; if(window.recomputeChain) recomputeChain(); }
function deleteLineUp(){
  var i=editTarget; if(i==null) return;
  c.steps.splice(i,1);
  var j=i-1; while(j>=0 && c.steps[j] && c.steps[j].sep) j--;
  if(j>=0 && c.steps[j]){ editTarget=j; var s=c.steps[j]; if(s.val) c.loadValue(s.val); else c.clearEntry(); }
  else { editTarget=null; c.clearEntry(); c.justEval=true; }
  if(window.recomputeChain) recomputeChain();
}

/* ---------- key handler ---------- */
function isEntryKey(k){ return /^[0-9]$/.test(k) || ["dot","feet","inch","yd","m","cm","mm","frac","pm"].indexOf(k)>=0; }
function applyEntryKey(k){
  if(/^[0-9]$/.test(k)) c.inputDigit(k);
  else if(k==="dot") c.inputDot();
  else if(k==="frac") c.inputFrac();
  else if(k==="pm") c.plusminus();
  else c.inputUnit({feet:"ft",inch:"in",yd:"yd",m:"m",cm:"cm",mm:"mm"}[k]);
}
function press(k){
  if(convMode && ["yd","feet","inch","m","cm","mm"].indexOf(k)>=0){
    var u={feet:"ft",inch:"in",yd:"yd",m:"m",cm:"cm",mm:"mm"}[k];
    var rd=c.convertDisplay(u); convMode=false; c.steps.push({info:true,vtext:rd,text:"converted"}); toast(rd); render(); return;
  }
  if(editTarget!=null){
    if(k==="bk"){
      if(c.hasInput() && !isPristineLoaded()){ c.backspace(); render(); return; }
      deleteLineUp(); render(); return;
    }
    if(isPristineLoaded() && c.e.loaded.dim===PB.LINEAR && (k==="feet"||k==="inch"||k==="yd")){
      c.e.loaded.u = (k==="feet"?"ft":k==="inch"?"in":"yd"); render(); return;
    }
    if(isEntryKey(k)){ applyEntryKey(k); render(); return; }
    if(k!=="ac"){ commitEdit(); }
  } else if(k==="bk" && !c.hasInput()){
    undoLast(); render(); return;
  }
  if(/^[0-9]$/.test(k)){ c.inputDigit(k); render(); return; }
  switch(k){
    case "dot": c.inputDot(); break;
    case "feet": c.inputUnit("ft"); break;
    case "inch": c.inputUnit("in"); break;
    case "yd": c.inputUnit("yd"); break;
    case "m": c.inputUnit("m"); break;
    case "cm": c.inputUnit("cm"); break;
    case "mm": c.inputUnit("mm"); break;
    case "frac": c.inputFrac(); break;
    case "add": c.operator("+"); break;
    case "sub": c.operator("-"); break;
    case "mul": c.operator("*"); break;
    case "div": c.operator("/"); break;
    case "eq": doEquals(); break;
    case "space": doEquals(); break;
    case "pct": c.percent(); break;
    case "sqrt": { var sq=c.sqrt(); toast("\u221a = "+fv(sq)); break; }
    case "pm": c.plusminus(); break;
    case "bk": if(window._pendingNote){ window._pendingNote=window._pendingNote.slice(0,-1); break; } c.backspace(); break;
    case "ac": c.allClear(); convMode=false; window._pendingNote=""; roofD=makeRoofD(); stairD=makeStairD(); editTarget=null;
      el("roofpop").classList.remove("on"); el("stairpop").classList.remove("on"); closeNote(); break;
    case "mplus": c.memPlus(); toast("M+ "+fv(c.memory)); break;
    case "mminus": c.memMinus(); toast("M− "+fv(c.memory)); break;
    case "rcl": c.recall(); break;
    case "conv": convMode=!convMode; toast(convMode?"Convert: tap a unit":"Convert off"); break;
    case "pitch": { var v=answerVal(); if(v){ roofSetField(roofD,"pitch",v.n); c.clearEntry(); } openRoofPop(); break; }
    case "run":   { var v=answerVal(); if(v){ roofSetField(roofD,"run",asInches(v)); c.clearEntry(); } openRoofPop(); break; }
    case "rise":  { var v=answerVal(); if(v){ roofSetField(roofD,"rise",asInches(v)); c.clearEntry(); } openRoofPop(); break; }
    case "diag":  { var v=answerVal(); if(v){ roofSetField(roofD,"diag",asInches(v)); c.clearEntry(); } openRoofPop(); break; }
    case "hipv":  openRoofPop(); break;
    case "stair": { var v=answerVal(); if(v){ stairSetField(stairD,"rise",asInches(v)); c.clearEntry(); } openStairPop(); break; }
    case "circ": { var cc=c.circle(); c.steps.push({info:true,vtext:fv(cc.diam),text:"circle \u2300"}); c.steps.push({info:true,vtext:fv(cc.circ),text:"circumference"}); c.steps.push({info:true,vtext:fv(cc.area),text:"area"}); c.loadValue(cc.area); break; }
    case "bdft": { var b=c.boardFeet(); if(b.error){toast(b.error);} else { c.steps.push({info:true,vtext:PB.fmtNum(b.n),text:"board feet"}); c.loadValue(b); } break; }
  }
  render();
}
el("keys").addEventListener("pointerdown",function(e){
  var b=e.target.closest(".key"); if(!b) return; e.preventDefault();
  if(el("noteBar").classList.contains("on")) closeNote();
  b.classList.add("hit"); setTimeout(function(){b.classList.remove("hit");},90);
  press(b.dataset.k);
}, {passive:false});

/* physical keyboard */
window.addEventListener("keydown",function(e){
  if(document.activeElement===el("noteInput")) return;
  if(el("menu").classList.contains("on")) return;
  var map={"+":"add","-":"sub","*":"mul","/":"div","=":"eq","Enter":"eq",".":"dot","Backspace":"bk","%":"pct","Escape":"ac"};
  if(/^[0-9]$/.test(e.key)){ press(e.key); e.preventDefault(); }
  else if(map[e.key]){ press(map[e.key]); e.preventDefault(); }
  else if(/^[a-zA-Z '\-#]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey){
    /* text goes to the note column automatically: numerals left, words right */
    if(c.hasInput() || window._pendingNote){
      if(e.key===" " && !window._pendingNote){ /* space before any text: ignore */ }
      else { window._pendingNote+=e.key; }
      render(); e.preventDefault(); return;
    }
    if(!/^[a-zA-Z]$/.test(e.key)) return;
    var ti = (editTarget!=null && c.steps[editTarget] && c.steps[editTarget].val) ? editTarget : lastNotableLine();
    if(ti>=0 && c.steps[ti] && c.steps[ti].val){
      editTarget=ti; if(!c.hasInput()) c.loadValue(c.steps[ti].val);
      if(openNote()){ var ni=el("noteInput"); ni.value+=e.key; c.steps[ti].note=ni.value; render(); e.preventDefault(); }
    }
  }
});

/* ---------- tape tap: select / edit line ---------- */
T.tape.addEventListener("click",function(e){
  var cp=e.target.closest(".cpy");
  if(cp){
    var crow=cp.closest(".tline"); var ci=parseInt(crow.dataset.i,10); var st=c.steps[ci]; if(!st) return;
    var txt = st.sub ? (st.text||"").replace(/^= /,"") : (st.vtext ? st.vtext : (st.val ? fv(st.val) : ""));
    if(txt){ if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(txt).then(function(){toast("Copied "+txt);},function(){toast("Copy failed");}); } else toast("Copy not supported"); }
    return;
  }
  var row=e.target.closest(".tline");
  if(!row || (row.classList.contains("active") && editTarget==null)){ if(editTarget!=null){ commitEdit(); render(); } return; }
  var i=parseInt(row.dataset.i,10); if(isNaN(i)) return;
  if(editTarget!=null && editTarget!==i) commitEdit();
  editTarget=i;
  var s=c.steps[i];
  if(s && s.val) c.loadValue(s.val); else c.clearEntry();
  render();
});

/* ---------- notes (abc keyboard) ---------- */
function openNote(){
  var st = (editTarget!=null) ? c.steps[editTarget] : null;
  if(st && (st.sep || st.sub)){ toast("Pick a value or text line"); return false; }
  if(!st){
    /* nothing selected: start a fresh text line at the end of the tape, like typing in a notepad */
    c.steps.push({info:true,text:""});
    editTarget=c.steps.length-1; st=c.steps[editTarget]; render();
  }
  var ni=el("noteInput");
  ni.value = st.info ? (st.text||"") : (st.note||"");
  el("noteBar").classList.add("on"); ni.focus();
  try{ ni.setSelectionRange(ni.value.length,ni.value.length); }catch(e){}
  return true;
}
function closeNote(){ el("noteBar").classList.remove("on"); var ni=el("noteInput"); if(ni) ni.blur();
  if(editTarget!=null && c.steps[editTarget]){ var st=c.steps[editTarget];
    if(st.info && !st.sub && !st.vtext && !(st.text||"").trim()){ c.steps.splice(editTarget,1); editTarget=null; render(); } } }
el("kbBtn").addEventListener("click",openNote);
el("noteDone").addEventListener("click",closeNote);
el("noteInput").addEventListener("input",function(){
  if(editTarget!=null && c.steps[editTarget]){ var st=c.steps[editTarget];
    if(st.info) st.text=el("noteInput").value; else st.note=el("noteInput").value; render(); }
});
el("noteInput").addEventListener("keydown",function(e){ e.stopPropagation(); if(e.key==="Enter"){ closeNote(); } });

/* ---------- menu ---------- */
function segOn(segId, attr, val){ var seg=el(segId); for(var i=0;i<seg.children.length;i++){ var b=seg.children[i]; b.classList.toggle("on", b.getAttribute(attr)===String(val)); } }
function openMenu(){ segOn("unitSeg","data-u",SYS); segOn("fracSeg","data-fr",FRAC); segOn("layoutSeg","data-ly",LAYOUT); segOn("styleSeg","data-st",STYLE); segOn("paperSeg","data-pa",PAPER); el("menu").classList.add("on"); }
function closeMenu(){ el("menu").classList.remove("on"); }
el("nameBtn").addEventListener("click",openMenu);
el("menuClose").addEventListener("click",closeMenu);
el("menu").addEventListener("click",function(e){ if(e.target.id==="menu") closeMenu(); });
el("unitSeg").addEventListener("click",function(e){ var b=e.target.closest("button"); if(!b)return; SYS=b.dataset.u; saveSettings(); applySystem(); segOn("unitSeg","data-u",SYS); });
el("fracSeg").addEventListener("click",function(e){ var b=e.target.closest("button"); if(!b)return; FRAC=parseInt(b.dataset.fr,10); saveSettings(); segOn("fracSeg","data-fr",FRAC); render(); });
el("layoutSeg").addEventListener("click",function(e){ var b=e.target.closest("button"); if(!b)return; applyLayout(b.dataset.ly); saveSettings(); segOn("layoutSeg","data-ly",LAYOUT); });
el("styleSeg").addEventListener("click",function(e){ var b=e.target.closest("button"); if(!b)return; applyStyle(b.dataset.st); saveSettings(); segOn("styleSeg","data-st",STYLE); });
el("paperSeg").addEventListener("click",function(e){ var b=e.target.closest(".swatch"); if(!b)return; applyPaper(b.dataset.pa); saveSettings(); segOn("paperSeg","data-pa",PAPER); });
el("mNew").addEventListener("click",function(){ if(c.steps.length && !confirm("Start a new tape?")) return; c.allClear(); convMode=false; roofD=makeRoofD(); stairD=makeStairD(); editTarget=null; closeMenu(); render(); toast("New tape"); });
el("mSave").addEventListener("click",function(){ downloadTape(); });

/* roof/stair -> tape — one item per line */
function roofToTape(){ var d=roofD; if(d.rise==null){ toast("Enter two of pitch/run/rise/diag"); return; }
  c.steps.push({info:true,text:"ROOF \u2014 "+PB.fmtNum(d.pitch,2)+"/12 pitch, "+PB.fmtNum(d.angle,1)+"\u00b0"});
  c.steps.push({info:true,vtext:fvL(d.rise),text:"rise"});
  c.steps.push({info:true,vtext:fvL(d.run),text:"run"});
  c.steps.push({info:true,vtext:fvL(d.diag),text:"common rafter"});
  c.steps.push({info:true,vtext:fvL(d.hip),text:"hip / valley"});
  el("roofpop").classList.remove("on"); render(); toast("Sent to tape"); }
function stairToTape(){ var d=stairD; if(d.rise==null){ toast("Enter total rise"); return; }
  c.steps.push({info:true,text:"STAIRS"});
  c.steps.push({info:true,vtext:fvL(d.rise),text:"total rise"});
  c.steps.push({info:true,vtext:fvL(d.riser),text:d.n+" risers"});
  c.steps.push({info:true,vtext:fvIn(d.tread),text:d.treads+" treads"});
  c.steps.push({info:true,vtext:fvL(d.run),text:"total run"});
  c.steps.push({info:true,vtext:fvL(d.stringer),text:"stringer"});
  if(d.landFinish!=null){
    c.steps.push({info:true,vtext:fvL(d.landFinish),text:"landing finish @ riser "+d.landRiser});
    c.steps.push({info:true,vtext:fvL(d.landFrame),text:"landing frame (surface "+fvIn(d.surface)+")"});
  }
  el("stairpop").classList.remove("on"); render(); toast("Sent to tape"); }
el("roofToTape").onclick=roofToTape; el("stairToTape").onclick=stairToTape;
el("roofPopClose").onclick=function(){ el("roofpop").classList.remove("on"); };
el("stairPopClose").onclick=function(){ el("stairpop").classList.remove("on"); };

/* ---------- save .txt ---------- */
function tapeText(){
  var fr=c.result(), out=[], idx=0, W=15;
  function pad(v){ v=String(v==null?"":v); while(v.length<W) v=" "+v; return v; }
  out.push("POCKETBUILDER \u2014 TAPE"); out.push(new Date().toLocaleString()); out.push("");
  for(var k=0;k<c.steps.length;k++){ var s=c.steps[k];
    if(s.sep){ out.push(""); idx=0; continue; }
    if(s.info){
      if(s.sub){ out.push("  "+pad("--------")); out.push("  "+pad((s.text||"").replace(/^= /,""))); continue; }
      if(s.vtext){ out.push("  "+pad(s.vtext)+"   "+(s.text||"")); continue; }
      out.push(s.text||""); continue;
    }
    idx++;
    var op=s.carry?">":s.op==="+"?"+":s.op==="-"?"-":s.op==="*"?"x":"/";
    out.push((idx===1?" ":op)+" "+pad(fv(s.val))+(s.note?"   "+s.note:""));
  }
  out.push(""); out.push("TOTAL: "+(fr.error?("Error \u2014 "+fr.error):fv(fr.acc))+"  "+(PB.dimName(fr.acc.dim)||""));
  return out.join("\n");
}
function downloadTape(){
  if(c.steps.length===0){ toast("Tape is empty"); return; }
  try{ var blob=new Blob([tapeText()],{type:"text/plain"}); var a=document.createElement("a"); a.href=URL.createObjectURL(blob);
    a.download="pocketbuilder-tape.txt"; document.body.appendChild(a); a.click();
    setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(a.href);},800); toast("Tape saved"); closeMenu();
  }catch(e){ toast("Save not supported here"); }
}

/* ---------- persistence ----------
   NB: the localStorage keys ("buildtally", "bt_set", plus "bt_tabs"/"bt_kpos"
   in desktop.js) predate the PocketBuilder name and are kept as-is on purpose —
   renaming them would orphan every existing user's saved tapes and settings. */
function save(){ try{ localStorage.setItem("buildtally", JSON.stringify({steps:c.steps,mem:c.memory,roofD:roofD,stairD:stairD})); }catch(e){} }
function saveSettings(){ try{ localStorage.setItem("bt_set", JSON.stringify({SYS:SYS,FRAC:FRAC,STYLE:STYLE,PAPER:PAPER,LAYOUT:LAYOUT})); }catch(e){} }
function load(){
  try{ var st=JSON.parse(localStorage.getItem("bt_set")||"null"); if(st){ SYS=st.SYS||"imp"; FRAC=st.FRAC||16; STYLE=st.STYLE||"graphite"; PAPER=st.PAPER||"white"; LAYOUT=st.LAYOUT||"full"; } }catch(e){}
  try{ var d=JSON.parse(localStorage.getItem("buildtally")||"null"); if(d){ c.steps=d.steps||[]; c.memory=d.mem||null; c.justEval=true; if(d.roofD)roofD=d.roofD; if(d.stairD)stairD=d.stairD; } }catch(e){}
}
load(); applyStyle(STYLE); applyPaper(PAPER); applyLayout(LAYOUT); applySystem();

/* ---------- PWA: register the service worker ---------- */
(function(){
  if("serviceWorker" in navigator && location.protocol.indexOf("http")===0){
    try{ navigator.serviceWorker.register("sw.js").catch(function(){}); }catch(e){}
  }
})();
