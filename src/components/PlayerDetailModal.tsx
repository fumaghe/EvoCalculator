import React, { useEffect, useState } from 'react';
import { Stats } from '../services/simulationService';
import { X, ChevronLeft, ChevronRight, Info } from 'lucide-react';

/* ─────────────────────────── meta & tipi ─────────────────────────── */
const faceKeys: { k: keyof Stats; lbl: string }[] = [
  { k: 'ovr', lbl: 'OVR' },
  { k: 'pac', lbl: 'PAC' },
  { k: 'sho', lbl: 'SHO' },
  { k: 'pas', lbl: 'PAS' },
  { k: 'dri', lbl: 'DRI' },
  { k: 'def', lbl: 'DEF' },
  { k: 'phy', lbl: 'PHY' }
];

interface SecondaryGroup {
  g: string;
  k: string[];
}
const secGroups: SecondaryGroup[] = [
  { g: 'Pace',        k: ['Acceleration', 'Sprint Speed'] },
  { g: 'Shooting',    k: ['Positioning', 'Finishing', 'Shot Power', 'Long Shots', 'Volleys', 'Penalties'] },
  { g: 'Passing',     k: ['Vision', 'Crossing', 'Free Kick Accuracy', 'Short Passing', 'Long Passing', 'Curve'] },
  { g: 'Dribbling',   k: ['Agility', 'Balance', 'Reactions', 'Ball Control', 'Dribbling', 'Composure'] },
  { g: 'Defending',   k: ['Interceptions', 'Heading Accuracy', 'Def Awareness', 'Standing Tackle', 'Sliding Tackle'] },
  { g: 'Physicality', k: ['Jumping', 'Stamina', 'Strength', 'Aggression'] }
];

/* ---------- parse di un’unica riga “Pace +2” ---------- */
function parseLine(line: string): { stat?: keyof Stats; delta?: number } {
  const map: Record<string, keyof Stats> = {
    Overall: 'ovr', Pace: 'pac', Shooting: 'sho', Passing: 'pas',
    Dribbling: 'dri', Defending: 'def', Physicality: 'phy',
    'Skill Moves': 'skillMoves', 'Weak Foot': 'weakFoot'
  };
  const m = line.match(/^([\w\.\s]+)\s+([+\-]\d+)/);    // es. "Pace +2"
  if (!m) return {};
  const stat = map[m[1].trim()];
  if (!stat) return {};
  return { stat, delta: +m[2] };
}

/* ---------- props ---------- */
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  evolutionOrder: string[];
  roles: string[];
  playstyles: string[];
  playstylesPlus: string[];
  generalStatsBefore: Stats;
  generalStatsAfter: Stats;
  detailedStatsBefore: Record<string, number>;
  detailedStats: Record<string, number>;
}

