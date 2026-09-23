/* ---------- 歷史事件（資料驅動）：每則附「志／演」說明，玩家可照史實或改變歷史 ---------- */
/* HIST 每則：id、when(D) 回傳情境物件或 null、run(ctx)。只觸發一次（S.evDone[id]）。文字用 hz（志）、hy（演）兩段 */
const hz=t=>`<p class="evt"><b class="src">志</b>${t}</p>`,hy=t=>`<p class="evt"><b class="src y">演</b>${t}</p>`;
const byName=n=>{const o=offByName(n);return o&&!['gone','unborn'].includes(o.fac)?o:null;};
const lordIs=n=>{const o=byName(n);return o&&isLord(o)?o:null;};
const holds=(f,...cs)=>cs.every(c=>S.cities[c]&&S.cities[c].owner===f);
const inFac=(n,f)=>{const o=byName(n);return o&&o.fac===f?o:null;};
const loyAll=(f,v)=>S.officers.filter(o=>o.fac===f&&!isLord(o)).forEach(o=>o.loy=clamp((o.loy||70)+v,0,100));
const kill=(o,why)=>{if(!o)return;const f=o.fac;o.fac='gone';o.city=null;if(why)log(why,f===S.player?'bad':'');};
const pev=(f,title,html,choices)=>{if(f===S.player)pushEvent(title,html,choices);};
const HIST=[
 {id:'qiandu',when:()=>{const d=lordIs('董卓');return d&&S.year>=190&&holds(d.fac,'洛陽','長安')&&Object.values(S.factions).filter(x=>x.alive&&x.id!==d.fac&&borders(x.id,d.fac)).length>=2?{f:d.fac,d}:null;},
  run:({f,d})=>{const go=()=>{const c=S.cities['洛陽'];c.pop=Math.round(c.pop*0.5);c.gold=Math.round(c.gold*0.3);c.def=Math.round(c.def*0.5);c.ppl=20;const la=S.cities['長安'];la.gold+=1500;la.troops+=3000;S.officers.filter(o=>o.fac===f&&o.city==='洛陽').forEach(o=>o.city='長安');log('董卓焚燒洛陽宮室，挾天子遷都長安，百萬百姓流離道路',f===S.player?'':'bad');};
   const t=hz('初平元年（190），關東諸侯起兵討董。董卓焚洛陽宮廟、發掘陵墓，驅徙數百萬人西遷長安，「二百里內無復孑遺」。')+hy('《演義》寫董卓聽李儒之計遷都，曹操孤軍追擊，在滎陽被徐榮伏擊大敗。');
   if(f===S.player)pushEvent('遷都長安',t+'<p>關東聯軍逼近，李儒勸遷都長安以避其鋒。</p>',[{label:'焚洛陽，遷長安',primary:true,fn:go},{label:'固守洛陽',fn:()=>{loyAll(f,-5);log('董卓不從李儒之言，固守洛陽，軍心浮動');}}]);else go();}},
 {id:'tuxu',when:()=>{const c=lordIs('曹操'),t=lordIs('陶謙');return c&&t&&S.year>=193&&S.year<=195&&borders(c.fac,t.fac)?{f:c.fac,tf:t.fac}:null;},
  run:({f,tf})=>{const t=hz('初平四年（193），曹操之父曹嵩在徐州境內被陶謙部將所殺。曹操興兵報仇，攻拔十餘城，「所過多所殘戮」，泗水為之不流。')+hy('《演義》寫張闓劫殺曹嵩，曹操誓言「盡殺徐州百姓以雪父仇」，孔融、劉備前來相救。');
   const slaughter=()=>{citiesOf(tf).forEach(c=>{c.pop=Math.round(c.pop*0.6);c.ppl=Math.max(0,(c.ppl??60)-30);c.troops=Math.round(c.troops*0.7);});const L=lordOf(f);L.cha=Math.max(1,L.cha-3);S.officers.filter(o=>o.fac===tf).forEach(o=>o.loy=Math.min(100,o.loy+10));log('曹操屠戮徐州，泗水為之不流，徐州軍民同仇敵愾',f===S.player?'':'bad');};
   if(f===S.player)pushEvent('曹嵩遇害',t+'<p>父仇不共戴天。要不要血洗徐州？</p>',[{label:'屠城雪恨（敵城人口、兵力大減，魅力 −3）',fn:slaughter},{label:'克制怒火，只取城池',primary:true,fn:()=>{loyAll(f,3);log('曹操強忍悲憤，約束部曲，士人稱其寬仁','good');}}]);
   else{slaughter();if(tf===S.player)pushEvent('曹操屠徐州',t);}}},
 {id:'shexi',when:()=>{const lb=lordIs('呂布'),lbei=lordIs('劉備'),ys=lordIs('袁術');return lb&&lbei&&ys&&S.year>=196&&borders(lb.fac,lbei.fac)&&borders(ys.fac,lbei.fac)?{lb:lb.fac,lbei:lbei.fac,ys:ys.fac}:null;},
  run:({lb,lbei,ys})=>{const r=rel(lb,lbei);r.truce=Math.max(r.truce,S.turn+12);r.trust=clamp(r.trust+20,0,100);adjTrust(lb,ys,-15);
   const t=hz('建安元年（196），袁術遣紀靈率三萬人攻劉備。呂布置酒宴請雙方，在營門立戟，言若射中小支則兩家罷兵，一箭中的，紀靈遂退。')+hy('《演義》第十六回「呂奉先射戟轅門」。');
   log('呂布轅門射戟，為劉備解圍，兩家約定停戰');[lb,lbei,ys].forEach(f=>pev(f,'轅門射戟',t));}},
 {id:'wuchao',when:()=>{const c=lordIs('曹操'),y=lordIs('袁紹');return c&&y&&S.year>=200&&borders(c.fac,y.fac)&&!friendly(c.fac,y.fac)?{f:c.fac,y:y.fac}:null;},
  run:({f,y})=>{const xy=inFac('許攸',y);const t=hz('建安五年（200），袁紹謀士許攸投曹，密告烏巢屯糧所在。曹操親率五千步騎夜襲，焚其糧草，張郃、高覽陣前降曹，袁軍大潰。')+hy('《演義》寫許攸因家人犯法被審配收押，怒而投曹；曹操跣足出迎。');
   const raid=()=>{if(xy){xy.fac=f;xy.city=lordOf(f).city;xy.loy=70;}const big=citiesOf(y).sort((a,b)=>b.troops-a.troops)[0];if(big){big.food=Math.round(big.food*0.3);big.troops=Math.round(big.troops*0.7);}['張郃','高覽'].forEach(n=>{const o=inFac(n,y);if(o&&Math.random()<0.6){o.fac=f;o.city=lordOf(f).city;o.loy=70;log(`${n}陣前降曹`);}});log('曹操夜襲烏巢，火燒袁軍糧草，河北軍心大亂',f===S.player?'good':y===S.player?'bad':'');};
   if(f===S.player)pushEvent('許攸來投',t+'<p>許攸夜奔而來，獻策夜襲烏巢。此計凶險，但一旦得手可斷袁軍糧道。</p>',[{label:'親率精兵夜襲',primary:true,fn:()=>{if(Math.random()<0.75)raid();else{const c=lordOf(f);const h=S.cities[c.city];h.troops=Math.round(h.troops*0.85);log('夜襲烏巢失利，折兵而回','bad');}}},{label:'疑其詐降，不用',fn:()=>{log('曹操不信許攸，坐失良機');}}]);
   else{raid();pev(y,'烏巢被襲',t);}}},
 {id:'rushu',when:()=>{const lbei=lordIs('劉備'),lz=lordIs('劉璋');return lbei&&lz&&S.year>=211&&(holds(lbei.fac,'江陵')||holds(lbei.fac,'襄陽'))&&byName('張松')&&byName('張松').fac===lz.fac?{f:lbei.fac,z:lz.fac}:null;},
  run:({f,z})=>{const zs=inFac('張松',z),fz=inFac('法正',z);const t=hz('建安十六年（211），劉璋畏張魯、曹操，聽張松之言迎劉備入蜀。張松暗獻益州地圖，法正、孟達為內應。次年事洩，張松被斬，劉備遂舉兵取蜀。')+hy('《演義》寫張松先往許都獻圖，遭曹操輕慢，轉獻劉備。');
   const go=()=>{citiesOf(z).forEach(c=>S.intel[c.name]=S.turn+24);if(fz){fz.fac=f;fz.city=lordOf(f).city;fz.loy=90;log('法正暗通劉備，獻取蜀之策','good');}if(zs)kill(zs,'張松獻圖事洩，被劉璋處斬');adjTrust(f,z,-40);};
   if(f===S.player)pushEvent('張松獻圖',t+'<p>張松暗中送來益州地圖，法正願為內應。</p>',[{label:'收下地圖，圖謀益州',primary:true,fn:go},{label:'不取同宗基業',fn:()=>{loyAll(f,2);log('劉備不忍圖同宗，眾將敬其仁義');}}]);
   else{go();pev(z,'張松獻圖',t);}}},
 {id:'shuiyan',when:()=>{const g=byName('關羽');return g&&S.year>=219&&g.fac&&S.factions[g.fac]&&lordIs('劉備')&&g.fac===lordIs('劉備').fac&&holds(g.fac,'江陵')&&['襄陽','宛'].some(c=>S.cities[c].owner&&S.cities[c].owner!==g.fac&&inFac('于禁',S.cities[c].owner))?{f:g.fac,g}:null;},
  run:({f,g})=>{const c=['襄陽','宛'].find(c=>inFac('于禁',S.cities[c].owner));const cf=S.cities[c].owner;const yj=inFac('于禁',cf),pd=inFac('龐德',cf);
   S.cities[c].troops=Math.round(S.cities[c].troops*0.5);if(yj){yj.fac=f;yj.city='江陵';yj.loy=40;}if(pd)kill(pd,'龐德被擒，罵不絕口而死');g.merit=(g.merit||0)+300;
   const t=hz('建安二十四年（219）秋，漢水暴溢，關羽乘船攻于禁七軍，于禁投降，龐德被斬，關羽「威震華夏」，曹操一度議遷都以避其鋒。')+hy('《演義》第七十四回「關雲長水淹七軍」，龐德抬棺出戰。');
   log(`關羽水淹七軍，于禁投降，${c}守軍折損過半`,f===S.player?'good':cf===S.player?'bad':'');[f,cf].forEach(x=>pev(x,'水淹七軍',t));}},
 {id:'baiyi',when:()=>{const s=lordIs('孫權'),g=byName('關羽');return s&&g&&S.year>=219&&g.fac!==s.fac&&g.city==='江陵'&&S.cities['江陵'].owner===g.fac&&holds(s.fac,'柴桑')&&!rel(s.fac,g.fac).ally?{s:s.fac,f:g.fac,g}:null;},
  run:({s,f,g})=>{const t=hz('建安二十四年（219），呂蒙稱病返建業，陸遜代之，關羽鬆懈北上。呂蒙以白衣扮商人溯江而上，糜芳、士仁不戰而降，關羽敗走麥城，父子被擒殺。荊州自此歸吳。')+hy('《演義》寫呂蒙襲荊州後被關羽魂魄索命，七竅流血而死。');
   const strike=()=>{const jl=S.cities['江陵'];const defs=officersIn('江陵',f);jl.owner=s;jl.troops=Math.round(jl.troops*0.6);defs.forEach(o=>{if(o.name==='關羽'||o.name==='關平')kill(o,`${o.name}敗走麥城，被擒遇害`);else if(o.name==='糜芳'||o.name==='士仁'){o.fac=s;o.loy=50;}else{const h=citiesOf(f)[0];if(h)o.city=h.name;else{o.fac=null;o.found=false;}}});const r=rel(s,f);r.ally=false;r.truce=0;r.trust=10;log('呂蒙白衣渡江，襲取江陵，關羽敗亡',s===S.player?'good':f===S.player?'bad':'');checkFactions();};
   if(s===S.player)pushEvent('白衣渡江',t+'<p>呂蒙獻計：關羽北上，江陵空虛，可扮作商旅溯江偷襲。</p>',[{label:'依計偷襲江陵',primary:true,fn:strike},{label:'守盟不動',fn:()=>{adjTrust(s,f,15);log('孫權守孫劉之盟，不襲荊州');}}]);
   else if(f===S.player)pushEvent('荊州告急',t+'<p>探報東吳水軍異動，江陵守備空虛。</p>',[{label:'速令關羽回防（江陵守軍 +5000，士仁糜芳忠誠回升）',primary:true,fn:()=>{S.cities['江陵'].troops+=5000;['糜芳','士仁'].forEach(n=>{const o=inFac(n,f);if(o)o.loy=90;});log('關羽回師江陵，東吳見有備而退','good');}},{label:'不予理會',fn:strike}]);
   else strike();}},
 {id:'yiling',when:()=>{const lb=lordIs('劉備'),s=lordIs('孫權');return lb&&s&&S.year>=222&&holds(s.fac,'江陵')&&(holds(lb.fac,'永安')||holds(lb.fac,'江州'))&&!friendly(lb.fac,s.fac)?{f:lb.fac,s:s.fac,lb}:null;},
  run:({f,s,lb})=>{const t=hz('章武二年（222），劉備為報關羽之仇東征，連營七百里。陸遜堅守半年，趁夏火攻，蜀軍大潰，劉備退守白帝城，次年病逝。')+hy('《演義》寫「火燒連營七百里」，趙雲救駕，諸葛亮八陣圖困陸遜。');
   const fight=()=>{const base=citiesOf(f).sort((a,b)=>b.troops-a.troops)[0];base.troops=Math.round(base.troops*0.5);['馮習','張南','傅肜','沙摩柯'].forEach(n=>{const o=inFac(n,f);if(o&&Math.random()<0.7)kill(o,`${n}戰死於夷陵`);});const lx=inFac('陸遜',s);if(lx)lx.merit=(lx.merit||0)+300;lb.death=Math.min(lb.death,S.year+1);S.evDone.yilingLost=1;log('劉備夷陵大敗，退守白帝城',f===S.player?'bad':s===S.player?'good':'');};
   if(f===S.player)pushEvent('東征伐吳',t+'<p>群臣力諫，趙雲言「國賊是曹操，非孫權也」。是否興兵伐吳？</p>',[{label:'為弟報仇，東征',fn:()=>{if(Math.random()<0.7)fight();else{S.cities['江陵'].troops=Math.round(S.cities['江陵'].troops*0.6);log('蜀軍東征小勝，吳軍退守江陵','good');}}},{label:'納趙雲之諫，罷兵',primary:true,fn:()=>{loyAll(f,2);log('劉備罷東征之議，專力北伐');}}]);
   else{fight();pev(s,'夷陵之戰',t);}}},
 {id:'baidi',when:()=>{const lb=lordIs('劉備');return lb&&S.evDone.yilingLost&&S.year>=223&&inFac('諸葛亮',lb.fac)?{f:lb.fac,lb}:null;},
  run:({f,lb})=>{const zg=inFac('諸葛亮',f);zg.loy=100;zg.merit=(zg.merit||0)+500;const ls=inFac('劉禪',f);loyAll(f,5);
   const t=hz('章武三年（223），劉備病篤，召諸葛亮於永安託孤：「君才十倍曹丕，必能安國。若嗣子可輔，輔之；如其不才，君可自取。」諸葛亮涕泣許以「竭股肱之力，效忠貞之節」。')+hy('《演義》第八十五回「劉先主遺詔託孤兒」。');
   kill(lb,'劉備病逝白帝城');checkFactions();pev(f,'白帝託孤',t);if(f!==S.player)log('劉備白帝託孤，諸葛亮輔佐劉禪');}},
 {id:'qiqin',when:()=>{const zg=byName('諸葛亮');return zg&&zg.fac&&S.factions[zg.fac]&&S.year>=225&&S.factions.nanman&&S.factions.nanman.alive&&(holds(zg.fac,'江州')||holds(zg.fac,'成都'))&&borders(zg.fac,'nanman')&&!friendly(zg.fac,'nanman')?{f:zg.fac}:null;},
  run:({f})=>{const t=hz('建興三年（225），諸葛亮南征，用馬謖「攻心為上」之策，七擒七縱孟獲，孟獲曰「公，天威也，南人不復反矣」。南中平定，蜀得其金、銀、丹、漆、耕牛、戰馬以充軍資。')+hy('《演義》以七回篇幅寫七擒孟獲，藤甲兵、木鹿大王、祝融夫人皆為小說增飾。');
   const heart=()=>{const r=rel(f,'nanman');r.ally=true;r.trust=100;const mh=byName('孟獲');if(mh)mh.loy=100;citiesOf(f).forEach(c=>{c.gold+=300;});const cap=citiesOf(f)[0];if(cap){addGear(cap,'horse',3000);}log('諸葛亮七擒七縱，孟獲心服，南中歸附，獻金帛戰馬',f===S.player?'good':'');};
   if(f===S.player)pushEvent('南征之策',t+'<p>馬謖進言：「攻心為上，攻城為下。」</p>',[{label:'攻心為上（南蠻永結同盟，得軍資）',primary:true,fn:heart},{label:'以力征服（照常開戰）',fn:()=>{log('諸葛亮決意以兵威平定南中');}}]);else heart();}},
 {id:'jieting',when:()=>{const ms=byName('馬謖'),zg=byName('諸葛亮');return ms&&zg&&ms.fac&&ms.fac===zg.fac&&S.factions[ms.fac]&&S.year>=228&&['天水','長安','漢中'].some(c=>S.cities[c].owner===ms.fac)?{f:ms.fac,ms}:null;},
  run:({f,ms})=>{const t=hz('建興六年（228），諸葛亮首次北伐，違眾拔馬謖守街亭。馬謖捨水上山，被張郃斷汲道，大敗。諸葛亮揮淚斬之，並自貶三等。')+hy('《演義》第九十六回「孔明揮淚斬馬謖」，隨後有空城計。');
   const c=['漢中','天水','長安'].find(x=>S.cities[x].owner===f);S.cities[c].troops=Math.round(S.cities[c].troops*0.7);
   if(f===S.player)pushEvent('街亭之失',t+`<p>馬謖失守街亭，${c}損兵三成。依軍法當斬。</p>`,[{label:'揮淚斬馬謖（全軍忠誠 +5）',primary:true,fn:()=>{kill(ms,'諸葛亮揮淚斬馬謖，三軍肅然');loyAll(f,5);}},{label:'念其才而赦免（忠誠 −3）',fn:()=>{ms.loy=90;loyAll(f,-3);log('赦免馬謖，軍法不行，眾將側目');}}]);
   else{kill(ms,'馬謖失街亭，諸葛亮揮淚斬之');}}},
 {id:'wuzhang',when:()=>{const zg=byName('諸葛亮');return zg&&zg.fac&&S.factions[zg.fac]&&S.year>=234?{f:zg.fac,zg}:null;},
  run:({f,zg})=>{const wy=inFac('魏延',f),yy=inFac('楊儀',f),jw=inFac('姜維',f);const t=hz('建興十二年（234）秋，諸葛亮病逝五丈原，年五十四，臨終安排楊儀、姜維退軍，魏延斷後。魏延不服，燒絕棧道，兵敗被馬岱所斬。司馬懿見蜀軍陣勢歎「天下奇才也」。')+hy('《演義》寫諸葛亮禳星續命被魏延撞滅主燈，「死諸葛嚇走生仲達」。');
   const rest=(keepWy)=>{kill(zg,'諸葛亮病逝五丈原，蜀漢痛失丞相');if(jw){jw.loy=100;jw.merit=(jw.merit||0)+300;}if(keepWy){if(yy)kill(yy,'楊儀爭權失敗，被廢自殺');if(wy)wy.loy=100;}else{if(wy)kill(wy,'魏延與楊儀相爭，兵敗被馬岱所斬');}loyAll(f,-5);checkFactions();};
   if(f===S.player)pushEvent('五丈原',t+'<p>丞相病危，魏延與楊儀勢同水火。身後兵權該交給誰？</p>',[{label:'依丞相遺命：楊儀退軍，魏延不從則斬',primary:true,fn:()=>rest(false)},{label:'讓魏延繼掌兵權',fn:()=>rest(true)}]);
   else{rest(false);}}},
 {id:'gaopingling',when:()=>{const cs=byName('曹爽'),sm=byName('司馬懿');return cs&&sm&&cs.fac&&cs.fac===sm.fac&&S.factions[cs.fac]&&S.year>=249?{f:cs.fac,cs,sm}:null;},
  run:({f,cs,sm})=>{const t=hz('正始十年（249），曹爽隨帝謁高平陵，司馬懿趁機閉城門、奪武庫，以「免官不失富貴」誘曹爽交出兵權，隨即誅其三族。曹魏大權自此歸司馬氏。')+hy('《演義》第一百七回「魏主政歸司馬氏」。');
   const coup=()=>{kill(cs,'曹爽交出兵權後被司馬懿夷三族');['何晏','桓範','丁儀'].forEach(n=>{const o=inFac(n,f);if(o)kill(o,`${n}為曹爽黨羽，同遭誅殺`);});sm.loy=100;sm.merit=(sm.merit||0)+800;['司馬師','司馬昭'].forEach(n=>{const o=inFac(n,f);if(o){o.loy=100;o.merit=(o.merit||0)+300;}});const hb=inFac('夏侯霸',f);const lb=Object.values(S.factions).find(x=>x.alive&&x.id!=='cao'&&['劉禪','劉備'].includes(S.officers[x.lord].name));if(hb&&lb){hb.fac=lb.id;hb.city=lordOf(lb.id).city;hb.loy=80;log('夏侯霸懼司馬氏，投奔蜀漢');}log('高平陵之變，司馬懿誅曹爽，魏國實權歸司馬氏',f===S.player?'bad':'');};
   if(f===S.player)pushEvent('高平陵之變',t+'<p>司馬懿稱病多時，曹爽專權。有人密報司馬懿正暗中部署。</p>',[{label:'先發制人，罷黜司馬懿',fn:()=>{if(Math.random()<0.5){kill(sm,'司馬懿被罷黜賜死');['司馬師','司馬昭'].forEach(n=>{const o=inFac(n,f);if(o)kill(o,`${n}連坐`);});log('曹爽搶先一步，司馬氏覆滅','good');}else{coup();}}},{label:'不以為意',primary:true,fn:coup}]);
   else coup();}},
 {id:'yinping',when:()=>{const da=byName('鄧艾');const lz=lordIs('劉禪');return da&&da.fac&&S.factions[da.fac]&&lz&&S.year>=263&&holds(da.fac,'漢中')&&holds(lz.fac,'成都')&&da.fac!==lz.fac?{f:da.fac,z:lz.fac,da}:null;},
  run:({f,z,da})=>{const t=hz('景元四年（263），鍾會大軍為姜維所阻於劍閣，鄧艾率萬餘人自陰平「鑿山通道，造作橋閣」七百餘里，於綿竹擊斬諸葛瞻父子，劉禪出降，蜀漢亡。')+hy('《演義》第一百十七回「鄧士載偷度陰平」。');
   const src=S.cities['漢中'],tgt=S.cities['成都'];const offs=[da,inFac('鍾會',f),inFac('鄧忠',f)].filter(Boolean).slice(0,3);const n=Math.min(src.troops-1000,offs.reduce((a,o)=>a+capOf(o),0),20000);if(n<3000)return;
   src.troops-=n;da.city='漢中';offs.forEach(o=>o.city='漢中');log('鄧艾偷渡陰平，兵臨成都城下',z===S.player?'bad':f===S.player?'good':'');[f,z].forEach(x=>pev(x,'偷渡陰平',t));
   if(z===S.player&&!SIM.on){S.incoming.push({f,src:'漢中',t:'成都',offs:offs.map(o=>o.id),n});}else{const B=setupBattle(f,src,tgt,offs,n);autoResolve(B);finishBattle(B);}}},
 {id:'huatuo',when:()=>{const c=lordIs('曹操'),h=byName('華佗');return c&&h&&S.year>=208&&(h.fac===c.fac||(h.fac===null&&h.found&&citiesOf(c.fac).some(x=>x.name===h.city)))?{f:c.fac,h,c}:null;},
  run:({f,h,c})=>{const t=hz('華佗醫術高明，曹操苦於頭風，召其治療。華佗託辭妻病久不歸，曹操怒而下獄殺之，荀彧求情不允。曹沖病重時曹操歎「吾悔殺華佗」。')+hy('《演義》寫華佗欲開顱取「風涎」，曹操疑其欲害己而殺之。');
   if(f===S.player)pushEvent('神醫華佗',t+'<p>華佗屢召不至。</p>',[{label:'怒而殺之',fn:()=>kill(h,'華佗被曹操下獄殺害')},{label:'寬容禮遇（君主壽命 +5 年）',primary:true,fn:()=>{c.death+=5;h.fac=f;h.city=c.city;h.loy=80;log('曹操禮遇華佗，頭風得治','good');}}]);
   else kill(h,'華佗屢召不至，被曹操下獄殺害');}},
 {id:'yangxiu',when:()=>{const c=lordIs('曹操'),y=byName('楊修');return c&&y&&y.fac===c.fac&&S.year>=219?{f:c.fac,y}:null;},
  run:({f,y})=>{const t=hz('建安二十四年（219），楊修因「前後漏泄言教，交關諸侯」被曹操處死，年四十五。其父楊彪憂憤，曹操以「老牛舐犢」問之。')+hy('《演義》寫「雞肋」口令事，楊修擅令收拾行裝，曹操以惑亂軍心斬之。');
   if(f===S.player)pushEvent('楊修之死',t+'<p>楊修屢猜中主公心思，又深涉曹植曹丕之爭。</p>',[{label:'以惑亂軍心斬之',fn:()=>{kill(y,'楊修被處斬');loyAll(f,-2);}},{label:'留用其才',primary:true,fn:()=>{y.loy=60;log('曹操容忍楊修，然心中不快');}}]);
   else kill(y,'楊修被曹操處斬');}},
 {id:'chanhan',when:()=>{const cp=lordIs('曹丕');return cp&&S.year>=220&&citiesOf(cp.fac).length>=12&&!S.factions[cp.fac].emperor?{f:cp.fac}:null;},
  run:({f})=>{const t=hz('延康元年（220）十月，曹丕受漢獻帝「禪讓」，即皇帝位，改元黃初，定都洛陽，東漢至此結束。獻帝封山陽公。')+hy('《演義》第八十回「曹丕廢帝篡炎劉」，華歆逼宮。');
   const go=()=>{S.factions[f].emperor=true;loyAll(f,10);Object.keys(S.factions).forEach(x=>{if(x!==f)adjTrust(f,x,-15);});log('曹丕受禪稱帝，國號魏，漢室告終',f===S.player?'good':'');checkAch&&checkAch();};
   if(f===S.player)pushEvent('受禪稱帝',t+'<p>華歆、王朗等率群臣勸進。</p>',[{label:'受禪即位（全軍忠誠 +10，諸侯友好 −15）',primary:true,fn:go},{label:'再三推辭',fn:()=>{log('曹丕辭讓，群臣再勸');S.evDone.chanhan=0;}}]);else go();}},
];
function runHistory(){
 S.evDone=S.evDone||{};
 for(const h of HIST){if(S.evDone[h.id])continue;let ctx=null;try{ctx=h.when(S.evDone);}catch(e){ctx=null;}if(!ctx)continue;S.evDone[h.id]=1;const n0=(S.evq||[]).length;try{h.run(ctx);}catch(e){console.error('歷史事件',h.id,e);}if((S.evq||[]).length>n0)quizEvent(h.id);}
}
