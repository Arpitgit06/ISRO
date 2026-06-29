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
        box-shadow: 0 0 5px rgba(249, 115, 22, 0.2);
        border-color: rgba(249, 115, 22, 0.4);
      }
      50% {
        box-shadow: 0 0 20px rgba(249, 115, 22, 0.6);
        border-color: rgba(249, 115, 22, 1);
      }
    }
  `;

  return (
    <div style={{ width: '100%', minHeight: '380px', display: 'flex', flexDirection: 'column', gap: '16px', color: '#E2E8F0', padding: '10px 0' }}>
      <style>{inlineStyles}</style>

      {/* Header status indicator */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1E293B', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Telemetry Node Graph
          </span>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#E2E8F0' }}>
            {currentStage === 0 ? `Uploading Sensor Frame (${uploadProgress}%)` : `Running Inference Pipeline`}
          </span>
        </div>
        <div style={{ padding: '4px 10px', borderRadius: '4px', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F97316', display: 'inline-block', animation: 'pulse-node 1.5s infinite' }} />
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#F97316', letterSpacing: '0.05em' }}>
            {currentStage === 0 ? 'TX ACTIVE' : 'GPU COMPUTING'}
          </span>
        </div>
      </div>

      {/* Wireframe Diagram Container */}
      <div style={{ position: 'relative', width: '100%', height: '310px', border: '1px solid #1E3050', borderRadius: '10px', background: 'rgba(5, 9, 20, 0.95)', overflow: 'hidden' }}>
        {/* Wireframe Grid Background */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(6, 182, 212, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.03) 1px, transparent 1px)', backgroundSize: '20px 20px', pointerEvents: 'none' }} />

        {/* Connection Lines (SVG) */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <defs>
            <linearGradient id="cyan-blue" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
            <linearGradient id="blue-pink" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
          </defs>

          {/* Node 1 to Node 2 */}
          <line 
            x1="50%" y1="65" x2="50%" y2="98" 
            stroke={currentStage >= 2 ? '#3B82F6' : '#1E293B'} 
            strokeWidth="1.5"
            strokeDasharray="5,5"
            style={{ animation: currentStage === 1 ? 'dash 1s linear infinite' : 'none' }}
          />

          {/* Node 2 splits to Dual Branches (Node 3 SR and Node 3 Colorizer) */}
          {/* Left Branch: SR */}
          <path 
            d="M 50% 135 C 50% 150, 25% 150, 25% 165" 
            fill="none" 
            stroke={currentStage >= 3 ? '#EC4899' : '#1E293B'} 
            strokeWidth="1.5" 
            strokeDasharray="5,5"
            style={{ animation: currentStage === 2 ? 'dash 1s linear infinite' : 'none' }}
          />
          {/* Right Branch: Colorizer */}
          <path 
            d="M 50% 135 C 50% 150, 75% 150, 75% 165" 
            fill="none" 
            stroke={currentStage >= 3 ? '#EC4899' : '#1E293B'} 
            strokeWidth="1.5" 
            strokeDasharray="5,5"
            style={{ animation: currentStage === 2 ? 'dash 1s linear infinite' : 'none' }}
          />

          {/* Left Branch (SR) to YOLO */}
          <path 
            d="M 25% 205 C 25% 220, 50% 220, 50% 233" 
            fill="none" 
            stroke={currentStage >= 4 ? '#F59E0B' : '#1E293B'} 
            strokeWidth="1.5" 
            strokeDasharray="5,5"
            style={{ animation: currentStage === 3 ? 'dash 1s linear infinite' : 'none' }}
          />
          {/* Right Branch (Colorizer) to YOLO */}
          <path 
            d="M 75% 205 C 75% 220, 50% 220, 50% 233" 
            fill="none" 
            stroke={currentStage >= 4 ? '#F59E0B' : '#1E293B'} 
            strokeWidth="1.5" 
            strokeDasharray="5,5"
            style={{ animation: currentStage === 3 ? 'dash 1s linear infinite' : 'none' }}
          />

          {/* YOLO to Metrics */}
          <line 
            x1="50%" y1="272" x2="50%" y2="285" 
            stroke={currentStage >= 5 ? '#10B981' : '#1E293B'} 
            strokeWidth="1.5" 
            strokeDasharray="5,5"
            style={{ animation: currentStage === 4 ? 'dash 1s linear infinite' : 'none' }}
          />
        </svg>

        {/* Nodes (Overlay HTML) */}
        
        {/* Node 1: Preprocessing */}
        <div style={{
          position: 'absolute', top: '15px', left: '50%', transform: 'translateX(-50%)',
          width: '210px', height: '50px', borderRadius: '6px',
          background: currentStage === 1 ? 'rgba(6, 182, 212, 0.12)' : 'rgba(15, 23, 42, 0.8)',
          border: `1px solid ${currentStage === 1 ? '#06B6D4' : currentStage > 1 ? '#0284C7' : '#1E293B'}`,
          boxShadow: currentStage === 1 ? '0 0 12px rgba(6, 182, 212, 0.25)' : 'none',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 12px',
          transition: 'all 0.3s ease', zIndex: 5
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: currentStage >= 1 ? '#06B6D4' : '#64748B' }}>01 / PREPROCESS</span>
            {currentStage > 1 && <span style={{ color: '#06B6D4', fontSize: '10px' }}>✓ COMPLETE</span>}
            {currentStage === 1 && <span style={{ color: '#06B6D4', fontSize: '10px', animation: 'pulse 1s infinite' }}>● RUNNING</span>}
          </div>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#E2E8F0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>CLAHE & HEQ Alignment</span>
        </div>

        {/* Node 2: Backbone */}
        <div style={{
          position: 'absolute', top: '88px', left: '50%', transform: 'translateX(-50%)',
          width: '210px', height: '50px', borderRadius: '6px',
          background: currentStage === 2 ? 'rgba(59, 130, 246, 0.12)' : 'rgba(15, 23, 42, 0.8)',
          border: `1px solid ${currentStage === 2 ? '#3B82F6' : currentStage > 2 ? '#2563EB' : '#1E293B'}`,
          boxShadow: currentStage === 2 ? '0 0 12px rgba(59, 130, 246, 0.25)' : 'none',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 12px',
          transition: 'all 0.3s ease', zIndex: 5
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: currentStage >= 2 ? '#3B82F6' : '#64748B' }}>02 / ENCODER BACKBONE</span>
            {currentStage > 2 && <span style={{ color: '#3B82F6', fontSize: '10px' }}>✓ COMPLETE</span>}
            {currentStage === 2 && <span style={{ color: '#3B82F6', fontSize: '10px', animation: 'pulse 1s infinite' }}>● EXTRACTING</span>}
          </div>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#E2E8F0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>timm ResNet-50 Features</span>
        </div>

        {/* Dual Branch nodes */}
        {/* Node 3A: Super-Resolution (Left Branch) */}
        <div style={{
          position: 'absolute', top: '158px', left: '25%', transform: 'translateX(-50%)',
          width: '150px', height: '50px', borderRadius: '6px',
          background: currentStage === 3 ? 'rgba(236, 72, 153, 0.12)' : 'rgba(15, 23, 42, 0.8)',
          border: `1px solid ${currentStage === 3 ? '#EC4899' : currentStage > 3 ? '#C084FC' : '#1E293B'}`,
          boxShadow: currentStage === 3 ? '0 0 12px rgba(236, 72, 153, 0.25)' : 'none',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 10px',
          transition: 'all 0.3s ease', zIndex: 5
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '9px', fontWeight: 700, color: currentStage >= 3 ? '#EC4899' : '#64748B' }}>03A / SUPER-RES</span>
            {currentStage > 3 && <span style={{ color: '#EC4899', fontSize: '9px' }}>✓</span>}
          </div>
          <span style={{ fontSize: '10px', fontWeight: 600, color: '#E2E8F0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Real-ESRGAN (4x SR)</span>
        </div>

        {/* Node 3B: Colorizer (Right Branch) */}
        <div style={{
          position: 'absolute', top: '158px', left: '75%', transform: 'translateX(-50%)',
          width: '150px', height: '50px', borderRadius: '6px',
          background: currentStage === 3 ? 'rgba(236, 72, 153, 0.12)' : 'rgba(15, 23, 42, 0.8)',
          border: `1px solid ${currentStage === 3 ? '#EC4899' : currentStage > 3 ? '#C084FC' : '#1E293B'}`,
          boxShadow: currentStage === 3 ? '0 0 12px rgba(236, 72, 153, 0.25)' : 'none',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 10px',
          transition: 'all 0.3s ease', zIndex: 5
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '9px', fontWeight: 700, color: currentStage >= 3 ? '#EC4899' : '#64748B' }}>03B / COLORIZER</span>
            {currentStage > 3 && <span style={{ color: '#EC4899', fontSize: '9px' }}>✓</span>}
          </div>
          <span style={{ fontSize: '10px', fontWeight: 600, color: '#E2E8F0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>eccv16 Neural Colorizer</span>
        </div>

        {/* Node 4: YOLO Detector */}
        <div style={{
          position: 'absolute', top: '225px', left: '50%', transform: 'translateX(-50%)',
          width: '210px', height: '50px', borderRadius: '6px',
          background: currentStage === 4 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(15, 23, 42, 0.8)',
          border: `1px solid ${currentStage === 4 ? '#F59E0B' : currentStage > 4 ? '#D97706' : '#1E293B'}`,
          boxShadow: currentStage === 4 ? '0 0 12px rgba(245, 158, 11, 0.25)' : 'none',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 12px',
          transition: 'all 0.3s ease', zIndex: 5
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: currentStage >= 4 ? '#F59E0B' : '#64748B' }}>04 / DETECTION HEAD</span>
            {currentStage > 4 && <span style={{ color: '#F59E0B', fontSize: '10px' }}>✓ COMPLETE</span>}
            {currentStage === 4 && <span style={{ color: '#F59E0B', fontSize: '10px', animation: 'pulse 1s infinite' }}>● DETECTING</span>}
          </div>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#E2E8F0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>YOLO-World Open Vocab</span>
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
              background: 'linear-gradient(to right, transparent, rgba(6,182,212,0.4), transparent)',
              boxShadow: '0 0 8px rgba(6,182,212,0.5)',
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
          style={{ fontSize: '12px', color: '#94A3B8', background: 'rgba(30,41,59,0.2)', border: '1px solid #1E293B', borderRadius: '6px', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '2px' }}
        >
          <span style={{ fontSize: '9px', fontWeight: 700, color: '#F97316', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Console Telemetry Output
          </span>
          <span style={{ color: '#F8FAFC', fontWeight: 500 }}>
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
