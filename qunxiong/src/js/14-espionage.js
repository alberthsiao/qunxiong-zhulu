/* ---------- 情報與諜報 ---------- */
function within2(cn){const out=new Set();ADJ[cn].forEach(a=>{out.add(a);ADJ[a].forEach(b=>out.add(b));});out.delete(cn);return[...out];}
function visible(cn){const c=S.cities[cn];if(!c.owner||c.owner===S.player)return true;
 if(S.intel&&S.intel[cn]>S.turn)return true;if(S.dip&&rel(S.player,c.owner).ally)return true;
 return ADJ[cn].some(n=>S.cities[n].owner===S.player);}
function fuzz(c){const k=((S.turn*7+c.name.charCodeAt(0)*13)%61-30)/100;return Math.max(0,Math.round(c.troops*(1+k)/100)*100);}
const SPYA={recon:['偵察',50,'取得該城六個月的詳細情報'],rumor:['流言',100,'城中武將下個月無法執行命令'],incite:['煽動',150,'民心動盪，商業、農業、人口與金錢減少'],fire:['放火',150,'燒毀城中三成糧食並損壞城防'],poach:['挖角',300,'策反敵將投奔我方（須先取得情報）']};
function spyDef(c){const o=c.owner?officersIn(c.name,c.owner):[];return o.length?Math.max(...o.map(x=>x.int)):30;}
function spyChance(o,c,act,t){
 if(act==='poach'){const their=S.officers[S.factions[t.fac].lord],mine=S.officers[S.factions[o.fac].lord];if(t.loy>=100||their.id===t.id)return 0;
  return clamp(0.5+((o.cha+mine.cha)/2-their.cha)/100-(t.loy-50)/80,0.02,0.85);}
 return clamp((act==='recon'?0.65:0.4)+(o.int-spyDef(c))/100,0.08,0.92);
}
function doSpy(o,cn,act,tid){
 const c=S.cities[cn],home=S.cities[o.city],f=o.fac,vf=c.owner;o.done=true;gainExp(o,'int',12);home.gold-=SPYA[act][1];
 const t=tid!=null?S.officers[tid]:null;const p=spyChance(o,c,act,t);const vn=S.factions[vf].name;
 if(Math.random()<p){
  if(act==='recon'){S.intel[cn]=S.turn+6;return{msg:`${o.name}潛入${cn}，取得${vn}軍的詳細情報`,cls:'good'};}
  adjTrust(f,vf,-5);
  if(act==='rumor'){c.unrest=S.turn+1;c.ppl=Math.max(0,(c.ppl??60)-10);return{msg:`${o.name}在${cn}散布流言，${vn}軍人心惶惶`,cls:'good'};}
  if(act==='incite'){const r=rnd(0.1,0.2);c.ppl=Math.max(0,(c.ppl??60)-15);c.trade=Math.round(c.trade*(1-r));c.farm=Math.round(c.farm*(1-r));c.pop=Math.round(c.pop*0.97);c.gold=Math.round(c.gold*0.8);return{msg:`${o.name}在${cn}煽動百姓，商業與農業下滑約 ${Math.round(r*100)}%`,cls:'good'};}
  if(act==='fire'){const l=Math.round(c.food*0.3);c.food-=l;c.def=Math.round(c.def*0.9);return{msg:`${o.name}在${cn}放火，燒毀糧食 ${fmt(l)}`,cls:'good'};}
  if(act==='poach'){t.fac=f;t.city=o.city;t.done=true;t.loy=60;return{msg:`${o.name}成功策反${vn}軍的${t.name}，${t.name}率眾投奔`,cls:'good'};}
 }
 if(Math.random()<0.15&&S.factions[o.fac].lord!==o.id){adjTrust(f,vf,-10);const r={msg:`${o.name}在${cn}行動失敗，遭${vn}軍識破擒獲！`,cls:'bad'};captureOfficer(o,vf,cn);syncItems();return r;}
 return{msg:`${o.name}對${cn}的${SPYA[act][0]}未能成功，平安歸來`};
}
function openSpy(){
 const c=S.cities[ui.sel];
 const idle=officersIn(c.name,S.player).filter(o=>!o.done).sort((a,b)=>b.int-a.int);
 const tg=within2(c.name).filter(n=>S.cities[n].owner&&S.cities[n].owner!==S.player);
 const body=`<label class="fld">執行武將<select id="sp-o">${idle.map(o=>`<option value="${o.id}">${o.name}（智 ${o.int} 魅 ${o.cha}）</option>`).join('')}</select></label>
 <label class="fld">目標城池（兩格內）<select id="sp-c">${tg.map(n=>`<option value="${n}">${n}（${fname(S.cities[n].owner)}${visible(n)?'':'，情報不明'}）</option>`).join('')}</select></label>
 <label class="fld">行動<select id="sp-a">${Object.entries(SPYA).map(([k,v])=>`<option value="${k}">${v[0]}：${v[2]}（${v[1]} 金）</option>`).join('')}</select></label>
 <label class="fld" id="sp-tw">挖角對象<select id="sp-t"></select></label><p class="hint" id="sp-p"></p><p class="err" id="sp-e"></p>`;
 modal('諜報',body,[{label:'派出',primary:true,fn:()=>{
  const o=S.officers[+$('#sp-o').value],cn=$('#sp-c').value,a=$('#sp-a').value,tv=$('#sp-t').value;
  if(c.gold<SPYA[a][1]){$('#sp-e').textContent=`金錢不足，需要 ${SPYA[a][1]} 金。`;return false;}
  if(a==='poach'&&!tv){$('#sp-e').textContent='沒有可挖角的對象。';return false;}
  const r=doSpy(o,cn,a,a==='poach'?+tv:null);log(r.msg,r.cls);render();checkFactions();}},{label:'取消'}]);
 const upd=()=>{const o=S.officers[+$('#sp-o').value],cn=$('#sp-c').value,a=$('#sp-a').value,tc=S.cities[cn];
  $('#sp-tw').style.display=a==='poach'?'':'none';let t=null;
  if(a==='poach'){const cand=visible(cn)?officersIn(cn,tc.owner).filter(x=>S.factions[x.fac].lord!==x.id):[];
   const prev=$('#sp-t').value;$('#sp-t').innerHTML=cand.map(x=>`<option value="${x.id}" ${String(x.id)===prev?'selected':''}>${x.name}（統${x.lea} 武${x.war} 智${x.int}）</option>`).join('');
   t=cand.length?S.officers[+$('#sp-t').value]:null;
   if(!visible(cn)){$('#sp-p').textContent='目標城池情報不明，看不到城中武將，請先偵察。';return;}
   if(!t){$('#sp-p').textContent='城中沒有可挖角的武將。';return;}}
  $('#sp-p').textContent=`成功率約 ${Math.round(spyChance(o,tc,a,t)*100)}%。${a==='poach'?'對方忠誠越高越難策反；忠誠 100 的武將不會背叛。':'對方城中守將智力越高越難成功。'}失敗時使者有機會被擒。`;};
 ['#sp-o','#sp-c','#sp-a','#sp-t'].forEach(k=>$(k).onchange=upd);upd();
}
function aiSpy(f){
 if(Math.random()>0.25)return;
 const offs=S.officers.filter(o=>o.fac===f&&!o.done&&S.factions[f].lord!==o.id&&o.int>=70);if(!offs.length)return;
 const o=offs.sort((a,b)=>b.int-a.int)[0],home=S.cities[o.city];if(!home||home.gold<400)return;
 const tg=within2(o.city).map(n=>S.cities[n]).filter(c=>c.owner&&c.owner!==f&&!friendly(f,c.owner));if(!tg.length)return;
 const c=pick(tg);let act=pick(['rumor','incite','fire','poach']),tid=null;
 if(act==='poach'){const cand=officersIn(c.name,c.owner).filter(x=>S.factions[x.fac].lord!==x.id&&x.loy<85);if(!cand.length)act='rumor';else tid=cand.sort((a,b)=>a.loy-b.loy)[0].id;}
 const victim=c.owner;const r=doSpy(o,c.name,act,tid);
 if(victim===S.player){const ok=r.cls==='good';log(ok?`敵方間諜得手：${r.msg}`:`識破${S.factions[f].name}軍的間諜：${r.msg}`,ok?'bad':'good');}
}
