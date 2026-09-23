/* ---------- 武將技能與戰場進階：火計、伏兵、圍城 ---------- */
const SKILLS={
 shenwei:{n:'神威',d:'突擊傷害 +25%'},paoxiao:{n:'咆哮',d:'突擊命中時三成機率使敵隊混亂'},bazhen:{n:'八陣',d:'我方全軍受到的傷害 −12%'},
 longdan:{n:'龍膽',d:'不受混亂，反擊傷害 +30%'},wushuang:{n:'無雙',d:'突擊傷害 +35%'},huoshen:{n:'火神',d:'計略與火計傷害 +40%'},
 shenmou:{n:'深謀',d:'計略成功率 +20%，計略不會被識破'},jianxiong:{n:'奸雄',d:'我方每日士氣損失減半'},huwei:{n:'虎衛',d:'反擊傷害 +40%'},
 laodang:{n:'老當益壯',d:'齊射傷害 +30%'},jinfan:{n:'錦帆',d:'移動力 +1，突擊傷害 +15%'},weizhen:{n:'威震',d:'突擊命中時敵全軍士氣 −3'},
 shensu:{n:'神速',d:'移動力 +2'},tiebi:{n:'鐵壁',d:'守城時受到的傷害 −30%'},qixi:{n:'奇襲',d:'移動力 +1，攻城破壞 +30%'},
 shenshe:{n:'神射',d:'齊射射程 +1，傷害 +20%'},fengchu:{n:'鳳雛',d:'計略成功率 +10%，傷害 +25%'},mengjiang:{n:'猛將',d:'突擊傷害 +15%'},
 shensuan:{n:'神算',d:'計略成功率 +15%'},tongyu:{n:'統御',d:'本隊受到的傷害 −10%'},guwu:{n:'鼓舞',d:'堅守時我方全軍士氣 +5'}};
const SKILL_OF={關羽:'shenwei',張飛:'paoxiao',諸葛亮:'bazhen',陸抗:'bazhen',趙雲:'longdan',呂布:'wushuang',文鴦:'wushuang',周瑜:'huoshen',陸遜:'huoshen',
 司馬懿:'shenmou',賈詡:'shenmou',曹操:'jianxiong',許褚:'huwei',典韋:'huwei',黃忠:'laodang',甘寧:'jinfan',張遼:'weizhen',夏侯淵:'shensu',郝昭:'tiebi',曹仁:'tiebi',
 鄧艾:'qixi',太史慈:'shenshe',祝融:'shenshe',龐統:'fengchu',郭嘉:'shensuan',姜維:'shensuan',馬超:'mengjiang',孫策:'mengjiang',魏延:'mengjiang',龐德:'mengjiang',孟獲:'mengjiang',
 徐晃:'tongyu',張郃:'tongyu',劉備:'guwu',孫權:'guwu',卑彌呼:'guwu'};
