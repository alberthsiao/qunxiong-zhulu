# 給 Claude Code 的專案說明

## 專案
群雄逐鹿：光榮式三國策略遊戲。使用者是繁體中文使用者，所有介面文字、日誌、註解一律使用繁體中文（台灣用語）。

## 開發規則
- 改 `src/` 底下的檔案，不要直接改 `dist/index.html`。
- 每次修改後執行 `npm run sim`，確認沒有執行期錯誤（輸出最後不應出現 ERR）。
- 輸出必須維持單一自足 HTML：不得引入外部腳本或圖片；資料一律內嵌。
- 遊戲狀態全在全域 `S`。新增狀態欄位時：
  1. 在 `01-core.js` 的 `initState` 設定初值；
  2. 在 `20-save.js` 的 `loadState` 為舊存檔補預設值；
  3. 欄位不可放函式（存檔用 JSON 序列化；事件佇列 `S.evq` 是唯一例外，存檔時會被清空）。
- 武將能力 `o.lea/war/int/pol/cha` 是「含寶物加成」的有效值；原始值用 `base(o,k)`。改能力時要同時考慮 `o.bonus`。
- 勢力 id 與劇本綁定（例如 `cao`、`liubei`），君主名稱在 `S.factions[id].name`，實際君主是 `S.factions[id].lord`（武將 id）。

## 武將名單
- 共 620 多人：`OFF_RAW`（原始 211 人，由各劇本的 `officers` 字串指定歸屬）加上 `OFF_EXTRA`（擴充的 414 人：《三國志》魏、蜀、吳三書主要列傳人物、群雄部屬、名士與少數《演義》名角）。武將 id 就是 `OFF` 的索引，兩個字串都只能往最後面加。
- `OFF_EXTRA` 每筆多一欄「效力」：`勢力id@起始年`，可多段（`yuan@191,cao@204`），`-` 表示在野。`affOf(i,year)` 取起始年不晚於該年的最後一段；開局（`initState`）與日後登場（`lifeCycle`）都用它決定歸屬，該勢力不存在或已滅亡就變成在野、留在出身城。`affCity` 決定放在哪座城。劇本 `officers` 字串裡點名的人優先於這一欄。
- 能力值是參照史書評價自行設定的；生卒年史書無載者以活動年代估計。要改某人的數值直接改該筆資料。
- 存檔時不存 `home`／`appear`／`death`（`dumpState` 會略過），`loadState` 依 id 從 `OFF` 還原；這讓 620 人的存檔維持在約 120 KiB。

## 常用概念
- 回合：`endTurn()` → 委任城內政 → 電腦勢力行動 → 對玩家的進攻逐一進入戰場 → 月份推進、經濟、壽命、事件、外交。
- 戰鬥有兩套：玩家參與時走六角格戰場（`09`、`12`），電腦之間走快速結算（`05` 的 `autoResolve`）。兩者都用 `setupBattle` 建立、`finishBattle` 收尾。
- 平衡相關常數：`BASE`（城池初值）、`RANKS`（官職帶兵上限）、`TM`（兵種相剋）、`ubase`（傷害基準）、AI 出兵門檻（`06-ai.js` 的 `bestR>1.6`）。

## 戰鬥補充
- 盟友援軍：`reinfCands(f,t)`（`05`）找出與守方同盟、鄰接目標城、兵力 6000 以上的電腦勢力，各派一名非君主武將帶該城三成兵力馳援，最多兩路。援軍部隊帶 `u.ally`（勢力 id）與 `u.home`（出發城），戰後殘兵由 `finishBattle` 歸建，不併入守城兵力。AI 出兵評估與玩家出征視窗都會參考 `reinfCands`。
- 快速結算的兵種與地勢：`qmod(B,u,t,cmd)`（`05`）套用 `TM` 相剋、兵種對突擊／齊射／反擊的加成，以及 `cityTer(城名)` 的地勢修正（山地不利攻方騎兵並減輕守方受傷；水鄉不利攻方突擊、有利守方齊射）。
- 戰場布局：`LAYOUTS`（`09`）有 W／E／S／N 四種，由 `attackDir(B)` 依出發城與目標城的座標決定。城門一律是「面向攻方的主門＋城牆上與主門距離 2 的兩格」。新增布局時不要假設城在右側；需要方向性時用 `hdist(…,B.core)` 或 `L.gate`。
- `npm run sim` 之後會接著跑 `tests/battle.cjs`（四向布局連通性、援軍出兵與歸建、`qmod`、四個方向各一場完整地圖戰）。

