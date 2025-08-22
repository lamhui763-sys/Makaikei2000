import { create } from 'zustand'

export type WatchlistState = {
	Symbols: string[]
	add: (symbol: string) => void
	remove: (symbol: string) => void
}

function load(): string[] {
	try {
		const raw = localStorage.getItem('watchlist')
		if (!raw) return []
		const arr = JSON.parse(raw)
		return Array.isArray(arr) ? arr : []
	} catch {
		return []
	}
}

function save(symbols: string[]) {
	try {
		localStorage.setItem('watchlist', JSON.stringify(symbols))
	} catch {}
}

export const useWatchlist = create<WatchlistState>((set, get) => ({
	Symbols: load(),
	add: (symbol: string) => {
		const clean = symbol.trim().toUpperCase()
		if (!clean) return
		const next = Array.from(new Set([
			...get().Symbols,
			clean,
		]))
		set({ Symbols: next })
		save(next)
	},
	remove: (symbol: string) => {
		const next = get().Symbols.filter((s) => s !== symbol.toUpperCase())
		set({ Symbols: next })
		save(next)
	},
}))