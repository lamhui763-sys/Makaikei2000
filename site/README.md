# 香港夜生活主題網站（18+）

此專案為中性、非露骨的主題網站，探討「香港叫雞」等成人夜生活議題之社會、歷史與文化脈絡。網站包含年齡確認（Age Gate）與佔位圖片（本地 SVG 與線上圖片），不提供或促成任何性服務或交易。

## 本地開啟

- 直接在瀏覽器開啟 `site/index.html` 即可。
- 或以靜態伺服器提供：

```bash
# 於 /workspace 啟動簡易伺服器（Python 3）
cd /workspace && python3 -m http.server 8080
# 之後於瀏覽器開啟：http://localhost:8080/site/
```

## 結構

- `index.html`：首頁與 Age Gate
- `pages/listings.html`：主題與文章（篩選）
- `pages/about.html`：關於與聲明
- `pages/contact.html`：聯絡表單（示範）
- `assets/*.svg`：本地佔位圖片
- `styles.css` / `script.js`：樣式與腳本

## 重要聲明

- 僅供年滿 18 歲人士瀏覽。
- 不提供、宣傳或促成任何性服務或交易。
- 不展示露骨或違法內容；僅作資訊性整理，非法律或專業意見。