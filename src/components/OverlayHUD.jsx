import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import useAppStore from '../store/useAppStore';

const CLASS_COLORS_MAP = {
  vehicle: '#F26522',     // ISRO Saffron Orange
  building: '#0082C8',    // ISRO Blue
  road: '#005E99',        // Dark Blue
  vegetation: '#FFA24D',  // Soft Saffron/Orange
};

export default function OverlayHUD({ imageRef }) {
  const { detections, overlays, hoveredClass, setHoveredClass, images } = useAppStore();
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
    clientWidth: 0,
    clientHeight: 0,
  });

  const updateDimensions = useCallback(() => {
    const img = imageRef.current;
    if (!img) return;
    setDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight,
      clientWidth: img.clientWidth,
      clientHeight: img.clientHeight,
    });
  }, [imageRef]);

  useEffect(() => {
    const img = imageRef.current;
    if (!img) return;

    img.addEventListener('load', updateDimensions);
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(img);
    updateDimensions();

    return () => {
      img.removeEventListener('load', updateDimensions);
      observer.disconnect();
    };
  }, [imageRef, updateDimensions, images]);

  const active = overlays.bboxes && detections && detections.length > 0;
  if (!active) return null;

  const { width: naturalWidth, height: naturalHeight, clientWidth, clientHeight } = dimensions;
  if (clientWidth === 0 || clientHeight === 0 || naturalWidth === 0 || naturalHeight === 0) return null;

  const imageRatio = naturalWidth / naturalHeight;
  const containerRatio = clientWidth / clientHeight;

  let renderedWidth = 0;
  let renderedHeight = 0;
  let offsetX = 0;
  let offsetY = 0;

  if (imageRatio > containerRatio) {
    renderedWidth = clientWidth;
    renderedHeight = clientWidth / imageRatio;
    offsetX = 0;
    offsetY = (clientHeight - renderedHeight) / 2;
  } else {
    renderedWidth = clientHeight * imageRatio;
    renderedHeight = clientHeight;
    offsetX = (clientWidth - renderedWidth) / 2;
    offsetY = 0;
  }

  return (
    <svg 
      style={{ 
        position: 'absolute', 
        inset: 0, 
        width: '100%', 
        height: '100%', 
        pointerEvents: 'none', 
        zIndex: 15 
      }}
    >
      {detections.map((det, index) => {
        const [x1, y1, x2, y2] = det.bbox;
        const boxWidth = x2 - x1;
        const boxHeight = y2 - y1;

        // Scale box coordinates to screen coordinates
        const left = offsetX + (x1 / naturalWidth) * renderedWidth;
        const top = offsetY + (y1 / naturalHeight) * renderedHeight;
        const w = (boxWidth / naturalWidth) * renderedWidth;
        const h = (boxHeight / naturalHeight) * renderedHeight;

        const normalizedLabel = det.label.toLowerCase();
        const color = CLASS_COLORS_MAP[normalizedLabel] || '#F97316';
        const isHovered = hoveredClass === normalizedLabel;

        return (
          <g key={index}>
            {/* Ambient Corner Bracket Lines (Cyberpunk look) */}
            {/* Top-Left */}
            <motion.path
              d={`M ${left} ${top + 8} L ${left} ${top} L ${left + 8} ${top}`}
              stroke={color}
              strokeWidth="1.5"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, delay: index * 0.03 }}
            />
            {/* Top-Right */}
            <motion.path
              d={`M ${left + w - 8} ${top} L ${left + w} ${top} L ${left + w} ${top + 8}`}
              stroke={color}
              strokeWidth="1.5"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, delay: index * 0.03 }}
            />
            {/* Bottom-Left */}
            <motion.path
              d={`M ${left} ${top + h - 8} L ${left} ${top + h} L ${left + 8} ${top + h}`}
              stroke={color}
              strokeWidth="1.5"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, delay: index * 0.03 }}
            />
            {/* Bottom-Right */}
            <motion.path
              d={`M ${left + w - 8} ${top + h} L ${left + w} ${top + h} L ${left + w} ${top + h - 8}`}
              stroke={color}
              strokeWidth="1.5"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, delay: index * 0.03 }}
            />

            {/* Bounding Box Border Rect */}
            <motion.rect
              x={left}
              y={top}
              width={w}
              height={h}
              stroke={color}
              strokeWidth="1"
              fill="rgba(0, 130, 200, 0.01)" // Transparent Azure Blue
              style={{ pointerEvents: 'auto', cursor: 'pointer' }}
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: isHovered ? 1 : 0.6,
                strokeWidth: isHovered ? 2 : 1,
                fill: isHovered ? `${color}20` : 'rgba(0, 130, 200, 0.01)',
                filter: isHovered ? `drop-shadow(0 0 6px ${color})` : 'none'
              }}
              whileHover={{
                strokeWidth: 2,
                fill: `${color}18`,
                filter: `drop-shadow(0 0 8px ${color})`
              }}
              onMouseEnter={() => setHoveredClass(normalizedLabel)}
              onMouseLeave={() => setHoveredClass(null)}
              transition={{ duration: 0.2 }}
            />

            {/* Label Background */}
            <motion.rect
              x={left}
              y={top - 12}
              width={Math.max(w * 0.7, 68)}
              height={12}
              fill={color}
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 0.95 : 0.7 }}
              transition={{ duration: 0.2 }}
              style={{ rx: '2px' }}
            />

            {/* Label Text */}
            <text
              x={left + 4}
              y={top - 3}
              fill="#FFFFFF"
              style={{ 
                fontSize: '9px', 
                fontFamily: "'Share Tech Mono', monospace", 
                fontWeight: 'bold', 
                letterSpacing: '0.05em' 
              }}
            >
              {det.label.toUpperCase()}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
