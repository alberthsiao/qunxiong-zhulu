/* ---------- 戰場地圖 ---------- */
let BT=null;
const MW=13,MH=9,HR=30,SQ3=Math.sqrt(3);
const MAPW=Math.round(HR*SQ3*(MW+0.5)+8),MAPH=Math.round(HR*1.5*(MH-1)+HR*2+8);
const TER={plain:{n:'平原',cost:1,def:1},forest:{n:'森林',cost:2,def:0.8},hill:{n:'丘陵',cost:3,def:0.75},mount:{n:'峻嶺',cost:99,def:1},river:{n:'河川',cost:3,def:1.15},
 city:{n:'城內',cost:1,def:1},core:{n:'本城',cost:1,def:1},wall:{n:'城牆',cost:99,def:1},gate:{n:'城門',cost:99,def:1},breach:{n:'破損城門',cost:1,def:1}};
const RIVER_CITIES=['建業','柴桑','江夏','江陵','吳','會稽','襄陽','壽春','下邳','濮陽','平原','洛陽','長沙','邪馬台','樂浪','番禺','交趾'];
const MOUNT_CITIES=['漢中','梓潼','成都','永安','江州','天水','武威','晉陽','長安','宛','丸都','西平','建寧','雲南','夷洲'];
const hk=(c,r)=>c+','+r;
const pk=k=>k.split(',').map(Number);
function hxy(c,r){return{x:HR*SQ3*(c+0.5*(r&1))+HR*SQ3/2+4,y:HR*1.5*r+HR+4};}
function hexPts(x,y){let p=[];for(let i=0;i<6;i++){const a=Math.PI/180*(60*i-30);p.push((x+HR*Math.cos(a)).toFixed(1)+','+(y+HR*Math.sin(a)).toFixed(1));}return p.join(' ');}
function nbrs(c,r){const d=(r&1)?[[1,0],[1,-1],[0,-1],[-1,0],[0,1],[1,1]]:[[1,0],[0,-1],[-1,-1],[-1,0],[-1,1],[0,1]];return d.map(([dc,dr])=>[c+dc,r+dr]).filter(([a,b])=>a>=0&&b>=0&&a<MW&&b<MH);}
function cube(c,r){const x=c-(r-(r&1))/2;return[x,r,-x-r];}
function hdist(a,b){const A=cube(a[0],a[1]),C=cube(b[0],b[1]);return Math.max(Math.abs(A[0]-C[0]),Math.abs(A[1]-C[1]),Math.abs(A[2]-C[2]));}
function seeded(str){let h=2166136261;for(const ch of str){h^=ch.codePointAt(0);h=Math.imul(h,16777619);}if(!h)h=1;return()=>{h^=h<<13;h^=h>>>17;h^=h<<5;return((h>>>0)%100000)/100000;};}
function syncWall(B){const v=Object.values(B.gates);B.wall=v.reduce((a,b)=>a+b,0)/v.length;}

/* 戰場布局：依攻方來向決定城池與攻方出發位置。W＝攻方自西來（城在東側），其餘類推 */
const LAYOUTS={
 W:{n:'西',core:[10,4],gate:[8,4],spawn:[[0,4],[1,3],[1,5],[0,2],[0,6]],bc:[1,7],br:[0,MH-1],riv:{v:true,from:3,span:3,lo:2,hi:6}},
 E:{n:'東',core:[2,4],gate:[4,4],spawn:[[12,4],[11,3],[11,5],[12,2],[12,6]],bc:[5,11],br:[0,MH-1],riv:{v:true,from:7,span:3,lo:6,hi:10}},
 S:{n:'南',core:[6,2],gate:[6,4],spawn:[[6,8],[4,8],[8,8],[2,8],[10,8]],bc:[0,MW-1],br:[4,MH-1],riv:{v:false,from:5,span:2,lo:5,hi:6}},
 N:{n:'北',core:[6,6],gate:[6,4],spawn:[[6,0],[4,0],[8,0],[2,0],[10,0]],bc:[0,MW-1],br:[0,4],riv:{v:false,from:2,span:2,lo:2,hi:3}}};
