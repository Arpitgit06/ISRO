import { useEffect, useRef, useState } from 'react';
import anime from 'animejs';

export default function BootScreen({ onComplete }) {
  const [percent, setPercent] = useState(0);
  const containerRef = useRef(null);
  const progressValRef = useRef({ val: 0 });
  const linesRef = useRef(null);

  useEffect(() => {
    // 1. Text typing and line reveals
    const textLines = linesRef.current.children;
    anime.set(textLines, { opacity: 0, translateY: 15 });

    const tl = anime.timeline({
      easing: 'easeOutExpo',
      complete: () => {
        // Delay a bit, then fade out the whole boot screen
        setTimeout(() => {
          anime({
            targets: containerRef.current,
            opacity: 0,
            duration: 800,
            easing: 'easeInOutQuad',
            complete: onComplete
          });
        }, 600);
      }
    });

    // Staggered reveal of status messages
    tl.add({
      targets: textLines,
      opacity: [0, 1],
      translateY: [15, 0],
      delay: anime.stagger(300),
      duration: 600,
    });

    // Progress bar fill from 0 to 100
    tl.add({
      targets: progressValRef.current,
      val: 100,
      round: 1,
      duration: 1800,
      easing: 'easeInOutQuad',
      update: () => {
        setPercent(progressValRef.current.val);
      }
    }, 0); // start immediately

    // Hexagon logo scale and spin
    anime({
      targets: '.boot-logo',
      scale: [0.5, 1],
      rotate: '2turn',
      duration: 1800,
      easing: 'easeInOutElastic(1, .6)'
    });

    // Scan lines noise animation
    anime({
      targets: '.scan-line',
      translateY: ['-100%', '100%'],
      duration: 3000,
      loop: true,
      easing: 'linear'
    });

  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#040711',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'JetBrains Mono', monospace",
        color: '#F97316',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Background Cyberpunk Grid */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(rgba(249, 115, 22, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(249, 115, 22, 0.04) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
          opacity: 0.7,
          pointerEvents: 'none',
        }}
      />

      {/* Moving Laser Scan Line */}
      <div 
        className="scan-line"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: '6px',
          background: 'linear-gradient(to bottom, transparent, rgba(249, 115, 22, 0.4), transparent)',
          boxShadow: '0 0 15px rgba(249, 115, 22, 0.6)',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      {/* Futuristic Logo Container */}
      <div style={{ position: 'relative', marginBottom: '40px', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div 
          className="boot-logo"
          style={{ 
            width: '80px', 
            height: '80px', 
            background: 'linear-gradient(135deg, #F97316, #EA580C)', 
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            boxShadow: '0 0 30px rgba(249, 115, 22, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '15px'
          }}
        >
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#040711' }}>T</div>
        </div>
        <div style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '0.3em', color: '#E2E8F0', textShadow: '0 0 10px rgba(249, 115, 22, 0.5)' }}>TESSERACTZ</div>
        <div style={{ fontSize: '9px', color: '#475569', letterSpacing: '0.15em', marginTop: '6px', fontWeight: 600 }}>BHARATIYA ANTARIKSH HACKATHON</div>
      </div>

      {/* Interactive Command Lines */}
      <div 
        ref={linesRef}
        style={{ 
          width: '420px', 
          height: '110px',
          fontSize: '11px', 
          color: '#06B6D4', 
          textAlign: 'left', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '6px',
          background: 'rgba(6, 11, 20, 0.8)',
          border: '1px solid rgba(6, 182, 212, 0.2)',
          padding: '16px',
          borderRadius: '6px',
          boxShadow: 'inset 0 0 15px rgba(6, 182, 212, 0.03)',
          marginBottom: '24px',
          zIndex: 3
        }}
      >
        <div>📡 SECURE LINK: RISAT-1A [ESTABLISHING...]</div>
        <div>💻 ENGINES: CLAHE + REAL-ESRGAN + YOLO-W [WARMING UP]</div>
        <div>💾 DATABASE: SCHEMAS & METRICS [MOUNTED]</div>
        <div style={{ color: '#10B981' }}>🚀 STATUS: MISSION HUB ONLINE & ACTIVE</div>
      </div>

      {/* Progress Bar Container */}
      <div style={{ width: '420px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 3 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#64748B', fontWeight: 600, letterSpacing: '0.08em' }}>
          <span>BOOT SYSTEM ENGINES...</span>
          <span style={{ color: '#F97316', fontWeight: 'bold' }}>{percent}%</span>
        </div>
        <div style={{ height: '4px', background: '#0D1525', border: '1px solid rgba(249, 115, 22, 0.15)', borderRadius: '2px', overflow: 'hidden' }}>
          <div 
            style={{ 
              height: '100%', 
              width: `${percent}%`, 
              background: 'linear-gradient(90deg, #F97316, #06B6D4)', 
              boxShadow: '0 0 8px rgba(249, 115, 22, 0.6)'
            }} 
          />
        </div>
      </div>
    </div>
  );
}
