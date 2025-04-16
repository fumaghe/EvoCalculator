// EvolutionCard.tsx
import React from 'react';
import { ArrowUpRight, Clock, Award } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface PlayerStats {
  ovr: number;
  phy: number;
  def: number;
  pac: number;
  sho: number;
  pas: number;
  dri: number;
}

interface EvolutionCardProps {
  player: {
    name: string;
    position: string;
    baseStats: PlayerStats;
    finalStats: PlayerStats;
    expiryDate: string;
    evolutionPath: string[];
  };
}

const EvolutionCard: React.FC<EvolutionCardProps> = ({ player }) => {
  const statDifference = (final: number, base: number) => {
    const diff = final - base;
    return diff > 0 ? `+${diff}` : diff;
  };

  const chartData = {
    labels: ['Base', ...player.evolutionPath],
    datasets: [
      {
        label: 'OVR Progression',
        data: [player.baseStats.ovr, 85, 87, 89, player.finalStats.ovr],
        borderColor: 'rgb(14, 165, 233)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        min: Math.min(player.baseStats.ovr - 5, 0),
        max: Math.max(player.finalStats.ovr + 5, 100),
      },
    },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{player.name}</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">{player.position}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500 dark:text-gray-400">{player.expiryDate}</span>
        </div>
      </div>

      <div className="mb-6">
        <Line data={chartData} options={chartOptions} className="h-32" />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {Object.entries(player.baseStats).map(([stat, value]) => (
          <div key={stat} className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">{stat}</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {value}{' '}
              <span
                className={`text-xs ${
                  statDifference(player.finalStats[stat as keyof PlayerStats], value).toString().startsWith('+')
                    ? 'text-green-500'
                    : 'text-red-500'
                }`}
              >
                {statDifference(player.finalStats[stat as keyof PlayerStats], value)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <button className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center">
          View Details
          <ArrowUpRight className="w-4 h-4 ml-1" />
        </button>
        <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
          <Award className="w-5 h-5 text-gray-400 hover:text-primary-600" />
        </button>
      </div>
    </div>
  );
};

export default EvolutionCard;
