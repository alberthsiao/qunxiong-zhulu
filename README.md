# 群雄逐鹿

光榮式三國策略遊戲的瀏覽器原型。純 HTML + JavaScript，沒有框架與外部相依（字型除外），最後輸出成單一 HTML 檔。

七個劇本：184 黃巾之亂、190 反董卓聯軍、200 官渡、208 赤壁、219 三足鼎立、249 高平陵之變、263 三國歸晉。除了中原群雄，每個劇本也都有周邊諸國可以扮演或交手：倭（邪馬台國卑彌呼）、高句麗、遼東公孫氏、烏桓、鮮卑、南匈奴、羌、南蠻（孟獲）、交州士燮。邪馬台可經海路通往樂浪與北海。東南海上另有無主的夷洲（台灣），可自會稽或番禺渡海佔領。

線上遊玩：https://qunxiong-zhulu.vercel.app （公開，進度存在瀏覽器）。

## 快速開始

```bash
npm install          # 只為了測試用的 jsdom
npm run build        # 產生 dist/index.html，直接用瀏覽器開啟即可遊玩
npm run sim          # 建置後以「全部委任」模擬各劇本三年，再跑戰鬥專項測試，檢查錯誤與勢力消長
```

## 目錄

```
src/
  index.template.html   HTML 骨架（/*__CSS__*/、/*__JS__*/ 兩個佔位符）
  styles.css            全部樣式（含深色模式變數）
  js/                   依檔名順序串接成同一個 <script>
    01-core.js          資料：城池、道路、武將主檔、寶物、劇本、共用工具、initState
    02-commands.js      內政命令（開發、徵兵、搜索、登用、賑濟）
    03-growth-rank.js   經驗成長、官職、君主爵位
    04-unit-types.js    兵種與相剋
    05-battle-auto.js   快速結算戰鬥（電腦勢力之間）、戰後處理、俘虜
    06-ai.js            電腦勢力的出兵、內政、調兵
    07-turn.js          月份推進、經濟、壽命、登場
    08-ui.js            大地圖、城池面板、命令視窗
    09-battle-map.js    六角格戰場：地形、移動、AI 部署
    10-fx.js            戰場動畫
    11-duel.js          一騎討
    12-battle-flow.js   戰場回合流程與操作
    13-events.js        歷史事件、結局
    14-espionage.js     情報迷霧、諜報、忠誠
    15-diplomacy.js     外交、同盟
    16-items.js         寶物
    17-roster.js        人才一覽
    18-editor.js        數值編輯
    19-start.js         開局畫面
    20-save.js          多欄位存檔、匯出匯入
    21-outer.js         周邊諸國特性（遊牧騎兵、鬼道、藤甲等）、渡海、朝貢
    22-weather.js       天候：戰場每日天氣、大地圖季節天災
    23-cloud.js         帳號存檔（發布成 Claude Artifact 時啟用）
    24-autosim.js       自動模擬：電腦接管所有勢力連續推進
    25-gear.js          軍備：城池軍備庫、出征配發、戰後回收
    26-portrait.js      武將頭像：程式繪製的 SVG
    27-bio.js           人物誌：依《三國志》撰寫的簡介與《演義》情節
    28-history.js       歷史事件（資料驅動，附志／演說明）
    29-victory.js       劇本目標、稱帝、天下大勢結算
    30-skills.js        武將技能、火計、伏兵、圍城
    31-policy.js        政策與民忠事件
    32-relations.js     義兄弟、親族、仇敵、婚姻
    33-mobile.js        地圖縮放與拖曳
    34-extras.js        每月大事摘要、成就、音效
    35-learn.js         年表、史料原文、地理、隨堂測驗
    36-naval.js         水戰
    37-ai2.js           電腦策略層：合縱、守勢、集中兵力
    38-succession.js    繼承事件、多人熱座
    39-visual.js        大地圖美術、戰場天候動畫、背景音樂
    40-tutorial.js      新手引導
    41-record.js        自動存檔、戰報回放、本局列傳、戰績卡
    42-content.js       黃巾人物誌、演義回目、周邊寶物與事件
    99-boot.js          啟動，必須最後載入
build.mjs               合併腳本
tests/sim.cjs           無頭模擬測試
tests/autosim.cjs       自動模擬測試
tests/stats.cjs         大量模擬統計（平衡用）；tests/stats-report.cjs 彙整
tests/cloud.cjs         帳號存檔測試（模擬 Artifact 執行環境）
tests/battle.cjs        戰鬥專項測試（四向布局、盟友援軍、快速結算修正）
```

## 注意

- 所有模組共用全域範圍（刻意不用 ES modules），好讓輸出維持單一檔案。函式宣告會被提升，但 `const` 物件要注意載入順序。
- 遊戲狀態集中在全域 `S`，存檔就是 `JSON.stringify(S)`。新增欄位時，記得在 `20-save.js` 的 `loadState` 補上舊存檔的預設值。

## 開發與貢獻

- 原始碼在 GitHub：https://github.com/alberthsiao/qunxiong-zhulu 。歡迎回報錯誤、補充人物誌（`src/js/27-bio.js`）或歷史事件（`src/js/28-history.js`）。
- 推送後 GitHub Actions 會自動執行 `npm run sim`。
- 部署到 Vercel：`npm run deploy`（需先 `vercel login`）。
- 遊戲內「存讀檔 → 設定 → 回報問題」會開啟預填環境資訊的 GitHub issue。
