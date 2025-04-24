import React, { useEffect, useState } from 'react';
import { Stats } from '../services/simulationService';
import { X, ChevronLeft, ChevronRight, Info, TrendingUp } from 'lucide-react';

/* ───── face stats meta ───── */
const faceKeys: { k: keyof Stats; lbl: string }[] = [
  { k: 'ovr', lbl: 'OVR' }, { k: 'pac', lbl: 'PAC' }, { k: 'sho', lbl: 'SHO' },
  { k: 'pas', lbl: 'PAS' }, { k: 'dri', lbl: 'DRI' }, { k: 'def', lbl: 'DEF' }, { k: 'phy', lbl: 'PHY' },
];

/* ───── gruppi secondari ───── */
interface SecondaryGroup { g: string; k: string[] }
const secGroups: SecondaryGroup[] = [
  { g:'Pace',        k:['Acceleration','Sprint Speed'] },
  { g:'Shooting',    k:['Positioning','Finishing','Shot Power','Long Shots','Volleys','Penalties'] },
  { g:'Passing',     k:['Vision','Crossing','Free Kick Accuracy','Short Passing','Long Passing','Curve'] },
  { g:'Dribbling',   k:['Agility','Balance','Reactions','Ball Control','Dribbling','Composure'] },
  { g:'Defending',   k:['Interceptions','Heading Accuracy','Def Awareness','Standing Tackle','Sliding Tackle'] },
  { g:'Physicality', k:['Jumping','Stamina','Strength','Aggression'] },
];

/* ───── parser riga upgrade (stat + cap) ───── */
function parseLine(line: string): { stat?: keyof Stats; delta?: number; cap?: number } {
  const map: Record<string, keyof Stats> = {
    Overall:'ovr', Pace:'pac', Shooting:'sho', Passing:'pas',
    Dribbling:'dri', Defending:'def', Physicality:'phy',
  };
  const l = line.replace(/★/g, '').trim();
  const m = l.match(/^([\w\.\s]+?)\s+([+\-]\d+)(?:.*?\(\^(\d+)\))?/);
  if (!m) return {};
  const stat = map[m[1].trim()];
  const delta = +m[2];
  const cap   = m[3] ? +m[3] : undefined;
  return stat ? { stat, delta, cap } : {};
}

/* ───── scoring helper (solo face stats) ───── */
const scoreFace = (s: Stats): number =>
  0.2 * s.ovr + 0.5 * ((s.pac + s.sho + s.pas + s.dri + s.def + s.phy) / 6);

/* ───── props ───── */
interface ModalProps {
  isOpen: boolean; onClose: () => void;
  name: string;
  evolutionOrder: string[];
  roles: string[];
  playstyles: string[]; playstylesPlus: string[];
  generalStatsBefore: Stats; generalStatsAfter: Stats;
  detailedStatsBefore: Record<string, number>; detailedStats: Record<string, number>;
}

