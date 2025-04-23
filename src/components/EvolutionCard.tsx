/* EvolutionCard.tsx */
import React from 'react';
import { ArrowUpRight, Clock, Award } from 'lucide-react';
import { Line } from 'react-chartjs-2';

interface Stats { ovr: number; phy: number; def: number; pac: number; sho: number; pas: number; dri: number; }
interface Props {
  player: {
    name: string;
    position: string;
    baseStats: Stats;
    finalStats: Stats;
    expiryDate: string;
    evolutionPath: string[];
  };
}

export default function EvolutionCard({ player }: Props) {
  const diff = (n: number, m: number) => `${n - m > 0 ? '+' : ''}${n - m}`;

  const data = {
    labels: ['Iniziale', ...player.evolutionPath, 'Finale'],
    datasets: [
      {
        data: [
          player.baseStats.ovr,
          ...player.evolutionPath.map((_, i) => player.baseStats.ovr + (i + 1) * 2),
          player.finalStats.ovr
        ],
        tension: 0.3
      }
    ]
  };

  return (
    <div className="w-[240px] bg-surface-dark rounded-2xl p-4 flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow duration-200 relative">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="text-primary font-semibold text-lg">{player.name}</h3>
          <span className="text-text-dark text-xs italic">{player.position}</span>
        </div>
        <div className="flex items-center text-text-dark text-xs">
          <Clock size={14} className="mr-1" />
          <span>{player.expiryDate}</span>
        </div>
      </div>

      <div className="mb-4 h-24">
        <Line
          data={data}
          options={{ plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100 } } }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {Object.entries(player.baseStats).map(([stat, value]) => {
          const change = diff(player.finalStats[stat as keyof Stats], value);
          const isPositive = change.startsWith('+');
          return (
            <div key={stat} className="text-center">
              <div className="uppercase text-2xs text-text-dark mb-1">{stat}</div>
              <div className="text-sm font-medium text-text-light">
                {value}{' '}
                <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
                  {change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center">
        <button className="flex items-center gap-1 text-primary text-sm font-medium hover:underline">
          Dettagli
          <ArrowUpRight size={14} />
        </button>
        <button className="p-2 rounded-full bg-surface-dark hover:bg-surface transition duration-200">
          <Award size={18} className="text-yellow-500" />
        </button>
      </div>
    </div>
  );
}