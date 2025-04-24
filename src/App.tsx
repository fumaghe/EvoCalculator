import React from 'react';
import { Routes, Route } from 'react-router-dom';

import { ThemeProvider } from './context/ThemeContext';
import Layout      from './Layout';

/* pagine */
import Dashboard   from './components/Dashboard';
import Evolutions  from './pages/Evolutions';

export default function App() {
  return (
    <ThemeProvider>
      <Layout>
        <Routes>
          <Route path="/"            element={<Dashboard />} />
          <Route path="/evolutions"  element={<Evolutions />} />
          {/* fallback 404 → Dashboard */}
          <Route path="*"            element={<Dashboard />} />
        </Routes>
      </Layout>
    </ThemeProvider>
  );
}
