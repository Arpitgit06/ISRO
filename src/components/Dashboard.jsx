import { useEffect, useState } from 'react';
import useAppStore from '../store/useAppStore';
import { fetchHealth, fetchDevices, changeDevice } from '../services/api';
import UploadZone from './UploadZone';
import ImageSlider from './ImageSlider';
import TelemetryPanel from './TelemetryPanel';
import ControlBar from './ControlBar';

function Header({ health, devicesInfo, onDeviceChange, deviceChanging }) {
  const { filename } = useAppStore();

  const device = health?.device || 'unknown';
  const isGpu = device !== 'cpu' && device !== 'unknown';
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
      
      {devicesInfo?.devices && devicesInfo.devices.length > 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '8px', color: '#475569', fontWeight: 600, letterSpacing: '0.05em' }}>COMPUTE:</span>
          <select
            value={device}
            disabled={deviceChanging}
            onChange={(e) => onDeviceChange(e.target.value)}
            style={{
              fontSize: '9px',
              fontWeight: 'bold',
              color: deviceColor,
              padding: '4px 24px 4px 10px',
              border: `1px solid ${deviceBorder}`,
              borderRadius: '4px',
              background: '#0D1525',
              cursor: deviceChanging ? 'not-allowed' : 'pointer',
              outline: 'none',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(deviceColor)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 8px center',
              backgroundSize: '10px',
              transition: 'all 0.2s ease',
              opacity: deviceChanging ? 0.6 : 1,
            }}
          >
            {devicesInfo.devices.map((d) => (
              <option key={d.id} value={d.id} disabled={!d.available} style={{ background: '#0A0E1A', color: d.available ? '#E2E8F0' : '#475569' }}>
                {d.label} {!d.available ? ' (N/A)' : ''}
              </option>
            ))}
          </select>
        </div>
      ) : (
        health?.device && (
          <span style={{ fontSize: '9px', color: deviceColor, padding: '3px 8px', border: `1px solid ${deviceBorder}`, borderRadius: '4px' }}>
            {health?.device_label || device.toUpperCase()}
          </span>
        )
      )}
    </header>
  );
}

export default function Dashboard() {
  const { images, reset } = useAppStore();
  const [health, setHealth] = useState(null);
  const [devicesInfo, setDevicesInfo] = useState(null);
  const [deviceChanging, setDeviceChanging] = useState(false);
  const hasResults = !!images.colorized;

  const pollHealth = async () => {
    try { setHealth(await fetchHealth()); } catch {}
  };

  const loadDevices = async () => {
    try { setDevicesInfo(await fetchDevices()); } catch {}
  };

  useEffect(() => {
    pollHealth();
    loadDevices();
    const healthId = setInterval(pollHealth, 5000);
    const devicesId = setInterval(loadDevices, 10000);
    return () => {
      clearInterval(healthId);
      clearInterval(devicesId);
    };
  }, []);

  const handleDeviceChange = async (newDeviceId) => {
    setDeviceChanging(true);
    try {
      await changeDevice(newDeviceId);
      // Immediately refresh health and device info
      const [newHealth, newDevInfo] = await Promise.all([fetchHealth(), fetchDevices()]);
      setHealth(newHealth);
      setDevicesInfo(newDevInfo);
    } catch (err) {
      console.error(err);
      alert(`Failed to switch device: ${err.message}`);
    } finally {
      setDeviceChanging(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0A0E1A', color: '#E2E8F0', overflow: 'hidden', position: 'relative' }}>
      <Header 
        health={health} 
        devicesInfo={devicesInfo} 
        onDeviceChange={handleDeviceChange} 
        deviceChanging={deviceChanging} 
      />
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
