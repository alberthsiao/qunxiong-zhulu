/* ---------- 繼承事件與多人熱座 ---------- */
/* 人類玩家：熱座模式下 S.hot 是輪流操作的勢力清單，S.player 是現在操作的那一位 */
function isHuman(f){return !!f&&(S.hot?S.hot.includes(f):f===S.player);}
const SPLIT_COLORS=['#8A5A9C','#5A8A9C','#9C8A5A','#5A9C6A','#9C5A5A','#6A6A9C'];
function splitOff(F,rival){
 const cs=citiesOf(F.id).filter(c=>c.name!==lordOf(F.id).city);if(!cs.length||!rival)return false;
 const city=cs.sort((a,b)=>b.troops-a.troops)[0];const id=F.id+'_'+rival.id;if(S.factions[id])return false;
 newFaction(id,rival.name,rival,[city.name],[]);S.factions[id].color=SPLIT_COLORS[Object.keys(S.factions).length%SPLIT_COLORS.length];rival.city=city.name;
 const r=rel(F.id,id);r.trust=10;
 log(`${rival.name}不服，據${city.name}自立，${F.name}勢力分裂`,isHuman(F.id)?'bad':'');return true;
}
/* 君主死後：候選人兩位以上時，人類玩家選擇繼承人；電腦勢力有機率分裂 */
function succession(F,cands){
 if(cands.length<2)return;
 const prev=cands[0];
 if(isHuman(F.id)){
  const t=hz('袁紹廢長立幼，死後袁譚、袁尚兄弟相攻，河北為曹操所乘；孫權晚年太子孫和與魯王孫霸「二宮之爭」，朝臣分裂。繼承人之爭往往比外敵更致命。');
  pushEvent(`${F.name}軍　繼承人之爭`,`<p class="evt">君主辭世，群臣議立新主。依序位當立${prev.name}；另立他人可能招致內亂。</p>`+t,
   cands.slice(0,3).map((c,i)=>({label:`${c.name}（統${c.lea} 武${c.war} 智${c.int} 政${c.pol} 魅${c.cha}）${i===0?'　序位當立':''}`,primary:i===0,fn:()=>{F.lord=c.id;c.loy=100;S.officers.filter(o=>o.fac===F.id&&o!==c).forEach(o=>o.loy=clamp((o.loy||70)-(i===0?0:8),0,100));log(`${c.name}繼位為${F.name}軍之主`,'good');if(i>0&&Math.random()<0.4)splitOff(F,prev);checkTitles();}})));
 }else if(citiesOf(F.id).length>=4&&Math.random()<0.25)splitOff(F,cands[1]);
}
/* 熱座：開局選擇 2～4 個勢力輪流操作 */
const HOT={on:false,picks:[]};
function hotSwitch(next,msg){
 S.player=next;ui={sel:lordOf(next).city,mode:null,src:null};render();
 const F=S.factions[next];
 modal('換人',`<p class="evt"><span class="dot" style="background:${F.color}"></span>輪到 <b>${F.name}軍</b>（${lordOf(next).name}）。${msg||''}</p><p class="hint">請把裝置交給下一位玩家，再按「開始」。</p>`,[{label:'開始',primary:true,fn:()=>{showEvents(()=>showProposals(()=>processCaptives(()=>render())));}}]);
}
/* endTurn 的熱座分支：還有人沒下令就換人；全部下完才讓電腦行動並推進月份 */
function hotEndTurn(){
 if(!S.hot||S.hot.length<2)return false;
 const alive=S.hot.filter(f=>S.factions[f]&&S.factions[f].alive);if(alive.length<2){S.hot=null;return false;}
 ui.mode=null;citiesOf(S.player).filter(c=>c.auto).forEach(c=>autoDomestic(c,S.player));
 S.hotDone=S.hotDone||{};S.hotDone[S.player]=true;
 const next=alive.find(f=>!S.hotDone[f]);
 if(next){hotSwitch(next);return true;}
 S.hotDone={};S.incoming=[];
 for(const f of shuffle(Object.keys(S.factions))){if(isHuman(f)||!S.factions[f].alive)continue;aiTurn(f);}
 const order=alive.slice();
 const step=i=>{
  if(i>=order.length){S.player=order[0];checkFactions();render();if(checkEnd())return;const prevDate=dateStr();advanceMonth();monthlySummary(prevDate);checkAch();sfx('month');render();hotSwitch(order[0],`${eraStr()}，新的一個月。`);return;}
  S.player=order[i];render();
  const mine=S.incoming.filter(it=>S.cities[it.t].owner===S.player);
  if(!mine.length){step(i+1);return;}
  const rest=S.incoming.filter(it=>S.cities[it.t].owner!==S.player);S.incoming=mine;
  modal('換人',`<p class="evt"><span class="dot" style="background:${S.factions[S.player].color}"></span><b>${S.factions[S.player].name}軍</b>的城池遭到進攻，請該玩家指揮守城。</p>`,[{label:'開始',primary:true,fn:()=>{runIncoming(()=>{S.incoming=rest;processCaptives(()=>step(i+1));});}}]);
 };
 step(0);
 return true;
}
