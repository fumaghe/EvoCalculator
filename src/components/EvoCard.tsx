import React, { useState } from 'react';
import { Calendar, Clock, Coins, ChevronDown } from 'lucide-react';
import { Evolution } from '../types';

export default function EvolutionCard({ evo }: { evo: Evolution }) {
  const [open, setOpen] = useState(false);

  /* date / costo -------------------------------------------------------- */
  const costVal   = Number(evo.cost.replace(/[^0-9]/g, '')) || 0;
  const unlock    = new Date(evo.unlock_date);
  const expire    = new Date(evo.expires_on);
  const daysLeft  = Math.max(0, Math.ceil((expire.getTime() - Date.now()) / 8.64e7));

  /* requisiti ----------------------------------------------------------- */
  const reqItems = Object.entries(evo.requirements).map(([k, v]) => (
    <li key={k} className="flex justify-between">
      <span className="capitalize">{k}</span>
      <span className="text-lime-400">{v}</span>
    </li>
  ));

  /* upgrades filtrati --------------------------------------------------- */
  const showKeys = [
    'Rarity','Role','Role+','Role++','PlayStyle','PlayStyle+',
    'Overall','Pace','Shooting','Passing','Dribbling',
    'Defending','Physicality','SM','WF',
  ];

  /** `total_upgrades` può mancare: castiamo a Array<[string,string]> */
  const upgrades = (Object.entries(evo.total_upgrades ?? {}) as Array<[string, string]>)
    .filter(([k]) => showKeys.some(s => k.startsWith(s)));

  return (
    <div className="bg-[#202020] rounded-xl p-5 border border-[#2a2a2a] flex flex-col gap-3">
      {/* header ----------------------------------------------------------- */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-lime-400">{evo.name}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full
          ${daysLeft<=1 ? 'bg-red-500/30 text-red-400'
            : daysLeft<=3 ? 'bg-yellow-500/30 text-yellow-400'
            : 'bg-gray-600/30 text-gray-300'}`}>
          {daysLeft} d
        </span>
      </div>

      {/* date & costo ----------------------------------------------------- */}
      <div className="text-xs text-gray-400 grid grid-cols-3 gap-2">
        <div className="flex items-center gap-1"><Calendar size={12}/> {unlock.toLocaleDateString()}</div>
        <div className="flex items-center gap-1"><Clock   size={12}/> {expire.toLocaleDateString()}</div>
        <div className="flex items-center gap-1 justify-end"><Coins size={12}/> {costVal ? costVal.toLocaleString() : 'FREE'}</div>
      </div>

      {/* requisiti -------------------------------------------------------- */}
      <ul className="mt-2 space-y-1 text-sm text-gray-300">{reqItems}</ul>

      {/* upgrades toggle -------------------------------------------------- */}
      {upgrades.length>0 && (
        <>
          <button
            onClick={()=>setOpen(o=>!o)}
            className="flex items-center gap-1 text-xs text-primary-400 mt-1 hover:underline"
          >
            <ChevronDown size={14} className={`transition ${open?'rotate-180':''}`}/>
            {open ? 'Nascondi upgrade' : 'Mostra upgrade'}
          </button>

          {open && (
            <ul className="mt-2 text-xs text-gray-300 grid grid-cols-2 gap-x-2 gap-y-1">
              {upgrades.map(([k,v])=>(
                <li key={k} className="flex justify-between">
                  <span className="truncate mr-2">{k}</span>
                  <span className="text-lime-400">{v}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