## 周邊諸國
- 九個周邊勢力定義在 `01-core.js` 的 `OUTER`：倭（`wa`）、高句麗（`gogu`）、遼東公孫氏（`gsdu`）、烏桓（`wuhuan`）、鮮卑（`xianbei`）、南匈奴（`xiongnu`）、羌（`qiang`）、南蠻（`nanman`）、交州士氏（`shixie`）。`withOuter(sc)` 在載入時把它們併入每個劇本（君主依劇本年份切換；`until` 年份之後該勢力的城歸曹操；只派任當年在世的武將），並透過 `sc.tweak` 提高其初始兵力與訓練度。
- 夷洲（台灣）是「無主城」，沒有勢力也沒有專屬武將（使用者明確要求：不要台灣勢力，但要能渡海去佔領）。海路連會稽與番禺；`MIASMA`（`21-outer.js`）列出瘴癘之地，不論守方是誰，來犯的攻方在 `traitSetup` 開戰時先折損一成五。開局兵力由 `withOuter` 的 tweak 設為 6000。230 年起孫權為君主且握有會稽時，`runEvents` 觸發「浮海求夷洲」（`yizhouExpedition`，玩家可納諫作罷）；衛溫、諸葛直 200 年登場於會稽。
- 新城池與新武將一律「附加在 `CITY_DATA`、`OFF_RAW` 最後」。武將 id 就是 `OFF` 的索引，插在中間會讓舊存檔錯位。`loadState` 會替舊存檔補上缺少的城（無主）與武將（在野），也會清掉已從遊戲移除的城池、武將、勢力（曾短暫有過 `yizhou` 勢力，後來移除，城池改為無主）。
- 海路列在 `SEA_EDGES`（同時也在 `EDGES` 內），規則與陸路相同，只是地圖上畫成水藍色虛線。
- 大地圖的可視範圍是 `MAPVW`×`MAPVH`（1180×800）；城名與兵力標籤會畫到 y+47，城池 y 座標不要超過 750。`LAND_NE`、`LAND_JP` 是畫在海面上的陸地（遼東與朝鮮半島、日本列島）。

## 周邊勢力特性（`21-outer.js`）
- 特性定義在 `TRAITS`，各勢力擁有的特性在 `FTRAITS`（以勢力 id 為鍵，所以換君主後仍保留）。查詢用 `hasTrait(f,k)`，顯示用 `traitText(f)`。
- 傷害修正一律走 `fmod(B,u,t,cmd)`：地圖戰（`09` 的 `mapAct`）與快速結算（`05` 的 `qmod`、計略）都已乘上。新增會影響傷害的特性時只改 `fmod`，不要分別改兩套戰鬥。部隊所屬勢力用 `ufac(B,u)`（援軍算援軍自己的勢力）。
- 開戰時的士氣修正在 `traitSetup(B,src,t)`（渡海 −10、僻處海東 −6、鬼道 +8），由 `setupBattle` 呼叫。
- 出征軍糧一律用 `marchFood(f,src,t,n)`，不要再寫 `n/10`；海路對沒有「渡海之民」的勢力加倍。
- 朝貢是外交的兩個新動作：`demand`（中原勢力向周邊勢力要求）與 `pay`（周邊勢力向中原勢力遣使），都由 `doTribute` 處理。

