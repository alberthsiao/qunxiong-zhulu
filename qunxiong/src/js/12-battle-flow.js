/* ---------- 戰場流程 ---------- */
function openBattle(B,side,done){
 if(!B.map)initMap(B);
 BT={B,side,done,sel:null,cmd:null,R:null,undo:null,busy:false,auto:false,info:null};
 $('#battle').hidden=false;
 if(B.over){drawBattle();return;}
 runDay();
}
function selU(){return BT&&BT.sel?BT.B.units.find(u=>u.id===BT.sel&&!u.dead):null;}
function autoSelect(){const u=alive(BT.B,BT.side).find(x=>!x.done);BT.sel=u?u.id:null;BT.cmd=null;BT.R=u&&!u.moved?reach(BT.B,u):null;}
async function runDay(){
 const B=BT.B;
 while(!B.over){
  if(B.phase==null){B.loss={a:0,d:0};bl(B,`第 ${B.day} 日`,'day');drawBattle();banner(`第 ${B.day} 日`);await fxWait(800);beginPhase(B,'a');}
  if(B.phase===BT.side&&!BT.auto){autoSelect();drawBattle();return;}
  await aiPhase(B,B.phase);
  if(B.over)break;
  endPhase(B,B.phase);
  if(B.phase==='a')beginPhase(B,'d');else{endDay(B);B.phase=null;}
 }
 BT.busy=false;BT.sel=null;BT.cmd=null;BT.R=null;drawBattle();
 const pw=(BT.side==='a')===B.win;banner(B.win?`${B.city}陷落`:(B.day>B.maxDay?'攻方撤退':'擊退敵軍'),pw?'win':'lose');
}
async function aiPhase(B,s){
 BT.busy=true;drawBattle();
 const order=alive(B,s).filter(u=>!u.done).sort((a,b)=>s==='a'?b.pos[0]-a.pos[0]:0);
 for(const u of order){
  if(B.over)break;if(u.dead||u.done)continue;
  const plan=aiPlan(B,u);
  BT.sel=u.id;drawBattle();
  const path=pathTo(plan.R,plan.to);await animMove(u,path);u.pos=pk(plan.to);u.moved=true;
  if(checkMap(B))break;
  drawBattle();
  const opts={};
  if(plan.cmd==='duel'&&!BT.auto){const t=B.units.find(x=>x.id===plan.tid);if(t&&t.side===BT.side){banner('敵將叫陣','duel');await fxWait(600);if(await askDuel(u,t))opts.res=await runDuel(B,t,u);else opts.refused=true;}}
  const ev=mapAct(B,u,plan.cmd,plan.tid,opts);await playEv(B,ev);
 }
 BT.sel=null;BT.busy=false;drawBattle();
}
async function playerMove(u,k){
 const B=BT.B;BT.busy=true;BT.undo={id:u.id,pos:u.pos.slice()};
 const path=pathTo(BT.R,k);await animMove(u,path);u.pos=pk(k);u.moved=true;BT.R=null;BT.busy=false;
 checkMap(B);if(B.over){runDay();return;}drawBattle();
}
async function playerAct(u,cmd,tid){
 const B=BT.B;BT.busy=true;BT.cmd=null;BT.undo=null;drawBattle();
 const opts={};
 if(cmd==='duel'){const t=B.units.find(x=>x.id===tid);if(!duelAccept(u,t))opts.refused=true;else{banner('陣前單挑','duel');await fxWait(700);opts.res=await runDuel(B,u,t);}}
 const ev=mapAct(B,u,cmd,tid,opts);await playEv(B,ev);BT.busy=false;
 if(B.over){runDay();return;}
 if(!alive(B,BT.side).some(x=>!x.done)){endPlayerPhase();return;}
 autoSelect();drawBattle();
}
function endPlayerPhase(){const B=BT.B;BT.sel=null;BT.cmd=null;BT.R=null;BT.undo=null;alive(B,BT.side).forEach(u=>u.done=true);endPhase(B,BT.side);if(BT.side==='a')beginPhase(B,'d');else{endDay(B);B.phase=null;}runDay();}

