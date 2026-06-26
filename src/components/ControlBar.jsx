import useAppStore from '../store/useAppStore';

const TOGGLES = [
  { key: 'bboxes', label: 'YOLO BOXES', color: '#F97316' },
  { key: 'gradcam', label: 'GRADCAM', color: '#06B6D4' },
  { key: 'masks', label: 'SEG MASKS', color: '#10B981', disabled: true },
];

export default function ControlBar({ onReset }) {
  const { overlays, toggleOverlay, images, latency, isProcessing } = useAppStore();
  const hasResults = !!images.colorized;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '10px 16px', background: '#060B14', borderTop: '1px solid #1E3050', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <span style={{ fontSize: '9px', color: '#334155', letterSpacing: '0.1em', marginRight: '4px' }}>OVERLAYS</span>
        {TOGGLES.map(({ key, label, color, disabled }) => {
          const on = overlays[key] && hasResults && !disabled;
          return (
            <button key={key} onClick={() => !disabled && hasResults && toggleOverlay(key)} disabled={disabled || !hasResults} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', background: on ? `${color}22` : 'transparent', border: `1px solid ${on ? color : '#1E3050'}`, borderRadius: '4px', color: on ? color : '#334155', fontSize: '10px', fontWeight: 700, cursor: disabled || !hasResults ? 'not-allowed' : 'pointer', opacity: disabled ? 0.35 : 1 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: on ? color : '#1E3050' }} />
              {label}
              {disabled && <span style={{ fontSize: '8px', color: '#334155' }}>(soon)</span>}
            </button>
          );
        })}
      </div>
      <div style={{ flex: 1 }} />
      {latency?.total_ms && (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {[
            { label: 'SR', val: latency.esrgan_ms },
            { label: 'CLR', val: latency.colorization_ms },
            { label: 'DET', val: latency.detection_ms },
          ].map(({ label, val }) => (
            <span key={label} style={{ fontSize: '10px', color: '#334155' }}>
              <span style={{ color: '#1E3050' }}>{label} </span>
              <span style={{ color: '#F97316' }}>{val?.toFixed(0)}</span>
              <span style={{ color: '#334155' }}>ms</span>
            </span>
          ))}
          <span style={{ padding: '3px 8px', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: '4px', fontSize: '10px', color: '#F97316' }}>TOTAL {latency.total_ms?.toFixed(0)}ms</span>
        </div>
      )}
      {hasResults && (
        <button onClick={onReset} style={{ padding: '5px 14px', background: 'transparent', border: '1px solid #1E3050', borderRadius: '4px', color: '#64748B', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>
          ✕ RESET
        </button>
      )}
      {isProcessing && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#F97316' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F97316' }} />PROCESSING</div>}
    </div>
  );
}
