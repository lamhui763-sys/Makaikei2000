import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import yahooFinance from 'yahoo-finance2'

const app = express()
const PORT = process.env.PORT ? Number(process.env.PORT) : 5174

app.use(cors())
app.use(express.json())

// Quote endpoint
app.get('/api/quote/:symbol', async (req, res) => {
	try {
		const { symbol } = req.params
		const quote = await yahooFinance.quote(symbol.toUpperCase())
		res.json(quote)
	} catch (err) {
		res.status(500).json({ error: 'Failed to fetch quote', details: String(err) })
	}
})

// Historical endpoint
app.get('/api/history/:symbol', async (req, res) => {
	try {
		const { symbol } = req.params
		const { range = '1mo', interval = '1d' } = req.query
		const results = await yahooFinance.chart(symbol.toUpperCase(), {
			range: String(range),
			interval: String(interval),
		})
		res.json(results)
	} catch (err) {
		res.status(500).json({ error: 'Failed to fetch history', details: String(err) })
	}
})

// In production, serve the built client
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distDir = path.join(__dirname, 'dist')

app.use(express.static(distDir))
// Fallback only for non-API routes
app.get(/^(?!\/api).*/, (req, res) => {
	res.sendFile(path.join(distDir, 'index.html'))
})

app.listen(PORT, () => {
	console.log(`API/Static server listening on http://localhost:${PORT}`)
})