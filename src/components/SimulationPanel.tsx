// src/components/SimulationPanel.tsx
import React, { useState } from 'react';
import {
  runSimulationPage,
  SimulationResult,
  Evolution
} from '../services/simulationService';
import { Code, Loader, Filter as FilterIcon } from 'lucide-react';
import PlayerCard from './PlayerCard';
import PlayerDetailModal from './PlayerDetailModal';
import FilterPanel, { Filters } from './FilterPanel';

interface SimulationPanelProps {
  selectedEvos: Evolution[];
  targetRole: string;
}

const RESULTS_PER_PAGE = 30;

const SimulationPanel: React.FC<SimulationPanelProps> = ({
  selectedEvos,
  targetRole
}) => {
  const [results, setResults] = useState<SimulationResult[]>([]);
  const [displayed, setDisplayed] = useState<SimulationResult[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedPlayer, setSelectedPlayer] = useState<SimulationResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    statRanges: {
      ovr: [0, 99],
      pac: [0, 99],
      sho: [0, 99],
      pas: [0, 99],
      dri: [0, 99],
      def: [0, 99],
      phy: [0, 99],
    },
    skillMoves:    [0, 5],
    weakFoot:      [0, 5],
    playstyles:    [],
    playstylesPlus:[],
    roles:         []
  });

  // 1) Fetch “tutto”, 2) applica filtri, 3) fai paginazione client‑side
  const loadAndFilterPage = async (page: number) => {
    setLoading(true);

    // scarico un set ampio (skip=0, limit alto)
    const allResults = await runSimulationPage(
      selectedEvos,
      targetRole,
      0,
      10000,
      searchQuery
    );

    // applico i filtri client‑side
    const filtered = allResults.filter(r => {
      const s = r.finalStats;
      // statRanges
      for (const [key, [min, max]] of Object.entries(filters.statRanges) as ([keyof Filters['statRanges'], [number, number]])[]) {
        if (s[key] < min || s[key] > max) return false;
      }
      // skillMoves & weakFoot
      if (s.skillMoves < filters.skillMoves[0] || s.skillMoves > filters.skillMoves[1]) return false;
      if (s.weakFoot   < filters.weakFoot[0]   || s.weakFoot   > filters.weakFoot[1])   return false;
      // playstyles plain & plus
      if (filters.playstyles.some(ps => !r.playstyles.includes(ps))) return false;
      if (filters.playstylesPlus.some(pp => !r.playstylesPlus.includes(pp))) return false;
      // ruoli
      if (filters.roles.some(role => !r.roles.includes(role))) return false;
      return true;
    });

    // paginazione client‑side
    const start = (page - 1) * RESULTS_PER_PAGE;
    const pageSlice = filtered.slice(start, start + RESULTS_PER_PAGE);

    setResults(filtered);
    setDisplayed(pageSlice);
    setLoading(false);
  };

  const handleRun = () => {
    setCurrentPage(1);
    loadAndFilterPage(1);
  };
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    loadAndFilterPage(newPage);
  };
  const handleApplyFilters = () => {
    setCurrentPage(1);
    loadAndFilterPage(1);
    setFiltersOpen(false);
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm mt-8">
      <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
        <h2 className="text-xl font-semibold">Risultati Simulazione</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Cerca per nome..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="p-2 border rounded-md"
          />
          <button
            onClick={handleRun}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg"
          >
            {loading
              ? <Loader className="animate-spin w-5 h-5 mr-2" />
              : <Code className="w-5 h-5 mr-2" />
            }
            Carica
          </button>
          <button
            onClick={() => setFiltersOpen(true)}
            className="flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg"
          >
            <FilterIcon className="w-5 h-5 mr-2" />
            Filtri
          </button>
        </div>
      </div>

      <FilterPanel
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        setFilters={setFilters}
        onApply={handleApplyFilters}
      />

      {loading && <p>Caricamento…</p>}
      {!loading && displayed.length === 0 && <p>Nessun risultato.</p>}

      {!loading && displayed.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {displayed.map((res, idx) => (
              <PlayerCard
                key={idx}
                name={res.playerName}
                overall={res.finalStats.ovr}
                position={res.roles.join('/')}
                pace={res.finalStats.pac}
                shooting={res.finalStats.sho}
                passing={res.finalStats.pas}
                dribbling={res.finalStats.dri}
                defending={res.finalStats.def}
                physical={res.finalStats.phy}
                onClick={() => {
                  setSelectedPlayer(res);
                  setIsModalOpen(true);
                }}
              />
            ))}
          </div>
          <div className="mt-4 flex justify-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>
            <span>Pagina {currentPage}</span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              className="px-3 py-1 border rounded"
            >
              Next
            </button>
          </div>
        </>
      )}

      {selectedPlayer && (
        <PlayerDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          name={selectedPlayer.playerName}
          evolutionOrder={selectedPlayer.evolutionOrder}
          roles={selectedPlayer.roles}
          playstyles={selectedPlayer.playstyles}
          playstylesPlus={selectedPlayer.playstylesPlus}
          generalStatsBefore={selectedPlayer.initialStats}
          generalStatsAfter={selectedPlayer.finalStats}
          detailedStatsBefore={selectedPlayer.fullStatsBefore}
          detailedStats={selectedPlayer.fullStats}
        />
      )}
    </div>
  );
};

export default SimulationPanel;
