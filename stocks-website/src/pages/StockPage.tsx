import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchHistory, fetchQuote } from '../api/client'
import { PriceChart } from '../components/PriceChart'

export default function StockPage() {
	const { symbol = '' } = useParams()
	const [quote, setQuote] = useState<any>(null)
	const [history, setHistory] = useState<any>(null)
	const [error, setError] = useState<string>('')
	const [loading, setLoading] = useState<boolean>(true)

	useEffect(() => {
		let cancelled = false
		async function load() {
			setLoading(true)
			setError('')
			try {
				const [q, h] = await Promise.all([
					fetchQuote(symbol),
					fetchHistory(symbol, '3mo', '1d'),
				])
				if (!cancelled) {
					setQuote(q)
					setHistory(h)
				}
			} catch (e: any) {
				if (!cancelled) setError(e?.message ?? '載入失敗')
			} finally {
				if (!cancelled) setLoading(false)
			}
		}
		if (symbol) load()
		return () => {
			cancelled = true
		}
	}, [symbol])

	const labels = useMemo(() => {
		const timestamps: number[] = history?.chart?.result?.[0]?.timestamp ?? []
		return timestamps.map((t: number) => t * 1000)
	}, [history])

	const closes = useMemo(() => {
		const closeArr: number[] = history?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? []
		return closeArr
	}, [history])

	if (!symbol) return <div className="p-6">未提供代碼</div>
	if (loading) return <div className="p-6">載入中...</div>
	if (error) return <div className="p-6 text-red-600">{error}</div>

	return (
		<div className="mx-auto max-w-5xl p-6 space-y-6">
			<div className="flex items-end justify-between">
				<div>
					<h1 className="text-2xl font-semibold">{quote?.symbol} {quote?.shortName}</h1>
					<p className="text-gray-600">{quote?.exchange} · {quote?.currency}</p>
				</div>
				<div className="text-right">
					<div className="text-3xl font-bold">{quote?.regularMarketPrice}</div>
					<div className="text-sm text-gray-600">{quote?.regularMarketChange} ({quote?.regularMarketChangePercent}%)</div>
				</div>
			</div>

			<section>
				<PriceChart labels={labels} prices={closes} />
			</section>

			<section className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<Stat label="開盤" value={quote?.regularMarketOpen} />
				<Stat label="最高" value={quote?.regularMarketDayHigh} />
				<Stat label="最低" value={quote?.regularMarketDayLow} />
				<Stat label="成交量" value={quote?.regularMarketVolume} />
			</section>
		</div>
	)
}

function Stat({ label, value }: { label: string; value: any }) {
	return (
		<div className="rounded border bg-white p-3">
			<div className="text-xs text-gray-500">{label}</div>
			<div className="text-sm font-semibold">{value ?? '-'}</div>
		</div>
	)
}