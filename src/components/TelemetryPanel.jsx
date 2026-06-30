import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import anime from 'animejs';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar, Cell } from 'recharts';
import useAppStore from '../store/useAppStore';

function AnimatedNumber({ value, decimals = 2 }) {
  const ref = useRef(null);
  const prevValueRef = useRef(0);

  useEffect(() => {
    const currentTarget = { val: prevValueRef.current };
    anime({
      targets: currentTarget,
      val: value,
      round: false,
      duration: 1000,
      easing: 'easeOutExpo',
      update: () => {
        if (ref.current) {
          ref.current.textContent = (currentTarget.val / (10 ** decimals)).toFixed(decimals);
        }
      },
      complete: () => {
        prevValueRef.current = value;
      }
    });
    return () => anime.remove(currentTarget);
  }, [value, decimals]);

  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }

  return (
    <span ref={ref}>
      {(prevValueRef.current / (10 ** decimals)).toFixed(decimals)}
    </span>
  );
}

function MetricCard({ label, value, unit = '', color = 'var(--accent-color)', subtitle = '', decimals = 2 }) {
  return (
    <div style={{ 
      background: 'rgba(0, 0, 0, 0.2)', 
      backdropFilter: 'blur(2px)',
      WebkitBackdropFilter: 'blur(2px)',
      border: '1px solid var(--accent-dim)', 
      borderRadius: '2px', 
      padding: '12px 14px', 
      flex: 1, 
      minWidth: 0,
      fontFamily: "'Share Tech Mono', monospace"
    }}>
      <div style={{ fontSize: '9px', color: '#475569', letterSpacing: '0.12em', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '24px', fontWeight: 700, color, lineHeight: 1, marginBottom: '2px', fontFamily: "'Orbitron', sans-serif" }}>
        {value !== null && value !== undefined && !isNaN(value) ? (
          <AnimatedNumber value={value * (10 ** decimals)} decimals={decimals} />
        ) : '—'}
        <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginLeft: '3px', fontFamily: "'Share Tech Mono', monospace" }}>{unit}</span>
      </div>
      {subtitle && <div style={{ fontSize: '9.5px', color: 'rgba(255, 255, 255, 0.3)', marginTop: '4px' }}>{subtitle.toUpperCase()}</div>}
    </div>
  );
}

function SectionHeader({ title, accent = 'var(--accent-color)' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontFamily: "'Share Tech Mono', monospace" }}>
      <div style={{ width: '3px', height: '14px', background: accent, borderRadius: '1px', boxShadow: `0 0 6px ${accent}` }} />
      <span style={{ fontSize: '10px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.12em' }}>{title}</span>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#000000', border: '1px solid var(--accent-dim)', borderRadius: '2px', padding: '6px 10px', fontSize: '11px', fontFamily: "'Share Tech Mono', monospace" }}>
      <p style={{ color: '#64748B', marginBottom: '2px' }}>{label.toUpperCase()}</p>
      <p style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>{payload[0].value?.toFixed?.(1) ?? payload[0].value}</p>
    </div>
  );
};

