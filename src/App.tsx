import React, { useState } from 'react';
import { Moon, Sun, Filter, Home, Settings, ChevronRight, Search } from 'lucide-react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex">
          <Sidebar isOpen={sidebarOpen} />
          <main className={`flex-1 p-6 transition-all duration-200 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
            <Dashboard />
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;