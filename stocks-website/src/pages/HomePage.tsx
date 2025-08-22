import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useWatchlist } from '../store/watchlist'

export default function HomePage() {
	const navigate = useNavigate()
	const [input, setInput] = useState('')
	const { Symbols, add, remove } = useWatchlist()

	function onSubmit(e: React.FormEvent) {
		e.preventDefault()
		const s = input.trim().toUpperCase()
		if (!s) return
		navigate(`/stock/${encodeURIComponent(s)}`)
	}

	return (
		<div className="mx-auto max-w-5xl p-6 space-y-6">
			<h1 className="text-2xl font-semibold">股票網站</h1>
			<form onSubmit={onSubmit} className="flex gap-2">
				<input
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="輸入股票代碼，例如 AAPL、TSLA、0700.HK"
					className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
				<button className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">查詢</button>
			</form>

			<section className="space-y-2">
				<div className="text-sm font-medium">自選股</div>
				<div className="flex flex-wrap gap-2">
					{Symbols.length === 0 && <div className="text-sm text-gray-500">尚未添加自選</div>}
					{Symbols.map((s) => (
						<div key={s} className="flex items-center gap-2 rounded border bg-white px-2 py-1 text-sm">
							<button onClick={() => navigate(`/stock/${encodeURIComponent(s)}`)} className="text-blue-600 hover:underline">{s}</button>
							<button onClick={() => remove(s)} className="text-gray-500 hover:text-red-600">×</button>
						</div>
					))}
				</div>

				<div className="flex gap-2 pt-2">
					<input
						placeholder="添加到自選，例如 MSFT"
						onKeyDown={(e) => {
							if (e.key === 'Enter') {
								const v = (e.target as HTMLInputElement).value.trim()
								if (v) { add(v); (e.target as HTMLInputElement).value = '' }
							}
						}}
						className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<button onClick={() => { if (input) add(input) }} className="rounded border px-3 py-2 text-sm">添加</button>
				</div>
			</section>
		</div>
	)
}