import { useRef, useEffect } from 'react';

/**
 * NishaDrishtiAI — Immersive GPU-Accelerated 3D Particle Canvas
 * 
 * 5 morphing states driven by scroll progress:
 *   Stage 0 (s: 0.00–0.20): Tilted spiral galaxy vortex, slowly rotating
 *   Stage 1 (s: 0.20–0.40): Galaxy collapses → Blackhole with accretion disk
 *   Stage 2 (s: 0.40–0.60): Supernova explosion — particles blast outward in a sphere
 *   Stage 3 (s: 0.60–0.80): Particles reassemble into concentric orbital rings + HUD labels
 *   Stage 4 (s: 0.80–1.00): Rings flatten into an undulating sine-wave terrain grid
 * 
 * Performance:
 *   All particle simulations, rotations, and perspective projections are compiled
 *   into a WebGL Vertex Shader running on the GPU. The 2D Canvas overlay handles
 *   vector HUD layers, Twinkling Stars, and Blackhole glow.
 *   
 *   The Earth is rendered as a photorealistic, shaded, rotating 3D sphere
 *   directly in WebGL as a background layer, preserving fluid performance.
 */

const N = 75000;

// ─── SHADER DEFINITIONS ──────────────────────────────────────────

const PARTICLE_VS = `
  attribute vec3 a_galaxyPos;
  attribute vec4 a_blackholePos; // xyz, type
  attribute vec4 a_supernovaPos; // xyz, snBaseR
  attribute vec3 a_ringPos;
  attribute vec3 a_terrainPos;
  attribute vec4 a_meta1;        // speed, bright, bhDiskR, idx
  attribute vec3 a_meta2;        // col, row, jetDir

  uniform float u_time;
  uniform float u_scroll;
  uniform vec3 u_camPos;
  uniform float u_fov;
  uniform vec2 u_screenSize;
  uniform float u_phase;
  uniform float u_dpr;

  varying vec4 v_color;

  vec2 rotate2d(vec2 v, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return vec2(v.x * c - v.y * s, v.x * s + v.y * c);
  }

  vec3 lerp3(vec3 a, vec3 b, float t) {
    return a + (b - a) * t;
  }

  float smoothstepCustom(float t) {
    return t * t * (3.0 - 2.0 * t);
  }

  void main() {
    float bhType = a_blackholePos.w;
    float snBaseR = a_supernovaPos.w;
    
    float speed = a_meta1.x;
    float bright = a_meta1.y;
    float bhDiskR = a_meta1.z;
    float idx = a_meta1.w;
    
    float col = a_meta2.x;
    float row = a_meta2.y;
    float jetDir = a_meta2.z;

    vec3 pos = vec3(0.0);
    float s = u_scroll;

    // 1. Interpolate states
    if (s <= 0.20) {
      pos = a_galaxyPos;
    } else if (s <= 0.40) {
      float t = smoothstepCustom(clamp((s - 0.20) / 0.20, 0.0, 1.0));
      pos = lerp3(a_galaxyPos, a_blackholePos.xyz, t);
    } else if (s <= 0.60) {
      float t = smoothstepCustom(clamp((s - 0.40) / 0.20, 0.0, 1.0));
      float expandT = clamp((s - 0.42) / 0.15, 0.0, 1.0);
      float expandScale = 0.1 + expandT * 1.2;
      vec3 snAnimPos = a_supernovaPos.xyz * expandScale;
      pos = lerp3(a_blackholePos.xyz, snAnimPos, t);
    } else if (s <= 0.80) {
      float t = smoothstepCustom(clamp((s - 0.60) / 0.20, 0.0, 1.0));
      float expandScale = 1.3;
      pos = lerp3(a_supernovaPos.xyz * expandScale, a_ringPos, t);
    } else {
      float t = smoothstepCustom(clamp((s - 0.80) / 0.06, 0.0, 1.0)); // Flatten to terrain grid much faster
      float wave = sin(col * 0.15 + u_time * 0.012) * cos(row * 0.15 + u_time * 0.012) * 25.0;
      vec3 finalTerrainPos = vec3(a_terrainPos.x, a_terrainPos.y + wave, a_terrainPos.z);
      pos = lerp3(a_ringPos, finalTerrainPos, t);
    }

    // 2. Blackhole accretion disk spin
    if (s > 0.18 && s < 0.62 && bhType >= 2.0 && bhType <= 3.0) {
      float diskSpin = u_time * 0.003 * (130.0 / bhDiskR);
      float influence = 1.0 - abs(s - 0.35) / 0.22;
      if (influence > 0.0) {
        float angle = diskSpin * clamp(influence, 0.0, 1.0);
        pos.xz = rotate2d(pos.xz, angle);
      }
    }

    // 3. Supernova jets
    if (s > 0.22 && s < 0.55 && bhType == 4.0) {
      float jetInfluence = smoothstepCustom(clamp(1.0 - abs(s - 0.38) / 0.16, 0.0, 1.0));
      float jetSpeed = mod(u_time * speed * 0.8, 250.0);
      pos.y += jetDir * jetSpeed * jetInfluence;
    }

    // 4. Global rotation
    float spinDamp = 1.0 - smoothstepCustom(clamp((s - 0.75) / 0.25, 0.0, 1.0));
    float spin = u_time * 0.0004 * spinDamp;
    float spinAngle = spin * speed;
    pos.xz = rotate2d(pos.xz, spinAngle);

    // 5. Look-at projection
    vec3 d = pos - u_camPos;
    float fLen = length(u_camPos);
    vec3 forward = -u_camPos / fLen;

    vec3 worldUp = vec3(0.0, -1.0, 0.0);
    vec3 right = cross(worldUp, forward);
    float rLen = length(right);
    if (rLen > 0.001) {
      right = right / rLen;
    }
    vec3 up = cross(forward, right);

    float pz = dot(d, forward);
    float px = dot(d, right);
    float py = dot(d, up);

    // Clip if behind camera
    if (pz < 10.0) {
      gl_Position = vec4(-2.0, -2.0, -2.0, 1.0);
      gl_PointSize = 0.0;
      v_color = vec4(0.0);
      return;
    }

    float ndcX = (px * u_fov * 2.0) / (pz * u_screenSize.x);
    float ndcY = -(py * u_fov * 2.0) / (pz * u_screenSize.y);

    gl_Position = vec4(ndcX, ndcY, 0.0, 1.0);

    // Calculate Point Size
    float size = max(0.6, 3.8 - pz / 250.0);
    gl_PointSize = size * u_dpr;

    // Calculate Brightness/Alpha
    float alpha = clamp((1.3 - pz / 800.0) * bright, 0.0, 1.0);

    // Phase Colors
    vec3 color = vec3(0.0, 0.51, 0.78); // default ISRO blue

    if (u_phase == 0.0) {
      // ─── GALAXY STATE (Image 1: Spiral Galaxy) ───
      float rGal = length(a_galaxyPos);
      if (rGal < 45.0) {
        float tCore = rGal / 45.0;
        color = mix(vec3(1.0, 0.98, 0.84), vec3(0.23, 0.63, 0.81), tCore);
      } else {
        float tArm = clamp((rGal - 45.0) / 240.0, 0.0, 1.0);
        vec3 armBase = mix(vec3(0.23, 0.63, 0.81), vec3(0.07, 0.14, 0.28), tArm);
        if (mod(idx, 9.0) == 0.0) {
          color = vec3(0.91, 0.43, 0.28);
        } else {
          color = armBase;
        }
      }
    } else if (u_phase == 1.0) {
      // ─── BLACKHOLE STATE (Image 3: Accretion Disk Black Hole) ───
      if (bhType <= 1.0) {
        color = vec3(0.25, 0.41, 0.88);
      } else if (bhType <= 3.0) {
        float diskNorm = clamp((bhDiskR - 50.0) / 160.0, 0.0, 1.0);
        vec3 diskColor = mix(vec3(1.0, 0.95, 0.65), vec3(1.0, 0.35, 0.0), diskNorm);
        if (diskNorm > 0.65) {
          diskColor = mix(diskColor, vec3(0.83, 0.06, 0.15), (diskNorm - 0.65) / 0.35);
        }
        color = diskColor;
      } else {
        float jetNorm = clamp(abs(pos.y) / 200.0, 0.0, 1.0);
        color = mix(vec3(1.0, 0.97, 0.84), vec3(0.83, 0.06, 0.15), jetNorm);
      }
    } else if (u_phase == 2.0) {
      // ─── SUPERNOVA STATE (Image 2: Active Core / Starburst Explosion) ───
      float tBase = snBaseR / 220.0;
      color = mix(vec3(1.0, 0.95, 0.72), vec3(0.85, 0.16, 0.08), tBase);
      if (mod(idx, 15.0) == 0.0) {
        color = vec3(0.98, 0.82, 0.35);
      }
    } else {
      // ─── ORBITAL RINGS & SINE GRID STATE (ISRO Dynamic Colors) ───
      color = vec3(0.0, 0.51, 0.78);
    }

    v_color = vec4(color, alpha);
  }
`;