## 天候（`22-weather.js`）
- 戰場天氣存在 `B.wx`（`sun`／`rain`／`fog`／`wind`／`snow`／`heat`，定義在 `WX`）。`setupBattle` 開戰時擲第一天，之後每天開始由 `newDayWx(B)` 重擲（55% 機率沿用前一天）；機率由 `wxWeights(t)` 依月份、地區（`regionOf` 以城池 y 座標分華北／中原／江南）與是否水鄉決定。要強制指定天氣就直接設 `B.wx`（赤壁事件設為 `wind`）。
- 天氣效果的掛接點：傷害走 `wxMod(B,cmd)`（已併入 `fmod`，兩套戰鬥共用）；計略成功率 `stratChance(u,t,B)` 的第三個參數；齊射射程 `wxRange(B,u)`；移動力 `umv(B,u)`（`u.mv` 是不含天氣的基本值，不要直接拿來判斷可否移動）；每日士氣 `wxDayEnd(B)`。
- 大地圖天災存在 `S.climate[地區]={k,until}`（`drought`／`bumper`／`flood`／`snow`／`locust`），每月由 `monthlyClimate()` 擲出。查詢用 `climateOf(城)`；秋收乘 `harvestMod(c)`；`marchFood` 已乘上 `marchWx(src,t)`（水患、大雪 ×1.5）。

## 線上版與帳號存檔（`23-cloud.js`）
- `npm run build` 另外輸出 `dist/artifact.html` 與 `dist/artifact-public.html`（內容相同，沒有 doctype／html／head／body 外殼），用來發布成 Claude Artifact。帳號版 https://claude.ai/artifact/H5mKdmvgaNSp4S61SXFS5H 發布時宣告能力 `{user:{scopes:["profile"]},db:{}}`；公開版 https://claude.ai/artifact/1MruKAVHGVTEHaossCR5au 不宣告任何能力。更新時用同一個檔案路徑重新發布（或帶 `url`），網址才不會變；重新發布帳號版時不要傳 `capabilities`，會沿用原本的宣告。
- 宣告 `db` 的 Artifact 只能給同一個組織內登入的成員使用，不能公開分享，所以才分成兩個網址。
- 帳號存檔寫在 `data/users/<觀看者 id>/slot1~3`（平台保證只有本人讀得到），內容是 `{v,savedAt,scn,fname,year,month,json}`，`json` 是 `dumpState()` 的字串；單一文件上限 256 KiB，程式以 250 KiB 把關。
- `cloudInit()` 在 `window.claude.use` 不存在、或 `use("user")`／`use("db")` 回傳 `null` 時靜默停用（`CLOUD.state==='off'`），本機開 `dist/index.html` 不受影響。
- 啟動程式在 `99-boot.js`，必須是最後一個模組。新增模組請用 21～98 之間的編號。
- `tests/cloud.cjs` 用假的 `window.claude` 測存入、讀取、刪除與存檔大小，已接進 `npm run sim`。

## 公開部署（Vercel）
- 公開網址 https://qunxiong-zhulu.vercel.app（Vercel 專案 `qunxiong-zhulu`，帳號 alberthsiao-4368／團隊 idozone）。更新方式：`npm run deploy`，會重新建置、只把 `dist/index.html` 複製到 `deploy/qunxiong-zhulu/` 再 `vercel deploy --prod`；原始碼與測試不會上傳。`deploy/`、`.vercel/` 已列入 `.gitignore`。
- Vercel 版沒有帳號存檔（`window.claude` 不存在，`23-cloud.js` 會靜默停用），只有瀏覽器本機存檔與匯出／匯入。

## 自動模擬（`24-autosim.js`）
- 工具列「自動模擬」讓電腦接管包含玩家在內的所有勢力，連續推進 N 個月，可隨時停止後接手。`SIM.on` 為真時：`aiTurn` 也會替玩家勢力行動；攻打玩家城池的戰鬥不進 `S.incoming`，直接快速結算（`06-ai.js`）；`simAutoChoices()` 把事件（取 primary 選項）、外交提議（友好度 45 以上接受）、俘虜（依君主魅力嘗試登用，敵君主釋放）自動處理掉；`endTurn` 在模擬中不可呼叫。
- 月份推進抽成 `advanceMonth()`（`07-turn.js`），`endTurn` 與 `simMonth()` 共用。要在每月加新的系統，加在 `advanceMonth` 裡，兩邊才會一致；需要玩家回應的東西（視窗）不要放進去，改放佇列再由 `endTurn` 的尾端或 `simAutoChoices` 處理。
- `tests/autosim.cjs`（已接進 `npm run sim`）測連跑三年、手動停止、模擬後可正常結束本月。

