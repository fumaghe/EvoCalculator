// src/components/Dashboard.tsx
import React, { useState } from 'react';
import { ChevronRight, Filter as FilterIcon, Download, Share2 } from 'lucide-react';
import EvoSelector from './EvoSelector';
import SimulationPanel from './SimulationPanel';
import FilterPanel, { Filters } from './FilterPanel';
import { Evolution } from '../types';

export default function Dashboard() {
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [selectedEvos, setSelectedEvos] = useState<Evolution[]>([]);
  const [targetRole, setTargetRole] = useState('CDM');
  const [filters, setFilters] = useState<Filters>({
    statRanges: { ovr: [0,99], pac: [0,99], sho: [0,99], pas: [0,99], dri: [0,99], def: [0,99], phy: [0,99] },
    skillMoves: [0,5],
    weakFoot:   [0,5],
    playstyles: [],
    playstylesPlus: [],
    roles: []
  });

  return (
    <div className="pt-20 space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-gray-600 dark:text-gray-400">
        <span>Dashboard</span>
        <ChevronRight className="mx-2 w-4 h-4" />
        <span className="text-gray-800 dark:text-gray-200">Overview</span>
      </nav>

      {/* Evo Selector */}
      <EvoSelector onSelectionChange={setSelectedEvos} />

      {/* Target Role & Advanced Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-1">
            Ruolo Target
          </label>
          <input
            type="text"
            value={targetRole}
            onChange={e => setTargetRole(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="md:col-span-2 flex justify-end">
          <button
            onClick={() => setFilterPanelOpen(true)}
            className="btn btn-secondary"
          >
            Apri Filtri Avanzati
          </button>
        </div>
      </div>

      {/* Simulation Panel */}
      <SimulationPanel selectedEvos={selectedEvos} targetRole={targetRole} />

      {/* Filter Drawer */}
      <FilterPanel
        isOpen={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
        filters={filters}
        setFilters={setFilters}
        onApply={() => setFilterPanelOpen(false)}
      />
    </div>
  );
}