function attackDir(B){const s=S.cities[B.src],t=S.cities[B.city];if(!s||!t)return 'W';const dx=s.x-t.x,dy=s.y-t.y;return Math.abs(dx)>=Math.abs(dy)?(dx<=0?'W':'E'):(dy>0?'S':'N');}
function initMap(B){
 const dir=attackDir(B),L=LAYOUTS[dir];
 const R=seeded(dir==='W'?B.city:B.city+dir),T={};
 for(let r=0;r<MH;r++)for(let c=0;c<MW;c++)T[hk(c,r)]='plain';
 const blob=(type,n,len)=>{for(let i=0;i<n;i++){let c=L.bc[0]+Math.floor(R()*(L.bc[1]-L.bc[0]+1)),r=L.br[0]+Math.floor(R()*(L.br[1]-L.br[0]+1));for(let j=0;j<len;j++){if(T[hk(c,r)]==='plain')T[hk(c,r)]=type;const nb=nbrs(c,r);[c,r]=nb[Math.floor(R()*nb.length)];}}};
 const mnt=MOUNT_CITIES.includes(B.city),riv=RIVER_CITIES.includes(B.city);
 blob('forest',mnt?3:4,5);blob('hill',mnt?4:2,4);if(mnt)blob('mount',2,3);
 if(riv||R()<0.35){let v=L.riv.from+Math.floor(R()*L.riv.span);const len=L.riv.v?MH:MW;for(let i=0;i<len;i++){T[L.riv.v?hk(v,i):hk(i,v)]='river';if(R()<0.5)v=clamp(v+(R()<0.5?-1:1),L.riv.lo,L.riv.hi);}}
 const core=L.core;const ring2=[],ring1=[];
 for(let r=0;r<MH;r++)for(let c=0;c<MW;c++){const d=hdist([c,r],core);const k=hk(c,r);if(d===0)T[k]='core';else if(d===1){T[k]='city';ring1.push([c,r]);}else if(d===2){T[k]='wall';ring2.push([c,r]);}}
 B.gates={};[L.gate,...ring2.filter(p=>hdist(p,L.gate)===2)].forEach(g=>{const k=hk(...g);T[k]=B.wall>0?'gate':'breach';B.gates[k]=Math.round(B.wall);});
 const spawnA=L.spawn;spawnA.forEach(p=>{T[hk(...p)]='plain';nbrs(...p).forEach(q=>{if(T[hk(...q)]==='mount')T[hk(...q)]='hill';});});
 bl(B,`攻方自${L.n}面逼近${B.city}`);
 if(B.naval)navalMap(B,L);
 B.T=T;B.core=core;
 B.units.filter(u=>u.side==='a').forEach((u,i)=>u.pos=spawnA[i]);
 const inside=[core,...ring1.sort((a,b)=>hdist(a,L.gate)-hdist(b,L.gate))];
 B.units.filter(u=>u.side==='d').forEach((u,i)=>u.pos=inside[i]);
 B.units.forEach(u=>{u.mv=UT[u.type].mv+(u.off!=null&&itemsOf(S.officers[u.off]).some(i=>i.type==='名馬')?1:0)+(u.type==='騎'&&hasTrait(ufac(B,u),'nomad')?1:0);u.done=false;u.moved=false;u.guard=false;u.conf=0;});
 B.maxDay=15;B.phase=null;B.map=true;B.caps=[];syncWall(B);
}
const unitAt=(B,c,r)=>B.units.find(u=>!u.dead&&u.pos&&u.pos[0]===c&&u.pos[1]===r);
function zocAt(B,c,r,side){return nbrs(c,r).some(([a,b])=>{const x=unitAt(B,a,b);return x&&x.side!==side;});}
function reach(B,u){
 const start=hk(...u.pos);const all={[start]:{cost:0,prev:null}};const q=[[0,u.pos]];
 while(q.length){q.sort((a,b)=>a[0]-b[0]);const[cost,[c,r]]=q.shift();const k=hk(c,r);if(all[k].cost<cost)continue;
  if(k!==start&&zocAt(B,c,r,u.side))continue;
  for(const[a,b]of nbrs(c,r)){const tt=B.T[hk(a,b)];const tc=(navalCost(B,tt)??TER[tt].cost)+(u.type==='騎'&&(tt==='forest'||tt==='hill')?1:0);if(tc>=99)continue;const x=unitAt(B,a,b);if(x&&x.side!==u.side)continue;const nc=cost+tc;if(nc>umv(B,u))continue;const nk=hk(a,b);if(!all[nk]||all[nk].cost>nc){all[nk]={cost:nc,prev:k};q.push([nc,[a,b]]);}}}
 const dest=new Set(Object.keys(all).filter(k=>k===start||!unitAt(B,...pk(k))));
 return{all,dest};
}
function pathTo(R,k){const p=[];while(k){p.unshift(k);k=R.all[k].prev;}return p;}
function tdef(B,u){const t=B.T[hk(...u.pos)];if(t==='city'||t==='core')return 1/(1+B.wall/1000);return navalDef(B,t)??TER[t].def;}
function targetsFor(B,u,cmd){
 const foes=alive(B,otherSide(u.side)),d=f=>hdist(u.pos,f.pos);
 if(cmd==='charge')return foes.filter(f=>d(f)===1);
 if(cmd==='volley')return foes.filter(f=>d(f)<=wxRange(B,u));
 if(cmd==='strat')return foes.filter(f=>d(f)<=3);
 if(cmd==='duel')return u.off==null?[]:foes.filter(f=>d(f)===1&&f.off!=null);
 return[];
}
function gatesAdj(B,u){return u.side!=='a'?[]:Object.keys(B.gates).filter(k=>B.gates[k]>0&&hdist(u.pos,pk(k))===1);}
function checkMap(B){
 if(B.over)return true;
 const A=alive(B,'a'),D=alive(B,'d'),cu=unitAt(B,...B.core);
 if(cu&&cu.side==='a'){B.over=true;B.win=true;bl(B,`${cu.name}隊攻入本城，${B.city}陷落`,'day');}
 else if(!D.length||B.morale.d<=15){B.over=true;B.win=true;bl(B,!D.length?`守軍盡沒，${B.city}陷落`:`守軍士氣崩潰，${B.city}陷落`,'day');}
 else if(!A.length||B.morale.a<=15){B.over=true;B.win=false;bl(B,!A.length?'攻方全軍覆沒':'攻方士氣崩潰，全軍撤退','day');}
 else if(B.day>B.maxDay){B.over=true;B.win=false;bl(B,`${B.maxDay} 日未能破城，軍糧耗盡，攻方撤退`,'day');}
 return B.over;
}
function mapAct(B,u,cmd,tid,opts){
 opts=opts||{};
 const ev={type:cmd,from:u.id,to:null,hits:[]};B.ev=ev;
 const t=(cmd!=='siege'&&tid)?B.units.find(x=>x.id===tid):null;if(t)ev.to=t.id;
 const nm=pick(STRATS);
 const O=u.off!=null?S.officers[u.off]:null;
 if(cmd==='charge'){const d=hurt(B,t,ubase(B,u)*(0.6+u.war/250)*1.25*tdef(B,t)*tm(u,t)*fmod(B,u,t,'charge')*(u.type==='騎'?1.15:u.type==='弓'?0.85:1),false);const c=t.dead?0:hurt(B,u,ubase(B,t)*(0.6+t.war/250)*0.45*tdef(B,u)*tm(t,u)*fmod(B,t,u,'counter')*(t.type==='槍'?1.2:1),false);gainExp(O,'war',8);gainExp(O,'lea',4);bl(B,`${u.name}隊突擊${t.name}隊，殲敵 ${fmt(d)}，自損 ${fmt(c)}`);}
 else if(cmd==='volley'){const d=hurt(B,t,ubase(B,u)*0.85*tdef(B,t)*tm(u,t)*fmod(B,u,t,'volley')*(u.type==='弓'?1.25:u.type==='騎'?0.7:1),false);gainExp(O,'lea',6);bl(B,`${u.name}隊向${t.name}隊齊射，殲敵 ${fmt(d)}`);}
 else if(cmd==='strat'){ev.label=nm;gainExp(O,'int',8);
  if(Math.random()<stratChance(u,t,B)){ev.ok=true;gainExp(O,'int',8);const d=hurt(B,t,ubase(B,u)*(0.5+u.int/100)*1.3*fmod(B,u,t,'strat'),false);if(!t.dead)t.conf=1;bl(B,`${u.name}對${t.name}施${nm}成功，殲敵 ${fmt(d)}，敵隊陷入混亂`,'hit');}
  else if(t.int>u.int+10&&Math.random()<0.4){ev.backfire=true;u.conf=1;bl(B,`${u.name}的${nm}被${t.name}識破，反陷混亂`,'bad');}
  else bl(B,`${u.name}對${t.name}施${nm}，未能奏效`);}
 else if(cmd==='duel'){
  if(opts.refused||(!opts.res&&!duelAccept(u,t))){ev.type='refuse';B.morale[u.side]=clamp(B.morale[u.side]+5,0,100);B.morale[t.side]=clamp(B.morale[t.side]-6,0,100);bl(B,`${u.name}向${t.name}叫陣，${t.name}避而不戰，全軍士氣低落`);}
  else{const res=opts.res||simDuel(u,t);ev.type=opts.res?'duelDone':'duel';ev.winner=res.winner;applyDuel(B,res);}}
 else if(cmd==='siege'){ev.gate=tid;gainExp(O,'lea',6);const w=Math.round(ubase(B,u)*0.3*ramMod(B));B.gates[tid]=Math.max(0,B.gates[tid]-w);ev.wall=w;
  if(B.gates[tid]===0){B.T[tid]='breach';ev.breach=true;B.morale.d=clamp(B.morale.d-5,0,100);bl(B,`${u.name}隊攻破城門！`,'hit');}else bl(B,`${u.name}隊猛攻城門，城門耐久 -${w}`);syncWall(B);}
 else if(cmd==='guard'){u.guard=true;B.morale[u.side]=clamp(B.morale[u.side]+3,0,100);bl(B,`${u.name}隊堅守陣地`);}
 else ev.type='none';
 u.done=true;B.ev=null;checkMap(B);return ev;
}
function beginPhase(B,s){B.phase=s;B.units.forEach(u=>{if(u.side!==s||u.dead)return;u.done=false;u.moved=false;u.guard=false;u.skip=u.conf>0;if(u.skip){u.done=true;bl(B,`${u.name}隊陷入混亂，無法行動`);}});}
function endPhase(B,s){B.units.forEach(u=>{if(u.side===s&&u.skip){u.conf=0;u.skip=false;}});}
function endDay(B){['a','d'].forEach(s=>{B.morale[s]=Math.round(clamp(B.morale[s]-B.loss[s]/B.start[s]*100,0,100));});wxDayEnd(B);B.day++;checkMap(B);}

