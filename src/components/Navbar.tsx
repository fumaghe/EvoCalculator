import React from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface Props { sidebarOpen: boolean; setSidebarOpen(open: boolean): void; }
export default function Navbar({ sidebarOpen, setSidebarOpen }: Props) {
  const { theme, toggleTheme } = useTheme();
  return (
    <nav className="fixed top-0 w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-50">
      <div className="flex items-center justify-between px-6 py-4">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
          <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        </button>
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">Evolution Simulator</h1>
        <button onClick={toggleTheme} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
          {theme === 'dark' ? <Sun className="w-6 h-6 text-yellow-400" /> : <Moon className="w-6 h-6 text-gray-600" />}
        </button>
      </div>
    </nav>
  );
}