const PARTICLE_FS = `
  precision mediump float;
  varying vec4 v_color;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;
    float intensity = 1.0 - dist * 2.0;
    intensity = intensity * intensity;
    gl_FragColor = vec4(v_color.rgb, v_color.a * intensity);
  }
`;

const QUAD_VS = `
  attribute vec2 a_quadPos;
  void main() {
    gl_Position = vec4(a_quadPos, 0.0, 1.0);
  }
`;

const QUAD_FS = `
  precision mediump float;
  uniform vec4 u_quadColor;
  void main() {
    gl_FragColor = u_quadColor;
  }
`;

const EARTH_VS = `
  attribute vec2 a_quadPos;
  varying vec2 v_texCoord;
  void main() {
    v_texCoord = a_quadPos;
    gl_Position = vec4(a_quadPos, 0.0, 1.0);
  }
`;

const EARTH_FS = `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D u_earthTexture;
  uniform sampler2D u_cloudTexture;
  uniform sampler2D u_nightTexture;
  uniform float u_time;
  uniform float u_aspect;
  uniform float u_radius;
  uniform vec2 u_center;
  uniform float u_globeAlpha;
  uniform vec3 u_lightDir;
  uniform float u_mouseRotX;
  uniform float u_mouseRotY;
  uniform float u_hasRealTexture;

  // 3D rotation around Y-axis
  vec3 rotateY(vec3 v, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return vec3(c * v.x + s * v.z, v.y, -s * v.x + c * v.z);
  }
  // 3D rotation around X-axis
  vec3 rotateX(vec3 v, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return vec3(v.x, c * v.y - s * v.z, s * v.y + c * v.z);
  }

  void main() {
    vec2 uv = v_texCoord;
    uv.x *= u_aspect;
    vec2 c = u_center;
    c.x *= u_aspect;
    
    vec2 d = uv - c;
    vec2 nd = d / u_radius;
    float distSq = dot(nd, nd);
    
    if (distSq > 1.0) {
      discard;
    }
    
    float z = sqrt(1.0 - distSq);
    vec3 normal = vec3(nd.x, nd.y, z);
    
    // Apply 3D rotation: auto-spin + interactive mouse drag
    float autoRot = u_time * 0.00015;
    vec3 rotNormal = rotateY(normal, autoRot + u_mouseRotX);
    rotNormal = rotateX(rotNormal, u_mouseRotY);
    
    // Spherical coordinates from rotated normal
    float lat = asin(clamp(rotNormal.y, -1.0, 1.0));
    float lon = atan(rotNormal.x, rotNormal.z);
    
    float u = (lon + 3.1415926535) / 6.283185307;
    float v = (lat + 1.5707963267) / 3.1415926535;
    
    // Sample the day texture (real NASA Blue Marble)
    vec4 texColor = texture2D(u_earthTexture, vec2(u, 1.0 - v));
    
    // Sample cloud layer (slightly offset for animated drift)
    float cloudU = fract(u + u_time * 0.000008);
    vec4 cloudTex = texture2D(u_cloudTexture, vec2(cloudU, 1.0 - v));
    float cloudAlpha = cloudTex.r * 0.65;
    
    // Sample night lights
    vec4 nightTex = texture2D(u_nightTexture, vec2(u, 1.0 - v));
    
    // Lighting calculation using the original (unrotated) normal for consistent light
    vec3 lightDir = normalize(u_lightDir);
    float diffuse = dot(normal, lightDir);
    float dayFactor = clamp((diffuse + 0.12) / 0.28, 0.0, 1.0);
    
    // Day side: real texture + cloud overlay
    vec3 dayColor = texColor.rgb;
    if (u_hasRealTexture < 0.5) {
      dayColor *= 1.3; // only boost procedural fallback
    }
    // Blend clouds over land/ocean
    dayColor = mix(dayColor, vec3(0.95, 0.96, 1.0), cloudAlpha * dayFactor);
    
    // Night side: city lights glow (warm saffron-orange)
    vec3 rawLights = pow(nightTex.rgb, vec3(1.5)); // gamma correction to soften harsh edges
    vec3 nightLights = rawLights * vec3(1.0, 0.72, 0.35) * 0.9;
    // Mask clouds from city lights (clouds block light from below)
    nightLights *= (1.0 - cloudAlpha * 0.7);
    vec3 nightColor = vec3(0.003, 0.006, 0.015) + nightLights;
    
    vec3 finalColor = mix(nightColor, dayColor, dayFactor);
    
    // Specular highlight on oceans (when real texture)
    if (u_hasRealTexture > 0.5) {
      vec3 viewDir = vec3(0.0, 0.0, 1.0);
      vec3 halfVec = normalize(lightDir + viewDir);
      float spec = pow(max(dot(normal, halfVec), 0.0), 64.0);
      // Only apply specular where it's ocean (dark blueish pixels)
      float oceanMask = 1.0 - clamp((texColor.r + texColor.g * 0.5) * 2.5, 0.0, 1.0);
      finalColor += vec3(0.4, 0.5, 0.6) * spec * oceanMask * dayFactor * 0.6;
    }
    
    // Atmospheric rim glow (blue-cyan, stronger on lit side)
    float rim = 1.0 - z;
    rim = pow(rim, 3.2);
    float litAtmosphere = max(0.0, dot(normal, lightDir));
    vec3 rimGlow = vec3(0.15, 0.55, 0.95) * rim * (1.8 + 2.5 * litAtmosphere);
    finalColor += rimGlow * u_globeAlpha;
    
    // Subtle Fresnel darkening at edges for realism
    float edgeFade = smoothstep(0.98, 1.0, sqrt(distSq));
    
    // Clamp to prevent overexposure
    finalColor = clamp(finalColor, 0.0, 1.0);
    
    gl_FragColor = vec4(finalColor, u_globeAlpha * (1.0 - edgeFade));
  }
`;