## 軍備（`25-gear.js`）
- 每座城有軍備庫 `c.gear={horse,bow,armor,ram}`（戰馬、強弩、鐵甲、衝車；上限見 `GEAR_MAX`）。一律用 `gearOf(c)` 取得、`addGear(c,k,n)` 增加；`mkCity`、`initGear(st)`（開局庫存，遊牧勢力戰馬 12000）與 `loadState` 都會補上這個欄位。
- 內政命令「製造軍備」（`doGear(k,o,c)`）：戰馬／強弩／鐵甲 100 金、看政治；衝車 150 金、看智力。電腦與委任太守用 `aiGearPick` 依城中武將擅長的兵種補最缺的。遊牧勢力各城每月自產戰馬 300（`economy`）。
- `setupBattle` 呼叫 `gearSetup`：攻方依兵種自出發城領取並扣庫存（騎→戰馬、弓→強弩、槍→鐵甲），裝備率存在 `u.gr`（0～1），衝車最多帶十輛存在 `B.ram`；守方就地取用不扣庫存；援軍不配發。
- 效果：`gearMod(u,t,cmd)` 已併入 `fmod`（騎兵突擊最高 +20%、弓兵齊射最高 +25%、槍兵受突擊與齊射傷害最高 −15%）；攻城傷害乘 `ramMod(B)`（十輛滿效 +60%），兩套戰鬥都已套用。
- `finishBattle` 尾端呼叫 `gearReturn(B)`：城破時守方庫存減半；攻方軍備依各兵種存活比例收回到新城（勝）或本城（敗），衝車敗戰折損一半。`doMove` 調兵時軍備（衝車除外）按兵力比例隨軍轉移（`moveGear`）。

## 武將頭像（`26-portrait.js`）
- `portrait(o,px,opts)` 回傳一段內嵌 `<svg>`（viewBox 64×64），完全用程式畫，沒有任何外部圖片，符合單一 HTML 的限制。`opts` 可給 `year`（算年齡用，預設 `S.year`）、`col`（背景色，預設所屬勢力色）、`lord`（是否畫君主冠）。
- 外觀用 `seeded('pt'+姓名)` 決定，所以同一人永遠長一樣；再依能力（武力高→頭盔與鎧甲、濃眉；智政高→進賢冠或綸巾、細眼）、年齡（26 歲以下無鬚，48／60 歲後鬚髮轉灰、轉白）、出身文化（`ptCulture` 依出身城判斷：遊牧皮帽、南蠻羽飾、倭人美豆良、高句麗折風冠、交州頭巾）、是否為君主調整。女性名單在 `PT_FEMALE`。
- 名將的招牌特徵寫在 `PT_SPECIAL`（膚色、鬍型、冠帽、眼罩、羽扇等），要替某人客製就加一筆。結果以 `PT_CACHE` 快取。
- 顯示位置：城池武將表、人才一覽（另有「武將圖鑑」按鈕 `openGallery`）、戰場部隊資訊、單挑畫面、處置俘虜、選君主卡片。六角格上的部隊棋子仍是單字。

## 人物誌（`27-bio.js`）
- `BIO[姓名]={z,y}`：`z` 是依《三國志》撰寫的簡介，`y` 是《演義》情節（可省略）。全部 623 人都有條目；新增武將時要一併補上，測試會檢查。內容是依史書自行撰寫的摘要，不是原文引用；寫作時要區分史實與小說，小說情節放 `y`。
- `bioHTML(o)` 產生含頭像、生卒、能力、志／演兩段的版面；`openBio(id)` 開視窗。所有 `portrait()` 都帶 `data-o`，點擊即開人物誌（戰場中不作用）。
- `introduce(o,why)`：人物加入玩家陣營時推一則事件（`pushEvent`）介紹，每人只介紹一次（`S.intro`），自動模擬中不介紹。掛接點：開局君主（`newGame`）、搜索訪得與登用（`02`）、俘虜歸順（`12`）、登場出仕（`07`）、三顧茅廬與千里走單騎（`13`）。內政命令執行後若佇列有事件會立刻顯示。

