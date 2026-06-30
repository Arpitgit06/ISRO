import useAppStore from '../store/useAppStore';

const TOGGLES = [
  { key: 'bboxes', label: 'YOLO BOXES', color: '#F26522' },          // ISRO Saffron
  { key: 'gradcam', label: 'GRADCAM', color: 'var(--accent-color)' }, // Dynamic Theme Blue
  { key: 'masks', label: 'SEG MASKS', color: 'var(--accent-dim)', disabled: true },
];

export default function ControlBar({ onReset }) {
  const { overlays, toggleOverlay, images, latency, isProcessing } = useAppStore();
  const hasResults = !!images.colorized;

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '16px', 
      padding: '12px 20px', 
      background: 'rgba(0, 0, 0, 0.2)', 
      backdropFilter: 'blur(2px)',
      WebkitBackdropFilter: 'blur(2px)',
      borderTop: '1px solid var(--accent-dim)', 
      flexWrap: 'wrap',
      fontFamily: "'Share Tech Mono', monospace"
    }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <span style={{ fontSize: '9px', color: '#475569', letterSpacing: '0.1em', marginRight: '4px' }}>OVERLAYS</span>
        {TOGGLES.map(({ key, label, color, disabled }) => {
          const on = overlays[key] && hasResults && !disabled;
          return (
            <button 
              key={key} 
              onClick={() => !disabled && hasResults && toggleOverlay(key)} 
              disabled={disabled || !hasResults} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                padding: '6px 12px', 
                background: on ? (key === 'bboxes' ? 'rgba(242, 101, 34, 0.1)' : 'var(--accent-glow)') : 'transparent', 
                border: `1px solid ${on ? color : 'var(--accent-dim)'}`, 
                borderRadius: '2px', 
                color: on ? color : '#475569', 
                fontSize: '10px', 
                fontWeight: 700, 
                cursor: disabled || !hasResults ? 'not-allowed' : 'pointer', 
                opacity: disabled ? 0.35 : 1,
                fontFamily: "'Share Tech Mono', monospace",
                letterSpacing: '0.05em',
                boxShadow: on ? `0 0 10px ${color}22` : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{ 
                width: '6px', 
                height: '6px', 
                borderRadius: '50%', 
                background: on ? color : 'var(--accent-dim)',
                boxShadow: on ? `0 0 4px ${color}` : 'none'
              }} />
              {label}
              {disabled && <span style={{ fontSize: '8px', color: '#475569', marginLeft: '2px' }}>(SOON)</span>}
            </button>
          );
        })}
      </div>
      
      <div style={{ flex: 1 }} />
      
      {latency?.total_ms && (
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          {[
            { label: 'SR', val: latency.esrgan_ms },
            { label: 'CLR', val: latency.colorization_ms },
            { label: 'DET', val: latency.detection_ms },
          ].map(({ label, val }) => (
            <span key={label} style={{ fontSize: '10px', color: '#475569', letterSpacing: '0.05em' }}>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>{label}: </span>
              <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>{val?.toFixed(0)}</span>
              <span style={{ color: '#475569' }}>ms</span>
            </span>
          ))}
          <span style={{ 
            padding: '3px 10px', 
            background: 'var(--accent-glow)', 
            border: '1px solid var(--accent-dim)', 
            borderRadius: '2px', 
            fontSize: '10px', 
            color: 'var(--accent-color)',
            boxShadow: '0 0 6px var(--accent-glow)',
            letterSpacing: '0.05em'
          }}>
            TOTAL {latency.total_ms?.toFixed(0)}ms
          </span>
        </div>
      )}
      
      {hasResults && (
        <button 
          onClick={onReset} 
          style={{ 
            padding: '5px 14px', 
            background: 'transparent', 
            border: '1px solid var(--accent-dim)', 
            borderRadius: '2px', 
            color: 'var(--accent-color)', 
            fontSize: '10px', 
            fontWeight: 700, 
            cursor: 'pointer',
            fontFamily: "'Share Tech Mono', monospace",
            letterSpacing: '0.05em',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 10px var(--accent-glow)'; e.currentTarget.style.borderColor = 'var(--accent-color)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--accent-dim)'; }}
        >
          ✕ RESET
        </button>
      )}
      
      {isProcessing && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px', 
          fontSize: '10px', 
          color: 'var(--accent-color)',
          letterSpacing: '0.05em',
          fontWeight: 'bold'
        }}>
          <span style={{ 
            width: '6px', 
            height: '6px', 
            borderRadius: '50%', 
            background: 'var(--accent-color)',
            boxShadow: '0 0 4px var(--accent-color)',
            animation: 'pulse 1s infinite'
          }} />
          PROCESSING
        </div>
      )}
    </div>
  );
}
