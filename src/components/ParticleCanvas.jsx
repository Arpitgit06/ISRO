import { useRef, useEffect } from 'react';

/**
 * NishaDrishtiAI — Immersive 3D Particle Canvas
 * 
 * 5 morphing states driven by scroll:
 *   Stage 0 (s: 0.00–0.20): Tilted spiral galaxy vortex, slowly rotating
 *   Stage 1 (s: 0.20–0.40): Galaxy collapses → Blackhole with accretion disk
 *   Stage 2 (s: 0.40–0.60): Supernova explosion — particles blast outward in a sphere
 *   Stage 3 (s: 0.60–0.80): Particles reassemble into concentric orbital rings + HUD labels
 *   Stage 4 (s: 0.80–1.00): Rings flatten into an undulating sine-wave terrain grid
 * 
 * Uses 6000 particles, devicePixelRatio for crisp rendering, 
 * and a single continuous requestAnimationFrame loop.
 */

const N = 6000;

export default function ParticleCanvas({ scrollProgress }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const scrollRef = useRef(scrollProgress);
  const dprRef = useRef(1);

  useEffect(() => {
    scrollRef.current = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let time = 0;

    // ─── PARTICLE GENERATION ───────────────────────────────────────
    const particles = [];
    for (let i = 0; i < N; i++) {
      // ── Galaxy Vortex ──
      const arm = i % 4;
      const t0 = Math.pow(Math.random(), 1.2);
      const rGal = 8 + t0 * 280;
      const thetaGal = arm * (Math.PI * 2 / 4) + rGal * 0.018 + (Math.random() - 0.5) * 0.35;
      const galX = rGal * Math.cos(thetaGal);
      const galZ = rGal * Math.sin(thetaGal);
      const galY = (Math.random() - 0.5) * 14 * Math.exp(-rGal / 120);

      // ── Blackhole (Event horizon sphere + spinning accretion disk) ──
      const bhType = i % 5; // 0,1 = horizon, 2,3 = disk, 4 = jet seed
      let bhX = 0, bhY = 0, bhZ = 0;
      let bhDiskR = 0;
      if (bhType <= 1) {
        // Event horizon shell
        const r = 30 + Math.random() * 15;
        const phi = Math.random() * Math.PI * 2;
        const cosTheta = Math.random() * 2 - 1;
        const sinTheta = Math.sqrt(1 - cosTheta * cosTheta);
        bhX = r * sinTheta * Math.cos(phi);
        bhY = r * sinTheta * Math.sin(phi);
        bhZ = r * cosTheta;
      } else if (bhType <= 3) {
        // Accretion disk — flat ring tilted 25 degrees
        bhDiskR = 50 + Math.random() * 160;
        const phi = Math.random() * Math.PI * 2;
        const dx = bhDiskR * Math.cos(phi);
        const dz = bhDiskR * Math.sin(phi);
        const dy = (Math.random() - 0.5) * 4;
        const tilt = 0.44; // ~25 degrees tilt
        bhX = dx;
        bhY = dy * Math.cos(tilt) - dz * Math.sin(tilt);
        bhZ = dy * Math.sin(tilt) + dz * Math.cos(tilt);
      } else {
        // Jet seed particles — near poles
        const jetDir = (i % 2 === 0) ? 1 : -1;
        const height = 10 + Math.random() * 30;
        const spread = Math.random() * 6;
        const phi = Math.random() * Math.PI * 2;
        bhX = spread * Math.cos(phi);
        bhY = height * jetDir;
        bhZ = spread * Math.sin(phi);
      }

      // ── Supernova explosion (expanding sphere) ──
      const snPhi = Math.random() * Math.PI * 2;
      const snCosTheta = Math.random() * 2 - 1;
      const snSinTheta = Math.sqrt(1 - snCosTheta * snCosTheta);
      const snR = 20 + Math.random() * 220; // base radial distance
      const snX = snR * snSinTheta * Math.cos(snPhi);
      const snY = snR * snSinTheta * Math.sin(snPhi);
      const snZ = snR * snCosTheta;

      // ── Orbital Rings ──
      const ring = i % 5;
      const rRing = 65 + ring * 42;
      const thetaRing = Math.random() * Math.PI * 2;
      const orbitX = rRing * Math.cos(thetaRing) + (Math.random() - 0.5) * 4;
      const orbitZ = rRing * Math.sin(thetaRing) + (Math.random() - 0.5) * 4;
      const orbitY = (Math.random() - 0.5) * 2;
      // Tilt each ring differently
      const tilts = [
        [0.5, 0.2], [-0.6, -0.2], [0.4, -0.5], [-0.2, 0.7], [0.3, 0.4]
      ];
      const [tX, tZ] = tilts[ring];
      const cTX = Math.cos(tX), sTX = Math.sin(tX);
      const rY1 = orbitY * cTX - orbitZ * sTX;
      const rZ1 = orbitY * sTX + orbitZ * cTX;
      const cTZ = Math.cos(tZ), sTZ = Math.sin(tZ);
      const ringFinalX = orbitX * cTZ - rY1 * sTZ;
      const ringFinalY = orbitX * sTZ + rY1 * cTZ;
      const ringFinalZ = rZ1;

      // ── Terrain Grid ──
      const cols = 60;
      const col = i % cols;
      const row = Math.floor(i / cols);
      const terrX = (col - cols / 2) * 14;
      const terrZ = (row - N / cols / 2) * 14;
      const terrY = 100;

      particles.push({
        // 5 states
        gx: galX, gy: galY, gz: galZ,                // galaxy
        bx: bhX, by: bhY, bz: bhZ,                    // blackhole
        sx: snX, sy: snY, sz: snZ,                     // supernova
        rx: ringFinalX, ry: ringFinalY, rz: ringFinalZ, // rings
        tx: terrX, ty: terrY, tz: terrZ,               // terrain
        // metadata
        bhType, bhDiskR: bhDiskR || 100,
        snBaseR: snR,
        ring, col, row,
        speed: 0.7 + Math.random() * 0.6,
        bright: 0.4 + Math.random() * 0.6,
      });
    }

    // ─── HIGH-DPI CANVAS SETUP ─────────────────────────────────────
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      dprRef.current = dpr;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      // Reset transform so we don't accumulate scales
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // ─── MATH HELPERS ──────────────────────────────────────────────
    const lerp = (a, b, t) => a + (b - a) * t;
    const smooth = (t) => t * t * (3 - 2 * t);
    const clamp01 = (v) => Math.max(0, Math.min(1, v));

    // ─── CAMERA ────────────────────────────────────────────────────
    // Simple look-at camera: positioned at (camX, camY, camZ),
    // looking at origin, with controllable orbit angles.
    const getCamera = (s) => {
      // Base defaults
      let dist = 500, elevAngle = 0.45, azAngle = 0, fov = 500;

      if (s <= 0.20) {
        // Galaxy view — tilted ~30° from above, slow pan
        const t = s / 0.20;
        dist = lerp(600, 550, t);
        elevAngle = lerp(0.5, 0.55, t);  // ~30° tilt looking down at galaxy
        azAngle = lerp(0, 0.15, t);
        fov = 500;
      } else if (s <= 0.40) {
        // Zoom into blackhole
        const t = (s - 0.20) / 0.20;
        dist = lerp(550, 420, t);
        elevAngle = lerp(0.55, 0.45, t);
        azAngle = lerp(0.15, 0.5, t);
        fov = lerp(500, 520, t);
      } else if (s <= 0.60) {
        // Supernova — pull back to see explosion
        const t = (s - 0.40) / 0.20;
        dist = lerp(420, 600, t);
        elevAngle = lerp(0.45, 0.35, t);
        azAngle = lerp(0.5, 0.9, t);
        fov = lerp(520, 480, t);
      } else if (s <= 0.80) {
        // Rings — medium distance, looking slightly down
        const t = (s - 0.60) / 0.20;
        dist = lerp(600, 480, t);
        elevAngle = lerp(0.35, 0.4, t);
        azAngle = lerp(0.9, 1.4, t);
        fov = lerp(480, 500, t);
      } else {
        // Terrain — high above looking down
        const t = (s - 0.80) / 0.20;
        dist = lerp(480, 700, t);
        elevAngle = lerp(0.4, 1.0, t);  // looking down steeply
        azAngle = lerp(1.4, 1.8, t);
        fov = lerp(500, 450, t);
      }

      // Convert spherical to Cartesian camera position
      const camX = dist * Math.cos(elevAngle) * Math.sin(azAngle);
      const camY = -dist * Math.sin(elevAngle); // negative = above
      const camZ = dist * Math.cos(elevAngle) * Math.cos(azAngle);

      return { camX, camY, camZ, fov };
    };

    // ─── PROJECTION ────────────────────────────────────────────────
    // Look-at projection: camera at (cx,cy,cz) looking at origin
    const project = (wx, wy, wz, cam, sw, sh) => {
      // Vector from camera to point
      const dx = wx - cam.camX;
      const dy = wy - cam.camY;
      const dz = wz - cam.camZ;

      // Camera forward = normalize(origin - camPos) = normalize(-camPos)
      const fLen = Math.sqrt(cam.camX * cam.camX + cam.camY * cam.camY + cam.camZ * cam.camZ);
      const fx = -cam.camX / fLen;
      const fy = -cam.camY / fLen;
      const fz = -cam.camZ / fLen;

      // Camera right = normalize(cross(worldUp, forward))
      // worldUp = (0, -1, 0) for our convention (Y-down screen)
      let ux = 0, uy = -1, uz = 0;
      let rightX = uy * fz - uz * fy;
      let rightY = uz * fx - ux * fz;
      let rightZ = ux * fy - uy * fx;
      const rLen = Math.sqrt(rightX * rightX + rightY * rightY + rightZ * rightZ);
      if (rLen < 0.001) return null;
      rightX /= rLen; rightY /= rLen; rightZ /= rLen;

      // Camera up = cross(forward, right)
      const upX = fy * rightZ - fz * rightY;
      const upY = fz * rightX - fx * rightZ;
      const upZ = fx * rightY - fy * rightX;

      // Project point into camera space
      const pz = dx * fx + dy * fy + dz * fz; // depth along forward
      if (pz < 10) return null; // near plane clip

      const px = dx * rightX + dy * rightY + dz * rightZ; // horizontal
      const py = dx * upX + dy * upY + dz * upZ;          // vertical

      const screenX = sw / 2 + (px * cam.fov) / pz;
      const screenY = sh / 2 + (py * cam.fov) / pz;

      return { x: screenX, y: screenY, depth: pz };
    };

    // ─── RENDER LOOP ───────────────────────────────────────────────
    const render = () => {
      time += 1;
      const s = scrollRef.current;
      const sw = window.innerWidth;
      const sh = window.innerHeight;
      const cam = getCamera(s);

      // Motion-blur clear
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, sw, sh);

      // Global slow rotation
      const spinDamp = 1 - smooth(clamp01((s - 0.75) / 0.25));
      const spin = time * 0.0004 * spinDamp;

      const projected = [];

      // ── Interpolate particle positions ──
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        let px, py, pz;

        if (s <= 0.20) {
          // Pure galaxy
          px = p.gx;
          py = p.gy;
          pz = p.gz;
        } else if (s <= 0.40) {
          // Galaxy → Blackhole
          const t = smooth(clamp01((s - 0.20) / 0.20));
          px = lerp(p.gx, p.bx, t);
          py = lerp(p.gy, p.by, t);
          pz = lerp(p.gz, p.bz, t);
        } else if (s <= 0.60) {
          // Blackhole → Supernova explosion
          const t = smooth(clamp01((s - 0.40) / 0.20));
          // Supernova radial expansion animation
          const expandT = clamp01((s - 0.42) / 0.15);
          const expandScale = 0.1 + expandT * 1.2;
          const snAnimX = p.sx * expandScale;
          const snAnimY = p.sy * expandScale;
          const snAnimZ = p.sz * expandScale;
          px = lerp(p.bx, snAnimX, t);
          py = lerp(p.by, snAnimY, t);
          pz = lerp(p.bz, snAnimZ, t);
        } else if (s <= 0.80) {
          // Supernova → Orbital rings
          const t = smooth(clamp01((s - 0.60) / 0.20));
          const expandScale = 1.3;
          px = lerp(p.sx * expandScale, p.rx, t);
          py = lerp(p.sy * expandScale, p.ry, t);
          pz = lerp(p.sz * expandScale, p.rz, t);
        } else {
          // Rings → Terrain grid
          const t = smooth(clamp01((s - 0.80) / 0.20));
          // Undulating wave
          const wave = Math.sin(p.col * 0.15 + time * 0.012) * 
                       Math.cos(p.row * 0.15 + time * 0.012) * 25;
          const finalTY = p.ty + wave;
          px = lerp(p.rx, p.tx, t);
          py = lerp(p.ry, finalTY, t);
          pz = lerp(p.rz, p.tz, t);
        }

        // ── Blackhole accretion disk spin ──
        if (s > 0.18 && s < 0.62 && p.bhType >= 2 && p.bhType <= 3) {
          const diskSpin = time * 0.003 * (130 / p.bhDiskR);
          // Blend spin influence based on how close we are to blackhole stage
          const influence = 1 - Math.abs(s - 0.35) / 0.22;
          if (influence > 0) {
            const angle = diskSpin * clamp01(influence);
            const c = Math.cos(angle), si = Math.sin(angle);
            const ox = px, oz = pz;
            px = ox * c - oz * si;
            pz = ox * si + oz * c;
          }
        }

        // ── Supernova jets during blackhole/supernova phase ──
        if (s > 0.22 && s < 0.55 && p.bhType === 4) {
          const jetInfluence = smooth(clamp01(1 - Math.abs(s - 0.38) / 0.16));
          const jetSpeed = (time * p.speed * 0.8) % 250;
          const jetDir = (i % 2 === 0) ? 1 : -1;
          py += jetDir * jetSpeed * jetInfluence;
        }

        // Global Y-axis spin
        const c = Math.cos(spin * p.speed);
        const si = Math.sin(spin * p.speed);
        const rx = px * c - pz * si;
        const rz = px * si + pz * c;

        const pt = project(rx, py, rz, cam, sw, sh);
        if (pt && pt.x > -50 && pt.x < sw + 50 && pt.y > -50 && pt.y < sh + 50) {
          projected.push({
            x: pt.x,
            y: pt.y,
            depth: pt.depth,
            bright: p.bright,
            idx: i,
          });
        }
      }

      // ── Depth sort (painter's algorithm) ──
      projected.sort((a, b) => b.depth - a.depth);

      // ── Draw background stars (persistent tiny dots) ──
      if (!canvas._stars) {
        canvas._stars = [];
        for (let si = 0; si < 300; si++) {
          canvas._stars.push({
            x: Math.random(),
            y: Math.random(),
            r: 0.3 + Math.random() * 0.8,
            a: 0.15 + Math.random() * 0.35,
          });
        }
      }
      for (const star of canvas._stars) {
        const twinkle = star.a + Math.sin(time * 0.01 + star.x * 100) * 0.08;
        ctx.fillStyle = `rgba(180, 210, 255, ${clamp01(twinkle).toFixed(3)})`;
        ctx.fillRect(star.x * sw, star.y * sh, star.r, star.r);
      }

      // ── Determine current phase for color coding ──
      // 0=galaxy, 1=blackhole, 2=supernova, 3=rings, 4=terrain
      let phase = 0;
      if (s > 0.15 && s <= 0.42) phase = 1;
      else if (s > 0.42 && s <= 0.62) phase = 2;
      else if (s > 0.62 && s <= 0.82) phase = 3;
      else if (s > 0.82) phase = 4;

      // ── Draw blackhole central void glow (during blackhole phase) ──
      if (phase === 1 || (phase === 2 && s < 0.50)) {
        const bhInfluence = phase === 1 ? clamp01((s - 0.20) / 0.15) : clamp01(1 - (s - 0.42) / 0.08);
        const centerPt = project(0, 0, 0, cam, sw, sh);
        if (centerPt && bhInfluence > 0.05) {
          // Dark void in the center
          const voidGrad = ctx.createRadialGradient(centerPt.x, centerPt.y, 0, centerPt.x, centerPt.y, 60);
          voidGrad.addColorStop(0, `rgba(0, 0, 0, ${(0.9 * bhInfluence).toFixed(3)})`);
          voidGrad.addColorStop(0.5, `rgba(0, 10, 5, ${(0.4 * bhInfluence).toFixed(3)})`);
          voidGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = voidGrad;
          ctx.fillRect(centerPt.x - 80, centerPt.y - 80, 160, 160);

          // Bright green ring glow around event horizon
          ctx.strokeStyle = `rgba(0, 255, 102, ${(0.35 * bhInfluence).toFixed(3)})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(centerPt.x, centerPt.y, 35, 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeStyle = `rgba(0, 255, 102, ${(0.15 * bhInfluence).toFixed(3)})`;
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.arc(centerPt.x, centerPt.y, 50, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // ── Supernova flash effect ──
      if (phase === 2 && s >= 0.42 && s <= 0.52) {
        const flashT = clamp01((s - 0.42) / 0.04);
        const flashFade = clamp01(1 - (s - 0.46) / 0.06);
        const flashAlpha = flashT * flashFade * 0.3;
        if (flashAlpha > 0.01) {
          const flashGrad = ctx.createRadialGradient(sw / 2, sh / 2, 0, sw / 2, sh / 2, sh * 0.5);
          flashGrad.addColorStop(0, `rgba(200, 255, 220, ${flashAlpha.toFixed(3)})`);
          flashGrad.addColorStop(0.4, `rgba(0, 255, 102, ${(flashAlpha * 0.4).toFixed(3)})`);
          flashGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = flashGrad;
          ctx.fillRect(0, 0, sw, sh);
        }
      }

      // ── Draw particles with phase-appropriate colors ──
      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];
        const size = Math.max(0.6, 3.8 - p.depth / 250);
        const alpha = clamp01((1.3 - p.depth / 800) * p.bright);

        if (alpha < 0.02) continue;

        // Color based on current phase
        let r = 0, g = 255, b = 102; // default green
        if (phase === 1) {
          // Blackhole: mix green → white-green for disk, dimmer for horizon
          const pp = particles[p.idx];
          if (pp.bhType <= 1) {
            // Event horizon — dimmer, slightly blue
            r = 30; g = 200; b = 180;
          } else if (pp.bhType <= 3) {
            // Accretion disk — bright green-white, brighter near center
            const nearCenter = clamp01(1 - pp.bhDiskR / 200);
            r = Math.floor(lerp(0, 200, nearCenter));
            g = 255;
            b = Math.floor(lerp(102, 255, nearCenter));
          } else {
            // Jets — cyan
            r = 50; g = 220; b = 255;
          }
        } else if (phase === 2) {
          // Supernova: expanding hot particles
          const pp = particles[p.idx];
          const radNorm = clamp01(pp.snBaseR / 220);
          r = Math.floor(lerp(180, 0, radNorm));
          g = 255;
          b = Math.floor(lerp(220, 80, radNorm));
        }

        // Main dot
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
        ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);

        // Glow for close particles
        if (p.depth < 350 && size > 1.5) {
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${(alpha * 0.12).toFixed(3)})`;
          const gs = size * 2.5;
          ctx.fillRect(p.x - gs / 2, p.y - gs / 2, gs, gs);
        }
      }

      // ── HUD annotations (visible during Rings stage: 0.60–0.80) ──
      let hudAlpha = 0;
      if (s >= 0.62 && s <= 0.78) {
        if (s <= 0.67) hudAlpha = (s - 0.62) / 0.05;
        else if (s >= 0.73) hudAlpha = (0.78 - s) / 0.05;
        else hudAlpha = 1;
      }

      if (hudAlpha > 0.02) {
        ctx.save();
        ctx.font = '10px "Share Tech Mono", monospace';
        ctx.lineWidth = 1;

        const hudNodes = [
          { text: 'PRIMARY THERMAL MATRIX', sub: 'BANDWIDTH: 8 – 14 µM', side: 'left', yOff: -100 },
          { text: 'CLAHE CONTRAST ENHANCE', sub: 'BILINEAR GRID: 8×8', side: 'right', yOff: -40 },
          { text: 'NEURAL SUPER-RESOLUTION', sub: 'MODEL: REAL-ESRGAN 4X', side: 'left', yOff: 40 },
          { text: 'YOLO-WORLD CLASSIFIER', sub: 'TARGET HEAD: ZERO-SHOT', side: 'right', yOff: 100 },
        ];

        hudNodes.forEach((node) => {
          const targetX = node.side === 'left' ? sw * 0.14 : sw * 0.86;
          const targetY = sh / 2 + node.yOff;
          const anchorX = sw / 2 + (node.side === 'left' ? -80 : 80);
          const anchorY = targetY + (node.yOff > 0 ? -20 : 20);

          // Leader line
          ctx.strokeStyle = `rgba(0, 255, 102, ${(hudAlpha * 0.5).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(anchorX, anchorY, 4, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = `rgba(0, 255, 102, ${hudAlpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(anchorX, anchorY, 2, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(anchorX, anchorY);
          const midX = node.side === 'left' ? targetX + 30 : targetX - 30;
          ctx.lineTo(midX, targetY);
          ctx.lineTo(targetX, targetY);
          ctx.stroke();

          // Text
          ctx.textAlign = node.side === 'left' ? 'left' : 'right';
          ctx.fillStyle = `rgba(255, 255, 255, ${hudAlpha.toFixed(3)})`;
          ctx.fillText(node.text, targetX, targetY - 5);
          ctx.fillStyle = `rgba(0, 255, 102, ${(hudAlpha * 0.9).toFixed(3)})`;
          ctx.fillText(node.sub, targetX, targetY + 9);

          // Bracket
          ctx.strokeStyle = `rgba(0, 255, 102, ${(hudAlpha * 0.25).toFixed(3)})`;
          ctx.beginPath();
          const bx = node.side === 'left' ? targetX - 4 : targetX + 4;
          ctx.moveTo(bx, targetY - 12);
          ctx.lineTo(targetX, targetY - 12);
          ctx.lineTo(targetX, targetY + 14);
          ctx.lineTo(bx, targetY + 14);
          ctx.stroke();
        });

        ctx.restore();
      }

      // ── Subtle vignette overlay ──
      const gradient = ctx.createRadialGradient(sw / 2, sh / 2, sh * 0.3, sw / 2, sh / 2, sh * 0.9);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.35)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, sw, sh);

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'transparent',
        display: 'block',
        zIndex: 1,
        pointerEvents: 'none',
      }}
    />
  );
}
