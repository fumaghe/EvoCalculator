// src/components/FilterPanel.tsx
import React, { useState } from 'react';
import { Filter, X } from 'lucide-react';
import RangeSlider from 'react-range-slider-input';
import 'react-range-slider-input/dist/style.css';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StatRanges {
  ovr: [number, number];
  phy: [number, number];
  def: [number, number];
}

const FilterPanel: React.FC<FilterPanelProps> = ({ isOpen, onClose }) => {
  const [evolutionType, setEvolutionType] = useState<'free' | 'premium'>('free');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [statRanges, setStatRanges] = useState<StatRanges>({
    ovr: [0, 100],
    phy: [0, 100],
    def: [0, 100],
  });
  const [playstyles, setPlaystyles] = useState<string[]>([]);

  const roles = ['CDM', 'CM', 'CB', 'ST', 'LW', 'RW'];
  const availablePlaystyles = ['Power Header', 'Long Ball Pass', 'Aerial', 'Technical'];

  const handleRoleToggle = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handlePlaystyleToggle = (style: string) => {
    setPlaystyles(prev =>
      prev.includes(style)
        ? prev.filter(s => s !== style)
        : [...prev, style]
    );
  };

  return (
    <div
      className={`fixed right-0 top-0 h-screen w-96 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } z-50`}
    >
      <div className="p-6 max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Filter className="w-5 h-5 mr-2 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Filters</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Evolution Type */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Evolution Type</h3>
          <div className="flex space-x-2">
            {['free', 'premium'].map(type => (
              <button
                key={type}
                onClick={() => setEvolutionType(type as 'free' | 'premium')}
                className={`px-4 py-2 rounded-lg capitalize ${
                  evolutionType === type
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-100'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Roles */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Roles</h3>
          <div className="grid grid-cols-3 gap-2">
            {roles.map(role => (
              <button
                key={role}
                onClick={() => handleRoleToggle(role)}
                className={`px-3 py-2 rounded-lg text-sm ${
                  selectedRoles.includes(role)
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-100'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Stat Ranges */}
        {Object.entries(statRanges).map(([stat, range]) => (
          <div key={stat} className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 capitalize">
              {stat} Range
            </h3>
            <RangeSlider
              min={0}
              max={100}
              step={1}
              value={range}
              onInput={(value: [number, number]) =>
                setStatRanges(prev => ({ ...prev, [stat]: value }))
              }
              className="mb-2"
            />
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>{range[0]}</span>
              <span>{range[1]}</span>
            </div>
          </div>
        ))}

        {/* Playstyles */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Playstyles</h3>
          <div className="space-y-2">
            {availablePlaystyles.map(style => (
              <button
                key={style}
                onClick={() => handlePlaystyleToggle(style)}
                className={`w-full px-4 py-2 rounded-lg text-left ${
                  playstyles.includes(style)
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-100'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Apply Filters Button */}
        <button className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors duration-200">
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;
