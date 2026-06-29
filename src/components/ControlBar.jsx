import useAppStore from '../store/useAppStore';

const TOGGLES = [
  { key: 'bboxes', label: 'YOLO BOXES', color: '#00FF66' },
  { key: 'gradcam', label: 'GRADCAM', color: '#00D655' },
  { key: 'masks', label: 'SEG MASKS', color: '#00993D', disabled: true },
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
      background: '#000000', 
      borderTop: '1px solid rgba(0, 255, 102, 0.25)', 
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
                background: on ? 'rgba(0, 255, 102, 0.08)' : 'transparent', 
                border: `1px solid ${on ? color : 'rgba(0, 255, 102, 0.15)'}`, 
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
                background: on ? color : 'rgba(0, 255, 102, 0.15)',
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
              <span style={{ color: '#00FF66', fontWeight: 'bold' }}>{val?.toFixed(0)}</span>
              <span style={{ color: '#475569' }}>ms</span>
            </span>
          ))}
          <span style={{ 
            padding: '3px 10px', 
            background: 'rgba(0, 255, 102, 0.05)', 
            border: '1px solid rgba(0, 255, 102, 0.3)', 
            borderRadius: '2px', 
            fontSize: '10px', 
            color: '#00FF66',
            boxShadow: '0 0 6px rgba(0, 255, 102, 0.15)',
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
            border: '1px solid rgba(0, 255, 102, 0.3)', 
            borderRadius: '2px', 
            color: '#00FF66', 
            fontSize: '10px', 
            fontWeight: 700, 
            cursor: 'pointer',
            fontFamily: "'Share Tech Mono', monospace",
            letterSpacing: '0.05em',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 10px rgba(0,255,102,0.3)'; e.currentTarget.style.borderColor = '#00FF66'; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(0, 255, 102, 0.3)'; }}
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
          color: '#00FF66',
          letterSpacing: '0.05em',
          fontWeight: 'bold'
        }}>
          <span style={{ 
            width: '6px', 
            height: '6px', 
            borderRadius: '50%', 
            background: '#00FF66',
            boxShadow: '0 0 4px #00FF66',
            animation: 'pulse 1s infinite'
          }} />
          PROCESSING
        </div>
      )}
    </div>
  );
}
