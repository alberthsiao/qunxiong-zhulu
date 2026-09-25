/* ---------- 介面 ---------- */
let mseq=0;
function modal(title,body,actions){
 mseq++;const my=mseq;$('#modal .dlg').classList.remove('wide');
 $('#modal').hidden=false;$('#m-title').textContent=title;$('#m-body').innerHTML=body;
 const ac=$('#m-actions');ac.innerHTML='';
 (actions||[{label:'確定',primary:true}]).forEach(a=>{const b=document.createElement('button');b.textContent=a.label;if(a.primary)b.className='primary';
  b.onclick=()=>{const r=a.fn?a.fn():undefined;if(r===false)return;if(mseq===my)closeModal();};ac.appendChild(b);});
 const fb=ac.querySelector('.primary')||ac.querySelector('button');fb&&fb.focus();
}
function closeModal(){$('#modal').hidden=true;}
let toastT;function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),1800);}

function validTargets(){if(!ui.mode)return[];return ADJ[ui.src].filter(n=>ui.mode==='attack'?S.cities[n].owner!==S.player:S.cities[n].owner===S.player);}

function renderMap(){
 const tg=validTargets();
 let s=`<rect width="${MAPVW}" height="${MAPVH}" fill="var(--paper)"/>`;
 s+=`<path d="${COAST} L${MAPVW},${MAPVH} L${MAPVW},0 L800,0 Z" fill="var(--sea)"/><path d="${COAST}" fill="none" stroke="var(--river)" stroke-width="1.5" opacity=".6"/>`;
 [LAND_NE,LAND_TW,...LAND_JP].forEach(d=>s+=`<path d="${d}" fill="var(--paper)" stroke="var(--river)" stroke-width="1.5" stroke-opacity=".6"/>`);
 s+=`<text class="rlabel" x="1060" y="200">東海</text><text class="rlabel" x="850" y="770">南海</text>`;
 s+=mapArtUnder();
 s+=`<path class="river" d="M120,300 C200,265 280,335 360,300 S470,250 560,285 S690,262 760,232 S840,205 872,196"/>`;
 s+=`<path class="river" d="M150,600 C220,625 285,590 345,630 S440,648 490,624 S570,602 612,606 S690,652 730,624 S800,560 850,548 S905,540 925,535"/>`;
 s+=`<text class="rlabel" x="255" y="282">黃河</text><text class="rlabel" x="360" y="668">長江</text>`;
 EDGES.forEach(e=>{const[a,b]=e.split('-');const A=S.cities[a],B=S.cities[b];s+=`<line class="edge${SEA_EDGES.includes(e)?' sea':''}" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}"/>`;});
 Object.values(S.cities).forEach(c=>{
  const cls=['city'];if(ui.sel===c.name&&!ui.mode)cls.push('sel');if(ui.src===c.name&&ui.mode)cls.push('sel');
  s+=`<g class="${cls.join(' ')}" data-c="${c.name}" transform="translate(${c.x},${c.y})" tabindex="0" role="button" aria-label="${c.name}，${fname(c.owner)}，兵力 ${fmt(c.troops)}">`;
  if(tg.includes(c.name))s+=`<rect class="ring" x="-22" y="-22" width="44" height="44" rx="6"/>`;
  const sz=sealSize(c.name);s+=`<rect class="seal-r" x="${-sz/2}" y="${-sz/2}" width="${sz}" height="${sz}" rx="4" fill="${fcolor(c.owner)}"/><text class="seal" style="font-size:${Math.round(sz*0.56)}px">${c.name[0]}</text>`;
  s+=`<text class="cname" y="33">${c.name}</text><text class="ctroops" y="47">${!S.player||visible(c.name)?wan(c.troops):'？'}</text></g>`;
 });
 $('#map').innerHTML=s;zoomApply('map');
 $('#legend').innerHTML=Object.values(S.factions).map(f=>`<span class="${f.alive?'':'gone'}"><span class="dot" style="background:${f.color}"></span>${f.name}　${citiesOf(f.id).length} 城${S.player&&f.id!==S.player&&f.alive&&friendly(S.player,f.id)?'（'+(rel(S.player,f.id).ally?'同盟':'停戰')+'）':''}</span>`).join('')+`<span><span class="dot" style="background:#8E9088"></span>無主</span>`;
}
function renderTop(){
 if(!S.player){$('#t-date').textContent=eraStr();$('#t-fac').textContent='';$('#t-res').innerHTML='';return;}
 const f=S.factions[S.player],cs=citiesOf(S.player);
 const sum=k=>cs.reduce((a,c)=>a+c[k],0);
 $('#t-date').innerHTML=eraStr()+(climateText()?`　<small class="clim">${climateText()}</small>`:'');
 $('#t-fac').innerHTML=`<span class="dot" style="background:${f.color}"></span>${f.name}軍${f.alive?`　${lordTitle(S.player)} ${lordOf(S.player).name}`:''}`;
 $('#t-res').innerHTML=`<span>城 <b>${cs.length}</b></span><span>武將 <b>${S.officers.filter(o=>o.fac===S.player).length}</b></span><span>金 <b>${fmt(sum('gold'))}</b></span><span>糧 <b>${fmt(sum('food'))}</b></span><span>兵 <b>${fmt(sum('troops'))}</b></span>`;
}
const HELP=`<h2>軍議</h2>
<p>點選地圖上己方的城池，查看城內武將並下達命令。每位武將每月可執行一次命令，安排妥當後按「結束本月」。</p>
<p class="hint">金錢來自商業，每月入帳；糧食在七月秋收，士兵每月耗糧。出征須備兵力十分之一的軍糧。</p>
<p class="hint">出征或被攻打時進入戰場地圖。每位武將各領一隊，每日可移動再下令：突擊、齊射、計略、單挑、攻城或堅守。森林、丘陵能減輕傷害，河川會加重。攻方須攻破城門再攻入本城，十五日內未能破城即撤退。也可以按「委任」讓電腦打完。</p>
<p class="hint">「搜索人才」可找到隱居本城的人才，或打聽到他處賢才的消息；按上方「人才」可搜尋、排序所有已知武將，並直接登用在野人才。</p>
<p class="hint">未與我方接壤的敵城情報不明；可用城池命令「諜報」偵察、散布流言、煽動、放火或挖角敵將。武將忠誠低於 70 會以紅字標示，容易被敵方挖角；賜予寶物可提升忠誠。</p>
<p class="hint">按上方「外交」可派使者贈禮、締結同盟、約定停戰，或請盟友共同出兵；盟友不會攻打你。</p>
<p class="hint">攻陷城池後可處置俘虜。奪下全部城池即統一天下；也可以達成劇本目標、稱帝，或在 250 年的天下大勢結算中爭取高評等。敵軍從第四個月起開始進攻。</p>
<p class="hint">戰場上可對三格內的地形放「火計」，森林會延燒、大風助燃、雨天不可；躲在森林裡且身旁無敵軍的部隊是「伏兵」，敵方看不見。圍城超過十日守軍糧盡、士氣下滑。名將各有技能，點頭像可在人物誌查看。</p>
<p class="hint">上方「政策」可頒行經濟、人事、軍事三項政策；「成就」記錄你的功業。地圖可用滾輪、拖曳或雙指縮放。</p>`;
function offTable(offs,withStatus){
 if(!offs.length)return `<p class="hint">城內無武將。</p>`;
 return `<table class="offs"><thead><tr><th>武將</th><th>統</th><th>武</th><th>智</th><th>政</th><th>魅</th>${withStatus?'<th>忠</th><th>狀態</th>':''}</tr></thead><tbody>`+
 offs.map(o=>`<tr class="${withStatus&&o.done?'done':''}"><td class="ptcell">${portrait(o,34)}<span>${o.name}${S.factions[o.fac]&&S.factions[o.fac].lord===o.id?'（君主）':''}<br><small class="itm">${rankName(o)}${itemsOf(o).length?'｜'+itemsOf(o).map(i=>i.name).join('、'):''}</small></span></td>${STATK.map(k=>`<td class="${(o.bonus||{})[k]?'bst':''}">${o[k]}</td>`).join('')}${withStatus?`<td class="${o.loy<70?'lowloy':''}">${S.factions[o.fac]&&S.factions[o.fac].lord===o.id?'—':o.loy}</td><td>${o.done?'已行動':'待命'}</td>`:''}</tr>`).join('')+`</tbody></table>`;
}
function renderPanel(){
 const p=$('#panel');
 if(!S.player){p.innerHTML=HELP;return;}
 if(ui.mode){
  const src=S.cities[ui.src];
  p.innerHTML=`<h2>${CMDS[ui.mode]}：自${src.name}</h2><p class="hint">在地圖上點選有虛線框的${ui.mode==='attack'?'相鄰敵方或無主城池':'相鄰己方城池'}。</p><button id="cancelMode">取消</button>`;
  $('#cancelMode').onclick=()=>{ui.mode=null;render();};return;
 }
 if(!ui.sel){p.innerHTML=HELP+(S.goal?`<p><b>劇本目標</b>　${goalText()}　<span class="hint">${END_YEAR} 年一月進行天下大勢結算。</span></p>`:'');return;}
 const c=S.cities[ui.sel],own=c.owner===S.player;
 let h=`<div class="phead"><span class="seal-sm" style="background:${fcolor(c.owner)}">${c.name[0]}</span><div><h2>${c.name}</h2><span class="hint">${fname(c.owner)}${c.owner&&c.owner!==S.player&&S.player?'　'+relLabel(S.player,c.owner):''}</span></div></div>`;
 h+=geoText(c.name);
 const vis=!S.player||visible(c.name);
 if(!vis){h+=`<p class="hint">情報不明。據傳兵力約 ${wan(fuzz(c))}，守將不詳。派出間諜「偵察」可取得六個月的詳細情報；與我方城池相鄰或屬於盟友的城池，情報會自動取得。</p>`;}
 else h+=`<div class="statgrid"><div><span>兵力</span>${fmt(c.troops)}</div><div><span>訓練</span>${c.train}</div><div><span>金</span>${fmt(c.gold)}</div><div><span>糧</span>${fmt(c.food)}</div><div><span>人口</span>${wan(c.pop)}</div><div><span>城防</span>${c.def}／${c.defMax}</div><div><span>農業</span>${c.farm}／${c.farmMax}</div><div><span>商業</span>${c.trade}／${c.tradeMax}</div><div><span>民忠</span><b class="${(c.ppl??60)<30?'lowloy':''}">${Math.round(c.ppl??60)}</b></div></div><p class="gearline"><span>軍備</span>${gearText(c)}</p>`;
 if(own){
  const offs=officersIn(c.name,S.player),idle=offs.filter(o=>!o.done);
  h+=`<label class="autot"><input type="checkbox" id="autoc" ${c.auto?'checked':''}> 委任太守：月底由電腦代為執行本城內政</label>`;
  const fr=freeFound(c);
  const adjOwn=ADJ[c.name].some(n=>S.cities[n].owner===S.player),adjEnemy=ADJ[c.name].some(n=>S.cities[n].owner!==S.player);
  const spyT=within2(c.name).filter(n=>S.cities[n].owner&&S.cities[n].owner!==S.player).length;
  const en={relief:c.food>=300&&(c.ppl??60)<100,spy:spyT>0,farm:c.gold>=60&&c.farm<c.farmMax,trade:c.gold>=60&&c.trade<c.tradeMax,def:c.gold>=60&&c.def<c.defMax,recruit:maxRecruit(c)>=500,train:c.train<100,gear:c.gold>=100,search:true,persuade:fr.length>0,move:adjOwn,attack:adjEnemy&&c.troops>=500};
  const sub={farm:'政治｜60 金',trade:'政治｜60 金',def:'統率｜60 金',recruit:'魅力',train:'統率',gear:'政治｜100 金起',search:'智力',persuade:'魅力',relief:'政治｜300 糧',spy:'智力',move:'武將與兵',attack:'最多三將'};
  h+=`<div class="cmds">`+Object.keys(CMDS).map(k=>`<button data-cmd="${k}" ${idle.length&&en[k]?'':'disabled'} ${k==='attack'?'class="primary"':''}>${CMDS[k]}<small>${sub[k]}</small></button>`).join('')+`</div>`;
  if(!idle.length&&offs.length)h+=`<p class="hint">本城武將本月皆已行動。</p>`;
  h+=`<h3>武將</h3><p class="hint">尚可行動 ${idle.length}／${offs.length} 人。</p>`+offTable(offs,true);
  if(fr.length)h+=`<h3>可登用的在野人才</h3><p class="hint">${fr.map(o=>o.name+(o.city!==c.name?'（'+o.city+'）':'')).join('、')}</p>`;
 }else{
  const offs=c.owner?officersIn(c.name,c.owner):[];
  if(vis)h+=`<h3>守將</h3>`+offTable(offs,false);
  if(vis&&S.intel[c.name]>S.turn)h+=`<p class="hint">偵察情報有效，剩 ${S.intel[c.name]-S.turn} 個月。</p>`;
 }
 p.innerHTML=h;
 const ac=p.querySelector('#autoc');if(ac)ac.onchange=()=>{c.auto=ac.checked;log(`${c.name}${c.auto?'委任太守代管內政':'收回委任，改為親自下令'}`);render();};
 p.querySelectorAll('[data-cmd]').forEach(b=>b.onclick=()=>{const k=b.dataset.cmd;if(k==='move'||k==='attack'){ui.mode=k;ui.src=c.name;render();}else openCmd(k);});
}
function renderLog(){$('#log').innerHTML=S.log.slice(0,40).map(l=>`<p class="${l.c}"><time>${l.t}</time>${l.m}</p>`).join('');}
function render(){renderTop();renderMap();renderPanel();renderLog();tutRender();}