## 歷史事件（`28-history.js`）
- `HIST` 陣列資料驅動：`{id,when(D),run(ctx)}`，`when` 回傳情境或 null，只觸發一次（`S.evDone[id]`），由 `advanceMonth` 的 `runHistory()` 每月檢查。文字用 `hz()`（志）、`hy()`（演）產生，玩家有關時用 `pushEvent` 給選項（照史實／改變歷史），電腦則直接套用史實結果。輔助函式 `byName`、`lordIs`、`holds`、`inFac`、`loyAll`、`kill` 可重用。原本的五個事件仍在 `13-events.js` 的 `runEvents`。
- 事件裡若要讓玩家打一場仗，攻玩家城時推進 `S.incoming`（陰平事件的作法），否則用 `setupBattle`＋`autoResolve`。

## 勝利條件（`29-victory.js`）
- 劇本目標 `S.goal={cities,year,done,failed}`（`makeGoal`：開局城數×2＋2，15 年內），`checkGoal` 每月檢查；稱帝 `checkEmperor`（13 城＋傳國玉璽→群臣勸進，`F.emperor=true`，`lordTitle` 會回「皇帝」）；`END_YEAR`（250）一月 `checkSettle` 結算評等（`settleScore`／`rankOf`），結算後 `S.settled=true`，可繼續玩。這三個都在 `advanceMonth`／`endTurn` 尾端呼叫。

## 技能與戰場進階（`30-skills.js`）
- `SKILLS` 定義、`SKILL_OF` 指定名將，其他人依能力由 `skillOf` 推定。傷害走 `skillMod`（已併入 `fmod`），另有 `skillStrat`／`skillMv`／`skillRange`／`skillSiege`／`confImmune`／`afterCharge`（咆哮、威震）／`moraleLoss`（奸雄）。
- 火計：`B.fire[格]=剩餘日`，`fireTargets`、`setFire`、`fireTick`（每日開始由 `runDay` 呼叫；大風延燒、雨天熄滅）。伏兵：`hiddenAt(B,u)`，`targetsFor` 與 `aiPlan` 改用 `visibleFoes`，`mapSVG` 不畫敵方伏兵。圍城：`siegeTick`（地圖戰第 10 日、快速結算第 7 日後守方士氣 −2／日）。

## 政策（`31-policy.js`）
- `POLICY` 三槽（econ／people／mil），`S.policy[勢力]={econ,people,mil,lock}`，`hasPol(f,k)` 查詢。效果散在 `economy`、`doRecruit`、`maxRecruit`、`recruitChance`、`lifeCycle`。電腦用 `aiPolicy`（每月 `aiTurn` 開頭）；玩家用工具列「政策」。民忠事件 `civicEvent` 每月一成機率。

## 人際關係（`32-relations.js`）
- `BONDS`（第一個元素是關係名）、`FEUDS`。`bonded(a,b)`、`feud(a,b)`、`bondLocked(o)`（與君主有羈絆→忠誠 100、不可挖角）、`bondBonus(t,f)`（登用／搜索／俘虜 +0.3）、`feudIn(o,f)`（同營仇敵→忠誠每月 −1 並封頂 65，仇敵是君主則 50）。`monthlyRelations`、`marriageEvent`（孫尚香）在 `advanceMonth`。人物誌顯示關係與技能。

## 手機（`33-mobile.js`）
- `ZOOM.map`／`ZOOM.bmap` 保存縮放狀態，`zoomApply(id)` 套 viewBox 並加上 ＋－⟲ 按鈕；`renderMap`、`drawBattle` 尾端呼叫。拖曳超過 8px 會抑制接下來的 click。`openBattle` 會重設戰場縮放。

## 其他（`34-extras.js`）
- `PREF` 讀寫 localStorage 設定（`sfx`、`summary`、`ach`）。每月摘要 `monthlySummary(上月日期)` 在 `endTurn` 推到事件佇列最前。成就 `ACH`／`unlockAch`／`checkAch`（每月與關鍵時點）；統計用 `stat(k)` 累加到 `S.stats`。音效 `sfx(name)` 以 Web Audio 合成，掛在 `playEv`、事件、月末、勝負。設定區塊 `settingsHTML()` 放在存讀檔視窗。

