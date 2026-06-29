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
  const deviceColor = '#00FF66';
  const deviceBorder = 'rgba(0, 255, 102, 0.4)';

  return (
    <header style={{ 
      display: 'flex', 
      alignItems: 'center', 
      padding: '0 20px', 
      height: '56px', 
      background: '#000000', 
      borderBottom: '1px solid rgba(0, 255, 102, 0.25)', 
      flexShrink: 0, 
      gap: '16px',
      fontFamily: "'Share Tech Mono', monospace"
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* NishaDrishti Eye/Satellite logo */}
        <svg width="34" height="34" viewBox="0 0 100 100" style={{ filter: 'drop-shadow(0 0 5px rgba(0, 255, 102, 0.5))' }}>
          {/* Outer circle / Lens body */}
          <circle cx="50" cy="50" r="38" stroke="#00FF66" strokeWidth="3" fill="none" />
          {/* Eye iris / Camera aperture blades */}
          <path d="M 50 12 L 72 35 L 50 58 L 28 35 Z" fill="none" stroke="#00FF66" strokeWidth="1.5" opacity="0.8" />
          <path d="M 50 88 L 72 65 L 50 42 L 28 65 Z" fill="none" stroke="#00FF66" strokeWidth="1.5" opacity="0.8" />
          {/* Center glowing pupil / thermal sensor node */}
          <circle cx="50" cy="50" r="10" fill="#00FF66" />
          {/* Horizontal satellite sensor wings */}
          <line x1="5" y1="50" x2="20" y2="50" stroke="#00FF66" strokeWidth="4" />
          <line x1="80" y1="50" x2="95" y2="50" stroke="#00FF66" strokeWidth="4" />
          {/* Target crosshair markers */}
          <line x1="50" y1="5" x2="50" y2="15" stroke="#00FF66" strokeWidth="3" />
          <line x1="50" y1="85" x2="50" y2="95" stroke="#00FF66" strokeWidth="3" />
        </svg>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 900, color: '#FFFFFF', letterSpacing: '0.15em', fontFamily: "'Orbitron', sans-serif" }}>NishaDrishtiAI</div>
          <div style={{ fontSize: '8px', color: '#00FF66', letterSpacing: '0.1em' }}>IR SENSOR COLORIZATION & ENHANCEMENT CONSOLE</div>
        </div>
      </div>
      <div style={{ width: '1px', height: '30px', background: 'rgba(0, 255, 102, 0.25)' }} />
      <div style={{ fontSize: '10px', color: '#475569', letterSpacing: '0.05em' }}>BHARATIYA ANTARIKSH SYSTEM</div>
      
      <div style={{ flex: 1 }} />
      
      {filename && (
        <span style={{ 
          fontSize: '10px', 
          color: '#E2E8F0', 
          padding: '3px 10px', 
          background: 'rgba(0, 255, 102, 0.05)', 
          border: '1px solid rgba(0, 255, 102, 0.3)', 
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
        color: health?.engine_ready ? '#00FF66' : '#475569', 
        padding: '4px 12px', 
        border: `1px solid ${health?.engine_ready ? '#00FF66' : 'rgba(0, 255, 102, 0.15)'}`, 
        borderRadius: '2px', 
        background: health?.engine_ready ? 'rgba(0, 255, 102, 0.05)' : 'transparent',
        boxShadow: health?.engine_ready ? '0 0 10px rgba(0, 255, 102, 0.15)' : 'none',
        letterSpacing: '0.08em'
      }}>
        <span style={{ 
          width: '6px', 
          height: '6px', 
          borderRadius: '50%', 
          background: health?.engine_ready ? '#00FF66' : '#334155',
          boxShadow: health?.engine_ready ? '0 0 6px #00FF66' : 'none'
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
              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgba(0,255,102,0.8)' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
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
            boxShadow: '0 0 6px rgba(0, 255, 102, 0.1)'
          }}>
            {health?.device_label?.toUpperCase() || device.toUpperCase()}
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
                textShadow: '0 0 25px rgba(0, 255, 102, 0.65)',
                margin: '0 0 16px 0',
                transform: `translateY(${-scrollProgress * 150}px)`
              }}>
                NishaDrishtiAI
              </h1>
              <p style={{ 
                fontSize: '12px', 
                color: '#00FF66', 
                letterSpacing: '0.25em', 
                textTransform: 'uppercase',
                textShadow: '0 0 10px rgba(0, 255, 102, 0.4)',
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
                      color: '#00FF66',
                      textShadow: '0 0 15px rgba(0, 255, 102, 0.3)',
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
                background: 'rgba(0,0,0,0.85)',
                borderTop: '1px solid rgba(0, 255, 102, 0.15)'
              }}
            >
              <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
                
                {/* Left Side: Upload Zone or Image Comparison Slider */}
                <div style={{ 
                  flex: '0 0 60%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  borderRight: '1px solid rgba(0, 255, 102, 0.25)', 
                  overflow: 'hidden',
                  background: '#000000'
                }}>
                  {hasResults ? <ImageSlider /> : <UploadZone />}
                </div>

                {/* Right Side: Quality metrics charts and telemetry logs */}
                <div style={{ 
                  flex: '0 0 40%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  background: '#000000', 
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