const ACTS=[['charge','突擊','相鄰'],['volley','齊射','兩格內'],['strat','計略','三格內'],['duel','單挑','相鄰武將'],['siege','攻城','相鄰城門'],['guard','堅守','傷害減半'],['wait','待命','']];
function curTargets(){const B=BT.B,u=selU();if(!u||!BT.cmd)return[];if(BT.cmd==='siege')return gatesAdj(B,u);return targetsFor(B,u,BT.cmd).map(t=>t.id);}
function unitInfo(B,u){const col=fcolor(u.side==='a'?B.f:B.df);const its=u.off!=null?itemsOf(S.officers[u.off]).map(i=>i.name).join('、'):'';return (its?'':'')+`<div class="uhead"><span class="seal-sm" style="background:${col}">${u.name[0]}</span><div><b>${u.name}</b>　<small>${u.side===BT.side?'我軍':'敵軍'}</small><br><small>${UT[u.type].n}　統${u.lea} 武${u.war} 智${u.int}</small></div></div><p class="hint">兵力 ${fmt(u.troops)}／${fmt(u.max)}　${TER[B.T[hk(...u.pos)]].n}${u.conf?'　混亂中':''}${u.guard?'　堅守中':''}</p>${its?`<p class="hint">寶物：${its}</p>`:''}`;}
function panelHTML(){
 const B=BT.B;
 if(B.over)return `<p class="hint">戰鬥結束。</p>`;
 if(B.phase!==BT.side||BT.auto)return `<p class="hint">敵軍行動中……</p>`+(selU()?unitInfo(B,selU()):'');
 const u=selU();const info=BT.info&&B.units.find(x=>x.id===BT.info&&!x.dead);
 const left=alive(B,BT.side).filter(x=>!x.done).length;
 let h=`<p class="hint">我方行動，尚有 ${left} 隊未行動。</p>`;
 if(!u)h+=`<p>點選我方部隊。</p>`;
 else{
  h+=unitInfo(B,u);
  if(u.done)h+=`<p class="hint">本日已行動。</p>`;
  else if(BT.cmd){
   const tl=curTargets();
   h+=`<p>選擇${ACTS.find(a=>a[0]===BT.cmd)[1]}目標（也可以直接點地圖）：</p><div class="tlist">`+tl.map(id=>{
    if(BT.cmd==='siege')return `<button data-t="${id}">城門（耐久 ${B.gates[id]}）</button>`;
    const t=B.units.find(x=>x.id===id);const m=BT.cmd==='charge'||BT.cmd==='volley'?tm(u,t):1;let ex=`${UT[t.type].n}，兵 ${fmt(t.troops)}，${TER[B.T[hk(...t.pos)]].n}${m>1?'，兵種有利':m<1?'，兵種不利':''}`;
    if(BT.cmd==='strat')ex=`成功約 ${Math.round(stratChance(u,t)*100)}%`;
    if(BT.cmd==='duel'){const o=duelOdds(u,t);ex=`武力 ${t.war}，${o>=0.65?'我方佔優':o>=0.4?'勢均力敵':'我方劣勢'}，可能避戰`;}
    return `<button data-t="${id}">${t.name}（${ex}）</button>`;}).join('')+`<button data-a="cancel">取消</button></div>`;
  }else{
   h+=`<p class="hint">${u.moved?'已移動，請下令。':'藍色格子可移動；也可以原地下令。'}</p><div class="bc">`+ACTS.filter(a=>a[0]!=='siege'||u.side==='a').map(([k,l,sub])=>{
    const n=k==='siege'?gatesAdj(B,u).length:['guard','wait'].includes(k)?1:targetsFor(B,u,k).length;
    return `<button data-a="${k}" ${n?'':'disabled'}>${l}<small>${sub}</small></button>`;}).join('')+`</div>`;
   if(u.moved&&BT.undo&&BT.undo.id===u.id)h+=`<button data-a="undo" class="undo">取消移動</button>`;
  }
 }
 if(info&&info!==u)h+=`<hr>`+unitInfo(B,info);
 return h;
}
function mapSVG(){
 const B=BT.B,u=selU();
 const mine=B.phase===BT.side&&!BT.busy&&!BT.auto&&!B.over;
 const dest=mine&&u&&!u.moved&&!u.done&&BT.R&&!BT.cmd?BT.R.dest:null;
 const tg=new Set(mine?curTargets().map(id=>id.includes(',')?id:hk(...B.units.find(x=>x.id===id).pos)):[]);
 let s='';
 for(let r=0;r<MH;r++)for(let c=0;c<MW;c++){
  const k=hk(c,r),t=B.T[k],{x,y}=hxy(c,r);
  const mv=dest&&dest.has(k)&&k!==hk(...u.pos),isT=tg.has(k);
  s+=`<g class="hx t-${t}" data-k="${k}"${(mv||isT)?' tabindex="0" role="button"':''}><polygon points="${hexPts(x,y)}"/>`;
  if(t==='forest')s+=`<circle class="gl" cx="${x-7}" cy="${y+3}" r="6"/><circle class="gl" cx="${x+7}" cy="${y+3}" r="6"/><circle class="gl" cx="${x}" cy="${y-6}" r="6"/>`;
  else if(t==='hill')s+=`<path class="gl2" d="M${x-14},${y+7} Q${x-5},${y-8} ${x+4},${y+7} M${x-2},${y+2} Q${x+7},${y-10} ${x+15},${y+5}"/>`;
  else if(t==='mount')s+=`<path class="gl" d="M${x-16},${y+10} L${x-3},${y-12} L${x+4},${y} L${x+9},${y-6} L${x+17},${y+10} Z"/>`;
  else if(t==='river')s+=`<path class="gl2" d="M${x-16},${y-3} q8,-6 16,0 t16,0 M${x-16},${y+6} q8,-6 16,0 t16,0"/>`;
  else if(t==='gate')s+=`<text class="gt" x="${x}" y="${y}">門</text><text class="gh" x="${x}" y="${y+15}">${B.gates[k]}</text>`;
  else if(t==='breach')s+=`<text class="gh" x="${x}" y="${y+4}">破</text>`;
  else if(t==='core')s+=`<path class="flag" d="M${x-6},${y+12} L${x-6},${y-13} L${x+10},${y-7} L${x-6},${y-1}"/>`;
  if(mv)s+=`<polygon class="ov mv" points="${hexPts(x,y)}"/>`;
  if(isT)s+=`<polygon class="ov tg" points="${hexPts(x,y)}"/>`;
  s+=`</g>`;
 }
 B.units.filter(x=>!x.dead).forEach(x=>{
  const{x:px,y:py}=hxy(...x.pos);const col=fcolor(x.side==='a'?B.f:B.df);
  const own=x.side===BT.side;
  s+=`<g class="tok${x.id===BT.sel?' sel':''}${own&&x.done&&B.phase===BT.side?' done':''}" data-u="${x.id}" transform="translate(${px},${py})" tabindex="0" role="button" aria-label="${x.name}隊，兵力 ${fmt(x.troops)}">
   <rect class="tb" x="-17" y="-19" width="34" height="34" rx="4" fill="${col}"/><text class="tc" y="-2">${x.name[0]}</text>
   <rect class="hpb" x="-17" y="18" width="34" height="4"/><rect x="-17" y="18" width="${Math.max(1,34*x.troops/x.max).toFixed(1)}" height="4" fill="${col}"/>
   <text class="ut" x="-16" y="-12">${x.type}</text>${x.conf?'<text class="st" x="16" y="-14">亂</text>':''}${x.guard?'<text class="st" x="16" y="-14">守</text>':''}</g>`;
 });
 return s;
}
function drawBattle(){
 const{B,side}=BT;
 const col=s=>fcolor(s==='a'?B.f:B.df);
 const mb=s=>`<div><small>${s==='a'?'攻':'守'}　${fname(s==='a'?B.f:B.df)}　兵 ${fmt(alive(B,s).reduce((a,u)=>a+u.troops,0))}　士氣 ${B.morale[s]}</small><div class="mbar ${s}"><i style="width:${B.morale[s]}%;background:${col(s)}"></i></div></div>`;
 let h=`<div class="bhd"><h2>${B.city}之戰</h2><span>第 ${Math.min(B.day,B.maxDay)} 日／${B.maxDay} 日</span><span class="hint">你指揮${side==='a'?'攻方：攻破城門後攻入中央本城，或殲滅守軍':'守方：守住本城直到攻方撤退'}。</span></div>`;
 h+=`<div class="morale">${mb('a')}<span></span>${mb('d')}</div>`;
 h+=`<div class="bgrid"><div class="bmapwrap"><svg id="bmap" viewBox="0 0 ${MAPW} ${MAPH}" role="img" aria-label="戰場地圖">${mapSVG()}</svg><div class="fxl" id="fxl"></div></div><div class="bpanel">${panelHTML()}</div></div>`;
 h+=`<div class="tlegend"><span><i class="sw t-plain"></i>平原</span><span><i class="sw t-forest"></i>森林：受傷減輕</span><span><i class="sw t-hill"></i>丘陵：受傷大減，難行</span><span><i class="sw t-river"></i>河川：受傷加重，難行</span><span><i class="sw t-mount"></i>峻嶺：不可通行</span><span><i class="sw t-gate"></i>城門：攻破後可入城</span></div>`;
 if(B.over){const pw=(side==='a')===B.win;h+=`<p class="result ${pw?'good':'bad'}">${pw?'我軍勝利':'我軍敗北'}：${B.win?`${fname(B.f)}攻陷${B.city}`:`${B.city}守住了`}</p>`;}
 h+=`<div class="bacts"><button id="bt-fx">動畫：${FXN[FX.mode]}</button>`+(B.over?`<button id="bt-end" class="primary">結束戰鬥</button>`:
  (BT.busy?`<button id="bt-skip">略過動畫</button>`:'')+`${side==='a'?'<button id="bt-retreat">撤退</button>':''}<button id="bt-auto">委任</button><button id="bt-endphase" class="primary" ${B.phase===side&&!BT.busy?'':'disabled'}>結束本日行動</button>`)+`</div>`;
 h+=`<div class="blog">`+B.log.slice().reverse().slice(0,60).map(l=>`<p class="${l.c}">${l.m}</p>`).join('')+`</div>`;
 $('#bt-body').innerHTML=h;
}
$('#battle').addEventListener('click',e=>{
 if(!BT)return;const B=BT.B;
 const b=e.target.closest('button');
 if(b){
  if(b.id==='bt-skip'){FX.skip=true;$('#fxl')&&($('#fxl').innerHTML='');return;}
  if(b.id==='bt-fx'){FX.mode=FX.mode==='on'?'fast':FX.mode==='fast'?'off':'on';try{localStorage.setItem('qunxiong-fx',FX.mode);}catch(e){}b.textContent='動畫：'+FXN[FX.mode];return;}
  if(b.id==='bt-end'){$('#battle').hidden=true;syncWall(B);finishBattle(B);const d=BT.done;BT=null;FX.skip=false;render();d();return;}
  if(BT.busy)return;
  FX.skip=false;
  if(b.id==='bt-endphase'){endPlayerPhase();return;}
  if(b.id==='bt-auto'){BT.auto=true;if(B.phase===BT.side){alive(B,BT.side).forEach(u=>{if(!u.done)u.done=false;});aiPhase(B,BT.side).then(()=>{if(B.over){runDay();return;}endPhase(B,BT.side);if(BT.side==='a')beginPhase(B,'d');else{endDay(B);B.phase=null;}runDay();});}return;}
  if(b.id==='bt-retreat'){B.over=true;B.win=false;bl(B,'我軍鳴金收兵，撤回本城','day');runDay();return;}
  const u=selU();
  if(b.dataset.a&&u){const a=b.dataset.a;
   if(a==='cancel'){BT.cmd=null;drawBattle();return;}
   if(a==='undo'){u.pos=BT.undo.pos;u.moved=false;BT.undo=null;BT.R=reach(B,u);drawBattle();return;}
   if(a==='guard'||a==='wait'){playerAct(u,a,null);return;}
   BT.cmd=a;BT.R=null;drawBattle();return;}
  if(b.dataset.t&&u){playerAct(u,BT.cmd,b.dataset.t);return;}
  return;
 }
 if(BT.busy||B.over||B.phase!==BT.side||BT.auto)return;
 const tok=e.target.closest('.tok'),hx=e.target.closest('.hx');
 const u=selU();
 const tg=curTargets();
 if(tok){const id=tok.dataset.u,x=B.units.find(v=>v.id===id);
  if(BT.cmd&&u&&tg.includes(id)){playerAct(u,BT.cmd,id);return;}
  if(x.side===BT.side){BT.sel=id;BT.cmd=null;BT.info=null;BT.R=!x.done&&!x.moved?reach(B,x):null;drawBattle();return;}
  BT.info=id;drawBattle();return;}
 if(hx){const k=hx.dataset.k;
  if(BT.cmd==='siege'&&u&&tg.includes(k)){playerAct(u,'siege',k);return;}
  if(u&&!u.moved&&!u.done&&BT.R&&!BT.cmd&&BT.R.dest.has(k)&&k!==hk(...u.pos)){playerMove(u,k);return;}
 }
});
$('#battle').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.closest&&e.target.closest('#bmap [tabindex]')){e.preventDefault();e.target.closest('#bmap [tabindex]').dispatchEvent(new MouseEvent('click',{bubbles:true}));}});
function processCaptives(done){
 if(!S.pending.length){done&&done();return;}
 const o=S.officers[S.pending.shift()];
 const lord=lordOf(S.player);const p=clamp(0.3+(lord.cha-70)/100,0.1,0.85);
 const next=()=>{delete o._lord;render();processCaptives(done);};
 const acts=[];
 if(!o._lord)acts.push({label:`登用（約 ${Math.round(p*100)}%）`,primary:true,fn:()=>{if(Math.random()<p){o.fac=S.player;o.done=true;o.loy=60;log(`${o.name}歸順${fname(S.player)}`,'good');}else{o.fac=null;o.found=true;log(`${o.name}拒絕歸順，隱居於${o.city}`);}next();}});
 acts.push({label:'釋放',primary:!!o._lord,fn:()=>{if(o._lord){o.fac='gone';o.city=null;log(`${o.name}獲釋後隱居山林`);}else{o.fac=null;o.found=false;log(`釋放${o.name}`);}next();}});
 acts.push({label:'處斬',fn:()=>{o.fac='gone';o.city=null;log(`${o.name}遭處斬`);next();}});
 modal('處置俘虜',`<p><b>${o.name}</b>${o._lord?'（敵方君主）':''}被我軍俘虜。</p><p class="hint">統率 ${o.lea}　武力 ${o.war}　智力 ${o.int}　政治 ${o.pol}　魅力 ${o.cha}</p>${o._lord?'<p class="hint">君主不會歸順。</p>':''}`,acts);
}
