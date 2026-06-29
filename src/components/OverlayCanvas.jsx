import { useRef, useEffect } from 'react';
import { useOverlay } from '../hooks/useOverlay';
import useAppStore from '../store/useAppStore';

export default function OverlayCanvas({ imageRef }) {
  const canvasRef = useRef(null);
  const { overlays } = useAppStore();
  const { redraw } = useOverlay(canvasRef, imageRef);

  useEffect(() => {
    const observer = new ResizeObserver(redraw);
    if (imageRef.current) observer.observe(imageRef.current);
    return () => observer.disconnect();
  }, [imageRef, redraw]);

  const anyActive = overlays.gradcam;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        opacity: anyActive ? 1 : 0,
        transition: 'opacity 0.2s',
        zIndex: 10,
      }}
      aria-hidden="true"
    />
  );
}
