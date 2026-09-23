/* ---------- 地圖縮放與拖曳（滑鼠滾輪、拖曳、雙指縮放），大地圖與戰場共用 ---------- */
const ZOOM={map:{W:MAPVW,H:MAPVH,x:0,y:0,s:1},bmap:{W:MAPW,H:MAPH,x:0,y:0,s:1},suppress:false,pts:new Map(),drag:null};
function zoomApply(id){
 const z=ZOOM[id],svg=document.getElementById(id);if(!svg)return;
 z.s=clamp(z.s,1,4);const w=z.W/z.s,h=z.H/z.s;z.x=clamp(z.x,0,z.W-w);z.y=clamp(z.y,0,z.H-h);
 svg.setAttribute('viewBox',`${z.x.toFixed(1)} ${z.y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`);
 const wrap=svg.parentElement;if(wrap&&!wrap.querySelector('.zoomctl')){const d=document.createElement('div');d.className='zoomctl';d.innerHTML=`<button data-z="in" aria-label="放大">＋</button><button data-z="out" aria-label="縮小">－</button><button data-z="reset" aria-label="重設">⟲</button>`;d.addEventListener('click',e=>{const b=e.target.closest('[data-z]');if(!b)return;e.stopPropagation();const k=b.dataset.z;if(k==='reset'){z.s=1;z.x=0;z.y=0;}else zoomAt(id,k==='in'?1.4:1/1.4,null);zoomApply(id);});wrap.appendChild(d);}
}
function zoomAt(id,f,pt){
 const z=ZOOM[id];const ns=clamp(z.s*f,1,4);if(ns===z.s)return;
 const w0=z.W/z.s,h0=z.H/z.s,w1=z.W/ns,h1=z.H/ns;
 const px=pt?pt.x:0.5,py=pt?pt.y:0.5;
 z.x=z.x+(w0-w1)*px;z.y=z.y+(h0-h1)*py;z.s=ns;
}
function zoomRel(svg,e){const r=svg.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height,r};}
function zoomTarget(e){const svg=e.target.closest&&e.target.closest('svg#map,svg#bmap');return svg?svg.id:null;}
document.addEventListener('wheel',e=>{const id=zoomTarget(e);if(!id)return;e.preventDefault();const svg=document.getElementById(id);const p=zoomRel(svg,e);zoomAt(id,e.deltaY<0?1.15:1/1.15,p);zoomApply(id);},{passive:false});
document.addEventListener('pointerdown',e=>{const id=zoomTarget(e);if(!id)return;ZOOM.pts.set(e.pointerId,{x:e.clientX,y:e.clientY,id});if(ZOOM.pts.size===1)ZOOM.drag={id,x:e.clientX,y:e.clientY,moved:false};});
document.addEventListener('pointermove',e=>{
 if(!ZOOM.pts.has(e.pointerId))return;const prev=ZOOM.pts.get(e.pointerId);ZOOM.pts.set(e.pointerId,{x:e.clientX,y:e.clientY,id:prev.id});
 const id=prev.id,z=ZOOM[id],svg=document.getElementById(id);if(!svg)return;const r=svg.getBoundingClientRect();
 if(ZOOM.pts.size===2){const[a,b]=[...ZOOM.pts.values()];if(!ZOOM.pinch){ZOOM.pinch={d:Math.hypot(a.x-b.x,a.y-b.y),s:z.s};}
  const d=Math.hypot(a.x-b.x,a.y-b.y);const mid={x:((a.x+b.x)/2-r.left)/r.width,y:((a.y+b.y)/2-r.top)/r.height};const f=(ZOOM.pinch.s*d/ZOOM.pinch.d)/z.s;zoomAt(id,f,mid);zoomApply(id);ZOOM.drag&&(ZOOM.drag.moved=true);return;}
 if(ZOOM.drag&&ZOOM.drag.id===id&&ZOOM.pts.size===1){const dx=e.clientX-prev.x,dy=e.clientY-prev.y;if(Math.hypot(e.clientX-ZOOM.drag.x,e.clientY-ZOOM.drag.y)>8)ZOOM.drag.moved=true;if(ZOOM.drag.moved&&z.s>1){z.x-=dx*(z.W/z.s)/r.width;z.y-=dy*(z.H/z.s)/r.height;zoomApply(id);}}
});
function zoomEnd(e){if(!ZOOM.pts.has(e.pointerId))return;ZOOM.pts.delete(e.pointerId);if(ZOOM.pts.size<2)ZOOM.pinch=null;if(ZOOM.pts.size===0){if(ZOOM.drag&&ZOOM.drag.moved)ZOOM.suppress=true;ZOOM.drag=null;}}
document.addEventListener('pointerup',zoomEnd);document.addEventListener('pointercancel',zoomEnd);
document.addEventListener('click',e=>{if(ZOOM.suppress){ZOOM.suppress=false;if(zoomTarget(e)){e.stopPropagation();e.preventDefault();}}},true);