## 學習功能（`35-learn.js`）
- `TIMELINE`（年表，可附 `S.evDone` 旗標與分歧檢查函式）、`QUOTES`（陳壽評語等原文，附在人物誌）、`GEO`（每座城的今地與地理背景，城池面板顯示；新增城池必須補上，測試會檢查）、`QUIZ`（題目：`[問題,選項×4,答案索引,事件id]`；有事件 id 的題目在該事件觸發後才開放，`runHistory` 與 `13-events` 觸發事件後會用 `quizEvent(id)` 出題）。工具列「年表」。

## 水戰（`36-naval.js`）
- `NAVAL_EDGES` 列出走水路的道路；`setupBattle` 設 `B.naval`。`initMap` 在 `B.T` 建好後呼叫 `navalMap` 把大半地形改成水面（`river`，此時移動成本 1、防禦 1，由 `navalCost`／`navalDef` 覆寫）。`navalMod`（北方攻方 −20%、計略 +30%）與 `shipMod`（樓船齊射 +15%）已併入 `fmod`；`shipMv`（艨艟 +1）併入 `umv`。水面上有部隊時可放火，燒一日、傷害高。

## 電腦策略層（`37-ai2.js`）
- `hegemon()`（城數佔 35% 以上）、`threatened(c,f)`、`aiStrategyMod`（併入出兵評估：受威脅不出兵、對霸主 ×1.3、霸主自身 ×0.85）、`aiCoalition`（`aiDiplomacy` 開頭：非霸主電腦互相結盟並約定共攻霸主）、`aiConcentrate`（出兵前從後方調兵）。城數 8 以上每月最多出兵三路。

## 繼承與熱座（`38-succession.js`）
- `checkFactions` 選出繼承候選後呼叫 `succession(F,cands)`：人類玩家用事件選繼承人（另立他人 40% 分裂），電腦 4 城以上 25% 分裂；`splitOff` 用 `newFaction` 建 `父id_武將id` 的新勢力。
- 熱座：`S.hot`（人類勢力清單）、`S.player`（現在操作者）、`isHuman(f)`。`endTurn` 先走 `hotEndTurn`：未下完令就 `hotSwitch` 換人；全部下完才讓電腦行動、逐一讓各玩家守城（`S.incoming` 依目標篩選）、再 `advanceMonth`。AI 迴圈與來襲判定都改用 `isHuman`。開局畫面勾「多人熱座」後點選 2～4 個勢力。

## 表現（`39-visual.js`）、引導（`40-tutorial.js`）
- `mapArtUnder()`（勢力範圍色塊 `.terr`、山脈 `MTN`、長城）畫在城池之下；`sealSize` 依 `CITY_DATA` 規模。`wxLayer(B)` 在戰場加雨雪動畫層（純 CSS）；`.ov.fire` 有閃爍動畫。背景音樂 `MUSIC`／`musicStart`／`musicStop`，設定 `music` 預設關；戰鬥中 `MUSIC.battle=true` 節奏加快。
- 新手引導 `TUT`：每個步驟有 `when()`，`render()` 尾端 `tutRender()` 顯示第一個未看過且條件成立的步驟；已看過的記在 localStorage `qunxiong-tut`。

## 開源與回饋
- GitHub：https://github.com/alberthsiao/qunxiong-zhulu （公開）。`.github/workflows/ci.yml` 在推送時跑 `npm run sim`。`VERSION`、`REPO_URL` 在 `01-core.js`；設定區「回報問題」用 `reportBug()` 開預填的 issue。改版時更新 `VERSION`，並 `git commit`＋`git push`。
- 排行榜（帳號版）：`cloudScore` 在天下大勢結算時寫 `scores/<uid>_<scn>`，`openLeaderboard` 讀前 20 名並用 `user.profiles` 顯示名字（只存 uid）。

