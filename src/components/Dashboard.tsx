// src/components/Dashboard.tsx
import React, { useState } from 'react';
import { ChevronRight, Filter as FilterIcon, Download, Share2 } from 'lucide-react';
import EvoSelector, { Evolution } from './EvoSelector';
import SimulationPanel from './SimulationPanel';
import FilterPanel, { Filters } from './FilterPanel';

const Dashboard: React.FC = () => {
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [selectedEvos, setSelectedEvos] = useState<Evolution[]>([]);
  const [targetRole, setTargetRole] = useState("CDM");

  // Stato e handler per i filtri
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

  const handleApplyFilters = () => {
    // qui potresti sollevare un evento o aggiornare SimulationPanel via context/props
    setFilterPanelOpen(false);
  };

  return (
    <div className="pt-16">
      {/* Breadcrumb */}
      <nav className="flex mb-6" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <span className="text-gray-700 dark:text-gray-300">Dashboard</span>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="ml-1 text-gray-500 dark:text-gray-400">Overview</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Welcome Section */}
      <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to Evolution Simulator
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Seleziona le evoluzioni dalla lista qui sotto, imposta il ruolo target ed esegui la simulazione per vedere come i tuoi giocatori migliorano.
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setFilterPanelOpen(true)}
              className="flex items-center px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <FilterIcon className="w-4 h-4 mr-2" />
              <span>Filters</span>
            </button>
            <button className="flex items-center px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600">
              <Download className="w-4 h-4 mr-2" />
              <span>Export</span>
            </button>
            <button className="flex items-center px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600">
              <Share2 className="w-4 h-4 mr-2" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Selector */}
      <EvoSelector onSelectionChange={setSelectedEvos} />

      {/* Ruolo target */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ruolo Target</label>
        <input
          type="text"
          value={targetRole}
          onChange={e => setTargetRole(e.target.value)}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Simulation Panel */}
      <SimulationPanel selectedEvos={selectedEvos} targetRole={targetRole} />

      {/* Filter Panel */}
      <FilterPanel
        isOpen={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
        filters={filters}
        setFilters={setFilters}
        onApply={handleApplyFilters}
      />
    </div>
  );
};

export default Dashboard;
