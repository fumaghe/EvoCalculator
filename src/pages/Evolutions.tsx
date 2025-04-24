import React, { useEffect, useMemo, useState } from 'react';
import { Search, Filter as FilterIcon, X } from 'lucide-react';
import RangeSlider from 'react-range-slider-input';
import 'react-range-slider-input/dist/style.css';

import EvolutionCard from '../components/EvoCard';
import { Evolution } from '../types';

/* --------------- filtri disponibili ------------------------------------ */
interface EvoFilters {
  search: string;
  maxCost: number;          // 0 = qualunque
  freeOnly: boolean;
  position: string;         // '' = tutte
}

const initialFilters: EvoFilters = {
  search: '',
  maxCost: 0,
  freeOnly: false,
  position: '',
};

const allRoles = ['ST','CF','CAM','CM','CDM','LM','RM','LW','RW','LB','RB','CB'];

/* ----------------------------------------------------------------------- */
export default function EvolutionsPage() {
  const [allEvos, setAllEvos]   = useState<Evolution[]>([]);
  const [filters, setFilters]   = useState<EvoFilters>(initialFilters);
  const [drawer,  setDrawer]    = useState(false);

  /* fetch ---------------------------------------------------------------- */
  useEffect(()=>{
    fetch('/data/evo.json')
      .then(r=>r.json())
      .then(setAllEvos)
      .catch(console.error);
  },[]);

  /* filtered + ordinate --------------------------------------------------- */
  const shown = useMemo(()=>{
    const f = allEvos.filter(e=>{
      if (filters.search &&
          !e.name.toLowerCase().includes(filters.search.toLowerCase())) return false;

      const costNum = Number(e.cost.replace(/[^0-9]/g,''));
      if (filters.freeOnly && costNum>0) return false;
      if (filters.maxCost && costNum>filters.maxCost) return false;

      if (filters.position) {
        const pos = e.requirements['Position']?.toUpperCase() || '';
        if (pos && !pos.split(/[\/;]/).includes(filters.position)) return false;
      }
      return true;
    });

    return f.sort((a,b)=>
      new Date(a.expires_on).getTime() - new Date(b.expires_on).getTime()
    );
  },[allEvos,filters]);

  /* --------------------------------------------------------------------- */
  return (
    <div className="pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-6 text-lime-400 flex items-center gap-2">
        Evolutions
        <span className="text-sm font-normal text-gray-400">
          ({shown.length}/{allEvos.length})
        </span>
      </h1>

      {/* top-bar ---------------------------------------------------------- */}
      <div className="flex gap-3 flex-col md:flex-row md:items-center mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Cerca evoluzione..."
            value={filters.search}
            onChange={e=>setFilters(f=>({...f,search:e.target.value}))}
            className="w-full bg-[#161616] text-gray-200 placeholder-gray-500 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
        </div>
        <button
          onClick={()=>setDrawer(true)}
          className="flex items-center gap-1 px-4 py-2 rounded-lg bg-[#262626] text-gray-200 hover:bg-[#2e2e2e]"
        >
          <FilterIcon size={16}/>
          Filtri
        </button>
      </div>

      {/* grid ------------------------------------------------------------- */}
      {shown.length===0 && <p className="text-gray-400 italic">Nessuna evolution trovata.</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
        {shown.map(evo=>(
          <EvolutionCard key={evo.id} evo={evo}/>
        ))}
      </div>

      {/* drawer ----------------------------------------------------------- */}
      <div className={`
        fixed right-0 top-0 h-screen w-80 bg-[#1b1b1b] border-l border-[#2a2a2a]
        transform transition-transform z-50 ${drawer?'translate-x-0':'translate-x-full'}
      `}>
        <div className="p-6 overflow-y-auto h-full scrollbar-hide">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-200 flex items-center gap-2">
              <FilterIcon size={18}/>
              Filtri
            </h2>
            <button onClick={()=>setDrawer(false)}><X size={18}/></button>
          </div>

          {/* costo -------------------------------------------------------- */}
          <div className="mb-6">
            <h3 className="mb-2 text-gray-300">Costo max (coins)</h3>
            <RangeSlider
              min={0} max={100_000} step={1_000}
              value={[0, filters.maxCost||100_000]}
              onInput={([,max]:[number,number])=>
                setFilters(f=>({...f,maxCost:max===100_000?0:max}))}
            />
            <p className="text-sm text-gray-400 mt-1">
              {filters.maxCost?`≤ ${filters.maxCost.toLocaleString()}`:'Qualunque'}
            </p>
            <label className="flex items-center gap-2 text-sm mt-2">
              <input
                type="checkbox"
                checked={filters.freeOnly}
                onChange={e=>setFilters(f=>({...f,freeOnly:e.target.checked}))}
              />
              Solo gratuite
            </label>
          </div>

          {/* posizione ---------------------------------------------------- */}
          <div className="mb-6">
            <h3 className="mb-2 text-gray-300">Posizione richiesta</h3>
            <div className="flex flex-wrap gap-2">
              {allRoles.map(r=>(
                <button
                  key={r}
                  onClick={()=>
                    setFilters(f=>({...f,position:f.position===r?'':r}))}
                  className={`
                    px-3 py-1 rounded-full text-sm
                    ${filters.position===r
                      ?'bg-primary-600 text-white'
                      :'bg-[#2a2a2a] text-gray-300 hover:bg-[#333]'}
                  `}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* reset -------------------------------------------------------- */}
          <button
            onClick={()=>setFilters(initialFilters)}
            className="w-full py-3 bg-lime-500/20 text-lime-400 rounded-lg mt-6"
          >
            Reset filtri
          </button>
        </div>
      </div>
    </div>
  );
}
