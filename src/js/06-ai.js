/* ---------- AI ---------- */
function aiTurn(f){
 aiSpy(f);aiPolicy(f);
 citiesOf(f).forEach(c=>{if(c.unrest>S.turn)officersIn(c.name,f).forEach(o=>o.done=true);});
 if(!S.factions[f].alive)return;
 const mine=citiesOf(f);
 let attacks=0;const maxAtt=mine.length>=8?3:mine.length>=5?2:1;
 if(S.turn>=3){
  for(const c of shuffle(mine)){
   if(attacks>=maxAtt)break;
   if(c.owner!==f||c.troops<5000)continue;
   const idle=officersIn(c.name,f).filter(o=>!o.done);if(!idle.length)continue;
   const targets=ADJ[c.name].map(n=>S.cities[n]).filter(t=>t.owner!==f&&!friendly(f,t.owner));if(!targets.length)continue;const jt=jointTarget(f);
   const leaders=idle.slice().sort((a,b)=>(b.lea+b.war)-(a.lea+a.war)).slice(0,3);
   const send=Math.min(Math.round(c.troops*0.75),leaders.reduce((a,o)=>a+capOf(o),0));if(c.food<send/5)continue;
   const myP=send*(0.5+Math.max(...leaders.map(o=>o.lea))/100);
   let bestT=null,bestR=0;
   for(const t of targets){const dO=t.owner?officersIn(t.name,t.owner):[];const dl=dO.length?Math.max(...dO.map(o=>o.lea)):35;const ter=cityTer(t.name);const tp=(Math.max(1,t.troops)+reinfCands(f,t).reduce((a,x)=>a+x.send,0))*(0.5+dl/100)*(1+t.def/1000)*(ter==='mount'?1.1:ter==='river'?1.05:1);const r=myP/tp*(jt&&t.owner===jt?1.4:1)*aiStrategyMod(f,c,t);if(r>bestR){bestR=r;bestT=t;}}
   let sendN=send;
   if(bestT&&bestR>1.15&&bestR<=1.6&&mine.length>=3&&Math.random()<0.5){aiConcentrate(f,c);const s2=Math.min(Math.round(c.troops*0.75),leaders.reduce((a,o)=>a+capOf(o),0));if(s2>send){bestR*=s2/send;sendN=s2;}}
   if(bestT&&bestR>1.6){const send=sendN;const fd=marchFood(f,c,bestT,send);if(c.food<fd)continue;c.troops-=send;c.food-=fd;attacks++;leaders.forEach(o=>o.done=true);
    if(isHuman(bestT.owner)&&!SIM.on)S.incoming.push({f,src:c.name,t:bestT.name,offs:leaders.map(o=>o.id),n:send});
    else{const B=setupBattle(f,c,bestT,leaders,send);autoResolve(B);finishBattle(B);}}
  }
 }
 for(const c of citiesOf(f))autoDomestic(c,f);
 aiTransfer(f);
}
function autoDomestic(c,f){
 {
  const target=isFront(c,f)?12000:5000;
  for(const o of officersIn(c.name,f).filter(o=>!o.done)){
   if((c.ppl??60)<45&&c.food>=600){doRelief(o,c);continue;}
   if(c.troops<target&&(c.ppl??60)>=40){const m=Math.min(3000,maxRecruit(c));if(m>=500&&c.gold-m*0.15>=100&&doRecruit(o,c,m))continue;}
   if(c.train<70&&c.troops>2000){doTrain(o,c);continue;}
   const fr=freeFound(c);if(fr.length&&Math.random()<0.35){doPersuade(o,fr[0],f);continue;}
   if(Math.random()<0.06){doSearch(o,c,f);continue;}
   if(c.gold>=300&&c.troops>=3000&&Math.random()<0.3){const gk=aiGearPick(c,f);if(gk&&doGear(gk,o,c))continue;}
   const opts=['farm','trade','def'].filter(k=>c[DEV[k].k]<c[DEV[k].max]).sort((a,b)=>c[DEV[a].k]/c[DEV[a].max]-c[DEV[b].k]/c[DEV[b].max]);
   if(opts.length&&c.gold>=60){doDev(opts[0],o,c);continue;}
   if(c.train<100)doTrain(o,c);else o.done=true;
  }
 }
}
function aiTransfer(f){
 for(const c of citiesOf(f)){
  if(isFront(c,f)||c.troops<4000)continue;
  const front=ADJ[c.name].map(n=>S.cities[n]).filter(t=>t.owner===f&&isFront(t,f))[0];
  if(!front)continue;
  const amt=c.troops-2000;const offs=officersIn(c.name,f);
  doMove(c,front,offs.length>1?[offs.sort((a,b)=>(b.lea+b.war)-(a.lea+a.war))[0]]:[],amt);
 }
}
