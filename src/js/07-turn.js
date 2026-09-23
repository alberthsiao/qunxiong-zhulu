/* ---------- 回合 ---------- */
function economy(){
 let harvest=0;
 for(const c of Object.values(S.cities)){
  if(!c.owner)continue;
  const pf=0.7+(c.ppl??60)/200;c.gold+=Math.round((c.trade*0.3*(hasTrait(c.owner,'trade')?1.3:1)*(hasPol(c.owner,'junshu')?1.25:1)*(hasPol(c.owner,'tuntian')||hasPol(c.owner,'huimin')?0.9:1)+c.pop/5000)*pf);
  if(hasPol(c.owner,'huimin'))c.ppl=Math.min(100,(c.ppl??60)+1);if(hasPol(c.owner,'jiupin'))c.ppl=Math.max(0,(c.ppl??60)-0.3);if(hasPol(c.owner,'jingbing'))c.train=Math.min(100,c.train+2);
  const L=S.officers[S.factions[c.owner].lord];c.ppl=clamp((c.ppl??60)+((c.ppl??60)<50?0.5:0)+(L&&L.cha>=85?0.5:0)-((c.ppl??60)>70?0.3:0),0,100);
  if(c.ppl<30&&Math.random()<0.15){c.gold=Math.round(c.gold*0.7);c.food=Math.round(c.food*0.8);c.troops=Math.round(c.troops*0.95);c.ppl+=5;if(c.owner===S.player)log(`${c.name}民忠低落，爆發暴動！金、糧、兵力受損`,'bad');}
  if(hasTrait(c.owner,'nomad'))addGear(c,'horse',300);
  if(S.month===7){const h=Math.round((c.farm*12+c.pop/50)*pf*(hasTrait(c.owner,'nomad')?0.8:1)*harvestMod(c)*(hasPol(c.owner,'tuntian')?1.25:hasPol(c.owner,'junshu')?0.9:1));c.food+=h;if(c.owner===S.player)harvest+=h;}
  c.food-=Math.round(c.troops/40);
  if(c.food<0){const l=Math.round(c.troops*0.2);c.troops-=l;c.food=0;if(c.owner===S.player)log(`${c.name}缺糧，${fmt(l)} 名士兵逃亡`,'bad');}
  c.pop=Math.round(Math.min(c.popMax,c.pop*(1+0.004*((c.ppl??60)-40)/60*(hasPol(c.owner,'shibing')?0.8:1))+(c.farm+c.trade)/10));
 }
 if(harvest)log(`秋收，我軍各城共收糧 ${fmt(harvest)}`,'good');
}
function lifeCycle(){
 S.officers.forEach(o=>{const F=S.factions[o.fac];if(!F||F.lord===o.id)return;if(hasPol(o.fac,'weicai'))o.loy=Math.min(100,(o.loy||70)+1);const L=S.officers[F.lord];if(L.cha>=85&&Math.random()<0.3)o.loy=Math.min(100,(o.loy||70)+1);else if(L.cha<60&&Math.random()<0.3)o.loy=Math.max(30,(o.loy||70)-1);});
 if(S.month===1)S.officers.forEach(o=>{if(o.fac==='unborn'&&o.appear<=S.year){const af=affOf(o.id,S.year);const ac=af&&S.factions[af]&&S.factions[af].alive?affCity(S,af,o.id):null;
  if(ac){o.fac=af;o.city=ac;o.loy=80;if(af===S.player){log(`${o.name}年已及冠，於${ac}出仕`,'good');introduce(o,'新秀出仕');}}else{o.fac=null;o.city=o.home;o.found=false;}}});
 S.officers.forEach(o=>{
  if(['gone','unborn','captive'].includes(o.fac)||S.year<o.death||Math.random()>=0.06)return;
  const f=o.fac,lord=f&&S.factions[f]&&S.factions[f].lord===o.id;
  o.fac='gone';o.city=null;
  if(f&&(f===S.player||lord))log(`${o.name}病逝${lord?`，${S.factions[f].name}勢力痛失君主`:''}`,f===S.player?'bad':'');
 });
 checkFactions();
}
/* 月份推進：不含任何視窗，endTurn 與自動模擬（24-autosim.js）共用 */
function advanceMonth(){
 S.month++;if(S.month>12){S.month=1;S.year++;}
 S.turn++;
 monthlyClimate();
 economy();
 lifeCycle();
 runEvents();
 runHistory();
 checkGoal();checkEmperor();civicEvent();monthlyRelations();marriageEvent();
 syncItems();Object.keys(S.factions).forEach(f=>{if((f!==S.player||SIM.on)&&S.factions[f].alive)aiEquip(f);});
 aiDiplomacy();
 checkTitles();
 S.officers.forEach(o=>o.done=false);
 citiesOf(S.player).forEach(c=>{if(c.unrest>=S.turn){officersIn(c.name,S.player).forEach(o=>o.done=true);log(`${c.name}流言四起，城中武將本月無法行動`,'bad');}});
}
function endTurn(){
 if(!S||!S.player||S.over||SIM.on)return;
 if(hotEndTurn())return;
 ui.mode=null;S.incoming=[];
 citiesOf(S.player).filter(c=>c.auto).forEach(c=>{const n0=S.log.length;autoDomestic(c,S.player);});
 for(const f of shuffle(Object.keys(S.factions))){if(isHuman(f)||!S.factions[f].alive)continue;aiTurn(f);}
 runIncoming(()=>{
  checkFactions();render();
  if(checkEnd())return;
  const prevDate=dateStr();
  advanceMonth();
  monthlySummary(prevDate);checkAch();sfx('month');autoSave();
  render();
  showEvents(()=>showProposals(()=>processCaptives(()=>{render();checkSettle();})));
 });
}
function runIncoming(done){
 if(!S.incoming.length){done();return;}
 const it=S.incoming.shift();const src=S.cities[it.src],t=S.cities[it.t];
 const offs=it.offs.map(i=>S.officers[i]).filter(o=>o.fac===it.f);
 if(t.owner!==S.player||!S.factions[it.f].alive||!offs.length||!S.factions[S.player].alive){if(src.owner===it.f)src.troops+=it.n;runIncoming(done);return;}
 render();
 const dO=officersIn(t.name,S.player);
 const go=auto=>{const B=setupBattle(it.f,src,t,offs,it.n);if(auto)autoResolve(B);openBattle(B,'d',()=>processCaptives(()=>{render();runIncoming(done);}));};
 modal(`${fname(it.f)}來襲`,`<p>${offs.map(o=>o.name).join('、')}率兵 ${fmt(it.n)}，自${src.name}進攻${t.name}。</p><p class="hint">${t.name}守兵 ${fmt(t.troops)}，城防 ${t.def}，${dO.length?'守將 '+dO.map(o=>o.name).join('、'):'城中無將，只能由守軍應戰'}。</p>`,
  [{label:'親自指揮',primary:true,fn:()=>go(false)},{label:'委任',fn:()=>go(true)}]);
}
function checkEnd(){
 if(S.over)return true;
 if(!S.factions[S.player].alive&&S.hot&&S.hot.filter(f=>S.factions[f].alive).length){const alive=S.hot.filter(f=>S.factions[f].alive);S.hot=alive.length>1?alive:null;log(`${S.factions[S.player].name}軍已滅亡，退出遊戲`,'bad');hotSwitch(alive[0],'前一位玩家的勢力已滅亡。');return true;}
 if(!S.factions[S.player].alive){S.over=true;render();modal('霸業未竟',endingHTML(false),[{label:'重新開始',primary:true,fn:showStart},{label:'本局列傳',fn:()=>{setTimeout(openBiography,0);}}]);return true;}
 if(citiesOf(S.player).length===Object.keys(S.cities).length){S.over=true;unlockAch('unify');sfx('win');render();modal('天下一統',endingHTML(true),[{label:'重新開始',primary:true,fn:showStart},{label:'本局列傳',fn:()=>{setTimeout(openBiography,0);}},{label:'戰績卡',fn:()=>{setTimeout(openShareCard,0);}},{label:'留在地圖'}]);return true;}
 return false;
}
