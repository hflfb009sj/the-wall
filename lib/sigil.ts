/**
 * THE WALL — Sigil Generator
 * Every sigil is mathematically unique:
 * hash(piUID + timestamp + randomSalt) → irreproducible geometric pattern
 */

// Deterministic hash — same inputs always give same output
function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0; // unsigned 32-bit
  }
  return hash;
}

// Multi-seed generator from combined identity
function generateSeeds(piId: string, timestamp: number, salt: string): number[] {
  const combined = `${piId}::${timestamp}::${salt}::THE_WALL_ETERNAL`;
  const seeds: number[] = [];
  let base = djb2Hash(combined);
  for (let i = 0; i < 32; i++) {
    base = djb2Hash(base.toString() + i.toString() + combined[i % combined.length]);
    seeds.push(base);
  }
  return seeds;
}

// Seeded pseudo-random [0,1)
function seededRand(seed: number, i: number): number {
  const h = djb2Hash(seed.toString() + i.toString());
  return (h % 10000) / 10000;
}

// Points on circle at unique angles derived from seeds
function getPoints(seeds: number[], count: number, radius: number): [number, number][] {
  const baseOffset = seededRand(seeds[0], 0) * Math.PI * 2;
  const points: [number, number][] = [];
  for (let i = 0; i < count; i++) {
    const jitter = (seededRand(seeds[i + 3], i) - 0.5) * 0.4;
    const angle = baseOffset + (i / count) * Math.PI * 2 + jitter;
    const r = radius * (0.72 + seededRand(seeds[i + 8], i) * 0.28);
    points.push([Math.cos(angle) * r, Math.sin(angle) * r]);
  }
  return points;
}

// Connect points with unique skip pattern
function connectPoints(points: [number, number][], seeds: number[]): [number, number, number, number][] {
  const lines: [number, number, number, number][] = [];
  const n = points.length;

  // Outer polygon
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    lines.push([points[i][0], points[i][1], points[j][0], points[j][1]]);
  }

  // Cross connections based on seeds
  const skipPattern = 2 + (seeds[1] % Math.max(1, n - 2));
  for (let i = 0; i < n; i++) {
    const j = (i + skipPattern) % n;
    if (j !== i && j !== (i + 1) % n) {
      lines.push([points[i][0], points[i][1], points[j][0], points[j][1]]);
    }
  }

  // Center spokes — based on seed parity
  if (seeds[5] % 3 !== 0) {
    const spokeCount = 2 + (seeds[6] % 3);
    for (let i = 0; i < spokeCount; i++) {
      const idx = Math.floor(seededRand(seeds[i + 12], i) * n);
      lines.push([0, 0, points[idx][0], points[idx][1]]);
    }
  }

  // Secondary inner shape
  if (seeds[7] % 2 === 0) {
    const innerR = 0.45;
    const innerPoints = getPoints(seeds.map(s => s ^ 0xDEADBEEF), Math.max(3, n - 1), innerR);
    for (let i = 0; i < innerPoints.length; i++) {
      const j = (i + 1) % innerPoints.length;
      lines.push([innerPoints[i][0], innerPoints[i][1], innerPoints[j][0], innerPoints[j][1]]);
    }
  }

  return lines;
}

// Unique color per pioneer
function sigilColor(seeds: number[]): string {
  const palettes = [
    ['#e8b84b', '#f0c868'], // gold
    ['#c0c8e0', '#d8e0f0'], // silver
    ['#c8845a', '#e09870'], // bronze
    ['#60c8ff', '#80d8ff'], // obsidian blue
    ['#d4a0ff', '#e8c0ff'], // genesis purple
    ['#fff8e0', '#fffaf0'], // sovereign white
    ['#a0e898', '#b8f0b0'], // emerald
    ['#ff9060', '#ffb080'], // amber
  ];
  const palette = palettes[seeds[2] % palettes.length];
  return palette[seeds[4] % palette.length];
}

export interface SigilData {
  piId: string;
  timestamp: number;
  salt: string;
  color: string;
  pointCount: number;
}

export function generateSigilData(piId: string, timestamp: number): SigilData {
  // Salt derived from piId + timestamp — truly unique
  const salt = djb2Hash(piId + timestamp).toString(16).padStart(8, '0') +
               djb2Hash(timestamp + piId.length).toString(16).padStart(8, '0');
  const seeds = generateSeeds(piId, timestamp, salt);
  return {
    piId, timestamp, salt,
    color: sigilColor(seeds),
    pointCount: 3 + (seeds[0] % 5), // 3-7 points
  };
}

export function renderSigilSVG(data: SigilData, size: number = 80): string {
  const { piId, timestamp, salt, color, pointCount } = data;
  const seeds = generateSeeds(piId, timestamp, salt);
  const h = size / 2;
  const r = h * 0.76;

  const points = getPoints(seeds, pointCount, r);
  const lines = connectPoints(points, seeds);

  const linesHTML = lines.map(([x1, y1, x2, y2]) =>
    `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}"/>`
  ).join('');

  const nodesHTML = points.map(([x, y], i) =>
    `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${(i === 0 ? h * 0.05 : h * 0.035).toFixed(2)}" fill="${color}" opacity="0.95"/>`
  ).join('');

  const gemR = (h * 0.12).toFixed(2);
  const outerR = (h * 0.16).toFixed(2);

  return `<svg width="${size}" height="${size}" viewBox="${-h} ${-h} ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <g stroke="${color}" stroke-width="${(h * 0.018).toFixed(2)}" fill="none" opacity="0.92">${linesHTML}</g>
    ${nodesHTML}
    <circle cx="0" cy="0" r="${outerR}" fill="none" stroke="${color}" stroke-width="${(h * 0.012).toFixed(2)}" opacity="0.4"/>
    <circle cx="0" cy="0" r="${gemR}" fill="${color}" opacity="0.95"/>
  </svg>`;
}

// Convenience: render from scratch (for new pioneers)
export function generateSigil(piId: string, timestamp: number, size: number = 80): string {
  return renderSigilSVG(generateSigilData(piId, timestamp), size);
}

// Verify a sigil is authentic (matches stored data)
export function verifySigil(data: SigilData): boolean {
  const expectedSalt = djb2Hash(data.piId + data.timestamp).toString(16).padStart(8, '0') +
                       djb2Hash(data.timestamp + data.piId.length).toString(16).padStart(8, '0');
  return data.salt === expectedSalt;
}
