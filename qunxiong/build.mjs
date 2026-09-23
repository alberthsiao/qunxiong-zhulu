// 把 src/ 下的樣式與各模組合併成單一 HTML：dist/index.html
import {readFileSync,writeFileSync,readdirSync,mkdirSync} from 'node:fs';
const js=readdirSync('src/js').filter(f=>f.endsWith('.js')).sort().map(f=>readFileSync('src/js/'+f,'utf8')).join('\n');
const css=readFileSync('src/styles.css','utf8');
const html=readFileSync('src/index.template.html','utf8').replace('/*__CSS__*/',()=>css).replace('/*__JS__*/',()=>js);
mkdirSync('dist',{recursive:true});writeFileSync('dist/index.html',html);
console.log(`dist/index.html 已產生（${(html.length/1024).toFixed(0)} KB）`);
