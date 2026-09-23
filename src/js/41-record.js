/* ---------- 自動存檔、戰報回放、本局列傳、戰績卡 ---------- */
const SLOTS=[1,2,3,4,5,6,7,8];
function autoSave(){if(!S||!S.player||S.over||SIM.on)return;try{localStorage.setItem(slotKey('auto'),dumpState());}catch(e){}}
/* 本局大事記：log() 呼叫時同步記錄重要條目，不受 80 筆上限限制，用來生成列傳 */
function chron(m,c){if(!S||!S.player)return;if(!(c==='good'||c==='bad'||/攻陷|滅亡|稱帝|同盟|歸順|出仕|繼承|大敗|遇害|病逝|託孤|受禪/.test(m)))return;S.chron=S.chron||[];S.chron.push([S.year,S.month,m]);if(S.chron.length>600)S.chron.shift();}
/* 戰報回放：每日開始時記錄各隊位置與兵力 */
function repSnap(B){if(!B.map)return;B.rep=B.rep||[];B.rep.push({day:B.day,wx:B.wx,units:B.units.map(u=>({id:u.id,pos:u.pos?u.pos.slice():null,troops:u.troops,dead:u.dead,conf:u.conf,guard:u.guard})),gates:Object.assign({},B.gates),fire:Object.assign({},B.fire||{}),logAt:B.log.length});}
function repShow(i){
 const B=BT.B,r=B.rep[i];if(!r)return;BT.rep=i;
 if(!BT.repBackup)BT.repBackup={units:B.units.map(u=>({id:u.id,pos:u.pos,troops:u.troops,dead:u.dead,conf:u.conf,guard:u.guard})),gates:Object.assign({},B.gates),fire:B.fire,wx:B.wx};
 r.units.forEach(s=>{const u=B.units.find(x=>x.id===s.id);if(!u)return;u.pos=s.pos;u.troops=s.troops;u.dead=s.dead;u.conf=s.conf;u.guard=s.guard;});B.gates=Object.assign({},r.gates);B.fire=r.fire;B.wx=r.wx;
 drawBattle();
 const next=B.rep[i+1];const lines=B.log.slice(r.logAt,next?next.logAt:B.log.length);
 $('#bt-body').querySelector('.blog').innerHTML=lines.map(l=>`<p class="${l.c}">${l.m}</p>`).join('')||'<p class="hint">（本日無戰報）</p>';
 const bar=$('#bt-body').querySelector('.bacts');bar.innerHTML=`<span class="hint">回放　第 ${r.day} 日／共 ${B.rep.length} 日</span><button id="rp-prev" ${i>0?'':'disabled'}>上一日</button><button id="rp-next" ${next?'':'disabled'}>下一日</button><button id="rp-end" class="primary">結束回放</button>`;
}
function repExit(){const B=BT.B,b=BT.repBackup;if(b){b.units.forEach(s=>{const u=B.units.find(x=>x.id===s.id);if(u){u.pos=s.pos;u.troops=s.troops;u.dead=s.dead;u.conf=s.conf;u.guard=s.guard;}});B.gates=b.gates;B.fire=b.fire;B.wx=b.wx;}BT.rep=null;BT.repBackup=null;drawBattle();}
$('#battle').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!BT)return;if(b.id==='bt-replay'){repSnap(BT.B);repShow(0);}else if(b.id==='rp-prev')repShow(BT.rep-1);else if(b.id==='rp-next')repShow(BT.rep+1);else if(b.id==='rp-end')repExit();});
/* 本局列傳：仿陳壽體例，君主一篇、五大功臣各一段 */
function cn(n){return n>=10?cnNum(n):cnNum(n);}
function bioLine(o){const b=BIO[o.name];if(!b||!b.z)return '';const s=b.z.split('。')[0];return s?s+'。':'';}
function lordBiography(){
 const f=S.player,F=S.factions[f],L=lordOf(f),sc=SCENARIOS.find(x=>x.id===S.scn);
 const ch=(S.chron||[]);const cs=citiesOf(f);
 const wins=ch.filter(x=>/攻陷/.test(x[2])&&x[2].startsWith(F.name)).length,losses=ch.filter(x=>/失利|大敗/.test(x[2])&&x[2].startsWith(F.name)).length;
 const taken=ch.filter(x=>/攻陷/.test(x[2])&&x[2].startsWith(F.name)).map(x=>x[2].replace(/^.*攻陷/,'')).slice(0,8);
 const joined=ch.filter(x=>/歸順|出仕|來投|出山|加入麾下|願意出仕/.test(x[2])).map(x=>x[2].match(/^([一-鿿]{2,4})/)?.[1]).filter(Boolean).slice(0,6);
 const allies=Object.values(S.factions).filter(x=>x.alive&&x.id!==f&&rel(f,x.id).ally).map(x=>x.name);
 const yrs=S.year-sc.year;const title=F.emperor?'帝':lordTitle(f);
 let t=`<h3>${L.name}${F.emperor?'本紀':'傳'}</h3>`;
 t+=`<p class="evt">${L.name}${bioLine(L)?'，'+bioLine(L).replace(/^字/,'字'):'。'}${sc.year}年${sc.month}月，${sc.title}之際，${L.name}據${citiesOf(f).length?cs[0].name:'一隅'}而起，時有城${cn(S.startCities||cs.length)}。`;
 t+=taken.length?`其後${yrs}年間，${wins}戰克捷，${losses}戰失利，先後略定${taken.join('、')}${taken.length>=8?'等地':''}。`:`${yrs}年間，攻戰${wins+losses}，未嘗拓土。`;
 t+=joined.length?`${joined.join('、')}相繼來歸。`:'';
 t+=allies.length?`與${allies.join('、')}結盟。`:'';
 t+=F.emperor?`後受群臣勸進，即皇帝位。`:`官至${title}。`;
 t+=S.over&&!F.alive?`${S.year}年，勢力覆滅。`:`至${S.year}年，據有${cs.length}城，麾下將佐${S.officers.filter(o=>o.fac===f).length}人。`;
 t+=`</p>`;
 const top=S.officers.filter(o=>o.fac===f&&!isLord(o)).sort((a,b)=>(b.merit||0)-(a.merit||0)).slice(0,5);
 if(top.length){t+=`<h3>功臣列傳</h3>`;top.forEach(o=>{const sk=skillName(o);t+=`<p class="evt"><b>${o.name}</b>${bioLine(o)?'，'+bioLine(o):'。'}事${L.name}，官至${rankName(o)}，功績${o.merit||0}${sk?'，以「'+sk+'」聞名軍中':''}。${o.loy>=90?'忠貞不貳。':o.loy<60?'然常懷去志。':''}</p>`;});}
 const sc2=settleScore(f),rk=rankOf(sc2);
 const ping={S:'席捲宇內，混一區夏，雖古之聖王，何以加焉。',A:'雄據一方，與群雄鼎足，可謂一世之傑矣。',B:'保境安民，進取有度，亦足以垂名。',C:'偏安一隅，守成而已，惜其未能大用。',D:'勢單力弱，僅存宗廟，其亦時命之不濟歟。'}[rk];
 t+=`<h3>評曰</h3><p class="evt">${L.name}${ping}</p><p class="hint">本傳由本局發生的事件自動生成，仿《三國志》體例。</p>`;
 return t;
}
function openBiography(){
 if(!S||!S.player)return;const h=lordBiography();
 modal('本局列傳',`<div id="biog">${h}</div>`,[{label:'複製文字',fn:()=>{const txt=$('#biog').innerText;try{navigator.clipboard.writeText(txt);toast('已複製');}catch(e){toast('無法存取剪貼簿');}return false;}},{label:'戰績卡',fn:()=>{setTimeout(openShareCard,0);}},{label:'關閉',primary:true}]);
 $('#modal .dlg').classList.add('wide');
}
/* 戰績卡：用 canvas 畫成 1200×630 的圖片 */
async function openShareCard(){
 if(!S||!S.player)return;const f=S.player,F=S.factions[f],L=lordOf(f),sc=SCENARIOS.find(x=>x.id===S.scn),cs=citiesOf(f);const s=settleScore(f),rk=rankOf(s);
 const W=1200,H=630,cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');
 g.fillStyle='#DEE0D3';g.fillRect(0,0,W,H);g.fillStyle=F.color;g.fillRect(0,0,W,14);g.fillRect(0,H-14,W,14);
 g.fillStyle='rgba(0,0,0,.06)';for(let i=0;i<40;i++){g.fillRect(rnd(0,W),rnd(20,H-20),rnd(2,6),rnd(2,6));}
 const svg=portrait(L,200,{col:F.color,lord:true}).replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" ');const img=new Image();
 await new Promise(res=>{img.onload=res;img.onerror=res;img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);});
 try{g.drawImage(img,70,150,300,300);}catch(e){}
 g.fillStyle='#262A22';g.font='900 64px "Noto Serif TC",serif';g.fillText('群雄逐鹿',420,120);
 g.font='600 30px "Noto Serif TC",serif';g.fillStyle='#666B5F';g.fillText(`${sc.year} 年　${sc.title}`,420,165);
 g.fillStyle='#262A22';g.font='900 54px "Noto Serif TC",serif';g.fillText(`${F.name}軍　${L.name}`,420,240);
 g.font='400 30px "Noto Serif TC",serif';g.fillStyle='#262A22';
 const lines=[`${eraStr()}　${F.emperor?'皇帝':lordTitle(f)}`,`城池 ${cs.length}／${Object.keys(S.cities).length}　武將 ${S.officers.filter(o=>o.fac===f).length} 人　人口 ${wan(cs.reduce((a,c)=>a+c.pop,0))}`,`總分 ${s.total}　評等 ${rk}${S.goal&&S.goal.done?'　劇本目標達成':''}`];
 lines.forEach((l,i)=>g.fillText(l,420,300+i*48));
 g.font='900 160px "Noto Serif TC",serif';g.fillStyle=F.color;g.globalAlpha=.85;g.fillText(rk,1000,470);g.globalAlpha=1;
 g.font='400 22px "Noto Serif TC",serif';g.fillStyle='#666B5F';g.fillText('qunxiong-zhulu.vercel.app',420,560);
 const url=cv.toDataURL('image/png');
 modal('戰績卡',`<img src="${url}" alt="戰績卡" style="width:100%;max-width:720px;display:block;border:1px solid var(--line)"><p class="hint">長按或右鍵可儲存圖片。</p>`,[{label:'複製圖片',fn:()=>{cv.toBlob(async b=>{try{await navigator.clipboard.write([new ClipboardItem({'image/png':b})]);toast('已複製圖片');}catch(e){toast('這個瀏覽器不支援複製圖片，請長按儲存');}});return false;}},{label:'下載',fn:()=>{const a=document.createElement('a');a.href=url;a.download=`群雄逐鹿-${F.name}-${S.year}.png`;a.click();return false;}},{label:'關閉',primary:true}]);
 $('#modal .dlg').classList.add('wide');
}
