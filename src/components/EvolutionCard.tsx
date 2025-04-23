import React from 'react';
import { ArrowUpRight, Clock, Award } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

interface Stats {
  ovr: number;
  phy: number;
  def: number;
  pac: number;
  sho: number;
  pas: number;
  dri: number;
}
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
  // calcola la differenza, sempre come stringa '+n' o '-n'
  const diff = (n: number, m: number) => (n - m > 0 ? '+' : '') + (n - m);

  const data = {
    labels: ['Iniziale', ...player.evolutionPath, 'Finale'],
    datasets: [
      {
        data: [
          player.baseStats.ovr,
          ...player.evolutionPath.map((_, i) => player.baseStats.ovr + (i + 1) * 2),
          player.finalStats.ovr,
        ],
        tension: 0.35,
        fill: true,
      },
    ],
  };

  const options = {
    plugins: { legend: { display: false } },
    scales: { y: { min: 0, max: 100 } },
  };

  return (
    <div className="bg-surface-dark rounded-12 p-6 flex flex-col gap-6 transition-transform duration-200 hover:scale-[1.02]">
      {/* header */}
      <div className="flex justify-between">
        <div>
          <h3 className="text-primary font-poppins text-lg">{player.name}</h3>
          <span className="text-text-dark text-xs tracking-wide uppercase">
            {player.position}
          </span>
        </div>
        <div className="flex items-center gap-1 text-text-dark text-xs">
          <Clock size={14} />
          <span>{player.expiryDate}</span>
        </div>
      </div>

      {/* chart */}
      <div className="h-32">
        <Line data={data} options={options} />
      </div>

      {/* stats */}
      <div className="grid grid-cols-3 gap-4">
        {Object.entries(player.baseStats).map(([k, v]) => {
          const delta = diff(player.finalStats[k as keyof Stats], v);
          const up = delta.startsWith('+');
          return (
            <div key={k} className="text-center">
              <div className="uppercase text-[10px] text-text-dark mb-1">{k}</div>
              <div className="text-text-light text-sm font-medium">
                {v}{' '}
                <span className={up ? 'text-success' : 'text-danger'}>
                  {delta}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* footer */}
      <div className="flex justify-between items-center">
        <button className="flex items-center gap-1 text-primary hover:underline text-sm font-medium">
          Dettagli
          <ArrowUpRight size={14} />
        </button>
        <button className="p-2 rounded-full bg-surface hover:bg-surface-dark">
          <Award size={18} className="text-warning" />
        </button>
      </div>
    </div>
  );
}
