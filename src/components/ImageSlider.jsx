import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAppStore from '../store/useAppStore';
import OverlayCanvas from './OverlayCanvas';
import OverlayHUD from './OverlayHUD';

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#000000', fontFamily: "'Share Tech Mono', monospace" }}>
      <div style={{ display: 'flex', gap: '4px', padding: '8px 12px', borderBottom: '1px solid rgba(0, 255, 102, 0.15)', alignItems: 'center' }}>
        <span style={{ fontSize: '10px', color: '#475569', marginRight: '8px', letterSpacing: '0.05em' }}>COMPARE LEFT: RAW IR  |  RIGHT:</span>
        {VIEWS.slice(1).map((v) => {
          const isSelected = activeView === v.key;
          return (
            <motion.button 
              key={v.key} 
              onClick={() => setActiveView(v.key)} 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ 
                position: 'relative',
                padding: '4px 12px', 
                background: isSelected ? '#00FF66' : 'transparent', 
                color: isSelected ? '#000000' : '#475569', 
                border: `1px solid ${isSelected ? '#00FF66' : 'rgba(0, 255, 102, 0.25)'}`, 
                borderRadius: '2px', 
                fontSize: '10px', 
                fontWeight: 700, 
                cursor: 'pointer',
                overflow: 'hidden',
                fontFamily: "'Share Tech Mono', monospace",
                letterSpacing: '0.05em',
                transition: 'color 0.2s, border-color 0.2s'
              }}
            >
              {isSelected && (
                <motion.span
                  layoutId="activeIndicator"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: '#00FF66',
                    zIndex: -1
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <span style={{ position: 'relative', zIndex: 1 }}>{v.label}</span>
            </motion.button>
          );
        })}
      </div>
      <div ref={containerRef} style={{ position: 'relative', flex: 1, overflow: 'hidden', userSelect: 'none', background: '#000000' }}>
        <AnimatePresence mode="wait">
          <motion.img 
            key={activeView}
            ref={imageRef} 
            src={rightSrc} 
            alt={activeView} 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} 
            draggable={false} 
          />
        </AnimatePresence>
        
        <img src={leftSrc} alt="raw ir" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', clipPath: `inset(0 ${100 - sliderPos}% 0 0)`, pointerEvents: 'none' }} draggable={false} />
        
        <OverlayHUD imageRef={imageRef} />
        <OverlayCanvas imageRef={imageRef} />
        
        <div 
          onMouseDown={(e) => { e.preventDefault(); setDragging(true); }} 
          onTouchStart={(e) => { e.preventDefault(); setDragging(true); }} 
          style={{ 
            position: 'absolute', 
            top: 0, 
            bottom: 0, 
            left: `${sliderPos}%`, 
            transform: 'translateX(-50%)', 
            width: '36px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            cursor: 'ew-resize', 
            zIndex: 20 
          }}
        >
          <div style={{ position: 'absolute', top: 0, bottom: 0, width: '2px', background: '#00FF66', boxShadow: '0 0 8px #00FF66' }} />
          <motion.div 
            whileHover={{ scale: 1.15, boxShadow: '0 0 12px #00FF66' }}
            whileTap={{ scale: 0.9 }}
            animate={{
              boxShadow: dragging ? '0 0 15px #00FF66' : '0 0 6px rgba(0, 255, 102, 0.4)'
            }}
            style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              background: '#000000', 
              border: '2px solid #00FF66', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00FF66" strokeWidth="2.5">
              <path d="M9 18l-6-6 6-6M15 6l6 6-6 6" />
            </svg>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
