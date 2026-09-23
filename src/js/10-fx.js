/* ---------- 動畫 ---------- */
const FXN={on:'開',fast:'快',off:'關'};
const FX={mode:'on',skip:false};
try{FX.mode=localStorage.getItem('qunxiong-fx')||(matchMedia('(prefers-reduced-motion: reduce)').matches?'off':'on');}catch(e){}
function FXON(){return FX.mode!=='off'&&!FX.skip&&!(BT&&BT.auto)&&typeof document.body.animate==='function'&&!!$('#fxl');}
const spd=ms=>ms*(FX.mode==='fast'?0.45:1);
const fxWait=ms=>FXON()?new Promise(r=>setTimeout(r,spd(ms))):Promise.resolve();
const tokEl=id=>document.querySelector(`#bmap .tok[data-u="${id}"]`);
const gateEl=k=>document.querySelector(`#bmap .hx[data-k="${k}"]`);
function ctr(el){const f=$('#fxl').getBoundingClientRect(),r=el.getBoundingClientRect();return{x:r.left-f.left+r.width/2,y:r.top-f.top+r.height/2};}
function tr(p,extra){return `translate(${p.x}px,${p.y}px) translate(-50%,-50%) ${extra||''}`;}
function fxEl(cls,html,p){const e=document.createElement('div');e.className='fx '+cls;if(html)e.innerHTML=html;e.style.transform=tr(p);$('#fxl').appendChild(e);return e;}
function floatText(el,txt,cls,dy){if(!el||!FXON())return;const p=ctr(el);p.y+=dy||0;const e=fxEl('float '+(cls||''),txt,p);e.animate([{transform:tr(p,'scale(.7)'),opacity:0},{transform:tr({x:p.x,y:p.y-14},'scale(1.1)'),opacity:1,offset:.25},{transform:tr({x:p.x,y:p.y-46}),opacity:0}],{duration:spd(1100),easing:'ease-out'}).onfinish=()=>e.remove();}
function banner(txt,cls){if(!FXON())return;const f=$('#fxl');const p={x:f.clientWidth/2,y:f.clientHeight/2};const e=fxEl('banner '+(cls||''),txt,p);e.animate([{opacity:0,transform:tr(p,'scale(1.4)')},{opacity:1,transform:tr(p,'scale(1)'),offset:.25},{opacity:1,transform:tr(p,'scale(1)'),offset:.75},{opacity:0,transform:tr(p,'scale(.95)')}],{duration:spd(1000)}).onfinish=()=>e.remove();}
function fly(from,to,cls,n,arc){if(!FXON()||!from||!to)return;const a=ctr(from),b=ctr(to);
 for(let i=0;i<n;i++){const B2={x:b.x+rnd(-12,12),y:b.y+rnd(-10,10)};const ang=Math.atan2(B2.y-a.y,B2.x-a.x)*180/Math.PI;const m={x:(a.x+B2.x)/2,y:(a.y+B2.y)/2-(arc||0)};const e=fxEl(cls,'',a);
  e.animate([{transform:tr(a,`rotate(${ang}deg)`),opacity:0},{transform:tr(m,`rotate(${ang}deg)`),opacity:1,offset:.5},{transform:tr(B2,`rotate(${ang}deg)`),opacity:1}],{duration:spd(420),delay:spd(i*60),easing:'ease-in',fill:'both'}).onfinish=()=>e.remove();}}
function tween(el,pts,ms){return new Promise(res=>{if(!el||!FXON()||pts.length<2){res();return;}const seg=spd(ms);const t0=performance.now();
 const step=now=>{if(!FXON()){res();return;}const t=Math.max(0,(now-t0)/seg);const i=Math.min(pts.length-2,Math.floor(t)),f=Math.min(1,t-i),a=pts[i],b=pts[i+1];el.setAttribute('transform',`translate(${a.x+(b.x-a.x)*f},${a.y+(b.y-a.y)*f})`);if(t>=pts.length-1){res();return;}requestAnimationFrame(step);};requestAnimationFrame(step);});}
