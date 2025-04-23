import React from 'react';

interface Props {
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

const statIdx = [
  ['PAC','pace'],
  ['SHO','shooting'],
  ['PAS','passing'],
  ['DRI','dribbling'],
  ['DEF','defending'],
  ['PHY','physical']
] as const;

const PlayerCard: React.FC<Props> = props => {
  const { name, overall, position, onClick } = props;

  return (
    <div
      onClick={onClick}
      className="
        bg-[#1f1f1f] hover:bg-[#262626] rounded-xl p-4 cursor-pointer
        transition shadow-lg hover:-translate-y-1 active:scale-95
      "
    >
      {/* header */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-lime-400 font-semibold truncate max-w-[150px]">{name}</h4>
        <span className="text-lime-400 font-extrabold text-2xl">{overall}</span>
      </div>

      <p className="text-gray-400 text-xs mb-4">{position}</p>

      {/* stats */}
      <div className="grid grid-cols-3 gap-2 text-center text-gray-200 text-xs">
        {statIdx.map(([lbl,key])=>(
          <div key={lbl} className="bg-[#202020] rounded-lg py-1">
            <span className="block text-gray-400 text-[10px]">{lbl}</span>
            <span className="font-bold">
              {(props as any)[key]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerCard;
