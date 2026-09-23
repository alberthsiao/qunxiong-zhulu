/* ---------- 武將人際關係：義兄弟、親族、仇敵、婚姻 ---------- */
const BONDS=[
 ['義兄弟','劉備','關羽','張飛'],['主從','劉備','趙雲','諸葛亮'],['摯友','孫策','周瑜'],['摯友','周瑜','魯肅'],['摯友','曹操','郭嘉','荀彧'],['摯友','孫策','太史慈'],['師徒','諸葛亮','姜維'],['摯友','鍾會','鄧艾'],
 ['曹氏','曹操','曹仁','曹洪','曹純','曹丕','曹植','曹彰','曹真','曹休','曹昂','曹叡','曹爽','曹髦'],['夏侯氏','曹操','夏侯惇','夏侯淵','夏侯霸','夏侯尚','夏侯威','夏侯和','夏侯楙','夏侯恩','夏侯玄'],
 ['孫氏','孫堅','孫策','孫權','孫靜','孫賁','孫輔','孫河','孫翊','孫韶','孫桓','孫皎','孫瑜','孫尚香','孫登','孫亮','孫休','孫皓'],['司馬氏','司馬懿','司馬師','司馬昭','司馬孚','司馬朗','司馬望','司馬炎','張春華'],
 ['袁氏','袁紹','袁譚','袁熙','袁尚'],['馬氏','馬騰','馬超','馬岱','馬休','馬鐵'],['諸葛氏','諸葛亮','諸葛瞻','諸葛均','諸葛尚','黃月英'],['關氏','關羽','關平','關興','關索'],['張氏','張飛','張苞','張遵'],
 ['荀氏','荀彧','荀攸','荀諶','荀顗'],['陸氏','陸遜','陸抗','陸績','陸凱'],['士氏','士燮','士壹','士武','士徽','士匡'],['公孫氏','公孫瓚','公孫越','公孫範','公孫續'],['遼東公孫','公孫度','公孫康','公孫恭','公孫淵'],
 ['董氏','董卓','董旻','牛輔'],['劉表家','劉表','劉琦','劉琮','蔡瑁'],['劉璋家','劉焉','劉璋','劉循'],['張魯家','張魯','張衛'],['顧氏','顧雍','顧邵','顧譚'],['朱氏','朱然','朱績'],['呂氏','呂範','呂據'],['鍾氏','鍾繇','鍾會','鍾毓'],
 ['糜氏','糜竺','糜芳'],['蒯氏','蒯越','蒯良'],['辛氏','辛毗','辛評','辛憲英'],['丁氏','丁奉','丁封'],['朱氏（吳）','朱桓','朱異'],['張昭家','張昭','張承'],['諸葛瑾家','諸葛瑾','諸葛恪'],['步氏','步騭','步闡','步練師'],['夫妻','劉備','孫尚香'],['夫妻','周瑜','小喬'],['夫妻','孫策','大喬'],['夫妻','曹丕','甄氏'],['夫妻','趙昂','王異']];
const FEUDS=[['關羽','呂蒙'],['關羽','潘璋'],['關羽','糜芳'],['關羽','龐會'],['關平','龐會'],['關興','龐會'],['張飛','呂布'],['曹丕','張繡'],['曹操','張繡'],['袁紹','公孫瓚'],['孫堅','黃祖'],['孫策','黃祖'],['孫權','黃祖'],
 ['馬超','曹操'],['馬超','韓遂'],['馬超','楊阜'],['馬超','王異'],['魏延','楊儀'],['呂布','劉備'],['陳宮','曹操'],['孔融','曹操'],['禰衡','曹操'],['華佗','曹操'],['諸葛誕','司馬昭'],['鍾會','鄧艾'],['司馬懿','曹爽'],['王允','董卓'],['呂布','董卓'],
 ['許攸','審配'],['田豐','逢紀'],['袁譚','袁尚'],['劉備','曹操'],['孫權','劉備'],['陸遜','劉備'],['黃忠','夏侯淵'],['夏侯霸','黃忠'],['太史慈','劉繇'],['甘寧','凌統'],['凌統','甘寧'],['于禁','關羽'],['龐德','關羽'],['張遼','孫權'],['臧霸','呂布']];