function aiPlan(B,u){
 const R=reach(B,u);const foes=alive(B,otherSide(u.side));
 const open=Object.keys(B.gates).filter(k=>B.gates[k]>0);const breached=Object.keys(B.gates).some(k=>B.gates[k]<=0);
 const threat=foes.some(f=>['city','core','breach'].includes(B.T[hk(...f.pos)]));
 let best=null;
 for(const k of R.dest){const p=pk(k);let sc=0;
  const adj=foes.filter(f=>hdist(p,f.pos)===1),in2=foes.filter(f=>hdist(p,f.pos)<=2);
  if(u.side==='a'){
   if(k===hk(...B.core))sc+=1000;
   if(adj.length)sc+=55+(adj.some(f=>f.troops<u.troops)?10:0);else if(in2.length)sc+=20;
   if(breached)sc+=(9-hdist(p,B.core))*7;
   else if(open.length){const gd=Math.min(...open.map(g=>hdist(p,pk(g))));sc+=(13-gd)*5;if(gd===1)sc+=25;}
  }else{
   const t=B.T[k];if(t==='city'||t==='core')sc+=30;
   if(t==='core'&&(threat||breached))sc+=25;
   if(adj.length)sc+=threat?40:15;else if(in2.length)sc+=25;
   if(foes.length)sc-=Math.min(...foes.map(f=>hdist(p,f.pos)))*2;
  }
  sc+=(TER[B.T[k]].def<1?4:0)+rnd(0,3);
  if(!best||sc>best.sc)best={k,sc};
 }
 const p=pk(best.k);
 const adj=foes.filter(f=>hdist(p,f.pos)===1).sort((a,b)=>a.troops-b.troops);
 const in2=foes.filter(f=>hdist(p,f.pos)<=wxRange(B,u)).sort((a,b)=>a.troops-b.troops);
 const st=foes.filter(f=>hdist(p,f.pos)<=3&&stratChance(u,f,B)>=0.55).sort((a,b)=>b.troops-a.troops)[0];
 const du=u.off!=null&&u.war>=85?adj.find(f=>f.off!=null&&f.war<u.war-5):null;
 let cmd='wait',tid=null;
 const fk=u.int>=70&&B.wx!=='rain'?fireTargets(B,u).filter(k=>{const x=unitAt(B,...pk(k));return x&&x.side!==u.side&&['forest','hill'].includes(B.T[k]);}):[];
 if(fk.length&&Math.random()<0.35){cmd='fire';tid=fk[0];}
 else if(du&&Math.random()<0.4){cmd='duel';tid=du.id;}
 else if(st&&Math.random()<0.7){cmd='strat';tid=st.id;}
 else if(adj.length){cmd='charge';tid=adj[0].id;}
 else if(u.side==='a'&&open.find(g=>hdist(p,pk(g))===1)){cmd='siege';tid=open.find(g=>hdist(p,pk(g))===1);}
 else if(in2.length){cmd='volley';tid=in2[0].id;}
 if(cmd==='wait'&&u.troops<u.max*0.4)cmd='guard';
 return{to:best.k,R,cmd,tid};
}
