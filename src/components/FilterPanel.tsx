import React from 'react';
import { Filter as FilterIcon, X } from 'lucide-react';
import RangeSlider from 'react-range-slider-input';
import 'react-range-slider-input/dist/style.css';

export interface Filters {
  statRanges: {
    ovr:[number,number]; pac:[number,number]; sho:[number,number];
    pas:[number,number]; dri:[number,number]; def:[number,number]; phy:[number,number];
  };
  skillMoves:[number,number];
  weakFoot:[number,number];
  playstyles:string[];
  playstylesPlus:string[];
  roles:string[];
}

interface Props {
  isOpen:boolean;
  onClose:()=>void;
  filters:Filters;
  setFilters:React.Dispatch<React.SetStateAction<Filters>>;
  onApply:()=>void;
}

/* ––––– costanti ––––– */
const playstyles = [
  '1v1 Close Down','Acrobatic','Aerial','Anticipate','Block','Bruiser','Chip Shot',
  'Cross Claimer','Dead Ball','Deflector','Far Reach','Far Throw','Finesse Shot',
  'First Touch','Flair','Footwork','Incisive Pass','Intercept','Jockey',
  'Long Ball Pass','Long Throw','Pinged Pass','Power Header','Power Shot',
  'Press Proven','Quick Step','Rapid','Relentless','Slide Tackle','Technical',
  'Tiki Taka','Trickster','Trivela','Whipped Pass',
];
const roles = ['CDM','CM','CB','ST','LM','RW','LW','RM','CAM','LB','RB'];

/* ––––– component ––––– */
const FilterPanel:React.FC<Props> = ({
  isOpen,onClose,filters,setFilters,onApply
}) => {

  const setRange = (k:keyof Filters['statRanges'],v:[number,number]) =>
    setFilters(f=>({...f,statRanges:{...f.statRanges,[k]:v}}));

  const toggle = (field:'roles'|'playstyles'|'playstylesPlus', val:string) =>
    setFilters(f=>{
      const arr=f[field];
      return {...f,[field]:arr.includes(val)?arr.filter(x=>x!==val):[...arr,val]};
    });

  return (
    <aside
      className={`
        fixed top-0 right-0 h-screen w-96 bg-[#1f1f1f] shadow-xl z-50 transition-transform
        ${isOpen?'translate-x-0':'translate-x-full'}
      `}
    >
      <div className="p-6 h-full overflow-y-auto scrollbar-hide">
        {/* header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 text-lime-400">
            <FilterIcon className="w-5 h-5"/> <h2 className="text-xl font-semibold">Filters</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
            <X className="w-5 h-5"/>
          </button>
        </div>

        {/* stat ranges */}
        {Object.entries(filters.statRanges).map(([k,range])=>(
          <div key={k} className="mb-6">
            <h3 className="mb-2 capitalize text-gray-300">{k} range</h3>
            <RangeSlider
              min={0} max={99} step={1}
              value={range as [number,number]}
              onInput={(v:[number,number])=>setRange(k as any,v)}
              className="slider-primary"
            />
            <div className="flex justify-between text-sm text-gray-400">
              <span>{range[0]}</span><span>{range[1]}</span>
            </div>
          </div>
        ))}

        {/* sm / wf */}
        {(['skillMoves','weakFoot'] as const).map(field=>(
          <div key={field} className="mb-6">
            <h3 className="mb-2 text-gray-300">
              {field==='skillMoves'?'Skill Moves':'Weak Foot'} range
            </h3>
            <RangeSlider
              min={0} max={5} step={1}
              value={filters[field]}
              onInput={(v:[number,number])=>setFilters(f=>({...f,[field]:v}))}
              className="slider-primary"
            />
            <div className="flex justify-between text-sm text-gray-400">
              <span>{filters[field][0]}</span><span>{filters[field][1]}</span>
            </div>
          </div>
        ))}

        {/* playstyles */}
        <div className="mb-6">
          <h3 className="mb-2 text-gray-300">Playstyles</h3>
          <div className="flex flex-wrap gap-2">
            {playstyles.map(ps=>(
              <button
                key={ps}
                onClick={()=>toggle('playstyles',ps)}
                className={`
                  px-3 py-1 rounded-full text-xs
                  ${filters.playstyles.includes(ps)
                    ?'bg-lime-500 text-black'
                    :'bg-[#202020] text-gray-200 hover:bg-[#262626]'}
                `}
              >
                {ps}
              </button>
            ))}
          </div>
        </div>

        {/* playstyles plus */}
        <div className="mb-6">
          <h3 className="mb-2 text-gray-300">Playstyles+</h3>
          <div className="flex flex-wrap gap-2">
            {playstyles.map(ps=>(
              <button
                key={ps}
                onClick={()=>toggle('playstylesPlus',ps)}
                className={`
                  px-3 py-1 rounded-full text-xs
                  ${filters.playstylesPlus.includes(ps)
                    ?'bg-lime-500 text-black'
                    :'bg-[#202020] text-gray-200 hover:bg-[#262626]'}
                `}
              >
                {ps}+
              </button>
            ))}
          </div>
        </div>

        {/* roles */}
        <div className="mb-8">
          <h3 className="mb-2 text-gray-300">Roles</h3>
          <div className="flex flex-wrap gap-2">
            {roles.map(r=>(
              <button
                key={r}
                onClick={()=>toggle('roles',r)}
                className={`
                  px-3 py-1 rounded-full text-xs
                  ${filters.roles.includes(r)
                    ?'bg-lime-500 text-black'
                    :'bg-[#202020] text-gray-200 hover:bg-[#262626]'}
                `}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* apply */}
        <button
          onClick={onApply}
          className="w-full py-3 bg-lime-500 hover:bg-lime-400 text-black font-semibold rounded-full transition"
        >
          Apply filters
        </button>
      </div>
    </aside>
  );
};

export default FilterPanel;
