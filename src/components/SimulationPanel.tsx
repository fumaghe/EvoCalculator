// src/components/SimulationPanel.tsx
import React, { useState } from 'react';
import {
  runSimulationPage,
  SimulationResult,
  Evolution
} from '../services/simulationService';
import { Code, Loader } from 'lucide-react';
import PlayerCard from './PlayerCard';
import PlayerDetailModal from './PlayerDetailModal';

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
  const [loading, setLoading] = useState(false);

  const [selectedPlayer, setSelectedPlayer] = useState<SimulationResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // Carica una pagina di risultati
  const loadPage = async (page: number, query: string) => {
    setLoading(true);
    const skip = (page - 1) * RESULTS_PER_PAGE;
    const data = await runSimulationPage(
      selectedEvos,
      targetRole,
      skip,
      RESULTS_PER_PAGE,
      query
    );
    setResults(data);
    setLoading(false);
  };

  // Esegui il calcolo solo qui, al click
  const handleRun = () => {
    setCurrentPage(1);
    loadPage(1, searchQuery);
  };

  // Aggiorna solo la query, non ricalcola automaticamente
  const handleSearch = (q: string) => {
    setSearchQuery(q);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    loadPage(newPage, searchQuery);
  };

  const openModal = (p: SimulationResult) => {
    setSelectedPlayer(p);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setSelectedPlayer(null);
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm mt-8">
      <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Risultati Simulazione
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Cerca per nome..."
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            className="p-2 border border-gray-300 rounded-md"
          />
          <button
            onClick={handleRun}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            {loading
              ? <Loader className="animate-spin w-5 h-5 mr-2" />
              : <Code className="w-5 h-5 mr-2" />
            }
            Carica
          </button>
        </div>
      </div>

      {loading && <p>Caricamento risultati...</p>}
      {!loading && results.length === 0 && <p>Nessun risultato.</p>}

      {!loading && results.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {results.map((res, idx) => (
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
                onClick={() => openModal(res)}
              />
            ))}
          </div>
          <div className="mt-4 flex justify-center items-center gap-2">
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
          onClose={closeModal}
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
