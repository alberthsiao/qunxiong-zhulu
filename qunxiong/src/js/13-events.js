/* ---------- 歷史事件 ---------- */
function offByName(n){return S.officers.find(o=>o.name===n);}
function pushEvent(title,text,choices){S.evq=S.evq||[];S.evq.push({title,text,choices:choices||null});}
function showEvents(done){const e=(S.evq||[]).shift();if(!e){done&&done();return;}
 modal(e.title,`<p class="evt">${e.text}</p>`,(e.choices||[{label:'確定',primary:true}]).map(c=>({label:c.label,primary:c.primary,fn:()=>{c.fn&&c.fn();render();showEvents(done);}})));}
function newFaction(id,name,L,cities,followers){
 const old=L.fac;S.factions[id]={id,name,color:FC[id]||'#6B2E6B',lord:L.id,alive:true,diff:'—',title:null};
 cities.forEach(n=>S.cities[n].owner=id);L.fac=id;L.loy=100;
 S.officers.filter(o=>o.fac===old&&followers.includes(o.name)&&cities.includes(o.city)).forEach(o=>{o.fac=id;o.loy=90;});
 S.officers.filter(o=>o.fac===old&&cities.includes(o.city)).forEach(o=>{const home=citiesOf(old)[0];if(home)o.city=home.name;});
}
function runEvents(){
 S.evDone=S.evDone||{};const D=S.evDone;
 const sc=offByName('孫策');
 if(!D.sunce&&sc&&isLord(sc)&&(S.year>200||(S.year===200&&S.month>=4))&&Math.random()<0.5){D.sunce=1;const f=sc.fac;sc.fac='gone';sc.city=null;checkFactions();
  const nx=S.factions[f].alive?S.officers[S.factions[f].lord].name:'';const txt=`孫策出獵時遭許貢門客伏擊，傷重不治${nx?`，臨終將江東託付給${nx}`:''}。`;log(txt,f===S.player?'bad':'');if(f===S.player)pushEvent('孫策遇刺',txt);}
 const dz=offByName('董卓'),lb=offByName('呂布');
 if(!D.lianhuan&&dz&&isLord(dz)&&S.year>=192&&lb&&lb.fac===dz.fac&&Math.random()<0.3){D.lianhuan=1;const f=dz.fac;dz.fac='gone';dz.city=null;
  let txt='司徒王允設下連環計，呂布為貂蟬手刃董卓。';const lc=S.cities[lb.city];
  if(citiesOf(f).length>=2&&lc&&lc.owner===f&&!S.factions.lubu){newFaction('lubu','呂布',lb,[lc.name],['高順','陳宮','張遼']);txt+=`呂布隨即據${lc.name}自立。`;}
  else{lb.fac=null;lb.found=true;txt+='呂布事後出奔。';}
  checkFactions();log(txt);if(f===S.player||lb.fac===S.player)pushEvent('連環計',txt);}
 const zg=offByName('諸葛亮'),lbei=offByName('劉備');
 if(!D.sangu&&zg&&zg.fac===null&&lbei&&isLord(lbei)&&S.year>=203&&Math.random()<0.25){
  const f=lbei.fac;const near=citiesOf(f).find(c=>c.name===zg.city||within2(c.name).includes(zg.city));
  if(near){D.sangu=1;const join=()=>{zg.fac=f;zg.city=near.name;zg.loy=100;zg.found=true;log('諸葛亮感念劉備三顧之情，出山輔佐','good');};
   if(f===S.player)pushEvent('三顧茅廬',`聽聞臥龍諸葛亮隱居於${zg.city}一帶。要親自前往草廬，三顧相請嗎？`,[{label:'三顧茅廬',primary:true,fn:join},{label:'作罷',fn:()=>{D.sangu=0;}}]);else join();}}
 const gy=offByName('關羽');
 if(!D.qianli&&gy&&lbei&&isLord(lbei)&&!isLord(gy)&&S.factions[gy.fac]&&gy.fac!==lbei.fac&&Math.random()<0.3){
  const from=gy.fac,to=lbei.fac,dest=S.cities[lbei.city];D.qianli=1;
  const go=()=>{gy.fac=to;gy.city=dest.name;gy.loy=100;gy.done=true;log('關羽掛印封金，過五關斬六將，回到劉備身邊',to===S.player?'good':from===S.player?'bad':'');};
  if(from===S.player)pushEvent('千里走單騎',`關羽得知劉備身在${dest.name}，掛印封金，前來請辭。`,[{label:'成全其義，放行',primary:true,fn:()=>{go();S.officers.filter(o=>o.fac===S.player).forEach(o=>o.loy=Math.min(100,o.loy+3));log('主公成人之美，眾將敬服','good');}},{label:'強行挽留',fn:()=>{gy.loy=50;log('強留關羽，關羽鬱鬱寡歡','bad');}}]);
  else{go();if(to===S.player)pushEvent('千里走單騎',`關羽得知兄長下落，自${S.factions[from].name}軍中出走，千里來投！`);}}
}
function chibiCheck(B,f,d,t){
 S.evDone=S.evDone||{};if(S.evDone.chibi||!d||!S.factions[f]||!S.factions[d])return;
 const ln=S.officers[S.factions[f].lord].name,dn=S.officers[S.factions[d].lord].name;
 if(!['曹操','曹丕'].includes(ln)||!['孫權','劉備','孫策'].includes(dn)||!['江夏','柴桑','江陵','建業','吳'].includes(t.name)||![10,11,12,1].includes(S.month)||Math.random()>0.6)return;
 S.evDone.chibi=1;B.units.filter(u=>u.side==='a').forEach(u=>{u.troops=Math.round(u.troops*0.75);});B.morale.a=Math.max(20,B.morale.a-12);
 bl(B,'東南風起，火燒連環船！攻方損失慘重','day');log(`${t.name}：東南風起，${fname(f)}遭火攻，損失慘重`,d===S.player?'good':f===S.player?'bad':'');
 if(d===S.player||f===S.player)pushEvent('赤壁火攻',`隆冬時節，江上忽起東南風。${fname(d)}趁勢火攻，${fname(f)}戰船連環，一時烈焰沖天。`);
}
const ENDINGS={曹操:'魏武揮鞭，四海歸一。曹氏代漢，建立大魏。',曹丕:'曹丕受禪登基，四海一統，大魏國祚綿延。',劉備:'漢室復興，劉備重整河山，百姓終得安居。',劉禪:'後主承先帝遺志，漢室一統天下。',孫權:'江東之主揮師北上，一統天下，建立大吳。',孫策:'小霸王席捲天下，孫氏建立大吳。',孫堅:'江東猛虎平定四海，孫氏一統天下。',袁紹:'四世三公的袁氏統一天下，河北群英名留青史。',董卓:'董卓以兵威統一天下，然民怨沸騰，新朝前途未卜。',呂布:'天下無雙的呂布終成霸業，但這份霸業能維持多久？'};
function endingHTML(win){
 const F=S.factions[S.player],L=S.officers[F.lord],sc=SCENARIOS.find(x=>x.id===S.scn)||{year:S.year,title:''};
 const yrs=S.year-sc.year;const top=S.officers.filter(o=>o.fac===S.player&&!isLord(o)).sort((a,b)=>(b.merit||0)-(a.merit||0)).slice(0,5);
 if(win)return `<p class="evt">${ENDINGS[L.name]||`${L.name}平定群雄，開創新朝，天下重歸一統。`}</p><p class="hint">劇本：${sc.year} 年${sc.title}　歷時 ${yrs} 年　最終官位：${lordTitle(S.player)}　麾下武將 ${S.officers.filter(o=>o.fac===S.player).length} 人</p>${top.length?`<p>功臣：${top.map(o=>`${o.name}（${rankName(o)}）`).join('、')}</p>`:''}`;
 return `<p class="evt">${F.name}勢力於 ${S.year} 年 ${S.month} 月滅亡。群雄逐鹿，終究未能問鼎天下。</p><p class="hint">劇本：${sc.year} 年${sc.title}　堅持了 ${yrs} 年</p>`;
}
