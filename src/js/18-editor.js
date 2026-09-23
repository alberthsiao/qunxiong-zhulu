/* ---------- 數值編輯 ---------- */
const ED={tab:'off',fac:'all',q:'',city:null};
function facLabel(o){return o.fac==='unborn'?'未登場':o.fac===null?'在野':o.fac==='captive'?'俘虜':S.factions[o.fac]?S.factions[o.fac].name:'—';}
function openEditor(){
 if(!S||!S.player)return;
 if(!ED.city||!S.cities[ED.city])ED.city=ui.sel||Object.keys(S.cities)[0];
 modal('修改數值','<div id="ed"></div>',[{label:'存為新遊戲預設',fn:()=>{saveOverrides();return false;}},{label:'還原原始數值',fn:()=>{resetOverrides();return false;}},{label:'完成',primary:true,fn:()=>render()}]);
 $('#modal .dlg').classList.add('wide');
 drawEditor();
}
function drawEditor(){
 const e=$('#ed');if(!e)return;
 let h=`<div class="tabs"><button data-tab="off" class="${ED.tab==='off'?'on':''}">武將</button><button data-tab="city" class="${ED.tab==='city'?'on':''}">城池</button></div>`;
 if(ED.tab==='off'){
  h+=`<div class="edbar"><select id="ed-fac"><option value="all">全部勢力</option>${Object.values(S.factions).map(f=>`<option value="${f.id}" ${ED.fac===f.id?'selected':''}>${f.name}</option>`).join('')}<option value="free" ${ED.fac==='free'?'selected':''}>在野</option></select><input type="search" id="ed-q" placeholder="搜尋武將" value="${ED.q}"><span class="hint">數值範圍 1～100（不含寶物加成），輸入後立即生效。</span></div><div class="edlist" id="ed-list"></div>`;
 }else{
  const c=S.cities[ED.city];
  const F=[['gold','金'],['food','糧'],['troops','兵力'],['train','訓練（上限 100）'],['pop','人口'],['farm','農業'],['farmMax','農業上限'],['trade','商業'],['tradeMax','商業上限'],['def','城防'],['defMax','城防上限']];
  h+=`<div class="edbar"><select id="ed-city">${Object.values(S.cities).map(x=>`<option value="${x.name}" ${x.name===c.name?'selected':''}>${x.name}（${fname(x.owner)}）</option>`).join('')}</select><span class="hint">輸入後立即生效。</span></div>`;
  h+=`<div class="edgrid">`+F.map(([k,l])=>`<label>${l}<input type="number" min="0" data-ck="${k}" value="${c[k]}"></label>`).join('')+`</div>`;
 }
 e.innerHTML=h;
 if(ED.tab==='off')drawEdList();
}
function drawEdList(){
 const q=ED.q.trim();
 const list=S.officers.filter(o=>o.fac!=='gone'&&(ED.fac==='all'||(ED.fac==='free'?o.fac===null:o.fac===ED.fac))&&(!q||o.name.includes(q)));
 $('#ed-list').innerHTML=list.length?`<table class="ed"><thead><tr><th>武將</th><th>勢力</th><th>所在</th><th>統率</th><th>武力</th><th>智力</th><th>政治</th><th>魅力</th></tr></thead><tbody>`+
  list.map(o=>`<tr><td>${o.name}</td><td>${facLabel(o)}</td><td>${o.city||'—'}</td>${STATK.map(k=>`<td><input type="number" min="1" max="100" data-oid="${o.id}" data-k="${k}" value="${base(o,k)}" aria-label="${o.name}${SN[k]}"></td>`).join('')}</tr>`).join('')+`</tbody></table>`:`<p class="hint">沒有符合條件的武將。</p>`;
}
function saveOverrides(){
 const ov={};
 S.officers.forEach(o=>{const d=OFF.find(x=>x[0]===o.name);if(!d)return;const v=STATK.map(k=>base(o,k));if(v.some((x,i)=>x!==d[i+1]))ov[o.name]=v;});
 try{localStorage.setItem(OKEY,JSON.stringify(ov));toast(`已存為預設，共 ${Object.keys(ov).length} 名武將`);}catch(e){toast('這個瀏覽器無法儲存');}
}
function resetOverrides(){
 try{localStorage.removeItem(OKEY);}catch(e){}
 S.officers.forEach(o=>{const d=OFF.find(x=>x[0]===o.name);if(d)STATK.forEach((k,i)=>o[k]=d[i+1]+((o.bonus||{})[k]||0));});
 drawEditor();toast('武將數值已還原');
}
$('#modal').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b){ED.tab=b.dataset.tab;drawEditor();}});
$('#modal').addEventListener('input',e=>{
 const t=e.target;
 if(t.id==='ed-q'){ED.q=t.value;drawEdList();return;}
});
$('#modal').addEventListener('change',e=>{
 const t=e.target;
 if(t.id==='ed-fac'){ED.fac=t.value;drawEdList();return;}
 if(t.id==='ed-city'){ED.city=t.value;drawEditor();return;}
 if(t.dataset.oid){const o=S.officers[+t.dataset.oid];const v=clamp(Math.round(+t.value||1),1,100);o[t.dataset.k]=v+((o.bonus||{})[t.dataset.k]||0);t.value=v;return;}
 if(t.dataset.ck){const c=S.cities[ED.city],k=t.dataset.ck;let v=Math.max(0,Math.round(+t.value||0));
  if(k==='train')v=Math.min(100,v);
  if(k==='farm'||k==='trade'||k==='def'){v=Math.min(v,c[k+'Max']);}
  if(k.endsWith('Max')){const b=k.slice(0,-3);v=Math.max(1,v);if(c[b]>v)c[b]=v;}
  c[k]=v;if(k==='pop')c.popMax=Math.max(c.popMax,v);
  drawEditor();}
});