function TerminalConsole() {
  const [logs, setLogs] = useState([]);
  const logSequence = [
    'INITIATING FRAME EXTRACTION...',
    'APPLYING CONTRAST LIMITED ADAPTIVE HISTOGRAM EQUALIZATION (CLAHE)...',
    'WARMING BILINEAR BACKBONE FEATURE MAPS...',
    'RUNNING REAL-ESRGAN NEURAL SUPER-RESOLUTION (4x ENHANCEMENT)...',
    'INTERPOLATING DUAL-CHANNEL INFRARED RADIOMETRY...',
    'RUNNING ECCV16 NEURAL COLORIZATION TRANSFORM...',
    'MAPPING CHROMINANCE MATRICES TO RGB CHANNELS...',
    'EXECUTING YOLO-WORLD ZERO-SHOT DETECTOR HEAD...',
    'CALCULATING PEAK SIGNAL-TO-NOISE RATIO (PSNR)...',
    'CALCULATING STRUCTURAL SIMILARITY INDEX (SSIM)...',
    'RENDERING GRADIENT-WEIGHTED CLASS ACTIVATION MAPS (GRAD-CAM)...',
    'PARSING TELEMETRY FRAME STREAM...',
  ];

  useEffect(() => {
    setLogs([]);
    let curIndex = 0;
    const addLog = () => {
      if (curIndex < logSequence.length) {
        setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${logSequence[curIndex]}`]);
        curIndex++;
        const nextTime = Math.random() * 250 + 100;
        setTimeout(addLog, nextTime);
      }
    };
    addLog();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column', 
      background: 'rgba(0, 0, 0, 0.2)', 
      backdropFilter: 'blur(2px)',
      WebkitBackdropFilter: 'blur(2px)',
      border: '1px solid var(--accent-dim)', 
      borderRadius: '2px', 
      padding: '16px', 
      fontFamily: "'Share Tech Mono', 'JetBrains Mono', monospace", 
      fontSize: '10px', 
      overflowY: 'hidden', 
      color: 'var(--accent-color)', 
      boxShadow: 'inset 0 0 15px var(--accent-glow)' 
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--accent-dim)', paddingBottom: '6px', marginBottom: '10px', color: '#475569' }}>
        <span>📡 TELEMETRY ENGINE LOGS</span>
        <span style={{ animation: 'pulse 1.2s infinite', color: 'var(--accent-color)' }}>● RUNNING</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', height: '100%', scrollbarWidth: 'none' }}>
        {logs.map((log, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15 }}
            style={{ color: i === logs.length - 1 ? '#FFFFFF' : 'var(--accent-color)' }}
          >
            {log}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function TelemetryPanel() {
  const { metrics, latency, detections, classCount, isProcessing, hoveredClass, setHoveredClass } = useAppStore();
  const hasData = !!metrics;

  const latencyData = latency ? [
    { stage: 'PRE', ms: latency.preprocessing_ms || 0 },
    { stage: 'BB', ms: latency.backbone_ms || 0 },
    { stage: 'SR', ms: latency.esrgan_ms || 0 },
    { stage: 'CLR', ms: latency.colorization_ms || 0 },
    { stage: 'DET', ms: latency.detection_ms || 0 },
    { stage: 'MTR', ms: latency.metrics_ms || 0 },
  ] : [];

  const detectionData = Object.entries(classCount || {}).map(([label, count]) => ({
    label: label.charAt(0).toUpperCase() + label.slice(1),
    count,
  }));

  // Map detected classes to ISRO brand colors (saffron and blues)
  const CLASS_COLORS_MAP = {
    Vehicle: '#F26522',     // Saffron Orange
    Building: '#0082C8',    // ISRO Blue
    Road: '#005E99',        // Dark Blue
    Vegetation: '#FFA24D',  // Soft Saffron/Orange
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '16px', overflowY: 'auto', height: '100%', background: 'transparent' }}>
      {isProcessing && <TerminalConsole />}
      
      {!hasData && !isProcessing && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'var(--accent-dim)' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <p style={{ fontSize: '11px', color: '#475569', textAlign: 'center', letterSpacing: '0.12em', fontFamily: "'Share Tech Mono', monospace" }}>AWAITING MISSION DATA PACKET</p>
        </div>
      )}

      {hasData && !isProcessing && (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: "'Share Tech Mono', monospace" }}
        >
          <motion.section variants={itemVariants}>
            <SectionHeader title="QUALITY MATRIX METRICS" />
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <MetricCard label="PSNR ENHANCED" value={metrics?.psnr_enhanced} unit="dB" color="var(--accent-color)" subtitle="vs IR baseline (SR)" decimals={2} />
              <MetricCard label="PSNR COLORIZED" value={metrics?.psnr_colorized} unit="dB" color="var(--accent-color)" subtitle="vs IR baseline (RGB)" decimals={2} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <MetricCard label="SSIM COLORIZED" value={metrics?.ssim_colorized} color="var(--accent-color)" subtitle="structural similarity (↑ better)" decimals={4} />
              <MetricCard label="LPIPS COLORIZED" value={metrics?.lpips_colorized} color="var(--accent-color)" subtitle="perceptual distance (↓ better)" decimals={4} />
            </div>
          </motion.section>

          <motion.section variants={itemVariants}>
            <SectionHeader title="DETECTION SHIELD RESULTS" accent="var(--accent-color)" />
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <MetricCard label="TOTAL IDENTIFIED" value={detections.length} color="#FFFFFF" decimals={0} />
              <MetricCard label="DETECTION MODE" value={hasData ? 1 : null} color="var(--accent-color)" subtitle={hasData ? 'YOLO-W OPEN-VOCAB' : ''} decimals={0} />
            </div>
            {detectionData.length > 0 && (
              <div style={{ background: 'rgba(0, 0, 0, 0.45)', border: '1px solid var(--accent-dim)', borderRadius: '2px', padding: '12px 10px' }}>
                <ResponsiveContainer width="100%" height={100}>
                  <BarChart data={detectionData} margin={{ top: 0, right: 8, bottom: 0, left: -20 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#475569', fontFamily: 'Share Tech Mono' }} />
                    <YAxis tick={{ fontSize: 9, fill: '#475569', fontFamily: 'Share Tech Mono' }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                      {detectionData.map((d) => (<Cell key={d.label} fill={CLASS_COLORS_MAP[d.label] || 'var(--accent-color)'} />))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            
            {detectionData.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                {detectionData.map((d) => {
                  const labelLower = d.label.toLowerCase();
                  const color = CLASS_COLORS_MAP[d.label] || 'var(--accent-color)';
                  const isHighlighted = hoveredClass === labelLower;
                  return (
                    <motion.div
                      key={d.label}
                      onMouseEnter={() => setHoveredClass(labelLower)}
                      onMouseLeave={() => setHoveredClass(null)}
                      whileHover={{ scale: 1.03 }}
                      animate={{
                        borderColor: isHighlighted ? color : 'var(--accent-dim)',
                        boxShadow: isHighlighted ? `0 0 10px ${color}33` : 'none',
                        background: isHighlighted ? `${color}11` : 'rgba(0, 0, 0, 0.2)',
                      }}
                      style={{
                        flex: '1 1 calc(50% - 4px)',
                        border: '1px solid var(--accent-dim)',
                        borderRadius: '2px',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'border-color 0.2s, background-color 0.2s',
                      }}
                    >
                      <span style={{ fontSize: '9px', color: '#475569', fontWeight: 700, letterSpacing: '0.05em' }}>{d.label.toUpperCase()}</span>
                      <span style={{ fontSize: '13px', fontWeight: 800, color, fontFamily: "'Orbitron', sans-serif" }}>
                        <AnimatedNumber value={d.count} decimals={0} />
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            )}
            {hasData && detectionData.length === 0 && <p style={{ fontSize: '11px', color: '#475569', padding: '8px 0' }}>No objects detected above threshold.</p>}
          </motion.section>

          <motion.section variants={itemVariants}>
            <SectionHeader title="PROCESSING LATENCY CORES" accent="var(--accent-color)" />
            {latency && (
              <>
                <div style={{ background: 'rgba(0, 0, 0, 0.2)', border: '1px solid var(--accent-dim)', borderRadius: '2px', padding: '12px 10px' }}>
                  <ResponsiveContainer width="100%" height={90}>
                    <BarChart data={latencyData} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 0 }}>
                      <XAxis type="number" tick={{ fontSize: 9, fill: '#475569', fontFamily: 'Share Tech Mono' }} unit="ms" />
                      <YAxis dataKey="stage" type="category" width={28} tick={{ fontSize: 9, fill: '#475569', fontFamily: 'Share Tech Mono' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="ms" fill="var(--accent-color)" radius={[0, 2, 2, 0]} opacity={0.8} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ 
                  marginTop: '8px', 
                  padding: '8px 12px', 
                  background: 'var(--accent-glow)', 
                  border: '1px solid var(--accent-dim)', 
                  borderRadius: '2px', 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '10px', color: '#FFFFFF', fontWeight: 600, letterSpacing: '0.05em' }}>TOTAL PIPELINE COMPUTATION</span>
                  <span style={{ fontSize: '13px', color: 'var(--accent-color)', fontWeight: 800, fontFamily: "'Orbitron', sans-serif" }}>
                    <AnimatedNumber value={latency.total_ms} decimals={0} /> ms
                  </span>
                </div>
              </>
            )}
          </motion.section>
        </motion.div>
      )}
    </div>
  );
}
