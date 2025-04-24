import React from 'react';
// **Non importa BrowserRouter qui, perché l’hai già usato in index.tsx**
import { Routes, Route } from 'react-router-dom';

import { ThemeProvider } from './context/ThemeContext';
import Layout from './Layout';

/* pagine */
import Dashboard from './components/Dashboard';
import Evolutions from './pages/Evolutions';
import Players from './pages/PlayersPage';

export default function App() {
  return (
    <ThemeProvider>
      {/* Rimuovi il BrowserRouter qui */}
      <Layout>
        <Routes>
          <Route path="/"           element={<Dashboard />} />
          <Route path="/evolutions" element={<Evolutions />} />
          <Route path="/players"    element={<Players />} />
          <Route path="*"           element={<Dashboard />} />
        </Routes>
      </Layout>
    </ThemeProvider>
  );
}
