/* ---------- 表現：大地圖美術、戰場天候動畫、背景音樂 ---------- */
/* 大地圖：勢力範圍色塊、山脈、長城、依城池規模的印章 */
const MTN=[['太行山',[[556,140],[572,200],[566,262],[548,318],[530,352]]],['秦嶺',[[286,418],[350,432],[418,436],[470,428]]],['大巴山',[[300,486],[352,516],[410,536],[452,552]]],['南嶺',[[470,700],[540,716],[610,708],[680,690]]],['祁連山',[[70,270],[130,246],[190,232]]],['陰山',[[420,110],[500,96],[580,104]]]];
const GREAT_WALL='M120,196 C220,150 320,120 430,98 S640,62 760,48 S860,36 900,30';
const CITY_SZ={};CITY_DATA.forEach(c=>CITY_SZ[c[0]]=c[4]);
function mapArtUnder(){
 let s='';
 s+=`<path d="${GREAT_WALL}" class="wall-line"/>`;
 MTN.forEach(([n,pts])=>{s+=`<polyline class="mtn" points="${pts.map(p=>p.join(',')).join(' ')}"/>`;pts.forEach((p,i)=>{if(i%1===0)s+=`<path class="mtn-g" d="M${p[0]-9},${p[1]+5} L${p[0]},${p[1]-8} L${p[0]+9},${p[1]+5}"/>`;});const m=pts[Math.floor(pts.length/2)];s+=`<text class="mlabel" x="${m[0]}" y="${m[1]-12}">${n}</text>`;});
 Object.values(S.cities).forEach(c=>{if(!c.owner)return;s+=`<circle class="terr" cx="${c.x}" cy="${c.y}" r="${44+(CITY_SZ[c.name]||1)*6}" fill="${fcolor(c.owner)}"/>`;});
 return s;
}
function sealSize(n){return 22+((CITY_SZ[n]||1)-1)*4;}
/* 戰場天候動畫層：雨絲、雪花、火焰閃爍由 CSS 完成，這裡只放容器 */
function wxLayer(B){return B.wx==='rain'||B.wx==='snow'?`<div class="wxfx ${B.wx}" aria-hidden="true"></div>`:'';}
/* 背景音樂：五聲音階生成，Web Audio 合成；戰鬥時節奏加快 */
const MUSIC={on:false,timer:null,step:0,battle:false};
const PENTA=[0,2,4,7,9,12,14,16];
function musicOn(){return PREF.get('music','off')==='on';}
function musicNote(semi,dur,vol,type){if(!AC)return;const f=196*Math.pow(2,semi/12);const o=AC.createOscillator();o.type=type||'sine';o.frequency.value=f;const g=AC.createGain();const t=AC.currentTime;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+0.03);g.gain.exponentialRampToValueAtTime(0.001,t+dur);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+dur+0.05);}
function musicTick(){
 if(!MUSIC.on)return;
 try{if(!AC){const C=window.AudioContext||window.webkitAudioContext;if(!C)return;AC=new C();}if(AC.state==='suspended')AC.resume();
  const b=MUSIC.battle;const beat=b?0.28:0.55;MUSIC.step++;
  const s=MUSIC.step;const R=seeded('m'+Math.floor(s/16));let deg=0;for(let i=0;i<(s%16)+1;i++)deg=clamp(deg+Math.round((R()-0.5)*3),0,PENTA.length-1);
  if(s%2===0||b)musicNote(PENTA[deg]+(b?-12:0),beat*1.8,b?0.05:0.04,b?'triangle':'sine');
  if(s%8===0)musicNote(PENTA[0]-24,beat*4,0.05,'sine');
  if(b&&s%4===0)musicNote(-24,0.12,0.06,'square');
  MUSIC.timer=setTimeout(musicTick,beat*1000);
 }catch(e){}
}
function musicStart(){if(MUSIC.on||!musicOn())return;MUSIC.on=true;musicTick();}
function musicStop(){MUSIC.on=false;clearTimeout(MUSIC.timer);}
document.addEventListener('click',()=>{if(musicOn())musicStart();},{once:false});