// ─── PROCEDURAL EARTH TEXTURE GENERATOR ─────────────────────────

function generateEarthTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  
  const noiseTable = new Float32Array(512);
  for (let i = 0; i < 512; i++) {
    noiseTable[i] = Math.random();
  }
  
  const noise3D = (x, y, z) => {
    const X = Math.floor(x);
    const Y = Math.floor(y);
    const Z = Math.floor(z);
    
    const fx = x - X;
    const fy = y - Y;
    const fz = z - Z;
    
    const u = fx * fx * (3.0 - 2.0 * fx);
    const v = fy * fy * (3.0 - 2.0 * fy);
    const w = fz * fz * (3.0 - 2.0 * fz);
    
    const hash = (i, j, k) => {
      const h = (i * 127 + j * 311 + k * 743) & 511;
      return noiseTable[h];
    };
    
    const n000 = hash(X, Y, Z);
    const n100 = hash(X + 1, Y, Z);
    const n010 = hash(X, Y + 1, Z);
    const n110 = hash(X + 1, Y + 1, Z);
    const n001 = hash(X, Y, Z + 1);
    const n101 = hash(X + 1, Y, Z + 1);
    const n011 = hash(X, Y + 1, Z + 1);
    const n111 = hash(X + 1, Y + 1, Z + 1);
    
    return lerp(
      lerp(lerp(n000, n100, u), lerp(n010, n110, u), v),
      lerp(lerp(n001, n101, u), lerp(n011, n111, u), v),
      w
    );
  };
  
  const fbm3D = (x, y, z) => {
    let val = 0;
    let amp = 0.5;
    let freq = 1.0;
    for (let o = 0; o < 4; o++) {
      val += amp * noise3D(x * freq, y * freq, z * freq);
      freq *= 2.1;
      amp *= 0.48;
    }
    return val;
  };

  const imgData = ctx.createImageData(2048, 1024);
  const data = imgData.data;

  for (let y = 0; y < 1024; y++) {
    const phi = (y / 1024) * Math.PI;
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);
    
    for (let x = 0; x < 2048; x++) {
      const theta = (x / 2048) * 2 * Math.PI;
      
      const nx = Math.cos(theta) * sinPhi * 3.5;
      const ny = cosPhi * 3.5;
      const nz = Math.sin(theta) * sinPhi * 3.5;
      
      const height = fbm3D(nx + 10.0, ny + 20.0, nz + 30.0);
      const clouds = fbm3D(nx * 1.5 - 50.0, ny * 1.5, nz * 1.5) * 1.1;
      
      let r = 0, g = 0, b = 0;
      let cityLight = 0;
      
      if (height < 0.46) {
        const t = height / 0.46;
        r = Math.round(6 + (12 - 6) * t);
        g = Math.round(14 + (55 - 14) * t);
        b = Math.round(28 + (88 - 28) * t);
      } else {
        const t = (height - 0.46) / 0.54;
        if (t < 0.08) {
          r = 199; g = 171; b = 129;
        } else if (t < 0.42) {
          const lt = (t - 0.08) / 0.34;
          r = Math.round(36 + (54 - 36) * lt);
          g = Math.round(75 + (98 - 75) * lt);
          b = Math.round(30 + (44 - 30) * lt);
        } else if (t < 0.72) {
          const ht = (t - 0.42) / 0.30;
          r = Math.round(79 + (50 - 79) * ht);
          g = Math.round(68 + (44 - 68) * ht);
          b = Math.round(52 + (32 - 52) * ht);
        } else {
          const st = (t - 0.72) / 0.28;
          r = Math.round(50 + (235 - 50) * st);
          g = Math.round(44 + (238 - 44) * st);
          b = Math.round(32 + (242 - 32) * st);
        }
        
        const cityNoise = fbm3D(nx * 14.0, ny * 14.0, nz * 14.0);
        if (cityNoise > 0.60) {
          cityLight = clamp01((cityNoise - 0.60) / 0.15) * 255;
        }
      }
      
      const dx = x - 1464;
      const dy = y - 396;
      const distToIndia = Math.sqrt(dx * dx + dy * dy);
      if (distToIndia < 64) {
        const spotGlow = (1.0 - distToIndia / 64) * 0.45;
        r = Math.round(r * (1 - spotGlow) + 242 * spotGlow);
        g = Math.round(g * (1 - spotGlow) + 101 * spotGlow);
        b = Math.round(b * (1 - spotGlow) + 34 * spotGlow);
        cityLight = Math.max(cityLight, (1.0 - distToIndia / 64) * 255);
      }
      
      if (clouds > 0.45) {
        const cloudAlpha = clamp01((clouds - 0.45) / 0.25) * 0.70;
        r = Math.round(r * (1 - cloudAlpha) + 255 * cloudAlpha);
        g = Math.round(g * (1 - cloudAlpha) + 255 * cloudAlpha);
        b = Math.round(b * (1 - cloudAlpha) + 255 * cloudAlpha);
      }
      
      const pixelIdx = (y * 2048 + x) * 4;
      data[pixelIdx + 0] = r;
      data[pixelIdx + 1] = g;
      data[pixelIdx + 2] = b;
      data[pixelIdx + 3] = Math.round(cityLight);
    }
  }
  
  ctx.putImageData(imgData, 0, 0);
  
  ctx.strokeStyle = 'rgba(0, 130, 200, 0.08)';
  ctx.lineWidth = 0.5;
  for (let ly = 128; ly < 1024; ly += 128) {
    ctx.beginPath();
    ctx.moveTo(0, ly);
    ctx.lineTo(2048, ly);
    ctx.stroke();
  }
  for (let lx = 128; lx < 2048; lx += 128) {
    ctx.beginPath();
    ctx.moveTo(lx, 0);
    ctx.lineTo(lx, 1024);
    ctx.stroke();
  }
  
  return canvas;
}

