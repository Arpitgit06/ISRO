import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import useAppStore from '../store/useAppStore';

function MetricCard({ label, value, unit = '', color = '#F97316', subtitle = '' }) {
  return (
    <div style={{ background: '#0D1525', border: '1px solid #1E3050', borderRadius: '8px', padding: '12px 14px', flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '9px', color: '#334155', letterSpacing: '0.12em', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '24px', fontWeight: 700, color, lineHeight: 1, marginBottom: '2px' }}>
        {value !== null && value !== undefined ? value : '—'}
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

export default function TelemetryPanel() {
  const { metrics, latency, detections, classCount, isProcessing } = useAppStore();
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '16px', overflowY: 'auto', height: '100%' }}>
      <section>
        <SectionHeader title="QUALITY METRICS" />
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <MetricCard label="PSNR  ENHANCED" value={metrics?.psnr_enhanced?.toFixed(2)} unit="dB" color="#F97316" subtitle="vs IR baseline (SR)" />
          <MetricCard label="PSNR  COLORIZED" value={metrics?.psnr_colorized?.toFixed(2)} unit="dB" color="#06B6D4" subtitle="vs IR baseline (RGB)" />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <MetricCard label="SSIM  COLORIZED" value={metrics?.ssim_colorized?.toFixed(4)} color="#10B981" subtitle="structural similarity (↑ better)" />
          <MetricCard label="LPIPS  COLORIZED" value={metrics?.lpips_colorized?.toFixed(4)} color="#EAB308" subtitle="perceptual distance (↓ better)" />
        </div>
      </section>
      <section>
        <SectionHeader title="DETECTION RESULTS" accent="#06B6D4" />
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <MetricCard label="TOTAL OBJECTS" value={hasData ? detections.length : null} color="#E2E8F0" />
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
        {hasData && detectionData.length === 0 && <p style={{ fontSize: '11px', color: '#334155', padding: '8px 0' }}>No objects detected above threshold.</p>}
      </section>
      <section>
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
              <span style={{ fontSize: '10px', color: '#64748B' }}>TOTAL PIPELINE</span>
              <span style={{ fontSize: '12px', color: '#F97316', fontWeight: 700 }}>{latency.total_ms?.toFixed(0)} ms</span>
            </div>
          </>
        )}
      </section>
      {!hasData && !isProcessing && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: '#1E3050' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1E3050" strokeWidth="1"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
          <p style={{ fontSize: '11px', color: '#334155', textAlign: 'center', letterSpacing: '0.1em' }}>AWAITING MISSION DATA</p>
        </div>
      )}
      {isProcessing && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          {['RUNNING CLAHE', 'EXTRACTING FEATURES', 'SUPER-RESOLVING', 'COLORIZING', 'DETECTING'].map((s, i) => (
            <div key={s} style={{ fontSize: '9px', color: '#F97316', opacity: 0.3 + i * 0.15, letterSpacing: '0.12em' }}>▶ {s}</div>
          ))}
        </div>
      )}
    </div>
  );
}
