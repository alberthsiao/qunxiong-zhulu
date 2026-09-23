/* ---------- 勝利條件與結局：劇本目標、稱帝、天下大勢結算 ---------- */
const END_YEAR=250;
/* 劇本目標：依開局城數決定，達成後可得「霸業初成」，未達成不影響遊戲 */
function makeGoal(f){const n=citiesOf(f).length;const sc=SCENARIOS.find(x=>x.id===S.scn);return{cities:Math.min(Object.keys(S.cities).length,Math.max(6,n*2+2)),year:sc.year+15,done:false,failed:false};}
function goalText(){const g=S.goal;if(!g)return '';return `${g.year} 年前據有 ${g.cities} 座城`+(g.done?'（已達成）':g.failed?'（未能如期達成）':'');}
function checkGoal(){
 const g=S.goal;if(!g||g.done||g.failed||!S.player)return;
 if(citiesOf(S.player).length>=g.cities){g.done=true;loyAll(S.player,5);log(`霸業初成：如期據有 ${g.cities} 城，眾將士氣大振`,'good');pushEvent('霸業初成',`<p class="evt">${lordOf(S.player).name}於 ${S.year} 年據有 ${g.cities} 座城池，達成劇本目標。天下英雄，皆側目而視。</p><p class="hint">接下來可以爭取稱帝，或在 ${END_YEAR} 年的天下大勢結算中取得更高評價；當然，也可以繼續掃平群雄。</p>`);unlockAch('goal');}
 else if(S.year>g.year){g.failed=true;log(`未能在 ${g.year} 年前據有 ${g.cities} 城，劇本目標未達成`,'bad');}
}
/* 稱帝：城池達 13 座且傳國玉璽在手，群臣勸進 */
function hasSeal(f){const it=(S.items||[]).find(i=>i.name==='傳國玉璽');if(!it)return false;if(it.owner!=null)return S.officers[it.owner].fac===f;return it.fac===f;}
function checkEmperor(){
 const F=S.factions[S.player];if(!F||!F.alive||F.emperor||S.evDone.chanhan)return;
 if(citiesOf(S.player).length<13||!hasSeal(S.player))return;
 if((S.evDone.jinjin||0)>S.turn)return;S.evDone.jinjin=S.turn+36;
 const L=lordOf(S.player);
 pushEvent('群臣勸進',`<p class="evt">群臣上表：「天命不可以久稽，神器不可以久曠。」${L.name}據有十三州郡之地，又得傳國玉璽，眾人請即皇帝位。</p>`+hz('漢末群雄中，袁術 197 年僭號最早而速亡；曹丕 220 年受禪、劉備 221 年稱帝、孫權 229 年稱帝，三國鼎立於焉成形。稱帝可以凝聚人心，也會成為眾矢之的。'),
  [{label:'即皇帝位（全軍忠誠 +10，諸侯友好 −15）',primary:true,fn:()=>{F.emperor=true;loyAll(S.player,10);Object.keys(S.factions).forEach(x=>{if(x!==S.player)adjTrust(S.player,x,-15);});log(`${L.name}登基稱帝，改元建號`,'good');unlockAch('emperor');checkTitles();}},
   {label:'時機未到，再三辭讓',fn:()=>{log(`${L.name}辭讓帝位，群臣三年後再勸`);}}]);
}
/* 天下大勢結算：END_YEAR 一月，依版圖、人才、人口、民忠、稱帝與劇本目標評分 */
function settleScore(f){
 const cs=citiesOf(f),tot=Object.keys(S.cities).length;
 const s={cities:cs.length*100,offs:S.officers.filter(o=>o.fac===f).length*8,pop:Math.round(cs.reduce((a,c)=>a+c.pop,0)/20000),ppl:Math.round(cs.reduce((a,c)=>a+(c.ppl??60),0)/Math.max(1,cs.length))*3,emperor:S.factions[f].emperor?500:0,goal:S.goal&&S.goal.done&&f===S.player?300:0};
 s.total=Object.values(s).reduce((a,b)=>a+b,0);s.share=cs.length/tot;return s;
}
function rankOf(s){return s.share>=0.6?'S':s.share>=0.4?'A':s.share>=0.25?'B':s.share>=0.12?'C':'D';}
function checkSettle(){
 if(S.over||S.settled||S.year<END_YEAR)return;
 S.settled=true;
 const rows=Object.values(S.factions).filter(x=>x.alive).map(x=>({x,s:settleScore(x.id)})).sort((a,b)=>b.s.total-a.s.total);
 const me=rows.find(r=>r.x.id===S.player);const rk=me?rankOf(me.s):'D';const pos=rows.findIndex(r=>r.x.id===S.player)+1;
 const verdict={S:'天下歸心，霸業已成，史書當以本朝紀年。',A:'雄踞一方，與群雄鼎足而立，足以名垂青史。',B:'割據一隅，進退有據，尚可再圖天下。',C:'偏安一方，力保不失，仍需勵精圖治。',D:'勢單力孤，僅存宗廟，後人為之歎息。'}[rk];
 const tbl=`<table class="ed sim"><thead><tr><th>勢力</th><th>城</th><th>將</th><th>總分</th><th>評等</th></tr></thead><tbody>${rows.slice(0,8).map(r=>`<tr${r.x.id===S.player?' style="font-weight:700"':''}><td><span class="dot" style="background:${r.x.color}"></span>${r.x.name}${r.x.emperor?'（帝）':''}</td><td class="num">${citiesOf(r.x.id).length}</td><td class="num">${S.officers.filter(o=>o.fac===r.x.id).length}</td><td class="num">${r.s.total}</td><td>${rankOf(r.s)}</td></tr>`).join('')}</tbody></table>`;
 unlockAch('settle'+rk);if(me)cloudScore(me.s,rk);
 modal(`${END_YEAR} 年　天下大勢`,`<p class="evt">歲月流轉，群雄逐鹿三十餘年。${me?`${S.factions[S.player].name}軍名列第 ${pos}，評等 <b>${rk}</b>。${verdict}`:''}</p>${tbl}<p class="hint">評等依版圖比例：六成以上 S、四成 A、二成五 B、一成二 C。總分另計武將、人口、民忠、稱帝與劇本目標。</p>`,
  [{label:'留在地圖，繼續遊戲',primary:true},...(CLOUD.state==='on'?[{label:'排行榜',fn:()=>{setTimeout(openLeaderboard,0);}}]:[]),{label:'重新開始',fn:showStart}]);
 $('#modal .dlg').classList.add('wide');
}
