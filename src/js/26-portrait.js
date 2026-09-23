/* ---------- 武將頭像：以程式即時繪製的 SVG（不使用任何外部圖片） ---------- */
/* portrait(o,px,opts) 回傳一段 <svg>。外觀由姓名決定（同一人永遠長一樣），再依能力、年齡、出身文化、是否為君主調整；名將的招牌特徵寫在 PT_SPECIAL */
const PT_SKIN=['#F1CDA8','#E9BE97','#DFAE84','#D19E72'];
const PT_FEMALE=['卑彌呼','壹與','祝融','王異','貂蟬','蔡琰','甄氏','張春華','辛憲英','黃月英','孫尚香','大喬','小喬','步練師'];
const PT_SPECIAL={
 關羽:{skin:'#B9543F',beard:'long',hat:'hood',hatCol:'#2F7A4A',brow:2.6,slant:-2.2,eyes:'narrow'},
 張飛:{skin:'#80573D',beard:'bristle',hat:'helmet',brow:3,slant:-2.4,eyes:'round',face:'square'},
 劉備:{ears:'big',beard:'mustache',face:'oval',slant:0.6},
 曹操:{beard:'full',eyes:'narrow',face:'oval',slant:-1.4,robe:'#8E2F2A'},
 諸葛亮:{hat:'lunjin',beard:'three',face:'long',fan:true,slant:0.4},
 呂布:{hat:'pheasant',beard:'none',face:'square',slant:-2.2,brow:2.4},
 夏侯惇:{patch:true,hat:'helmet',beard:'full',slant:-2},
 趙雲:{hat:'helmet',helm:'#CBD0D6',plume:'#F4F4F0',beard:'none',face:'oval',slant:-1},
 馬超:{hat:'helmet',helm:'#CBD0D6',plume:'#F4F4F0',beard:'none',face:'long',slant:-1.8},
 黃忠:{hair:'#E2DFD8',beard:'full',hat:'helmet',slant:-1.6},
 孫權:{beardCol:'#6B3F7A',eyeCol:'#2F7A6B',beard:'full'},
 孫策:{beard:'none',hat:'helmet',plume:'#C8372D',slant:-1.6},
 周瑜:{beard:'none',hat:'guan',face:'oval',slant:-0.4},
 司馬懿:{eyes:'narrow',beard:'three',hat:'guan',face:'long',slant:-1.2},
 董卓:{face:'round',beard:'bristle',fat:true,slant:-1.8,brow:2.8},
 許褚:{face:'round',beard:'full',hat:'helmet',brow:2.8},
 典韋:{skin:'#B98A62',face:'square',beard:'bristle',hat:'helmet',brow:3},
 龐統:{face:'square',beard:'goatee',hat:'lunjin',brow:2.8,slant:1.2},
 郭嘉:{beard:'none',hat:'guan',face:'long'},
 荀彧:{beard:'three',hat:'guan',face:'oval'},
 賈詡:{beard:'three',hat:'guan',eyes:'narrow',hair:'#77736E'},
 陸遜:{beard:'none',hat:'guan',face:'oval'},
 姜維:{beard:'none',hat:'helmet',face:'oval'},
 魏延:{skin:'#B5634A',beard:'full',hat:'helmet',slant:-2},
 甘寧:{beard:'mustache',hat:'feather',slant:-1.8},
 張遼:{beard:'full',hat:'helmet',slant:-1.8},
 袁紹:{beard:'full',face:'oval'},
 孟獲:{hat:'feather',beard:'full',face:'square',brow:2.8},
 祝融:{hat:'feather'},
 兀突骨:{skin:'#8C6A4C',hat:'feather',beard:'bristle',face:'square',brow:3},
 卑彌呼:{hat:'diadem'},
 壹與:{hat:'diadem'}};