function skillOf(o){if(!o)return null;if(SKILL_OF[o.name])return SKILL_OF[o.name];if(o.war>=90)return 'mengjiang';if(o.int>=90)return 'shensuan';if(o.lea>=90)return 'tongyu';if(o.cha>=90)return 'guwu';if(o.war>=82&&o.int>o.lea)return 'shenshe';return null;}
function skillName(o){const k=skillOf(o);return k?SKILLS[k].n:'';}
function skillText(o){const k=skillOf(o);return k?`${SKILLS[k].n}：${SKILLS[k].d}`:'';}
const uskill=u=>u&&u.off!=null?skillOf(S.officers[u.off]):null;
const hasSkill=(u,k)=>uskill(u)===k;
const sideHas=(B,side,k)=>(B.units||[]).some(u=>u.side===side&&!u.dead&&hasSkill(u,k));
function skillMod(B,u,t,cmd){
 let m=1;const a=uskill(u),d=uskill(t);
 if(cmd==='charge'){if(a==='shenwei')m*=1.25;if(a==='wushuang')m*=1.35;if(a==='jinfan'||a==='mengjiang')m*=1.15;}
 if(cmd==='volley'){if(a==='laodang')m*=1.3;if(a==='shenshe')m*=1.2;}
 if(cmd==='strat'){if(a==='huoshen')m*=1.4;if(a==='fengchu')m*=1.25;}
 if(cmd==='counter'){if(a==='huwei')m*=1.4;if(a==='longdan')m*=1.3;}
 if(d==='tongyu')m*=0.9;if(d==='tiebi'&&t.side==='d')m*=0.7;
 if(sideHas(B,t.side,'bazhen'))m*=0.88;
 return m;
}
function skillStrat(u){const a=uskill(u);return a==='shenmou'?0.2:a==='shensuan'?0.15:a==='fengchu'?0.1:0;}
function skillMv(u){const a=uskill(u);return a==='shensu'?2:a==='jinfan'||a==='qixi'?1:0;}
function skillSiege(u){return hasSkill(u,'qixi')?1.3:1;}
function skillRange(u){return hasSkill(u,'shenshe')?1:0;}
function confImmune(u){return hasSkill(u,'longdan');}
/* 突擊命中後的附帶效果（咆哮、威震） */
function afterCharge(B,u,t){
 if(t.dead)return;
 if(hasSkill(u,'paoxiao')&&!confImmune(t)&&Math.random()<0.3){t.conf=B.map?1:(t.acted?1:2);bl(B,`${u.name}陣前咆哮，${t.name}隊陷入混亂`,'hit');}
 if(hasSkill(u,'weizhen')){B.morale[t.side]=clamp(B.morale[t.side]-3,0,100);}
}
function moraleLoss(B,side,v){return sideHas(B,side,'jianxiong')?v/2:v;}
/* 圍城：守方糧盡，士氣逐日下滑 */
function siegeTick(B){const lim=B.map?10:7;if(B.day>lim&&!B.over){B.morale.d=clamp(B.morale.d-2,0,100);if(!B.siegeWarn){B.siegeWarn=1;bl(B,`${B.city}被圍多日，城中糧草將盡，守軍士氣動搖`,'bad');}}}
/* 伏兵：在森林裡且身旁沒有敵軍的部隊，敵方看不見也無法選為目標 */
function hiddenAt(B,u){return B.map&&u.pos&&B.T[hk(...u.pos)]==='forest'&&!nbrs(...u.pos).some(([a,b])=>{const x=unitAt(B,a,b);return x&&x.side!==u.side;});}
function visibleFoes(B,side){return alive(B,otherSide(side)).filter(f=>!hiddenAt(B,f));}
/* 火計：B.fire[格]=剩餘燃燒日。可對三格內的平原、森林、丘陵放火；雨天不可 */
function fireTargets(B,u){if(B.wx==='rain')return[];const out=[];for(let r=0;r<MH;r++)for(let c=0;c<MW;c++){const k=hk(c,r);if(!['plain','forest','hill'].includes(B.T[k])&&!(B.naval&&B.T[k]==='river'&&unitAt(B,c,r)))continue;if(hdist(u.pos,[c,r])>3||hdist(u.pos,[c,r])===0)continue;if(B.fire&&B.fire[k])continue;const x=unitAt(B,c,r);if(x&&x.side===u.side)continue;out.push(k);}return out;}
function fireDmg(B,k,u,src){const t=B.T[k];const base=u.troops*(t==='forest'?0.16:t==='hill'?0.1:B.naval&&t==='river'?0.2:0.08)*(B.wx==='wind'?1.3:1);return hurt(B,u,base*(src&&hasSkill(src,'huoshen')?1.4:1),false);}
function setFire(B,u,k){
 B.fire=B.fire||{};const O=u.off!=null?S.officers[u.off]:null;
 const p=clamp(0.45+u.int/200+(B.wx==='wind'?0.15:0),0.1,0.95);
 if(Math.random()>=p){bl(B,`${u.name}放火未能燃起`);return{ok:false};}
 B.fire[k]=B.T[k]==='forest'?3:B.naval&&B.T[k]==='river'?1:2;gainExp(O,'int',10);
 const x=unitAt(B,...pk(k));let d=0;if(x){d=fireDmg(B,k,x,u);if(u.side===(S.player===B.f?'a':'d')&&S.player)stat('fireHits');if(!x.dead&&!confImmune(x))x.conf=1;}
 bl(B,`${u.name}於${TER[B.T[k]].n}放火${x?`，${x.name}隊被烈焰吞噬，折損 ${fmt(d)}，陷入混亂`:''}`,'hit');
 return{ok:true,dmg:d};
}
function fireTick(B){
 if(!B.fire)return;
 if(B.wx==='rain'){if(Object.keys(B.fire).length)bl(B,'大雨傾盆，火勢盡熄');B.fire={};return;}
 const next={};
 for(const k in B.fire){
  const x=unitAt(B,...pk(k));if(x){const d=fireDmg(B,k,x);bl(B,`${x.name}隊身陷火場，折損 ${fmt(d)}`,'bad');}
  const left=B.fire[k]-1;if(left>0)next[k]=left;
  const pr=B.wx==='wind'?0.5:0.22;
  nbrs(...pk(k)).forEach(([a,b])=>{const nk=hk(a,b);const t=B.T[nk];if((t==='forest'||(t==='hill'&&B.wx==='wind'))&&!B.fire[nk]&&!next[nk]&&Math.random()<pr){next[nk]=t==='forest'?3:2;const y=unitAt(B,a,b);if(y){const d=fireDmg(B,nk,y);bl(B,`火勢蔓延至${y.name}隊，折損 ${fmt(d)}`,'bad');}}});
 }
 B.fire=next;
}
