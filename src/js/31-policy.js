/* ---------- 政策與民忠事件 ---------- */
/* 三個政策槽各選一項，互斥、有代價。S.policy[勢力]={econ,people,mil,lock}；更換花 500 金並鎖定六個月 */
const POLICY={
 econ:{n:'經濟',opts:{tuntian:{n:'屯田制',d:'軍隊就地耕作：秋收 +25%，商業收入 −10%',hz:'曹操採棗祗、韓浩之議行屯田，「軍國之饒，起於棗祗而成於峻」。'},junshu:{n:'均輸平準',d:'官營轉運貿易：商業收入 +25%，秋收 −10%',hz:'桑弘羊舊法，諸葛亮治蜀「務農殖穀，閉關息民」之餘亦重鹽鐵之利。'}}},
 people:{n:'人事',opts:{jiupin:{n:'九品中正',d:'以門第品評取士：搜索與登用成功率 +15%，民忠每月 −0.3',hz:'陳群所創，魏文帝時施行，後世流為「上品無寒門，下品無勢族」。'},weicai:{n:'唯才是舉',d:'不問出身：搜索與登用成功率 +8%，武將忠誠每月 +1',hz:'曹操三下求賢令：「唯才是舉，吾得而用之。」'},huimin:{n:'寬刑惠民',d:'減賦省刑：民忠每月 +1，商業收入 −10%',hz:'劉備入蜀後諸葛亮主張「威之以法」，而劉璋則以寬柔失之，兩者各有得失。'}}},
 mil:{n:'軍事',opts:{jingbing:{n:'精兵',d:'嚴加操練：各城訓練度每月 +2，徵兵費用 +30%',hz:'高順陷陣營七百人「每所攻擊無不破」，正是精兵之典範。'},guangzheng:{n:'廣徵',d:'擴大募兵：徵兵上限 +50%，新兵訓練度更低',hz:'袁紹「眾數十萬」而敗於官渡，兵多未必為福。'},shibing:{n:'世兵',d:'兵戶世襲：徵兵不減民忠，人口成長 −20%',hz:'曹魏行士家制度，兵戶世代為兵，家屬集中管理以防叛逃。'}}}};
