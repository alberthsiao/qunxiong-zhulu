/* ---------- 開局、存讀檔 ---------- */
const START={scn:null};
function showStart(){closeModal();START.scn=null;drawStart();$('#start').hidden=false;}
function drawStart(){
 let has=[1,2,3].some(i=>readSlot(i));
 $('#b-cont').hidden=!has;
 if(!START.scn){
  $('#st-intro').textContent='選擇劇本。';
  $('#fgrid').className='sgrid';
  $('#fgrid').innerHTML=SCENARIOS.map(sc=>`<button class="scard" data-s="${sc.id}"><span class="syear">${sc.year}</span><span><b>${sc.title}</b><small>${sc.desc}</small><small>${sc.factions.length} 個勢力：${sc.factions.map(f=>f[1]).join('、')}</small></span></button>`).join('');
  document.querySelectorAll('.scard').forEach(b=>b.onclick=()=>{START.scn=b.dataset.s;drawStart();});
 }else{
  const sc=SCENARIOS.find(x=>x.id===START.scn);const tmp=initState(null,sc.id);
  $('#st-intro').innerHTML=`<b>${sc.year} 年　${sc.title}</b>　${sc.desc}選擇你要扮演的君主。`;
  $('#fgrid').className='fgrid';
  $('#fgrid').innerHTML=Object.values(tmp.factions).map(f=>{const cc=Object.values(tmp.cities).filter(c=>c.owner===f.id).length,oc=tmp.officers.filter(o=>o.fac===f.id).length;
   return `<button class="fcard" data-f="${f.id}"><span class="seal-sm" style="background:${f.color}">${f.name[0]}</span><span>${f.name}<small>${cc} 城　${oc} 將　難度 ${f.diff}</small></span></button>`;}).join('')+`<button class="fcard back" id="st-back">← 換劇本</button>`;
  document.querySelectorAll('.fcard[data-f]').forEach(b=>b.onclick=()=>newGame(b.dataset.f,sc.id));
  $('#st-back').onclick=()=>{START.scn=null;drawStart();};
 }
 const first=$('#fgrid button');first&&first.focus();
}
function newGame(f,scn){
 S=initState(f,scn);ui={sel:null,mode:null,src:null};
 ui.sel=lordOf(f).city;
 const sc=SCENARIOS.find(x=>x.id===S.scn);
 log(`${sc.title}：${sc.desc}`);
 log(`${S.factions[f].name}立志逐鹿天下`,'good');
 $('#start').hidden=true;render();
}
