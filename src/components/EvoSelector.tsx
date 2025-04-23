// src/components/EvoSelector.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  Search,
  ChevronLeft,
  ChevronRight,
  CalendarClock,
  AlarmClock
} from 'lucide-react';
import { Evolution } from '../types';

/* ─────── helper regex ─────── */
const roleRegex    = /(new\s*pos\.?|role\+?\+?)\s*([A-Z]{2,3})/i;
const maxLineRegex = /max\.?\s*(\d+).*?(ovr|overall)?/i;

const extractRoles = (e: Evolution) => {
  const st = new Set<string>(e.new_positions ?? []);
  e.upgrades?.forEach(u =>
    u.description?.forEach(line => {
      const m = line.match(roleRegex);
      if (m) st.add(m[2].toUpperCase());
    })
  );
  return Array.from(st);
};

const extractMaxOvr = (e: Evolution) => {
  for (const [k, v] of Object.entries(e.requirements ?? {})) {
    const kl = k.toLowerCase();
    if (kl.includes('max') && (kl.includes('ovr') || kl.includes('overall'))) {
      const m = v.match(/\d+/);
      return m ? m[0] : v;
    }
    if (/overall|ovr/i.test(k) && maxLineRegex.test(v)) {
      const m = v.match(maxLineRegex);
      if (m) return m[1];
    }
  }
  return '—';
};

const extractCost = (e: Evolution) => {
  if (!e.cost) return { label: '—', type: 'unknown' };
  const c = e.cost.trim();
  if (/^(0|free|gratis)$/i.test(c)) return { label: 'FREE', type: 'free' };
  return { label: c, type: 'coin' };
};

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

/* ─────── component ─────── */
interface Props {
  onSelectionChange: (evos: Evolution[]) => void;
}
export default function EvoSelector({ onSelectionChange }: Props) {
  const [all, setAll]   = useState<Evolution[]>([]);
  const [sel, setSel]   = useState<Set<string>>(new Set());
  const [q, setQ]       = useState('');
  const trackRef        = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/data/evo.json')
      .then(r => r.json())
      .then(setAll)
      .catch(console.error);
  }, []);

  const toggle = (id: string) => {
    const n = new Set(sel);
    n.has(id) ? n.delete(id) : n.add(id);
    setSel(n);
    onSelectionChange(all.filter(e => n.has(e.id)));
  };

  const view = all.filter(e => e.name.toLowerCase().includes(q.toLowerCase()));

  const scrollBy = (dir: 'l' | 'r') => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLDivElement>('[data-card]');
    if (!card) return;
    el.scrollBy({
      left: (card.offsetWidth + 20) * (dir === 'l' ? -1 : 1),
      behavior: 'smooth'
    });
  };

  return (
    <div className="bg-[#161616] rounded-2xl p-6 w-full shadow-inner">
      <h2 className="text-lime-400 font-poppins text-xl mb-4">Select Evolutions</h2>

      {/* search */}
      <div className="relative mb-6">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search..."
          className="w-full bg-[#202020] text-gray-200 placeholder-gray-500 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-lime-500"
        />
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
      </div>

      {/* carousel */}
      <div className="relative">
        <div
          ref={trackRef}
          className="flex gap-5 pb-2 overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide"
        >
          {view.map(evo => {
            const isSel = sel.has(evo.id);
            const roles = extractRoles(evo);
            const maxOvr = extractMaxOvr(evo);
            const cost = extractCost(evo);

            return (
              <div
                key={evo.id}
                data-card
                onClick={() => toggle(evo.id)}
                style={{ scrollSnapAlign: 'start' }}
                className={`
                  min-w-[240px] shrink-0 cursor-pointer rounded-xl p-4 transition
                  ${isSel ? 'ring-2 ring-lime-500 bg-[#242424]' : 'bg-[#1f1f1f] hover:bg-[#262626]'}
                  hover:-translate-y-1 hover:shadow-lg active:scale-95
                `}
              >
                {/* title / check */}
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lime-400 leading-snug max-w-[170px] truncate">
                    {evo.name}
                  </h3>
                  {isSel && <Check size={18} className="text-lime-400 shrink-0" />}
                </div>

                {/* info rows */}
                <ul className="space-y-1 text-sm text-gray-400 mb-3">
                  {roles.length > 0 && (
                    <li>
                      <span className="text-gray-500">Roles:</span> {roles.join(', ')}
                    </li>
                  )}
                  {maxOvr !== '—' && (
                    <li>
                      <span className="text-gray-500">Max&nbsp;OVR:</span> {maxOvr}
                    </li>
                  )}
                </ul>

                {/* dates */}
                <div className="text-xs text-gray-400 space-y-0.5 mb-4">
                  <p className="flex items-center gap-1">
                    <CalendarClock size={12} />
                    <span>Unlock: {fmt(evo.unlock_date)}</span>
                  </p>
                  <p className="flex items-center gap-1">
                    <AlarmClock size={12} />
                    <span>Expires: {fmt(evo.expires_on)}</span>
                  </p>
                </div>

                {/* cost pill */}
                <span
                  className={`
                    inline-block px-3 py-0.5 rounded-full text-[11px] font-semibold
                    ${cost.type === 'free'
                      ? 'bg-lime-500 text-black'
                      : cost.type === 'coin'
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-black'
                      : 'bg-gray-700 text-gray-300'}
                  `}
                >
                  {cost.label}
                </span>
              </div>
            );
          })}

          {view.length === 0 && (
            <p className="text-gray-500 italic p-4">No evolution found.</p>
          )}
        </div>

        {/* arrows */}
        {view.length > 3 && (
          <>
            <button
              onClick={() => scrollBy('l')}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-lime-600/80 hover:bg-lime-600 text-black p-2 rounded-full shadow-lg"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scrollBy('r')}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-lime-600/80 hover:bg-lime-600 text-black p-2 rounded-full shadow-lg"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
