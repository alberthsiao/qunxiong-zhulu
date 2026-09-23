/* ---------- 一騎討 ---------- */
const ATK_LINES=['揮刀猛劈','挺槍直刺','一記橫掃','策馬衝殺','連環三擊','虛晃一招後猛攻'];
function duelAccept(u,t){return t.war>=u.war-10||Math.random()<0.25;}
function duelDmg(x,y,m){return Math.max(3,Math.round((10+x.war*0.12+(x.war-y.war)*0.4+rnd(-3,3))*m));}
function duelAI(me,op,st){
 const hp=st.hp[me.id],ohp=st.hp[op.id];
 if(hp<22&&hp<ohp&&Math.random()<0.35)return 'flee';
 const w={atk:50,big:Math.max(5,22+(me.war-op.war)),def:25};
 if(st.last[op.id]==='def'){w.big=Math.max(5,w.big-12);w.atk+=12;}
 if(st.last[op.id]==='big')w.def+=15;
 let r=Math.random()*(w.atk+w.big+w.def);for(const k in w){if((r-=w[k])<0)return k;}return 'atk';
}
function duelRound(st,a,b,ca,cb){
 const out={lines:[],dmg:{[a.id]:0,[b.id]:0},flee:null,acts:{[a.id]:ca,[b.id]:cb}};
 st.last[a.id]=ca;st.last[b.id]=cb;
 for(const[x,y,c]of[[a,b,ca],[b,a,cb]]){if(c!=='flee')continue;
  if(Math.random()<clamp(0.6+(x.war-y.war)/60,0.25,0.9)){out.flee=x.id;out.lines.push(`${x.name}撥馬便走，脫離戰圈`);st.round++;return out;}
  out.lines.push(`${x.name}想要撤退，卻被${y.name}纏住`);}
 const act=(x,y,cx,cy)=>{
  if(cx==='atk'){if(cy==='def'){out.dmg[y.id]+=duelDmg(x,y,0.3);out.lines.push(`${x.name}${pick(ATK_LINES)}，被${y.name}穩穩架住`);}else{out.dmg[y.id]+=duelDmg(x,y,1);out.lines.push(`${x.name}${pick(ATK_LINES)}`);}}
  else if(cx==='big'){if(cy==='def'){out.dmg[x.id]+=duelDmg(y,x,1.1);out.lines.push(`${x.name}全力一擊，卻被${y.name}看破，反手一擊！`);}
   else if(Math.random()<0.55){out.dmg[y.id]+=duelDmg(x,y,1.8);out.lines.push(`${x.name}使出全力一擊，正中${y.name}！`);}
   else out.lines.push(`${x.name}全力一擊落空`);}
 };
 act(a,b,ca,cb);act(b,a,cb,ca);
 if(ca==='def'&&cb==='def')out.lines.push('兩人互相對峙，誰也不敢輕舉妄動');
 st.hp[a.id]-=out.dmg[a.id];st.hp[b.id]-=out.dmg[b.id];st.round++;
 return out;
}
function duelResult(st,a,b,r){
 if(r.flee){const L=r.flee===a.id?a:b,W=L===a?b:a;return{type:'flee',winner:W.id,loser:L.id};}
 const ka=st.hp[a.id]<=0,kb=st.hp[b.id]<=0;
 if(ka||kb){const aw=ka&&kb?st.hp[a.id]>=st.hp[b.id]:kb;return aw?{type:'ko',winner:a.id,loser:b.id}:{type:'ko',winner:b.id,loser:a.id};}
 if(st.round>10)return{type:'draw',winner:a.id,loser:b.id};
 return null;
}
function simDuel(a,b){const st={hp:{[a.id]:100,[b.id]:100},last:{},round:1};for(let i=0;i<12;i++){const r=duelResult(st,a,b,duelRound(st,a,b,duelAI(a,b,st),duelAI(b,a,st)));if(r)return r;}return{type:'draw',winner:a.id,loser:b.id};}
function duelOdds(a,b){let w=0;for(let i=0;i<150;i++){const r=simDuel(a,b);if(r.type!=='draw'&&r.winner===a.id)w++;}return w/150;}
function capCity(B,by){
 if(by===B.f)return B.win?B.city:(S.cities[B.src].owner===B.f?B.src:(citiesOf(B.f)[0]||{}).name);
 return B.win?(citiesOf(by).find(c=>c.name!==B.city)||{}).name:B.city;
}
function applyDuel(B,res){
 const W=B.units.find(x=>x.id===res.winner),L=B.units.find(x=>x.id===res.loser);
 const mo=(s,v)=>B.morale[s]=clamp(B.morale[s]+v,0,100);
 if(W.off!=null)gainExp(S.officers[W.off],'war',res.type==='ko'?30:15);if(L.off!=null)gainExp(S.officers[L.off],'war',8);
 if(res.type==='draw'){mo('a',2);mo('d',2);bl(B,`${W.name}與${L.name}大戰十合，不分勝負，各自回陣`);return;}
 if(res.type==='flee'){const d=hurt(B,L,L.troops*0.1,false);mo(L.side,-8);mo(W.side,4);bl(B,`${L.name}單挑中敗走，${L.name}隊動搖，潰散 ${fmt(d)}`);return;}
 mo(W.side,10);mo(L.side,-15);
 if(B.caps&&L.off!=null&&Math.random()<0.15){
  B.caps.push([L.off,W.side==='a'?B.f:B.df]);
  if(B.ev)B.ev.hits.push({id:L.id,dmg:L.troops});B.loss[L.side]+=L.troops;L.troops=0;L.dead=true;
  bl(B,`${W.name}擊敗${L.name}，將其生擒！${L.name}隊群龍無首，四散潰逃`,'hit');
 }else{const d=hurt(B,L,L.troops*0.3,false);bl(B,`${W.name}擊敗${L.name}！${L.name}隊潰散 ${fmt(d)}`,'hit');}
}
let D=null;
function askDuel(eu,pu){return new Promise(res=>{
 $('#duel').hidden=false;
 $('#duel-body').innerHTML=`<h2>敵將叫陣</h2><p>${eu.name}（武力 ${eu.war}）向我軍${pu.name}（武力 ${pu.war}）叫陣！</p><p class="hint">應戰可親自指揮單挑，勝者士氣大振，敗者所部潰散，甚至可能被生擒。拒絕則我軍士氣下降。</p><div class="acts"><button id="d-no">拒絕</button><button id="d-yes" class="primary">應戰</button></div>`;
 $('#d-yes').onclick=()=>res(true);$('#d-no').onclick=()=>{$('#duel').hidden=true;res(false);};$('#d-yes').focus();});}
