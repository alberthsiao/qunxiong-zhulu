// 彙整 tests/stats.cjs 產生的 deploy/stats-*.json：node tests/stats-report.cjs
const fs=require('fs');let out=[],errs=[];for(let i=0;i<6;i++){try{const d=JSON.parse(fs.readFileSync('deploy/stats-'+i+'.json','utf8'));out=out.concat(d.out);errs=errs.concat(d.errs);}catch(e){}}
console.log('局數',out.length,'錯誤',errs.length,'中斷',out.filter(r=>r.err).length);
const pct=(a,b)=>(100*a/Math.max(1,b)).toFixed(0)+'%';
['s190','s200','s208','s219'].forEach(sc=>{const rs=out.filter(r=>r.sc===sc);const top={};rs.forEach(r=>{const t=r.top[0];if(t)top[t[0]]=(top[t[0]]||0)+1;});console.log(sc,'剩餘勢力',(rs.reduce((a,r)=>a+r.facs,0)/rs.length).toFixed(1),'分裂',(rs.reduce((a,r)=>a+r.splits,0)/rs.length).toFixed(2),'最大城數',(rs.reduce((a,r)=>a+(r.top[0]?r.top[0][1]:0),0)/rs.length).toFixed(1),'霸主',Object.entries(top).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([n,c])=>n+' '+pct(c,rs.length)).join('、'));});
const g={};out.forEach(r=>{const k=r.sc+'/'+r.f;(g[k]=g[k]||[]).push(r);});
const key=['s190/cao','s190/liubei','s190/sun','s190/yuan','s190/dong','s190/mateng','s190/wanglang','s200/cao','s200/liubei','s200/yuan','s200/sun','s200/shixie','s208/cao','s208/liubei','s208/sun','s219/liubei','s219/sun','s219/shixie'];
console.log('\n勢力         存活  平均城  稱帝');key.forEach(k=>{const rs=g[k]||[];if(!rs.length)return;console.log(k.padEnd(14),pct(rs.filter(r=>r.alive).length,rs.length).padStart(5),(rs.reduce((a,r)=>a+r.cities,0)/rs.length).toFixed(1).padStart(6),pct(rs.filter(r=>r.emp).length,rs.length).padStart(5));});
const ev={};out.forEach(r=>r.ev.forEach(e=>ev[e]=(ev[e]||0)+1));console.log('\n事件',Object.entries(ev).sort((a,b)=>b[1]-a[1]).map(([e,n])=>e+' '+pct(n,out.length)).join('　'));
