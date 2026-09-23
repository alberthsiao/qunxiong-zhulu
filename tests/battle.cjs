// 戰鬥專項測試：四向戰場布局、盟友援軍、快速結算的兵種與地勢修正
const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(require('path').join(__dirname,'../dist/index.html'),'utf8');
(async()=>{
 const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.test/'});const w=dom.window;const errs=[];w.addEventListener('error',e=>errs.push(e.message));
 await new Promise(r=>setTimeout(r,300));
 w.eval("newGame('cao','s200')");
 const out=w.eval(`(()=>{
  const res=[];const ok=(c,m)=>{if(!c)res.push('FAIL '+m);};
  // 一、每座城、每條道路的進攻方向都要能產生合法戰場
  const dirs={W:0,E:0,S:0,N:0};
  for(const a in ADJ)for(const b of ADJ[a]){
   const src=S.cities[a],t=S.cities[b];
   const B={f:'cao',df:t.owner,src:a,city:b,wall:t.def,units:[mkUnit('a',null,3000,0),mkUnit('a',null,3000,1),mkUnit('a',null,3000,2),mkUnit('d',null,3000,0),mkUnit('d',null,2000,'r0')],log:[],morale:{a:60,d:60}};
   initMap(B);const d=attackDir(B);dirs[d]++;
   ok(Object.keys(B.gates).length===3,a+'→'+b+' 城門數 '+Object.keys(B.gates).length);
   ok(B.units.every(u=>u.pos&&B.T[hk(...u.pos)]),a+'→'+b+' 部隊位置');
   ok(B.units.filter(u=>u.side==='d').every(u=>['core','city'].includes(B.T[hk(...u.pos)])),a+'→'+b+' 守軍不在城內');
   // 攻方能否走到任一城門旁（不限移動力的連通性）
   const seen=new Set([hk(...B.units[0].pos)]),q=[B.units[0].pos];let hit=false;
   while(q.length){const p=q.shift();if(Object.keys(B.gates).some(g=>hdist(p,pk(g))===1)){hit=true;break;}for(const n of nbrs(...p)){const k=hk(...n);if(seen.has(k)||TER[B.T[k]].cost>=99)continue;seen.add(k);q.push(n);}}
   ok(hit,a+'→'+b+' 攻方到不了城門');
  }
  res.push('布局方向統計 '+JSON.stringify(dirs));
  // 二、援軍：讓袁紹與劉表同盟，曹操自許昌攻宛（假設相鄰），檢查援軍出現與歸建
  const pairs=[];for(const a in ADJ)for(const b of ADJ[a]){const A=S.cities[a],Bc=S.cities[b];if(A.owner&&Bc.owner&&A.owner!==Bc.owner)for(const c of ADJ[b]){const C=S.cities[c];if(C.owner&&C.owner!==A.owner&&C.owner!==Bc.owner&&C.owner!==S.player&&Bc.owner!==S.player)pairs.push([a,b,c]);}}
  ok(pairs.length>0,'找不到可測援軍的三城組合');
  if(pairs.length){const[a,b,c]=pairs[0];const src=S.cities[a],t=S.cities[b],h=S.cities[c];
   rel(h.owner,t.owner).ally=true;h.troops=20000;
   if(!officersIn(c,h.owner).some(o=>o.id!==S.factions[h.owner].lord)){const o=S.officers.find(o=>o.fac===h.owner&&o.id!==S.factions[h.owner].lord);if(o)o.city=c;}
   const est=reinfCands(src.owner,t);ok(est.some(r=>r.c.name===c),'reinfCands 未列出 '+c);
   const before=h.troops,tb=t.troops;
   const offs=officersIn(a,src.owner).slice(0,2);src.troops=30000;
   const B=setupBattle(src.owner,src,t,offs,Math.min(20000,offs.reduce((x,o)=>x+capOf(o),0)));
   const ru=B.units.filter(u=>u.ally);ok(ru.length>=1,'沒有援軍部隊');
   ok(h.troops<before,'援軍未從出發城扣兵');
   const sent=before-h.troops;
   autoResolve(B);const left=ru.filter(u=>u.home===c).reduce((x,u)=>x+u.troops,0);const mid=h.troops;
   finishBattle(B);
   ok(S.cities[c].owner!==h.owner||h.troops===mid+left,'援軍殘兵未歸建');
   ok(!B.win?t.troops<=tb:true,'守城兵力混入援軍');
   res.push('援軍 '+a+'→'+b+'，'+c+' 派 '+sent+'，殘 '+left+'，'+(B.win?'城陷':'守住'));
  }
  // 三、qmod：兵種相剋與地勢
  const u=t=>({type:t,side:'a'}),dd=t=>({type:t,side:'d'});
  ok(qmod({ter:'plain'},u('騎'),dd('弓'),'charge')>qmod({ter:'plain'},u('騎'),dd('槍'),'charge'),'騎剋弓');
  ok(qmod({ter:'mount'},u('騎'),dd('槍'),'charge')<qmod({ter:'plain'},u('騎'),dd('槍'),'charge'),'山地不利騎兵');
  ok(qmod({ter:'river'},dd('弓'),u('槍'),'volley')>qmod({ter:'plain'},dd('弓'),u('槍'),'volley'),'水鄉利守方弓兵');
  // 四、周邊勢力特性
  const by=n=>S.officers.find(o=>o.name===n);
  ok(apt(by('蹋頓'))==='騎'&&apt(by('軻比能'))==='騎','遊牧武將預設騎兵');
  const FB={f:'wuhuan',df:'nanman',ter:'mount'};
  ok(fmod(FB,{type:'騎',side:'a'},{type:'槍',side:'d'},'charge')<1.15*0.81&&fmod(FB,{type:'騎',side:'a'},{type:'槍',side:'d'},'charge')>0.9,'遊牧突擊 ×1.15 與藤甲山地 ×0.8 應相乘');
  ok(fmod(FB,{type:'弓',side:'a'},{type:'槍',side:'d'},'strat')===1.3,'藤甲畏火');
  ok(fmod({f:'cao',df:'gogu',ter:'plain'},{type:'槍',side:'a'},{type:'槍',side:'d'},'volley')===0.85,'高句麗山城');
  ok(fmod({f:'cao',df:'yuan',ter:'plain'},{type:'騎',side:'a'},{type:'槍',side:'d'},'charge')===1,'一般勢力無修正');
  const bh=S.cities['北海'],ym=S.cities['邪馬台'],ll=S.cities['樂浪'];
  ok(marchFood('cao',bh,ym,10000)===2000&&marchFood('wa',ym,bh,10000)===1000&&marchFood('cao',S.cities['許昌'],S.cities['宛'],10000)===1000,'渡海軍糧');
  {const o1=officersIn('邪馬台','wa').filter(o=>o.name!=='卑彌呼').slice(0,1);ym.troops=20000;const m0=Math.round(clamp(55+ym.train/4,50,80));const B1=setupBattle('wa',ym,ll,o1,3000);ok(B1.morale.a===m0+8-6,'倭攻遼東：鬼道 +8、渡海之民不扣、僻處海東 −6，應為 +2，實得 '+(B1.morale.a-m0));
   const o2=officersIn('樂浪','gsdu').slice(0,1);ll.troops=20000;const m1=Math.round(clamp(55+ll.train/4,50,80));const B2=setupBattle('gsdu',ll,ym,o2,3000);ok(B2.morale.a===m1-10&&B2.morale.d===Math.round(clamp(60+ym.train/4,55,85))+8,'渡海士氣 −10、守方鬼道 +8');
   [B1,B2].forEach(b=>{b.over=true;b.win=false;finishBattle(b);});}
  // 五、朝貢
  {const env=officersIn('許昌','cao')[0];const c=S.cities[env.city];const g0=c.gold;const R=Math.random;Math.random=()=>0;const r=doTribute(env,'wa','demand');Math.random=R;
   ok(c.gold===g0+tributeGain('wa')&&rel('cao','wa').truce>S.turn&&/朝貢/.test(r.msg),'要求朝貢成功');
   const sp=S.player;S.player='wa';const e2=officersIn('邪馬台','wa')[0];const c2=S.cities['邪馬台'];c2.gold=1000;const f0=c2.food;rel('wa','yuan').trust=40;const r2=doTribute(e2,'yuan','pay');
   ok(c2.gold===700&&c2.food===f0+1500&&rel('wa','yuan').trust===55&&rel('wa','yuan').truce>S.turn,'遣使朝貢');S.player=sp;}
  // 六、天候
  ok(wxMod({wx:'rain'},'volley')===0.7&&wxMod({wx:'wind'},'strat')===1.25&&wxMod({wx:'sun'},'charge')===1&&wxMod({},'volley')===1,'天氣傷害修正');
  ok(wxRange({wx:'fog'},{type:'弓'})===2&&wxRange({wx:'sun'},{type:'弓'})===3&&wxRange({wx:'fog'},{type:'槍'})===1,'大霧射程');
  ok(umv({wx:'snow'},{mv:4,type:'槍'})===3&&umv({wx:'rain'},{mv:5,type:'騎'})===4&&umv({wx:'rain'},{mv:4,type:'槍'})===4,'雨雪移動力');
  ok(Math.abs(stratChance({int:80},{int:80},{wx:'fog'})-0.45)<1e-9&&Math.abs(stratChance({int:80},{int:80})-0.35)<1e-9,'大霧計略');
  {const mk=(f,src,wx)=>({f,src,wx,morale:{a:60,d:60},log:[]});
   let b=mk('sun','建業','snow');wxDayEnd(b);ok(b.morale.a===58,'南軍遇雪');b=mk('yuan','薊','snow');wxDayEnd(b);ok(b.morale.a===60,'北軍不畏雪');b=mk('xiongnu','平陽','snow');wxDayEnd(b);ok(b.morale.a===60,'遊牧不畏雪');
   b=mk('cao','許昌','heat');wxDayEnd(b);ok(b.morale.a===58,'北軍遇暑');b=mk('shixie','交趾','heat');wxDayEnd(b);ok(b.morale.a===60,'南軍不畏暑');}
  {const xu=S.cities['許昌'],wan=S.cities['宛'],ji=S.cities['薊'];S.climate={mid:{k:'drought',until:S.turn}};ok(harvestMod(xu)===0.6&&harvestMod(ji)===1&&marchWx(xu,wan)===1,'大旱');
   S.climate={north:{k:'snow',until:S.turn}};ok(marchWx(ji,S.cities['南皮'])===1.5&&marchFood('yuan',ji,S.cities['南皮'],10000)===1500&&climateText()==='華北大雪','大雪軍糧');
   S.climate={north:{k:'snow',until:S.turn-1}};ok(marchWx(ji,S.cities['南皮'])===1&&climateText()==='','天災過期');
   const seen={},t0=S.turn,m0=S.month,L=S.log.length;for(let i=0;i<1200;i++){S.turn++;S.month=S.month%12+1;monthlyClimate();Object.values(S.climate).forEach(x=>seen[x.k]=1);}
   ok(['drought','bumper','flood','snow','locust'].every(k=>seen[k]),'一百年內五種天災都應出現：'+Object.keys(seen));
   const wx={};S.month=1;for(let i=0;i<400;i++)wx[rollWx({city:'薊'})]=1;ok(wx.snow&&!wx.heat&&!wx.rain,'薊城一月天氣：'+Object.keys(wx));
   const wy={};S.month=7;for(let i=0;i<400;i++)wy[rollWx({city:'交趾'})]=1;ok(wy.heat&&wy.rain&&!wy.snow,'交趾七月天氣：'+Object.keys(wy));
   S.turn=t0;S.month=m0;S.climate={};Object.values(S.cities).forEach(c=>{c.food=Math.max(c.food,20000);});}
  // 七、夷洲（台灣）：無主之地、瘴癘、可佔領、230 年浮海求夷洲
  {const kj=S.cities['會稽'],yz=S.cities['夷洲'];ok(yz&&yz.owner===null&&!S.factions.yizhou&&ADJ['夷洲'].includes('會稽')&&ADJ['夷洲'].includes('番禺')&&isSea('會稽','夷洲'),'夷洲應是無主城並以海路連會稽、番禺');
   ok(!S.officers.some(o=>/夷洲|山夷|海夷/.test(o.name)),'不應有夷洲勢力的武將');
   kj.troops=40000;kj.food=80000;const f=kj.owner;const o=officersIn('會稽',f).slice(0,1);const B3=setupBattle(f,kj,yz,o,4000);
   const at=B3.units.filter(u=>u.side==='a').reduce((x,u)=>x+u.troops,0);ok(at===3400,'瘴癘應折損一成五，實際剩 '+at);
   B3.units.filter(u=>u.side==='d').forEach(u=>{u.troops=0;u.dead=true;});checkB(B3);finishBattle(B3);ok(yz.owner===f,'打下後應歸攻方所有，實際 '+yz.owner);
   yz.owner=null;yz.troops=6000;
   const y0=S.year,sq=S.officers.find(o=>o.name==='孫權'),ld=S.factions[f].lord,sp=S.player;
   S.year=230;S.evDone={sunce:1,lianhuan:1,sangu:1,qianli:1};S.factions[f].lord=sq.id;sq.fac=f;sq.city='建業';kj.troops=30000;kj.food=50000;S.player='cao';
   runEvents();ok(S.evDone.yizhou===1&&S.log.some(l=>/夷洲/.test(l.m)),'230 年應觸發浮海求夷洲');ok(kj.troops<30000,'遠征應自會稽出兵');
   S.year=y0;S.factions[f].lord=ld;S.player=sp;}
  // 八、軍備
  {const xu=S.cities['許昌'],wan=S.cities['宛'];{const st=initState('cao','s200');ok(st.cities['許昌'].gear.horse===2400&&st.cities['彈汗山'].gear.horse===12000&&st.cities['夷洲'].gear.bow===0,'開局軍備庫');}
   ok(gearMod({type:'騎',gr:1},{type:'弓'},'charge')===1.2&&gearMod({type:'弓',gr:0.5},{type:'騎'},'volley')===1.125&&Math.abs(gearMod({type:'騎',gr:0},{type:'槍',gr:1},'charge')-0.85)<1e-9&&gearMod({type:'弓',gr:1},{type:'槍',gr:1},'strat')===1,'軍備傷害修正');
   ok(ramMod({ram:10})===1.6&&ramMod({ram:5})===1.3&&ramMod({})===1,'衝車修正');
   const o=officersIn('許昌','cao')[0];xu.gold=1000;const h0=xu.gear.horse;const r=doGear('horse',o,xu);ok(r&&xu.gear.horse>h0&&xu.gold===900&&o.done,'製造戰馬');o.done=false;
   const r2=doGear('ram',o,xu);ok(r2&&xu.gear.ram>=1&&xu.gold===750,'製造衝車');o.done=false;
   xu.gear={horse:20000,bow:5000,armor:1000,ram:12};xu.troops=30000;wan.owner='yuan';wan.troops=3000;
   const offs=officersIn('許昌','cao').slice(0,2);const types={};types[offs[0].id]='騎';types[offs[1].id]='槍';
   const B4=setupBattle('cao',xu,wan,offs,8000,types);const ua=B4.units.filter(u=>u.side==='a');
   ok(B4.ram===10&&xu.gear.ram===2,'衝車最多帶十輛');ok(ua[0].gr===1&&ua[1].gr>0&&ua[1].gr<1&&xu.gear.armor===0,'依兵種配發，鐵甲不足時部分裝備：'+ua.map(u=>u.type+u.gr.toFixed(2)));
   const tookH=B4.gearTake.horse;ua[0].troops=Math.round(ua[0].max/2);B4.units.filter(u=>u.side==='d').forEach(u=>{u.troops=0;u.dead=true;});checkB(B4);
   wan.gear={horse:0,bow:400,armor:0,ram:0};finishBattle(B4);
   ok(wan.owner==='cao'&&Math.abs(wan.gear.horse-tookH/2)<=1&&wan.gear.ram===10&&wan.gear.bow===200,'戰後依存活比例收回、守方庫存減半：'+JSON.stringify(wan.gear));
   const g0=xu.gear.horse;xu.gear.horse=4000;const tb=xu.troops;doMove(xu,wan,[],Math.round(tb/2));ok(Math.abs(xu.gear.horse-2000)<=1,'調兵時軍備隨軍轉移');}
  // 九、頭像：每名武將、各年齡層、君主與否都要畫得出來，且不含壞掉的數值或外部資源
  {let bad=[];for(const o of S.officers)for(const y of [o.appear,o.appear+20,o.appear+40,o.appear+60])for(const lord of [false,true]){const v=portrait(o,32,{year:y,lord,col:'#3B5BA5'});if(!/^<svg[^>]*viewBox="0 0 64 64"/.test(v)||/NaN|undefined|null|href|url[(]/.test(v)||!v.endsWith('</svg>'))bad.push(o.name+'@'+y);}
   ok(bad.length===0,'頭像有問題：'+bad.slice(0,5).join('、'));
   const gy=S.officers.find(o=>o.name==='關羽'),zf=S.officers.find(o=>o.name==='張飛');ok(portrait(gy,32,{year:200})===portrait(gy,32,{year:200})&&portrait(gy,32,{year:200})!==portrait(zf,32,{year:200}),'同一人頭像應固定、不同人應不同');
   ok(portrait(gy,32,{year:190})!==portrait(gy,32,{year:240}),'年齡應影響頭像');}
  // 十、擴充名單：人數、效力年份判定、出身城都存在、姓名不重複
  {ok(OFF.length>=620,'名單人數 '+OFF.length);ok(new Set(OFF.map(r=>r[0])).size===OFF.length,'姓名不應重複');ok(OFF.every(r=>CITY_DATA.some(c=>c[0]===r[8])),'出身城都要存在');
   const id=n=>OFF.findIndex(r=>r[0]===n);ok(affOf(id('辛毗'),200)==='yuan'&&affOf(id('辛毗'),208)==='cao'&&affOf(id('辛毗'),190)===null&&affOf(id('司馬徽'),200)===null&&affOf(id('曹操'),200)===null,'效力年份判定');
   const s1=initState('cao','s200'),s2=initState('cao','s208'),by=(st,n)=>st.officers.find(o=>o.name===n);
   ok(by(s1,'陳群').fac==='cao'&&by(s1,'辛毗').fac==='yuan'&&by(s2,'辛毗').fac==='cao'&&by(s1,'鄧艾').fac==='unborn'&&by(s2,'皇甫嵩').fac==='gone'&&by(s1,'司馬徽').fac===null&&by(s1,'司馬徽').city==='襄陽','各劇本的歸屬');
   ok(s1.officers.filter(o=>o.fac&&s1.factions[o.fac]).every(o=>s1.cities[o.city]&&s1.cities[o.city].owner===o.fac),'有勢力的武將必須在自家城裡');
   const o=S.officers.find(x=>x.name==='鄧艾'),y0=S.year,m0=S.month;if(o&&S.factions.cao&&S.factions.cao.alive&&citiesOf('cao').length){o.fac='unborn';o.city=null;S.year=220;S.month=1;const R=Math.random;Math.random=()=>0.99;lifeCycle();Math.random=R;ok(o.fac==='cao'&&S.cities[o.city].owner==='cao','登場時應直接加入效力的勢力，實際 '+o.fac);S.year=y0;S.month=m0;}}
  // 十一、人物誌：全員有條目、內容可渲染、介紹只出現一次且模擬中不出現
  {const miss=OFF.map(r=>r[0]).filter(n=>!BIO[n]);ok(miss.length===0,'缺人物誌：'+miss.slice(0,8).join(' '));
   ok(S.officers.every(o=>{const h=bioHTML(o);return /<svg/.test(h)&&!/undefined|NaN/.test(h);}),'人物誌 HTML');
   const o=S.officers.find(x=>x.fac===S.player&&x.id!==S.factions[S.player].lord);S.intro={};S.evq=[];introduce(o,'測試');introduce(o,'測試');ok(S.evq.length===1&&S.evq[0].title.includes(o.name),'介紹一次');
   S.evq=[];SIM.on=true;introduce(S.officers.find(x=>x.fac===S.player&&!S.intro[x.id]),'測試');SIM.on=false;ok(S.evq.length===0,'模擬中不介紹');S.evq=[];}
  // 十二、歷史事件、勝利條件、技能、火計、伏兵、政策、關係、成就
  {const sp=S.player;S.player='sun';S.evDone={};const xy=S.officers.find(o=>o.name==='許攸');xy.fac='yuan';xy.city='鄴';const y0=S.year;S.year=200;runHistory();ok(S.evDone.wuchao===1&&xy.fac==='cao','烏巢事件：許攸應投曹，實際 '+xy.fac+' '+JSON.stringify(Object.keys(S.evDone)));S.year=y0;S.player=sp;
   ok(HIST.every(h=>h.id&&typeof h.when==='function'&&typeof h.run==='function')&&new Set(HIST.map(h=>h.id)).size===HIST.length,'歷史事件定義');}
  {S.goal=makeGoal(S.player);ok(S.goal.cities>=6&&S.goal.year>S.year,'劇本目標');const g=S.goal;g.cities=citiesOf(S.player).length;S.evq=[];checkGoal();ok(g.done&&S.evq.some(e=>/霸業初成/.test(e.title)),'達成目標應推事件');
   const sc=settleScore(S.player);ok(sc.total>0&&['S','A','B','C','D'].includes(rankOf(sc)),'結算評分');
   const y0=S.year;S.year=END_YEAR;S.settled=false;checkSettle();ok(S.settled===true&&/天下大勢/.test(document.querySelector('#m-title').textContent),'250 年結算');closeModal();S.year=y0;S.settled=false;}
  {const gy=S.officers.find(o=>o.name==='關羽'),zy=S.officers.find(o=>o.name==='趙雲');ok(skillOf(gy)==='shenwei'&&skillOf(zy)==='longdan'&&confImmune({off:zy.id}),'技能指派');
   ok(Math.abs(skillMod({units:[]},{off:gy.id,side:'a'},{off:null,side:'d'},'charge')-1.25)<1e-9&&skillMod({units:[]},{off:null,side:'a'},{off:null,side:'d'},'charge')===1,'技能傷害修正');
   ok(Math.abs(stratChance({int:80,off:S.officers.find(o=>o.name==='司馬懿').id},{int:80},{})-0.55)<1e-9,'深謀計略 +20%');}
  {const src=S.cities['許昌'],t=S.cities['汝南'];t.owner='liubei';const offs=officersIn('許昌','cao').slice(0,2);src.troops=30000;const B=setupBattle('cao',src,t,offs,8000);initMap(B);B.wx='wind';
   const fk=Object.keys(B.T).find(k=>B.T[k]==='forest');const d=alive(B,'d')[0];d.pos=pk(fk);const a=alive(B,'a')[0];a.pos=nbrs(...pk(fk)).map(p=>hk(...p)).find(k=>B.T[k]!=='mount'&&B.T[k]!=='wall')?pk(nbrs(...pk(fk)).map(p=>hk(...p)).find(k=>!['mount','wall','gate','core','city'].includes(B.T[k])&&!unitAt(B,...pk(k)))):a.pos;
   ok(!hiddenAt(B,d),'相鄰有敵時不算伏兵');a.pos=[0,0];ok(hiddenAt(B,d)&&!visibleFoes(B,'a').includes(d),'林中無敵相鄰即為伏兵');
   const R=Math.random;Math.random=()=>0;const t0=d.troops;const r=setFire(B,a,fk);Math.random=R;ok(r.ok&&d.troops<t0&&B.fire[fk]===3,'火計燒到林中敵軍');
   Math.random=()=>0;fireTick(B);Math.random=R;ok(Object.keys(B.fire).length>=2,'大風應延燒');B.wx='rain';fireTick(B);ok(Object.keys(B.fire).length===0,'雨天熄火');
   B.day=12;B.morale.d=60;siegeTick(B);ok(B.morale.d===58&&B.siegeWarn===1,'圍城糧盡');B.over=true;finishBattle(B);}
  {const f='cao';const P=polOf(f);const c=S.cities[lordOf(f).city];c.gold=1000;P.lock=0;ok(setPolicy(f,'econ','tuntian')&&c.gold===500&&P.lock===S.turn+6&&hasPol(f,'tuntian'),'頒行政策');ok(!setPolicy(f,'econ','junshu'),'鎖定期不可更換');P.lock=0;setPolicy(f,'mil','guangzheng',true);ok(maxRecruit({owner:f,gold:100000,pop:900000})===7500,'廣徵上限');aiPolicy('yuan');ok(PSLOTS.every(s=>polOf('yuan')[s]),'電腦自動選政策');}
  {const lb=S.officers.find(o=>o.name==='劉備'),gy=S.officers.find(o=>o.name==='關羽'),lm=S.officers.find(o=>o.name==='呂蒙');ok(bonded(lb,gy)==='義兄弟'&&feud(gy,lm)&&!bonded(lb,lm),'關係資料');
   const sp=lb.fac;lb.fac='liubei';gy.fac='liubei';S.factions.liubei.lord=lb.id;S.factions.liubei.alive=true;gy.loy=50;monthlyRelations();ok(gy.loy===100&&bondLocked(gy),'義兄弟忠誠鎖定');
   lm.fac='liubei';lm.loy=90;monthlyRelations();ok(lm.loy<=65,'同營仇敵忠誠封頂，實際 '+lm.loy);ok(bondBonus(S.officers.find(o=>o.name==='張飛'),'liubei')===0.3,'羈絆登用加成');}
  {try{localStorage.removeItem('qunxiong-ach');}catch(e){}unlockAch('first_win');ok(achGet().first_win&&!achGet().legend,'成就解鎖');ok((()=>{try{sfx('win');sfx('attack');return true;}catch(e){return false;}})(),'音效不拋錯');
   S.stats={};stat('exec');stat('exec');ok(S.stats.exec===2,'統計');S.evq=[];log('測試攻陷之一','good');log('測試攻陷之二','bad');monthlySummary(dateStr());ok(S.evq.length===1&&/本月大事/.test(S.evq[0].title),'每月摘要');S.evq=[];}
  // 十三、年表、測驗、地理、水戰、AI 策略、繼承、熱座、音樂、引導
  {ok(TIMELINE.length>=30&&TIMELINE.every(r=>r[0]&&r[1]&&r[2]),'年表資料');ok(Object.keys(GEO).length===CITY_DATA.length&&CITY_DATA.every(c=>GEO[c[0]]),'每座城都有地理說明');ok(Object.keys(QUOTES).length>=40,'史料原文');
   ok(QUIZ.every(q=>q[1].length===4&&q[2]>=0&&q[2]<4)&&QUIZ.filter(q=>q[3]).every(q=>HIST.some(h=>h.id===q[3])||['sunce','lianhuan','sangu','chibi'].includes(q[3])),'題庫對應事件');
   S.evDone={wuchao:1};ok(quizPool().length>=QUIZ.filter(q=>!q[3]).length+2,'題庫依事件開放');S.evq=[];quizEvent('wuchao');ok(S.evq.length===1&&S.evq[0].choices.length===4,'事件問答');S.evq=[];
   ok(isNaval('柴桑','建業')&&!isNaval('許昌','宛'),'水路判定');const src=S.cities['柴桑'],t=S.cities['建業'];src.owner='sun';t.owner='cao';src.troops=30000;const offs=officersIn('柴桑','sun').slice(0,2)||[];
   if(offs.length){const B=setupBattle('sun',src,t,offs,8000);ok(B.naval===true,'水戰旗標');initMap(B);const water=Object.values(B.T).filter(x=>x==='river').length;ok(water>MW*MH*0.5,'水戰地圖大半是水面 '+water);ok(navalCost(B,'river')===1&&navalDef(B,'river')===1,'船行水上');ok(navalMod({naval:true,src:'薊',f:'yuan'},{side:'a'},{side:'d'},'charge')===0.8&&navalMod({naval:true,src:'柴桑',f:'sun'},{side:'a'},{side:'d'},'charge')===1,'北方兵暈船');B.over=true;finishBattle(B);}
   ok(typeof hegemon()!=='undefined'&&aiStrategyMod('yuan',{name:'鄴',troops:50000},S.cities['濮陽'])>0,'AI 策略修正');
   const F=S.factions.cao;const c1=S.officers.find(o=>o.name==='曹丕'),c2=S.officers.find(o=>o.name==='曹植');if(c1&&c2){c1.fac='cao';c2.fac='cao';c1.city=lordOf('cao').city;c2.city=c1.city;S.evq=[];succession(F,[c1,c2]);ok(S.evq.length===1&&S.evq[0].choices.length>=2,'玩家繼承人選擇');S.evq=[];}
   S.hot=['cao','yuan'];S.hotDone={};ok(isHuman('yuan')&&!isHuman('sun'),'熱座人類判定');const p0=S.player;const r=hotEndTurn();ok(r===true&&S.player==='yuan'&&S.hotDone.cao===true,'熱座換人');closeModal();S.player=p0;S.hot=null;S.hotDone={};
   ok(typeof musicTick==='function'&&TUT.length>=5&&TUT.every(x=>typeof x.when==='function'),'音樂與引導定義');try{localStorage.setItem('qunxiong-tut','{}');}catch(e){}S.turn=0;ui.sel=null;tutRender();ok(!!document.querySelector('#tut')&&!document.querySelector('#tut').hidden,'引導應顯示');tutSkip();ok(document.querySelector('#tut').hidden,'跳過後隱藏');
   ok(typeof reportBug==='function'&&REPO_URL.includes('github.com')&&VERSION,'回報與版本');}
  ok(traitText('shixie').length===2&&isOuter('wa')&&!isOuter('cao'),'特性文字');
  return res.join('\\n');
 })()`);
 console.log(out);
 // 四、四個方向各打一場完整的地圖戰（委任），確認流程不出錯
 for(const dir of ['W','E','S','N']){
  const r=w.eval(`(()=>{for(const a in ADJ)for(const b of ADJ[a]){const s=S.cities[a],t=S.cities[b];if(!s.owner||!t.owner||s.owner===t.owner)continue;const offs=officersIn(a,s.owner).slice(0,3);if(!offs.length)continue;if(attackDir({src:a,city:b})!=='${dir}')continue;
   s.troops=40000;const B=setupBattle(s.owner,s,t,offs,Math.min(30000,offs.reduce((x,o)=>x+capOf(o),0)));initMap(B);FX.mode='off';
   let g=0;while(!B.over&&g++<40){B.loss={a:0,d:0};for(const sd of ['a','d']){beginPhase(B,sd);for(const u of alive(B,sd)){if(B.over||u.dead||u.done)continue;const p=aiPlan(B,u);u.pos=pk(p.to);if(checkMap(B))break;mapAct(B,u,p.cmd,p.tid,{});}endPhase(B,sd);if(B.over)break;}if(!B.over)endDay(B);}
   syncWall(B);finishBattle(B);return '${dir} '+a+'→'+b+' 第'+B.day+'日 '+(B.win?'城陷':'守住')+(B.over?'':' 未結束');}return '${dir} 無可測道路';})()`);
  console.log(r);
 }
 await new Promise(r=>setTimeout(r,50));
 console.log(errs.length?'ERR '+errs.join('；'):'戰鬥測試完成，無執行期錯誤');
 if(errs.length||/FAIL|未結束/.test(out))process.exitCode=1;
})();
