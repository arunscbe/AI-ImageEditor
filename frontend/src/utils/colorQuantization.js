import { kmeans } from "ml-kmeans";
import { formatHex, converter } from "culori";

// culori converters
const toLab = converter("lab");
const toRgb = converter("rgb");

// ===============================
// Color helpers
// ===============================
export function normalizeToHex(color) {
  if (!color || typeof color !== "string") return null;

  const c = color.trim().toLowerCase();
  if (!c || c === "none" || c === "transparent") return null;

  // #rgb / #rrggbb
  if (c.startsWith("#")) {
    if (c.length === 4) {
      const r = c[1], g = c[2], b = c[3];
      return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }
    if (c.length === 7) return c.toLowerCase();
    return null;
  }

  // rgb/rgba
  const m = c.match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([01]?\.?\d+))?\s*\)/
  );
  if (m) {
    const r = Math.min(255, Math.max(0, parseInt(m[1], 10)));
    const g = Math.min(255, Math.max(0, parseInt(m[2], 10)));
    const b = Math.min(255, Math.max(0, parseInt(m[3], 10)));
    const a = m[4] == null ? 1 : Math.max(0, Math.min(1, parseFloat(m[4])));
    if (a === 0) return null;
    return (
      "#" +
      [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")
    ).toLowerCase();
  }

  return null; // ignore named colors etc. for now
}

export function colorKey(hex) {
  return String(hex || "").trim().toLowerCase();
}

export function hexToRgbObj(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

// perceptual: Lab in culori is { mode:'lab', l,a,b, alpha? }
export function hexToLabVec(hex) {
  const rgb = toRgb(hex);
  if (!rgb) return null;
  const lab = toLab(rgb);
  if (!lab) return null;

  const v = [lab.l, lab.a, lab.b];
  if (v.some((x) => typeof x !== "number" || Number.isNaN(x))) return null;
  return v;
}

export function labVecToHex(vec) {
  const [l, a, b] = vec;
  const rgb = toRgb({ mode: "lab", l, a, b });
  if (!rgb) return null;
  return formatHex(rgb).toLowerCase();
}

// squared Euclidean in Lab (good enough; better than RGB)
export function distLabSq(v1, v2) {
  if (!Array.isArray(v1) || v1.length < 3) return Number.POSITIVE_INFINITY;
  if (!Array.isArray(v2) || v2.length < 3) return Number.POSITIVE_INFINITY;

  const dl = v1[0] - v2[0];
  const da = v1[1] - v2[1];
  const db = v1[2] - v2[2];
  return dl * dl + da * da + db * db;
}

// ===============================
// Quantization core (Recraft-like slider)
// ===============================
/**
 * Quantize colors to K using weighted k-means in Lab.
 * Returns map: originalHex -> quantizedHex
 *
 * If lockedPaletteHexes is provided and length>0:
 *   - We do a "nearest locked color" assignment (brand palette enforcement).
 *   - This is closer to "apply palette" mode.
 */
export function buildQuantizationMap(palette, k, lockedPaletteHexes = []) {
  // ---- Guards ----
  if (!Array.isArray(palette) || palette.length === 0) return new Map();

  const unique = palette.filter((c) => Array.isArray(c?.lab) && c.lab.length >= 3);
  if (unique.length === 0) return new Map();

  const K = Math.max(1, Math.min(Number(k) || 1, unique.length));

  // ---- Locked palette mode: snap to nearest locked color ----
  const lockedLabs = (lockedPaletteHexes || [])
    .map((h) => colorKey(h))
    .filter(Boolean)
    .map((h) => ({ hex: h, lab: hexToLabVec(h) }))
    .filter((x) => Array.isArray(x.lab) && x.lab.length >= 3);

  if (lockedLabs.length > 0) {
    const map = new Map();
    for (const c of unique) {
      let best = lockedLabs[0];
      let bestD = distLabSq(c.lab, best.lab);
      for (let i = 1; i < lockedLabs.length; i++) {
        const d = distLabSq(c.lab, lockedLabs[i].lab);
        if (d < bestD) {
          bestD = d;
          best = lockedLabs[i];
        }
      }
      map.set(colorKey(c.hex), best.hex);
    }
    return map;
  }

  // ---- Build weighted sample set (approx weighted kmeans) ----
  const MAX_REPL = 30;
  const data = [];
  for (const c of unique) {
    const count = Number(c.count) || 1;
    const reps = Math.max(1, Math.min(MAX_REPL, Math.round(Math.sqrt(count))));
    for (let i = 0; i < reps; i++) data.push(c.lab);
  }

  const cleanData = data.filter((v) => Array.isArray(v) && v.length >= 3);
  if (cleanData.length <= K) {
    // not enough samples to cluster
    const map = new Map();
    unique.forEach((c) => map.set(colorKey(c.hex), colorKey(c.hex)));
    return map;
  }

  // ---- Run kmeans (IMPORTANT: use cleanData + K) ----
  let km;
  try {
    km = kmeans(cleanData, K, { initialization: "kmeans++", maxIterations: 100 });
  } catch (e) {
    const map = new Map();
    unique.forEach((c) => map.set(colorKey(c.hex), colorKey(c.hex)));
    return map;
  }

  // ---- Parse centroids for both API shapes ----
  const centroids = (km?.centroids || [])
    .map((c) => (Array.isArray(c) ? c : c?.centroid))
    .filter((v) => Array.isArray(v) && v.length >= 3);

  if (centroids.length === 0) {
    const map = new Map();
    unique.forEach((c) => map.set(colorKey(c.hex), colorKey(c.hex)));
    return map;
  }

  // ---- Snap each centroid to nearest EXISTING palette color (stable output) ----
  const centroidToHex = centroids.map((cent) => {
    let best = unique[0];
    let bestD = distLabSq(cent, best.lab);
    for (let i = 1; i < unique.length; i++) {
      const d = distLabSq(cent, unique[i].lab);
      if (d < bestD) {
        bestD = d;
        best = unique[i];
      }
    }
    return colorKey(best.hex);
  });

  // ---- Map each original unique color to nearest centroid (then to snapped hex) ----
  const map = new Map();
  for (const c of unique) {
    let bestIdx = 0;
    let bestD = distLabSq(c.lab, centroids[0]);
    for (let i = 1; i < centroids.length; i++) {
      const d = distLabSq(c.lab, centroids[i]);
      if (d < bestD) {
        bestD = d;
        bestIdx = i;
      }
    }
    map.set(colorKey(c.hex), centroidToHex[bestIdx]);
  }

  return map;
}

