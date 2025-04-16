// Navbar.tsx
import React from 'react';
import { Menu, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Navbar: React.FC<NavbarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="fixed top-0 z-50 w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="px-3 py-3 lg:px-5 lg:pl-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Menu className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </button>
            <span className="ml-4 text-xl font-semibold text-gray-800 dark:text-white">
              Evolution Simulator
            </span>
          </div>
          <div className="flex items-center">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {theme === 'dark' ? (
                <Sun className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              ) : (
                <Moon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
