/* ---------- Desktop mode: fixed keypad, growing scratchpad, tape tabs (mobile untouched) ---------- */
(function(){
  var FINE = window.matchMedia && window.matchMedia("(pointer:fine)").matches;
  if(!FINE || window.innerWidth < 640 || window.innerHeight < 480) return;  /* phones/tablets: change nothing */

  /* neutralize the fixed-canvas scaler; let the tape grow, keep the keypad fixed */
  function desk(){
    var g=document.getElementById("bt-grow-css"); if(g) g.remove();
    var css=[
      "html,body{overflow:hidden !important;}",
      "#device{transform:none !important;width:min(96vw,920px) !important;height:100dvh !important;max-height:none !important;",
      "margin:0 auto !important;border-radius:0 !important;padding:10px 16px 12px !important;}",
      "#keys{width:296px;max-width:296px;flex:0 0 auto;margin:0 10px 0 auto;--kh:24px;--kfs:11px;--kfs-s:8.5px;--kfs-op:13px;--kfs-eq:14px;--gap:4px;}","#keys .key{height:24px !important;}","#keys .padred .key,#keys .padmin .key{height:24px !important;font-size:var(--kfs) !important;}","#keys .padred .key.fn,#keys .padmin .key.fn{font-size:var(--kfs-s) !important;}","#keys .padred .key.op,#keys .padmin .key.op{font-size:var(--kfs-op) !important;}","#keys .padred .key.eq,#keys .padmin .key.eq{font-size:var(--kfs-eq) !important;}","#keys .key{border-radius:7px;}","#keys .key small{font-size:7.5px;}",
      ".chin{display:none;}",
      "#tabbar{display:flex;align-items:flex-end;gap:4px;padding:6px 10px 0;background:var(--chrome);border-bottom:1px solid var(--line);overflow-x:auto;flex:0 0 auto;}",
      "#tabbar .tab{display:flex;align-items:center;gap:8px;max-width:200px;padding:7px 12px;border-radius:9px 9px 0 0;background:#2a2e34;color:var(--keysub);",
      "font-size:12.5px;font-weight:700;cursor:pointer;white-space:nowrap;overflow:hidden;border:1px solid var(--line);border-bottom:none;flex:0 1 auto;}",
      "#tabbar .tab.on{background:var(--paper);color:var(--papertxt);}",
      "#tabbar .tab .tx{overflow:hidden;text-overflow:ellipsis;}",
      "#tabbar .tab .x{opacity:.5;padding:0 3px;flex:0 0 auto;} #tabbar .tab .x:hover{opacity:1;color:#d65a4c;}",
      "#tabbar .addtab{flex:0 0 auto;padding:5px 12px 7px;margin:0 0 3px 2px;border-radius:8px;background:var(--keyfn);color:var(--keytxt);font-weight:800;cursor:pointer;font-size:15px;border:1px solid var(--line);}"
    ].join("");
    css+=[
      /* keypad kicked out to the side (desktop option) */
      "body.kside #app{display:grid;grid-template-columns:minmax(0,1fr) 316px;grid-template-rows:auto auto minmax(0,1fr) auto auto;}",
      "body.kside header{grid-column:1/3;grid-row:1;}",
      "body.kside #tabbar{grid-column:1/3;grid-row:2;}",
      "body.kside .taparea{grid-column:1;grid-row:3;min-height:0;}",
      "body.kside .grandbar{grid-column:1;grid-row:4;}",
      "body.kside .notebar{grid-column:1;grid-row:5;}",
      "body.kside #keys{grid-column:2;grid-row:3/6;margin:0;align-self:stretch;width:316px;max-width:316px;",
      "border-left:1px solid var(--line);display:flex;flex-direction:column;justify-content:flex-start;background:var(--chrome);padding-top:6px;}"
    ].join("");
    var st=document.createElement("style"); st.id="bt-desktop-css"; st.textContent=css;
    document.head.appendChild(st);
    var dev=document.getElementById("device"); if(dev) dev.style.transform="";
    /* keypad position option in the menu (desktop only) */
    var KPOS="under";
    try{ KPOS=localStorage.getItem("bt_kpos")||"under"; }catch(e){}
    function applyKpos(){ document.body.classList.toggle("kside", KPOS==="side"); }
    applyKpos();
    try{
      var sheet=document.querySelector("#menu .sheet"), btns=sheet.querySelector(".menubtns");
      var row=document.createElement("div"); row.className="mrow";
      row.innerHTML='<div class="ml">Keypad position</div><div class="seg" id="posSeg"><button data-kp="under">Under</button><button data-kp="side">Side</button></div>';
      sheet.insertBefore(row,btns);
      var seg=row.querySelector("#posSeg");
      function paint(){ var bs=seg.querySelectorAll("button"); for(var i=0;i<bs.length;i++) bs[i].classList.toggle("on", bs[i].dataset.kp===KPOS); }
      seg.addEventListener("click",function(e){ var b=e.target.closest("button"); if(!b) return;
        KPOS=b.dataset.kp; try{ localStorage.setItem("bt_kpos",KPOS); }catch(x){} applyKpos(); paint(); });
      paint();
    }catch(e){}
  }

  /* ---- tabs: multiple scratchpads ---- */
  var tabs=[], act=0, bar=null;
  function freshTab(n){ return {name:"Tape "+n, steps:[], roofD:makeRoofD(), stairD:makeStairD()}; }
  function commitActive(){ tabs[act].steps=c.steps; tabs[act].roofD=roofD; tabs[act].stairD=stairD; }
  function persist(){ try{ localStorage.setItem("bt_tabs", JSON.stringify({tabs:tabs, act:act})); }catch(e){} }
  function loadTab(i){
    act=i; var t=tabs[i];
    c.steps=t.steps||[]; c.justEval=false; c.pendingOp="+"; c.clearEntry();
    window.roofD=t.roofD||makeRoofD(); window.stairD=t.stairD||makeStairD();
    window.editTarget=null; window.convMode=false;
    var rp=document.getElementById("roofpop"), sp=document.getElementById("stairpop");
    if(rp) rp.classList.remove("on"); if(sp) sp.classList.remove("on");
    try{ closeNote(); }catch(e){}
  }
  function switchTab(i){
    if(i===act){ return; }
    try{ if(editTarget!=null) commitEdit(); }catch(e){}
    commitActive(); loadTab(i); persist(); renderTabs(); render();
  }
  function addTab(){
    try{ if(editTarget!=null) commitEdit(); }catch(e){}
    commitActive();
    var mx=0; tabs.forEach(function(t){ var m=/^Tape (\d+)$/.exec(t.name); if(m) mx=Math.max(mx,parseInt(m[1],10)); });
    tabs.push(freshTab(mx+1));
    loadTab(tabs.length-1); persist(); renderTabs(); render(); toast("New tape tab");
  }
  function closeTab(i){
    var t=tabs[i], has=(t.steps||[]).some(function(s){ return s.val || s.info; });
    if(has && !confirm('Close "'+t.name+'"? Its tape will be lost.')) return;
    tabs.splice(i,1);
    if(tabs.length===0){ tabs.push(freshTab(1)); }
    loadTab(Math.min(i, tabs.length-1)===i && i<tabs.length ? i : Math.max(0, i-1));
    persist(); renderTabs(); render();
  }
  function renameTab(i){
    var n=prompt("Tab name:", tabs[i].name);
    if(n!=null && n.trim()!==""){ tabs[i].name=n.trim().slice(0,24); persist(); renderTabs(); }
  }
  function renderTabs(){
    if(!bar) return;
    bar.innerHTML="";
    tabs.forEach(function(t,i){
      var d=document.createElement("div"); d.className="tab"+(i===act?" on":"");
      var tx=document.createElement("span"); tx.className="tx"; tx.textContent=t.name; d.appendChild(tx);
      if(tabs.length>1){
        var x=document.createElement("span"); x.className="x"; x.textContent="✕";
        x.addEventListener("click",function(ev){ ev.stopPropagation(); closeTab(i); });
        d.appendChild(x);
      }
      d.addEventListener("click",function(){ switchTab(i); });
      d.addEventListener("dblclick",function(){ renameTab(i); });
      bar.appendChild(d);
    });
    var add=document.createElement("div"); add.className="addtab"; add.textContent="+"; add.title="New tape tab";
    add.addEventListener("click",addTab);
    bar.appendChild(add);
  }

  function boot(){
    desk();
    /* restore tabs; migrate the current single tape into Tab 1 on first run */
    try{
      var d=JSON.parse(localStorage.getItem("bt_tabs")||"null");
      if(d && d.tabs && d.tabs.length){ tabs=d.tabs; act=Math.min(d.act||0, tabs.length-1); }
    }catch(e){}
    if(tabs.length===0){ tabs=[{name:"Tape 1", steps:c.steps, roofD:roofD, stairD:stairD}]; act=0; }
    else { loadTab(act); }
    var app=document.getElementById("app"), tap=document.querySelector(".taparea");
    if(app && tap){ bar=document.createElement("div"); bar.id="tabbar"; app.insertBefore(bar, tap); }
    renderTabs();
    /* keep the active tab persisted on every save */
    var origSave=save;
    window.save=function(){ origSave(); commitActive(); persist(); };
    render();
  }
  if(document.readyState!=="loading") boot(); else document.addEventListener("DOMContentLoaded", boot);
})();
