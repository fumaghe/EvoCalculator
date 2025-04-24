import React, { useState } from 'react';
import { ChevronRight, SlidersHorizontal } from 'lucide-react';
import EvoSelector       from './EvoSelector';
import SimulationPanel   from './SimulationPanel';
import FilterPanel, { Filters } from './FilterPanel';
import { Evolution }     from '../types';

export default function Dashboard() {

  const [filterOpen, setFilterOpen] = useState(false);
  const [selected,   setSelected]   = useState<Evolution[]>([]);

  /* 🔑 unico stato filtri */
  const [filters, setFilters] = useState<Filters>({
    statRanges: { ovr:[0,99], pac:[0,99], sho:[0,99], pas:[0,99], dri:[0,99], def:[0,99], phy:[0,99] },
    skillMoves:[0,5],
    weakFoot:  [0,5],
    playstyles:[],
    playstylesPlus:[],
    roles:[]
  });

  return (
    <div className="min-h-screen bg-[#141414] text-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 space-y-10">

        {/* breadcrumb */}
        <nav className="flex items-center text-sm text-gray-400">
          <span className="hover:text-lime-400 transition">Dashboard</span>
          <ChevronRight className="mx-2 w-4 h-4" />
          <span className="text-lime-400">Overview</span>
        </nav>

        {/* evo selector */}
        <EvoSelector onSelectionChange={setSelected} />

        {/* filter toggle */}
        <div className="flex justify-end">
          <button
            onClick={() => setFilterOpen(true)}
            className="flex items-center gap-2 bg-[#202020] hover:bg-[#262626] text-gray-200 px-4 py-2 rounded-full ring-1 ring-lime-500/0 hover:ring-lime-500/60 transition"
          >
            <SlidersHorizontal size={16}/> Advanced filters
          </button>
        </div>

        {/* simulation panel */}
        <SimulationPanel
          selectedEvos={selected}
          filters={filters}          /* ⬅ prop filtri unificati */
        />

      </div>

      {/* unico drawer filtri */}
      <FilterPanel
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        setFilters={setFilters}
        onApply={() => setFilterOpen(false)}
      />
    </div>
  );
}
