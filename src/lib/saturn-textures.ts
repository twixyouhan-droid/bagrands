/**
 * Procedural Saturn textures.
 *
 * Generated once on a canvas at startup so the planet looks right with zero
 * assets in the repo. Drop real textures in public/textures/saturn/ and point
 * `model.textures` at them in src/config/profile.ts to upgrade — these are
 * only the fallback.
 *
 * Both textures are equirectangular-style strips:
 *  - planet: width × height/2, longitude on x, latitude on y
 *  - ring:   x = radius from the inner edge (1.11 R) to the outer edge (2.35 R),
 *            alpha channel = ring opacity (gaps are transparent)
 */

/* ------------------------------------------------------------- noise */
function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}
/** 1-D value noise in [0, 1]. */
function noise1(x: number): number {
  const i = Math.floor(x);
  const f = smooth(x - i);
  return hash(i) * (1 - f) + hash(i + 1) * f;
}
/** 2-D value noise in [0, 1]. */
function noise2(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = smooth(x - ix);
  const fy = smooth(y - iy);
  const a = hash(ix + iy * 57);
  const b = hash(ix + 1 + iy * 57);
  const c = hash(ix + (iy + 1) * 57);
  const d = hash(ix + 1 + (iy + 1) * 57);
  return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
}
function fbm1(x: number, octaves = 4): number {
  let v = 0;
  let amp = 0.5;
  let sum = 0;
  for (let i = 0; i < octaves; i += 1) {
    v += noise1(x) * amp;
    sum += amp;
    x *= 2.03;
    amp *= 0.5;
  }
  return v / sum;
}
function fbm2(x: number, y: number, octaves = 3): number {
  let v = 0;
  let amp = 0.5;
  let sum = 0;
  for (let i = 0; i < octaves; i += 1) {
    v += noise2(x, y) * amp;
    sum += amp;
    x *= 2.1;
    y *= 2.1;
    amp *= 0.5;
  }
  return v / sum;
}

/**
 * Desaturate a loaded image (real textures from public/textures) on a canvas,
 * keeping its alpha channel — used when `model.monochrome` is on.
 */
export function desaturateImage(img: HTMLImageElement | ImageBitmap): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d")!;
  ctx.filter = "grayscale(1)";
  ctx.drawImage(img, 0, 0);
  return canvas;
}

