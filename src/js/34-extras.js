/* ---------- 每月大事摘要、成就、音效 ---------- */
const PREF={get(k,d){try{return localStorage.getItem('qunxiong-'+k)??d;}catch(e){return d;}},set(k,v){try{localStorage.setItem('qunxiong-'+k,v);}catch(e){}}};
/* 每月大事：把上個月的重要日誌整理成一張卡，排在其他事件之前 */
function monthlySummary(prevDate){
 if(PREF.get('summary','on')!=='on'||SIM.on)return;
 const rows=S.log.filter(l=>l.t===prevDate&&(l.c==='good'||l.c==='bad'||/攻陷|滅亡|來襲|稱帝|同盟|病逝|遇害|大敗|失利/.test(l.m))).slice(0,10);
 if(rows.length<2)return;
 S.evq=S.evq||[];S.evq.unshift({title:`${prevDate}　本月大事`,text:`<ul class="summ">${rows.map(l=>`<li class="${l.c}">${l.m}</li>`).join('')}</ul><p class="hint">可在「存讀檔」的設定裡關閉每月摘要。</p>`,choices:null});
}
/* 成就 */
const ACH=[
 ['first_win','初戰告捷','贏得第一場戰鬥'],['cities10','十城之主','據有十座城池'],['cities20','半壁江山','據有二十座城池'],['unify','天下一統','奪下全部城池'],
 ['goal','霸業初成','達成劇本目標'],['emperor','九五之尊','登基稱帝'],['settleS','千古一帝','天下大勢結算獲得 S 評等'],['settleA','鼎足而立','天下大勢結算獲得 A 評等'],
 ['small','以小博大','以一座城起家，據有十座城'],['benevolent','仁德之君','據有十城而未曾處斬任何俘虜'],['duel10','陣前無敵','親自指揮的單挑獲勝十次'],['fire5','火燒連營','火計燒到敵軍五次'],
 ['roster100','人才濟濟','麾下武將達一百人'],['ally3','縱橫捭闔','同時擁有三個同盟'],['outer8','化外之君','扮演周邊勢力據有八座城'],['survive10','偏安一隅','扮演孔融、王朗、韓馥或陶謙撐過十年'],
 ['bio50','博覽群書','查看五十篇人物誌'],['policy','新政','頒行過全部三項政策'],['seal','傳國玉璽','取得傳國玉璽'],['scholar','熟讀史書','隨堂測驗答對十題'],['legend','三國通','解鎖其餘全部成就']];
