/* ---------- 戰鬥 ---------- */
const BCMD={charge:'突擊',volley:'齊射',strat:'計略',duel:'單挑',guard:'堅守',siege:'攻城'};
const otherSide=s=>s==='a'?'d':'a';
function mkUnit(side,o,troops,i,type){return{id:side+i,side,type:type||apt(o),off:o?o.id:null,name:o?o.name:'守軍',lea:o?o.lea:35,war:o?o.war:35,int:o?o.int:35,troops,max:Math.max(1,troops),conf:0,guard:false,dead:troops<=0,acted:false};}
function splitTroops(arr,total){const s=arr.reduce((a,o)=>a+o.lea,0);let left=total;return arr.map((o,i)=>{const v=i===arr.length-1?left:Math.round(total*o.lea/s);left-=v;return v;});}
function setupBattle(f,src,t,offs,n,types){
 const d=t.owner;const dOffs=d?officersIn(t.name,d).sort((a,b)=>(b.lea+b.war)-(a.lea+a.war)).slice(0,3):[];
 const units=[];
 splitCap(offs,n).forEach((v,i)=>units.push(mkUnit('a',offs[i],v,i,types&&types[offs[i].id])));
 if(dOffs.length)splitTroops(dOffs,t.troops).forEach((v,i)=>units.push(mkUnit('d',dOffs[i],v,i)));
 else units.push(mkUnit('d',null,t.troops,0));
 const B={f,df:d,src:src.name,city:t.name,day:1,maxDay:10,units,wall:t.def,wall0:t.def,trainA:src.train,trainD:t.train,
  morale:{a:Math.round(clamp(55+src.train/4,50,80)),d:Math.round(clamp(60+t.train/4,55,85))},start:{a:Math.max(1,n),d:Math.max(1,t.troops)},loss:{a:0,d:0},log:[],over:false,win:false,orders:{}};
 B.ter=cityTer(t.name);B.naval=isNaval(src.name,t.name);if(B.naval)bl(B,`${src.name}至${t.name}走水路，此為水戰`);
 gearSetup(B,src,t);
 bl(B,`${fname(f)}兵臨${t.name}城下`,'day');
 addReinforcements(B,t);
 traitSetup(B,src,t);
 setWx(B,rollWx(B));
 chibiCheck(B,f,d,t);
 checkB(B);
 return B;
}
/* 城池地勢：快速結算沒有地圖，改用整座城的地勢修正 */
function cityTer(n){return MOUNT_CITIES.includes(n)?'mount':RIVER_CITIES.includes(n)?'river':'plain';}
const TERN={mount:'山地',river:'水鄉',plain:'平地'};
/* 快速結算的兵種、地勢修正。u 攻擊 t，cmd 為 charge／volley／counter */
function qmod(B,u,t,cmd){
 let m=tm(u,t)*fmod(B,u,t,cmd);
 if(cmd==='charge')m*=u.type==='騎'?1.15:u.type==='弓'?0.85:1;
 else if(cmd==='volley')m*=u.type==='弓'?1.25:u.type==='騎'?0.7:1;
 else if(cmd==='counter')m*=u.type==='槍'?1.2:1;
 if(B.ter==='mount'){if(u.side==='a'&&u.type==='騎')m*=0.8;if(t.side==='d')m*=0.9;}
 else if(B.ter==='river'){if(u.side==='a'&&cmd==='charge')m*=0.9;if(u.side==='d'&&cmd==='volley')m*=1.1;}
 return m;
}
/* 盟友援軍：與守方同盟、且鄰接目標城的電腦勢力，會派一名武將率兵馳援（最多兩路） */
function reinfCands(f,t){
 const d=t.owner;if(!d)return[];
 const out=[];
 for(const n of ADJ[t.name]){
  const c=S.cities[n],a=c.owner;
  if(!a||a===d||a===f||a===S.player||!S.factions[a].alive||!rel(a,d).ally||friendly(a,f)||c.troops<6000)continue;
  const o=officersIn(n,a).filter(x=>x.id!==S.factions[a].lord).sort((x,y)=>(y.lea+y.war)-(x.lea+x.war))[0];if(!o)continue;
  out.push({c,a,o,send:Math.min(Math.round(c.troops*0.3),capOf(o))});
 }
 return out.sort((x,y)=>y.send-x.send).slice(0,2);
}
function addReinforcements(B,t){
 reinfCands(B.f,t).forEach((r,i)=>{
  r.c.troops-=r.send;
  const u=mkUnit('d',r.o,r.send,'r'+i);u.ally=r.a;u.home=r.c.name;
  B.units.push(u);B.start.d+=r.send;
  adjTrust(r.a,t.owner,5);adjTrust(r.a,B.f,-10);
  bl(B,`${fname(r.a)}遣${r.o.name}率兵 ${fmt(r.send)} 自${r.c.name}馳援`,'hit');
  log(`${fname(r.a)}遣${r.o.name}率兵 ${fmt(r.send)} 馳援${t.name}`,t.owner===S.player?'good':(B.f===S.player?'bad':''));
 });
}
const ufac=(B,u)=>u.ally||(u.side==='a'?B.f:B.df);
function bl(B,m,c){B.log.push({m,c:c||''});}
const alive=(B,s)=>B.units.filter(u=>u.side===s&&!u.dead);
function ubase(B,u){return u.troops*0.1*(0.5+u.lea/100)*(0.6+(u.side==='a'?B.trainA:B.trainD)/250)*(0.7+B.morale[u.side]/250)*rnd(.9,1.1);}
function hurt(B,t,dmg,wall){if(t.dead)return 0;if(t.side==='d'&&wall)dmg/=(1+B.wall/1000);if(t.guard)dmg*=0.5;dmg=Math.round(Math.min(t.troops,Math.max(0,dmg)));t.troops-=dmg;B.loss[t.side]+=dmg;if(B.ev)B.ev.hits.push({id:t.id,dmg});if(t.troops<50){B.loss[t.side]+=t.troops;t.troops=0;t.dead=true;bl(B,`${t.name}隊潰滅`,'bad');}return dmg;}
function stratChance(u,t,B){return clamp(0.35+(u.int-t.int)/100+wxStrat(B)+skillStrat(u),0.05,0.95);}
function duelChance(u,t){return clamp(0.5+(u.war-t.war)/30,0.05,0.95);}
function confuse(t){if(confImmune(t))return;t.conf=t.acted?1:2;}
function act(B,u,o){
 if(u.dead)return;
 const ev={type:'charge',from:u.id,to:null,hits:[]};B.ev=ev;B.fx.push(ev);
 if(u.conf>0){ev.type='conf';bl(B,`${u.name}隊陷入混亂，無法行動`);return;}
 const foes=alive(B,otherSide(u.side));if(!foes.length){ev.type='none';return;}
 let t=o.target?B.units.find(x=>x.id===o.target):null;
 if(!t||t.dead)t=foes.slice().sort((a,b)=>a.troops-b.troops)[0];
 ev.to=t.id;
 const nm=pick(STRATS);
 const charge=()=>{ev.type='charge';const d=hurt(B,t,ubase(B,u)*(0.6+u.war/250)*1.25*qmod(B,u,t,'charge'),true);const c=t.dead?0:hurt(B,u,ubase(B,t)*(0.6+t.war/250)*0.45*qmod(B,t,u,'counter'),false);afterCharge(B,u,t);bl(B,`${u.name}隊突擊${t.name}隊，殲敵 ${fmt(d)}，自損 ${fmt(c)}`);};
 switch(o.cmd){
  case 'volley':{ev.type='volley';const d=hurt(B,t,ubase(B,u)*0.85*qmod(B,u,t,'volley'),true);bl(B,`${u.name}隊向${t.name}隊齊射，殲敵 ${fmt(d)}`);break;}
  case 'strat':{
   ev.type='strat';ev.label=nm;
   if(Math.random()<stratChance(u,t,B)){ev.ok=true;const d=hurt(B,t,ubase(B,u)*(0.5+u.int/100)*1.3*fmod(B,u,t,'strat'),false);confuse(t);bl(B,`${u.name}對${t.name}施${nm}成功，殲敵 ${fmt(d)}，敵隊陷入混亂`,'hit');}
   else if(t.int>u.int+10&&!hasSkill(u,'shenmou')&&Math.random()<0.4){ev.backfire=true;confuse(u);bl(B,`${u.name}的${nm}被${t.name}識破，反陷混亂`,'bad');}
   else bl(B,`${u.name}對${t.name}施${nm}，未能奏效`);
   break;}
  case 'duel':{
   if(u.off==null||t.off==null){charge();break;}
   if(!(t.war>=u.war-10||Math.random()<0.25)){ev.type='refuse';B.morale[u.side]=clamp(B.morale[u.side]+5,0,100);B.morale[t.side]=clamp(B.morale[t.side]-6,0,100);bl(B,`${u.name}向${t.name}叫陣，${t.name}避而不戰，全軍士氣低落`);break;}
   const w=Math.random()<duelChance(u,t)?u:t,l=w===u?t:u;
   ev.type='duel';ev.winner=w.id;
   const d=hurt(B,l,l.troops*0.25,false);B.morale[w.side]=clamp(B.morale[w.side]+10,0,100);B.morale[l.side]=clamp(B.morale[l.side]-15,0,100);
   bl(B,`${u.name}與${t.name}陣前單挑，大戰 ${ri(3,30)} 回合，${w.name}擊敗${l.name}！${l.name}隊潰散 ${fmt(d)}`,'hit');break;}
  case 'guard':{ev.type='guard';ev.to=null;B.morale[u.side]=clamp(B.morale[u.side]+(hasSkill(u,'guwu')?5:3),0,100);bl(B,`${u.name}隊堅守陣地`);break;}
  case 'siege':{
   if(u.side!=='a'){charge();break;}
   ev.type='siege';ev.to=null;
   const w=Math.round(ubase(B,u)*0.18*ramMod(B)*skillSiege(u));B.wall=Math.max(0,B.wall-w);ev.wall=w;
   const c=hurt(B,u,foes.reduce((a,x)=>a+x.troops,0)*0.012,false);
   bl(B,`${u.name}隊猛攻城牆，城防 -${w}，自損 ${fmt(c)}`);break;}
  default:charge();
 }
}
function checkB(B){
 if(B.over)return true;
 const A=alive(B,'a'),D=alive(B,'d');
 if(!D.length||B.morale.d<=15){B.over=true;B.win=true;bl(B,!D.length?`守軍盡沒，${B.city}陷落`:`守軍士氣崩潰，${B.city}陷落`,'day');}
 else if(!A.length||B.morale.a<=15){B.over=true;B.win=false;bl(B,!A.length?'攻方全軍覆沒':'攻方士氣崩潰，全軍撤退','day');}
 else if(B.day>B.maxDay){B.over=true;B.win=false;bl(B,'十日未下，軍糧耗盡，攻方撤退','day');}
 return B.over;
}
function runRound(B,ords){
 if(B.over)return;
 B.loss={a:0,d:0};B.fx=[{type:'day',day:B.day,hits:[]}];
 bl(B,`第 ${B.day} 日`,'day');newDayWx(B);
 B.units.forEach(u=>{u.acted=false;u.guard=!u.dead&&u.conf===0&&ords[u.id]&&ords[u.id].cmd==='guard';});
 const order=B.units.filter(u=>!u.dead).map(u=>({u,k:u.war+rnd(-8,8)})).sort((a,b)=>b.k-a.k).map(x=>x.u);
 for(const u of order){act(B,u,ords[u.id]||{cmd:'charge'});u.acted=true;if(B.ev){B.ev.snap={u:B.units.map(x=>[x.id,x.troops,x.dead,x.conf]),wall:B.wall};B.ev=null;}if(checkB(B))break;}
 if(!B.over)['a','d'].forEach(s=>{B.morale[s]=Math.round(clamp(B.morale[s]-moraleLoss(B,s,B.loss[s]/B.start[s]*120)+(B.loss[s]<B.loss[otherSide(s)]?2:0),0,100));});
 siegeTick(B);
 B.units.forEach(u=>{u.guard=false;if(u.conf>0)u.conf--;});
 if(!B.over)wxDayEnd(B);
 B.day++;
 checkB(B);
}
function aiOrders(B,s){
 const ords={};const foes=alive(B,otherSide(s));if(!foes.length)return ords;
 for(const u of alive(B,s)){
  const weak=foes.slice().sort((a,b)=>a.troops-b.troops)[0];
  let o={cmd:Math.random()<0.6?'charge':'volley',target:weak.id};
  const dT=foes.filter(t=>t.off!=null&&t.war<u.war-5).sort((a,b)=>b.troops-a.troops)[0];
  const sT=foes.filter(t=>t.int<u.int-10).sort((a,b)=>b.troops-a.troops)[0];
  if(u.off!=null&&u.war>=85&&dT&&Math.random()<0.3)o={cmd:'duel',target:dT.id};
  else if(u.int>=75&&sT&&Math.random()<0.65)o={cmd:'strat',target:sT.id};
  else if(s==='a'&&B.wall>250&&Math.random()<0.25)o={cmd:'siege'};
  else if(u.troops<u.max*0.3&&Math.random()<0.5)o={cmd:'guard'};
  ords[u.id]=o;
 }
 return ords;
}
function autoResolve(B){if(B.ter!=='plain')bl(B,B.ter==='mount'?`${B.city}山勢險峻，守方據險而守，騎兵難以施展`:`${B.city}水網縱橫，攻方渡水衝陣不易，守方弓弩得利`);let g=0;while(!B.over&&g++<20)runRound(B,Object.assign(aiOrders(B,'a'),aiOrders(B,'d')));}
function finishBattle(B){
 try{return finishBattle0(B);}finally{syncItems();}
}
function finishBattle0(B){
 setTimeout(checkTitles,0);
 if(B.df)adjTrust(B.f,B.df,-25);
 const src=S.cities[B.src],t=S.cities[B.city],f=B.f,d=B.df;
 const sum=s=>alive(B,s).filter(u=>!u.ally).reduce((a,u)=>a+u.troops,0);
 B.units.filter(u=>u.ally&&u.troops>0).forEach(u=>{const h=S.cities[u.home].owner===u.ally?S.cities[u.home]:citiesOf(u.ally)[0];if(h)h.troops+=u.troops;});
 const A=sum('a'),D=sum('d');
 if(B.caps)B.caps.forEach(([oid,by])=>{const o=S.officers[oid];const cn=capCity(B,by);if(cn&&o.fac!=='gone')captureOfficer(o,by,cn);});
 const aOffs=B.units.filter(u=>u.side==='a'&&u.off!=null).map(u=>S.officers[u.off]).filter(o=>o.fac===f);
 aOffs.forEach(o=>{o.done=true;if(!B.map){gainExp(o,'lea',8);gainExp(o,'war',6);}});
 if(!B.map&&d)officersIn(t.name,d).forEach(o=>gainExp(o,'lea',6));
 t.def=Math.round(B.wall);
 if(B.win){
  const old=d;t.owner=f;t.troops=A+Math.round(D*0.3);t.train=B.trainA;t.ppl=Math.max(20,(t.ppl??60)-20);t.auto=false;aOffs.forEach(o=>o.merit=(o.merit||0)+60);
  aOffs.forEach(o=>o.city=t.name);
  log(`${fname(f)}攻陷${t.name}`,f===S.player?'good':(old===S.player?'bad':''));
  handleFall(t,old,f);
 }else{
  t.troops=D;
  log(`${fname(f)}進攻${t.name}失利`,f===S.player?'bad':(d===S.player?'good':''));
  const caught=d?B.units.filter(u=>u.side==='a'&&u.dead&&u.off!=null&&Math.random()<0.35).map(u=>S.officers[u.off]):[];
  let home=src.owner===f?src:pick(citiesOf(f).length?citiesOf(f):[null]);
  if(home)home.troops+=A;
  aOffs.forEach(o=>{if(caught.includes(o))captureOfficer(o,d,t.name);else if(home)o.city=home.name;else{o.fac=null;o.found=false;}});
 }
 gearReturn(B);
 checkFactions();
}
function captureOfficer(o,by,cn){
 const isLord=!!(S.factions[o.fac]&&S.factions[o.fac].lord===o.id);
 log(`${o.name}被${fname(by)}俘虜`,by===S.player?'good':(o.fac===S.player?'bad':''));
 o.city=cn;
 if(by===S.player){o.fac='captive';o._lord=isLord;S.pending.push(o.id);}
 else if(isLord){o.fac='gone';o.city=null;log(`${o.name}遭${fname(by)}處斬`);}
 else if(Math.random()<0.45){o.fac=by;o.done=true;o.loy=60;log(`${o.name}投降${fname(by)}`);}
 else{o.fac=null;o.found=false;}
}
function handleFall(t,old,conq){
 if(!old)return;
 const defs=S.officers.filter(o=>o.fac===old&&o.city===t.name);
 const others=citiesOf(old);
 for(const o of defs){
  const isLord=o.id===S.factions[old].lord;
  if(others.length&&Math.random()<(isLord?0.9:0.55)){const dest=pick(others);o.city=dest.name;log(`${o.name}突圍逃往${dest.name}`);continue;}
  captureOfficer(o,conq,t.name);
 }
}
function checkFactions(){
 for(const f of Object.values(S.factions)){
  if(!f.alive)continue;
  const cs=citiesOf(f.id);
  if(!cs.length){
   f.alive=false;
   S.officers.filter(o=>o.fac===f.id).forEach(o=>{if(o.id===f.lord){o.fac='gone';o.city=null;}else{o.fac=null;o.found=false;}});
   log(`${f.name}勢力滅亡`,f.id===S.player?'bad':'');continue;
  }
  if(S.officers[f.lord].fac!==f.id){
   const prev=S.officers[f.lord].name;const heir=(HEIRS[prev]||[]).map(n=>S.officers.find(o=>o.name===n&&o.fac===f.id)).find(Boolean);
   const pool=S.officers.filter(o=>o.fac===f.id).sort((a,b)=>b.cha-a.cha);const cands=[...(heir?[heir]:[]),...pool.filter(o=>o!==heir)];const cand=cands[0];
   if(cand){f.lord=cand.id;log(`${cand.name}繼承${f.name}勢力`,f.id===S.player?'bad':'');succession(f,cands);}
   else{cs.forEach(c=>c.owner=null);f.alive=false;log(`${f.name}勢力群龍無首，就此瓦解`,f.id===S.player?'bad':'');}
  }
 }
}