const PSLOTS=['econ','people','mil'];
function polOf(f){S.policy=S.policy||{};return S.policy[f]||(S.policy[f]={econ:null,people:null,mil:null,lock:0});}
function hasPol(f,k){if(!f||!S.policy||!S.policy[f])return false;return PSLOTS.some(s=>S.policy[f][s]===k);}
function polText(f){const P=polOf(f);return PSLOTS.map(s=>P[s]?POLICY[s].opts[P[s]].n:'無').join('／');}
function setPolicy(f,slot,k,free){
 const P=polOf(f);if(P[slot]===k)return true;
 if(!free){const c=S.cities[lordOf(f).city];if(!c||c.gold<500||P.lock>S.turn)return false;c.gold-=500;P.lock=S.turn+6;}
 P[slot]=k;return true;
}
/* 電腦：依處境挑選，開局與每兩年重估 */
function aiPolicy(f){
 const P=polOf(f);const cs=citiesOf(f);if(!cs.length)return;
 const front=cs.filter(c=>isFront(c,f)).length/cs.length;
 const want={econ:cs.length>=4?'tuntian':'junshu',people:lordOf(f).cha>=85?'weicai':cs.some(c=>(c.ppl??60)<45)?'huimin':'jiupin',mil:front>0.5?'jingbing':cs.reduce((a,c)=>a+c.troops,0)<cs.length*6000?'guangzheng':'jingbing'};
 PSLOTS.forEach(s=>{if(!P[s])setPolicy(f,s,want[s],true);});
 if(S.turn%24===0)PSLOTS.forEach(s=>{if(P[s]!==want[s]&&Math.random()<0.5)setPolicy(f,s,want[s]);});
}
function openPolicy(){
 if(!S||!S.player)return;const f=S.player,P=polOf(f),c=S.cities[lordOf(f).city];
 const locked=P.lock>S.turn;
 let h=`<p class="hint">三項政策各選其一，互有代價。更換一項需 500 金（自君主所在城 ${c.name} 支出，現有 ${fmt(c.gold)}），並鎖定六個月。${locked?`目前鎖定中，還有 ${P.lock-S.turn} 個月。`:''}</p>`;
 PSLOTS.forEach(s=>{h+=`<h3>${POLICY[s].n}</h3><div class="polrow">`+Object.entries(POLICY[s].opts).map(([k,o])=>`<label class="pol ${P[s]===k?'on':''}"><input type="radio" name="pol-${s}" value="${k}" ${P[s]===k?'checked':''} ${locked?'disabled':''}><b>${o.n}</b><small>${o.d}</small><small class="itm">志：${o.hz}</small></label>`).join('')+`</div>`;});
 modal('政策',h,[{label:'頒行',primary:true,fn:()=>{let n=0;PSLOTS.forEach(s=>{const v=document.querySelector(`input[name="pol-${s}"]:checked`);if(v&&v.value!==P[s]){if(setPolicy(f,s,v.value))n++;}});if(n)log(`頒行新政：${polText(f)}`,'good');render();}},{label:'關閉'}]);
 $('#modal .dlg').classList.add('wide');
}
/* 民忠事件：玩家每月約一成機率遇到一件，需要抉擇 */
function civicEvent(){
 if(!S.player||SIM.on||Math.random()>=0.1)return;
 const cs=citiesOf(S.player);if(!cs.length)return;const c=pick(cs);
 const r=Math.random();
 if(r<0.3)pushEvent(`${c.name}豐年祭典`,`<p class="evt">${c.name}父老請求官府出資舉辦社祭，酬謝神明、與民同樂。</p>`+hz('漢代鄉里以春秋二社祭祀土地神，官府常出資助祭以收民心。'),[{label:'撥 200 金助祭（民忠 +8）',primary:true,fn:()=>{if(c.gold>=200){c.gold-=200;c.ppl=Math.min(100,(c.ppl??60)+8);log(`${c.name}社祭熱鬧，民心歸附`,'good');}else log(`${c.name}府庫不足，祭典作罷`,'bad');}},{label:'國用不足，婉拒',fn:()=>{c.ppl=Math.max(0,(c.ppl??60)-3);}}]);
 else if(r<0.55)pushEvent(`${c.name}疫病流行`,`<p class="evt">${c.name}城中疫病流行，百姓死者日眾。太守請求開倉發藥、隔離病患。</p>`+hz('建安二十二年大疫，建安七子中徐幹、陳琳、應瑒、劉楨同年病逝，曹植作《說疫氣》記其慘狀。'),[{label:'撥 500 糧救治（人口不損）',primary:true,fn:()=>{if(c.food>=500){c.food-=500;c.ppl=Math.min(100,(c.ppl??60)+4);log(`${c.name}疫情受控，百姓感念`,'good');}else{c.pop=Math.round(c.pop*0.95);log(`${c.name}糧不足以救疫，人口減少`,'bad');}}},{label:'聽天由命',fn:()=>{c.pop=Math.round(c.pop*0.93);c.ppl=Math.max(0,(c.ppl??60)-10);c.troops=Math.round(c.troops*0.95);log(`${c.name}疫病肆虐，人口、兵力受損`,'bad');}}]);
 else if(r<0.8)pushEvent(`流民湧入${c.name}`,`<p class="evt">鄰境戰亂，數萬流民扶老攜幼來到${c.name}城下。</p>`+hz('漢末「白骨露於野，千里無雞鳴」，流民依附強宗大族，成為屯田與部曲的主要來源。'),[{label:'開城收容（人口 +2 萬，民忠 −5，糧 −300）',primary:true,fn:()=>{c.pop=Math.min(c.popMax,c.pop+20000);c.ppl=Math.max(0,(c.ppl??60)-5);c.food=Math.max(0,c.food-300);log(`${c.name}收容流民，人口增加`,'good');}},{label:'閉門不納',fn:()=>{const L=lordOf(S.player);L.cha=Math.max(1,L.cha-1);log('流民轉往他處，士人以為不仁');}}]);
 else{const os=officersIn(c.name,S.player);if(!os.length)return;const o=pick(os);pushEvent(`名士講學`,`<p class="evt">一位名士途經${c.name}，開壇講學，${o.name}前往聽講。</p>`+hz('漢末經學大師鄭玄、盧植門下弟子數千，亂世之中講學不輟。'),[{label:`讓${o.name}求教（智力、政治經驗 +）`,primary:true,fn:()=>{gainExp(o,'int',30);gainExp(o,'pol',30);}}]);}
}