function openCmd(kind,pre){
 if(kind==='spy'){openSpy();return;}
 const c=S.cities[ui.sel],st=CMD_STAT[kind];
 const idle=officersIn(c.name,S.player).filter(o=>!o.done).sort((a,b)=>b[st]-a[st]);
 let body=`<label class="fld">執行武將<select id="m-off">${idle.map(o=>`<option value="${o.id}">${o.name}（${SN[st]} ${o[st]}）</option>`).join('')}</select></label>`;
 if(kind==='recruit'){const m=maxRecruit(c);body+=`<label class="fld">徵兵數 <output id="m-av"></output><input type="range" id="m-a" min="500" max="${m}" step="500" value="${Math.min(2000,m)}"></label><p class="hint" id="m-cost"></p>`;}
 if(kind==='persuade')body+=`<label class="fld">登用對象<select id="m-tgt">${freeFound(c).map(t=>`<option value="${t.id}" ${pre===t.id?'selected':''}>${t.name}（${t.city===c.name?'本城':t.city}｜統${t.lea} 武${t.war} 智${t.int} 政${t.pol} 魅${t.cha}）</option>`).join('')}</select></label><p class="hint" id="m-pc"></p>`;
 if(DEV[kind])body+=`<p class="hint">花費 60 金。目前 ${c[DEV[kind].k]}／${c[DEV[kind].max]}，政治或統率越高，提升越多。</p>`;
 if(kind==='relief')body+=`<p class="hint">花費 300 糧。目前民忠 ${c.ppl??60}，政治越高提升越多。民忠影響稅收與人口成長，過低會發生暴動。</p>`;
 if(kind==='gear')body+=`<label class="fld">種類<select id="m-gk">${GKEYS.map(k=>`<option value="${k}" ${c.gold<GEAR[k].cost||gearOf(c)[k]>=GEAR_MAX[k]?'disabled':''}>${GEAR[k].n}（${GEAR[k].cost} 金｜庫存 ${fmt(gearOf(c)[k])}）</option>`).join('')}</select></label><p class="hint" id="m-gd"></p><p class="hint">戰馬、強弩、鐵甲看政治，一次約造 400～1,400；衝車看智力，一次 1～3 輛。出征時依兵種自動配發，裝備率越高效果越強；戰後依存活比例收回，城破時守方庫存毀損一半。調動兵力時軍備（衝車除外）按比例隨軍轉移。</p>`;
 if(kind==='train')body+=`<p class="hint">目前訓練度 ${c.train}。訓練度影響戰鬥殺傷力。</p>`;
 if(kind==='search')body+=`<p class="hint">智力越高越容易訪得在野人才，找到後會當場試著延攬。</p>`;
 modal(CMDS[kind],body,[{label:CMDS[kind],primary:true,fn:()=>{
  const o=S.officers[+$('#m-off').value];let r=null;
  if(DEV[kind])r=doDev(kind,o,c);else if(kind==='train')r=doTrain(o,c);else if(kind==='gear')r=doGear($('#m-gk').value,o,c);else if(kind==='recruit')r=doRecruit(o,c,+$('#m-a').value);
  else if(kind==='search')r=doSearch(o,c,S.player);else if(kind==='relief')r=doRelief(o,c);else if(kind==='persuade')r=doPersuade(o,S.officers[+$('#m-tgt').value],S.player);
  if(r)log(r.msg,r.cls);render();if((S.evq||[]).length)setTimeout(()=>showEvents(),0);}},{label:'取消'}]);
 if(kind==='persuade'){const upd=()=>{const o=S.officers[+$('#m-off').value],t=S.officers[+$('#m-tgt').value];$('#m-pc').textContent=`成功率約 ${Math.round(persuadeChance(o,t,S.player)*100)}%。${t.city!==c.name?'對象在鄰近城池，遣使登用成功率略低。':''}武將與君主魅力越高越容易成功。`;};$('#m-off').onchange=upd;$('#m-tgt').onchange=upd;upd();}
 if(kind==='gear'){const sel=$('#m-gk');const ok=[...sel.options].find(x=>!x.disabled);if(ok)sel.value=ok.value;const upd=()=>{const k=sel.value,o=S.officers[+$('#m-off').value];$('#m-gd').textContent=`${GEAR[k].d}。${o.name}（${SN[GEAR[k].stat]} ${o[GEAR[k].stat]}）預計可造約 ${k==='ram'?gearYield(k,o)+' 輛':fmt(500+o.pol*8)}。`;};sel.onchange=upd;$('#m-off').onchange=upd;upd();}
 if(kind==='recruit'){const upd=()=>{const a=+$('#m-a').value;$('#m-av').textContent=fmt(a);$('#m-cost').textContent=`花費 ${Math.round(a*0.15)} 金。武將魅力越高，實際徵得人數略多；新兵會拉低訓練度。`;};$('#m-a').oninput=upd;upd();}
}
function openMarch(tn){
 const src=S.cities[ui.src],t=S.cities[tn],atk=ui.mode==='attack';
 const idle=officersIn(src.name,S.player).filter(o=>!o.done).sort((a,b)=>(b.lea+b.war)-(a.lea+a.war));
 const dO=t.owner?officersIn(t.name,t.owner):[];
 const defT=atk?Math.round(src.troops*0.8/100)*100:0;
 let body='';
 if(atk&&friendly(S.player,t.owner))body+=`<p class="err">${fname(t.owner)}與我軍目前為${relLabel(S.player,t.owner)}關係。出兵將破棄盟約，其他勢力對我軍的友好度也會下降。</p>`;
 if(atk&&!visible(t.name))body+=`<p>目標 ${t.name}（${fname(t.owner)}）：情報不明，據傳守兵約 ${wan(fuzz(t))}，守將不詳。</p>`;
 else if(atk)body+=`<p>目標 ${t.name}（${fname(t.owner)}）：守兵 ${fmt(t.troops)}，訓練 ${t.train}，城防 ${t.def}${dO.length?'，守將 '+dO.map(o=>o.name).join('、'):'，無守將'}。</p>`;
 else body+=`<p>自${src.name}移往${t.name}。</p>`;
 if(atk&&marchWx(src,t)>1)body+=`<p class="hint">${[src,t].map(c=>climateOf(c)&&['flood','snow'].includes(climateOf(c))?REGN[regionOf(c)]+CLIM[climateOf(c)].n:null).filter(Boolean).filter((x,i,a)=>a.indexOf(x)===i).join('、')}，道路難行，出征軍糧 ×1.5。</p>`;
 if(atk)body+=`<p class="hint">${src.name}軍備庫：${gearText(src)}。出征時依各隊兵種自動配發，衝車最多帶十輛。</p>`;
 if(atk&&isNaval(src.name,t.name))body+=`<p class="hint">此路為水路，將進行水戰：船行水上如履平地，火攻與計略威力加強；${regionOf(src)==='north'&&!hasTrait(S.player,'seafarer')?'我軍來自北方，士卒不習水戰，突擊與齊射 −20%。':'我軍熟習水戰。'}</p>`;
 if(atk&&MIASMA.includes(t.name))body+=`<p class="err">${t.name}乃瘴癘之地，我軍士卒水土不服，開戰時將先折損一成五兵力。</p>`;
 if(atk&&isSea(src.name,t.name))body+=`<p class="hint">此為海路。${hasTrait(S.player,'seafarer')?'我軍熟習航海，不受影響。':'渡海出征軍糧加倍，開戰時士氣 −10。'}</p>`;
 if(atk&&t.owner&&traitText(t.owner).length)body+=`<p class="hint">${fname(t.owner)}特性：${(FTRAITS[t.owner]||[]).map(k=>TRAITS[k].n).join('、')}。</p>`;
 if(atk){const rf=reinfCands(S.player,t);const ter=cityTer(t.name);if(rf.length)body+=`<p class="err">${rf.map(r=>`${fname(r.a)}（${r.c.name}）`).join('、')}與守方同盟，可能派兵馳援。</p>`;if(ter!=='plain')body+=`<p class="hint">${t.name}屬${TERN[ter]}：${ter==='mount'?'山林丘陵多，騎兵難行':'有河川橫阻，渡河時受傷加重'}。</p>`;}
 body+=`<fieldset><legend>${atk?'出征武將，最多三人':'隨行武將'}</legend>`+(idle.length?idle.map((o,i)=>`<label class="chk"><input type="checkbox" value="${o.id}" ${atk&&i===0?'checked':''}> ${o.name}　統${o.lea} 武${o.war} 智${o.int}${atk?`　<small>${rankName(o)}，上限 ${wan(capOf(o))}</small> <select data-ty="${o.id}" aria-label="${o.name}的兵種">${Object.entries(UT).map(([k,v])=>`<option value="${k}" ${apt(o)===k?'selected':''}>${v.n}</option>`).join('')}</select>`:''}</label>`).join(''):'<p class="hint">沒有待命武將。</p>')+`</fieldset>`;
 body+=`<label class="fld">${atk?'出征':'移動'}兵力 <output id="m-tv"></output><input type="range" id="m-t" min="0" max="${src.troops}" step="100" value="${defT}"></label>`;
 body+=`<p class="hint" id="m-food"></p><p class="err" id="m-err"></p>`;
 modal(atk?`出征${t.name}`:`移動至${t.name}`,body,[{label:atk?'出征':'移動',primary:true,fn:()=>{
  const ids=[...document.querySelectorAll('#m-body input[type=checkbox]:checked')].map(x=>+x.value);
  const offs=ids.map(i=>S.officers[i]);const n=+$('#m-t').value;
  if(atk){
   if(!offs.length){$('#m-err').textContent='至少選一名武將領軍。';return false;}
   if(n<500){$('#m-err').textContent='出征兵力至少 500。';return false;}
   const capT=offs.reduce((a,o)=>a+capOf(o),0);if(n>capT){$('#m-err').textContent=`所選武將最多只能帶兵 ${fmt(capT)}。`;return false;}
   if(src.food<marchFood(S.player,src,t,n)){$('#m-err').textContent=`軍糧不足，需要 ${fmt(marchFood(S.player,src,t,n))}，城中只有 ${fmt(src.food)}。`;return false;}
   if(friendly(S.player,t.owner))breakPact(t.owner,'出兵攻打，');
   src.troops-=n;src.food-=marchFood(S.player,src,t,n);ui.mode=null;
   const types={};document.querySelectorAll('#m-body select[data-ty]').forEach(x=>types[+x.dataset.ty]=x.value);
   const B=setupBattle(S.player,src,t,offs,n,types);offs.forEach(o=>o.done=true);
   render();
   openBattle(B,'a',()=>{if(B.win)ui.sel=t.name;processCaptives(()=>{render();checkEnd();});});
  }else{
   if(!offs.length&&n<=0){$('#m-err').textContent='請選擇武將或兵力。';return false;}
   doMove(src,t,offs,n);log(`${offs.length?offs.map(o=>o.name).join('、')+'率':''}兵 ${fmt(n)} 自${src.name}移往${t.name}`);ui.mode=null;ui.sel=t.name;render();
  }
 }},{label:'取消',fn:()=>{ui.mode=null;render();}}]);
 const upd=()=>{const r=$('#m-t');if(atk){const ids=[...document.querySelectorAll('#m-body input[type=checkbox]:checked')].map(x=>S.officers[+x.value]);const cap=Math.min(src.troops,ids.reduce((a,o)=>a+capOf(o),0));r.max=cap;if(+r.value>cap)r.value=cap;}
  const n=+r.value;$('#m-tv').textContent=fmt(n);if(atk)$('#m-food').textContent=`需軍糧 ${fmt(marchFood(S.player,src,t,n))}（城中 ${fmt(src.food)}）。出征後城內留兵 ${fmt(src.troops-n)}。帶兵上限取決於武將官職。兵種相剋：騎兵剋弓兵、弓兵剋槍兵、槍兵剋騎兵；騎兵移動多一格但不擅山林，弓兵射程三格。`;};
 $('#m-t').oninput=upd;upd();
 if(atk)document.querySelectorAll('#m-body input[type=checkbox]').forEach(cb=>cb.onchange=()=>{const ch=document.querySelectorAll('#m-body input[type=checkbox]:checked');if(ch.length>3){cb.checked=false;$('#m-err').textContent='最多三名武將。';}else $('#m-err').textContent='';upd();});
}