/* ───── component ───── */
const PlayerDetailModal: React.FC<ModalProps> = (p) => {

  /* mappa <evo> → righe parse-ate */
  const [evoLines, setEvoLines] =
    useState<Record<string, { stat: keyof Stats; delta: number; cap?: number }[]>>({});

  /* fetch evo.json una sola volta */
  useEffect(() => {
    fetch('/data/evo.json')
      .then(r => r.json())
      .then((evos: any[]) => {
        const map: Record<string, { stat: keyof Stats; delta: number; cap?: number }[]> = {};
        evos.forEach(e => {
          const arr: { stat: keyof Stats; delta: number; cap?: number }[] = [];
          e.upgrades.forEach((u: any) =>
            u.description.forEach((line: string) => {
              const o = parseLine(line);
              if (o.stat && o.delta) arr.push(o as any);
            }),
          );
          map[e.name] = arr;
        });
        setEvoLines(map);
      })
      .catch(console.error);
  }, []);

  if (!p.isOpen) return null;

  /* ----- costruzione step ----- */
  interface Step { name: string; stats: Stats; idealGain: number; scoreGain: number }
  const steps: Step[] = [];
  let curr: Stats = { ...p.generalStatsBefore };
  let prevScore = scoreFace(curr);

  steps.push({ name: 'Base', stats: { ...curr }, idealGain: 0, scoreGain: 0 });

  p.evolutionOrder.forEach(evo => {
    const lines = evoLines[evo] || [];
    const next: Stats = { ...curr };
    let idealGain = 0;

    lines.forEach(({ stat, delta, cap }) => {
      if (!stat || delta <= 0) return;
      const hardCap = cap ?? 99;
      const available = Math.max(0, hardCap - next[stat]);
      const apply = Math.min(delta, available);
      if (apply > 0) {
        next[stat] += apply;
        if (stat !== 'ovr') idealGain += apply;
      }
    });

    const nextScore = scoreFace(next);
    const scoreGain = nextScore - prevScore;

    steps.push({ name: evo, stats: next, idealGain, scoreGain });
    curr = next;
    prevScore = nextScore;
  });

  const totalScoreGain = scoreFace(p.generalStatsAfter) - scoreFace(p.generalStatsBefore);

  /* ----- helpers per timeline ----- */
  const eff = (i: number) => {
    if (i === 0) return { label: '—', color: '' };
    const real = faceKeys.slice(1).reduce(
      (s, { k }) => s + (steps[i].stats[k] - steps[i - 1].stats[k]),
      0
    );
    const ideal = steps[i].idealGain;
    if (!ideal) return { label: '—', color: '' };
    const perc = Math.round((real / ideal) * 100);
    const color = perc >= 80 ? 'text-green-400' : perc >= 50 ? 'text-yellow-400' : 'text-red-500';
    return { label: `${perc}%`, color };
  };

  const val = (i: number) => {
    if (i === 0 || !totalScoreGain) return { label: '—', color: '' };
    const perc = Math.round((steps[i].scoreGain / totalScoreGain) * 100);
    const color = perc >= 30 ? 'text-green-400' : perc >= 15 ? 'text-yellow-400' : 'text-red-500';
    return { label: `${perc}%`, color };
  };

  /* merge playstyles */
  const ps = [
    ...p.playstyles.map(x => ({ txt: x, plus: false })),
    ...p.playstylesPlus.map(x => ({ txt: x + '+', plus: true })),
  ];

  /* ───────────────────── render ───────────────────── */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative flex flex-col lg:flex-row bg-[#1b1b1b] rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">

        {/* close */}
        <button onClick={p.onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-200">
          <X className="w-6 h-6" />
        </button>

        {/* LEFT – final card */}
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
                  <span key={i}
                        className={`px-2 py-1 text-xs rounded-full ${z.plus ? 'bg-yellow-400 text-black' : 'bg-[#2a2a2a] text-gray-200'}`}>
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

        {/* RIGHT – timeline + advanced */}
        <section className="flex-1 flex flex-col overflow-hidden">
          <h3 className="text-center text-gray-200 font-semibold mt-6">Evolution timeline</h3>

          {/* timeline */}
          <div className="relative mt-4 px-8">
            <div id="tl-track" className="timeline-scroll flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">

              {steps.map(({ name, stats }, idx) => {
                const prev = idx > 0 ? steps[idx - 1].stats : stats;
                const effObj = eff(idx);
                const valObj = val(idx);

                return (
                  <div key={idx} className="min-w-[220px] shrink-0 bg-[#202020] rounded-lg p-4 snap-start">
                    <h4 className={`text-center font-semibold mb-3 ${idx === 0 ? 'text-white' : 'text-lime-400'}`}>
                      {name}
                    </h4>

                    <ul className="grid grid-cols-2 gap-1 text-[11px]">
                      {faceKeys.map(({ k, lbl }) => {
                        const delta = stats[k] - prev[k];
                        return (
                          <li key={k} className="flex justify-between">
                            <span className="text-gray-300">{lbl}</span>
                            <span className={`font-bold ${delta > 0 ? 'text-lime-400' : 'text-gray-300'}`}>
                              {stats[k]}
                              {delta > 0 && <span className="ml-0.5">+{delta}</span>}
                            </span>
                          </li>
                        );
                      })}
                    </ul>

                    {idx > 0 && (
                      <>
                        <div className="flex items-center justify-end gap-1 mt-0.5 text-xs">
                          <span title="Value = share of total score gain">
                            <TrendingUp className="w-3 h-3 text-gray-400" />
                          </span>
                          <span className={valObj.color}>{valObj.label}</span>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* arrows */}
            <button
              onClick={() => document.getElementById('tl-track')?.scrollBy({ left: -240, behavior: 'smooth' })}
              className="absolute -left-2 top-1/2 -translate-y-1/2 bg-[#262626] p-2 rounded-full text-gray-300 hover:bg-[#2e2e2e]">
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => document.getElementById('tl-track')?.scrollBy({ left: 240, behavior: 'smooth' })}
              className="absolute -right-2 top-1/2 -translate-y-1/2 bg-[#262626] p-2 rounded-full text-gray-300 hover:bg-[#2e2e2e]">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* advanced stats */}
          <div className="p-6 overflow-y-auto flex-1 scrollbar-hide">
            {secGroups.map(({ g, k }) => (
              <div key={g} className="mb-6">
                <h4 className="text-gray-200 font-medium mb-2">{g}</h4>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2 text-xs">
                  {k.map(s => {
                    const before = p.detailedStatsBefore[s] ?? 0;
                    const after  = p.detailedStats[s] ?? 0;
                    const d = after - before;
                    return (
                      <div key={s} className="bg-[#202020] rounded-lg p-2 flex justify-between">
                        <span className="text-gray-300 truncate">{s}</span>
                        <span className="font-bold">
                          {after}
                          {d > 0 && <span className="text-green-400 ml-1">+{d}</span>}
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
