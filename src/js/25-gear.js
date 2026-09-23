/* ---------- 軍備：城池軍備庫、出征配發、戰後回收 ---------- */
/* 每座城的庫存在 c.gear={horse,bow,armor,ram}。出征時依兵種自動配發（騎→戰馬、弓→強弩、槍→鐵甲），部隊的裝備率存在 u.gr（0～1），衝車數存在 B.ram。傷害修正併入 fmod */
const GEAR={
 horse:{n:'戰馬',type:'騎',stat:'pol',cost:100,d:'配給騎兵：突擊傷害最高 +20%'},
 bow:{n:'強弩',type:'弓',stat:'pol',cost:100,d:'配給弓兵：齊射傷害最高 +25%'},
 armor:{n:'鐵甲',type:'槍',stat:'pol',cost:100,d:'配給槍兵：受到的突擊與齊射傷害最高 −15%'},
 ram:{n:'衝車',stat:'int',cost:150,d:'攻城時對城門、城牆的破壞最高 +60%（十輛滿效，每次出征最多帶十輛）'}};
const GEAR_MAX={horse:30000,bow:30000,armor:30000,ram:20};
const GEAR_OF_TYPE={騎:'horse',弓:'bow',槍:'armor'};
const GKEYS=['horse','bow','armor','ram'];
function gearOf(c){return c.gear||(c.gear={horse:0,bow:0,armor:0,ram:0});}
function addGear(c,k,n){const G=gearOf(c);G[k]=Math.min(GEAR_MAX[k],G[k]+Math.max(0,Math.round(n)));}
function gearText(c){const G=gearOf(c);return GKEYS.map(k=>`${GEAR[k].n} ${fmt(G[k])}`).join('　');}
function gearYield(k,o){return k==='ram'?1+Math.floor(o.int/40):Math.round(400+o.pol*8+rnd(0,200));}
function doGear(k,o,c){
 const g=GEAR[k],G=gearOf(c);if(!g||c.gold<g.cost||G[k]>=GEAR_MAX[k])return null;
 c.gold-=g.cost;const v=Math.min(GEAR_MAX[k]-G[k],gearYield(k,o));G[k]+=v;o.done=true;gainExp(o,g.stat,10);
 return{msg:`${o.name}於${c.name}督造${g.n} ${fmt(v)}${k==='ram'?' 輛':''}，花費 ${g.cost} 金`};
}
/* 電腦與委任太守：依城中武將擅長的兵種，補最缺的軍備；前線城另外備幾輛衝車 */
function aiGearPick(c,f){
 const G=gearOf(c),offs=officersIn(c.name,f);if(!offs.length)return null;
 const need={horse:0,bow:0,armor:0};offs.forEach(o=>need[GEAR_OF_TYPE[apt(o)]]++);
 const cand=Object.keys(need).filter(k=>need[k]&&G[k]<c.troops*0.7).sort((a,b)=>G[a]/need[a]-G[b]/need[b]);
 if(isFront(c,f)&&G.ram<5&&c.gold>=500&&Math.random()<0.3)return 'ram';
 return cand[0]||null;
}
/* 開戰：攻方自出發城領取軍備（扣庫存），守方就地取用（不扣庫存）。援軍不配發 */
function gearSetup(B,src,t){
 const take={horse:0,bow:0,armor:0,ram:0},G=gearOf(src);
 B.units.filter(u=>u.side==='a'&&!u.ally).forEach(u=>{const k=GEAR_OF_TYPE[u.type];const n=Math.min(G[k],u.troops);G[k]-=n;take[k]+=n;u.gr=u.troops?n/u.troops:0;});
 take.ram=Math.min(G.ram,10);G.ram-=take.ram;B.ram=take.ram;B.gearTake=take;
 const pool=Object.assign({},gearOf(t));
 B.units.filter(u=>u.side==='d'&&!u.ally).forEach(u=>{const k=GEAR_OF_TYPE[u.type];const n=Math.min(pool[k],u.troops);pool[k]-=n;u.gr=u.troops?n/u.troops:0;});
 const s=GKEYS.filter(k=>take[k]).map(k=>`${GEAR[k].n} ${fmt(take[k])}`).join('、');if(s)bl(B,`攻方攜帶軍備：${s}`);
}
function gearMod(u,t,cmd){
 let m=1;
 if(u.type==='騎'&&cmd==='charge')m*=1+0.2*(u.gr||0);
 if(u.type==='弓'&&cmd==='volley')m*=1+0.25*(u.gr||0);
 if(t.type==='槍'&&cmd!=='strat')m*=1-0.15*(t.gr||0);
 return m;
}
function ramMod(B){return 1+Math.min(1,(B.ram||0)/10)*0.6;}
function gearLabel(u){return u.gr>0?`${GEAR[GEAR_OF_TYPE[u.type]].n} ${Math.round(u.gr*100)}%`:'無軍備';}
/* 戰後：城破則守方庫存毀損一半；攻方軍備依各兵種存活比例收回，進駐新城或帶回本城；衝車敗戰折損一半 */
function gearReturn(B){
 const t=S.cities[B.city],src=S.cities[B.src],f=B.f;
 if(B.win){const D=gearOf(t);GKEYS.forEach(k=>D[k]=Math.floor(D[k]/2));}
 const take=B.gearTake;if(!take)return;
 const dest=B.win?t:(src.owner===f?src:citiesOf(f)[0]);if(!dest)return;
 const init={},left={};B.units.filter(u=>u.side==='a'&&!u.ally).forEach(u=>{const k=GEAR_OF_TYPE[u.type];init[k]=(init[k]||0)+u.max;left[k]=(left[k]||0)+u.troops;});
 ['horse','bow','armor'].forEach(k=>{if(take[k]&&init[k])addGear(dest,k,take[k]*Math.min(1,left[k]/init[k]));});
 addGear(dest,'ram',B.win?take.ram:Math.floor(take.ram/2));
}
/* 移動兵力時，軍備（衝車除外）依兵力比例隨軍轉移 */
function moveGear(src,dst,n,before){
 if(n<=0||before<=0)return;const r=Math.min(1,n/before),G=gearOf(src);
 ['horse','bow','armor'].forEach(k=>{const v=Math.round(G[k]*r);G[k]-=v;addGear(dst,k,v);});
}
function initGear(st){
 CITY_DATA.forEach(([n,,,,sz])=>{const c=st.cities[n];const base=c.owner?sz*800:0;c.gear={horse:hasTrait(c.owner,'nomad')?12000:base,bow:base,armor:base,ram:0};});
}
