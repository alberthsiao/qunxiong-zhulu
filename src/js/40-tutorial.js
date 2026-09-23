/* ---------- 新手引導：前幾回合依狀態顯示提示 ---------- */
const TUT=[
 {id:'pick',when:()=>S.turn===0&&!ui.sel,t:'歡迎來到群雄逐鹿。先點地圖上<b>你的城池</b>（印章顏色與右上角勢力相同），看看城裡有誰。'},
 {id:'cmd',when:()=>S.turn===0&&ui.sel&&S.cities[ui.sel].owner===S.player&&officersIn(ui.sel,S.player).every(o=>!o.done),t:'這是城池面板。每位武將每月可執行一次命令：試試<b>開發農業</b>或<b>徵兵</b>。金錢來自商業、糧食在七月秋收。'},
 {id:'end',when:()=>S.turn===0&&S.officers.some(o=>o.fac===S.player&&o.done),t:'武將行動後會標示「已行動」。安排妥當後按右上角的<b>結束本月</b>，電腦勢力會接著行動。'},
 {id:'march',when:()=>S.turn===1,t:'要擴張就<b>出征</b>：選自己的城→出征→點相鄰的敵城或無主城。出征前先確認軍糧夠、帶兵武將的統率高。'},
 {id:'dip',when:()=>S.turn===2,t:'弱小時先用<b>外交</b>贈禮、停戰或結盟，並頒行<b>政策</b>。上方「年表」可對照史實，點武將頭像可看人物誌。'},
 {id:'def',when:()=>S.turn===3,t:'敵軍從第四個月起會來攻。前線城池保持兵力與城防，被攻時可親自指揮六角格戰場。記得用<b>存讀檔</b>保存進度。引導到此結束。'}];
function tutSeen(){try{return JSON.parse(localStorage.getItem('qunxiong-tut')||'{}');}catch(e){return{};}}
function tutMark(id){const s=tutSeen();s[id]=1;try{localStorage.setItem('qunxiong-tut',JSON.stringify(s));}catch(e){}}
function tutSkip(){const s=tutSeen();TUT.forEach(x=>s[x.id]=1);try{localStorage.setItem('qunxiong-tut',JSON.stringify(s));}catch(e){}tutRender();}
function tutRender(){
 let box=$('#tut');
 if(!S||!S.player||S.over||SIM.on||BT||$('#start')&&!$('#start').hidden){if(box)box.hidden=true;return;}
 const seen=tutSeen();const step=TUT.find(x=>!seen[x.id]&&x.when());
 if(!step){if(box)box.hidden=true;return;}
 if(!box){box=document.createElement('div');box.id='tut';document.body.appendChild(box);}
 box.hidden=false;box.innerHTML=`<div class="tuthd">新手引導 <button data-tut="skip">跳過全部</button></div><p>${step.t}</p><button class="primary" data-tut="ok">知道了</button>`;
 box.onclick=e=>{const b=e.target.closest('[data-tut]');if(!b)return;if(b.dataset.tut==='skip')tutSkip();else{tutMark(step.id);tutRender();}};
}