/* ─────────────────────────── component ─────────────────────────── */
const PlayerDetailModal: React.FC<ModalProps> = (p) => {
  const [ideal, setIdeal] = useState<Record<string, Partial<Record<keyof Stats, number>>>>({});

  /* fetch evo.json una sola volta */
  useEffect(() => {
    fetch('/data/evo.json')
      .then(r => r.json())
      .then((evos: any[]) => {
        const obj: Record<string, Partial<Record<keyof Stats, number>>> = {};
        evos.forEach(e => {
          const deltas: Partial<Record<keyof Stats, number>> = {};
          e.upgrades.forEach((u: any) =>
            u.description.forEach((line: string) => {
              const { stat, delta } = parseLine(line);
              if (stat && delta! > 0) deltas[stat] = (deltas[stat] || 0) + delta!;
            })
          );
          obj[e.name] = deltas;
        });
        setIdeal(obj);
      })
      .catch(console.error);
  }, []);

  if (!p.isOpen) return null;

  /* ---------- costruiamo gli step (interp.) ---------- */
  const n = p.evolutionOrder.length;
  const steps: { name: string; stats: Stats }[] = [
    { name: 'Base', stats: { ...p.generalStatsBefore } }
  ];
  p.evolutionOrder.forEach((evo, idx) => {
    const t: Stats = { ...p.generalStatsBefore };
    const factor = (idx + 1) / n;
    faceKeys.forEach(({ k }) => {
      const diff = p.generalStatsAfter[k] - p.generalStatsBefore[k];
      t[k] = Math.round(p.generalStatsBefore[k] + diff * factor);
    });
    steps.push({ name: evo, stats: t });
  });

  /* ---------- efficienza step ---------- */
  const efficiency = (idx: number) => {
    if (idx === 0) return { label: '—', color: '' };
    const prev = steps[idx - 1].stats;
    const curr = steps[idx].stats;
    const evo = steps[idx].name;
    const idealMap = ideal[evo] || {};

    const realGain = faceKeys.slice(1).reduce((s, { k }) => s + (curr[k] - prev[k]), 0);
    const idealGain = Object.values(idealMap).reduce((s, v) => s + (v || 0), 0);

    if (!idealGain) return { label: '—', color: '' };

    const perc = Math.round((realGain / idealGain) * 100);
    const color = perc >= 80 ? 'text-green-400' : perc >= 50 ? 'text-yellow-400' : 'text-red-500';
    return { label: `${perc}%`, color };
  };

  /* playstyles merge */
  const ps = [
    ...p.playstyles.map(x => ({ txt: x, plus: false })),
    ...p.playstylesPlus.map(x => ({ txt: x + '+', plus: true }))
  ];

  /* ──────────────────── RENDER ──────────────────── */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative flex flex-col lg:flex-row bg-[#1b1b1b] rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">

        {/* close */}
        <button onClick={p.onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-200">
          <X className="w-6 h-6" />
        </button>

        {/* LEFT – carta finale */}
        <aside className="w-full lg:w-1/3 p-6 bg-[#161616] flex flex-col items-center gap-6 overflow-y-auto scrollbar-hide">
          <h3 className="text-lime-400 font-bold text-center text-xl">
            {p.name} – {p.generalStatsAfter.ovr} OVR
          </h3>

          <div className="w-48 h-48 rounded-full border-[10px] border-lime-500 flex items-center justify-center">
            <span className="text-4xl text-white font-bold">{p.generalStatsAfter.ovr}</span>
          </div>

          <ul className="w-full grid grid-cols-2 gap-3 text-gray-300 text-sm">
            {faceKeys.slice(1).map(({ k, lbl }) => (
              <li key={k} className="flex justify-between bg-[#202020] rounded-lg px-3 py-2">
                <span>{lbl}</span>
                <span className="text-lime-400 font-semibold">{p.generalStatsAfter[k]}</span>
              </li>
            ))}
          </ul>

          {!!ps.length && (
            <>
              <h4 className="self-start mt-4 mb-2 text-gray-300 font-medium">Playstyles</h4>
              <div className="flex flex-wrap gap-2">
                {ps.map((z, i) => (
                  <span key={i} className={`px-2 py-1 text-xs rounded-full ${z.plus ? 'bg-yellow-400 text-black' : 'bg-[#2a2a2a] text-gray-200'}`}>
                    {z.txt}
                  </span>
                ))}
              </div>
            </>
          )}

          {!!p.roles.length && (
            <>
              <h4 className="self-start mt-4 mb-2 text-gray-300 font-medium">Roles</h4>
              <div className="flex flex-wrap gap-2">
                {p.roles.map(r => (
                  <span key={r} className="px-2 py-1 bg-[#2a2a2a] text-gray-200 text-xs rounded-full">{r}</span>
                ))}
              </div>
            </>
          )}
        </aside>

        {/* RIGHT – timeline + stats */}
        <section className="flex-1 flex flex-col overflow-hidden">
          <h3 className="text-center text-gray-200 font-semibold mt-6">Evolution timeline</h3>

          <div className="relative mt-4 px-8">
            <div id="tl-track" className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">

              {steps.map(({ name, stats }, idx) => {
                const prev = idx > 0 ? steps[idx - 1].stats : stats;
                const deltas = faceKeys
                  .slice(1)
                  .map(({ k, lbl }) => {
                    const d = stats[k] - prev[k];
                    return d > 0 ? `${lbl}+${d}` : null;
                  })
                  .filter(Boolean)
                  .join(' | ');

                const eff = efficiency(idx);

                return (
                  <div key={idx} className="min-w-[200px] shrink-0 bg-[#202020] rounded-lg p-3 snap-start">
                    <h4 className={`text-center font-semibold mb-2 ${idx === 0 ? 'text-white' : 'text-lime-400'}`}>
                      {name}
                    </h4>

                    <ul className="grid grid-cols-2 gap-1 text-[11px] text-gray-300 mb-1">
                      {faceKeys.map(({ k, lbl }) => (
                        <li key={k} className="flex justify-between">
                          <span>{lbl}</span>
                          <span className="font-bold">{stats[k]}</span>
                        </li>
                      ))}
                    </ul>

                    {idx > 0 && (
                      <>
                        <p className="text-[10px] text-gray-400 truncate">{deltas}</p>
                        <div className="flex items-center justify-end gap-1 mt-1 text-xs">
                          <span title="Efficiency = real gain / theoretical gain">
                            <Info className="w-3 h-3 text-gray-400" />
                          </span>
                          <span className={eff.color}>{eff.label}</span>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* arrows */}
            <button
              onClick={() => document.getElementById('tl-track')?.scrollBy({ left: -220, behavior: 'smooth' })}
              className="absolute -left-2 top-1/2 -translate-y-1/2 bg-[#262626] p-2 rounded-full text-gray-300 hover:bg-[#2e2e2e]"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => document.getElementById('tl-track')?.scrollBy({ left: 220, behavior: 'smooth' })}
              className="absolute -right-2 top-1/2 -translate-y-1/2 bg-[#262626] p-2 rounded-full text-gray-300 hover:bg-[#2e2e2e]"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* advanced stats */}
          <div className="p-6 overflow-y-auto flex-1 scrollbar-hide">
            {secGroups.map(({ g, k }) => (
              <div key={g} className="mb-6">
                <h4 className="text-gray-200 font-medium mb-2">{g}</h4>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2 text-xs">
                  {k.map((s: string) => {
                    const before = p.detailedStatsBefore[s] ?? 0;
                    const after = p.detailedStats[s] ?? 0;
                    const delta = after - before;
                    return (
                      <div key={s} className="bg-[#202020] rounded-lg p-2 flex justify-between">
                        <span className="text-gray-300 truncate">{s}</span>
                        <span className="font-bold">
                          {after}
                          {delta > 0 && <span className="text-green-400 ml-1">+{delta}</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default PlayerDetailModal;