const BOND_OF={};BONDS.forEach((g,i)=>g.slice(1).forEach(n=>(BOND_OF[n]=BOND_OF[n]||[]).push(i)));
const FEUD_OF={};FEUDS.forEach(([a,b])=>{(FEUD_OF[a]=FEUD_OF[a]||new Set()).add(b);(FEUD_OF[b]=FEUD_OF[b]||new Set()).add(a);});
function bonded(a,b){if(!a||!b||a===b)return null;const ga=BOND_OF[a.name]||[];const i=ga.find(x=>(BOND_OF[b.name]||[]).includes(x));return i==null?null:BONDS[i][0];}
function feud(a,b){return !!(a&&b&&FEUD_OF[a.name]&&FEUD_OF[a.name].has(b.name));}
/* 與君主有羈絆：忠誠鎖定 100，不會被挖角、登用、策反 */
function bondLocked(o){const F=o&&S.factions[o.fac];if(!F)return false;const L=S.officers[F.lord];return L&&L!==o&&!!bonded(o,L);}
/* 陣營裡有羈絆者：登用、搜索、俘虜歸順的加成 */
function bondBonus(t,f){if(!t||!f)return 0;return S.officers.some(o=>o.fac===f&&bonded(o,t))?0.3:0;}
function feudIn(o,f){return S.officers.filter(x=>x.fac===f&&x!==o&&feud(o,x));}
function relationText(o){
 const out=[];const seen=new Set();
 (BOND_OF[o.name]||[]).forEach(i=>{const g=BONDS[i];const others=g.slice(1).filter(n=>n!==o.name&&byName(n));if(others.length)out.push(`${g[0]}：${others.join('、')}`);});
 const fs=[...(FEUD_OF[o.name]||[])].filter(n=>byName(n));if(fs.length)out.push(`仇敵：${fs.join('、')}`);
 return out;
}
/* 每月：羈絆鎖定忠誠；同陣營有仇敵則忠誠下滑並封頂 */
function monthlyRelations(){
 S.officers.forEach(o=>{const F=S.factions[o.fac];if(!F||!F.alive||F.lord===o.id)return;
  if(bondLocked(o)){o.loy=100;return;}
  const fe=feudIn(o,o.fac);if(!fe.length)return;
  const withLord=fe.some(x=>F.lord===x.id);const cap=withLord?50:65;
  o.loy=Math.min(cap,(o.loy||70)-1);
  if(o.fac===S.player&&o.loy<=cap&&Math.random()<0.15)log(`${o.name}與${fe[0].name}${withLord?'有殺身之仇':'素有嫌隙'}，同處一營，心懷怨望`,'bad');});
}
/* 婚姻：孫尚香嫁劉備 */
function marriageEvent(){
 if(S.evDone.marriage)return;const sq=lordIs('孫權'),lb=lordIs('劉備'),ssx=byName('孫尚香');
 if(!sq||!lb||!ssx||ssx.fac!==sq.fac||S.year<209||rel(sq.fac,lb.fac).trust<30||rel(sq.fac,lb.fac).ally)return;
 S.evDone.marriage=1;const s=sq.fac,f=lb.fac;
 const t=hz('建安十四年（209），孫權「進妹固好」，將妹妹嫁給劉備。孫夫人才捷剛猛，劉備「衷心常凜凜」。劉備入蜀後孫權接回其妹，孫夫人欲攜阿斗而去，被趙雲、張飛截回。')+hy('《演義》第五十四回「吳國太佛寺看新郎」，周瑜「賠了夫人又折兵」。');
 const wed=()=>{const r=rel(s,f);r.ally=true;r.trust=clamp(r.trust+30,0,100);ssx.fac=f;ssx.city=lb.city;ssx.loy=80;log('孫權以妹嫁劉備，孫劉結為姻親、締結同盟',[s,f].includes(S.player)?'good':'');};
 if(s===S.player)pushEvent('進妹固好',t+'<p>魯肅建議以聯姻籠絡劉備。</p>',[{label:'以妹嫁之（同盟，友好 +30）',primary:true,fn:wed},{label:'不許',fn:()=>{}}]);
 else if(f===S.player)pushEvent('東吳招親',t+'<p>孫權遣使提親，願以妹相嫁。</p>',[{label:'前往東吳迎娶（同盟，友好 +30）',primary:true,fn:wed},{label:'恐是圈套，婉拒',fn:()=>{adjTrust(s,f,-10);}}]);
 else if(rel(s,f).trust>=40)wed();
}
