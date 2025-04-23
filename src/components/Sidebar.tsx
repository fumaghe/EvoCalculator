import React from 'react';
import { Home, Filter, Settings, BarChart2 } from 'lucide-react';

interface Props { isOpen:boolean }

const menu = [
  { icon:Home,      label:'Dashboard', active:true },
  { icon:Filter,    label:'Filters' },
  { icon:BarChart2, label:'Results' },
  { icon:Settings,  label:'Settings' },
];

const Sidebar:React.FC<Props> = ({ isOpen }) => (
  <aside
    className={`
      fixed top-0 left-0 h-screen w-64 pt-16 bg-[#1f1f1f] border-r border-[#2a2a2a]
      transition-transform z-40 ${isOpen?'translate-x-0':'-translate-x-full'}
    `}
  >
    <nav className="h-full px-4 py-6 overflow-y-auto scrollbar-hide">
      <ul className="space-y-2">
        {menu.map(({icon:Icon,label,active})=>(
          <li key={label}>
            <a
              href="#"
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg transition
                ${active
                  ?'bg-[#262626] text-lime-400'
                  :'text-gray-300 hover:bg-[#262626]'}
              `}
            >
              <Icon className="w-5 h-5"/>
              <span>{label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  </aside>
);

export default Sidebar;
