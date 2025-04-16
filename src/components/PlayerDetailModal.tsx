// src/components/PlayerDetailModal.tsx
import React, { useEffect } from 'react';
import { Stats } from '../services/simulationService';

interface PlayerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  evolutionOrder: string[];
  roles: string[];
  playstyles: string[];
  playstylesPlus: string[];
  generalStatsBefore: Stats;
  generalStatsAfter: Stats;
  detailedStatsBefore: { [stat: string]: number };
  detailedStats: { [stat: string]: number };
}

const generalStatKeys: { key: keyof Stats; label: string }[] = [
  { key: 'ovr',        label: 'Overall' },
  { key: 'pac',        label: 'Pace' },
  { key: 'sho',        label: 'Shooting' },
  { key: 'pas',        label: 'Passing' },
  { key: 'dri',        label: 'Dribbling' },
  { key: 'def',        label: 'Defending' },
  { key: 'phy',        label: 'Physical' },
  { key: 'skillMoves', label: 'Skill Moves' },
  { key: 'weakFoot',   label: 'Weak Foot' },
];

const secondaryStatGroups: { groupName: string; keys: string[] }[] = [
  { groupName: 'Pace',        keys: ['Acceleration','Sprint Speed'] },
  { groupName: 'Shooting',    keys: ['Positioning','Finishing','Shot Power','Long Shots','Volleys','Penalties'] },
  { groupName: 'Passing',     keys: ['Vision','Crossing','Free Kick Accuracy','Short Passing','Long Passing','Curve'] },
  { groupName: 'Dribbling',   keys: ['Agility','Balance','Reactions','Ball Control','Dribbling','Composure'] },
  { groupName: 'Defending',   keys: ['Interceptions','Heading Accuracy','Def Awareness','Standing Tackle','Sliding Tackle'] },
  { groupName: 'Physicality', keys: ['Jumping','Stamina','Strength','Aggression'] },
];

const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({
  isOpen,
  onClose,
  name,
  evolutionOrder,
  roles,
  playstyles,
  playstylesPlus,
  generalStatsBefore,
  generalStatsAfter,
  detailedStatsBefore,
  detailedStats
}) => {
  if (!isOpen) return null;

  const combinedPlaystyles = [
    ...playstyles.map(ps => ({ label: ps, plus: false })),
    ...playstylesPlus.map(ps => ({ label: ps + '+', plus: true }))
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto relative">
        <button
          className="absolute top-2 right-2 p-1 bg-gray-200 dark:bg-gray-700 rounded"
          onClick={onClose}
        >×</button>

        <h2 className="text-2xl font-bold mb-4">{name}</h2>

        {evolutionOrder.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-1">Ordine Evoluzioni:</h3>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {evolutionOrder.join(' → ')}
            </div>
          </div>
        )}

        {/* Statistiche Principali */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Statistiche Principali</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {generalStatKeys.map(({ key, label }) => {
              const before = generalStatsBefore[key];
              const after  = generalStatsAfter[key];
              const delta  = after - before;
              return (
                <div key={key} className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 rounded p-2">
                  <span className="text-sm font-medium">{label}</span>
                  <span className="font-bold">
                    {after}
                    {delta > 0 && (
                      <span className="ml-1 text-green-500">+{delta}</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ruoli Evoluti */}
        {roles.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-1">Ruoli Evoluti:</h3>
            <div className="flex flex-wrap gap-2">
              {roles.map((role,i) => (
                <span key={i} className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm">
                  {role}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Playstyles */}
        {combinedPlaystyles.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-1">Playstyles</h3>
            <div className="flex flex-wrap gap-2">
              {combinedPlaystyles.map((ps,i) => (
                <span
                  key={i}
                  className={
                    ps.plus
                      ? "px-2 py-1 bg-yellow-300 rounded text-sm"
                      : "px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm"
                  }
                >{ps.label}</span>
              ))}
            </div>
          </div>
        )}

        {/* Statistiche Avanzate con delta */}
        {secondaryStatGroups.map(({ groupName, keys }) => (
          <div key={groupName} className="mb-4">
            <h4 className="font-medium mb-2">{groupName}</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {keys.map(stat => {
                const before = detailedStatsBefore[stat] ?? 0;
                const after  = detailedStats[stat]       ?? 0;
                const delta  = after - before;
                return (
                  <div
                    key={stat}
                    className="flex justify-between bg-gray-100 dark:bg-gray-700 rounded p-2"
                  >
                    <span>{stat}</span>
                    <span className="font-semibold">
                      {after}
                      {delta > 0 && (
                        <span className="ml-1 text-green-500">+{delta}</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

      </div>
    </div>
  );
};

export default PlayerDetailModal;
