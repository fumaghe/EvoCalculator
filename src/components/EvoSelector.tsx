import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Evolution } from '../types';

interface EvoSelectorProps {
  onSelectionChange: (selected: Evolution[]) => void;
}

export default function EvolutionSelector({ onSelectionChange }: EvoSelectorProps) {
  const [allEvos, setAllEvos] = useState<Evolution[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/data/evo.json')
      .then(res => res.json())
      .then((data: Evolution[]) => setAllEvos(data))
      .catch(console.error);
  }, []);

  const toggle = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
    onSelectionChange(allEvos.filter(evo => next.has(evo.id)));
  };

  const filtered = allEvos.filter(evo =>
    evo.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-surface dark:bg-surface-dark rounded-2xl p-6 shadow-md mb-6">
      <h2 className="text-xl font-semibold text-text-light mb-4">
        Seleziona Evoluzioni
      </h2>

      <input
        type="text"
        placeholder="🔍 Cerca evoluzione..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="w-full mb-4 p-3 border border-surface-dark rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
      />

      <div className="flex flex-wrap gap-3 max-h-60 overflow-y-auto">
        {filtered.map(evo => {
          const isSel = selectedIds.has(evo.id);
          return (
            <button
              key={evo.id}
              onClick={() => toggle(evo.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-transform duration-200 flex items-center gap-2
                ${isSel
                  ? 'bg-primary text-background scale-105'
                  : 'bg-surface-dark text-text-dark hover:bg-surface hover:text-text-light'}`
            }
            >
              {evo.name}
              {isSel && <Check size={14} className="text-background" />}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-text-dark">Nessuna evoluzione trovata.</p>
        )}
      </div>
    </div>
  );
}