function achGet(){try{return JSON.parse(PREF.get('ach','{}'));}catch(e){return{};}}
function unlockAch(id){
 const a=achGet();if(a[id]||!ACH.some(x=>x[0]===id))return;a[id]=new Date().toLocaleDateString('zh-TW');PREF.set('ach',JSON.stringify(a));
 const def=ACH.find(x=>x[0]===id);toast(`成就解鎖：${def[1]}`);if(S)log(`成就解鎖　${def[1]}：${def[2]}`,'good');sfx('unlock');
 if(id!=='legend'&&ACH.filter(x=>x[0]!=='legend').every(x=>a[x[0]]))unlockAch('legend');
}
function stat(k,v){S.stats=S.stats||{};S.stats[k]=(S.stats[k]||0)+(v||1);return S.stats[k];}
function checkAch(){
 if(!S||!S.player||!S.factions[S.player]||!S.factions[S.player].alive)return;
 const f=S.player,n=citiesOf(f).length,st=S.stats||{};
 if(n>=10)unlockAch('cities10');if(n>=20)unlockAch('cities20');
 if(n>=10&&S.startCities===1)unlockAch('small');
 if(n>=10&&!(st.exec>0))unlockAch('benevolent');
 if(S.officers.filter(o=>o.fac===f).length>=100)unlockAch('roster100');
 if(Object.values(S.factions).filter(x=>x.alive&&x.id!==f&&rel(f,x.id).ally).length>=3)unlockAch('ally3');
 if(isOuter(f)&&n>=8)unlockAch('outer8');
 const sc=SCENARIOS.find(x=>x.id===S.scn);if(['kongrong','wanglang','hanfu','taoqian'].includes(f)&&S.year-sc.year>=10)unlockAch('survive10');
 if(hasSeal(f))unlockAch('seal');
 const P=polOf(f);if(PSLOTS.every(s=>P[s]))unlockAch('policy');
 if(S.factions[f].emperor)unlockAch('emperor');
 if((st.duelWins||0)>=10)unlockAch('duel10');if((st.fireHits||0)>=5)unlockAch('fire5');if((st.bioViews||0)>=50)unlockAch('bio50');
}
function openAch(){
 const a=achGet();const n=ACH.filter(x=>a[x[0]]).length;
 modal('成就',`<p class="hint">已解鎖 ${n}／${ACH.length}。成就保存在這個瀏覽器裡。</p><div class="achgrid">${ACH.map(([id,t,d])=>`<div class="ach ${a[id]?'on':''}"><b>${a[id]?'★':'☆'} ${t}</b><small>${d}</small>${a[id]?`<small class="itm">${a[id]}</small>`:''}</div>`).join('')}</div>`,[{label:'關閉',primary:true}]);
 $('#modal .dlg').classList.add('wide');
}
/* 音效：Web Audio 合成，不用外部檔案。首次使用者操作後才建立 AudioContext */
let AC=null;
function sfxOn(){return PREF.get('sfx','on')==='on';}
function sfx(name){
 if(!sfxOn())return;
 try{
  if(!AC){const C=window.AudioContext||window.webkitAudioContext;if(!C)return;AC=new C();}
  if(AC.state==='suspended')AC.resume();
  const t=AC.currentTime;const g=AC.createGain();g.connect(AC.destination);
  const tone=(f,d,type,vol,at)=>{const o=AC.createOscillator();o.type=type||'sine';o.frequency.setValueAtTime(f,t+(at||0));const gg=AC.createGain();gg.gain.setValueAtTime(0,t+(at||0));gg.gain.linearRampToValueAtTime(vol||0.15,t+(at||0)+0.01);gg.gain.exponentialRampToValueAtTime(0.001,t+(at||0)+d);o.connect(gg);gg.connect(g);o.start(t+(at||0));o.stop(t+(at||0)+d+0.05);};
  const noise=(d,vol,lp)=>{const b=AC.createBuffer(1,AC.sampleRate*d,AC.sampleRate);const data=b.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);const s=AC.createBufferSource();s.buffer=b;const fl=AC.createBiquadFilter();fl.type='lowpass';fl.frequency.value=lp||1200;const gg=AC.createGain();gg.gain.value=vol||0.2;s.connect(fl);fl.connect(gg);gg.connect(g);s.start(t);};
  switch(name){
   case 'attack':noise(0.18,0.25,2000);tone(160,0.12,'square',0.08);break;
   case 'volley':for(let i=0;i<4;i++)tone(900-i*120,0.08,'triangle',0.06,i*0.05);break;
   case 'siege':noise(0.35,0.35,400);tone(70,0.3,'sine',0.25);break;
   case 'duel':tone(660,0.12,'square',0.1);tone(880,0.12,'square',0.1,0.13);noise(0.12,0.15,3000);break;
   case 'strat':tone(520,0.25,'sine',0.1);tone(780,0.3,'sine',0.08,0.1);break;
   case 'win':[523,659,784,1047].forEach((f,i)=>tone(f,0.35,'triangle',0.12,i*0.12));break;
   case 'lose':[392,330,262].forEach((f,i)=>tone(f,0.4,'triangle',0.12,i*0.18));break;
   case 'month':tone(880,0.4,'sine',0.06);tone(1320,0.5,'sine',0.04,0.05);break;
   case 'event':tone(1047,0.6,'sine',0.08);tone(1568,0.8,'sine',0.05,0.02);break;
   case 'unlock':[784,988,1175,1568].forEach((f,i)=>tone(f,0.25,'sine',0.1,i*0.08));break;
  }
 }catch(e){}
}
/* 設定區塊（掛在存讀檔視窗） */
function settingsHTML(){return `<h3>設定</h3><div class="dpacts"><label class="chk"><input type="checkbox" id="set-sfx" ${sfxOn()?'checked':''}> 音效</label><label class="chk"><input type="checkbox" id="set-music" ${musicOn()?'checked':''}> 背景音樂</label><label class="chk"><input type="checkbox" id="set-summ" ${PREF.get('summary','on')==='on'?'checked':''}> 每月大事摘要</label><button id="set-ach">成就一覽</button><button id="set-lb">排行榜</button><button id="set-bug">回報問題</button></div><p class="hint">版本 ${VERSION}　原始碼：<a href="${REPO_URL}" target="_blank" rel="noopener">GitHub</a></p>`;}
$('#modal').addEventListener('change',e=>{if(e.target.id==='set-sfx'){PREF.set('sfx',e.target.checked?'on':'off');if(e.target.checked)sfx('unlock');}if(e.target.id==='set-summ')PREF.set('summary',e.target.checked?'on':'off');if(e.target.id==='set-music'){PREF.set('music',e.target.checked?'on':'off');if(e.target.checked)musicStart();else musicStop();}});
$('#modal').addEventListener('click',e=>{if(e.target.id==='set-ach')openAch();if(e.target.id==='set-lb')openLeaderboard();if(e.target.id==='set-bug')reportBug();});
function reportBug(){const sc=S&&SCENARIOS.find(x=>x.id===S.scn);const body=encodeURIComponent(`## 問題描述\n（請描述發生了什麼、預期應該怎樣）\n\n## 環境\n- 版本：${VERSION}\n- 劇本：${sc?sc.title:'—'}　勢力：${S&&S.player?S.factions[S.player].name:'—'}　時間：${S?eraStr():'—'}\n- 瀏覽器：${navigator.userAgent}\n`);window.open(`${REPO_URL}/issues/new?title=${encodeURIComponent('[回報] ')}&body=${body}`,'_blank','noopener');}
