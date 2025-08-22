export type HistoryPoint = { timestamp: number; open: number; high: number; low: number; close: number; volume: number }

export async function fetchQuote(symbol: string) {
	const res = await fetch(`/api/quote/${encodeURIComponent(symbol)}`)
	if (!res.ok) throw new Error('Quote fetch failed')
	return res.json()
}

export async function fetchHistory(symbol: string, range: string = '1mo', interval: string = '1d') {
	const res = await fetch(`/api/history/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`)
	if (!res.ok) throw new Error('History fetch failed')
	return res.json()
}