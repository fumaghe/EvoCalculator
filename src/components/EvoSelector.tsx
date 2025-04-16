// src/components/EvoSelector.tsx
import React, { useEffect, useState } from 'react';
import { CheckCircle, Circle } from 'lucide-react';

export interface Evolution {
  id: string;
  name: string;
  unlock_date: string;
  expires_on: string;
  cost: string;
  requirements: { [key: string]: string };
  total_upgrades?: { [key: string]: string };
  challenges: string[];
  upgrades: {
    step: number;
    description: string[];
    effects: { [key: string]: number };
  }[];
  new_positions: string[];
  playstyles_added: string[];
  playstyles_plus_added: string[];
  final_bonus: { [key: string]: string } | {};
  url: string;
}

interface EvoSelectorProps {
  onSelectionChange: (selectedEvos: Evolution[]) => void;
}

const EvoSelector: React.FC<EvoSelectorProps> = ({ onSelectionChange }) => {
  const [evolutions, setEvolutions] = useState<Evolution[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    const loadEvos = async () => {
      try {
        const res = await fetch('/data/evo.json');
        const data = await res.json();
        setEvolutions(data);
      } catch (error) {
        console.error('Errore nel caricamento delle evoluzioni:', error);
      }
    };
    loadEvos();
  }, []);

  const handleToggle = (id: string) => {
    let newSelectedIds: string[];
    if (selectedIds.includes(id)) {
      newSelectedIds = selectedIds.filter(eid => eid !== id);
    } else {
      newSelectedIds = [...selectedIds, id];
    }
    setSelectedIds(newSelectedIds);
    const selectedEvos = evolutions.filter(evo => newSelectedIds.includes(evo.id));
    onSelectionChange(selectedEvos);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Seleziona Evoluzioni</h2>
      <div className="max-h-60 overflow-y-auto">
        {evolutions.map(evo => (
          <div key={evo.id} className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-gray-800 dark:text-white">{evo.name}</span>
            <button onClick={() => handleToggle(evo.id)} className="p-2 focus:outline-none">
              {selectedIds.includes(evo.id) ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <Circle className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EvoSelector;
