/* ---------- 成長與官職 ---------- */
const RANKS=[['無官',0,5000],['校尉',300,8000],['中郎將',800,12000],['將軍',1500,16000],['大將軍',2500,20000]];
const LORD_T=[[25,'皇帝'],[19,'王'],[13,'公'],[8,'大將軍'],[4,'州牧'],[1,'太守']];
function isLord(o){return !!(o&&S.factions[o.fac]&&S.factions[o.fac].lord===o.id);}
function rankIdx(o){let r=0;RANKS.forEach((x,i)=>{if((o.merit||0)>=x[1])r=i;});return r;}
function rankName(o){return isLord(o)?'君主':RANKS[rankIdx(o)][0];}
function capOf(o){return isLord(o)?20000:RANKS[rankIdx(o)][2];}
function gainExp(o,k,v){
 if(!o||typeof o.id!=='number')return;o.exp=o.exp||{};const r0=rankIdx(o);
 o.merit=(o.merit||0)+v;o.exp[k]=(o.exp[k]||0)+v;
 while(o.exp[k]>=100){o.exp[k]-=100;if(base(o,k)<100){o[k]++;if(o.fac===S.player)log(`${o.name}的${SN[k]}提升至 ${base(o,k)}`,'good');}}
 const r1=rankIdx(o);if(r1>r0&&!isLord(o)){o.loy=Math.min(100,(o.loy||70)+10);if(o.fac===S.player)log(`${o.name}累積功績，晉升為${RANKS[r1][0]}（可帶兵 ${fmt(RANKS[r1][2])}）`,'good');}
}
function lordTitle(f){if(S.factions[f]&&S.factions[f].emperor)return '皇帝';const n=citiesOf(f).length;return (LORD_T.find(x=>n>=x[0])||[0,'太守'])[1];}
function checkTitles(){Object.values(S.factions).forEach(F=>{if(!F.alive)return;const t=lordTitle(F.id);if(F.title&&t!==F.title){
 const lv=x=>LORD_T.length-LORD_T.findIndex(y=>y[1]===x);const up=lv(t)>(F.best||lv(F.title));if(up)F.best=lv(t);
 if(up){S.officers.filter(o=>o.fac===F.id).forEach(o=>o.loy=Math.min(100,(o.loy||70)+5));log(`${S.officers[F.lord].name}${t==='皇帝'?'登基稱帝':'晉位為'+t}`,F.id===S.player?'good':'');
  if(F.id===S.player&&(t==='王'||t==='皇帝'))pushEvent(t==='皇帝'?'登基稱帝':'晉位稱王',`${S.officers[F.lord].name}${t==='皇帝'?'受群臣擁戴，登基稱帝，改元建號':'功業日隆，受封為王'}。全軍武將忠誠上升。`);}}
 F.title=t;});}
