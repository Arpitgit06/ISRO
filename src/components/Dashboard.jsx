import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAppStore from '../store/useAppStore';
import { fetchHealth, fetchDevices, changeDevice } from '../services/api';
import UploadZone from './UploadZone';
import ImageSlider from './ImageSlider';
import TelemetryPanel from './TelemetryPanel';
import ControlBar from './ControlBar';
import BootScreen from './BootScreen';
import ParticleCanvas from './ParticleCanvas';

function Header({ health, devicesInfo, onDeviceChange, deviceChanging }) {
  const { filename } = useAppStore();

  const device = health?.device || 'unknown';
  const isGpu = device !== 'cpu' && device !== 'unknown';
  const isCuda = device.startsWith('cuda');
  const deviceColor = 'var(--accent-color)';
  const deviceBorder = 'var(--accent-dim)';

  return (
    <header style={{ 
      display: 'flex', 
      alignItems: 'center', 
      padding: '0 20px', 
      height: '56px', 
      background: 'rgba(0, 0, 0, 0.25)', 
      backdropFilter: 'blur(2px)',
      WebkitBackdropFilter: 'blur(2px)',
      borderBottom: '1px solid var(--accent-dim)', 
      flexShrink: 0, 
      gap: '16px',
      fontFamily: "'Share Tech Mono', monospace"
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* NishaDrishti Eye/Satellite logo */}
        <svg width="34" height="34" viewBox="0 0 100 100" style={{ filter: 'drop-shadow(0 0 5px var(--accent-glow))' }}>
          {/* Outer circle / Lens body */}
          <circle cx="50" cy="50" r="38" stroke="var(--accent-color)" strokeWidth="3" fill="none" />
          {/* Eye iris / Camera aperture blades */}
          <path d="M 50 12 L 72 35 L 50 58 L 28 35 Z" fill="none" stroke="var(--accent-color)" strokeWidth="1.5" opacity="0.8" />
          <path d="M 50 88 L 72 65 L 50 42 L 28 65 Z" fill="none" stroke="var(--accent-color)" strokeWidth="1.5" opacity="0.8" />
          {/* Center glowing pupil / thermal sensor node */}
          <circle cx="50" cy="50" r="10" fill="var(--accent-color)" />
          {/* Horizontal satellite sensor wings */}
          <line x1="5" y1="50" x2="20" y2="50" stroke="var(--accent-color)" strokeWidth="4" />
          <line x1="80" y1="50" x2="95" y2="50" stroke="var(--accent-color)" strokeWidth="4" />
          {/* Target crosshair markers */}
          <line x1="50" y1="5" x2="50" y2="15" stroke="var(--accent-color)" strokeWidth="3" />
          <line x1="50" y1="85" x2="50" y2="95" stroke="var(--accent-color)" strokeWidth="3" />
        </svg>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 900, color: '#FFFFFF', letterSpacing: '0.15em', fontFamily: "'Orbitron', sans-serif" }}>NishaDrishtiAI</div>
          <div style={{ fontSize: '8px', color: 'var(--accent-color)', letterSpacing: '0.1em' }}>IR SENSOR COLORIZATION & ENHANCEMENT CONSOLE</div>
        </div>
      </div>
      <div style={{ width: '1px', height: '30px', background: 'var(--accent-dim)' }} />
      <div style={{ fontSize: '10px', color: '#475569', letterSpacing: '0.05em' }}>BHARATIYA ANTARIKSH SYSTEM</div>
      
      <div style={{ flex: 1 }} />
      
      {filename && (
        <span style={{ 
          fontSize: '10px', 
          color: '#E2E8F0', 
          padding: '3px 10px', 
          background: 'var(--accent-glow)', 
          border: '1px solid var(--accent-dim)', 
          borderRadius: '2px',
          letterSpacing: '0.05em'
        }}>
          📡 {filename.toUpperCase()}
        </span>
      )}
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '6px', 
        fontSize: '9px', 
        color: health?.engine_ready ? 'var(--accent-color)' : '#475569', 
        padding: '4px 12px', 
        border: `1px solid ${health?.engine_ready ? 'var(--accent-color)' : 'var(--accent-glow)'}`, 
        borderRadius: '2px', 
        background: health?.engine_ready ? 'var(--accent-glow)' : 'transparent',
        boxShadow: health?.engine_ready ? '0 0 10px var(--accent-glow)' : 'none',
        letterSpacing: '0.08em'
      }}>
        <span style={{ 
          width: '6px', 
          height: '6px', 
          borderRadius: '50%', 
          background: health?.engine_ready ? 'var(--accent-color)' : '#334155',
          boxShadow: health?.engine_ready ? '0 0 6px var(--accent-color)' : 'none'
        }} />
        {health?.engine_ready ? 'ENGINE READY' : 'ENGINE LOADING'}
      </div>
      
      {devicesInfo?.devices && devicesInfo.devices.length > 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '9px', color: '#475569', fontWeight: 600, letterSpacing: '0.08em' }}>COMPUTE:</span>
          <select
            value={device}
            disabled={deviceChanging}
            onChange={(e) => onDeviceChange(e.target.value)}
            style={{
              fontSize: '9.5px',
              fontWeight: 'bold',
              color: deviceColor,
              padding: '4px 24px 4px 10px',
              border: `1px solid ${deviceBorder}`,
              borderRadius: '2px',
              background: '#000000',
              cursor: deviceChanging ? 'not-allowed' : 'pointer',
              outline: 'none',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgba(0,130,200,0.8)' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 8px center',
              backgroundSize: '10px',
              transition: 'all 0.2s ease',
              opacity: deviceChanging ? 0.6 : 1,
              fontFamily: "'Share Tech Mono', monospace"
            }}
          >
            {devicesInfo.devices.map((d) => (
              <option key={d.id} value={d.id} disabled={!d.available} style={{ background: '#000000', color: d.available ? '#FFFFFF' : '#475569' }}>
                {d.label.toUpperCase()} {!d.available ? ' (N/A)' : ''}
              </option>
            ))}
          </select>
        </div>
      ) : (
        health?.device && (
          <span style={{ 
            fontSize: '9px', 
            color: deviceColor, 
            padding: '3px 10px', 
            border: `1px solid ${deviceBorder}`, 
            borderRadius: '2px',
            letterSpacing: '0.08em',
            boxShadow: '0 0 6px var(--accent-glow)'
          }}>
            {health?.device_label?.toUpperCase() || device.toUpperCase()}
          </span>
        )
      )}
    </header>
  );
}

