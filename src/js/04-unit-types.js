/* ---------- 兵種 ---------- */
const UT={騎:{n:'騎兵',mv:5},槍:{n:'槍兵',mv:4},弓:{n:'弓兵',mv:4}};
const TM={騎:{弓:1.3,槍:0.75},槍:{騎:1.3,弓:0.9},弓:{槍:1.3,騎:0.8}};
function tm(a,b){return (TM[a.type]||{})[b.type]||1;}
function apt(o){if(!o)return '槍';if(hasTrait(o.fac,'nomad'))return '騎';if(o.int>o.war+10)return '弓';return o.war>=o.lea?'騎':'槍';}
function splitCap(offs,total){const caps=offs.map(capOf);let al=splitTroops(offs,total).map((v,i)=>Math.min(v,caps[i]));let left=total-al.reduce((a,b)=>a+b,0);
 for(let i=0;i<offs.length&&left>0;i++){const room=caps[i]-al[i];const add=Math.min(room,left);al[i]+=add;left-=add;}return al;}
