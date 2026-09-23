/* ---------- 自動模擬：電腦接管包含玩家在內的所有勢力，連續推進數月 ---------- */
/* SIM.on 為真時：攻打玩家城池的戰鬥直接快速結算（見 06-ai.js），事件取第一個選項，外交提議依友好度決定，俘虜自動嘗試登用 */
const SIM={on:false,stop:false,left:0,total:0,delay:120,start:null,hist:[]};
function simSnapshot(){const o={};Object.values(S.factions).forEach(f=>o[f.id]=f.alive?citiesOf(f.id).length:0);return o;}
function simAutoChoices(){
 (S.evq||[]).splice(0).forEach(e=>{const c=(e.choices||[]).find(x=>x.primary)||(e.choices||[])[0];if(c&&c.fn)c.fn();});
 S.proposals.splice(0).forEach(p=>{if(!S.factions[p.f].alive||friendly(S.player,p.f))return;const r=rel(S.player,p.f),fn=S.factions[p.f].name;
  if(r.trust>=45){if(p.kind==='ally'){r.ally=true;r.trust=clamp(r.trust+10,0,100);log(`與${fn}締結同盟`,'good');}else{r.truce=S.turn+12;log(`與${fn}約定停戰一年`,'good');}}
  else{r.trust=clamp(r.trust-5,0,100);log(`回絕了${fn}的提議`);}});
 const lord=S.factions[S.player].alive?lordOf(S.player):null;const p=lord?clamp(0.3+(lord.cha-70)/100,0.1,0.85):0;
 S.pending.splice(0).forEach(id=>{const o=S.officers[id];if(o.fac!=='captive')return;
  if(o._lord){o.fac='gone';o.city=null;log(`${o.name}獲釋後隱居山林`);}
  else if(Math.random()<p){o.fac=S.player;o.done=true;o.loy=60;log(`${o.name}歸順${fname(S.player)}`,'good');}
  else{o.fac=null;o.found=true;log(`${o.name}拒絕歸順，隱居於${o.city}`);}
  delete o._lord;});
}
/* 推進一個月，不開任何視窗。回傳 false 表示遊戲已結束（玩家滅亡或天下一統） */
function simMonth(){
 ui.mode=null;S.incoming=[];S.hotDone={};
 for(const f of shuffle(Object.keys(S.factions))){if(S.factions[f].alive)aiTurn(f);}
 aiPolicy(S.player);
 checkFactions();simAutoChoices();
 if(!S.factions[S.player].alive||citiesOf(S.player).length===Object.keys(S.cities).length)return false;
 advanceMonth();
 simAutoChoices();
 return true;
}
function openSim(){
 if(!S||!S.player||S.over||SIM.on)return;
 modal('自動模擬',`<p>由電腦接管<b>包含我軍在內</b>的所有勢力，連續推進時間。我軍的內政、出兵、守城、外交提議、俘虜處置與歷史事件都會自動處理，戰鬥一律快速結算。</p>
  <p class="hint">模擬途中可以隨時停止，停止後從當下的局勢接手繼續玩。想保留現在的局面，請先到「存讀檔」存檔。</p>
  <div class="edbar"><label>模擬 <select id="sim-n"><option value="6">半年</option><option value="12" selected>一年</option><option value="36">三年</option><option value="60">五年</option><option value="120">十年</option><option value="600">直到分出勝負</option></select></label>
  <label>速度 <select id="sim-sp"><option value="400">慢（看得清每月變化）</option><option value="120" selected>中</option><option value="0">快</option></select></label></div>`,
  [{label:'開始模擬',primary:true,fn:()=>{const n=+$('#sim-n').value,sp=+$('#sim-sp').value;setTimeout(()=>startSim(n,sp),0);}},{label:'取消'}]);
}
function startSim(n,delay){
 Object.assign(SIM,{on:true,stop:false,left:n,total:n,delay,start:simSnapshot(),startDate:eraStr(),hist:[]});
 modal('自動模擬中','<div id="sim-box"></div>',[{label:'停止',primary:true,fn:()=>{SIM.stop=true;return false;}}]);
 $('#modal .dlg').classList.add('wide');
 simTick();
}
function simTick(){
 let alive=true;
 try{alive=simMonth();}catch(e){SIM.on=false;render();modal('自動模擬中斷',`<p class="err">模擬時發生錯誤，已停在 ${eraStr()}。</p><p class="hint">${String(e&&e.message||e)}</p>`);throw e;}
 SIM.left--;
 render();drawSim();
 if(!alive||SIM.stop||SIM.left<=0){endSim(alive);return;}
 setTimeout(simTick,SIM.delay);
}
function simRows(){
 const now=simSnapshot(),tot=Object.keys(S.cities).length;
 return Object.values(S.factions).filter(f=>now[f.id]||SIM.start[f.id]).sort((a,b)=>now[b.id]-now[a.id]||SIM.start[b.id]-SIM.start[a.id]).map(f=>{
  const a=SIM.start[f.id]||0,b=now[f.id],d=b-a;
  return `<tr class="${f.alive?'':'gone'}"><td><span class="dot" style="background:${f.color}"></span>${f.name}${f.id===S.player?'（我軍）':''}</td><td class="num">${a}</td><td class="num">${f.alive?b:'亡'}</td><td class="num ${d>0?'good':d<0?'bad':''}">${d>0?'+'+d:d||''}</td><td><div class="tbar simbar"><i style="width:${(b/tot*100).toFixed(1)}%;background:${f.color}"></i></div></td><td class="num">${f.alive?wan(power(f.id)):''}</td></tr>`;}).join('');
}
function drawSim(){
 const box=$('#sim-box');if(!box)return;
 const done=SIM.total-SIM.left;
 box.innerHTML=`<p><b>${eraStr()}</b>　<span class="hint">自 ${SIM.startDate} 起已模擬 ${done} 個月${SIM.total<600?`，共 ${SIM.total} 個月`:''}${climateText()?'　'+climateText():''}</span></p>
  <div class="edlist"><table class="ed sim"><thead><tr><th>勢力</th><th>開始</th><th>現在</th><th>增減</th><th>版圖</th><th>兵力</th></tr></thead><tbody>${simRows()}</tbody></table></div>
  <div class="blog simlog">${S.log.slice(0,8).map(l=>`<p class="${l.c}"><small>${l.t}</small>　${l.m}</p>`).join('')}</div>`;
}
function endSim(alive){
 SIM.on=false;S.officers.forEach(o=>{if(o.fac===S.player)o.done=false;});
 const done=SIM.total-SIM.left;render();
 if(!alive){closeModal();checkEnd();return;}
 const body=`<p>自 ${SIM.startDate} 模擬了 ${done} 個月，現在是 <b>${eraStr()}</b>。${SIM.stop?'（已手動停止）':''}接下來由你接手。</p><div class="edlist"><table class="ed sim"><thead><tr><th>勢力</th><th>開始</th><th>現在</th><th>增減</th><th>版圖</th><th>兵力</th></tr></thead><tbody>${simRows()}</tbody></table></div>`;
 modal('模擬結束',body,[{label:'接手',primary:true},{label:'再模擬一次',fn:()=>{setTimeout(openSim,0);}}]);
 $('#modal .dlg').classList.add('wide');
}
$('#b-sim').onclick=openSim;
