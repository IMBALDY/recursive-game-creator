'use strict';
(() => {
 const G=WB;
 G.locale='en';
 // Numeric telemetry and gameplay identifiers remain identical to the source build.
 const event=G.event;G.event=(type,data={})=>event(type,{...data,locale:'en'});
 G.ultimateName=()=>G.p.pathRank<2?'Whitebird Crossing':G.p.path==='blood'?'Bloodrage · Severance':'Divine Blade · Ame-no-Murakumo';
 const clean=text=>String(text).replace(/[ \t]{2,}/g,' ').replace(/ +([.,;!?])/g,'$1').replace(/([.!?])([A-Z])/g,'$1 $2').replace(/(\d+(?:\s*(?:→|\/)\s*\d+)?)\s+[Rr]ank(?:\(s\))?/g,'Rank $1');
 const format=root=>{const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while(n=walker.nextNode()){const value=clean(n.textContent);if(value!==n.textContent)n.textContent=value;}};
 const modal=G.modal;G.modal=(...a)=>{modal(...a);format(G.$('#modal'));};
 new MutationObserver(()=>format(G.$('#modal'))).observe(G.$('#modal'),{childList:true,subtree:true,characterData:true});
 for(const key of ['toast','notice']){const fn=G[key];G[key]=(text,...a)=>fn(clean(text),...a);}
 const pathDescription=G.pathDescription;G.pathDescription=(...a)=>clean(pathDescription(...a)).replace(/\. Q:/g,'.\nQ:');
 const techDescription=G.techDescription;G.techDescription=(...a)=>clean(techDescription(...a));
 const relicText=G.relicText;G.relicText=(...a)=>clean(relicText(...a));
 const codexEntries=G.codexEntries;G.codexEntries=(...a)=>codexEntries(...a).map(e=>({...e,detail:clean(e.detail)}));
 const inspect=G.showItemPopover;G.showItemPopover=(...a)=>{inspect(...a);format(G.$('#itemPopover'));};
 const start=G.start;G.start=(...a)=>{start(...a);if(G.session)G.session.locale='en';};
 // Keep the full ultimate name in inspection, while its slot uses a compact label.
 const hud=G.updateHud;G.updateHud=()=>{hud();const q=G.$('[data-inspect="q"]>span:not(.item-icon)');if(q&&G.p)q.textContent=G.p.pathRank<2?'Whitebird Crossing':G.p.path==='blood'?'Bloodrage':'Ame-no-Murakumo';};
})();
