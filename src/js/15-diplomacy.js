/* ---------- 外交 ---------- */
function dk(a,b){return a<b?a+'|'+b:b+'|'+a;}
function rel(a,b){S.dip=S.dip||{};const k=dk(a,b);return S.dip[k]||(S.dip[k]={trust:50,ally:false,truce:0,focus:null,focusUntil:0,focusBy:null});}
function friendly(a,b){if(!a||!b||a===b)return false;const r=rel(a,b);return r.ally||r.truce>S.turn;}
function relLabel(a,b){if(!a||!b)return '';const r=rel(a,b);return r.ally?'同盟':r.truce>S.turn?`停戰，剩 ${r.truce-S.turn} 個月`:'敵對';}
function power(f){return citiesOf(f).reduce((a,c)=>a+c.troops,0);}
function strongest(){const al=Object.values(S.factions).filter(x=>x.alive);return al.length?al.sort((a,b)=>power(b.id)-power(a.id))[0].id:null;}
function borders(a,b){return citiesOf(a).some(c=>ADJ[c.name].some(n=>S.cities[n].owner===b));}
function threatShared(a,b){const t=strongest();if(!t||t===a||t===b)return false;return borders(a,t)&&borders(b,t);}
function adjTrust(a,b,v){if(!a||!b||a===b)return;const r=rel(a,b);r.trust=clamp(r.trust+v,0,100);}
function dipChance(env,f,kind){
 const r=rel(S.player,f);let p=(r.trust-35)/100+(env.pol+env.cha-120)/300;
 if(threatShared(S.player,f))p+=0.2;
 const ratio=power(f)/Math.max(1,power(S.player));
 if(kind==='ally'){if(ratio>2)p-=0.2;else if(ratio<0.7)p+=0.1;}
 if(kind==='truce'){p+=0.2;if(ratio<0.7)p+=0.15;}
 if(kind==='joint')p=0.3+r.trust/200+(env.cha-60)/200;
 return clamp(p,0.03,0.92);
}
function breakPact(f,why){
 const r=rel(S.player,f);const was=r.ally?'同盟':'停戰協定';r.ally=false;r.truce=0;r.focus=null;r.trust=clamp(r.trust-40,0,100);
 Object.keys(S.factions).forEach(x=>{if(x!==S.player&&x!==f)adjTrust(S.player,x,-10);});
 log(`${fname(S.player)}${why||''}破棄與${S.factions[f].name}的${was}，諸侯為之側目`,'bad');
}
function doDip(env,f,kind,arg){
 const c=S.cities[env.city],r=rel(S.player,f),fn=S.factions[f].name;env.done=true;
 if(kind==='gift'){c.gold-=arg;const v=Math.round(arg/50+env.cha/10);r.trust=clamp(r.trust+v,0,100);return{msg:`${env.name}出使${fn}，致贈 ${arg} 金，友好度 +${v}`,cls:'good'};}
 if(kind==='ally'||kind==='truce')c.gold-=100;
 if(Math.random()<dipChance(env,f,kind)){
  if(kind==='ally'){r.ally=true;r.truce=0;r.trust=clamp(r.trust+10,0,100);return{msg:`${env.name}出使${fn}，雙方締結同盟`,cls:'good'};}
  if(kind==='truce'){r.truce=S.turn+12;return{msg:`${env.name}出使${fn}，雙方約定停戰一年`,cls:'good'};}
  if(kind==='joint'){r.focus=arg;r.focusUntil=S.turn+3;r.focusBy=f;return{msg:`${fn}答應在三個月內出兵攻打${S.factions[arg].name}`,cls:'good'};}
 }
 r.trust=clamp(r.trust-3,0,100);
 return{msg:`${env.name}出使${fn}，${kind==='joint'?'對方婉拒出兵':'交涉失敗'}`};
}
function jointTarget(f){for(const k in S.dip){const r=S.dip[k];if(r.ally&&r.focusBy===f&&r.focusUntil>S.turn&&r.focus&&S.factions[r.focus].alive)return r.focus;}return null;}
function aiDiplomacy(){
 aiCoalition();
 const al=Object.values(S.factions).filter(x=>x.alive).map(x=>x.id);
 for(const k in S.dip){const r=S.dip[k];const[a,b]=k.split('|');if(!S.factions[a]||!S.factions[b]||!S.factions[a].alive||!S.factions[b].alive){r.ally=false;r.truce=0;continue;}
  r.trust=clamp(r.trust+(r.ally?1:r.trust<50?1:r.trust>50?-1:0),0,100);}
 for(const a of al)for(const b of al){if(a>=b)continue;const r=rel(a,b);const pl=a===S.player||b===S.player;
  if(r.ally){const[st,wk]=power(a)>=power(b)?[a,b]:[b,a];
   if(st!==S.player&&borders(st,wk)&&power(st)>2.5*power(wk)&&r.trust<70&&Math.random()<0.03){r.ally=false;r.trust=clamp(r.trust-40,0,100);log(`${S.factions[st].name}撕毀與${S.factions[wk].name}的同盟`,wk===S.player?'bad':'');}
   continue;}
  if(r.truce>S.turn)continue;
  if(pl){const f=a===S.player?b:a;const strong=power(S.player)>1.8*power(f);
   if(S.turn>=2&&r.trust>=35&&(threatShared(a,b)||strong)&&Math.random()<0.04&&!S.proposals.some(p=>p.f===f))S.proposals.push({f,kind:strong&&!threatShared(a,b)?'truce':'ally'});}
  else if(threatShared(a,b)&&r.trust>=40&&Math.random()<0.03){r.ally=true;log(`${S.factions[a].name}與${S.factions[b].name}締結同盟`);}
 }
}
function showProposals(done){
 const p=S.proposals.shift();if(!p){done&&done();return;}
 if(!S.factions[p.f].alive||friendly(S.player,p.f)){showProposals(done);return;}
 const fn=S.factions[p.f].name,r=rel(S.player,p.f);
 modal(`${fn}遣使來訪`,`<p>${fn}派遣使者前來，希望與我軍${p.kind==='ally'?'締結同盟':'停戰一年'}。</p><p class="hint">目前友好度 ${r.trust}。${fn}擁有 ${citiesOf(p.f).length} 城、兵 ${fmt(power(p.f))}。</p>`,
  [{label:'接受',primary:true,fn:()=>{if(p.kind==='ally'){r.ally=true;r.trust=clamp(r.trust+10,0,100);log(`與${fn}締結同盟`,'good');}else{r.truce=S.turn+12;log(`與${fn}約定停戰一年`,'good');}render();showProposals(done);}},
   {label:'拒絕',fn:()=>{r.trust=clamp(r.trust-5,0,100);log(`回絕了${fn}的提議`);render();showProposals(done);}}]);
}
const DP={env:null,gift:500};
function openDip(){if(!S||!S.player)return;modal('外交','<div id="dp"></div>',[{label:'關閉',primary:true,fn:()=>render()}]);$('#modal .dlg').classList.add('wide');drawDip();}
function drawDip(){
 const envs=S.officers.filter(o=>o.fac===S.player&&!o.done).sort((a,b)=>(b.pol+b.cha)-(a.pol+a.cha));
 if(!envs.some(o=>o.id===DP.env))DP.env=envs[0]?envs[0].id:null;
 const env=DP.env!=null?S.officers[DP.env]:null,c=env&&S.cities[env.city];
 let h=`<div class="edbar"><label>使者 <select id="dp-env">${envs.map(o=>`<option value="${o.id}" ${o.id===DP.env?'selected':''}>${o.name}（政${o.pol} 魅${o.cha}｜${o.city} 金 ${fmt(S.cities[o.city].gold)}）</option>`).join('')}</select></label><label>禮金 <select id="dp-gift">${[200,500,1000].map(v=>`<option value="${v}" ${v===DP.gift?'selected':''}>${v}</option>`).join('')}</select></label></div>`;
 if(!env)h+=`<p class="hint">本月已沒有可派遣的武將。</p>`;
 h+=`<p class="hint">交涉成敗取決於使者的政治與魅力、雙方友好度、兵力對比，以及是否面對共同的強敵。提議同盟或停戰需備禮 100 金，金錢從使者所在城支出。盟友與停戰對象不會攻打你；你若出兵攻打他們，就會破棄盟約，其他勢力對你的友好度也會下降。${isOuter(S.player)?'周邊勢力可向中原諸侯遣使朝貢：獻 300 金，獲回賜糧 1,500、友好度 +15，友好度達 45 即受冊封停戰一年。':'兵力遠勝周邊勢力時可要求其朝貢，成功可得貢金並停戰一年。'}</p>`;
 h+=`<div class="edlist"><table class="ed"><thead><tr><th>勢力</th><th>城／兵</th><th>友好度</th><th>關係</th><th>對方態度</th><th>交涉</th></tr></thead><tbody>`;
 Object.values(S.factions).filter(f=>f.alive&&f.id!==S.player).forEach(f=>{
  const r=rel(S.player,f.id),fr=friendly(S.player,f.id);
  const p=env?dipChance(env,f.id,'ally'):0;const att=!env?'—':p>=0.5?'友好':p>=0.25?'普通':'冷淡';
  const dis=v=>!env||c.gold<v?'disabled':'';
  let acts=`<button data-dp="gift" data-f="${f.id}" ${dis(DP.gift)}>贈禮</button>`;
  if(!r.ally)acts+=`<button data-dp="ally" data-f="${f.id}" ${dis(100)}>提議同盟（約 ${env?Math.round(p*100):0}%）</button>`;
  if(!fr)acts+=`<button data-dp="truce" data-f="${f.id}" ${dis(100)}>提議停戰（約 ${env?Math.round(dipChance(env,f.id,'truce')*100):0}%）</button>`;
  if(r.ally){const foes=Object.values(S.factions).filter(x=>x.alive&&x.id!==S.player&&x.id!==f.id&&!friendly(f.id,x.id)&&borders(f.id,x.id));
   if(foes.length)acts+=`<select data-jt="${f.id}">${foes.map(x=>`<option value="${x.id}">${x.name}</option>`).join('')}</select><button data-dp="joint" data-f="${f.id}" ${dis(0)}>請求共同出兵</button>`;
   const jt=r.focusBy===f.id&&r.focusUntil>S.turn&&r.focus?`<small class="itm">正在出兵攻打${S.factions[r.focus].name}</small>`:'';acts+=jt;}
  if(isOuter(f.id)&&!isOuter(S.player)&&!fr)acts+=`<button data-dp="demand" data-f="${f.id}" ${dis(0)}>要求朝貢（約 ${env?Math.round(tributeChance(env,f.id)*100):0}%，${fmt(tributeGain(f.id))} 金）</button>`;
  if(isOuter(S.player)&&!isOuter(f.id))acts+=`<button data-dp="pay" data-f="${f.id}" ${dis(300)}>遣使朝貢（300 金）</button>`;
  if(fr)acts+=`<button data-dp="break" data-f="${f.id}">破棄${r.ally?'同盟':'停戰'}</button>`;
  h+=`<tr><td><span class="dot" style="background:${f.color}"></span>${f.name}</td><td>${citiesOf(f.id).length}／${wan(power(f.id))}</td><td><div class="tbar" style="width:70px;display:inline-block;vertical-align:middle"><i style="width:${r.trust}%;background:${f.color}"></i></div> ${r.trust}</td><td>${relLabel(S.player,f.id)}</td><td>${att}</td><td class="dpacts">${acts}</td></tr>`;
 });
 h+=`</tbody></table></div>`;
 $('#dp').innerHTML=h;
}
$('#modal').addEventListener('change',e=>{const t=e.target;if(t.id==='dp-env'){DP.env=+t.value;drawDip();}if(t.id==='dp-gift'){DP.gift=+t.value;drawDip();}});
$('#modal').addEventListener('click',e=>{const b=e.target.closest('[data-dp]');if(!b)return;const f=b.dataset.f,k=b.dataset.dp;
 if(k==='break'){breakPact(f);drawDip();return;}
 const env=S.officers[DP.env];if(!env)return;
 const arg=k==='gift'?DP.gift:k==='joint'?document.querySelector(`[data-jt="${f}"]`).value:null;
 const r=k==='demand'||k==='pay'?doTribute(env,f,k):doDip(env,f,k,arg);log(r.msg,r.cls);toast(r.msg);drawDip();autoSaveSoon();});
