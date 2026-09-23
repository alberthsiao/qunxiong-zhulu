// 自動模擬測試：連跑三年、手動停止、模擬後可正常接手
const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(require('path').join(__dirname,'../dist/index.html'),'utf8');
(async()=>{
 const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.test/'});const w=dom.window;const errs=[];w.addEventListener('error',e=>errs.push(e.message));
 const wait=ms=>new Promise(r=>setTimeout(r,ms));await wait(300);
 const res=[];const ok=(c,m)=>{if(!c)res.push('FAIL '+m);};
 const until=async(f,ms)=>{const t=Date.now();while(!f()&&Date.now()-t<ms)await wait(20);return f();};
 for(const[sc,f]of[['s200','liubei'],['s190','cao']]){
  w.eval(`newGame('${f}','${sc}')`);const t0=w.eval('S.turn');
  w.document.querySelector('#b-sim').click();await wait(10);
  ok(/自動模擬/.test(w.document.querySelector('#m-title').textContent),'應開啟設定視窗');
  w.document.querySelector('#sim-n').value='36';w.document.querySelector('#sim-sp').value='0';
  w.document.querySelector('#m-actions button').click();
  ok(await until(()=>w.eval('SIM.on'),2000),'模擬應啟動');
  const fin=await until(()=>!w.eval('SIM.on'),120000);ok(fin,'模擬應在時限內結束');
  const over=w.eval('S.over'),dt=w.eval('S.turn')-t0;
  ok(over||dt===36,`${sc}/${f} 應推進 36 個月，實際 ${dt}`);
  ok(w.eval('S.pending.length===0&&S.proposals.length===0&&(S.evq||[]).length===0&&S.incoming.length===0'),'待處理佇列應清空');
  ok(w.eval("S.officers.every(o=>o.fac!=='captive')"),'不應殘留俘虜');
  res.push(`${sc}/${f} ${w.eval('eraStr()')}：`+w.eval("Object.values(S.factions).filter(f=>f.alive).sort((a,b)=>citiesOf(b.id).length-citiesOf(a.id).length).slice(0,5).map(f=>f.name+citiesOf(f.id).length).join(' ')")+(over?'（已分出勝負）':''));
  if(!over){
   ok(/模擬結束/.test(w.document.querySelector('#m-title').textContent),'應顯示結束摘要');
   w.document.querySelector('#m-actions button').click();await wait(10);
   const t1=w.eval('S.turn');w.eval("citiesOf(S.player).forEach(c=>c.auto=true);endTurn()");
   for(let k=0;k<40;k++){await wait(0);const a=w.document.querySelector('#battle:not([hidden]) #bt-auto');if(a&&!w.eval('BT.auto')){a.click();continue;}const e=w.document.querySelector('#battle:not([hidden]) #bt-end');if(e){e.click();continue;}const m=w.document.querySelector('#modal:not([hidden]) #m-actions button');if(m&&!w.eval('S.over')){m.click();continue;}break;}
   ok(w.eval('S.over')||w.eval('S.turn')===t1+1,'模擬後應可正常結束本月');
  }
 }
 // 手動停止
 w.eval("newGame('sun','s200')");const t0=w.eval('S.turn');
 w.eval('startSim(600,30)');await wait(200);w.document.querySelector('#m-actions button').click();
 await until(()=>!w.eval('SIM.on'),5000);const dt=w.eval('S.turn')-t0;
 ok(!w.eval('SIM.on')&&dt>=1&&dt<60,'手動停止應生效，實際跑了 '+dt+' 個月');
 ok(w.eval("(()=>{const t=S.turn;endTurn();return true;})()"),'停止後 endTurn 可呼叫');
 console.log(res.join('\n'));console.log(errs.length?'ERR '+errs.join('；'):'自動模擬測試完成，無執行期錯誤');
 process.exit(errs.length||res.some(r=>/FAIL/.test(r))?1:0);
})();
