const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(require('path').join(__dirname,'../dist/index.html'),'utf8');
async function run(sc,f,months){
 const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.test/'});const w=dom.window;const errs=[];w.addEventListener('error',e=>errs.push(e.message));
 await new Promise(r=>setTimeout(r,300));
 const pump=async()=>{for(let k=0;k<60;k++){await new Promise(r=>setTimeout(r,0));const a=w.document.querySelector('#battle:not([hidden]) #bt-auto');if(a&&!w.eval('BT.auto')){a.click();continue;}const e=w.document.querySelector('#battle:not([hidden]) #bt-end');if(e){e.click();continue;}const m=w.document.querySelector('#modal:not([hidden]) #m-actions button');if(m&&!w.eval('S.over')){m.click();continue;}break;}};
 w.eval(`newGame('${f}','${sc}')`);
 let i=0;for(;i<months;i++){w.eval("citiesOf(S.player).forEach(c=>c.auto=true)");w.eval("endTurn()");await pump();if(w.eval('S.over'))break;}
 const r=w.eval("Object.values(S.factions).map(f=>f.name+(f.alive?citiesOf(f.id).length:'亡')).join(' ')");
 const ev=w.eval("S.log.filter(l=>/孫策出獵|連環計|東南風|三顧|單騎|稱帝/.test(l.m)).map(l=>l.t+l.m.slice(0,12)).join('；')");
 return `${sc}/${f} ${i}月 ${w.eval('eraStr()')}: ${r}\n    ${ev} ${errs.length?'ERR '+errs:''}`;
}
(async()=>{for(const [sc,f] of [['s190','liubei'],['s200','cao'],['s208','liubei'],['s219','liubei']]){console.log(await run(sc,f,36));}})();
