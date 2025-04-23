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

export default function PlayerCard({
  name, overall, position,
  pace, shooting, passing, dribbling, defending, physical,
  onClick
}: PlayerCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-card border border-accent rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow duration-200"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-text-light font-bold text-lg">{name}</div>
        <div className="text-accent font-extrabold text-xl">{overall}</div>
      </div>
      <div className="text-text-base/80 mb-4">{position}</div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[ ['PAC', pace], ['SHO', shooting], ['PAS', passing],
           ['DRI', dribbling], ['DEF', defending], ['PHY', physical]
        ].map(([lbl, val])=>(
          <div
            key={lbl}
            className="bg-background p-2 rounded-lg flex flex-col items-center"
          >
            <span className="text-xs font-semibold text-text-base">{lbl}</span>
            <span className="text-sm font-bold text-text-light">{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}