## 平衡與大量模擬
- `node tests/stats.cjs <局數> <月數> <worker索引> <worker數>` 用自動模擬引擎跑大量局數（每局約 0.1 秒／月），結果寫到 `deploy/stats-N.json`；`node tests/stats-report.cjs` 彙整（存活率、平均城數、事件觸發率、各劇本剩餘勢力與霸主）。改動 AI、經濟或戰鬥數值後，跑 500 局（六個 worker 並行約 15 分鐘）比對。
- 2026-09 的基準（500 局、15 年、全委任）：190 年劇本剩餘勢力約 17、最大勢力約 10 城；200 年劇本 11／16；208 年劇本 8／24；赤壁觸發率約 12%。若某次改動讓 190 年劇本剩餘勢力回到 20 以上，代表 AI 又不擴張了。
- 曾犯的錯：「受威脅不出兵」用相鄰敵城兵力總和判定，結果幾乎每城都受威脅、AI 從此停止擴張。現在只看單一最強鄰敵，且受威脅只是減半而非歸零。

## 紀錄與分享（`41-record.js`）
- 存檔欄位 `SLOTS`（1～8）另有 `auto` 欄位，`endTurn` 尾端 `autoSave()`。`S.chron` 由 `log()` 同步記錄重要條目（上限 600），供 `lordBiography()` 生成本局列傳；`openShareCard()` 用 canvas 畫 1200×630 戰績卡（頭像 SVG 需加 xmlns 才能轉圖）。
- 戰報回放：`runDay` 每日開始 `repSnap(B)` 存快照到 `B.rep`；戰鬥結束後「戰報回放」用 `repShow(i)` 覆寫 `B.units` 狀態重繪，`repExit` 還原。

## 劇本（共七個）
- 184 黃巾之亂（han 皇甫嵩、luzhi 盧植、zhangjiao／bocai／zhangmc 黃巾三部、dong 董卓）、190、200、208、219、249 高平陵之變（sima 司馬懿 vs cao 曹爽）、263 三國歸晉（cao 的君主是司馬昭）。新劇本的 `officers` 只能列該年在世的人（測試會檢查），未列的人由 `affOf` 自動歸屬。
- `OUTER` 的 `lord[sc.id]` 可填 `'@'` 表示該劇本此勢力不存在（城池無主）；`until` 搭配 `to` 指定城池歸誰（預設 cao）。`eraStr` 支援中平年號。

## 內容擴充（`42-content.js`）
- 黃巾與朝廷人物誌、`HUI`（演義回目，人物誌顯示）、追加的 `QUOTES`、周邊勢力寶物（`ITEMS.push`）、周邊事件（`HIST.push`：親魏倭王、白狼山、毌丘儉征高句麗）。要加內容優先放這裡。

## 視覺主題（`src/theme.css`）
- 主題層疊在 `styles.css` 之後（`build.mjs` 串接兩個檔），方向是「宣紙、墨線、朱印」：`--verm` 朱紅為唯一強調色（主要按鈕、選取、標題側標、印章）、`--noise` 是內嵌 SVG 的紙紋、`--paper-deep` 用於日誌與戰報底。深色模式在 `theme.css` 開頭另定義這幾個 token。改外觀請改 `theme.css`，`styles.css` 只管版面。
- 頂欄按鈕收成三組選單（`.menu` ＋ `.mtoggle` ＋ `.mlist`，開關邏輯在 `33-mobile.js` 尾端），按鈕 id 不變，其他程式碼照舊用 id 綁事件。新增功能按鈕請放進對應選單（內政／史冊／系統），不要再加到頂欄。

## 已知可改進處
- 玩家身為盟友時不會自動派援軍（不擅自動用玩家兵力）；目前只有電腦勢力會馳援，包含馳援玩家。
- 熱座模式下事件（`pushEvent`）以觸發當下的 `S.player` 判定對象，其他玩家不會收到。
- 電腦勢力不會用火計以外的技能策略（技能是被動生效）；歷史事件只到 263 年，之後沒有西晉滅吳的事件。
- 軍備不能買賣、不能在出征視窗手動指定攜帶量；電腦評估出兵勝算時不考慮雙方軍備。
- 天氣沒有戰場視覺特效（雨絲、雪花），只有文字標示；電腦出兵時不會因天候改期。
- 周邊勢力還沒有專屬歷史事件（例如親魏倭王、七擒孟獲、白狼山之戰）；電腦勢力之間也不會互相朝貢。
- 援軍一律進駐城內與守軍並肩作戰，不會從地圖邊緣入場夾擊攻方。
