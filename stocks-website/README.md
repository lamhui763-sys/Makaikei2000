# Stocks Website (Vite + React + Express + Yahoo Finance)

A simple股票網站 with search, stock details (chart + stats), and a local watchlist.

## Development

- Install: `npm install`
- Start dev (client + API): `npm run dev`
- Build client: `npm run build`
- Run API only: `npm run server`

Dev server:
- Client: http://localhost:5173
- API: http://localhost:5174 (proxied at /api from the client)

## Environment

No API keys required. Data from `yahoo-finance2`.

## Routes

- `/` 搜索股票代碼、管理自選
- `/stock/:symbol` 查看圖表、行情數據
- `/watchlist` 管理自選股

## Notes

- 自選股持久化在 `localStorage`
- 圖表使用 `react-chartjs-2` + `chart.js`
