// 大量模擬統計：node tests/stats.cjs <局數> <每局月數> [worker索引 worker數]
const {JSDOM}=require('jsdom');const fs=require('fs');const path=require('path');
const html=fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8');
const N=+process.argv[2]||20,MONTHS=+process.argv[3]||180,WI=+process.argv[4]||0,WN=+process.argv[5]||1;
(async()=>{
 const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.test/'});const w=dom.window;const errs=[];w.addEventListener('error',e=>errs.push(e.message));
 await new Promise(r=>setTimeout(r,400));
 const combos=w.eval("JSON.stringify(SCENARIOS.flatMap(sc=>sc.factions.map(f=>[sc.id,f[0]])))");const all=JSON.parse(combos);
 const runs=[];for(let i=0;i<N;i++)runs.push(all[i%all.length]);
 const mine=runs.filter((_,i)=>i%WN===WI);
 const out=[];const t0=Date.now();
 for(const[sc,f]of mine){
  w.eval(`newGame('${f}','${sc}');closeModal();SIM.on=true;`);
  let m=0,alive=true,err=null;
  try{for(;m<MONTHS;m++){alive=w.eval('simMonth()');if(!alive)break;}}catch(e){err=String(e.message||e).slice(0,120);}
  const r=JSON.parse(w.eval(`JSON.stringify({sc:S.scn,f:S.player,months:${m},year:S.year,alive:S.factions[S.player].alive,cities:citiesOf(S.player).length,unify:citiesOf(S.player).length===Object.keys(S.cities).length,ev:Object.keys(S.evDone).filter(k=>S.evDone[k]===1),emp:!!S.factions[S.player].emperor,goal:S.goal&&S.goal.done,facs:Object.values(S.factions).filter(x=>x.alive).length,top:Object.values(S.factions).filter(x=>x.alive).map(x=>[x.name,citiesOf(x.id).length]).sort((a,b)=>b[1]-a[1]).slice(0,3),splits:Object.keys(S.factions).filter(k=>k.includes('_')).length,offs:S.officers.filter(o=>o.fac===S.player).length})`));
  r.err=err;out.push(r);w.eval('SIM.on=false');
  if(out.length%5===0)process.stderr.write(`worker${WI} ${out.length}/${mine.length} ${Math.round((Date.now()-t0)/1000)}s\n`);
 }
 fs.writeFileSync(path.join(__dirname,`../deploy/stats-${WI}.json`),JSON.stringify({out,errs}));
 console.log(`worker${WI} done ${out.length} runs, ${errs.length} errors, ${Math.round((Date.now()-t0)/1000)}s`);
 process.exit(0);
})();
