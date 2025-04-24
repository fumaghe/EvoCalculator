// src/components/Sidebar.tsx
import React from 'react';
import { Home, Sparkle, Users, Filter, BarChart2, Settings } from 'lucide-react';
import { useLocation, NavLink } from 'react-router-dom';

interface Props { isOpen: boolean }

const links = [
  { icon: Home,      label: 'Dashboard',  href: '/' },
  { icon: Sparkle,   label: 'Evolutions', href: '/evolutions' },
  { icon: Users,     label: 'Giocatori',  href: '/players' },
  { icon: Filter,    label: 'Filters',    href: '/filters' },
  { icon: BarChart2, label: 'Results',    href: '/results' },
  { icon: Settings,  label: 'Settings',   href: '/settings' },
];

const Sidebar: React.FC<Props> = ({ isOpen }) => {
  const { pathname } = useLocation();

  return (
    <aside
      className={`
        fixed top-0 left-0 h-screen w-64 pt-16 bg-[#1f1f1f] border-r border-[#2a2a2a]
        transition-transform z-40 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      <nav className="h-full px-4 py-6 overflow-y-auto scrollbar-hide">
        <ul className="space-y-2">
          {links.map(({ icon: Icon, label, href }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <NavLink
                  to={href}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg transition
                    ${active
                      ? 'bg-[#262626] text-lime-400'
                      : 'text-gray-300 hover:bg-[#262626]'}
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
