/* PocketBuilder engine v5 — roof solver + tape blocks + repeat-equals + unit-basis display */
(function(global){
"use strict";
var SCALAR=0, LINEAR=1, AREA=2, VOLUME=3;
var IN_PER = { ft:12, in:1, yd:36, m:39.37007874015748, cm:0.3937007874015748, mm:0.03937007874015748 };
var UP = { in:1, ft:2, yd:3 };
function pickU(x,y){ if(x&&y) return UP[x]>=UP[y]?x:y; return x||y||null; }
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){var t=a%b;a=b;b=t;}return a||1;}
function fmtFtIn(inches, denom){
  denom = denom||16;
  var sign = inches<0 ? "-" : "";
  var t = Math.abs(inches);
  var totalSub = Math.round(t*denom);
  var whole = Math.floor(totalSub/denom);
  var num = totalSub - whole*denom;
  var feet = Math.floor(whole/12);
  var inch = whole - feet*12;
  var fracStr = "";
  if(num>0){ var g=gcd(num,denom); fracStr = (num/g)+"/"+(denom/g); }
  var parts=[];
  if(feet>0) parts.push(feet+"'");
  var inchPart="";
  if(inch>0) inchPart = inch + (fracStr?(" "+fracStr):"") + '"';
  else if(fracStr) inchPart = fracStr + '"';
  else if(feet===0) inchPart = '0"';
  if(inchPart) parts.push(inchPart);
  if(parts.length===0) parts.push('0"');
  return sign + parts.join(" ");
}
function fmtInchesOnly(inches, denom){
  denom = denom||16;
  var sign = inches<0 ? "-" : "";
  var t = Math.abs(inches);
  var totalSub = Math.round(t*denom);
  var whole = Math.floor(totalSub/denom);
  var num = totalSub - whole*denom;
  var fracStr = "";
  if(num>0){ var g=gcd(num,denom); fracStr = (num/g)+"/"+(denom/g); }
  var s = whole>0 ? (whole + (fracStr?(" "+fracStr):"")) : (fracStr?fracStr:"0");
  return sign + s + '"';
}
function fmtNum(n,dp){
  if(!isFinite(n)) return "—";
  var f = (dp==null)?4:dp;
  var r = Math.round(n*Math.pow(10,f))/Math.pow(10,f);
  return r.toLocaleString(undefined,{maximumFractionDigits:f});
}
function fmtYards(inches){ return fmtNum(inches/36,3)+" yd"; }
function fmtVal(v){
  if(!v) return "0";
  switch(v.dim){
    case LINEAR: return fmtFtIn(v.n);
    case AREA:   return fmtNum(v.n/144)+" sq ft";
    case VOLUME: return fmtNum(v.n/1728)+" cu ft";
    default:     return fmtNum(v.n);
  }
}
function fmtMetric(v){
  if(!v) return "0";
  switch(v.dim){
    case LINEAR: { var m=v.n*0.0254; return Math.abs(m)<1 ? fmtNum(v.n*25.4,0)+" mm" : fmtNum(m,3)+" m"; }
    case AREA:   return fmtNum(v.n*0.00064516,3)+" m²";
    case VOLUME: return fmtNum(v.n*0.000016387064,3)+" m³";
    default:     return fmtNum(v.n);
  }
}
function dimName(d){return ["","Linear","Area","Volume"][d]||"Number";}
function combine(a, op, b){
  if(op==="+"||op==="-"){
    var da=a.dim, db=b.dim, dim;
    if(da===db) dim=da;
    else if(da===SCALAR) dim=db;
    else if(db===SCALAR) dim=da;
    else return {error:"Can't "+(op==="+"?"add":"subtract")+" "+dimName(da)+" and "+dimName(db)};
    return {n: op==="+" ? a.n+b.n : a.n-b.n, dim:dim, u:pickU(a.u,b.u)};
  }
  if(op==="*"){ var sum=a.dim+b.dim; if(sum>VOLUME) return {error:"Result exceeds volume"}; return {n:a.n*b.n, dim:sum, u:pickU(a.u,b.u)}; }
  if(op==="/"){ if(b.n===0) return {error:"Divide by zero"}; var diff=a.dim-b.dim; if(diff<0) return {error:"Can't divide "+dimName(a.dim)+" by "+dimName(b.dim)}; return {n:a.n/b.n, dim:diff, u:a.u}; }
  return {error:"bad op"};
}
function fold(steps){
  if(steps.length===0) return {acc:{n:0,dim:SCALAR}, run:[], error:null};
  var acc=null, run=[], seeded=false, err=null, errAt=-1;
  for(var i=0;i<steps.length;i++){
    var s=steps[i];
    if(s.sep){ run.push(null); acc=null; seeded=false; continue; }
    if(s.card){ run.push(acc?{n:acc.n,dim:acc.dim,u:acc.u}:null); continue; }
    if(s.info){ run.push(acc?{n:acc.n,dim:acc.dim,u:acc.u}:null); continue; }
    if(!seeded){ acc={n:s.val.n,dim:s.val.dim,u:s.val.u}; seeded=true; run.push({n:acc.n,dim:acc.dim,u:acc.u}); continue; }
    var r=combine(acc, s.op, s.val);
    if(r.error){ err=r.error; errAt=i; run.push({n:acc.n,dim:acc.dim,u:acc.u}); }
    else { acc={n:r.n,dim:r.dim,u:r.u}; run.push({n:acc.n,dim:acc.dim,u:acc.u}); }
  }
  if(!acc) acc={n:0,dim:SCALAR};
  return {acc:acc, run:run, error:err, errAt:errAt};
}
function Calc(){ this.steps=[]; this.pendingOp="+"; this.justEval=false; this.memory=null; this._newEntry(); }
Calc.prototype._newEntry=function(){ this.e={ inches:0, dim:SCALAR, buf:"", num:null, hasUnit:false, loaded:null, basis:null }; };
Calc.prototype.hasInput=function(){ var e=this.e; return e.buf!=="" || e.hasUnit || e.num!=null || e.inches!==0 || !!e.loaded; };
Calc.prototype.loadValue=function(val){ this._newEntry(); this.e.loaded={n:val.n,dim:val.dim,u:val.u}; this.justEval=false; };
Calc.prototype.finalizeEntry=function(){
  var e=this.e, inches=e.inches;
  if(e.loaded && e.buf==="" && !e.hasUnit && e.num==null) return {n:e.loaded.n, dim:e.loaded.dim, u:e.loaded.u};
  if(e.num!=null){ var den = e.buf!=="" ? parseFloat(e.buf) : 0; if(den>0) inches += e.num/den; return {n:inches, dim:LINEAR, u:(e.basis||"in")}; }
  if(e.hasUnit){ if(e.buf!=="") inches += parseFloat(e.buf); return {n:inches, dim:(e.dim===SCALAR?LINEAR:e.dim), u:e.basis}; }
  if(e.buf!=="") return {n:parseFloat(e.buf), dim:SCALAR};
  return {n:inches, dim:e.dim, u:e.basis};
};
Calc.prototype.current=function(){ return this.hasInput()? this.finalizeEntry() : fold(this.steps).acc; };
Calc.prototype._startFresh=function(){
  if(this.justEval){ if(this.steps.length){ this.steps.push({sep:true}); } this.pendingOp="+"; this.justEval=false; this._newEntry(); }
  else if(this.e.loaded){ this._newEntry(); }
};
Calc.prototype.inputDigit=function(d){ this._startFresh(); this.e.buf += d; };
Calc.prototype.inputDot=function(){ this._startFresh(); if(this.e.buf.indexOf(".")<0) this.e.buf += (this.e.buf===""?"0.":"."); };
Calc.prototype.inputUnit=function(unit){
  this._startFresh(); var e=this.e;
  if(UP[unit] && (!e.basis || UP[unit]>UP[e.basis])) e.basis=unit;   /* remember the largest imperial unit entered */
  if(e.num!=null){ var den=e.buf!==""?parseFloat(e.buf):0; if(den>0) e.inches+=e.num/den; e.num=null; e.buf=""; e.hasUnit=true; e.dim=LINEAR; return; }
  var v=e.buf!==""?parseFloat(e.buf):0; e.inches+=v*IN_PER[unit]; e.buf=""; e.hasUnit=true; e.dim=LINEAR;
};
Calc.prototype.inputFrac=function(){ if(this.e.buf!==""){ this.e.num=parseFloat(this.e.buf); this.e.buf=""; } else if(this.e.num==null){ this.e.num=0; } };
Calc.prototype.backspace=function(){ var e=this.e; if(e.loaded){ this._newEntry(); return; } if(e.buf!==""){ e.buf=e.buf.slice(0,-1); } else if(e.num!=null){ e.num=null; } else if(e.hasUnit){ this._newEntry(); } };
Calc.prototype.clearEntry=function(){ this._newEntry(); };
Calc.prototype.allClear=function(){ this.steps=[]; this.pendingOp="+"; this.justEval=false; this._newEntry(); };
Calc.prototype._commit=function(op){ if(this.hasInput()){ this.steps.push({op:this.pendingOp, val:this.finalizeEntry(), note:""}); this._newEntry(); } if(op!=null) this.pendingOp=op; };
Calc.prototype.operator=function(op){
  if(this.justEval){ this.justEval=false; this.pendingOp=op; return; }
  var e=this.e;
  if(e.loaded && e.buf==="" && !e.hasUnit && e.num==null){
    this.steps=[{op:"+", val:{n:e.loaded.n,dim:e.loaded.dim,u:e.loaded.u}, note:""}];
    this._newEntry(); this.pendingOp=op; return;
  }
  if(!this.hasInput() && this.steps.length>0){ this.pendingOp=op; return; }
  this._commit(op);
};
Calc.prototype.equals=function(){
  if(this.hasInput()){ this._commit(null); this.justEval=true; return this.result(); }
  if(this.justEval){
    var start=0;
    for(var i=this.steps.length-1;i>=0;i--){ if(this.steps[i].sep){ start=i+1; break; } }
    var vals=0, li=-1;
    for(var j=start;j<this.steps.length;j++){ var s=this.steps[j]; if(s.sep||s.info||s.card) continue; vals++; li=j; }
    if(vals>=2 && li>=0){ var L=this.steps[li]; this.steps.push({op:L.op, val:{n:L.val.n,dim:L.val.dim,u:L.val.u}, note:""}); }
    return this.result();
  }
  this.justEval=true; return this.result();
};
Calc.prototype.result=function(){ return fold(this.steps); };
Calc.prototype.spaceBreak=function(){
  if(this.hasInput()) this._commit(null);
  if(this.steps.length===0) return;
  this.steps.push({sep:true});
  this.justEval=false; this.pendingOp="+";
};
Calc.prototype.percent=function(){
  if(!this.hasInput()) return;
  var entry=this.finalizeEntry(), acc=fold(this.steps).acc, op=this.pendingOp;
  this._newEntry();
  if((op==="+"||op==="-") && this.steps.length>0){ if(acc.dim!==SCALAR){ this.e.inches=acc.n*entry.n/100; this.e.hasUnit=true; this.e.dim=acc.dim; this.e.basis=acc.u; } else this.e.buf=String(acc.n*entry.n/100); }
  else { this.e.buf=String(entry.n/100); }
};
Calc.prototype.sqrt=function(){ var v=this.current(), n=Math.sqrt(Math.abs(v.n)); var dim = v.dim===AREA?LINEAR : SCALAR; var out={n:n,dim:dim,u:(dim===LINEAR?v.u:undefined)}; this.loadValue(out); return out; };
Calc.prototype.plusminus=function(){ if(this.e.buf!==""){ this.e.buf = this.e.buf.charAt(0)==="-"?this.e.buf.slice(1):"-"+this.e.buf; } else if(this.e.hasUnit){ this.e.inches=-this.e.inches; } else if(this.e.loaded){ this.e.loaded.n=-this.e.loaded.n; } };
Calc.prototype.memPlus=function(){ var v=this.current(); if(!this.memory) this.memory={n:v.n,dim:v.dim,u:v.u}; else { var r=combine(this.memory,"+",v); if(!r.error) this.memory=r; } };
Calc.prototype.memMinus=function(){ var v=this.current(); if(!this.memory) this.memory={n:-v.n,dim:v.dim,u:v.u}; else { var r=combine(this.memory,"-",v); if(!r.error) this.memory=r; } };
Calc.prototype.recall=function(){ if(!this.memory) return; this.loadValue(this.memory); };
Calc.prototype.memClear=function(){ this.memory=null; };
Calc.prototype.convertDisplay=function(unit){
  var v=this.current();
  if(v.dim===LINEAR){ switch(unit){ case "ft": return fmtNum(v.n/12)+" ft"; case "in": return fmtNum(v.n)+" in"; case "yd": return fmtNum(v.n/36)+" yd"; case "m": return fmtNum(v.n*0.0254,4)+" m"; case "cm": return fmtNum(v.n*2.54,3)+" cm"; case "mm": return fmtNum(v.n*25.4,1)+" mm"; case "ftin": return fmtFtIn(v.n); } }
  else if(v.dim===AREA){ switch(unit){ case "yd": return fmtNum(v.n/1296,3)+" sq yd"; case "m": return fmtNum(v.n*0.00064516,3)+" sq m"; case "in": return fmtNum(v.n)+" sq in"; default: return fmtNum(v.n/144)+" sq ft"; } }
  else if(v.dim===VOLUME){ switch(unit){ case "yd": return fmtNum(v.n/46656,3)+" cu yd"; case "m": return fmtNum(v.n*0.000016387064,3)+" cu m"; default: return fmtNum(v.n/1728)+" cu ft"; } }
  return fmtNum(v.n);
};

Calc.prototype.circle=function(){ var v=this.current(); var d=v.dim===SCALAR?v.n*12:v.n; return { diam:{n:d,dim:LINEAR}, circ:{n:Math.PI*d,dim:LINEAR}, area:{n:Math.PI*(d/2)*(d/2),dim:AREA} }; };
Calc.prototype.boardFeet=function(){ var v=this.current(); if(v.dim!==VOLUME) return {error:"Bd Ft needs a volume (e.g. 2in × 6in × 8ft)"}; return {n:v.n/144, dim:SCALAR}; };
var API={ SCALAR:SCALAR,LINEAR:LINEAR,AREA:AREA,VOLUME:VOLUME, fmtFtIn:fmtFtIn,fmtInchesOnly:fmtInchesOnly,fmtYards:fmtYards,fmtNum:fmtNum,fmtVal:fmtVal,fmtMetric:fmtMetric,dimName:dimName, combine:combine,fold:fold,Calc:Calc };
if(typeof module!=="undefined"&&module.exports) module.exports=API; else global.PB=API;
})(typeof window!=="undefined"?window:globalThis);
