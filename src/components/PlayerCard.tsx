// src/components/PlayerCard.tsx

import React from 'react';

interface PlayerCardProps {
  name: string;
  overall: number;
  position: string;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  onClick?: () => void;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  name,
  overall,
  position,
  pace,
  shooting,
  passing,
  dribbling,
  defending,
  physical,
  onClick
}) => {
  return (
    <div 
      onClick={onClick}
      className="border border-gray-300 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow duration-200"
    >
      {/* Header con nome e overall */}
      <div className="flex items-center justify-between mb-2">
        <div className="font-bold text-lg">{name}</div>
        <div className="font-extrabold text-xl text-blue-600">{overall}</div>
      </div>

      {/* Ruolo */}
      <div className="text-gray-600 mb-4">{position}</div>

      {/* Face stats in una griglia 3x2 */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <FaceStat label="PAC" value={pace} />
        <FaceStat label="SHO" value={shooting} />
        <FaceStat label="PAS" value={passing} />
        <FaceStat label="DRI" value={dribbling} />
        <FaceStat label="DEF" value={defending} />
        <FaceStat label="PHY" value={physical} />
      </div>
    </div>
  );
};

const FaceStat: React.FC<{ label: string; value: number }> = ({ label, value }) => {
  return (
    <div className="flex flex-col items-center bg-gray-100 p-2 rounded">
      <span className="text-xs font-semibold text-gray-500">{label}</span>
      <span className="text-sm font-bold text-gray-800">{value}</span>
    </div>
  );
};

export default PlayerCard;
