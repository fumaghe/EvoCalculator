import React from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface Props { sidebarOpen:boolean; setSidebarOpen(o:boolean):void }

const Navbar:React.FC<Props> = ({ sidebarOpen,setSidebarOpen }) => {
  const { theme,toggleTheme } = useTheme();

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-[#1f1f1f] border-b border-[#2a2a2a]">
      <div className="flex items-center justify-between px-6 py-3">
        <button
          onClick={()=>setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-full hover:bg-[#262626] text-gray-300"
        >
          <Menu className="w-6 h-6"/>
        </button>

        <h1 className="text-lime-400 font-semibold tracking-wide">
          Evolution&nbsp;Simulator
        </h1>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-[#262626]"
        >
          {theme==='dark'
            ? <Sun  className="w-6 h-6 text-yellow-400"/>
            : <Moon className="w-6 h-6 text-gray-300"/>}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