/* ----------------------------------------------------------- palette */
type RGB = [number, number, number];
function hex(h: string): RGB {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
/** Piecewise-linear gradient lookup. */
function gradient(stops: Array<[number, RGB]>, t: number): RGB {
  t = Math.min(Math.max(t, 0), 1);
  for (let i = 1; i < stops.length; i += 1) {
    if (t <= stops[i][0]) {
      const [t0, c0] = stops[i - 1];
      const [t1, c1] = stops[i];
      const k = t1 === t0 ? 0 : (t - t0) / (t1 - t0);
      return [lerp(c0[0], c1[0], k), lerp(c0[1], c1[1], k), lerp(c0[2], c1[2], k)];
    }
  }
  return stops[stops.length - 1][1];
}

/* ------------------------------------------------------------ planet */
/**
 * Saturn is pale gold with soft latitudinal bands, brighter at the equator,
 * duller and slightly blue-grey toward the poles. The bands come from a 1-D
 * noise on latitude, warped a little by 2-D noise so they aren't ruler-straight.
 */
/** Rec. 601 luma, for the monochrome look. */
function luma(r: number, g: number, b: number): number {
  return r * 0.299 + g * 0.587 + b * 0.114;
}

export function makePlanetTexture(width = 1024, mono = false): HTMLCanvasElement {
  const height = width / 2;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(width, height);
  const data = img.data;

  const palette: Array<[number, RGB]> = [
    [0, hex("#a98a5e")],
    [0.18, hex("#d2b98d")],
    [0.34, hex("#eadcb9")],
    [0.48, hex("#c5a97c")],
    [0.62, hex("#e6d5ab")],
    [0.78, hex("#b39a70")],
    [0.9, hex("#f0e5c8")],
    [1, hex("#d9c7a0")],
  ];
  const polar = hex("#b9b3a4");

  /* Per-row band value, cached, then warped per pixel. */
  const rows = new Float32Array(height);
  for (let y = 0; y < height; y += 1) {
    const lat = y / height;
    rows[y] = fbm1(lat * 22 + 3.7, 4) * 0.7 + fbm1(lat * 70 + 11.3, 3) * 0.3;
  }

  for (let y = 0; y < height; y += 1) {
    const lat = y / height; // 0 = north pole, 1 = south pole
    const fromEq = Math.abs(lat - 0.5) * 2; // 0 equator → 1 pole
    const polarMix = Math.pow(fromEq, 5) * 0.6;
    for (let x = 0; x < width; x += 1) {
      const lon = x / width;
      /* warp latitude a touch with slow 2-D noise so bands wobble (seamless in x) */
      const warp = (fbm2(Math.cos(lon * Math.PI * 2) * 2 + 5, lat * 9, 3) - 0.5) * 0.012;
      const yy = Math.min(Math.max(Math.round((lat + warp) * height), 0), height - 1);
      let band = rows[yy];
      /* fine storm streaks along longitude */
      band += (noise2(x * 0.03, y * 0.6) - 0.5) * 0.035;
      const [r, g, b] = gradient(palette, band);
      const i = (y * width + x) * 4;
      let R = lerp(r, polar[0], polarMix);
      let G = lerp(g, polar[1], polarMix);
      let B = lerp(b, polar[2], polarMix);
      if (mono) R = G = B = luma(R, G, B);
      data[i] = R;
      data[i + 1] = G;
      data[i + 2] = B;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/* -------------------------------------------------------------- rings */
/** Radii in planet radii. Real proportions, so the divisions land where they should. */
export const RING_INNER = 1.11;
export const RING_OUTER = 2.35;

interface Band {
  from: number;
  to: number;
  alpha: number;
  color: RGB;
  grain: number;
}
const BANDS: Band[] = [
  { from: 1.11, to: 1.235, alpha: 0.1, color: hex("#8d867a"), grain: 0.3 }, // D ring
  { from: 1.235, to: 1.525, alpha: 0.42, color: hex("#a89f8f"), grain: 0.5 }, // C ring
  { from: 1.525, to: 1.95, alpha: 0.98, color: hex("#e2d6bd"), grain: 0.35 }, // B ring
  { from: 1.95, to: 2.025, alpha: 0.12, color: hex("#9b9284"), grain: 0.4 }, // Cassini division
  { from: 2.025, to: 2.27, alpha: 0.72, color: hex("#c9bda6"), grain: 0.45 }, // A ring
  { from: 2.27, to: 2.35, alpha: 0.0, color: hex("#c9bda6"), grain: 0 }, // gap before F
];
/* Narrow gaps inside the A ring. */
const GAPS: Array<[number, number, number]> = [
  [2.214, 2.219, 0.06], // Encke
  [2.263, 2.2655, 0.25], // Keeler
  [1.62, 1.626, 0.55], // a faint B-ring lane
  [1.72, 1.723, 0.6],
];
const F_RING = { at: 2.32, width: 0.0035, alpha: 0.55, color: hex("#e8e0cc") };

export function makeRingTexture(width = 2048, mono = false): HTMLCanvasElement {
  const height = 8;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(width, height);
  const data = img.data;

  for (let x = 0; x < width; x += 1) {
    const r = RING_INNER + (x / (width - 1)) * (RING_OUTER - RING_INNER);
    let alpha = 0;
    let color: RGB = [0, 0, 0];
    let grain = 0;
    for (const b of BANDS) {
      if (r >= b.from && r < b.to) {
        /* soften band edges so they don't look cut with scissors */
        const edge = Math.min(r - b.from, b.to - r) / 0.012;
        const soft = Math.min(edge, 1);
        alpha = b.alpha * (0.72 + 0.28 * soft);
        color = b.color;
        grain = b.grain;
        break;
      }
    }
    for (const [from, to, mul] of GAPS) {
      if (r >= from && r < to) alpha *= mul;
    }
    /* F ring: a thin bright thread outside the A ring */
    const fd = Math.abs(r - F_RING.at);
    if (fd < F_RING.width) {
      const k = 1 - fd / F_RING.width;
      alpha = Math.max(alpha, F_RING.alpha * k);
      color = F_RING.color;
    }
    /* grooves: two scales of 1-D noise modulate both alpha and brightness */
    const g = (fbm1(r * 420, 3) - 0.5) * grain + (fbm1(r * 2600 + 9, 2) - 0.5) * grain * 0.5;
    alpha = Math.min(Math.max(alpha * (1 + g * 0.9), 0), 1);
    const bright = 1 + g * 0.35;

    let R = Math.min(color[0] * bright, 255);
    let G = Math.min(color[1] * bright, 255);
    let B = Math.min(color[2] * bright, 255);
    if (mono) R = G = B = luma(R, G, B);
    for (let y = 0; y < height; y += 1) {
      const i = (y * width + x) * 4;
      data[i] = R;
      data[i + 1] = G;
      data[i + 2] = B;
      data[i + 3] = alpha * 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}