function runDuel(B,pu,eu){return new Promise(res=>{
 D={B,pu,eu,st:{hp:{[pu.id]:100,[eu.id]:100},last:{},round:1},lines:[`${pu.name}與${eu.name}策馬而出，陣前交鋒！`],over:null,res,busy:false};
 $('#duel').hidden=false;drawDuel();});}
function drawDuel(){
 const{pu,eu,st}=D;const col=u=>fcolor(u.side==='a'?D.B.f:D.B.df);
 const side=(u,mine)=>{const hp=Math.max(0,st.hp[u.id]);return `<div class="dside" id="ds-${u.id}"><div class="dseal" style="background:${col(u)}">${u.name[0]}</div><b>${u.name}</b>　<small>${mine?'我軍':'敵軍'}</small><br><small>武力 ${u.war}</small><div class="hp"><i style="width:${hp}%"></i></div><small class="hpn">體力 ${hp}</small></div>`;};
 let h=`<h2>一騎討</h2><p class="hint">${D.over?'單挑結束':`第 ${st.round} 合／10 合`}</p><div class="dgrid">${side(pu,true)}<div class="dvs">對</div>${side(eu,false)}</div><div class="dlog">${D.lines.map(l=>`<p>${l}</p>`).join('')}</div>`;
 if(D.over){const o=D.over,W=o.winner===pu.id?pu:eu,L=W===pu?eu:pu;const good=o.type!=='draw'&&W===pu;
  h+=`<p class="result ${o.type==='draw'?'':good?'good':'bad'}">${o.type==='draw'?'十合已過，不分勝負':o.type==='flee'?`${L.name}敗走，${W.name}獲勝`:`${W.name}擊敗了${L.name}！`}</p><div class="acts"><button class="primary" id="d-cont">回到戰場</button></div>`;}
 else h+=`<div class="dcmds"><button data-d="atk">攻擊<small>穩定出手；對方防禦時傷害很小</small></button><button data-d="big">全力一擊<small>威力大，但可能落空；被防禦會遭反擊</small></button><button data-d="def">防禦<small>大幅減輕攻擊，並反擊對方的全力一擊</small></button><button data-d="flee">撤退<small>脫離單挑，所部小幅動搖</small></button></div>`;
 $('#duel-body').innerHTML=h;
 const f=$('#duel-body button.primary')||$('#duel-body [data-d="atk"]');f&&f.focus();
}
$('#duel').addEventListener('click',async e=>{
 const b=e.target.closest('button');if(!b||!D)return;
 if(b.id==='d-cont'){$('#duel').hidden=true;const r=D.res,o=D.over;D=null;r(o);return;}
 if(!b.dataset.d||D.busy||D.over)return;
 D.busy=true;$('#duel-body').classList.add('busy');
 const{pu,eu,st}=D;const r=duelRound(st,pu,eu,b.dataset.d,duelAI(eu,pu,st));
 const anim=FX.mode!=='off'&&typeof document.body.animate==='function';
 if(anim){
  const sa=$(`#ds-${pu.id} .dseal`),sb=$(`#ds-${eu.id} .dseal`);
  const lunge=(el,dx,c)=>{if(c==='atk'||c==='big')el.animate([{transform:'none'},{transform:`translateX(${dx}px) scale(${c==='big'?1.12:1})`},{transform:'none'}],{duration:spd(420),easing:'ease-in-out'});};
  if(!r.flee){lunge(sa,46,r.acts[pu.id]);lunge(sb,-46,r.acts[eu.id]);}
  await new Promise(z=>setTimeout(z,spd(230)));
  [pu,eu].forEach(u=>{const box=$(`#ds-${u.id}`);const d=r.dmg[u.id];const hp=Math.max(0,st.hp[u.id]);box.querySelector('.hp i').style.width=hp+'%';box.querySelector('.hpn').textContent='體力 '+hp;
   if(d>0){box.classList.add('hit');const f=document.createElement('span');f.className='dmgf';f.textContent='-'+d;box.appendChild(f);setTimeout(()=>{f.remove();box.classList.remove('hit');},1000);}});
  await new Promise(z=>setTimeout(z,spd(650)));
 }
 D.lines=r.lines;D.over=duelResult(st,pu,eu,r);D.busy=false;
 drawDuel();$('#duel-body').classList.remove('busy');
});
