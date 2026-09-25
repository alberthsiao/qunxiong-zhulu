/* ---------- 情報台：側欄底部的日誌區改為三個分頁（日誌／軍情／大事），可展開 ---------- */
const INTEL={tab:'log',big:false};
function intelLog(){return S.log.slice(0,40).map(l=>`<p class="${l.c}"><time>${l.t}</time>${l.m}</p>`).join('')||'<p class="hint">尚無日誌。</p>';}
function intelMil(){
 if(!S.player||!S.factions[S.player].alive)return '<p class="hint">—</p>';
 const f=S.player,out=[];
 const front=citiesOf(f).filter(c=>isFront(c,f));
 const rows=front.map(c=>{const foes=ADJ[c.name].map(n=>S.cities[n]).filter(t=>t.owner&&t.owner!==f&&!friendly(f,t.owner));const mx=foes.reduce((a,t)=>Math.max(a,t.troops),0);const th=mx>c.troops*1.2;
  return{c,foes,mx,th};}).sort((a,b)=>(b.mx/Math.max(1,b.c.troops))-(a.mx/Math.max(1,a.c.troops)));
 out.push('<h4>前線</h4>');
 if(!rows.length)out.push('<p class="hint">沒有與敵接壤的城池。</p>');
 rows.forEach(({c,foes,mx,th})=>{out.push(`<p class="${th?'bad':''}"><b>${c.name}</b>　守兵 ${fmt(c.troops)}　${foes.map(t=>`${t.name}（${fname(t.owner)}${visible(t.name)?' '+wan(t.troops):' ?'}）`).join('、')}${th?'　⚠ 敵勢過強':''}</p>`);});
 if(S.incoming&&S.incoming.length)out.push(`<p class="bad">本月來襲：${S.incoming.map(it=>`${fname(it.f)}攻${it.t}（${wan(it.n)}）`).join('、')}</p>`);
 const warn=[];citiesOf(f).forEach(c=>{if(c.food<c.troops/40*3)warn.push(`${c.name}糧僅夠 ${Math.floor(c.food/Math.max(1,c.troops/40))} 個月`);if((c.ppl??60)<35)warn.push(`${c.name}民忠 ${Math.round(c.ppl)}，有暴動之虞`);if(c.gold<100)warn.push(`${c.name}金不足 100`);});
 const low=S.officers.filter(o=>o.fac===f&&!isLord(o)&&o.loy<70).sort((a,b)=>a.loy-b.loy).slice(0,6);
 if(low.length)warn.push(`忠誠偏低：${low.map(o=>`${o.name} ${o.loy}`).join('、')}`);
 out.push('<h4>警訊</h4>'+(warn.length?warn.map(w=>`<p class="bad">${w}</p>`).join(''):'<p class="hint">內政無虞。</p>'));
 const dip=Object.values(S.factions).filter(x=>x.alive&&x.id!==f).map(x=>{const r=rel(f,x.id);const st=r.ally?'同盟':r.truce>S.turn?`停戰 ${r.truce-S.turn} 月`:borders(f,x.id)?'接壤':'';return st?`${x.name} ${st}（${r.trust}）`:null;}).filter(Boolean);
 out.push('<h4>外交</h4><p>'+(dip.join('、')||'—')+'</p>');
 const h=hegemon();if(h)out.push(`<p class="hint">霸主：${S.factions[h].name}（${citiesOf(h).length} 城）${h===f?'，諸侯可能合縱抗我':''}</p>`);
 const intel=Object.entries(S.intel||{}).filter(([n,t])=>t>S.turn).map(([n,t])=>`${n}（${t-S.turn} 月）`);
 if(intel.length)out.push(`<p class="hint">偵察情報有效：${intel.join('、')}</p>`);
 return out.join('');
}
function intelChron(){const ch=(S.chron||[]).slice(-60).reverse();return ch.length?ch.map(([y,m,t])=>`<p><time>${y}年${m}月</time>${t}</p>`).join(''):'<p class="hint">尚無大事。</p>';}
function renderIntel(){
 const box=$('#log');if(!box)return;
 const tabs=[['log','日誌'],['mil','軍情'],['chron','大事']];
 const inc=S.incoming&&S.incoming.length;
 box.className='intel'+(INTEL.big?' big':'');
 box.innerHTML=`<div class="ihd"><b>情報台</b>${tabs.map(([k,n])=>`<button data-it="${k}" class="${INTEL.tab===k?'on':''}">${n}${k==='mil'&&inc?' ●':''}</button>`).join('')}<span class="spacer"></span><button data-it="size" aria-label="展開">${INTEL.big?'▾':'▴'}</button></div><div class="ibody">${INTEL.tab==='log'?intelLog():INTEL.tab==='mil'?intelMil():intelChron()}</div>`;
}
$('#log').addEventListener('click',e=>{const b=e.target.closest('[data-it]');if(!b)return;if(b.dataset.it==='size')INTEL.big=!INTEL.big;else INTEL.tab=b.dataset.it;renderIntel();});
