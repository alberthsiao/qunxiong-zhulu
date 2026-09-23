/* ---------- 存讀檔 ---------- */
const slotKey=i=>KEY+'_'+i;
function readSlot(i){try{let s=localStorage.getItem(slotKey(i));if(!s&&i===1)s=localStorage.getItem(KEY);return s?JSON.parse(s):null;}catch(e){return null;}}
function dumpState(){S.savedAt=new Date().toLocaleString('zh-TW',{hour12:false});return JSON.stringify(S,(k,v)=>k==='evq'?[]:v);}
function loadState(d){
 S=d;S.incoming=[];S.items=S.items||[];S.dip=S.dip||{};S.proposals=S.proposals||[];S.intel=S.intel||{};S.evDone=S.evDone||{};S.evq=[];
 S.officers.forEach(o=>{if(o.loy==null)o.loy=70;if(o.merit==null)o.merit=Math.max(0,Math.max(o.lea,o.war,o.int)-60)*40;o.exp=o.exp||{};o.bonus=o.bonus||{};});
 Object.values(S.cities).forEach(c=>{if(c.ppl==null)c.ppl=60;});
 ui={sel:null,mode:null,src:null};$('#start').hidden=true;closeModal();render();toast('已讀取存檔');processCaptives(()=>render());
}
function slotLabel(d){if(!d)return '<span class="hint">空</span>';const sc=SCENARIOS.find(x=>x.id===d.scn)||{title:'',year:''};const F=d.factions[d.player];
 return `${sc.year} ${sc.title}　${F?F.name+'軍':''}　${d.year}年${d.month}月　<small class="itm">${d.savedAt||''}</small>`;}
function openSaves(){
 const can=S&&S.player&&!S.over;
 let h=`<table class="ed"><tbody>`+[1,2,3].map(i=>{const d=readSlot(i);return `<tr><td>欄位 ${i}</td><td>${slotLabel(d)}</td><td class="dpacts">${can?`<button data-sv="${i}">存入</button>`:''}${d?`<button data-ld="${i}">讀取</button><button data-del="${i}">刪除</button>`:''}</td></tr>`;}).join('')+`</tbody></table>`;
 h+=`<h3>匯出與匯入</h3><p class="hint">存檔只保存在這台裝置的瀏覽器裡。想換裝置或備份時，可以匯出成一段文字自行保存，再到別處貼上匯入。</p>
 <div class="dpacts">${can?'<button id="sv-exp">匯出目前進度</button>':''}<button id="sv-imp">匯入</button></div><textarea id="sv-txt" rows="4" placeholder="匯出的文字會出現在這裡；要匯入時，把文字貼在這裡再按「匯入」。"></textarea><p class="err" id="sv-err"></p>`;
 modal('存檔與讀檔',h,[{label:'關閉',primary:true}]);$('#modal .dlg').classList.add('wide');
}
$('#modal').addEventListener('click',e=>{
 const b=e.target.closest('[data-sv],[data-ld],[data-del],#sv-exp,#sv-imp');if(!b)return;
 try{
  if(b.dataset.sv){localStorage.setItem(slotKey(b.dataset.sv),dumpState());toast(`已存入欄位 ${b.dataset.sv}`);openSaves();return;}
  if(b.dataset.ld){const d=readSlot(+b.dataset.ld);if(d)loadState(d);return;}
  if(b.dataset.del){localStorage.removeItem(slotKey(b.dataset.del));if(b.dataset.del==='1')localStorage.removeItem(KEY);openSaves();return;}
 }catch(err){toast('這個瀏覽器無法存取存檔');return;}
 if(b.id==='sv-exp'){const t=$('#sv-txt');t.value=btoa(unescape(encodeURIComponent(dumpState())));t.select();try{navigator.clipboard.writeText(t.value);toast('已複製到剪貼簿');}catch(e){}return;}
 if(b.id==='sv-imp'){try{const raw=$('#sv-txt').value.trim();const d=JSON.parse(raw.startsWith('{')?raw:decodeURIComponent(escape(atob(raw))));if(!d.officers||!d.cities)throw 0;loadState(d);}catch(err){$('#sv-err').textContent='這段文字不是有效的存檔，請確認有完整貼上。';}}
});

$('#map').addEventListener('click',e=>{const g=e.target.closest('.city');if(!g||!S||!S.player||S.over&&false)return;cityClick(g.dataset.c);});
$('#map').addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const g=e.target.closest('.city');if(!g||!S.player)return;e.preventDefault();cityClick(g.dataset.c);});
function cityClick(n){if(ui.mode){if(validTargets().includes(n))openMarch(n);return;}ui.sel=n;render();}
$('#b-end').onclick=endTurn;$('#b-save').onclick=openSaves;$('#b-edit').onclick=openEditor;$('#b-roster').onclick=openRoster;$('#b-items').onclick=openItems;$('#b-dip').onclick=openDip;$('#b-new').onclick=showStart;$('#b-cont').onclick=openSaves;

S=initState(null,'s200');render();showStart();