// ─── SHADER COMPILING HELPERS ────────────────────────────────────

function compileShader(gl, source, type) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl, vsSource, fsSource) {
  const vs = compileShader(gl, vsSource, gl.VERTEX_SHADER);
  const fs = compileShader(gl, fsSource, gl.FRAGMENT_SHADER);
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program linking error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

export default function ParticleCanvas({ scrollProgress }) {
  const webglCanvasRef = useRef(null);
  const canvas2dRef = useRef(null);
  const animationRef = useRef(null);
  const scrollRef = useRef(scrollProgress);
  const dprRef = useRef(1);
  
  // Interactive globe rotation state
  const earthRotRef = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const isDraggingGlobeRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const hasRealTextureRef = useRef(0);

  useEffect(() => {
    scrollRef.current = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    const webglCanvas = webglCanvasRef.current;
    const canvas2d = canvas2dRef.current;
    if (!webglCanvas || !canvas2d) return;

    // 1. Initialize contexts
    const gl = webglCanvas.getContext('webgl', {
      preserveDrawingBuffer: true,
      alpha: false,
      depth: false,
      antialias: true,
      premultipliedAlpha: false
    });
    if (!gl) {
      console.error('WebGL is not supported on this platform.');
      return;
    }

    const ctx2d = canvas2d.getContext('2d');
    if (!ctx2d) {
      console.error('Canvas 2D context is not supported.');
      return;
    }

    let time = 0;

    // 2. Create GPU shader programs
    const particleProgram = createProgram(gl, PARTICLE_VS, PARTICLE_FS);
    const quadProgram = createProgram(gl, QUAD_VS, QUAD_FS);
    const earthProgram = createProgram(gl, EARTH_VS, EARTH_FS);
    if (!particleProgram || !quadProgram || !earthProgram) return;

    // 3. Generate CPU particle definitions
    const galaxyPos = new Float32Array(N * 3);
    const blackholePos = new Float32Array(N * 4); // xyz + type
    const supernovaPos = new Float32Array(N * 4); // xyz + snBaseR
    const ringPos = new Float32Array(N * 3);
    const terrainPos = new Float32Array(N * 3);
    const meta1 = new Float32Array(N * 4);        // speed, bright, bhDiskR, idx
    const meta2 = new Float32Array(N * 3);        // col, row, jetDir

    for (let i = 0; i < N; i++) {
      // ── Galaxy Vortex ──
      const arm = i % 4;
      const t0 = Math.pow(Math.random(), 1.2);
      const rGal = 8 + t0 * 280;
      const thetaGal = arm * (Math.PI * 2 / 4) + rGal * 0.018 + (Math.random() - 0.5) * 0.35;
      const galX = rGal * Math.cos(thetaGal);
      const galZ = rGal * Math.sin(thetaGal);
      const galY = (Math.random() - 0.5) * 14 * Math.exp(-rGal / 120);

      galaxyPos[i * 3 + 0] = galX;
      galaxyPos[i * 3 + 1] = galY;
      galaxyPos[i * 3 + 2] = galZ;

      // ── Blackhole ──
      const bhType = i % 5;
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
        // Accretion disk
        bhDiskR = 50 + Math.random() * 160;
        const phi = Math.random() * Math.PI * 2;
        const dx = bhDiskR * Math.cos(phi);
        const dz = bhDiskR * Math.sin(phi);
        const dy = (Math.random() - 0.5) * 4;
        const tilt = 0.44;
        bhX = dx;
        bhY = dy * Math.cos(tilt) - dz * Math.sin(tilt);
        bhZ = dy * Math.sin(tilt) + dz * Math.cos(tilt);
      } else {
        // Jet seed
        const jetDir = (i % 2 === 0) ? 1 : -1;
        const height = 10 + Math.random() * 30;
        const spread = Math.random() * 6;
        const phi = Math.random() * Math.PI * 2;
        bhX = spread * Math.cos(phi);
        bhY = height * jetDir;
        bhZ = spread * Math.sin(phi);
      }

      blackholePos[i * 4 + 0] = bhX;
      blackholePos[i * 4 + 1] = bhY;
      blackholePos[i * 4 + 2] = bhZ;
      blackholePos[i * 4 + 3] = bhType;

      // ── Supernova ──
      const snPhi = Math.random() * Math.PI * 2;
      const snCosTheta = Math.random() * 2 - 1;
      const snSinTheta = Math.sqrt(1 - snCosTheta * snCosTheta);
      const snR = 20 + Math.random() * 220;
      const snX = snR * snSinTheta * Math.cos(snPhi);
      const snY = snR * snSinTheta * Math.sin(snPhi);
      const snZ = snR * snCosTheta;

      supernovaPos[i * 4 + 0] = snX;
      supernovaPos[i * 4 + 1] = snY;
      supernovaPos[i * 4 + 2] = snZ;
      supernovaPos[i * 4 + 3] = snR;

      // ── Orbital Rings ──
      const ring = i % 5;
      const rRing = 65 + ring * 42;
      const thetaRing = Math.random() * Math.PI * 2;
      const orbitX = rRing * Math.cos(thetaRing) + (Math.random() - 0.5) * 4;
      const orbitZ = rRing * Math.sin(thetaRing) + (Math.random() - 0.5) * 4;
      const orbitY = (Math.random() - 0.5) * 2;
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

      ringPos[i * 3 + 0] = ringFinalX;
      ringPos[i * 3 + 1] = ringFinalY;
      ringPos[i * 3 + 2] = ringFinalZ;

      // ── Terrain Grid ──
      const cols = 60;
      const col = i % cols;
      const row = Math.floor(i / cols);
      const terrX = (col - cols / 2) * 14;
      const terrZ = (row - N / cols / 2) * 14;
      const terrY = 100;

      terrainPos[i * 3 + 0] = terrX;
      terrainPos[i * 3 + 1] = terrY;
      terrainPos[i * 3 + 2] = terrZ;

      // ── Metadata ──
      meta1[i * 4 + 0] = 0.7 + Math.random() * 0.6; // speed
      meta1[i * 4 + 1] = 0.4 + Math.random() * 0.6; // bright
      meta1[i * 4 + 2] = bhDiskR || 100;           // bhDiskR
      meta1[i * 4 + 3] = i;                        // index

      meta2[i * 3 + 0] = col;
      meta2[i * 3 + 1] = row;
      meta2[i * 3 + 2] = (i % 2 === 0) ? 1.0 : -1.0; // jetDir
    }

    // 4. Create and upload GPU static buffers
    function createStaticBuffer(data) {
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      return buffer;
    }

    const galaxyPosBuf = createStaticBuffer(galaxyPos);
    const blackholePosBuf = createStaticBuffer(blackholePos);
    const supernovaPosBuf = createStaticBuffer(supernovaPos);
    const ringPosBuf = createStaticBuffer(ringPos);
    const terrainPosBuf = createStaticBuffer(terrainPos);
    const meta1Buf = createStaticBuffer(meta1);
    const meta2Buf = createStaticBuffer(meta2);

    // 5. Setup Trail Quad
    const quadVertices = new Float32Array([
      -1.0, -1.0,
      1.0, -1.0,
      -1.0, 1.0,
      -1.0, 1.0,
      1.0, -1.0,
      1.0, 1.0,
    ]);
    const quadBuf = createStaticBuffer(quadVertices);

    // Get attribute/uniform locations for particles and quads
    const locations = {
      a_galaxyPos: gl.getAttribLocation(particleProgram, 'a_galaxyPos'),
      a_blackholePos: gl.getAttribLocation(particleProgram, 'a_blackholePos'),
      a_supernovaPos: gl.getAttribLocation(particleProgram, 'a_supernovaPos'),
      a_ringPos: gl.getAttribLocation(particleProgram, 'a_ringPos'),
      a_terrainPos: gl.getAttribLocation(particleProgram, 'a_terrainPos'),
      a_meta1: gl.getAttribLocation(particleProgram, 'a_meta1'),
      a_meta2: gl.getAttribLocation(particleProgram, 'a_meta2'),

      u_time: gl.getUniformLocation(particleProgram, 'u_time'),
      u_scroll: gl.getUniformLocation(particleProgram, 'u_scroll'),
      u_camPos: gl.getUniformLocation(particleProgram, 'u_camPos'),
      u_fov: gl.getUniformLocation(particleProgram, 'u_fov'),
      u_screenSize: gl.getUniformLocation(particleProgram, 'u_screenSize'),
      u_phase: gl.getUniformLocation(particleProgram, 'u_phase'),
      u_dpr: gl.getUniformLocation(particleProgram, 'u_dpr'),
    };

    const aQuadPos = gl.getAttribLocation(quadProgram, 'a_quadPos');
    const uQuadColor = gl.getUniformLocation(quadProgram, 'u_quadColor');

    // Get locations for Earth shader program
    const locationsEarth = {
      a_quadPos: gl.getAttribLocation(earthProgram, 'a_quadPos'),
      u_earthTexture: gl.getUniformLocation(earthProgram, 'u_earthTexture'),
      u_cloudTexture: gl.getUniformLocation(earthProgram, 'u_cloudTexture'),
      u_nightTexture: gl.getUniformLocation(earthProgram, 'u_nightTexture'),
      u_time: gl.getUniformLocation(earthProgram, 'u_time'),
      u_aspect: gl.getUniformLocation(earthProgram, 'u_aspect'),
      u_radius: gl.getUniformLocation(earthProgram, 'u_radius'),
      u_center: gl.getUniformLocation(earthProgram, 'u_center'),
      u_globeAlpha: gl.getUniformLocation(earthProgram, 'u_globeAlpha'),
      u_lightDir: gl.getUniformLocation(earthProgram, 'u_lightDir'),
      u_mouseRotX: gl.getUniformLocation(earthProgram, 'u_mouseRotX'),
      u_mouseRotY: gl.getUniformLocation(earthProgram, 'u_mouseRotY'),
      u_hasRealTexture: gl.getUniformLocation(earthProgram, 'u_hasRealTexture'),
    };

    // ── Setup Earth Textures (procedural fallback + real NASA textures loaded async) ──
    // Helper to create a 1x1 placeholder texture
    function createPlaceholderTex(r, g, b, a) {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([r, g, b, a]));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      return tex;
    }

    // Day texture (start with procedural, upgrade to real)
    const earthTex = gl.createTexture();
    const pCanvas = generateEarthTexture();
    gl.bindTexture(gl.TEXTURE_2D, earthTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, pCanvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Cloud texture (start with empty white placeholder)
    const cloudTex = createPlaceholderTex(0, 0, 0, 255);
    // Night lights texture (start with empty black placeholder)
    const nightTex = createPlaceholderTex(0, 0, 0, 255);

    // Load real NASA textures asynchronously and swap in when ready
    function loadTextureFromURL(url, targetTex, onSuccess) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, targetTex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        if (onSuccess) onSuccess();
      };
      img.onerror = () => console.warn('Failed to load texture:', url);
      img.src = url;
    }

    // Load real NASA Blue Marble day texture
    loadTextureFromURL('/earth_texture.jpg', earthTex, () => {
      hasRealTextureRef.current = 1;
      console.log('✅ NASA Blue Marble texture loaded');
    });
    // Load cloud layer
    loadTextureFromURL('/earth_clouds.png', cloudTex, () => {
      console.log('✅ Cloud layer texture loaded');
    });
    // Load night lights
    loadTextureFromURL('/earth_lights.png', nightTex, () => {
      console.log('✅ Night lights texture loaded');
    });

    function setupAttribute(buffer, location, size) {
      if (location === -1) return;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
    }

    // 6. Generate 300 background stars
    const stars = [];
    for (let si = 0; si < 300; si++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        r: 0.3 + Math.random() * 0.8,
        a: 0.15 + Math.random() * 0.35,
      });
    }

    // Initialize WebGL viewport state
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // ─── HIGH-DPI CANVAS RESIZING ─────────────────────────────────
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      dprRef.current = dpr;
      const w = window.innerWidth;
      const h = window.innerHeight;

      // WebGL Canvas size
      webglCanvas.width = w * dpr;
      webglCanvas.height = h * dpr;
      webglCanvas.style.width = w + 'px';
      webglCanvas.style.height = h + 'px';
      gl.viewport(0, 0, w * dpr, h * dpr);

      // 2D Canvas size
      canvas2d.width = w * dpr;
      canvas2d.height = h * dpr;
      canvas2d.style.width = w + 'px';
      canvas2d.style.height = h + 'px';
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // ─── MATH HELPERS ──────────────────────────────────────────────
    const lerp = (a, b, t) => a + (b - a) * t;
    const smooth = (t) => t * t * (3 - 2 * t);
    const clamp01 = (v) => Math.max(0, Math.min(1, v));

    // ─── CAMERA PARAMETERS ──────────────────────────────────────────
    const getCamera = (s) => {
      let dist = 500, elevAngle = 0.45, azAngle = 0, fov = 500;

      if (s <= 0.20) {
        const t = s / 0.20;
        dist = lerp(600, 550, t);
        elevAngle = lerp(0.5, 0.55, t);
        azAngle = lerp(0, 0.15, t);
        fov = 500;
      } else if (s <= 0.40) {
        const t = (s - 0.20) / 0.20;
        dist = lerp(550, 420, t);
        elevAngle = lerp(0.55, 0.45, t);
        azAngle = lerp(0.15, 0.5, t);
        fov = lerp(500, 520, t);
      } else if (s <= 0.60) {
        const t = (s - 0.40) / 0.20;
        dist = lerp(420, 600, t);
        elevAngle = lerp(0.45, 0.35, t);
        azAngle = lerp(0.5, 0.9, t);
        fov = lerp(520, 480, t);
      } else if (s <= 0.80) {
        const t = (s - 0.60) / 0.20;
        dist = lerp(600, 480, t);
        elevAngle = lerp(0.35, 0.4, t);
        azAngle = lerp(0.9, 1.4, t);
        fov = lerp(480, 500, t);
      } else {
        const t = (s - 0.80) / 0.20;
        dist = lerp(480, 700, t);
        elevAngle = lerp(0.4, 1.0, t);
        azAngle = lerp(1.4, 1.8, t);
        fov = lerp(500, 450, t);
      }

      const camX = dist * Math.cos(elevAngle) * Math.sin(azAngle);
      const camY = -dist * Math.sin(elevAngle);
      const camZ = dist * Math.cos(elevAngle) * Math.cos(azAngle);

      return { camX, camY, camZ, fov };
    };

    // 2D projection for void and leaders
    const project = (wx, wy, wz, cam, sw, sh) => {
      const dx = wx - cam.camX;
      const dy = wy - cam.camY;
      const dz = wz - cam.camZ;

      const fLen = Math.sqrt(cam.camX * cam.camX + cam.camY * cam.camY + cam.camZ * cam.camZ);
      const fx = -cam.camX / fLen;
      const fy = -cam.camY / fLen;
      const fz = -cam.camZ / fLen;

      let ux = 0, uy = -1, uz = 0;
      let rightX = uy * fz - uz * fy;
      let rightY = uz * fx - ux * fz;
      let rightZ = ux * fy - uy * fx;
      const rLen = Math.sqrt(rightX * rightX + rightY * rightY + rightZ * rightZ);
      if (rLen < 0.001) return null;
      rightX /= rLen; rightY /= rLen; rightZ /= rLen;

      const upX = fy * rightZ - fz * rightY;
      const upY = fz * rightX - fx * rightZ;
      const upZ = fx * rightY - fy * rightX;

      const pz = dx * fx + dy * fy + dz * fz;
      if (pz < 10) return null;

      const px = dx * rightX + dy * rightY + dz * rightZ;
      const py = dx * upX + dy * upY + dz * upZ;

      const screenX = sw / 2 + (px * cam.fov) / pz;
      const screenY = sh / 2 + (py * cam.fov) / pz;

      return { x: screenX, y: screenY, depth: pz };
    };

    // ─── MAIN FRAME LOOP ───────────────────────────────────────────
    const render = () => {
      time += 1;
      const s = scrollRef.current;
      const sw = window.innerWidth;
      const sh = window.innerHeight;
      const cam = getCamera(s);

      // Calculate dynamic theme color for HUD overlays (matching Dashboard.jsx)
      let rTheme = 0, gTheme = 130, bTheme = 200; // default ISRO Blue
      if (s <= 0.20) {
        // Stage 0: Galaxy (deep celestial blue)
        rTheme = 58; gTheme = 134; bTheme = 255;
      } else if (s <= 0.40) {
        // Galaxy -> Blackhole transition
        const t = (s - 0.20) / 0.20;
        rTheme = Math.round(58.0 + (255.0 - 58.0) * t);
        gTheme = Math.round(134.0 + (94.0 - 134.0) * t);
        bTheme = Math.round(255.0 + (0.0 - 255.0) * t);
      } else if (s <= 0.60) {
        // Stage 1: Blackhole (fiery accretion disk orange)
        rTheme = 255; gTheme = 94; bTheme = 0;
      } else if (s <= 0.80) {
        // Stage 2: Supernova (relativistic red-orange to ISRO blue)
        const t = (s - 0.60) / 0.20;
        rTheme = Math.round(255.0 + (0.0 - 255.0) * t);
        gTheme = Math.round(45.0 + (130.0 - 45.0) * t);
        bTheme = Math.round(0.0 + (200.0 - 0.0) * t);
      } else {
        // Stage 3 & 4: rings / terrain (ISRO blue)
        rTheme = 0; gTheme = 130; bTheme = 200;
      }

      // Determine current phase
      let phase = 0;
      if (s > 0.15 && s <= 0.42) phase = 1;
      else if (s > 0.42 && s <= 0.62) phase = 2;
      else if (s > 0.62 && s <= 0.82) phase = 3;
      else if (s > 0.82) phase = 4;

      // ── WebGL Rendering ──

      // 1. Dim WebGL canvas buffer to create trails
      gl.useProgram(quadProgram);
      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
      gl.enableVertexAttribArray(aQuadPos);
      gl.vertexAttribPointer(aQuadPos, 2, gl.FLOAT, false, 0, 0);
      gl.uniform4f(uQuadColor, 0.0, 0.0, 0.0, 0.2); // Fades previous frame by 20% opacity
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.disableVertexAttribArray(aQuadPos);

      // 2. Draw photorealistic 3D Earth (fades in at Stage 4 / s >= 0.85, behind console view)
      let globeAlpha = 0;
      if (s >= 0.85) {
        globeAlpha = clamp01((s - 0.85) / 0.08) * 0.75;
      }

      // Update globe rotation momentum (inertia physics)
      const rot = earthRotRef.current;
      if (!isDraggingGlobeRef.current) {
        rot.x += rot.vx;
        rot.y += rot.vy;
        // Friction decay
        rot.vx *= 0.96;
        rot.vy *= 0.96;
        // Clamp tiny velocities to zero
        if (Math.abs(rot.vx) < 0.0001) rot.vx = 0;
        if (Math.abs(rot.vy) < 0.0001) rot.vy = 0;
      }
      // Clamp vertical rotation to avoid flipping
      rot.y = Math.max(-1.2, Math.min(1.2, rot.y));

      if (globeAlpha > 0.01) {
        gl.useProgram(earthProgram);
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
        gl.enableVertexAttribArray(locationsEarth.a_quadPos);
        gl.vertexAttribPointer(locationsEarth.a_quadPos, 2, gl.FLOAT, false, 0, 0);

        // Bind day texture (unit 0)
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, earthTex);
        gl.uniform1i(locationsEarth.u_earthTexture, 0);

        // Bind cloud texture (unit 1)
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, cloudTex);
        gl.uniform1i(locationsEarth.u_cloudTexture, 1);

        // Bind night lights texture (unit 2)
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, nightTex);
        gl.uniform1i(locationsEarth.u_nightTexture, 2);

        gl.uniform1f(locationsEarth.u_time, time);
        gl.uniform1f(locationsEarth.u_aspect, sw / sh);
        gl.uniform1f(locationsEarth.u_radius, 0.55);
        gl.uniform2f(locationsEarth.u_center, 0.0, 0.05);
        gl.uniform1f(locationsEarth.u_globeAlpha, globeAlpha);
        gl.uniform3f(locationsEarth.u_lightDir, -1.0, 0.8, 1.2);
        gl.uniform1f(locationsEarth.u_mouseRotX, rot.x);
        gl.uniform1f(locationsEarth.u_mouseRotY, rot.y);
        gl.uniform1f(locationsEarth.u_hasRealTexture, hasRealTextureRef.current);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.disableVertexAttribArray(locationsEarth.a_quadPos);
      }

      // 3. Draw 20,000 particles
      gl.useProgram(particleProgram);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // Additive blending for cyberpunk glow!

      // Setup attributes
      setupAttribute(galaxyPosBuf, locations.a_galaxyPos, 3);
      setupAttribute(blackholePosBuf, locations.a_blackholePos, 4);
      setupAttribute(supernovaPosBuf, locations.a_supernovaPos, 4);
      setupAttribute(ringPosBuf, locations.a_ringPos, 3);
      setupAttribute(terrainPosBuf, locations.a_terrainPos, 3);
      setupAttribute(meta1Buf, locations.a_meta1, 4);
      setupAttribute(meta2Buf, locations.a_meta2, 3);

      // Setup uniforms
      gl.uniform1f(locations.u_time, time);
      gl.uniform1f(locations.u_scroll, s);
      gl.uniform3f(locations.u_camPos, cam.camX, cam.camY, cam.camZ);
      gl.uniform1f(locations.u_fov, cam.fov);
      gl.uniform2f(locations.u_screenSize, sw, sh);
      gl.uniform1f(locations.u_phase, phase);
      gl.uniform1f(locations.u_dpr, dprRef.current);

      gl.drawArrays(gl.POINTS, 0, N);

      // Disable attributes
      if (locations.a_galaxyPos !== -1) gl.disableVertexAttribArray(locations.a_galaxyPos);
      if (locations.a_blackholePos !== -1) gl.disableVertexAttribArray(locations.a_blackholePos);
      if (locations.a_supernovaPos !== -1) gl.disableVertexAttribArray(locations.a_supernovaPos);
      if (locations.a_ringPos !== -1) gl.disableVertexAttribArray(locations.a_ringPos);
      if (locations.a_terrainPos !== -1) gl.disableVertexAttribArray(locations.a_terrainPos);
      if (locations.a_meta1 !== -1) gl.disableVertexAttribArray(locations.a_meta1);
      if (locations.a_meta2 !== -1) gl.disableVertexAttribArray(locations.a_meta2);


      // ── Canvas 2D Vector/Overlay Rendering ──

      ctx2d.clearRect(0, 0, sw, sh);

      // 1. Draw twinkling background stars
      for (const star of stars) {
        const twinkle = star.a + Math.sin(time * 0.01 + star.x * 100) * 0.08;
        ctx2d.fillStyle = `rgba(180, 210, 255, ${clamp01(twinkle).toFixed(3)})`;
        ctx2d.fillRect(star.x * sw, star.y * sh, star.r, star.r);
      }

      // 2. Draw blackhole void glow
      if (phase === 1 || (phase === 2 && s < 0.50)) {
        const bhInfluence = phase === 1 ? clamp01((s - 0.20) / 0.15) : clamp01(1 - (s - 0.42) / 0.08);
        const centerPt = project(0, 0, 0, cam, sw, sh);
        if (centerPt && bhInfluence > 0.05) {
          // Dark blackhole void mask
          const voidGrad = ctx2d.createRadialGradient(centerPt.x, centerPt.y, 0, centerPt.x, centerPt.y, 60);
          voidGrad.addColorStop(0, `rgba(0, 0, 0, ${(0.95 * bhInfluence).toFixed(3)})`);
          voidGrad.addColorStop(0.5, `rgba(0, 5, 2, ${(0.5 * bhInfluence).toFixed(3)})`);
          voidGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx2d.fillStyle = voidGrad;
          ctx2d.fillRect(centerPt.x - 80, centerPt.y - 80, 160, 160);

          // Event horizon glowing boundary lines (Image 3 colors)
          ctx2d.strokeStyle = `rgba(255, 63, 0, ${(0.45 * bhInfluence).toFixed(3)})`;
          ctx2d.lineWidth = 2.5;
          ctx2d.beginPath();
          ctx2d.arc(centerPt.x, centerPt.y, 35, 0, Math.PI * 2);
          ctx2d.stroke();

          ctx2d.strokeStyle = `rgba(65, 105, 225, ${(0.25 * bhInfluence).toFixed(3)})`;
          ctx2d.lineWidth = 3.5;
          ctx2d.beginPath();
          ctx2d.arc(centerPt.x, centerPt.y, 42, 0, Math.PI * 2);
          ctx2d.stroke();

          ctx2d.strokeStyle = `rgba(255, 215, 0, ${(0.20 * bhInfluence).toFixed(3)})`;
          ctx2d.lineWidth = 7;
          ctx2d.beginPath();
          ctx2d.arc(centerPt.x, centerPt.y, 50, 0, Math.PI * 2);
          ctx2d.stroke();
        }
      }

      // 3. Supernova flash (Image 2: gold-orange hot blast)
      if (phase === 2 && s >= 0.42 && s <= 0.52) {
        const flashT = clamp01((s - 0.42) / 0.04);
        const flashFade = clamp01(1 - (s - 0.46) / 0.06);
        const flashAlpha = flashT * flashFade * 0.3;
        if (flashAlpha > 0.01) {
          const flashGrad = ctx2d.createRadialGradient(sw / 2, sh / 2, 0, sw / 2, sh / 2, sh * 0.5);
          flashGrad.addColorStop(0, `rgba(255, 250, 210, ${flashAlpha.toFixed(3)})`);
          flashGrad.addColorStop(0.4, `rgba(255, 80, 0, ${(flashAlpha * 0.45).toFixed(3)})`);
          flashGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx2d.fillStyle = flashGrad;
          ctx2d.fillRect(0, 0, sw, sh);
        }
      }

      // 4. HUD Annotations
      let hudAlpha = 0;
      if (s >= 0.62 && s <= 0.78) {
        if (s <= 0.67) hudAlpha = (s - 0.62) / 0.05;
        else if (s >= 0.73) hudAlpha = (0.78 - s) / 0.05;
        else hudAlpha = 1;
      }

      // Calculate narrative typography text opacities to dynamically fade HUD nodes and avoid overlaps
      let typography1Opacity = 0;
      let typography2Opacity = 0;
      if (s >= 0.55 && s <= 0.78) {
        if (s >= 0.55 && s <= 0.70) {
          typography1Opacity = Math.min(1, (s - 0.55) / 0.06);
          if (s >= 0.66) {
            typography1Opacity = Math.max(0, 1 - (s - 0.66) / 0.04);
          }
        }
        if (s >= 0.64 && s <= 0.78) {
          typography2Opacity = Math.min(1, (s - 0.64) / 0.05);
          if (s >= 0.74) {
            typography2Opacity = Math.max(0, 1 - (s - 0.74) / 0.04);
          }
        }
      }

      if (hudAlpha > 0.02) {
        ctx2d.save();
        ctx2d.font = '10px "Share Tech Mono", monospace';
        ctx2d.lineWidth = 1;

        // Position nodes at -120 and 120 vertically to clear center horizontal section where narrative text resides
        const hudNodes = [
          { text: 'PRIMARY THERMAL MATRIX', sub: 'BANDWIDTH: 8 – 14 µM', side: 'left', yOff: -120 },
          { text: 'CLAHE CONTRAST ENHANCE', sub: 'BILINEAR GRID: 8×8', side: 'right', yOff: -120 },
          { text: 'NEURAL SUPER-RESOLUTION', sub: 'MODEL: REAL-ESRGAN 4X', side: 'left', yOff: 120 },
          { text: 'YOLO-WORLD CLASSIFIER', sub: 'TARGET HEAD: ZERO-SHOT', side: 'right', yOff: 120 },
        ];

        hudNodes.forEach((node) => {
          // Dynamic side-based opacity fade out when overlapping text slides in
          const sideAlpha = node.side === 'left' ? (1.0 - typography1Opacity) : (1.0 - typography2Opacity);
          const finalAlpha = hudAlpha * sideAlpha;
          if (finalAlpha <= 0.02) return;

          const targetX = node.side === 'left' ? sw * 0.14 : sw * 0.86;
          const targetY = sh / 2 + node.yOff;
          const anchorX = sw / 2 + (node.side === 'left' ? -80 : 80);
          const anchorY = targetY + (node.yOff > 0 ? -20 : 20);

          // Leader node indicator circles
          ctx2d.strokeStyle = `rgba(${rTheme}, ${gTheme}, ${bTheme}, ${(finalAlpha * 0.5).toFixed(3)})`;
          ctx2d.beginPath();
          ctx2d.arc(anchorX, anchorY, 4, 0, Math.PI * 2);
          ctx2d.stroke();
          ctx2d.fillStyle = `rgba(${rTheme}, ${gTheme}, ${bTheme}, finalAlpha.toFixed(3))`;
          ctx2d.beginPath();
          ctx2d.arc(anchorX, anchorY, 2, 0, Math.PI * 2);
          ctx2d.fill();

          // Connect leader lines
          ctx2d.beginPath();
          ctx2d.moveTo(anchorX, anchorY);
          const midX = node.side === 'left' ? targetX + 30 : targetX - 30;
          ctx2d.lineTo(midX, targetY);
          ctx2d.lineTo(targetX, targetY);
          ctx2d.stroke();

          // Anchor Text labels
          ctx2d.textAlign = node.side === 'left' ? 'left' : 'right';
          ctx2d.fillStyle = `rgba(255, 255, 255, ${finalAlpha.toFixed(3)})`;
          ctx2d.fillText(node.text, targetX, targetY - 5);
          ctx2d.fillStyle = `rgba(${rTheme}, ${gTheme}, ${bTheme}, ${(finalAlpha * 0.9).toFixed(3)})`;
          ctx2d.fillText(node.sub, targetX, targetY + 9);

          // Digital bracket styling
          ctx2d.strokeStyle = `rgba(${rTheme}, ${gTheme}, ${bTheme}, ${(finalAlpha * 0.25).toFixed(3)})`;
          ctx2d.beginPath();
          const bx = node.side === 'left' ? targetX - 4 : targetX + 4;
          ctx2d.moveTo(bx, targetY - 12);
          ctx2d.lineTo(targetX, targetY - 12);
          ctx2d.lineTo(targetX, targetY + 14);
          ctx2d.lineTo(bx, targetY + 14);
          ctx2d.stroke();
        });

        ctx2d.restore();
      }

      // 5. Overlay subtle vignette
      const gradient = ctx2d.createRadialGradient(sw / 2, sh / 2, sh * 0.3, sw / 2, sh / 2, sh * 0.9);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.35)');
      ctx2d.fillStyle = gradient;
      ctx2d.fillRect(0, 0, sw, sh);

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    // ─── INTERACTIVE GLOBE MOUSE HANDLERS ─────────────────────────
    const onMouseDown = (e) => {
      const s = scrollRef.current;
      if (s < 0.85) return; // Only interactive when globe is visible
      isDraggingGlobeRef.current = true;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      earthRotRef.current.vx = 0;
      earthRotRef.current.vy = 0;
    };

    const onMouseMove = (e) => {
      if (!isDraggingGlobeRef.current) return;
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      
      const sensitivity = 0.005;
      earthRotRef.current.x += dx * sensitivity;
      earthRotRef.current.y -= dy * sensitivity;
      
      // Track velocity for momentum
      earthRotRef.current.vx = dx * sensitivity * 0.5;
      earthRotRef.current.vy = -dy * sensitivity * 0.5;
      
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingGlobeRef.current = false;
    };

    // Touch support for mobile
    const onTouchStart = (e) => {
      if (e.touches.length !== 1) return;
      const s = scrollRef.current;
      if (s < 0.85) return;
      isDraggingGlobeRef.current = true;
      lastMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      earthRotRef.current.vx = 0;
      earthRotRef.current.vy = 0;
    };

    const onTouchMove = (e) => {
      if (!isDraggingGlobeRef.current || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - lastMouseRef.current.x;
      const dy = e.touches[0].clientY - lastMouseRef.current.y;
      
      const sensitivity = 0.005;
      earthRotRef.current.x += dx * sensitivity;
      earthRotRef.current.y -= dy * sensitivity;
      earthRotRef.current.vx = dx * sensitivity * 0.5;
      earthRotRef.current.vy = -dy * sensitivity * 0.5;
      
      lastMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const onTouchEnd = () => {
      isDraggingGlobeRef.current = false;
    };

    // Attach listeners to the document so dragging outside canvas still works
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseleave', onMouseUp);
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);

      // Remove mouse/touch event listeners
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseUp);
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);

      // Clean up GPU buffers
      gl.deleteBuffer(galaxyPosBuf);
      gl.deleteBuffer(blackholePosBuf);
      gl.deleteBuffer(supernovaPosBuf);
      gl.deleteBuffer(ringPosBuf);
      gl.deleteBuffer(terrainPosBuf);
      gl.deleteBuffer(meta1Buf);
      gl.deleteBuffer(meta2Buf);
      gl.deleteBuffer(quadBuf);

      // Clean up WebGL textures
      gl.deleteTexture(earthTex);
      gl.deleteTexture(cloudTex);
      gl.deleteTexture(nightTex);

      // Clean up shader programs
      gl.deleteProgram(particleProgram);
      gl.deleteProgram(quadProgram);
      gl.deleteProgram(earthProgram);
    };
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <canvas
        ref={webglCanvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          background: '#000000',
          display: 'block',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />
      <canvas
        ref={canvas2dRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          background: 'transparent',
          display: 'block',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
