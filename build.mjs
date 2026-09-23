// 把 src/ 下的樣式與各模組合併成單一 HTML：dist/index.html
import {readFileSync,writeFileSync,readdirSync,mkdirSync} from 'node:fs';
const js=readdirSync('src/js').filter(f=>f.endsWith('.js')).sort().map(f=>readFileSync('src/js/'+f,'utf8')).join('\n');
const css=readFileSync('src/styles.css','utf8')+'\n'+readFileSync('src/theme.css','utf8');
const html=readFileSync('src/index.template.html','utf8').replace('/*__CSS__*/',()=>css).replace('/*__JS__*/',()=>js);
mkdirSync('dist',{recursive:true});writeFileSync('dist/index.html',html);
// Artifact 版：發布時平台會自行包上 doctype／html／head／body，所以只輸出 head 內容與 body 內容
const headIn=html.slice(html.indexOf('<title>'),html.indexOf('</head>'));
const bodyIn=html.slice(html.indexOf('<body>')+6,html.lastIndexOf('</body>'));
writeFileSync('dist/artifact.html',headIn+bodyIn);writeFileSync('dist/artifact-public.html',headIn+bodyIn);// 同一份內容；分兩個檔是為了發布成兩個網址（帳號版／公開版）
console.log(`dist/index.html 已產生（${(html.length/1024).toFixed(0)} KB）`);
