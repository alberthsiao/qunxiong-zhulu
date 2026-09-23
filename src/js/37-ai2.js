/* ---------- 電腦勢力的策略層：合縱抗強、守勢判斷、集中兵力 ---------- */
/* 霸主：城數佔三成五以上的勢力。其他電腦勢力會互相結盟並以霸主為共同目標 */
function hegemon(){const tot=Object.keys(S.cities).length;const al=Object.values(S.factions).filter(x=>x.alive);const top=al.sort((a,b)=>citiesOf(b.id).length-citiesOf(a.id).length)[0];return top&&citiesOf(top.id).length/tot>=0.35?top.id:null;}
/* 城池受威脅：相鄰敵城兵力合計超過本城守軍的 1.2 倍 */
function threatened(c,f){const enemy=ADJ[c.name].map(n=>S.cities[n]).filter(t=>t.owner&&t.owner!==f&&!friendly(f,t.owner)).reduce((a,t)=>a+t.troops,0);return enemy>c.troops*1.2;}
/* 出兵評估的策略修正：霸主目標 ×1.3；霸主自身更謹慎 ×0.85；受威脅的城不出兵 */
function aiStrategyMod(f,c,t){
 if(threatened(c,f))return 0;
 const h=hegemon();let m=1;
 if(h&&t.owner===h&&f!==h)m*=1.3;
 if(h===f)m*=0.85;
 if(t.owner&&S.factions[t.owner]&&citiesOf(t.owner).length===1)m*=1.15;
 return m;
}
/* 合縱：非霸主的電腦勢力之間，若都與霸主接壤，更容易結盟並約定共同出兵 */
function aiCoalition(){
 const h=hegemon();if(!h)return;
 const al=Object.values(S.factions).filter(x=>x.alive&&x.id!==h&&x.id!==S.player&&borders(x.id,h)).map(x=>x.id);
 for(let i=0;i<al.length;i++)for(let j=i+1;j<al.length;j++){const a=al[i],b=al[j];const r=rel(a,b);
  if(!r.ally&&r.trust>=30&&Math.random()<0.12){r.ally=true;r.trust=clamp(r.trust+15,0,100);log(`${S.factions[a].name}與${S.factions[b].name}合縱結盟，共抗${S.factions[h].name}`);}
  if(r.ally&&(!r.focus||r.focusUntil<=S.turn)){r.focus=h;r.focusUntil=S.turn+6;r.focusBy=a;}}
 if(h===S.player&&Math.random()<0.02)log('諸侯忌憚我軍勢大，暗中合縱','bad');
}
/* 集中兵力：出兵前把後方閒置兵力調到出發城 */
function aiConcentrate(f,c){
 for(const n of ADJ[c.name]){const b=S.cities[n];if(b.owner!==f||isFront(b,f)||b.troops<6000)continue;const amt=Math.round((b.troops-3000)*0.6);if(amt>1000){doMove(b,c,[],amt);}}
}
