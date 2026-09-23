/* ---------- 寶物 ---------- */
function itemsOf(o){return (S&&S.items||[]).filter(i=>i.owner===o.id);}
function unequip(it){const o=it.owner!=null&&S.officers[it.owner];if(o){o.bonus=o.bonus||{};for(const k in it.b){o[k]-=it.b[k];o.bonus[k]-=it.b[k];}}it.owner=null;}
function equip(o,it){
 const items=(S&&S.items&&S.items.includes(it))?S.items:null;
 const st=items?S:null;
 const pool=items||[it];
 if(it.owner!=null&&st)unequip(it);
 if(st){const old=S.items.find(i=>i.owner===o.id&&i.type===it.type&&i!==it);if(old){unequip(old);old.fac=o.fac;}}
 o.bonus=o.bonus||{};for(const k in it.b){o[k]+=it.b[k];o.bonus[k]=(o.bonus[k]||0)+it.b[k];}
 it.owner=o.id;it.fac=o.fac;it.found=true;it.city=null;
}
function base(o,k){return o[k]-((o.bonus||{})[k]||0);}
function syncItems(){
 if(!S.items)return;
 S.items.forEach(it=>{
  if(it.owner!=null){const o=S.officers[it.owner];
   if(o.fac==='captive'){unequip(it);it.fac=S.player;log(`沒收${o.name}的${it.name}`,'good');}
   else if(o.fac==='gone'||o.fac==='unborn'){const f=it.fac;unequip(it);if(!(f&&S.factions[f]&&S.factions[f].alive)){it.fac=null;it.found=false;it.city=pick(Object.keys(S.cities));}}
   else it.fac=o.fac;
  }else if(it.fac&&S.factions[it.fac]&&!S.factions[it.fac].alive){it.fac=null;it.found=false;it.city=pick(Object.keys(S.cities));}
 });
}
const ISTAT={武器:'war',名馬:'lea',兵書:'int',寶物:'cha'};
function aiEquip(f){
 S.items.filter(it=>it.owner==null&&it.fac===f).forEach(it=>{
  const cand=S.officers.filter(o=>o.fac===f&&!itemsOf(o).some(i=>i.type===it.type)).sort((a,b)=>b[ISTAT[it.type]]-a[ISTAT[it.type]])[0];
  if(cand)equip(cand,it);});
}
function openItems(){
 if(!S||!S.player)return;
 modal('寶物','<div id="it"></div>',[{label:'關閉',primary:true,fn:()=>render()}]);
 $('#modal .dlg').classList.add('wide');drawItems();
}
function drawItems(){
 const mine=S.officers.filter(o=>o.fac===S.player).sort((a,b)=>b.cha-a.cha);
 const hidden=S.items.filter(i=>i.owner==null&&i.fac==null).length;
 let h=`<p class="hint">每位武將可各配戴一件武器、名馬、兵書與寶物，能力加成會直接計入。名馬另讓部隊在戰場上多走一格。尚有 ${hidden} 件寶物下落不明，在己方城池「搜索」時有機會發現；俘虜敵將時會沒收其寶物。</p>`;
 h+=`<div class="edlist"><table class="ed"><thead><tr><th>寶物</th><th>類別</th><th>效果</th><th>持有</th><th>配給</th></tr></thead><tbody>`;
 ITYPES.forEach(tp=>S.items.filter(i=>i.type===tp).forEach(it=>{
  const o=it.owner!=null?S.officers[it.owner]:null;const ownIt=it.fac===S.player;
  let who=o?`${o.name}（${facLabel(o)}）`:ownIt?'我軍庫藏':it.fac?`${S.factions[it.fac].name}軍庫藏`:'下落不明';
  let give=ownIt?`<select data-give="${it.id}" aria-label="把${it.name}交給"><option value="">— 選擇武將 —</option><option value="store" ${!o?'selected':''}>收入庫藏</option>${mine.map(m=>`<option value="${m.id}" ${o&&o.id===m.id?'selected':''}>${m.name}（${SN[ISTAT[tp]]} ${base(m,ISTAT[tp])}）${itemsOf(m).some(x=>x.type===tp&&x!==it)?'，換下 '+itemsOf(m).find(x=>x.type===tp).name:''}</option>`).join('')}</select>`:'';
  h+=`<tr><td>${it.found||it.fac?it.name:'？？？'}</td><td>${tp}</td><td>${it.found||it.fac?bonusText(it.b):'—'}</td><td>${who}</td><td>${give}</td></tr>`;}));
 h+=`</tbody></table></div>`;
 $('#it').innerHTML=h;
}
$('#modal').addEventListener('change',e=>{const t=e.target;if(!t.dataset||t.dataset.give==null)return;const it=S.items[+t.dataset.give];
 if(t.value==='store'){if(it.owner!=null){const n=S.officers[it.owner].name;unequip(it);it.fac=S.player;log(`${it.name}自${n}收回庫藏`);}}
 else if(t.value!==''){const o=S.officers[+t.value];equip(o,it);o.loy=Math.min(100,(o.loy||70)+15);log(`將${it.name}賜予${o.name}`,'good');}
 drawItems();});
