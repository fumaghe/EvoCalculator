// src/pages/PlayersPage.tsx

import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import Papa, { ParseResult } from 'papaparse'
import PlayerCard from '../components/PlayerCard'
import { Player } from '../types'

const PAGE_SIZE = 30
const SIDES = 2  // quante pagine mostrare a sinistra/destra della corrente

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [search, setSearch] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)

  const loadPage = (page: number) => {
    setLoading(true)
    const start = (page - 1) * PAGE_SIZE
    const end = page * PAGE_SIZE
    let matchCount = 0
    const pageData: Player[] = []

    const config: any = {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      step: (stepResult: any) => {
        const row: Player = stepResult.data
        const name = row.Name?.toString().toLowerCase() ?? ''
        if (name.includes(search.toLowerCase())) {
          matchCount++
          if (matchCount > start && matchCount <= end) {
            pageData.push(row)
          }
        }
      },
      complete: (_: ParseResult<Player>) => {
        setTotalPages(Math.ceil(matchCount / PAGE_SIZE))
        setPlayers(pageData)
        setLoading(false)
      },
      error: (err: any) => {
        console.error(err)
        setLoading(false)
      },
    }

    Papa.parse<Player>('/data/players.csv', config)
  }

  // reset a pagina 1 on search change
  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  // ricarica dati quando cambiano pagina o filtro
  useEffect(() => {
    loadPage(currentPage)
  }, [currentPage, search])

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages || loading) return
    setCurrentPage(page)
  }

  // costruisce array tipo [1, '...', 5,6,7, '...', 20]
  const getPageList = (): (number | string)[] => {
    if (totalPages <= SIDES * 2 + 5) {
      // poche pagine, le mostro tutte
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    const pages: (number | string)[] = []
    const left = Math.max(2, currentPage - SIDES)
    const right = Math.min(totalPages - 1, currentPage + SIDES)

    pages.push(1)
    if (left > 2) pages.push('...')
    for (let p = left; p <= right; p++) {
      pages.push(p)
    }
    if (right < totalPages - 1) pages.push('...')
    pages.push(totalPages)

    return pages
  }

  return (
    <div className="pt-20 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-4 text-lime-400 flex items-center gap-2">
        Giocatori
        <span className="text-sm font-normal text-gray-400">
          Pagina {currentPage} di {totalPages}
        </span>
      </h1>

      {/* Search bar */}
      <div className="flex gap-3 flex-col md:flex-row md:items-center mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Cerca giocatore..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#161616] text-gray-200 placeholder-gray-500 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        </div>
      </div>

      {/* Loading spinner */}
      {loading && (
        <div className="flex justify-center my-6">
          <svg
            className="animate-spin h-8 w-8 text-lime-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        </div>
      )}

      {/* Players grid */}
      {!loading && players.length === 0 && (
        <p className="text-gray-400 italic">Nessun giocatore trovato.</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {players.map((p, idx) => (
          <PlayerCard
            key={idx}
            name={p.Name}
            overall={p.OVR!}
            position={p.Position}
            pace={p.PAC!}
            shooting={p.SHO!}
            passing={p.PAS!}
            dribbling={p.DRI!}
            defending={p.DEF!}
            physical={p.PHY!}
          />
        ))}
      </div>

      {/* Paginação “smart” */}
      <div className="sticky bottom-0 bg-[#161616] py-4 z-20">
        <div className="flex justify-center items-center gap-2 px-4">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className="px-3 py-1 bg-[#262626] text-gray-200 rounded hover:bg-[#2e2e2e] disabled:opacity-50"
          >
            Precedente
          </button>

          {getPageList().map((item, idx) =>
            typeof item === 'number' ? (
              <button
                key={idx}
                onClick={() => goToPage(item)}
                disabled={loading}
                className={`px-3 py-1 rounded whitespace-nowrap ${
                  item === currentPage
                    ? 'bg-lime-500 text-black'
                    : 'bg-[#262626] text-gray-200 hover:bg-[#2e2e2e]'
                }`}
              >
                {item}
              </button>
            ) : (
              <span key={idx} className="px-2 text-gray-400 select-none">
                …
              </span>
            )
          )}

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
            className="px-3 py-1 bg-[#262626] text-gray-200 rounded hover:bg-[#2e2e2e] disabled:opacity-50"
          >
            Successiva
          </button>
        </div>
      </div>
    </div>
  )
}
