# 群雄逐鹿

光榮式三國策略遊戲的瀏覽器原型。純 HTML + JavaScript，沒有框架與外部相依（字型除外），最後輸出成單一 HTML 檔。

## 快速開始

```bash
npm install          # 只為了測試用的 jsdom
npm run build        # 產生 dist/index.html，直接用瀏覽器開啟即可遊玩
npm run sim          # 建置後以「全部委任」模擬各劇本三年，檢查錯誤與勢力消長
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
build.mjs               合併腳本
tests/sim.cjs           無頭模擬測試
```

## 注意

- 所有模組共用全域範圍（刻意不用 ES modules），好讓輸出維持單一檔案。函式宣告會被提升，但 `const` 物件要注意載入順序。
- 遊戲狀態集中在全域 `S`，存檔就是 `JSON.stringify(S)`。新增欄位時，記得在 `20-save.js` 的 `loadState` 補上舊存檔的預設值。