function BatchSidebar() {
  const { batchItems, activeBatchId, setActiveBatchId } = useAppStore();

  return (
    <div style={{
      width: '200px',
      flexShrink: 0,
      borderRight: '1px solid var(--accent-dim)',
      background: 'rgba(0, 0, 0, 0.4)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Share Tech Mono', monospace"
    }}>
      <div style={{
        padding: '12px',
        borderBottom: '1px solid var(--accent-dim)',
        background: 'rgba(0,0,0,0.2)',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#94A3B8', letterSpacing: '0.08em' }}>BATCH PAYLOAD</div>
        <div style={{ fontSize: '9px', color: 'var(--accent-color)', marginTop: '2px' }}>
          {batchItems.filter(i => i.status === 'success').length} / {batchItems.length} COMPLETED
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {batchItems.map((item) => {
          const isActive = item.id === activeBatchId;
          return (
            <div
              key={item.id}
              onClick={() => item.status === 'success' && setActiveBatchId(item.id)}
              style={{
                padding: '8px 10px',
                background: isActive ? 'var(--accent-glow)' : 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${isActive ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.05)'}`,
                borderRadius: '2px',
                cursor: item.status === 'success' ? 'pointer' : 'default',
                opacity: item.status === 'success' ? 1 : 0.6,
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  fontSize: '11px', 
                  color: isActive ? '#FFFFFF' : '#E2E8F0', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  whiteSpace: 'nowrap',
                  fontWeight: isActive ? 'bold' : 'normal',
                  flex: 1
                }}>
                  {item.filename.toUpperCase()}
                </span>
                <span style={{ fontSize: '9px', color: item.status === 'success' ? '#10B981' : item.status === 'error' ? '#EF4444' : 'var(--accent-color)' }}>
                  {item.status === 'success' && '✓'}
                  {item.status === 'error' && '⚠'}
                  {item.status === 'processing' && '⟳'}
                  {item.status === 'pending' && '•'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#64748B' }}>
                <span>{item.size} MB</span>
                {item.status === 'processing' && <span style={{ color: 'var(--accent-color)' }}>{item.progress}%</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { images, reset, isBatchMode, batchItems } = useAppStore();
  const [health, setHealth] = useState(null);
  const [devicesInfo, setDevicesInfo] = useState(null);
  const [deviceChanging, setDeviceChanging] = useState(false);
  const [booting, setBooting] = useState(true);
  const hasResults = !!images.colorized;

  // Scroll tracking and lerping
  const [scrollProgress, setScrollProgress] = useState(0);
  const rawScrollRef = useRef(0);
  const lerpedScrollRef = useRef(0);

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

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const pct = maxScroll > 0 ? scrollTop / maxScroll : 0;
      rawScrollRef.current = pct;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    let animId;
    const updateLerp = () => {
      const diff = rawScrollRef.current - lerpedScrollRef.current;
      if (Math.abs(diff) > 0.0001) {
        lerpedScrollRef.current += diff * 0.085; // Lerp rate
        setScrollProgress(lerpedScrollRef.current);
      }
      animId = requestAnimationFrame(updateLerp);
    };
    animId = requestAnimationFrame(updateLerp);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animId);
    };
  }, []);

  useEffect(() => {
    let themeColor = '#0082C8';
    let themeColorDim = 'rgba(0, 130, 200, 0.25)';
    let themeColorGlow = 'rgba(0, 130, 200, 0.15)';

    if (scrollProgress <= 0.20) {
      // Stage 0: Galaxy (deep celestial blue)
      themeColor = '#3A86FF';
      themeColorDim = 'rgba(58, 134, 255, 0.25)';
      themeColorGlow = 'rgba(58, 134, 255, 0.15)';
    } else if (scrollProgress <= 0.40) {
      // Galaxy -> Blackhole transition
      const t = (scrollProgress - 0.20) / 0.20;
      // Lerp from celestial blue (58, 134, 255) to accretion disk orange (255, 94, 0)
      const r = Math.round(58.0 + (255.0 - 58.0) * t);
      const g = Math.round(134.0 + (94.0 - 134.0) * t);
      const b = Math.round(255.0 + (0.0 - 255.0) * t);
      themeColor = `rgb(${r}, ${g}, ${b})`;
      themeColorDim = `rgba(${r}, ${g}, ${b}, 0.25)`;
      themeColorGlow = `rgba(${r}, ${g}, ${b}, 0.15)`;
    } else if (scrollProgress <= 0.60) {
      // Stage 1: Blackhole (fiery accretion disk orange)
      themeColor = '#FF5E00';
      themeColorDim = 'rgba(255, 94, 0, 0.25)';
      themeColorGlow = 'rgba(255, 94, 0, 0.15)';
    } else if (scrollProgress <= 0.80) {
      // Stage 2: Supernova (relativistic red-orange to rings/terrain ISRO blue)
      const t = (scrollProgress - 0.60) / 0.20;
      // Lerp from fireball red (255, 45, 0) to ISRO blue (0, 130, 200)
      const r = Math.round(255.0 + (0.0 - 255.0) * t);
      const g = Math.round(45.0 + (130.0 - 45.0) * t);
      const b = Math.round(0.0 + (200.0 - 0.0) * t);
      themeColor = `rgb(${r}, ${g}, ${b})`;
      themeColorDim = `rgba(${r}, ${g}, ${b}, 0.25)`;
      themeColorGlow = `rgba(${r}, ${g}, ${b}, 0.15)`;
    } else {
      // Stage 3 & 4: rings / terrain (ISRO blue)
      themeColor = '#0082C8';
      themeColorDim = 'rgba(0, 130, 200, 0.25)';
      themeColorGlow = 'rgba(0, 130, 200, 0.15)';
    }

    document.documentElement.style.setProperty('--accent-color', themeColor);
    document.documentElement.style.setProperty('--accent-dim', themeColorDim);
    document.documentElement.style.setProperty('--accent-glow', themeColorGlow);
  }, [scrollProgress]);

  const handleDeviceChange = async (newDeviceId) => {
    setDeviceChanging(true);
    try {
      await changeDevice(newDeviceId);
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

  // Determine opacities of HUD overlays in scrollytelling
  const isLoaded = !booting;
  
  // Hero text overlays: visible during Galaxy phase (0.0 to 0.18)
  const heroOpacity = isLoaded ? Math.max(0, 1 - Math.min(1, scrollProgress / 0.18)) : 0;

  // Stage2Opacity removed — side panels were removed

  // Staggered Bold typography (scroll 0.55 to 0.78 — during rings/supernova transition)
  let typography1Opacity = 0;
  let typography2Opacity = 0;
  
  if (scrollProgress >= 0.55 && scrollProgress <= 0.78) {
    if (scrollProgress >= 0.55 && scrollProgress <= 0.70) {
      typography1Opacity = Math.min(1, (scrollProgress - 0.55) / 0.06);
      if (scrollProgress >= 0.66) {
        typography1Opacity = Math.max(0, 1 - (scrollProgress - 0.66) / 0.04);
      }
    }
    if (scrollProgress >= 0.64 && scrollProgress <= 0.78) {
      typography2Opacity = Math.min(1, (scrollProgress - 0.64) / 0.05);
      if (scrollProgress >= 0.74) {
        typography2Opacity = Math.max(0, 1 - (scrollProgress - 0.74) / 0.04);
      }
    }
  }

  // Functional control console fade-in (scroll 0.82 to 1.0 — terrain phase)
  const consoleOpacity = isLoaded && scrollProgress >= 0.82 
    ? Math.min(1, (scrollProgress - 0.82) / 0.12) 
    : 0;

  return (
    <>
      {booting && <BootScreen onComplete={() => setBooting(false)} />}
      
      {/* Main Scrollytelling HUD container — extended for 5-stage pacing */}
      <div style={{ height: '450vh', position: 'relative', background: '#000000' }}>
        
        {/* fixed layout layers */}
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          background: '#000000', // Solid black background on fixed parent
          zIndex: 5,
          overflow: 'hidden'
        }}>
          {/* Background 3D Particle Canvas inside fixed layer */}
          {isLoaded && <ParticleCanvas scrollProgress={scrollProgress} />}

          {/* Interactive HTML/SVG HUD Overlay elements */}
          <div style={{ 
            position: 'absolute', 
            inset: 0,
            pointerEvents: 'none', 
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100vh',
            fontFamily: "'Share Tech Mono', monospace"
          }}>
            
            {/* Header */}
            <div style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 0.8s', pointerEvents: consoleOpacity > 0.05 ? 'auto' : 'none' }}>
              <Header 
                health={health} 
                devicesInfo={devicesInfo} 
                onDeviceChange={handleDeviceChange} 
                deviceChanging={deviceChanging} 
              />
            </div>

            {/* STAGE 1: Hero UI (scroll 0.0 to 0.18) */}
            <div style={{ 
              position: 'absolute', 
              inset: 0, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              opacity: heroOpacity,
              pointerEvents: 'none',
              textAlign: 'center',
              zIndex: 10,
              padding: '0 20px'
            }}>
              <h1 style={{ 
                fontSize: '5.5vw', 
                fontWeight: 900, 
                color: '#FFFFFF', 
                fontFamily: "'Orbitron', sans-serif", 
                letterSpacing: '0.3em',
                textShadow: '0 0 25px var(--accent-color)',
                margin: '0 0 16px 0',
                transform: `translateY(${-scrollProgress * 150}px)`
              }}>
                NishaDrishtiAI
              </h1>
              <p style={{ 
                fontSize: '12px', 
                color: 'var(--accent-color)', 
                letterSpacing: '0.25em', 
                textTransform: 'uppercase',
                textShadow: '0 0 10px var(--accent-glow)',
                transform: `translateY(${-scrollProgress * 80}px)`,
                marginBottom: '16px',
                fontWeight: 'bold',
                fontFamily: "'Orbitron', sans-serif"
              }}>
                INFRARED IMAGE COLORIZATION & RESOLUTION ENHANCEMENT CONSOLE
              </p>
              <p style={{
                fontSize: '13px',
                color: '#94A3B8',
                letterSpacing: '0.05em',
                maxWidth: '520px',
                lineHeight: '1.6',
                transform: `translateY(${-scrollProgress * 50}px)`,
                fontFamily: "'Share Tech Mono', monospace"
              }}>
                An advanced military intelligence dashboard providing real-time super-resolution, chromatic restoration, and object detection.
              </p>
            </div>

            {/* STAGE 2: Deep Dive Split Overlay (removed as requested) */}

            {/* STAGE 3: Bold Case Study Typography Layout (scroll 0.65 to 0.84) */}
            <div style={{ 
              position: 'absolute', 
              inset: 0, 
              pointerEvents: 'none',
              zIndex: 10
            }}>
              <AnimatePresence>
                {typography1Opacity > 0.05 && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: typography1Opacity, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ 
                      position: 'absolute',
                      top: '18%',
                      left: '8%',
                      width: '360px',
                      textAlign: 'left',
                      fontFamily: "'Share Tech Mono', monospace"
                    }}
                  >
                    <h3 style={{ 
                      fontSize: '18px', 
                      fontWeight: 900, 
                      letterSpacing: '0.2em', 
                      fontFamily: "'Orbitron', sans-serif", 
                      color: '#FFFFFF',
                      textShadow: '0 0 15px rgba(255,255,255,0.3)',
                      marginBottom: '10px'
                    }}>
                      NishaDrishtiAI CONSOLE
                    </h3>
                    <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.6' }}>
                      We designed the mission console for satellite IR frame enhancement, featuring real-time super-resolution, colorization, and zero-shot target detection.
                    </p>
                  </motion.div>
                )}

                {typography2Opacity > 0.05 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: typography2Opacity, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ 
                      position: 'absolute',
                      top: '40%',
                      right: '8%',
                      width: '360px',
                      textAlign: 'left',
                      fontFamily: "'Share Tech Mono', monospace"
                    }}
                  >
                    <h3 style={{ 
                      fontSize: '18px', 
                      fontWeight: 900, 
                      letterSpacing: '0.1em', 
                      fontFamily: "'Orbitron', sans-serif", 
                      color: 'var(--accent-color)',
                      textShadow: '0 0 15px var(--accent-glow)',
                      marginBottom: '10px'
                    }}>
                      Three views. One console. One clock.
                    </h3>
                    <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.6' }}>
                      A military-grade HUD console providing satellite payload operators with crystal-clear intelligence from raw thermal sensor streams.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* STAGE 3 FINAL: NishaDrishtiAI Control Console Dashboard (scroll 0.80 to 1.0) */}
            <motion.div 
              animate={{ 
                opacity: consoleOpacity,
                y: consoleOpacity > 0.05 ? 0 : 25
              }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                flex: 1,
                overflow: 'hidden', 
                position: 'relative',
                pointerEvents: consoleOpacity > 0.05 ? 'auto' : 'none',
                background: 'rgba(0, 0, 0, 0.1)',
                borderTop: '1px solid var(--accent-dim)'
              }}
            >
              <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
                
                {/* Left Side: Upload Zone or Image Comparison Slider */}
                <div style={{ 
                  flex: '0 0 60%', 
                  display: 'flex', 
                  flexDirection: 'row', 
                  borderRight: '1px solid var(--accent-dim)', 
                  overflow: 'hidden',
                  background: 'transparent'
                }}>
                  {isBatchMode && batchItems.length > 0 && <BatchSidebar />}
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                    {hasResults ? <ImageSlider /> : <UploadZone />}
                  </div>
                </div>

                {/* Right Side: Quality metrics charts and telemetry logs */}
                <div style={{ 
                  flex: '0 0 40%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  background: 'transparent', 
                  overflow: 'hidden' 
                }}>
                  <TelemetryPanel />
                </div>

              </div>

              {/* Master Control Options Bar */}
              <ControlBar onReset={reset} />
            </motion.div>

          </div> {/* Close content layer */}
        </div> {/* Close fixed parent layer */}
      </div> {/* Close main scroll container */}
    </>
  );
}
