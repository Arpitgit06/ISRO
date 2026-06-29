import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PipelineWireframe({ uploadProgress, isProcessing }) {
  const [currentStage, setCurrentStage] = useState(0); // 0: Uploading, 1-5: Stages

  useEffect(() => {
    if (!isProcessing) {
      setCurrentStage(0);
      return;
    }

    if (uploadProgress < 100) {
      setCurrentStage(0);
      return;
    }

    // When upload completes (100%), simulate stepping through backend stages
    setCurrentStage(1);
    
    const timers = [
      setTimeout(() => setCurrentStage(2), 500),
      setTimeout(() => setCurrentStage(3), 1100),
      setTimeout(() => setCurrentStage(4), 2100),
      setTimeout(() => setCurrentStage(5), 2800),
    ];

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [uploadProgress, isProcessing]);

  // CSS Animations inline for simplicity and isolation
  const inlineStyles = `
    @keyframes dash {
      to {
        stroke-dashoffset: -20;
      }
    }
    @keyframes pulse-node {
      0%, 100% {
        box-shadow: 0 0 5px rgba(0, 255, 102, 0.2);
        border-color: rgba(0, 255, 102, 0.4);
      }
      50% {
        box-shadow: 0 0 20px rgba(0, 255, 102, 0.6);
        border-color: rgba(0, 255, 102, 1);
      }
    }
  `;

  return (
    <div style={{ 
      width: '100%', 
      minHeight: '380px', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '16px', 
      color: '#E2E8F0', 
      padding: '10px 0',
      fontFamily: "'Share Tech Mono', monospace"
    }}>
      <style>{inlineStyles}</style>

      {/* Header status indicator */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0, 255, 102, 0.15)', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#475569', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            TELEMETRY NODE GRAPH
          </span>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.05em' }}>
            {currentStage === 0 ? `UPLOADING SENSOR FRAME (${uploadProgress}%)` : `RUNNING INFERENCE PIPELINE`}
          </span>
        </div>
        <div style={{ 
          padding: '4px 12px', 
          borderRadius: '2px', 
          background: 'rgba(0, 255, 102, 0.05)', 
          border: '1px solid rgba(0, 255, 102, 0.3)', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px' 
        }}>
          <span style={{ 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            background: '#00FF66', 
            display: 'inline-block', 
            animation: 'pulse-node 1.5s infinite',
            boxShadow: '0 0 6px #00FF66'
          }} />
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#00FF66', letterSpacing: '0.05em' }}>
            {currentStage === 0 ? 'TX ACTIVE' : 'GPU COMPUTE'}
          </span>
        </div>
      </div>

      {/* Wireframe Diagram Container */}
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        height: '310px', 
        border: '1px solid rgba(0, 255, 102, 0.2)', 
        borderRadius: '2px', 
        background: '#000000', 
        overflow: 'hidden' 
      }}>
        {/* Wireframe Grid Background (Green tint) */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0, 255, 102, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 102, 0.02) 1px, transparent 1px)', backgroundSize: '20px 20px', pointerEvents: 'none' }} />

        {/* Connection Lines (SVG) */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <defs>
            <linearGradient id="cyber-green-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00FF66" />
              <stop offset="100%" stopColor="#00A344" />
            </linearGradient>
          </defs>

          {/* Node 1 to Node 2 */}
          <line 
            x1="50%" y1="65" x2="50%" y2="98" 
            stroke={currentStage >= 2 ? '#00FF66' : '#222222'} 
            strokeWidth="1.5"
            strokeDasharray="5,5"
            style={{ animation: currentStage === 1 ? 'dash 1s linear infinite' : 'none' }}
          />

          {/* Node 2 splits to Dual Branches (Node 3 SR and Node 3 Colorizer) */}
          {/* Left Branch: SR */}
          <path 
            d="M 50% 135 C 50% 150, 25% 150, 25% 165" 
            fill="none" 
            stroke={currentStage >= 3 ? '#00FF66' : '#222222'} 
            strokeWidth="1.5" 
            strokeDasharray="5,5"
            style={{ animation: currentStage === 2 ? 'dash 1s linear infinite' : 'none' }}
          />
          {/* Right Branch: Colorizer */}
          <path 
            d="M 50% 135 C 50% 150, 75% 150, 75% 165" 
            fill="none" 
            stroke={currentStage >= 3 ? '#00FF66' : '#222222'} 
            strokeWidth="1.5" 
            strokeDasharray="5,5"
            style={{ animation: currentStage === 2 ? 'dash 1s linear infinite' : 'none' }}
          />

          {/* Left Branch (SR) to YOLO */}
          <path 
            d="M 25% 205 C 25% 220, 50% 220, 50% 233" 
            fill="none" 
            stroke={currentStage >= 4 ? '#00FF66' : '#222222'} 
            strokeWidth="1.5" 
            strokeDasharray="5,5"
            style={{ animation: currentStage === 3 ? 'dash 1s linear infinite' : 'none' }}
          />
          {/* Right Branch (Colorizer) to YOLO */}
          <path 
            d="M 75% 205 C 75% 220, 50% 220, 50% 233" 
            fill="none" 
            stroke={currentStage >= 4 ? '#00FF66' : '#222222'} 
            strokeWidth="1.5" 
            strokeDasharray="5,5"
            style={{ animation: currentStage === 3 ? 'dash 1s linear infinite' : 'none' }}
          />

          {/* YOLO to Metrics */}
          <line 
            x1="50%" y1="272" x2="50%" y2="285" 
            stroke={currentStage >= 5 ? '#00FF66' : '#222222'} 
            strokeWidth="1.5" 
            strokeDasharray="5,5"
            style={{ animation: currentStage === 4 ? 'dash 1s linear infinite' : 'none' }}
          />
        </svg>

        {/* Nodes (Overlay HTML) */}
        
        {/* Node 1: Preprocessing */}
        <div style={{
          position: 'absolute', top: '15px', left: '50%', transform: 'translateX(-50%)',
          width: '210px', height: '50px', borderRadius: '2px',
          background: currentStage === 1 ? 'rgba(0, 255, 102, 0.08)' : 'rgba(0, 0, 0, 0.85)',
          border: `1px solid ${currentStage === 1 ? '#00FF66' : currentStage > 1 ? 'rgba(0, 255, 102, 0.4)' : '#222222'}`,
          boxShadow: currentStage === 1 ? '0 0 12px rgba(0, 255, 102, 0.25)' : 'none',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 12px',
          transition: 'all 0.3s ease', zIndex: 5
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: currentStage >= 1 ? '#00FF66' : '#475569' }}>01 / PREPROCESS</span>
            {currentStage > 1 && <span style={{ color: '#00FF66', fontSize: '9px', fontWeight: 'bold' }}>✓ COMPLETE</span>}
            {currentStage === 1 && <span style={{ color: '#00FF66', fontSize: '9px', fontWeight: 'bold', animation: 'pulse 1s infinite' }}>● RUNNING</span>}
          </div>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>CLAHE & HEQ Alignment</span>
        </div>

        {/* Node 2: Backbone */}
        <div style={{
          position: 'absolute', top: '88px', left: '50%', transform: 'translateX(-50%)',
          width: '210px', height: '50px', borderRadius: '2px',
          background: currentStage === 2 ? 'rgba(0, 255, 102, 0.08)' : 'rgba(0, 0, 0, 0.85)',
          border: `1px solid ${currentStage === 2 ? '#00FF66' : currentStage > 2 ? 'rgba(0, 255, 102, 0.4)' : '#222222'}`,
          boxShadow: currentStage === 2 ? '0 0 12px rgba(0, 255, 102, 0.25)' : 'none',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 12px',
          transition: 'all 0.3s ease', zIndex: 5
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: currentStage >= 2 ? '#00FF66' : '#475569' }}>02 / ENCODER BACKBONE</span>
            {currentStage > 2 && <span style={{ color: '#00FF66', fontSize: '9px', fontWeight: 'bold' }}>✓ COMPLETE</span>}
            {currentStage === 2 && <span style={{ color: '#00FF66', fontSize: '9px', fontWeight: 'bold', animation: 'pulse 1s infinite' }}>● EXTRACTING</span>}
          </div>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>timm ResNet-50 Features</span>
        </div>

        {/* Dual Branch nodes */}
        {/* Node 3A: Super-Resolution (Left Branch) */}
        <div style={{
          position: 'absolute', top: '158px', left: '25%', transform: 'translateX(-50%)',
          width: '150px', height: '50px', borderRadius: '2px',
          background: currentStage === 3 ? 'rgba(0, 255, 102, 0.08)' : 'rgba(0, 0, 0, 0.85)',
          border: `1px solid ${currentStage === 3 ? '#00FF66' : currentStage > 3 ? 'rgba(0, 255, 102, 0.4)' : '#222222'}`,
          boxShadow: currentStage === 3 ? '0 0 12px rgba(0, 255, 102, 0.25)' : 'none',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 10px',
          transition: 'all 0.3s ease', zIndex: 5
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '9px', fontWeight: 700, color: currentStage >= 3 ? '#00FF66' : '#475569' }}>03A / SUPER-RES</span>
            {currentStage > 3 && <span style={{ color: '#00FF66', fontSize: '9px', fontWeight: 'bold' }}>✓</span>}
            {currentStage === 3 && <span style={{ color: '#00FF66', fontSize: '8px', animation: 'pulse 1s infinite' }}>● RUN</span>}
          </div>
          <span style={{ fontSize: '10px', fontWeight: 600, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Real-ESRGAN (4x SR)</span>
        </div>

        {/* Node 3B: Colorizer (Right Branch) */}
        <div style={{
          position: 'absolute', top: '158px', left: '75%', transform: 'translateX(-50%)',
          width: '150px', height: '50px', borderRadius: '2px',
          background: currentStage === 3 ? 'rgba(0, 255, 102, 0.08)' : 'rgba(0, 0, 0, 0.85)',
          border: `1px solid ${currentStage === 3 ? '#00FF66' : currentStage > 3 ? 'rgba(0, 255, 102, 0.4)' : '#222222'}`,
          boxShadow: currentStage === 3 ? '0 0 12px rgba(0, 255, 102, 0.25)' : 'none',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 10px',
          transition: 'all 0.3s ease', zIndex: 5
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '9px', fontWeight: 700, color: currentStage >= 3 ? '#00FF66' : '#475569' }}>03B / COLORIZER</span>
            {currentStage > 3 && <span style={{ color: '#00FF66', fontSize: '9px', fontWeight: 'bold' }}>✓</span>}
            {currentStage === 3 && <span style={{ color: '#00FF66', fontSize: '8px', animation: 'pulse 1s infinite' }}>● RUN</span>}
          </div>
          <span style={{ fontSize: '10px', fontWeight: 600, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>eccv16 Neural Colorizer</span>
        </div>

        {/* Node 4: YOLO Detector */}
        <div style={{
          position: 'absolute', top: '225px', left: '50%', transform: 'translateX(-50%)',
          width: '210px', height: '50px', borderRadius: '2px',
          background: currentStage === 4 ? 'rgba(0, 255, 102, 0.08)' : 'rgba(0, 0, 0, 0.85)',
          border: `1px solid ${currentStage === 4 ? '#00FF66' : currentStage > 4 ? 'rgba(0, 255, 102, 0.4)' : '#222222'}`,
          boxShadow: currentStage === 4 ? '0 0 12px rgba(0, 255, 102, 0.25)' : 'none',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 12px',
          transition: 'all 0.3s ease', zIndex: 5
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: currentStage >= 4 ? '#00FF66' : '#475569' }}>04 / DETECTION HEAD</span>
            {currentStage > 4 && <span style={{ color: '#00FF66', fontSize: '9px', fontWeight: 'bold' }}>✓ COMPLETE</span>}
            {currentStage === 4 && <span style={{ color: '#00FF66', fontSize: '9px', fontWeight: 'bold', animation: 'pulse 1s infinite' }}>● DETECTING</span>}
          </div>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>YOLO-World Open Vocab</span>
        </div>

        {/* Live scanner bar overlay when GPU is active */}
        {currentStage > 0 && (
          <motion.div
            initial={{ top: '0%' }}
            animate={{ top: ['0%', '100%'] }}
            transition={{ repeat: Infinity, repeatType: 'reverse', duration: 3, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: '2px',
              background: 'linear-gradient(to right, transparent, rgba(0, 255, 102, 0.4), transparent)',
              boxShadow: '0 0 8px rgba(0, 255, 102, 0.5)',
              zIndex: 1,
              pointerEvents: 'none'
            }}
          />
        )}
      </div>

      {/* Dynamic stage narrative */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStage}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.2 }}
          style={{ 
            fontSize: '12px', 
            color: '#94A3B8', 
            background: 'rgba(0, 255, 102, 0.02)', 
            border: '1px solid rgba(0, 255, 102, 0.2)', 
            borderRadius: '2px', 
            padding: '10px 14px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '2px' 
          }}
        >
          <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#00FF66', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            CONSOLE TELEMETRY OUTPUT
          </span>
          <span style={{ color: '#FFFFFF', fontWeight: 500, fontSize: '11px' }}>
            {currentStage === 0 && 'Awaiting upload packet transmission...'}
            {currentStage === 1 && 'Executing CLAHE & EqualizeHist contrast-alignment filter checks...'}
            {currentStage === 2 && 'Routing preprocessed matrices through ResNet-50 shared backbone encoder...'}
            {currentStage === 3 && 'Splitting tensor flow to super-resolution and Lab-space eccv16 decoder channels...'}
            {currentStage === 4 && 'Feeding colorized predictions to YOLO open-vocabulary localization head...'}
            {currentStage === 5 && 'Computing final quantitative SSIM/PSNR indices vs preprocessed anchor baseline...'}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
