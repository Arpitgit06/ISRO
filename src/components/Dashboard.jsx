import { useEffect, useState } from 'react';
import useAppStore from '../store/useAppStore';
import { fetchHealth } from '../services/api';
import UploadZone from './UploadZone';
import ImageSlider from './ImageSlider';
import TelemetryPanel from './TelemetryPanel';
import ControlBar from './ControlBar';

function Header({ health }) {
  const { filename } = useAppStore();

  const device = health?.device || 'unknown';
  const isGpu = device !== 'cpu' && device !== 'unknown';
  const deviceLabel = health?.device_label || device.toUpperCase();
  const isCuda = device.startsWith('cuda');
  const deviceColor = isCuda ? '#F97316' : isGpu ? '#10B981' : '#64748B';
  const deviceBorder = isCuda ? 'rgba(249,115,22,0.4)' : isGpu ? 'rgba(16,185,129,0.15)' : '#1E3050';

  return (
    <header style={{ display: 'flex', alignItems: 'center', padding: '0 20px', height: '52px', background: '#060B14', borderBottom: '1px solid #1E3050', flexShrink: 0, gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #F97316, #EA580C)', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
        <div>
          <div style={{ fontSize: '14px', fontWeight: 900, color: '#E2E8F0' }}>TESSERACTZ</div>
          <div style={{ fontSize: '8px', color: '#334155' }}>IR · ENHANCE · COLORIZE · DETECT</div>
        </div>
      </div>
      <div style={{ width: '1px', height: '30px', background: '#1E3050' }} />
      <div style={{ fontSize: '10px', color: '#334155' }}>BHARATIYA ANTARIKSH HACKATHON</div>
      <div style={{ flex: 1 }} />
      {filename && <span style={{ fontSize: '10px', color: '#64748B', padding: '3px 8px', background: '#0D1525', border: '1px solid #1E3050', borderRadius: '4px' }}>📡 {filename}</span>}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', color: health?.engine_ready ? '#10B981' : '#64748B', padding: '4px 10px', border: `1px solid ${health?.engine_ready ? '#10B981' : '#1E3050'}`, borderRadius: '4px', background: health?.engine_ready ? 'rgba(16,185,129,0.06)' : 'transparent' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: health?.engine_ready ? '#10B981' : '#334155' }} />
        {health?.engine_ready ? 'ENGINE READY' : 'ENGINE LOADING'}
      </div>
      {health?.device && <span style={{ fontSize: '9px', color: deviceColor, padding: '3px 8px', border: `1px solid ${deviceBorder}`, borderRadius: '4px' }}>{deviceLabel}</span>}
    </header>
  );
}

export default function Dashboard() {
  const { images, reset } = useAppStore();
  const [health, setHealth] = useState(null);
  const hasResults = !!images.colorized;

  useEffect(() => {
    const poll = async () => {
      try { setHealth(await fetchHealth()); } catch {}
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0A0E1A', color: '#E2E8F0', overflow: 'hidden', position: 'relative' }}>
      <Header health={health} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div style={{ flex: '0 0 60%', display: 'flex', flexDirection: 'column', borderRight: '1px solid #1E3050', overflow: 'hidden' }}>
          {hasResults ? <ImageSlider /> : <UploadZone />}
        </div>
        <div style={{ flex: '0 0 40%', display: 'flex', flexDirection: 'column', background: '#0A0E1A', overflow: 'hidden' }}>
          <TelemetryPanel />
        </div>
      </div>
      <ControlBar onReset={reset} />
    </div>
  );
}
