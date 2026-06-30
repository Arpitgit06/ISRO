import { useEffect, useRef, useState } from 'react';
import anime from 'animejs';

export default function BootScreen({ onComplete }) {
  const [percent, setPercent] = useState(0);
  const containerRef = useRef(null);
  const progressValRef = useRef({ val: 0 });

  useEffect(() => {
    // Progress bar fill from 0 to 100
    anime({
      targets: progressValRef.current,
      val: 100,
      round: 1,
      duration: 2000,
      easing: 'easeInOutQuad',
      update: () => {
        setPercent(progressValRef.current.val);
      },
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
        }, 500);
      }
    });

    // Scan lines noise animation
    anime({
      targets: '.scan-line',
      translateY: ['-100%', '100%'],
      duration: 3500,
      loop: true,
      easing: 'linear'
    });
  }, [onComplete]);

  // SVG Circumference for radius 44 is 2 * PI * 44 = 276.46
  const strokeCircumference = 276.46;
  const strokeDashoffset = strokeCircumference - (strokeCircumference * percent) / 100;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000000',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Share Tech Mono', 'JetBrains Mono', monospace",
        color: '#0082C8', // ISRO Azure Blue
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Moving Laser Scan Line */}
      <div 
        className="scan-line"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(to bottom, transparent, rgba(0, 130, 200, 0.25), transparent)',
          boxShadow: '0 0 10px rgba(0, 130, 200, 0.4)',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      {/* Cybernetic Tech Grid BG */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(rgba(0, 130, 200, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 130, 200, 0.02) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          opacity: 0.8,
          pointerEvents: 'none',
        }}
      />

      {/* Sleek Circular Loading Ring Container */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}>
        <svg width="160" height="160" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
          {/* Track Circle */}
          <circle
            cx="50"
            cy="50"
            r="44"
            stroke="rgba(0, 130, 200, 0.1)"
            strokeWidth="1.5"
            fill="none"
          />
          {/* Progress Circle (ISRO Saffron Orange) */}
          <circle
            cx="50"
            cy="50"
            r="44"
            stroke="#F26522"
            strokeWidth="2"
            fill="none"
            strokeDasharray={strokeCircumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              filter: 'drop-shadow(0 0 4px rgba(242, 101, 34, 0.6))',
              transition: 'stroke-dashoffset 0.1s linear'
            }}
          />
        </svg>

        {/* Center Percentage Display */}
        <div 
          style={{ 
            position: 'absolute', 
            fontSize: '28px', 
            fontWeight: 'bold', 
            color: '#FFFFFF',
            fontFamily: "'Orbitron', sans-serif",
            textShadow: '0 0 15px rgba(0, 130, 200, 0.4)',
            letterSpacing: '0.05em'
          }}
        >
          {percent}<span style={{ fontSize: '14px', color: '#F26522', marginLeft: '2px' }}>%</span>
        </div>
      </div>

      {/* Minimalistic HUD Terminal Text */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 3, textAlign: 'center' }}>
        <div 
          style={{ 
            fontSize: '11px', 
            letterSpacing: '0.4em', 
            color: '#E2E8F0', 
            fontWeight: 'bold',
            fontFamily: "'Orbitron', sans-serif",
            marginLeft: '0.4em'
          }}
        >
          NishaDrishtiAI INIT SEQUENCE
        </div>
        <div style={{ fontSize: '9px', color: 'rgba(0, 130, 200, 0.65)', letterSpacing: '0.15em' }}>
          LOADING INFRARED SENSOR ENGINES...
        </div>
      </div>
    </div>
  );
}
