// 帳號存檔測試：以假的 window.claude（user＋db）模擬 Artifact 執行環境
const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(require('path').join(__dirname,'../dist/index.html'),'utf8');
(async()=>{
 const store={};
 const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.test/',beforeParse(w){
  const db={doc:p=>({set:async d=>{store[p]=JSON.parse(JSON.stringify(d));},get:async()=>({exists:!!store[p],data:()=>store[p]}),delete:async()=>{delete store[p];}}),
   collection:p=>({get:async()=>({docs:Object.keys(store).filter(k=>k.startsWith(p+'/')).map(k=>({id:k.slice(p.length+1),exists:true,data:()=>store[k]}))})})};
  const user={me:async()=>({id:'u_test',name:'測試玩家'})};
  w.claude={use:async n=>n==='db'?db:n==='user'?user:null};}});
 const w=dom.window;const errs=[];w.addEventListener('error',e=>errs.push(e.message));const wait=ms=>new Promise(r=>setTimeout(r,ms));
 await wait(400);const res=[];const ok=(c,m)=>{if(!c)res.push('FAIL '+m);};
 ok(w.eval('CLOUD.state')==='on','帳號應已連上，實際 '+w.eval('CLOUD.state'));
 w.eval("newGame('wa','s200');for(let i=0;i<24;i++){citiesOf(S.player).forEach(c=>c.auto=true);}");
 const size=w.eval('new Blob([dumpState()]).size');res.push('存檔大小 '+Math.round(size/1024)+' KiB（上限 250）');ok(size<250*1024,'存檔超過上限');
 w.eval('S.cities["邪馬台"].gold=4321;openSaves()');await wait(20);
 ok(/已登入/.test(w.document.querySelector('#cloud-box').textContent)&&/測試玩家/.test(w.document.querySelector('#cloud-name').textContent),'應顯示登入者');
 w.document.querySelector('[data-csv="2"]').click();await wait(50);
 ok(store['data/users/u_test/slot2']&&store['data/users/u_test/slot2'].fname==='卑彌呼','應寫入私人路徑');
 ok(!!w.document.querySelector('[data-cld="2"]'),'存入後應出現讀取鈕');
 w.eval('S.cities["邪馬台"].gold=1');w.document.querySelector('[data-cld="2"]').click();await wait(50);
 ok(w.eval('S.cities["邪馬台"].gold')===4321,'讀取後應還原進度');
 w.eval('openSaves()');await wait(20);w.document.querySelector('[data-cdel="2"]').click();await wait(50);
 ok(!store['data/users/u_test/slot2']&&!w.document.querySelector('[data-cld="2"]'),'刪除後應清空');
 // 從開局畫面按「讀取存檔」：存讀檔視窗的層級必須高於開局畫面，否則會被蓋住無法點擊
 w.eval('showStart()');w.document.querySelector('#b-cont').click();await wait(20);
 {const z=id=>+w.getComputedStyle(w.document.querySelector(id)).zIndex;ok(!w.document.querySelector('#modal').hidden&&!w.document.querySelector('#start').hidden&&z('#modal')>z('#start')&&z('#modal')>z('#battle')&&z('#modal')>z('#duel'),'存讀檔視窗應疊在開局畫面之上：'+z('#modal')+' vs '+z('#start'));}
 console.log(res.join('\n'));console.log(errs.length?'ERR '+errs.join('；'):'帳號存檔測試完成，無執行期錯誤');
 if(errs.length||res.some(r=>/FAIL/.test(r)))process.exitCode=1;
})();
