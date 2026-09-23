/* ---------- 水戰：長江、海路沿線的戰鬥改用水戰規則 ---------- */
/* 走這些道路出征即為水戰（B.naval=true）：戰場大半是水面、船行水上一格一步、火攻威力加倍、北方兵暈船 */
const NAVAL_EDGES=['江陵-江夏','江夏-柴桑','柴桑-建業','壽春-柴桑','柴桑-長沙','下邳-建業','汝南-江夏','建業-吳','吳-會稽','江夏-長沙','永安-江陵','樂浪-邪馬台','北海-邪馬台','番禺-會稽','會稽-夷洲','番禺-夷洲'];
function isNaval(a,b){return NAVAL_EDGES.includes(a+'-'+b)||NAVAL_EDGES.includes(b+'-'+a);}
function navalSeasick(B,u){if(!B.naval||u.side!=='d')return false;const src=S.cities[B.src];return src&&regionOf(src)==='north'&&!hasTrait(ufac(B,u),'seafarer');}
/* 傷害修正：水戰時北方攻方 −20%（水土不服、暈船），火計與計略 +30%；「渡海之民」不受暈船影響 */
function navalMod(B,u,t,cmd){
 if(!B.naval)return 1;let m=1;
 if(u.side==='a'){const src=S.cities[B.src];if(src&&regionOf(src)==='north'&&!hasTrait(ufac(B,u),'seafarer')&&(cmd==='charge'||cmd==='volley'))m*=0.8;}
 if(cmd==='strat')m*=1.3;
 return m;
}
/* 戰場：城在一側，其餘大半為水面；水面對船隻而言是平地，岸邊留一圈灘地 */
function navalMap(B,L){
 const T=B.T;const core=B.core;
 for(const k in T){const t=T[k];if(['core','city','wall','gate','breach'].includes(t))continue;const d=hdist(pk(k),core);T[k]=d<=3?'plain':'river';}
 L.spawn.forEach(p=>{T[hk(...p)]='river';});
 bl(B,`${B.city}之戰為水戰：船行水上如履平地，火攻威力倍增，北方士卒不習水戰`);
}
function navalCost(B,t){return B.naval&&t==='river'?1:null;}
function navalDef(B,t){return B.naval&&t==='river'?1:null;}
/* 船艦：攻方依統率配樓船（統率 ≥80）或艨艟，顯示用；樓船齊射 +15%，艨艟移動 +1 */
function shipOf(u){return u.lea>=80?'樓船':'艨艟';}
function shipMod(B,u,cmd){if(!B.naval)return 1;return cmd==='volley'&&shipOf(u)==='樓船'?1.15:1;}
function shipMv(B,u){return B.naval&&shipOf(u)==='艨艟'?1:0;}
