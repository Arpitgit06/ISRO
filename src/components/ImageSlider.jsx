import { useRef, useState, useCallback, useEffect } from 'react';
import useAppStore from '../store/useAppStore';
import OverlayCanvas from './OverlayCanvas';

const VIEWS = [
  { key: 'raw', label: 'RAW IR' },
  { key: 'preprocessed', label: 'CLAHE' },
  { key: 'enhanced', label: '4× SR' },
  { key: 'colorized', label: 'RGB' },
];

export default function ImageSlider() {
  const { images, activeView, setActiveView, sliderPos, setSliderPos } = useAppStore();
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef(null);
  const imageRef = useRef(null);

  const handleMove = useCallback((clientX) => {
    if (!dragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setSliderPos(pos);
  }, [dragging, setSliderPos]);

  useEffect(() => {
    const onUp = () => setDragging(false);
    const onMove = (e) => handleMove(e.clientX);
    const onTouch = (e) => handleMove(e.touches[0].clientX);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchend', onUp);
    window.addEventListener('touchmove', onTouch, { passive: true });
    return () => {
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchend', onUp);
      window.removeEventListener('touchmove', onTouch);
    };
  }, [handleMove]);

  const leftSrc = `data:image/png;base64,${images.raw}`;
  const rightSrc = `data:image/png;base64,${images[activeView]}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', gap: '4px', padding: '8px 12px', borderBottom: '1px solid #1E3050' }}>
        <span style={{ fontSize: '10px', color: '#64748B', marginRight: '8px', alignSelf: 'center' }}>COMPARE LEFT: RAW IR  |  RIGHT:</span>
        {VIEWS.slice(1).map((v) => (
          <button key={v.key} onClick={() => setActiveView(v.key)} style={{ padding: '4px 12px', background: activeView === v.key ? '#F97316' : 'transparent', color: activeView === v.key ? '#000' : '#64748B', border: `1px solid ${activeView === v.key ? '#F97316' : '#1E3050'}`, borderRadius: '4px', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>
            {v.label}
          </button>
        ))}
      </div>
      <div ref={containerRef} style={{ position: 'relative', flex: 1, overflow: 'hidden', userSelect: 'none' }}>
        <img ref={imageRef} src={rightSrc} alt={activeView} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} draggable={false} />
        <img src={leftSrc} alt="raw ir" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', clipPath: `inset(0 ${100 - sliderPos}% 0 0)`, pointerEvents: 'none' }} draggable={false} />
        <OverlayCanvas imageRef={imageRef} />
        <div onMouseDown={(e) => { e.preventDefault(); setDragging(true); }} onTouchStart={(e) => { e.preventDefault(); setDragging(true); }} style={{ position: 'absolute', top: 0, bottom: 0, left: `${sliderPos}%`, transform: 'translateX(-50%)', width: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'ew-resize', zIndex: 20 }}>
          <div style={{ position: 'absolute', top: 0, bottom: 0, width: '2px', background: '#F97316' }} />
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0A0E1A', border: '2px solid #F97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2.5">
              <path d="M9 18l-6-6 6-6M15 6l6 6-6 6" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
