/* ---------- 存讀檔 ---------- */
const slotKey=i=>KEY+'_'+i;
function readSlot(i){try{let s=localStorage.getItem(slotKey(i));if(!s&&i===1)s=localStorage.getItem(KEY);return s?JSON.parse(s):null;}catch(e){return null;}}
function dumpState(){S.savedAt=new Date().toLocaleString('zh-TW',{hour12:false});return JSON.stringify(S,(k,v)=>k==='evq'?[]:(k==='home'||k==='appear'||k==='death')?undefined:v);}
function loadState(d){
 if(d.player&&!FC[d.player]){toast('這份存檔扮演的勢力已從遊戲中移除，無法讀取');return;}
 S=d;S.incoming=[];S.items=S.items||[];S.dip=S.dip||{};S.proposals=S.proposals||[];S.intel=S.intel||{};S.evDone=S.evDone||{};S.climate=S.climate||{};S.intro=S.intro||{};S.policy=S.policy||{};S.stats=S.stats||{};if(S.startCities==null)S.startCities=99;S.evq=[];if(!S.goal&&S.player&&S.factions[S.player])S.goal=makeGoal(S.player);
 /* 存檔裡若有已從遊戲移除的內容（例如曾短暫加入的夷洲），讀取時清掉，免得找不到道路或武將資料 */
 const known=new Set(CITY_DATA.map(c=>c[0]));
 Object.keys(S.cities).forEach(n=>{if(!known.has(n))delete S.cities[n];});
 if(S.officers.length>OFF.length)S.officers.length=OFF.length;
 Object.keys(S.factions).forEach(f=>{if(!FC[f]){delete S.factions[f];Object.keys(S.dip).forEach(k=>{if(k.split('|').includes(f))delete S.dip[k];});}});
 Object.values(S.cities).forEach(c=>{if(c.owner&&!S.factions[c.owner])c.owner=null;});
 S.items.forEach(it=>{if(it.owner!=null&&!S.officers[it.owner]){it.owner=null;it.fac=null;it.city=pick(Object.keys(S.cities));it.found=false;}if(it.city&&!S.cities[it.city])it.city=pick(Object.keys(S.cities));});
 S.pending=(S.pending||[]).filter(i=>S.officers[i]);S.proposals=S.proposals.filter(p=>S.factions[p.f]);
 /* 舊存檔沒有周邊諸國：補上無主城與在野武將（勢力不補，避免改變進行中的局勢） */
 CITY_DATA.forEach(([n,x,y,_,sz])=>{if(!S.cities[n])S.cities[n]=mkCity(n,x,y,sz,null);});
 OFF.forEach((r,i)=>{if(!S.officers[i])S.officers[i]=r[7]<S.year?mkOff(i,'gone',null):r[6]>S.year?mkOff(i,'unborn',null):mkOff(i,null,r[8]);});
 /* 出身、登場年、卒年不存檔（名單裡有），讀檔時還原 */
 S.officers.forEach(o=>{const r=OFF[o.id];if(r){if(o.home==null)o.home=r[8];if(o.appear==null)o.appear=r[6];if(o.death==null)o.death=r[7];}});
 S.officers.forEach(o=>{if(o.loy==null)o.loy=70;if(o.merit==null)o.merit=Math.max(0,Math.max(o.lea,o.war,o.int)-60)*40;o.exp=o.exp||{};o.bonus=o.bonus||{};});
 Object.values(S.cities).forEach(c=>{if(c.ppl==null)c.ppl=60;gearOf(c);});
 ui={sel:null,mode:null,src:null};$('#start').hidden=true;closeModal();render();toast('已讀取存檔');processCaptives(()=>render());
}
function slotLabel(d){if(!d)return '<span class="hint">空</span>';const sc=SCENARIOS.find(x=>x.id===d.scn)||{title:'',year:''};const F=d.factions[d.player];
 return `${sc.year} ${sc.title}　${F?F.name+'軍':''}　${d.year}年${d.month}月　<small class="itm">${d.savedAt||''}</small>`;}
function openSaves(){
 const can=S&&S.player&&!S.over;
 let h=`<table class="ed"><tbody>`+[1,2,3].map(i=>{const d=readSlot(i);return `<tr><td>欄位 ${i}</td><td>${slotLabel(d)}</td><td class="dpacts">${can?`<button data-sv="${i}">存入</button>`:''}${d?`<button data-ld="${i}">讀取</button><button data-del="${i}">刪除</button>`:''}</td></tr>`;}).join('')+`</tbody></table>`;
 h+=`<div id="cloud-box">${cloudHTML()}</div>`;
 h+=settingsHTML();
 h+=`<h3>匯出與匯入</h3><p class="hint">上方「欄位」的存檔只保存在這台裝置的瀏覽器裡。想換裝置或備份時，可以匯出成一段文字自行保存，再到別處貼上匯入。</p>
 <div class="dpacts">${can?'<button id="sv-exp">匯出目前進度</button>':''}<button id="sv-imp">匯入</button></div><textarea id="sv-txt" rows="4" placeholder="匯出的文字會出現在這裡；要匯入時，把文字貼在這裡再按「匯入」。"></textarea><p class="err" id="sv-err"></p>`;
 modal('存檔與讀檔',h,[{label:'關閉',primary:true}]);$('#modal .dlg').classList.add('wide');cloudRedraw();
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
$('#b-end').onclick=endTurn;$('#b-save').onclick=openSaves;$('#b-edit').onclick=openEditor;$('#b-roster').onclick=openRoster;$('#b-items').onclick=openItems;$('#b-dip').onclick=openDip;$('#b-pol').onclick=openPolicy;$('#b-ach').onclick=openAch;$('#b-tl').onclick=openTimeline;$('#b-new').onclick=showStart;$('#b-cont').onclick=openSaves;

