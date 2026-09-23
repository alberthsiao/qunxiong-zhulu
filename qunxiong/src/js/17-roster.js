/* ---------- 人才一覽 ---------- */
const RS={f:'mine',q:'',sort:'sum'};
function recruitHub(t){if(t.fac!==null||!t.found)return null;return citiesOf(S.player).find(c=>(c.name===t.city||ADJ[c.name].includes(t.city))&&officersIn(c.name,S.player).some(o=>!o.done))||null;}
function openRoster(){
 if(!S||!S.player)return;
 modal('人才一覽','<div id="rs"></div>',[{label:'關閉',primary:true}]);
 $('#modal .dlg').classList.add('wide');drawRoster();
}
function drawRoster(){
 const e=$('#rs');if(!e)return;
 const F={mine:'我軍',free:'在野（已發現）',enemy:'敵軍',all:'全部已知'};
 const S2={sum:'能力總和',lea:'統率',war:'武力',int:'智力',pol:'政治',cha:'魅力'};
 const hidden=S.officers.filter(o=>o.fac===null&&!o.found);
 const rumors=[...new Set(hidden.filter(o=>o.rumor).map(o=>o.city))];
 let h=`<div class="edbar"><select id="rs-f">${Object.entries(F).map(([k,v])=>`<option value="${k}" ${RS.f===k?'selected':''}>${v}</option>`).join('')}</select><select id="rs-s">${Object.entries(S2).map(([k,v])=>`<option value="${k}" ${RS.sort===k?'selected':''}>依${v}排序</option>`).join('')}</select><input type="search" id="rs-q" placeholder="搜尋武將姓名" value="${RS.q}"></div>`;
 h+=`<p class="hint">尚有 ${hidden.length} 名人才隱居未出${rumors.length?`，傳聞中的所在：${rumors.join('、')}`:''}。在己方城池執行「搜索人才」可以找到本城的隱士，也可能打聽到其他地方的消息；已發現的在野人才，可從所在城池或相鄰的己方城池登用。</p><div class="edlist" id="rs-list"></div>`;
 e.innerHTML=h;drawRosterList();
}
function drawRosterList(){
 const q=RS.q.trim();
 const known=o=>o.fac!=='gone'&&o.fac!=='captive'&&o.fac!=='unborn'&&(o.fac!==null||o.found);
 let list=S.officers.filter(o=>known(o)&&(RS.f==='all'||(RS.f==='mine'&&o.fac===S.player)||(RS.f==='free'&&o.fac===null)||(RS.f==='enemy'&&o.fac!==null&&o.fac!==S.player))&&(!q||o.name.includes(q)));
 const val=o=>RS.sort==='sum'?o.lea+o.war+o.int+o.pol+o.cha:o[RS.sort];
 list.sort((a,b)=>val(b)-val(a));
 $('#rs-list').innerHTML=list.length?`<table class="ed"><thead><tr><th>武將</th><th>勢力</th><th>所在</th><th>統</th><th>武</th><th>智</th><th>政</th><th>魅</th><th>寶物</th><th></th></tr></thead><tbody>`+list.map(o=>{
  let act='';
  if(o.fac===null){const hub=recruitHub(o);act=hub?`<button data-rec="${o.id}" data-c="${hub.name}">從${hub.name}登用</button>`:'<span class="hint">無鄰近己方城池或無待命武將</span>';}
  else if(o.fac===S.player)act=o.done?'<span class="hint">已行動</span>':'<span class="hint">待命</span>';
  return `<tr><td>${o.name}${S.factions[o.fac]&&S.factions[o.fac].lord===o.id?'（君主）':''}</td><td>${facLabel(o)}</td><td>${o.city||'—'}</td><td>${o.lea}</td><td>${o.war}</td><td>${o.int}</td><td>${o.pol}</td><td>${o.cha}</td><td><small>${itemsOf(o).map(i=>i.name).join('、')}</small></td><td>${act}</td></tr>`;}).join('')+`</tbody></table>`:`<p class="hint">${RS.f==='free'?'目前還沒有發現在野人才，到己方城池執行「搜索人才」看看。':'沒有符合條件的武將。'}</p>`;
}
$('#modal').addEventListener('input',e=>{if(e.target.id==='rs-q'){RS.q=e.target.value;drawRosterList();}});
$('#modal').addEventListener('change',e=>{if(e.target.id==='rs-f'){RS.f=e.target.value;drawRosterList();}if(e.target.id==='rs-s'){RS.sort=e.target.value;drawRosterList();}});
$('#modal').addEventListener('click',e=>{const b=e.target.closest('[data-rec]');if(!b)return;ui.sel=b.dataset.c;ui.mode=null;render();openCmd('persuade',+b.dataset.rec);});
