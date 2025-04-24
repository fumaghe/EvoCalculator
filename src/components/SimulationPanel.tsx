import React, { useState } from 'react';
import {
  runSimulationPage,
  SimulationResult,
  Evolution,
} from '../services/simulationService';
import { Code, Loader, ChevronLeft, ChevronRight } from 'lucide-react';

import PlayerCard from './PlayerCard';
import PlayerDetailModal from './PlayerDetailModal';
import type { Filters } from './FilterPanel';

interface Props {
  selectedEvos: Evolution[];
  filters: Filters;
}

const RESULTS_PER_PAGE = 30;

/* ────────────────────────────────────────────────────────────────────────── */

const SimulationPanel: React.FC<Props> = ({ selectedEvos, filters }) => {
  /* ----------------------- stato ---------------------------------------- */
  const [results,   setResults]   = useState<SimulationResult[]>([]);
  const [displayed, setDisplayed] = useState<SimulationResult[]>([]);
  const [hasNext,   setHasNext]   = useState(false);
  const [loading,   setLoading]   = useState(false);

  const [selectedPlayer, setSelectedPlayer] = useState<SimulationResult | null>(null);
  const [modalOpen,      setModalOpen]      = useState(false);

  const [page,  setPage]  = useState(1);
  const [query, setQuery] = useState('');

  /* ----------------------- helper filtri -------------------------------- */
  const filterResults = (data: SimulationResult[]): SimulationResult[] => {
    return data.filter(r => {
      const s = r.finalStats;

      /* facestats range */
      for (const [k, [min, max]] of Object.entries(filters.statRanges) as
            ([keyof Filters['statRanges'], [number, number]])[]
      ) {
        if (s[k] < min || s[k] > max) return false;
      }

      /* SM / WF */
      if (s.skillMoves < filters.skillMoves[0] || s.skillMoves > filters.skillMoves[1]) return false;
      if (s.weakFoot   < filters.weakFoot[0]   || s.weakFoot   > filters.weakFoot[1])   return false;

      /* inclusioni multiple */
      if (filters.playstyles.    some(x => !r.playstyles.    includes(x))) return false;
      if (filters.playstylesPlus.some(x => !r.playstylesPlus.includes(x))) return false;
      if (filters.roles.         some(x => !r.roles.         includes(x))) return false;

      return true;
    });
  };

  /* ----------------------- paginazione ---------------------------------- */
  const loadPage = async (p: number) => {
    setLoading(true);

    let skipRaw   = (p - 1) * RESULTS_PER_PAGE;      // indice blocco lordo
    let pageValid: SimulationResult[] = [];
    let moreRaw   = true;

    while (pageValid.length < RESULTS_PER_PAGE && moreRaw) {
      const raw = await runSimulationPage(selectedEvos, skipRaw, RESULTS_PER_PAGE, query);
      if (raw.length < RESULTS_PER_PAGE) moreRaw = false;
      pageValid = [...pageValid, ...filterResults(raw)];
      skipRaw  += RESULTS_PER_PAGE;
    }

    const slice = pageValid.slice(0, RESULTS_PER_PAGE);
    setDisplayed(slice);
    setResults(slice);
    setHasNext(slice.length === RESULTS_PER_PAGE && moreRaw);
    setLoading(false);
  };

  const handleRun        = () => { setPage(1); loadPage(1); };
  const handlePageChange = (p: number) => { setPage(p); loadPage(p); };

  /* ----------------------- UI ------------------------------------------- */
  return (
    <section className="bg-[#161616] rounded-2xl p-6 shadow-inner space-y-8">
      {/* header / actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-lime-400 text-xl font-semibold">Simulation Results</h2>

        <div className="flex flex-wrap gap-3">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search player…"
            className="bg-[#202020] text-gray-200 placeholder-gray-500 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-lime-500 w-56"
          />

          <button
            onClick={handleRun}
            className="flex items-center gap-2 bg-lime-500 hover:bg-lime-400 text-black font-semibold px-4 py-2 rounded-full transition disabled:opacity-60"
            disabled={loading}
          >
            {loading
              ? <Loader className="w-4 h-4 animate-spin" />
              : <Code className="w-4 h-4" />
            }
            Run
          </button>
        </div>
      </div>

      {/* body */}
      {loading && <p className="text-gray-400">Loading…</p>}
      {!loading && displayed.length === 0 && <p className="text-gray-400">No results.</p>}

      {!loading && displayed.length > 0 && (
        <>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5">
            {displayed.map((r, i) => {
              /* ruoli senza suffisso + / ++ */
              const cleanRoles = r.roles.filter(role => !/\+{1,2}$/.test(role));

              return (
                <PlayerCard
                  key={i}
                  name={r.playerName}
                  overall={r.finalStats.ovr}
                  position={cleanRoles.join('/')}
                  pace={r.finalStats.pac}
                  shooting={r.finalStats.sho}
                  passing={r.finalStats.pas}
                  dribbling={r.finalStats.dri}
                  defending={r.finalStats.def}
                  physical={r.finalStats.phy}
                  onClick={() => { setSelectedPlayer(r); setModalOpen(true); }}
                />
              );
            })}
          </div>

          {/* pagination */}
          <div className="flex justify-center items-center gap-4 mt-4">
            <button
              disabled={page === 1}
              onClick={() => handlePageChange(page - 1)}
              className="p-2 bg-[#202020] text-gray-300 rounded-full disabled:opacity-40 hover:bg-[#262626] transition"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-gray-300">Page {page}</span>
            <button
              disabled={!hasNext}
              onClick={() => handlePageChange(page + 1)}
              className="p-2 bg-[#202020] text-gray-300 rounded-full disabled:opacity-40 hover:bg-[#262626] transition"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </>
      )}

      {/* modal */}
      {selectedPlayer && (
        <PlayerDetailModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          name={selectedPlayer.playerName}
          evolutionOrder={selectedPlayer.evolutionOrder}
          /* ruoli “puliti” */
          roles={selectedPlayer.roles.filter(r => !/\+{1,2}$/.test(r))}
          playstyles={selectedPlayer.playstyles}
          playstylesPlus={selectedPlayer.playstylesPlus}
          generalStatsBefore={selectedPlayer.initialStats}
          generalStatsAfter={selectedPlayer.finalStats}
          detailedStatsBefore={selectedPlayer.fullStatsBefore}
          detailedStats={selectedPlayer.fullStats}
        />
      )}
    </section>
  );
};

export default SimulationPanel;
