/* ---------- 命令 ---------- */
function doDev(kind,o,c){const d=DEV[kind];if(c.gold<60||c[d.k]>=c[d.max])return null;c.gold-=60;const v=Math.min(c[d.max]-c[d.k],Math.round(8+o[d.stat]/5+rnd(0,6)));c[d.k]+=v;o.done=true;gainExp(o,d.stat,12);return{msg:`${o.name}於${c.name}${d.label}，+${v}`};}
function doTrain(o,c){const v=Math.min(100-c.train,Math.round(4+o.lea/12));c.train+=v;o.done=true;gainExp(o,'lea',10);return{msg:`${o.name}訓練${c.name}守軍，訓練度 +${v}`};}
function maxRecruit(c){return Math.max(0,Math.min(hasPol(c.owner,'guangzheng')?7500:5000,Math.floor(c.gold/0.15/500)*500,Math.floor(c.pop*0.1/500)*500));}
function doRecruit(o,c,amt){const cost=Math.round(amt*0.15*(hasPol(c.owner,'jingbing')?1.3:1));if(amt<500||c.gold<cost)return null;const n=Math.round(amt*(1+o.cha/500));c.gold-=cost;c.pop-=n;c.train=Math.round((c.troops*c.train+n*(hasPol(c.owner,'guangzheng')?25:40))/(c.troops+n));c.troops+=n;o.done=true;if(!hasPol(c.owner,'shibing'))c.ppl=Math.max(0,(c.ppl??60)-Math.round(n/500));gainExp(o,'cha',10);return{msg:`${o.name}於${c.name}徵兵 ${fmt(n)} 人，花費 ${cost} 金，民忠略降`};}
function doRelief(o,c){if(c.food<300)return null;c.food-=300;const v=Math.round(5+o.pol/10);c.ppl=Math.min(100,(c.ppl??60)+v);o.done=true;gainExp(o,'pol',12);return{msg:`${o.name}在${c.name}開倉賑濟，民忠 +${v}`};}
function recruitChance(o,f){return clamp(0.15+(o.cha*0.4+lordOf(f).cha*0.6-60)/70+(hasPol(f,'jiupin')?0.15:hasPol(f,'weicai')?0.08:0),0.1,0.95);}
function doSearch(o,c,f){
 o.done=true;gainExp(o,'int',10);
 const hid=S.officers.filter(x=>x.fac===null&&x.city===c.name&&!x.found);
 if(hid.length&&Math.random()<0.3+o.int/250){const t=hid[0];if(f===S.player)t.found=true;
  if(Math.random()<recruitChance(o,f)+bondBonus(t,f)-(feudIn(t,f).some(x=>isLord(x))?0.5:0)){t.fac=f;t.done=true;t.loy=75;introduce(t,'訪得賢才');return{msg:`${o.name}在${c.name}訪得${t.name}，${t.name}願意出仕`,cls:'good'};}
  return{msg:`${o.name}在${c.name}發現在野人才${t.name}，對方暫無出仕之意`};}
 const hi=(S.items||[]).filter(i=>i.owner==null&&i.fac==null&&i.city===c.name);
 if(hi.length&&Math.random()<0.2+o.int/400){const it=hi[0];it.fac=f;it.found=true;it.city=null;return{msg:`${o.name}在${c.name}尋獲寶物「${it.name}」（${bonusText(it.b)}），已收入庫藏`,cls:'good'};}
 const far=S.officers.filter(x=>x.fac===null&&!x.found&&!x.rumor&&x.city&&x.city!==c.name);
 if(f===S.player&&far.length&&Math.random()<0.3+o.int/400){const t=pick(far);t.rumor=true;return{msg:`${o.name}打聽到：${t.city}一帶隱居著一位賢才`,cls:'good'};}
 if(Math.random()<0.5){const g=ri(40,150);c.gold+=g;return{msg:`${o.name}在${c.name}搜索，得金 ${g}`};}
 return{msg:`${o.name}在${c.name}搜索，一無所獲`};
}
function persuadeChance(o,t,f){if(feudIn(t,f).some(x=>isLord(x)))return 0.02;return clamp(recruitChance(o,f)-(t.city!==o.city?0.1:0)+bondBonus(t,f),0.05,0.95);}
function doPersuade(o,t,f){o.done=true;gainExp(o,'cha',10);const far=t.city!==o.city;if(Math.random()<persuadeChance(o,t,f)){t.fac=f;t.done=true;t.loy=75;t.city=o.city;introduce(t,'登用賢才');return{msg:`${t.name}接受${o.name}的邀請${far?'，前來'+o.city:''}，加入麾下`,cls:'good'};}return{msg:`${o.name}${far?'遣使':''}拜訪${t.name}，遭到婉拒`};}
function doMove(src,dst,offs,n){offs.forEach(o=>{o.city=dst.name;o.done=true;});if(n>0){moveGear(src,dst,n,src.troops);dst.train=Math.round((dst.troops*dst.train+n*src.train)/(dst.troops+n));dst.troops+=n;src.troops-=n;}}
