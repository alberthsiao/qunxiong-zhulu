/* ---------- 啟動（必須是最後一個模組：前面各檔的 const 都要先完成初始化） ---------- */
S=initState(null,'s200');render();
/* 開啟時自動接續上次進度（自動存檔）；沒有就進開局畫面。要開新局走「系統 → 重新開始」 */
(function(){const au=readSlot('auto');if(au&&au.player&&!au.over&&FC[au.player]&&!BT){try{loadState(au);toast(`已接續上次進度：${eraStr()}`);return;}catch(e){console.error('接續進度失敗',e);}}showStart();})();
cloudInit();
