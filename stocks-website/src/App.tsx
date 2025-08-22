import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import './App.css'
import HomePage from './pages/HomePage'
import StockPage from './pages/StockPage'
import WatchlistPage from './pages/WatchlistPage'
import { useWatchlist } from './store/watchlist'

function Layout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-full">
			<header className="border-b bg-white">
				<div className="mx-auto flex max-w-5xl items-center justify-between p-4">
					<Link to="/" className="text-lg font-semibold">Stocks</Link>
					<nav className="space-x-4 text-sm">
						<Link to="/" className="text-gray-700 hover:text-blue-600">首頁</Link>
						<Link to="/watchlist" className="text-gray-700 hover:text-blue-600">自選股</Link>
					</nav>
				</div>
			</header>
			<main>{children}</main>
			<footer className="border-t bg-white">
				<div className="mx-auto max-w-5xl p-4 text-center text-xs text-gray-500">© {new Date().getFullYear()} Stocks</div>
			</footer>
		</div>
	)
}

function StockWithWatchlist() {
	const { add } = useWatchlist()
	return (
		<div className="space-y-4">
			<div className="mx-auto max-w-5xl p-6 flex justify-end">
				<button onClick={() => {
					const symbol = location.pathname.split('/').pop() || ''
					if (symbol) add(symbol)
				}} className="rounded bg-emerald-600 px-3 py-1 text-white text-sm">加入自選</button>
			</div>
			<StockPage />
		</div>
	)
}

function App() {
	return (
		<BrowserRouter>
			<Layout>
				<Routes>
					<Route path="/" element={<HomePage />} />
					<Route path="/stock/:symbol" element={<StockWithWatchlist />} />
					<Route path="/watchlist" element={<WatchlistPage />} />
				</Routes>
			</Layout>
		</BrowserRouter>
	)
}

export default App
