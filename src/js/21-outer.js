/* ---------- 周邊諸國特性、渡海、朝貢 ---------- */
const TRAITS={
 nomad:{n:'遊牧騎兵',d:'武將預設率領騎兵；騎兵突擊傷害 +15%、戰場移動力 +1；善於牧馬，各城每月自產戰馬 300；農耕不興，秋收減少兩成'},
 kidou:{n:'鬼道',d:'卑彌呼在位時以鬼道聚眾，出戰與守城的初始士氣 +8'},
 seafarer:{n:'渡海之民',d:'走海路出征不會暈船，軍糧也不加倍'},
 fort:{n:'山城',d:'據山築城，守城時受到的傷害 −15%'},
 remote:{n:'僻處海東',d:'來犯之敵長途遠征，攻方初始士氣 −6'},
 tengjia:{n:'藤甲象兵',d:'在森林、丘陵與山地城受到的傷害 −20%；但藤甲畏火，受計略傷害 +30%'},
 trade:{n:'海上貿易',d:'商業收入 +30%'}};
const FTRAITS={wuhuan:['nomad'],xianbei:['nomad'],xiongnu:['nomad'],qiang:['nomad'],wa:['kidou','seafarer'],gogu:['fort'],gsdu:['remote'],nanman:['tengjia'],shixie:['trade','seafarer']};
/* 瘴癘之地：跟著地方走，不論守方是誰，來犯的攻方開戰時先折損一成五 */
const MIASMA=['夷洲'];
function hasTrait(f,k){return !!(f&&FTRAITS[f]&&FTRAITS[f].includes(k));}
function traitText(f){return (FTRAITS[f]||[]).map(k=>`${TRAITS[k].n}：${TRAITS[k].d}`);}
function isOuter(f){return !!OUTER[f];}
/* 勢力特性、天氣（wxMod）與軍備（gearMod）對傷害的修正。u 攻擊 t；cmd 為 charge／volley／counter／strat。地圖戰看目標所在格，快速結算看城池地勢 */
function fmod(B,u,t,cmd){
 let m=wxMod(B,cmd)*gearMod(u,t,cmd)*skillMod(B,u,t,cmd)*navalMod(B,u,t,cmd)*shipMod(B,u,cmd);const uf=ufac(B,u),tf=ufac(B,t);
 if(hasTrait(uf,'nomad')&&u.type==='騎'&&cmd==='charge')m*=1.15;
 if(hasTrait(tf,'fort')&&t.side==='d')m*=0.85;
 if(hasTrait(tf,'tengjia')){
  if(cmd==='strat')m*=1.3;
  else{const rough=B.map&&t.pos?['forest','hill'].includes(B.T[hk(...t.pos)]):B.ter==='mount';if(rough)m*=0.8;}
 }
 return m;
}
/* 海路與開戰時的士氣修正 */
function isSea(a,b){return SEA_EDGES.includes(a+'-'+b)||SEA_EDGES.includes(b+'-'+a);}
function marchFood(f,src,t,n){return Math.round(n/10*(isSea(src.name,t.name)&&!hasTrait(f,'seafarer')?2:1)*marchWx(src,t));}
function traitSetup(B,src,t){
 const mo=(s,v)=>B.morale[s]=clamp(B.morale[s]+v,0,100);
 if(isSea(src.name,t.name)&&!hasTrait(B.f,'seafarer')){mo('a',-10);bl(B,'攻方渡海遠征，士卒暈船疲憊，士氣低落');}
 if(MIASMA.includes(t.name)){B.units.filter(u=>u.side==='a').forEach(u=>{u.troops-=Math.round(u.troops*0.15);});B.start.a=Math.max(1,Math.round(B.start.a*0.85));bl(B,`${t.name}乃瘴癘之地，攻方士卒水土不服，疫病流行，未戰先折損一成五`,'bad');}
 if(hasTrait(B.df,'remote')){mo('a',-6);bl(B,'攻方長途遠征，師老兵疲');}
 [['a',B.f],['d',B.df]].forEach(([s,f])=>{if(hasTrait(f,'kidou')&&lordOf(f).name==='卑彌呼'){mo(s,8);bl(B,'卑彌呼以鬼道祈禱，倭軍士氣大振');}});
}
/* 朝貢：中原勢力可要求周邊勢力朝貢；周邊勢力可向中原勢力遣使朝貢 */
function tributeGain(f){return 200+citiesOf(f).length*150;}
function tributeChance(env,f){const ratio=power(S.player)/Math.max(1,power(f));return clamp(0.05+(ratio-1)*0.07+(env.pol+env.cha-120)/400+(rel(S.player,f).trust-50)/250,0.03,0.7);}
function doTribute(env,f,kind){
 const c=S.cities[env.city],r=rel(S.player,f),fn=S.factions[f].name;env.done=true;
 if(kind==='pay'){
  c.gold-=300;c.food+=1500;r.trust=clamp(r.trust+15,0,100);
  let m=`${env.name}出使${fn}朝貢，獻上方物 300 金，獲回賜糧 1,500，友好度 +15`;
  if(r.trust>=45&&!r.ally&&r.truce<=S.turn){r.truce=S.turn+12;m+='，並受冊封，一年內互不侵犯';}
  return{msg:m,cls:'good'};
 }
 if(Math.random()<tributeChance(env,f)){
  const g=tributeGain(f);c.gold+=g;r.truce=Math.max(r.truce,S.turn+12);r.trust=clamp(r.trust+5,0,100);
  return{msg:`${fn}畏我兵威，遣使朝貢 ${fmt(g)} 金，雙方一年內互不侵犯`,cls:'good'};
 }
 r.trust=clamp(r.trust-8,0,100);
 return{msg:`${env.name}出使${fn}要求朝貢，遭到拒絕，友好度 -8`};
}
