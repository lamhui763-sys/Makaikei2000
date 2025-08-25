import { useNavigate } from 'react-router-dom'
import { useWatchlist } from '../store/watchlist'

export default function WatchlistPage() {
	const { Symbols, remove } = useWatchlist()
	const navigate = useNavigate()
	return (
		<div className="mx-auto max-w-5xl p-6 space-y-4">
			<h2 className="text-xl font-semibold">自選股</h2>
			<div className="flex flex-wrap gap-2">
				{Symbols.length === 0 && <div className="text-sm text-gray-500">尚未添加自選</div>}
				{Symbols.map((s) => (
					<div key={s} className="flex items-center gap-2 rounded border bg-white px-2 py-1 text-sm">
						<button onClick={() => navigate(`/stock/${encodeURIComponent(s)}`)} className="text-blue-600 hover:underline">{s}</button>
						<button onClick={() => remove(s)} className="text-gray-500 hover:text-red-600">×</button>
					</div>
				))}
			</div>
		</div>
	)
}