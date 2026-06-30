import { useCallback, useEffect } from 'react';
import useAppStore from '../store/useAppStore';

// Color palette for detection classes (used when box drawing is enabled)
// eslint-disable-next-line no-unused-vars
const CLASS_COLORS = {
  vehicle: '#F97316',
  building: '#06B6D4',
  road: '#005E99',        // ISRO Dark Blue
  vegetation: '#FFA24D',  // Soft Saffron/Orange
};

export function useOverlay(canvasRef, imageRef) {
  const { detections, images, overlays } = useAppStore();

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const cw = img.clientWidth;
    const ch = img.clientHeight;
    canvas.width = cw;
    canvas.height = ch;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, cw, ch);

    if (overlays.gradcam && images.gradcam) {
      const heatImg = new Image();
      heatImg.onload = () => {
        ctx.globalAlpha = 0.45;
        ctx.drawImage(heatImg, 0, 0, cw, ch);
        ctx.globalAlpha = 1.0;
      };
      heatImg.src = `data:image/png;base64,${images.gradcam}`;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef, imageRef, images, overlays]);

  useEffect(() => { draw(); }, [draw]);

  return { redraw: draw };
}
