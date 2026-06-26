// frontend/src/App.jsx
import Dashboard from './components/Dashboard';

// Global cyberpunk CSS injected once at root
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@300;400;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #0A0E1A;
    color: #E2E8F0;
    font-family: 'Inter', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    overflow: hidden;
  }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #060B14; }
  ::-webkit-scrollbar-thumb { background: #1E3050; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #F97316; }

  @keyframes pulse {
    0%, 100% { opacity: 0.6; }
    50%       { opacity: 1;   }
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
`;

export default function App() {
  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <Dashboard />
    </>
  );
}
