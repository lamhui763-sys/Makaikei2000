# Snake Game

簡易貪吃蛇，支援鍵盤與手機觸控（滑動與方向按鈕），含分數與最高分（本機儲存）。

## 執行方式

使用內建的 Python 靜態伺服器：

```bash
python3 -m http.server --directory /workspace/snake-game 5173
```

然後在瀏覽器開啟 `http://localhost:5173`。

## 操作方式
- 鍵盤：方向鍵 / WASD（空白鍵暫停/繼續）
- 手機：在畫布上滑動，或點擊畫面下方方向鍵

---

A simple Snake game with keyboard and mobile touch controls (swipe and on-screen d-pad). Scores and high score are stored locally.

### Run
```bash
python3 -m http.server --directory /workspace/snake-game 5173
```
Open `http://localhost:5173` in your browser.

### Controls
- Keyboard: Arrow keys / WASD (Space to pause/resume)
- Mobile: Swipe on the canvas or tap on-screen d-pad