/* ---------- 帳號存檔：以 Claude Artifact 發布時，存到觀看者帳號的私人空間 ---------- */
/* 只有在 Artifact 執行環境（window.claude.use）且頁面宣告了 user、db 能力時才會啟用；其他情況（本機開檔、公開版）一律靜默停用 */
const CLOUD={db:null,uid:null,name:'',docs:{},state:'off',busy:false};
const CLOUD_MAX=250*1024;
async function cloudInit(){
 try{
  if(!window.claude||typeof window.claude.use!=='function')return;
  CLOUD.state='wait';cloudRedraw();
  const[user,db]=await Promise.all([window.claude.use('user'),window.claude.use('db')]);
  if(!user||!db){CLOUD.state='off';cloudRedraw();return;}
  const me=await user.me();
  if(!me.id){CLOUD.state='anon';cloudRedraw();return;}
  CLOUD.db=db;CLOUD.uid=me.id;CLOUD.name=me.name||'';CLOUD.state='on';
  await cloudRefresh();
 }catch(e){CLOUD.state='off';}
 cloudRedraw();
}
const cloudRef=i=>CLOUD.db.doc(`data/users/${CLOUD.uid}/slot${i}`);
async function cloudRefresh(){
 const snap=await CLOUD.db.collection('data/users/'+CLOUD.uid).get();
 CLOUD.docs={};snap.docs.forEach(d=>{const m=/^slot([1-3])$/.exec(d.id);if(m&&d.exists)CLOUD.docs[m[1]]=d.data();});
}
function cloudErr(e){const c=e&&e.code;return c==='quota_exceeded'?'帳號存檔空間已滿':c==='resource_exhausted'?'操作太頻繁，請稍候再試':c==='revoked'||c==='not_granted'?'目前無法使用帳號存檔':c==='invalid_argument'?'這個帳號沒有寫入權限':'連線不穩，請稍後再試';}
async function cloudDo(fn,okMsg){
 if(CLOUD.busy||CLOUD.state!=='on')return;CLOUD.busy=true;cloudRedraw();
 try{await fn();await cloudRefresh();if(okMsg)toast(okMsg);}catch(e){toast(cloudErr(e));}
 CLOUD.busy=false;cloudRedraw();
}
function cloudSave(i){
 const json=dumpState();
 if(new Blob([json]).size>CLOUD_MAX){toast('這份進度太大，無法存到帳號，請改用本機存檔或匯出');return;}
 const F=S.factions[S.player];
 return cloudDo(()=>cloudRef(i).set({v:1,savedAt:S.savedAt,scn:S.scn,fname:F?F.name:'',year:S.year,month:S.month,json}),`已存入帳號欄位 ${i}`);
}
function cloudLoad(i){const d=CLOUD.docs[i];if(!d)return;try{const st=JSON.parse(d.json);if(!st.officers||!st.cities)throw 0;loadState(st);}catch(e){toast('這份帳號存檔已損壞，無法讀取');}}
function cloudDelete(i){return cloudDo(()=>cloudRef(i).delete(),`已刪除帳號欄位 ${i}`);}
function cloudLabel(d){if(!d)return '<span class="hint">空</span>';const sc=SCENARIOS.find(x=>x.id===d.scn)||{title:'',year:''};return `${sc.year} ${sc.title}　${d.fname?d.fname+'軍':''}　${d.year}年${d.month}月　<small class="itm">${d.savedAt||''}</small>`;}
function cloudHTML(){
 const can=S&&S.player&&!S.over;
 if(CLOUD.state==='off')return '';
 let h='<h3>帳號存檔</h3>';
 if(CLOUD.state==='wait')return h+'<p class="hint">正在連接帳號……</p>';
 if(CLOUD.state==='anon')return h+'<p class="hint">目前沒有登入可用的帳號，進度只能存在這台裝置。以組織成員的 Claude 帳號開啟這個頁面，就能把進度存進帳號、換裝置接著玩。</p>';
 h+=`<p class="hint">已登入<b id="cloud-name"></b>。存在這裡的進度跟著帳號走，換手機或電腦開啟同一個頁面就能接著玩；只有你自己看得到。</p>`;
 h+=`<table class="ed"><tbody>`+[1,2,3].map(i=>{const d=CLOUD.docs[i];const dis=CLOUD.busy?'disabled':'';return `<tr><td>帳號 ${i}</td><td>${cloudLabel(d)}</td><td class="dpacts">${can?`<button data-csv="${i}" ${dis}>存入</button>`:''}${d?`<button data-cld="${i}" ${dis}>讀取</button><button data-cdel="${i}" ${dis}>刪除</button>`:''}</td></tr>`;}).join('')+`</tbody></table>`;
 return h;
}
function cloudRedraw(){
 const box=$('#cloud-box');if(box){box.innerHTML=cloudHTML();const n=$('#cloud-name');if(n)n.textContent=CLOUD.name?`：${CLOUD.name}`:'';}
 if(!$('#start').hidden&&!START.scn)$('#b-cont').hidden=!hasAnySave();
}
function hasAnySave(){return [1,2,3].some(i=>readSlot(i))||Object.keys(CLOUD.docs).length>0;}
$('#modal').addEventListener('click',e=>{
 const b=e.target.closest('[data-csv],[data-cld],[data-cdel]');if(!b)return;
 if(b.dataset.csv)cloudSave(b.dataset.csv);
 else if(b.dataset.cld)cloudLoad(b.dataset.cld);
 else if(b.dataset.cdel)cloudDelete(b.dataset.cdel);
});
/* ---------- 排行榜（帳號版）：天下大勢結算後把分數寫入共用集合 scores ---------- */
async function cloudScore(sc,rk){
 if(CLOUD.state!=='on')return;
 try{await CLOUD.db.doc(`scores/${CLOUD.uid}_${S.scn}`).set({uid:CLOUD.uid,scn:S.scn,fname:S.factions[S.player].name,total:sc.total,rank:rk,cities:citiesOf(S.player).length,year:S.year,at:new Date().toISOString()});toast('已登錄排行榜');}catch(e){toast(cloudErr(e));}
}
async function openLeaderboard(){
 if(CLOUD.state!=='on'){toast('排行榜只在帳號版提供');return;}
 modal('天下大勢排行榜','<p class="hint">讀取中……</p>',[{label:'關閉',primary:true}]);
 try{
  const snap=await CLOUD.db.collection('scores').orderBy('total','desc').limit(20).get();
  const rows=snap.docs.filter(d=>d.exists).map(d=>d.data());
  let names={};try{const user=await window.claude.use('user');if(user)names=await user.profiles(rows.map(r=>r.uid));}catch(e){}
  const sc=id=>(SCENARIOS.find(x=>x.id===id)||{title:id}).title;
  const h=rows.length?`<table class="ed sim"><thead><tr><th>#</th><th>玩家</th><th>劇本</th><th>勢力</th><th>城</th><th>總分</th><th>評等</th></tr></thead><tbody>${rows.map((r,i)=>`<tr${r.uid===CLOUD.uid?' style="font-weight:700"':''}><td class="num">${i+1}</td><td></td><td>${sc(r.scn)}</td><td>${r.fname}軍</td><td class="num">${r.cities}</td><td class="num">${r.total}</td><td>${r.rank}</td></tr>`).join('')}</tbody></table>`:'<p class="hint">還沒有人登錄分數。到 250 年完成天下大勢結算就會自動登錄。</p>';
  $('#m-body').innerHTML=`<p class="hint">組織內玩家的天下大勢結算成績，每人每個劇本保留最新一筆。</p>${h}`;
  const cells=$('#m-body').querySelectorAll('tbody tr td:nth-child(2)');rows.forEach((r,i)=>{if(cells[i])cells[i].textContent=(names[r.uid]&&names[r.uid].name)||(r.uid===CLOUD.uid?'我':'某位玩家');});
  $('#modal .dlg').classList.add('wide');
 }catch(e){$('#m-body').innerHTML=`<p class="err">${cloudErr(e)}</p>`;}
}
