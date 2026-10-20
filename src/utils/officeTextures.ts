import * as THREE from 'three';

function configureRepeatTexture(
  canvas: HTMLCanvasElement,
  repeatX = 1,
  repeatY = 1
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = 16;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * 1. Polished Walnut / Oak Hardwood Floor Texture for Executive Office Interior
 */
export function createHardwoodFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#5c3a21';
  ctx.fillRect(0, 0, 512, 512);

  const plankRows = 8;
  const plankH = 512 / plankRows;

  for (let r = 0; r < plankRows; r++) {
    const y = r * plankH;
    const offset = (r % 2) * 128;
    for (let x = -128; x < 512; x += 256) {
      const px = x + offset;
      const shade = (Math.random() - 0.5) * 18;
      const baseR = Math.min(255, Math.max(0, 98 + shade));
      const baseG = Math.min(255, Math.max(0, 62 + shade * 0.7));
      const baseB = Math.min(255, Math.max(0, 36 + shade * 0.5));

      ctx.fillStyle = `rgb(${Math.round(baseR)}, ${Math.round(baseG)}, ${Math.round(baseB)})`;
      ctx.fillRect(px, y, 256, plankH);

      // Subtle wood grain lines
      ctx.strokeStyle = 'rgba(30, 15, 5, 0.16)';
      ctx.lineWidth = 1;
      for (let g = 4; g < plankH - 2; g += 6) {
        ctx.beginPath();
        ctx.moveTo(px, y + g);
        ctx.lineTo(px + 256, y + g + (Math.random() - 0.5) * 3);
        ctx.stroke();
      }

      // Plank border joint
      ctx.strokeStyle = 'rgba(24, 13, 6, 0.65)';
      ctx.lineWidth = 2;
      ctx.strokeRect(px, y, 256, plankH);
    }
  }

  return configureRepeatTexture(canvas, 6, 6);
}

/**
 * 2. Polished Cream / Carrara Marble Lobby Tile Texture
 */
export function createMarbleTileTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle marble veins
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 18; i++) {
    ctx.beginPath();
    let vx = Math.random() * 512;
    let vy = Math.random() * 512;
    ctx.moveTo(vx, vy);
    for (let s = 0; s < 5; s++) {
      vx += (Math.random() - 0.4) * 90;
      vy += (Math.random() - 0.4) * 90;
      ctx.lineTo(vx, vy);
    }
    ctx.stroke();
  }

  // Tile grout grid (2x2 tiles per 512)
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.45)';
  ctx.lineWidth = 3;
  for (let x = 0; x <= 512; x += 256) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y <= 512; y += 256) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  return configureRepeatTexture(canvas, 8, 6);
}

/**
 * 3. Exterior Interlocking Stone Courtyard & Driveway Texture (Kayfarm Estate Style)
 */
export function createCourtyardPavingTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#64748b';
  ctx.fillRect(0, 0, 512, 512);

  const bw = 64;
  const bh = 32;
  for (let row = 0; row < 512 / bh; row++) {
    for (let col = 0; col < 512 / bw + 1; col++) {
      const ox = (row % 2) * (bw / 2);
      const x = col * bw - ox;
      const y = row * bh;

      const shade = 95 + Math.floor(Math.random() * 32);
      ctx.fillStyle = `rgb(${shade}, ${shade + 3}, ${shade + 7})`;
      ctx.fillRect(x + 2, y + 2, bw - 4, bh - 4);

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, bw - 2, bh - 2);
    }
  }

  return configureRepeatTexture(canvas, 14, 14);
}

/**
 * 4. Exterior Asphalt Road Texture with Lane Markings
 */
export function createAsphaltRoadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 9000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const b = 26 + Math.floor(Math.random() * 28);
    ctx.fillStyle = `rgb(${b}, ${b + 2}, ${b + 6})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Center dashed road line
  ctx.fillStyle = '#facc15';
  for (let y = 20; y < 512; y += 96) {
    ctx.fillRect(250, y, 12, 52);
  }

  // Edge white lines
  ctx.fillStyle = 'rgba(248, 250, 252, 0.7)';
  ctx.fillRect(18, 0, 8, 512);
  ctx.fillRect(486, 0, 8, 512);

  return configureRepeatTexture(canvas, 1, 10);
}

/**
 * 5. Sub-Tropical Lush Estate Lawn Grass Texture
 */
export function createGrassLawnTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#2d4c2b';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 12000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const g = 65 + Math.floor(Math.random() * 45);
    const r = Math.floor(g * 0.58);
    const b = Math.floor(g * 0.42);
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(x, y, 3, 3);
  }

  return configureRepeatTexture(canvas, 45, 45);
}

/**
 * 6. Architectural Plaster / Acoustic Wall Texture
 */
export function createInteriorWallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const v = 238 + Math.floor(Math.random() * 16);
    ctx.fillStyle = `rgb(${v}, ${v}, ${v + 2})`;
    ctx.fillRect(x, y, 2, 2);
  }

  return configureRepeatTexture(canvas, 4, 2);
}
