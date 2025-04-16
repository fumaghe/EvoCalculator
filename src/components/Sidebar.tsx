import React from 'react';
import { Home, Filter, Settings, BarChart2 } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const menuItems = [
    { icon: Home, label: 'Dashboard', active: true },
    { icon: Filter, label: 'Filters' },
    { icon: BarChart2, label: 'Results' },
    { icon: Settings, label: 'Settings' },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen pt-16 transition-transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 w-64`}
    >
      <div className="h-full px-3 py-4 overflow-y-auto">
        <ul className="space-y-2 font-medium">
          {menuItems.map((item, index) => (
            <li key={index}>
              <a
                href="#"
                className={`flex items-center p-2 rounded-lg ${
                  item.active
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <item.icon className="w-6 h-6" />
                <span className="ml-3">{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
