// frontend/src/App.jsx
import Dashboard from './components/Dashboard';

// Global cyberpunk CSS injected once at root
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&family=Share+Tech+Mono&family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@300;400;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #000000;
    color: #E2E8F0;
    font-family: 'Share Tech Mono', 'JetBrains Mono', monospace;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #000000; }
  ::-webkit-scrollbar-thumb { background: var(--accent-dim); border: 1px solid var(--accent-color); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--accent-color); }

  @keyframes pulse {
    0%, 100% { opacity: 0.6; }
    50%       { opacity: 1;   }
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0);    }
  }

  .hud-font {
    font-family: 'Orbitron', sans-serif;
  }

  .tech-font {
    font-family: 'Share Tech Mono', monospace;
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
