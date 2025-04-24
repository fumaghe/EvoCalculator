import React, { ReactNode, useState } from 'react';
import Navbar   from './components/Navbar';
import Sidebar  from './components/Sidebar';

export default function Layout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#141414] text-gray-200">
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex pt-16">
        <Sidebar isOpen={sidebarOpen} />

        <main
          className={`
            flex-1 p-6 transition-all
            ${sidebarOpen ? 'ml-64' : 'ml-0'}
          `}
        >
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