const PT_CACHE={};
function ptCulture(o){for(const[id,x]of Object.entries(OUTER)){if(x.cities.includes(o.home))return id;}return 'han';}
function ptHat(o,R,lord,cul,female){
 if(female)return cul==='nanman'?'feather':'hairpin';
 if(['wuhuan','xianbei','xiongnu','qiang'].includes(cul))return 'fur';
 if(cul==='nanman')return 'feather';
 if(cul==='wa')return 'mizura';
 if(cul==='gogu')return 'jeolpung';
 if(cul==='shixie')return o.war>=60?'helmet':'wrap';
 if(lord)return 'crown';
 if(o.war>=75&&o.war>=o.int-5)return 'helmet';
 if(Math.max(o.int,o.pol)>=75&&o.war<70)return o.int>=88&&R()<0.5?'lunjin':'guan';
 return R()<0.5?'helmet':'guan';
}
function ptBeard(o,R,age,female,hat){
 if(female||age<26)return 'none';
 const r=R();
 if(hat==='helmet'||hat==='fur'||hat==='feather')return o.war>=88?(r<0.45?'bristle':'full'):r<0.25?'none':r<0.55?'mustache':r<0.8?'full':'goatee';
 return age>=45?(r<0.6?'three':'full'):r<0.3?'none':r<0.6?'mustache':r<0.85?'goatee':'three';
}
function portrait(o,px,opts){
 opts=opts||{};px=px||32;
 const year=opts.year||(S?S.year:200);
 const F=S&&S.factions[o.fac];
 const lord=opts.lord!=null?opts.lord:!!(F&&F.lord===o.id);
 const col=opts.col||(F?F.color:'#8E9088');
 const age=Math.max(16,year-o.appear+17);const ab=age<26?0:age<48?1:age<60?2:3;
 const key=[o.name,ab,lord?1:0,col,o.war,o.int].join('|');
 let inner=PT_CACHE[key];
 if(!inner){inner=PT_CACHE[key]=ptDraw(o,age,lord,col);}
 return `<svg class="pt" data-o="${o.id}" width="${px}" height="${px}" viewBox="0 0 64 64" role="img" aria-label="${o.name}的頭像，點擊查看人物誌">${inner}</svg>`;
}
function ptDraw(o,age,lord,col){
 const R=seeded('pt'+o.name),sp=PT_SPECIAL[o.name]||{};
 const female=PT_FEMALE.includes(o.name),cul=ptCulture(o);
 const r1=R(),r2=R(),r3=R(),r4=R(),r5=R();
 const skin=sp.skin||(female?PT_SKIN[0]:cul==='nanman'?PT_SKIN[3]:PT_SKIN[Math.floor(r1*4)]);
 const hair=sp.hair||(age<48?'#25211E':age<60?'#77736E':'#E2DFD8');
 const face=sp.face||(female?'oval':['oval','square','round','long'][Math.floor(r2*4)]);
 const hat=sp.hat||ptHat(o,R,lord,cul,female);
 const beard=sp.beard||ptBeard(o,R,age,female,hat);
 const bcol=sp.beardCol||hair;
 const armored=['helmet','pheasant','fur'].includes(hat)||(hat==='feather'&&!female);
 const robe=sp.robe||(armored?'#4A4F58':col);
 const sh='rgba(80,40,20,.32)';
 let s=`<rect width="64" height="64" rx="6" fill="${col}"/><circle cx="32" cy="30" r="27" fill="#fff" opacity=".22"/>`;
 // 後髮（女性、倭人、南蠻的披髮）
 if(female||hat==='mizura')s+=`<path d="M15,30 C12,8 52,8 49,30 L${female?'52,64 L12,64':'47,44 L17,44'}Z" fill="${hair}"/>`;
 if(hat==='feather'&&!female)s+=`<path d="M15,32 C11,10 53,10 49,32 L50,50 L14,50Z" fill="${hair}"/>`;
 // 肩與衣甲
 s+=`<path d="M${sp.fat?2:5},64 C7,52 19,49 26,47.5 L38,47.5 C45,49 57,52 ${sp.fat?62:59},64Z" fill="${robe}"/>`;
 if(armored)s+=`<path d="M5,64 C6,56 12,52 20,50 L22,58 L14,64Z M59,64 C58,56 52,52 44,50 L42,58 L50,64Z" fill="#6A717C"/><path d="M24,48.5 L32,57 L40,48.5" fill="none" stroke="${col}" stroke-width="2.4"/><circle cx="12" cy="58" r="1.4" fill="#C9B26A"/><circle cx="52" cy="58" r="1.4" fill="#C9B26A"/>`;
 else s+=`<path d="M25,47.5 L32,59 L39,47.5 L36.5,47.5 L32,54.5 L27.5,47.5Z" fill="#F3EFE4"/><path d="M18,52 L28,64 M46,52 L36,64" stroke="rgba(0,0,0,.18)" stroke-width="1.2" fill="none"/>`;
 // 頸、耳
 s+=`<rect x="27" y="42" width="10" height="8" fill="${skin}"/><rect x="27" y="42" width="10" height="8" fill="${sh}"/>`;
 const er=sp.ears==='big'?4.2:2.8,ey=sp.ears==='big'?35:33.5;
 s+=`<ellipse cx="18.6" cy="${ey}" rx="2.4" ry="${er}" fill="${skin}"/><ellipse cx="45.4" cy="${ey}" rx="2.4" ry="${er}" fill="${skin}"/>`;
 // 臉
 const FACE={oval:'M19,30 C19,17 45,17 45,30 C45,42 39,50 32,50 C25,50 19,42 19,30Z',square:'M19,29 C19,17 45,17 45,29 L44.4,40 C43.4,46 38,50 32,50 C26,50 20.6,46 19.6,40Z',round:'M17.6,31 C17.6,17 46.4,17 46.4,31 C46.4,43.5 40,50.5 32,50.5 C24,50.5 17.6,43.5 17.6,31Z',long:'M20,29 C20,17 44,17 44,29 C44,42 38.4,52 32,52 C25.6,52 20,42 20,29Z'};
 s+=`<path d="${FACE[face]}" fill="${skin}"/>`;
 if(sp.fat)s+=`<path d="M22,46 Q32,56 42,46 Q32,52 22,46Z" fill="${sh}"/>`;
 if(female)s+=`<ellipse cx="24.5" cy="38.5" rx="2.6" ry="1.5" fill="#E58A7A" opacity=".45"/><ellipse cx="39.5" cy="38.5" rx="2.6" ry="1.5" fill="#E58A7A" opacity=".45"/>`;
 // 鬍鬚（畫在嘴之前）
 const must=`<path d="M26.4,41.6 Q32,38.6 37.6,41.6 Q35,43 32,41.8 Q29,43 26.4,41.6Z" fill="${bcol}"/>`;
 if(beard==='mustache')s+=must;
 else if(beard==='goatee')s+=must+`<path d="M29.6,46 Q32,53.5 34.4,46 Q32,47.2 29.6,46Z" fill="${bcol}"/>`;
 else if(beard==='three')s+=must+`<path d="M30.4,46 L32,60 L33.6,46Z" fill="${bcol}"/><path d="M21,38 Q21.5,50 25,56 M43,38 Q42.5,50 39,56" stroke="${bcol}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
 else if(beard==='full'||beard==='long')s+=`<path d="M19.4,35 C19.6,48 26,${beard==='long'?52:54} 32,${beard==='long'?52:54} C38,${beard==='long'?52:54} 44.4,48 44.6,35 C42.6,42.4 38,44.6 32,44.6 C26,44.6 21.4,42.4 19.4,35Z" fill="${bcol}"/>`+must+(beard==='long'?`<path d="M23,47 C23,58 28,64 32,64 C36,64 41,58 41,47 C38,51 26,51 23,47Z" fill="${bcol}"/><path d="M28,52 L29,63 M32,52 L32,64 M36,52 L35,63" stroke="rgba(255,255,255,.18)" stroke-width=".8"/>`:'');
 else if(beard==='bristle'){let d='M19,33';for(let i=0;i<=12;i++){const a=Math.PI*(0.02+i*0.08);const x=32-Math.cos(a)*13.2,y=36+Math.sin(a)*15;const ox=32-Math.cos(a)*17.4,oy=36+Math.sin(a)*19.6;d+=` L${ox.toFixed(1)},${oy.toFixed(1)} L${(x+ (i<12?1.6:0)).toFixed(1)},${(y+1).toFixed(1)}`;}d+=' L45,33 C43,42 38,44.4 32,44.4 C26,44.4 21,42 19,33Z';s+=`<path d="${d}" fill="${bcol}"/>`+must;}
 // 嘴、鼻
 const smile=o.cha>=85?1.9:o.war>=88?-0.6:0.8;
 s+=`<path d="M28.6,44.2 Q32,${(44.2+smile*1.4).toFixed(1)} 35.4,44.2" fill="none" stroke="${female?'#B5403A':'#7A3B30'}" stroke-width="${female?1.8:1.3}" stroke-linecap="round"/>`;
 s+=`<path d="M32,31.5 L30.4,38.2 Q32,39.4 33.6,38.4" fill="none" stroke="${sh}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>`;
 // 眼、眉
 const et=sp.eyes||(o.int>=88?'narrow':o.war>=92?'round':'normal');const ery=et==='narrow'?1.05:et==='round'?2.1:1.55;
 const ecol=sp.eyeCol||'#1E1A17';
 [[25.6,1],[38.4,-1]].forEach(([ex,dir])=>{
  if(sp.patch&&dir===1){s+=`<path d="M17,24 L46,40" stroke="#1E1A17" stroke-width="1.2"/><ellipse cx="${ex}" cy="32.4" rx="4.2" ry="3.6" fill="#1E1A17"/>`;return;}
  s+=`<ellipse cx="${ex}" cy="32.4" rx="2.9" ry="${ery}" fill="#FBF8F2"/><circle cx="${ex}" cy="32.4" r="${Math.min(ery,1.35)}" fill="${ecol}"/><path d="M${ex-3.1},${32.2-ery*0.5} Q${ex},${31-ery} ${ex+3.1},${32.2-ery*0.5}" fill="none" stroke="#1E1A17" stroke-width="${female?1.3:0.9}" stroke-linecap="round"/>`;
  const bw=sp.brow||(female?1:1.1+Math.max(0,o.war-50)/32),sl=sp.slant!=null?sp.slant:(female?0.4:-(Math.max(0,o.war-60)/22)+(r5-0.5));
  s+=`<path d="M${ex-dir*3.8},${(27.8+sl).toFixed(1)} L${ex+dir*3.6},${(28.4-sl*0.45).toFixed(1)}" stroke="${age>=60?hair:'#1E1A17'}" stroke-width="${bw.toFixed(1)}" stroke-linecap="round"/>`;
 });
 if(age>=55)s+=`<path d="M22,36 Q24,37 26,36 M38,36 Q40,37 42,36" fill="none" stroke="${sh}" stroke-width=".9"/>`;
 // 頭髮與冠帽
 const hairTop=`<path d="M18.6,29 C17,13 47,13 45.4,29 C42.6,21.4 21.4,21.4 18.6,29Z" fill="${hair}"/>`;
 const knot=`<ellipse cx="32" cy="12.6" rx="4.4" ry="4" fill="${hair}"/>`;
 const gold='#D2A93F',steel=sp.helm||'#59616C';
 if(hat==='helmet'){const pl=sp.plume||['#C8372D','#C8372D','#2F5D9A','#E0B030'][Math.floor(r3*4)];
  s+=`<path d="M32,11 C31,4 38,1 43,5 C39,5 37,8 36,11Z" fill="${pl}"/><path d="M16.6,29 C15,9 49,9 47.4,29 L44.4,27.4 C42,21.6 22,21.6 19.6,27.4Z" fill="${steel}"/><path d="M17.4,27.6 C22,20.4 42,20.4 46.6,27.6" fill="none" stroke="${col}" stroke-width="2.6"/><path d="M32,10 L32,22" stroke="rgba(255,255,255,.35)" stroke-width="1.4"/><path d="M17,28 L16.4,40 L20.4,43 L20.8,29.6Z M47,28 L47.6,40 L43.6,43 L43.2,29.6Z" fill="${steel}"/><circle cx="32" cy="23.4" r="1.7" fill="${gold}"/>`;}
 else if(hat==='guan')s+=hairTop+knot+`<rect x="27.2" y="7" width="9.6" height="9.4" rx="1.6" fill="#1F1C1A"/><path d="M27.2,10 L36.8,10" stroke="${gold}" stroke-width="1"/><path d="M21.6,12.4 L42.4,12.4" stroke="${gold}" stroke-width="1.5" stroke-linecap="round"/>`;
 else if(hat==='crown')s+=hairTop+knot+`<rect x="25.6" y="7.4" width="12.8" height="9.4" rx="1.4" fill="${gold}"/><rect x="19" y="5.2" width="26" height="2.8" rx="1" fill="#1F1C1A"/><path d="M21.6,8 v5 M25.6,8 v4 M38.4,8 v4 M42.4,8 v5" stroke="#C8372D" stroke-width="1.1" stroke-linecap="round"/><circle cx="32" cy="12" r="1.7" fill="#C8372D"/>`;
 else if(hat==='lunjin'||hat==='hood'||hat==='wrap'){const hc=sp.hatCol||(hat==='wrap'?'#C9A86A':'#ECE8DC');
  s+=`<path d="M17.4,29 C15.4,9 48.6,9 46.6,29 C42.6,21 21.4,21 17.4,29Z" fill="${hc}"/><path d="M22,14 Q32,20 42,14 M19.4,21 Q32,26 44.6,21" fill="none" stroke="rgba(0,0,0,.2)" stroke-width="1"/>`+(hat==='lunjin'?`<path d="M44.6,22 L52,34 L47.6,33Z" fill="${hc}"/>`:'');}
 else if(hat==='pheasant')s+=hairTop+`<path d="M29,14 C22,2 10,-2 2,4 C10,2 20,8 27,17Z M35,14 C42,2 54,-2 62,4 C54,2 44,8 37,17Z" fill="#B5572D"/><path d="M27,15 C20,5 11,1 4,4 M37,15 C44,5 53,1 60,4" fill="none" stroke="#F3E2B8" stroke-width=".9" stroke-dasharray="2 2.4"/><rect x="25.6" y="9.6" width="12.8" height="8.8" rx="2" fill="#6B2E6B"/><path d="M25.6,14 h12.8" stroke="${gold}" stroke-width="1.4"/><circle cx="32" cy="11.8" r="1.6" fill="${gold}"/>`;
 else if(hat==='fur'){s+=`<path d="M20,20 C21,5 43,5 44,20Z" fill="#5B4636"/><path d="M15.6,29 C15,16 49,16 48.4,29 C43,23.4 21,23.4 15.6,29Z" fill="#CDC3AE"/>`;for(let i=0;i<8;i++)s+=`<circle cx="${(18.4+i*3.9).toFixed(1)}" cy="${(27.6-Math.sin(i/7*Math.PI)*4.4).toFixed(1)}" r="2.4" fill="#E4DCCB"/>`;s+=`<path d="M16,29 L14.6,42 L19,38Z M48,29 L49.4,42 L45,38Z" fill="#CDC3AE"/>`;}
 else if(hat==='feather'){s+=(female?`<path d="M18,30 C16,12 48,12 46,30 C42,22 22,22 18,30Z" fill="${hair}"/>`:hairTop)+`<path d="M32,22 C30,10 32,3 35,0 C37,6 36,14 34,22Z" fill="#C8372D"/><path d="M27,22 C22,12 21,6 22,1 C26,6 29,14 30,22Z" fill="#2F7A5A"/><path d="M37,22 C42,12 43,6 42,1 C38,6 35,14 34,22Z" fill="#E0B030"/><path d="M18.4,25.6 C23,21.6 41,21.6 45.6,25.6" fill="none" stroke="#C8372D" stroke-width="2.8"/><circle cx="32" cy="23" r="1.6" fill="#F3EFE4"/>`;}
 else if(hat==='mizura')s+=hairTop+`<circle cx="16.6" cy="37" r="3.6" fill="${hair}"/><circle cx="47.4" cy="37" r="3.6" fill="${hair}"/><path d="M14,37 h5.2 M44.8,37 h5.2" stroke="#C8372D" stroke-width="1.2"/><path d="M18.6,25.4 C23,21.6 41,21.6 45.4,25.4" fill="none" stroke="#F3EFE4" stroke-width="2.2"/>`;
 else if(hat==='jeolpung')s+=hairTop+`<path d="M24,18 L32,4 L40,18Z" fill="#1F1C1A"/><path d="M24.6,17 C19,10 17,5 17.6,1 C21,5 24,10 27,14Z M39.4,17 C45,10 47,5 46.4,1 C43,5 40,10 37,14Z" fill="#F3EFE4" stroke="rgba(0,0,0,.25)" stroke-width=".5"/><path d="M23,18.4 h18" stroke="${gold}" stroke-width="1.6"/>`;
 else if(hat==='hairpin')s+=`<path d="M17.6,30 C15.6,11 48.4,11 46.4,30 C43,22.4 35,20 32,24 C29,20 21,22.4 17.6,30Z" fill="${hair}"/><ellipse cx="32" cy="11.4" rx="5.4" ry="4.2" fill="${hair}"/><path d="M23,10.4 L41,12.4" stroke="${gold}" stroke-width="1.4" stroke-linecap="round"/><circle cx="41.6" cy="12.6" r="1.6" fill="#C8372D"/>`;
 else if(hat==='diadem')s+=`<path d="M17.6,30 C15.6,11 48.4,11 46.4,30 C43,22.4 35,20 32,24 C29,20 21,22.4 17.6,30Z" fill="${hair}"/><path d="M19,22.6 C24,18 40,18 45,22.6 L45,19.4 C40,14.6 24,14.6 19,19.4Z" fill="${gold}"/><circle cx="32" cy="12.6" r="4.6" fill="${gold}"/><circle cx="32" cy="12.6" r="2.8" fill="#C8372D"/><path d="M32,5.6 v2 M25.4,8.6 l1.5,1.5 M38.6,8.6 l-1.5,1.5" stroke="${gold}" stroke-width="1.3" stroke-linecap="round"/>`;
 // 羽扇
 if(sp.fan)s+=`<g transform="translate(47,50) rotate(18)"><path d="M0,14 L0,2" stroke="#6B4A2E" stroke-width="1.6"/><path d="M0,3 C-9,-2 -10,-12 -5,-17 C-4,-10 -2,-6 0,-3 C-1,-9 -1,-15 1,-19 C3,-15 2,-9 1,-3 C3,-7 6,-11 9,-15 C11,-9 8,-2 0,3Z" fill="#F6F3EA" stroke="rgba(0,0,0,.25)" stroke-width=".6"/></g>`;
 return s+`<rect x=".75" y=".75" width="62.5" height="62.5" rx="5.4" fill="none" stroke="rgba(0,0,0,.28)" stroke-width="1.5"/>`;
}
/* 全武將頭像總覽（人才一覽視窗的「頭像圖鑑」與開發時檢視用） */
function openGallery(){
 const list=S.officers.filter(o=>(o.fac&&S.factions[o.fac])||(o.fac===null&&o.found)).sort((a,b)=>(b.lea+b.war+b.int)-(a.lea+a.war+a.int));
 modal('武將圖鑑',`<p class="hint">各勢力與已發現的在野武將共 ${list.length} 名。頭像依姓名、能力、年齡與出身繪製，年歲漸長鬚髮會轉白。</p><div class="ptgrid">${list.map(o=>`<figure>${portrait(o,64)}<figcaption>${o.name}</figcaption></figure>`).join('')}</div>`,[{label:'關閉',primary:true}]);
 $('#modal .dlg').classList.add('wide');
}
