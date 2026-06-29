import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import anime from 'animejs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import useAppStore from '../store/useAppStore';

function AnimatedNumber({ value, decimals = 2 }) {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValueRef = useRef(0);
  const targetRef = useRef({ val: 0 });

  useEffect(() => {
    const startVal = prevValueRef.current;
    const currentTarget = targetRef.current;
    currentTarget.val = startVal;
    
    const factor = 10 ** decimals;
    anime({
      targets: currentTarget,
      val: value || 0,
      round: factor,
      duration: 1000,
      easing: 'easeOutExpo',
      update: () => {
        setDisplayValue(currentTarget.val);
      }
    });

    prevValueRef.current = value || 0;
    return () => anime.remove(currentTarget);
  }, [value, decimals]);

  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }

  return (displayValue / (10 ** decimals)).toFixed(decimals);
}

function MetricCard({ label, value, unit = '', color = '#F97316', subtitle = '', decimals = 2 }) {
  return (
    <div style={{ background: '#0D1525', border: '1px solid #1E3050', borderRadius: '8px', padding: '12px 14px', flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '9px', color: '#334155', letterSpacing: '0.12em', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '24px', fontWeight: 700, color, lineHeight: 1, marginBottom: '2px' }}>
        {value !== null && value !== undefined && !isNaN(value) ? (
          <AnimatedNumber value={value * (10 ** decimals)} decimals={decimals} />
        ) : '—'}
        <span style={{ fontSize: '12px', color: '#64748B', marginLeft: '3px' }}>{unit}</span>
      </div>
      {subtitle && <div style={{ fontSize: '10px', color: '#334155', marginTop: '4px' }}>{subtitle}</div>}
    </div>
  );
}

function SectionHeader({ title, accent = '#F97316' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
      <div style={{ width: '3px', height: '14px', background: accent, borderRadius: '2px' }} />
      <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', letterSpacing: '0.12em' }}>{title}</span>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0D1525', border: '1px solid #1E3050', borderRadius: '6px', padding: '6px 10px', fontSize: '11px' }}>
      <p style={{ color: '#64748B', marginBottom: '2px' }}>{label}</p>
      <p style={{ color: '#F97316' }}>{payload[0].value?.toFixed?.(1) ?? payload[0].value}</p>
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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#050810', border: '1px solid #1E3050', borderRadius: '8px', padding: '16px', fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', overflowY: 'hidden', color: '#10B981', boxShadow: 'inset 0 0 15px rgba(16, 185, 129, 0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1E3050', paddingBottom: '6px', marginBottom: '10px', color: '#64748B' }}>
        <span>📡 TELEMETRY ENGINE LOGS</span>
        <span style={{ animation: 'pulse 1.2s infinite' }}>● RUNNING</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', height: '100%', scrollbarWidth: 'none' }}>
        {logs.map((log, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15 }}
            style={{ color: i === logs.length - 1 ? '#F97316' : '#10B981' }}
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

  const CLASS_COLORS_MAP = {
    Vehicle: '#F97316', Building: '#06B6D4', Road: '#10B981', Vegetation: '#84CC16',
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '16px', overflowY: 'auto', height: '100%' }}>
      {isProcessing && <TerminalConsole />}
      
      {!hasData && !isProcessing && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: '#1E3050' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1E3050" strokeWidth="1"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
          <p style={{ fontSize: '11px', color: '#334155', textAlign: 'center', letterSpacing: '0.1em' }}>AWAITING MISSION DATA</p>
        </div>
      )}

      {hasData && !isProcessing && (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
        >
          <motion.section variants={itemVariants}>
            <SectionHeader title="QUALITY METRICS" />
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <MetricCard label="PSNR  ENHANCED" value={metrics?.psnr_enhanced} unit="dB" color="#F97316" subtitle="vs IR baseline (SR)" decimals={2} />
              <MetricCard label="PSNR  COLORIZED" value={metrics?.psnr_colorized} unit="dB" color="#06B6D4" subtitle="vs IR baseline (RGB)" decimals={2} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <MetricCard label="SSIM  COLORIZED" value={metrics?.ssim_colorized} color="#10B981" subtitle="structural similarity (↑ better)" decimals={4} />
              <MetricCard label="LPIPS  COLORIZED" value={metrics?.lpips_colorized} color="#EAB308" subtitle="perceptual distance (↓ better)" decimals={4} />
            </div>
          </motion.section>

          <motion.section variants={itemVariants}>
            <SectionHeader title="DETECTION RESULTS" accent="#06B6D4" />
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <MetricCard label="TOTAL OBJECTS" value={detections.length} color="#E2E8F0" decimals={0} />
              <MetricCard label="DETECTION MODE" value={hasData ? 'YOLO-W' : null} color="#64748B" subtitle={hasData ? 'open-vocabulary' : ''} />
            </div>
            {detectionData.length > 0 && (
              <div style={{ background: '#0D1525', border: '1px solid #1E3050', borderRadius: '8px', padding: '12px 10px' }}>
                <ResponsiveContainer width="100%" height={100}>
                  <BarChart data={detectionData} margin={{ top: 0, right: 8, bottom: 0, left: -20 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 9, fill: '#334155' }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                      {detectionData.map((d) => (<Cell key={d.label} fill={CLASS_COLORS_MAP[d.label] || '#F97316'} />))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            
            {detectionData.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                {detectionData.map((d) => {
                  const labelLower = d.label.toLowerCase();
                  const color = CLASS_COLORS_MAP[d.label] || '#F97316';
                  const isHighlighted = hoveredClass === labelLower;
                  return (
                    <motion.div
                      key={d.label}
                      onMouseEnter={() => setHoveredClass(labelLower)}
                      onMouseLeave={() => setHoveredClass(null)}
                      whileHover={{ scale: 1.03 }}
                      animate={{
                        borderColor: isHighlighted ? color : '#1E3050',
                        boxShadow: isHighlighted ? `0 0 10px ${color}33` : 'none',
                        background: isHighlighted ? `${color}11` : '#0D1525',
                      }}
                      style={{
                        flex: '1 1 calc(50% - 4px)',
                        border: '1px solid #1E3050',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'border-color 0.2s, background-color 0.2s',
                      }}
                    >
                      <span style={{ fontSize: '9px', color: '#64748B', fontWeight: 700, letterSpacing: '0.05em' }}>{d.label.toUpperCase()}</span>
                      <span style={{ fontSize: '13px', fontWeight: 800, color }}>
                        <AnimatedNumber value={d.count} decimals={0} />
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            )}
            {hasData && detectionData.length === 0 && <p style={{ fontSize: '11px', color: '#334155', padding: '8px 0' }}>No objects detected above threshold.</p>}
          </motion.section>

          <motion.section variants={itemVariants}>
            <SectionHeader title="PIPELINE LATENCY" accent="#10B981" />
            {latency && (
              <>
                <div style={{ background: '#0D1525', border: '1px solid #1E3050', borderRadius: '8px', padding: '12px 10px' }}>
                  <ResponsiveContainer width="100%" height={90}>
                    <BarChart data={latencyData} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 0 }}>
                      <XAxis type="number" tick={{ fontSize: 9, fill: '#334155' }} unit="ms" />
                      <YAxis dataKey="stage" type="category" width={28} tick={{ fontSize: 9, fill: '#64748B' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="ms" fill="#F97316" radius={[0, 3, 3, 0]} opacity={0.8} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ marginTop: '8px', padding: '8px 10px', background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 600 }}>TOTAL PIPELINE</span>
                  <span style={{ fontSize: '12px', color: '#F97316', fontWeight: 800 }}>
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
