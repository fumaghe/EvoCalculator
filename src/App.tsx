import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './Layout';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <ThemeProvider>
      <Layout>
        <Dashboard />
      </Layout>
    </ThemeProvider>
  );
}

export default App;
