// src/components/FilterPanel.tsx
import React from 'react';
import { Filter, X } from 'lucide-react';
import RangeSlider from 'react-range-slider-input';
import 'react-range-slider-input/dist/style.css';

export interface Filters {
  statRanges: {
    ovr: [number, number];
    pac: [number, number];
    sho: [number, number];
    pas: [number, number];
    dri: [number, number];
    def: [number, number];
    phy: [number, number];
  };
  skillMoves: [number, number];
  weakFoot: [number, number];
  playstyles: string[];
  playstylesPlus: string[];
  roles: string[];
}

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  onApply: () => void;
}

// Base playstyles (without '+')
const allPlaystyles = [
  '1v1 Close Down',
  'Acrobatic',
  'Aerial',
  'Anticipate',
  'Block',
  'Bruiser',
  'Chip Shot',
  'Cross Claimer',
  'Dead Ball',
  'Deflector',
  'Far Reach',
  'Far Throw',
  'Finesse Shot',
  'First Touch',
  'Flair',
  'Footwork',
  'Incisive Pass',
  'Intercept',
  'Jockey',
  'Long Ball Pass',
  'Long Throw',
  'Pinged Pass',
  'Power Header',
  'Power Shot',
  'Press Proven',
  'Quick Step',
  'Rapid',
  'Relentless',
  'Slide Tackle',
  'Technical',
  'Tiki Taka',
  'Trickster',
  'Trivela',
  'Whipped Pass',
];

// Available roles including added CAM, LB, RB
const allRoles = ['CDM', 'CM', 'CB', 'ST', 'LM', 'RM', 'LW', 'RM', 'CAM', 'LB', 'RB'];

const FilterPanel: React.FC<FilterPanelProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters,
  onApply,
}) => {
  const updateRange = (
    key: keyof Filters['statRanges'],
    range: [number, number]
  ) => {
    setFilters(f => ({
      ...f,
      statRanges: { ...f.statRanges, [key]: range },
    }));
  };

  const toggle = (
    field: 'roles' | 'playstyles' | 'playstylesPlus',
    value: string
  ) => {
    setFilters(f => {
      const arr = f[field];
      return {
        ...f,
        [field]: arr.includes(value)
          ? arr.filter(x => x !== value)
          : [...arr, value],
      };
    });
  };

  return (
    <div
      className={`fixed right-0 top-0 h-screen w-96 bg-white dark:bg-gray-800 shadow-lg transform transition-transform ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } z-50`}
    >
      <div className="p-6 max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Filter className="w-5 h-5 mr-2 text-primary-600" />
            <h2 className="text-xl">Filtri</h2>
          </div>
          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stat Ranges */}
        {Object.entries(filters.statRanges).map(([stat, range]) => (
          <div key={stat} className="mb-6">
            <h3 className="mb-2 capitalize">{stat} Range</h3>
            <RangeSlider
              min={0}
              max={99}
              step={1}
              value={range as [number, number]}
              onInput={(v: [number, number]) =>
                updateRange(stat as keyof Filters['statRanges'], v)
              }
            />
            <div className="flex justify-between text-sm">
              <span>{range[0]}</span>
              <span>{range[1]}</span>
            </div>
          </div>
        ))}

        {/* Skill Moves / Weak Foot */}
        {(['skillMoves', 'weakFoot'] as const).map(field => (
          <div key={field} className="mb-6">
            <h3 className="mb-2 capitalize">
              {field === 'skillMoves' ? 'Skill Moves' : 'Weak Foot'} Range
            </h3>
            <RangeSlider
              min={0}
              max={5}
              step={1}
              value={filters[field]}
              onInput={(v: [number, number]) =>
                setFilters(f => ({ ...f, [field]: v }))
              }
            />
            <div className="flex justify-between text-sm">
              <span>{filters[field][0]}</span>
              <span>{filters[field][1]}</span>
            </div>
          </div>
        ))}

        {/* Playstyles plain */}
        <div className="mb-6">
          <h3 className="mb-2">Playstyles</h3>
          <div className="flex flex-wrap gap-2">
            {allPlaystyles.map(ps => (
              <button
                key={ps}
                onClick={() => toggle('playstyles', ps)}
                className={`px-3 py-1 rounded ${
                  filters.playstyles.includes(ps)
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                {ps}
              </button>
            ))}
          </div>
        </div>

        {/* Playstyles Plus */}
        <div className="mb-6">
          <h3 className="mb-2">Playstyles+</h3>
          <div className="flex flex-wrap gap-2">
            {allPlaystyles.map(ps => (
              <button
                key={ps}
                onClick={() => toggle('playstylesPlus', ps)}
                className={`px-3 py-1 rounded ${
                  filters.playstylesPlus.includes(ps)
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                {ps}+
              </button>
            ))}
          </div>
        </div>

        {/* Roles */}
        <div className="mb-6">
          <h3 className="mb-2">Roles</h3>
          <div className="flex flex-wrap gap-2">
            {allRoles.map(r => (
              <button
                key={r}
                onClick={() => toggle('roles', r)}
                className={`px-3 py-1 rounded ${
                  filters.roles.includes(r)
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onApply}
          className="w-full py-3 bg-primary-600 text-white rounded-lg"
        >
          Applica Filtri
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;