function jiggle(id){const u=BT.B.units.find(x=>x.id===id);const el=tokEl(id);if(!u||!el)return;const p=hxy(...u.pos);tween(el,[p,{x:p.x-5,y:p.y},{x:p.x+5,y:p.y},p],70);}
function showHits(ev){ev.hits.forEach(h=>{if(h.dmg>0){jiggle(h.id);floatText(tokEl(h.id),'-'+fmt(h.dmg),'dmg');}});}
async function playEv(B,ev){
 if(!FXON()||ev.type==='none')return;
 const from=tokEl(ev.from),to=ev.to?tokEl(ev.to):null;
 const fu=B.units.find(x=>x.id===ev.from);
 switch(ev.type){
  case 'charge':{sfx('attack');if(from&&to){const a=hxy(...fu.pos),tu=B.units.find(x=>x.id===ev.to),b=hxy(...tu.pos);tween(from,[a,{x:a.x+(b.x-a.x)*.45,y:a.y+(b.y-a.y)*.45},a],200);}await fxWait(220);showHits(ev);await fxWait(420);break;}
  case 'volley':sfx('volley');fly(from,to,'arrow',6,18);await fxWait(540);showHits(ev);await fxWait(250);break;
  case 'strat':sfx('strat');floatText(from,ev.label,'strat',-26);await fxWait(300);
   if(ev.ok){if(to){const p=ctr(to);const e=fxEl('burst','',p);e.animate([{transform:tr(p,'scale(.2)'),opacity:.9},{transform:tr(p,'scale(1.4)'),opacity:0}],{duration:spd(700),easing:'ease-out'}).onfinish=()=>e.remove();}showHits(ev);floatText(to,'混亂','muted',22);}
   else floatText(ev.backfire?from:to,ev.backfire?'被識破':'無效','muted',18);
   await fxWait(650);break;
  case 'refuse':floatText(from,'叫陣','strat',-26);await fxWait(350);floatText(to,'避戰','muted');await fxWait(500);break;
  case 'duel':{sfx('duel');banner('陣前單挑','duel');await fxWait(700);
   if(from&&to){const a=ctr(from),b=ctr(to),m={x:(a.x+b.x)/2,y:(a.y+b.y)/2};for(let i=0;i<10;i++){const e=fxEl('spark','',m);const g=rnd(0,Math.PI*2),r=rnd(24,60);e.animate([{transform:tr(m),opacity:1},{transform:tr({x:m.x+Math.cos(g)*r,y:m.y+Math.sin(g)*r}),opacity:0}],{duration:spd(500),delay:spd(i*25)}).onfinish=()=>e.remove();}}
   await fxWait(450);floatText(tokEl(ev.winner),'勝','win',-24);showHits(ev);await fxWait(650);break;}
  case 'duelDone':showHits(ev);await fxWait(500);break;
  case 'guard':floatText(from,'堅守','muted');await fxWait(450);break;
  case 'fire':{floatText(from,'火計','strat',-26);await fxWait(300);const h=document.querySelector(`#bmap .hx[data-k="${ev.hex}"]`);if(h&&ev.ok){const p=ctr(h);const e=fxEl('burst','',p);e.animate([{transform:tr(p,'scale(.2)'),opacity:.9},{transform:tr(p,'scale(1.6)'),opacity:0}],{duration:spd(700)}).onfinish=()=>e.remove();}else if(h)floatText(h,'未燃','muted');await fxWait(600);break;}
  case 'siege':{sfx('siege');const g=gateEl(ev.gate);fly(from,g,'stone',3,50);await fxWait(500);
   if(g)g.animate([{transform:'none'},{transform:'translate(-4px,2px)'},{transform:'translate(4px,-2px)'},{transform:'none'}],{duration:spd(320)});
   floatText(g,'-'+ev.wall,'dmg');if(ev.breach)banner('城門已破','duel');await fxWait(ev.breach?900:450);break;}
 }
}
async function animMove(u,keys){const el=tokEl(u.id);if(keys.length<2)return;await tween(el,keys.map(k=>hxy(...pk(k))),170);}
