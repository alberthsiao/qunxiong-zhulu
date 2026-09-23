/* ---------- 天候：戰場天氣與大地圖的季節天災 ---------- */
/* 戰場天氣每天變化，存在 B.wx。傷害修正併入 fmod（見 21-outer.js），其餘效果各有掛接點 */
const WX={
 sun:{n:'晴',d:'無特殊影響'},
 rain:{n:'雨',d:'齊射傷害 −30%，計略傷害 −20%，騎兵移動力 −1'},
 fog:{n:'大霧',d:'齊射射程 −1、傷害 −15%，計略成功率 +10%'},
 wind:{n:'大風',d:'計略傷害 +25%（火借風勢），齊射傷害 −10%'},
 snow:{n:'雪',d:'全軍移動力 −1；不耐寒的攻方每日士氣 −2（北地出兵與遊牧勢力不受影響）'},
 heat:{n:'酷暑',d:'不服水土的攻方每日士氣 −2（南方出兵不受影響）'}};
const season=m=>[12,1,2].includes(m)?'winter':m<=5?'spring':m<=8?'summer':'autumn';
function regionOf(c){return c.y<330?'north':c.y>540?'south':'mid';}
const REGN={north:'華北',mid:'中原',south:'江南'};
function wxWeights(t){
 const s=season(S.month),r=regionOf(t),w={sun:50,rain:0,fog:0,wind:12,snow:0,heat:0};
 w.rain={spring:20,summer:30,autumn:15,winter:5}[s]+(r==='south'?10:0);if(s==='winter'&&r==='north')w.rain=0;
 w.fog={spring:10,summer:3,autumn:15,winter:15}[s]+(RIVER_CITIES.includes(t.name)?8:0);
 if(s==='winter'||s==='spring')w.wind=18;
 if(s==='winter')w.snow=r==='north'?35:r==='mid'?15:0;
 if(s==='summer')w.heat=r==='south'?30:r==='mid'?10:0;
 if(climateOf(t)==='snow')w.snow+=40;
 return w;
}
function rollWx(B){
 if(B.wx&&Math.random()<0.55)return B.wx;
 const w=wxWeights(S.cities[B.city]);let x=Math.random()*Object.values(w).reduce((a,b)=>a+b,0);
 for(const k in w){x-=w[k];if(x<0)return k;}
 return 'sun';
}
function setWx(B,k){if(B.wx===k)return;B.wx=k;bl(B,`天候：${WX[k].n}。${WX[k].d}`);}
/* 每日開始時呼叫；第一天沿用開戰時擲出的天氣 */
function newDayWx(B){if(B.day>1)setWx(B,rollWx(B));}
function wxMod(B,cmd){
 const k=B.wx;
 if(k==='rain')return cmd==='volley'?0.7:cmd==='strat'?0.8:1;
 if(k==='fog')return cmd==='volley'?0.85:1;
 if(k==='wind')return cmd==='strat'?1.25:cmd==='volley'?0.9:1;
 return 1;
}
function wxStrat(B){return B&&B.wx==='fog'?0.1:0;}
function wxRange(B,u){return Math.max(1,(u.type==='弓'?3:2)+skillRange(u)-(B.wx==='fog'?1:0));}
function umv(B,u){return Math.max(2,u.mv+skillMv(u)+shipMv(B,u)-(B.wx==='snow'?1:0)-(B.wx==='rain'&&u.type==='騎'?1:0));}
/* 每日結束：嚴寒與酷暑消磨攻方士氣 */
function wxDayEnd(B){
 const src=S.cities[B.src];if(!src)return;
 if(B.wx==='snow'&&regionOf(src)!=='north'&&!hasTrait(B.f,'nomad')){B.morale.a=clamp(B.morale.a-2,0,100);bl(B,'天寒地凍，攻方士卒凍餒，士氣下降');}
 if(B.wx==='heat'&&regionOf(src)!=='south'){B.morale.a=clamp(B.morale.a-2,0,100);bl(B,'酷暑難當，攻方疫病漸起，士氣下降');}
}
/* 大地圖天災：S.climate[地區]={k,until}。旱、豐年影響七月秋收；澇、大雪使該地區出征軍糧 ×1.5 */
const CLIM={drought:{n:'大旱',d:'秋收減四成'},bumper:{n:'風調雨順',d:'秋收增三成'},flood:{n:'水患',d:'出征軍糧 ×1.5'},snow:{n:'大雪',d:'出征軍糧 ×1.5，戰場多雪'},locust:{n:'蝗災',d:'存糧受損'}};
function climateOf(c){const x=S.climate&&S.climate[regionOf(c)];return x&&x.until>=S.turn?x.k:null;}
function harvestMod(c){const k=climateOf(c);return k==='drought'?0.6:k==='bumper'?1.3:1;}
function marchWx(src,t){return [src,t].some(c=>['flood','snow'].includes(climateOf(c)))?1.5:1;}
function climateText(){return Object.keys(REGN).map(r=>{const x=S.climate&&S.climate[r];return x&&x.until>=S.turn?`${REGN[r]}${CLIM[x.k].n}`:null;}).filter(Boolean).join('　');}
function monthlyClimate(){
 S.climate=S.climate||{};
 const s=season(S.month);
 for(const r of Object.keys(REGN)){
  const cur=S.climate[r];if(cur&&cur.until>=S.turn)continue;
  const cs=Object.values(S.cities).filter(c=>regionOf(c)===r);const mine=cs.some(c=>c.owner===S.player);
  const set=(k,months,msg,cls)=>{S.climate[r]={k,until:S.turn+months-1};log(`${REGN[r]}${msg}`,mine?cls:'');};
  const x=Math.random();
  if(S.month===5){if(x<0.1){set('drought',3,'入夏以來滴雨未降，恐有大旱，今年秋收將減四成','bad');continue;}if(x<0.22){set('bumper',3,'風調雨順，今年可望豐收','good');continue;}}
  if(s==='summer'&&x<0.06){set('flood',1,'連日暴雨成災，沿河各城糧倉、城防受損，道路泥濘難行','bad');cs.filter(c=>RIVER_CITIES.includes(c.name)).forEach(c=>{c.food=Math.round(c.food*0.85);c.def=Math.round(c.def*0.9);c.ppl=clamp((c.ppl??60)-5,0,100);});continue;}
  if((s==='summer'||s==='autumn')&&r!=='south'&&x>0.95){set('locust',1,'飛蝗蔽日，各城存糧損失兩成','bad');cs.forEach(c=>c.food=Math.round(c.food*0.8));continue;}
  if(s==='winter'&&r!=='south'&&x<(r==='north'?0.22:0.08))set('snow',1,'大雪封路，本月出征軍糧加倍半','');
 }
}
