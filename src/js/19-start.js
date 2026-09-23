/* ---------- 開局、存讀檔 ---------- */
const START={scn:null};
function showStart(){closeModal();START.scn=null;drawStart();$('#start').hidden=false;}
function drawStart(){
 let has=hasAnySave();
 $('#b-cont').hidden=!has;
 if(!START.scn){
  $('#st-intro').textContent='選擇劇本。';
  $('#fgrid').className='sgrid';
  $('#fgrid').innerHTML=SCENARIOS.map(sc=>`<button class="scard" data-s="${sc.id}"><span class="syear">${sc.year}</span><span><b>${sc.title}</b><small>${sc.desc}</small><small>${sc.factions.length} 個勢力：${sc.factions.map(f=>f[1]).join('、')}</small></span></button>`).join('');
  document.querySelectorAll('.scard').forEach(b=>b.onclick=()=>{START.scn=b.dataset.s;drawStart();});
 }else{
  const sc=SCENARIOS.find(x=>x.id===START.scn);const tmp=initState(null,sc.id);
  $('#st-intro').innerHTML=`<b>${sc.year} 年　${sc.title}</b>　${sc.desc}選擇你要扮演的君主。<label class="chk" style="margin-left:12px"><input type="checkbox" id="st-hot" ${HOT.on?'checked':''}> 多人熱座（2～4 人輪流操作同一台裝置）</label>${HOT.on?`<span class="hint">已選 ${HOT.picks.length} 個勢力：${HOT.picks.map(f=>tmp.factions[f].name).join('、')||'—'}　<button id="st-go" class="primary" ${HOT.picks.length>=2?'':'disabled'}>開始熱座</button></span>`:''}`;
  $('#fgrid').className='fgrid';
  $('#fgrid').innerHTML=Object.values(tmp.factions).map(f=>{const cc=Object.values(tmp.cities).filter(c=>c.owner===f.id).length,oc=tmp.officers.filter(o=>o.fac===f.id).length;
   return `<button class="fcard ${HOT.on&&HOT.picks.includes(f.id)?'picked':''}" data-f="${f.id}">${portrait(tmp.officers[f.lord],46,{year:sc.year,col:f.color,lord:true})}<span>${f.name}<small>${cc} 城　${oc} 將　難度 ${f.diff}</small>${traitText(f.id).map(x=>`<small class="itm">${x}</small>`).join('')}</span></button>`;}).join('')+`<button class="fcard back" id="st-back">← 換劇本</button>`;
  document.querySelectorAll('.fcard[data-f]').forEach(b=>b.onclick=()=>{if(!HOT.on){newGame(b.dataset.f,sc.id);return;}const f=b.dataset.f;const i=HOT.picks.indexOf(f);if(i>=0)HOT.picks.splice(i,1);else if(HOT.picks.length<4)HOT.picks.push(f);drawStart();});
  const hc=$('#st-hot');if(hc)hc.onchange=()=>{HOT.on=hc.checked;HOT.picks=[];drawStart();};
  const go=$('#st-go');if(go)go.onclick=()=>{const picks=HOT.picks.slice();newGame(picks[0],sc.id);S.hot=picks;S.hotDone={};log(`多人熱座：${picks.map(f=>S.factions[f].name).join('、')}輪流操作`);render();};
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
 traitText(f).forEach(x=>log(`勢力特性　${x}`));
 S.startCities=citiesOf(f).length;S.stats={};
 S.goal=makeGoal(f);log(`劇本目標：${goalText()}`);
 S.intro={};S.officers.filter(o=>o.fac===f).forEach(o=>S.intro[o.id]=1);
 const L=lordOf(f);delete S.intro[L.id];introduce(L,'君主');showEvents();
 $('#start').hidden=true;render();
}
