/**
 * FabricColorManager - Bundled color utilities for Fabric.js projects
 * 
 * A production-ready, frozen module combining color quantization and Fabric.js
 * color manipulation utilities. Designed to be portable across projects.
 * 
 * @version 1.0.0
 * @license MIT
 */

import { kmeans } from "ml-kmeans";
import { formatHex, converter } from "culori";
import { Gradient } from "fabric";

// ===============================
// Color Quantization Engine
// ===============================
class ColorQuantizer {
  constructor() {
    this.toLab = converter("lab");
    this.toRgb = converter("rgb");
  }

  /**
   * Normalize any color string to lowercase hex (#rrggbb)
   */
  normalizeToHex(color) {
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

    return null;
  }

  /**
   * Create a consistent color key for map lookups
   */
  colorKey(hex) {
    return String(hex || "").trim().toLowerCase();
  }

  /**
   * Convert hex to RGB object {r, g, b}
   */
  hexToRgbObj(hex) {
    return {
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16),
    };
  }

  /**
   * Convert hex to Lab color space [L, a, b]
   */
  hexToLabVec(hex) {
    const rgb = this.toRgb(hex);
    if (!rgb) return null;
    const lab = this.toLab(rgb);
    if (!lab) return null;

    const v = [lab.l, lab.a, lab.b];
    if (v.some((x) => typeof x !== "number" || Number.isNaN(x))) return null;
    return v;
  }

  /**
   * Convert Lab vector back to hex
   */
  labVecToHex(vec) {
    const [l, a, b] = vec;
    const rgb = this.toRgb({ mode: "lab", l, a, b });
    if (!rgb) return null;
    return formatHex(rgb).toLowerCase();
  }

  /**
   * Squared Euclidean distance in Lab space
   */
  distLabSq(v1, v2) {
    if (!Array.isArray(v1) || v1.length < 3) return Number.POSITIVE_INFINITY;
    if (!Array.isArray(v2) || v2.length < 3) return Number.POSITIVE_INFINITY;

    const dl = v1[0] - v2[0];
    const da = v1[1] - v2[1];
    const db = v1[2] - v2[2];
    return dl * dl + da * da + db * db;
  }

  /**
   * Build quantization map using k-means clustering in Lab space
   * 
   * @param {Array} palette - Array of {hex, count, lab} objects
   * @param {number} k - Number of colors to quantize to
   * @param {Array} lockedPaletteHexes - Optional locked colors to snap to
   * @returns {Map} originalHex -> quantizedHex
   */
  buildQuantizationMap(palette, k, lockedPaletteHexes = []) {
    if (!Array.isArray(palette) || palette.length === 0) return new Map();

    const unique = palette.filter((c) => Array.isArray(c?.lab) && c.lab.length >= 3);
    if (unique.length === 0) return new Map();

    // Sort by lightness (darkest first) to prioritize dark colors
    unique.sort((a, b) => a.lab[0] - b.lab[0]);

    const K = Math.max(1, Math.min(Number(k) || 1, unique.length));

    // Locked palette mode: snap to nearest locked color
    const lockedLabs = (lockedPaletteHexes || [])
      .map((h) => this.colorKey(h))
      .filter(Boolean)
      .map((h) => ({ hex: h, lab: this.hexToLabVec(h) }))
      .filter((x) => Array.isArray(x.lab) && x.lab.length >= 3);

    if (lockedLabs.length > 0) {
      const map = new Map();
      for (const c of unique) {
        let best = lockedLabs[0];
        let bestD = this.distLabSq(c.lab, best.lab);
        for (let i = 1; i < lockedLabs.length; i++) {
          const d = this.distLabSq(c.lab, lockedLabs[i].lab);
          if (d < bestD) {
            bestD = d;
            best = lockedLabs[i];
          }
        }
        map.set(this.colorKey(c.hex), best.hex);
      }
      return map;
    }

    // Build weighted sample set (log-based to avoid dominance)
    const MAX_REPL = 50;
    const data = [];
    for (const c of unique) {
      const count = Number(c.count) || 1;
      // Use log scaling to prevent huge areas from saturating
      const reps = Math.max(1, Math.min(MAX_REPL, Math.round(Math.log1p(count))));
      for (let i = 0; i < reps; i++) data.push(c.lab);
    }

    const cleanData = data.filter((v) => Array.isArray(v) && v.length >= 3);
    if (cleanData.length <= K) {
      const map = new Map();
      unique.forEach((c) => map.set(this.colorKey(c.hex), this.colorKey(c.hex)));
      return map;
    }

    // Run k-means
    let km;
    try {
      km = kmeans(cleanData, K, { initialization: "kmeans++", maxIterations: 100 });
    } catch (e) {
      const map = new Map();
      unique.forEach((c) => map.set(this.colorKey(c.hex), this.colorKey(c.hex)));
      return map;
    }

    // Parse centroids
    const centroids = (km?.centroids || [])
      .map((c) => (Array.isArray(c) ? c : c?.centroid))
      .filter((v) => Array.isArray(v) && v.length >= 3);

    if (centroids.length === 0) {
      const map = new Map();
      unique.forEach((c) => map.set(this.colorKey(c.hex), this.colorKey(c.hex)));
      return map;
    }

    // Snap each centroid to nearest existing palette color
    const centroidToHex = centroids.map((cent) => {
      let best = unique[0];
      let bestD = this.distLabSq(cent, best.lab);
      
      // Prefer darker colors when distances are similar (visual hierarchy)
      // Threshold in squared Lab units: 10 Lab units = 100 squared
      const DARKNESS_THRESHOLD_SQ = 100; // ~10 Lab units
      
      for (let i = 1; i < unique.length; i++) {
        const d = this.distLabSq(cent, unique[i].lab);
        
        // If this color is closer, pick it
        if (d < bestD) {
          bestD = d;
          best = unique[i];
        }
        // If distances are similar (within threshold), prefer darker color (lower L)
        else if (Math.abs(d - bestD) < DARKNESS_THRESHOLD_SQ) {
          const currentL = unique[i].lab[0]; // Lightness (0=black, 100=white)
          const bestL = best.lab[0];
          if (currentL < bestL) {
            // This color is darker, prefer it (DON'T update bestD)
            best = unique[i];
          }
        }
      }
      return this.colorKey(best.hex);
    });

    // Map each color to nearest centroid and calculate cluster weights
    const clusterWeights = new Array(centroids.length).fill(0);
    const assignments = [];
    
    for (const c of unique) {
      let bestIdx = 0;
      let bestD = this.distLabSq(c.lab, centroids[0]);
      for (let i = 1; i < centroids.length; i++) {
        const d = this.distLabSq(c.lab, centroids[i]);
        if (d < bestD) {
          bestD = d;
          bestIdx = i;
        }
      }
      assignments.push({ color: c, clusterIdx: bestIdx });
      clusterWeights[bestIdx] += c.count;
    }

    // Prune tiny clusters (< 1% of total weight)
    const totalWeight = clusterWeights.reduce((sum, w) => sum + w, 0);
    const PRUNE_THRESHOLD = 0.01; // 1% threshold
    const minWeight = totalWeight * PRUNE_THRESHOLD;

    // Build merge map for tiny clusters
    const clusterMergeMap = new Map();
    for (let i = 0; i < centroids.length; i++) {
      if (clusterWeights[i] < minWeight && clusterWeights[i] > 0) {
        // Find nearest larger cluster
        let bestIdx = -1;
        let bestD = Infinity;
        for (let j = 0; j < centroids.length; j++) {
          if (i !== j && clusterWeights[j] >= minWeight) {
            const d = this.distLabSq(centroids[i], centroids[j]);
            if (d < bestD) {
              bestD = d;
              bestIdx = j;
            }
          }
        }
        if (bestIdx !== -1) {
          clusterMergeMap.set(i, bestIdx);
        }
      }
    }

    // Build final map with pruning applied
    const map = new Map();
    for (const { color, clusterIdx } of assignments) {
      const finalIdx = clusterMergeMap.get(clusterIdx) ?? clusterIdx;
      map.set(this.colorKey(color.hex), centroidToHex[finalIdx]);
    }

    return map;
  }
}

// ===============================
// Fabric.js Color Manager
// ===============================
class FabricColorManager {
  constructor() {
    this.quantizer = new ColorQuantizer();
  }

  // Expose quantizer methods at top level for convenience
  normalizeToHex = (color) => this.quantizer.normalizeToHex(color);
  colorKey = (hex) => this.quantizer.colorKey(hex);
  hexToLabVec = (hex) => this.quantizer.hexToLabVec(hex);
  hexToRgbObj = (hex) => this.quantizer.hexToRgbObj(hex);
  labVecToHex = (vec) => this.quantizer.labVecToHex(vec);
  distLabSq = (v1, v2) => this.quantizer.distLabSq(v1, v2);
  buildQuantizationMap = (palette, k, locked) => 
    this.quantizer.buildQuantizationMap(palette, k, locked);

  // ===============================
  // Fabric Object Utilities
  // ===============================

  /**
   * Check if value is a Promise
   */
  isPromise(x) {
    return x && typeof x.then === "function";
  }

  /**
   * Recursively collect all Fabric objects
   */
  collectAllObjects(root) {
    const out = [];
    const visit = (obj) => {
      if (!obj) return;
      out.push(obj);
      if (obj.getObjects && typeof obj.getObjects === "function") {
        obj.getObjects().forEach(visit);
      }
    };
    visit(root);
    return out;
  }

  /**
   * Get root objects from selection
   */
  getRoots(selectedObject) {
    if (!selectedObject) return [];
    if (selectedObject.getObjects && typeof selectedObject.getObjects === "function") {
      return selectedObject.getObjects();
    }
    return [selectedObject];
  }

  /**
   * Clone Fabric fill (handles gradients/patterns)
   */
  cloneFabricFill(fill) {
    if (!fill) return fill;
    if (typeof fill === "string") return fill;

    if (typeof fill === "object") {
      if (typeof fill.toObject === "function") {
        return fill.toObject();
      }
      try {
        return structuredClone(fill);
      } catch {
        return JSON.parse(JSON.stringify(fill));
      }
    }

    return fill;
  }

  /**
   * Enliven fill back into Fabric instance (async for Fabric v6 gradients)
   */
  async enlivenFillAsync(fillObj) {
    if (typeof fillObj === "string" || fillObj == null) return fillObj;

    const isGradient =
      fillObj &&
      typeof fillObj === "object" &&
      Array.isArray(fillObj.colorStops) &&
      fillObj.colorStops.length > 0;

    if (isGradient && Gradient?.fromObject) {
      try {
        const g = Gradient.fromObject(fillObj);
        return this.isPromise(g) ? await g : g;
      } catch (e) {
        console.error("Gradient enliven failed:", e);
        return fillObj;
      }
    }

    return fillObj;
  }

  // ===============================
  // Color Storage & Restoration
  // ===============================

  /**
   * Store original colors in objects for restoration
   */
  storeOriginalColors(selectedObject) {
    if (!selectedObject) return;
    
    const roots = this.getRoots(selectedObject);
    
    roots.forEach((root) => {
      this.collectAllObjects(root).forEach((obj) => {
        if (obj.originalFill === undefined) {
          obj.originalFill = this.cloneFabricFill(obj.fill);
        }
        if (obj.originalStroke === undefined) {
          obj.originalStroke = obj.stroke;
        }
        if (obj.originalVisible === undefined) {
          obj.originalVisible = obj.visible;
        }
      });
    });
  }

  /**
   * Check if original colors are stored
   */
  hasOriginalColors(selectedObject) {
    if (!selectedObject) return false;
    
    const roots = this.getRoots(selectedObject);
    
    for (const root of roots) {
      const objects = this.collectAllObjects(root);
      for (const obj of objects) {
        if (obj.originalFill !== undefined || obj.originalStroke !== undefined) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Restore original colors (async for Fabric v6 gradients)
   */
  async restoreOriginalColors({ selectedObject, canvas }) {
    if (!selectedObject || !canvas) return;

    const roots = this.getRoots(selectedObject);
    const tasks = [];

    roots.forEach((root) => {
      this.collectAllObjects(root).forEach((obj) => {
        if (obj.originalFill !== undefined) {
          tasks.push(
            (async () => {
              const cloned =
                typeof structuredClone === "function"
                  ? structuredClone(obj.originalFill)
                  : obj.originalFill;

              const restored = await this.enlivenFillAsync(cloned);
              obj.set("fill", restored);
            })()
          );
        }

        if (obj.originalStroke !== undefined) obj.set("stroke", obj.originalStroke);
        if (obj.originalVisible !== undefined) obj.set("visible", obj.originalVisible);

        obj.dirty = true;
      });
      if (root.set) root.set("dirty", true);
    });

    await Promise.all(tasks);

    selectedObject.set?.("dirty", true);
    selectedObject.setCoords?.();

    canvas.requestRenderAll?.() ?? canvas.renderAll();
  }

  // ===============================
  // Palette Extraction
  // ===============================

  /**
   * Extract color palette from Fabric selection (area-weighted)
   */
  extractPaletteFromSelection(selectedObject) {
    const roots = this.getRoots(selectedObject);
    if (roots.length === 0) return [];

    const colorMap = new Map();

    const addHex = (hex, weight = 1) => {
      if (!hex) return;
      const k = this.colorKey(hex);
      if (!k || k === "none") return;
      colorMap.set(k, (colorMap.get(k) || 0) + weight);
    };

    const handleObj = (obj) => {
      // Calculate area weight (bounding box area as proxy)
      const rect = obj.getBoundingRect?.(true, true);
      const area = rect ? Math.max(1, rect.width * rect.height) : 1;

      // fill
      if (typeof obj.fill === "string") {
        addHex(this.normalizeToHex(obj.fill), area);
      } else if (obj.fill && typeof obj.fill === "object" && Array.isArray(obj.fill.colorStops)) {
        // Distribute area weight across gradient stops
        const stops = obj.fill.colorStops;
        if (stops.length > 0) {
          // Weight by offset span (better than equal distribution)
          for (let i = 0; i < stops.length; i++) {
            const currentOffset = stops[i].offset || 0;
            const prevOffset = i > 0 ? (stops[i - 1].offset || 0) : 0;
            const nextOffset = i < stops.length - 1 ? (stops[i + 1].offset || 1) : 1;
            const span = (nextOffset - prevOffset) / 2;
            const stopWeight = area * span;
            addHex(this.normalizeToHex(stops[i]?.color), stopWeight);
          }
        }
      }

      // stroke (usually thin, so reduce weight)
      if (typeof obj.stroke === "string") {
        const strokeWeight = obj.strokeWidth ? area * (obj.strokeWidth / 100) : area * 0.1;
        addHex(this.normalizeToHex(obj.stroke), strokeWeight);
      }
    };

    roots.forEach((root) => this.collectAllObjects(root).forEach(handleObj));

    return Array.from(colorMap.entries())
      .map(([hex, count]) => ({
        hex,
        count,
        lab: this.hexToLabVec(hex),
      }))
      .filter((c) => c.lab)
      .sort((a, b) => b.count - a.count);
  }

  // ===============================
  // Gradient Flattening
  // ===============================

  /**
   * Flatten all gradients to solid colors (pick first color stop)
   * Call this before quantization for cleaner results
   */
  flattenGradientsToSolid({ selectedObject, canvas }) {
    if (!selectedObject || !canvas) return;

    const roots = this.getRoots(selectedObject);

    roots.forEach((root) => {
      this.collectAllObjects(root).forEach((obj) => {
        // Flatten gradient fills
        if (obj.fill && typeof obj.fill === "object" && Array.isArray(obj.fill.colorStops)) {
          const stops = obj.fill.colorStops;
          if (stops.length > 0) {
            // Use first color stop as representative color
            const firstColor = stops[0].color || "#000000";
            obj.set("fill", firstColor);
            obj.dirty = true;
          }
        }

        // Flatten gradient strokes (rare but possible)
        if (obj.stroke && typeof obj.stroke === "object" && Array.isArray(obj.stroke.colorStops)) {
          const stops = obj.stroke.colorStops;
          if (stops.length > 0) {
            const firstColor = stops[0].color || "#000000";
            obj.set("stroke", firstColor);
            obj.dirty = true;
          }
        }
      });
      if (root.set) root.set("dirty", true);
    });

    if (selectedObject.set) selectedObject.set("dirty", true);
    if (selectedObject.setCoords) selectedObject.setCoords();

    if (typeof canvas.requestRenderAll === "function") canvas.requestRenderAll();
    else canvas.renderAll();
  }

  // ===============================
  // Color Application
  // ===============================

  /**
   * Apply color map to Fabric objects (async for gradients)
   */
  async applyColorMapToSelection({ selectedObject, canvas, colorMap, useOriginal = false }) {
    if (!selectedObject || !canvas || !colorMap || colorMap.size === 0) return;

    const roots = this.getRoots(selectedObject);

    const updateObj = async (obj) => {
      // Handle string fill
      if (typeof obj.fill === "string") {
        const hasOrigFill = useOriginal && obj.originalFill !== undefined;
        const referenceFill = hasOrigFill ? obj.originalFill : obj.fill;
        
        const h = this.normalizeToHex(referenceFill);
        if (!h) return;
        
        const to = colorMap.get(this.colorKey(h));
        if (to && this.colorKey(to) !== this.colorKey(h)) {
          obj.set("fill", to);
          obj.dirty = true;
        }
      } else if (obj.fill && typeof obj.fill === "object" && Array.isArray(obj.fill.colorStops)) {
        // Handle gradient fills
        const hasOrigFill = useOriginal && obj.originalFill !== undefined;
        const referenceFill = hasOrigFill ? obj.originalFill : obj.fill;
        
        const refStops = referenceFill?.colorStops;
        if (!Array.isArray(refStops) || refStops.length === 0) return;

        const newStops = refStops.map((s) => ({ ...s }));

        let changed = false;
        newStops.forEach((stop) => {
          const h = this.normalizeToHex(stop?.color);
          if (!h) return;
          const to = colorMap.get(this.colorKey(h));
          if (to && this.colorKey(to) !== this.colorKey(h)) {
            stop.color = to;
            changed = true;
          }
        });

        if (changed) {
          const base =
            hasOrigFill && typeof obj.originalFill === "object"
              ? (typeof structuredClone === "function" ? structuredClone(obj.originalFill) : obj.originalFill)
              : (obj.fill?.toObject ? obj.fill.toObject() : { ...(obj.fill || {}) });

          base.colorStops = newStops;

          const maybe = Gradient?.fromObject ? Gradient.fromObject(base) : base;
          const enlivened = this.isPromise(maybe) ? await maybe : maybe;

          obj.set("fill", enlivened);
          obj.dirty = true;
        }
      }

      // Handle stroke
      if (typeof obj.stroke === "string") {
        const hasOrigStroke = useOriginal && obj.originalStroke !== undefined;
        const referenceStroke = hasOrigStroke ? obj.originalStroke : obj.stroke;
        
        const h = this.normalizeToHex(referenceStroke);
        if (!h) return;
        
        const to = colorMap.get(this.colorKey(h));
        if (to && this.colorKey(to) !== this.colorKey(h)) {
          obj.set("stroke", to);
          obj.dirty = true;
        }
      }
    };

    for (const root of roots) {
      const objects = this.collectAllObjects(root);
      for (const obj of objects) {
        await updateObj(obj);
      }
      if (root.set) root.set('dirty', true);
    }

    if (selectedObject.set) selectedObject.set('dirty', true);
    if (selectedObject.setCoords) selectedObject.setCoords();

    if (typeof canvas.requestRenderAll === "function") canvas.requestRenderAll();
    else canvas.renderAll();
  }

  /**
   * Toggle visibility of objects with specific color
   */
  applyColorVisibilityToSelection({ selectedObject, canvas, hideColorHex, shouldHide }) {
    if (!selectedObject || !canvas || !hideColorHex) return;

    const targetKey = this.colorKey(hideColorHex);
    const roots = this.getRoots(selectedObject);

    const updateObj = (obj) => {
      let hasTargetColor = false;

      // Check fill
      if (typeof obj.fill === "string") {
        const h = this.normalizeToHex(obj.fill);
        if (h && this.colorKey(h) === targetKey) {
          hasTargetColor = true;
        }
      } else if (obj.fill && typeof obj.fill === "object" && Array.isArray(obj.fill.colorStops)) {
        obj.fill.colorStops.forEach((stop) => {
          const h = this.normalizeToHex(stop?.color);
          if (h && this.colorKey(h) === targetKey) {
            hasTargetColor = true;
          }
        });
      }

      // Check stroke
      if (typeof obj.stroke === "string") {
        const h = this.normalizeToHex(obj.stroke);
        if (h && this.colorKey(h) === targetKey) {
          hasTargetColor = true;
        }
      }

      if (hasTargetColor) {
        obj.set('visible', !shouldHide);
        obj.dirty = true;
      }
    };

    roots.forEach((root) => {
      this.collectAllObjects(root).forEach(updateObj);
      if (root.set) root.set('dirty', true);
    });

    if (selectedObject.set) selectedObject.set('dirty', true);
    if (selectedObject.setCoords) selectedObject.setCoords();

    if (typeof canvas.requestRenderAll === "function") canvas.requestRenderAll();
    else canvas.renderAll();
  }
}

// ===============================
// Singleton Export (convenient for most use cases)
// ===============================
const fabricColorManager = new FabricColorManager();

export default fabricColorManager;

// ===============================
// Named Exports (for advanced usage)
// ===============================
export { FabricColorManager, ColorQuantizer };

// ===============================
// Backward Compatibility Exports (with proper binding)
// ===============================
export const normalizeToHex = (color) => fabricColorManager.normalizeToHex(color);
export const colorKey = (hex) => fabricColorManager.colorKey(hex);
export const hexToLabVec = (hex) => fabricColorManager.hexToLabVec(hex);
export const hexToRgbObj = (hex) => fabricColorManager.hexToRgbObj(hex);
export const labVecToHex = (vec) => fabricColorManager.labVecToHex(vec);
export const distLabSq = (v1, v2) => fabricColorManager.distLabSq(v1, v2);
export const buildQuantizationMap = (palette, k, locked) => fabricColorManager.buildQuantizationMap(palette, k, locked);
export const collectAllObjects = (root) => fabricColorManager.collectAllObjects(root);
export const getRoots = (selectedObject) => fabricColorManager.getRoots(selectedObject);
export const cloneFabricFill = (fill) => fabricColorManager.cloneFabricFill(fill);
export const enlivenFillAsync = (fillObj) => fabricColorManager.enlivenFillAsync(fillObj);
export const storeOriginalColors = (selectedObject) => fabricColorManager.storeOriginalColors(selectedObject);
export const hasOriginalColors = (selectedObject) => fabricColorManager.hasOriginalColors(selectedObject);
export const restoreOriginalColors = (opts) => fabricColorManager.restoreOriginalColors(opts);
export const extractPaletteFromSelection = (selectedObject) => fabricColorManager.extractPaletteFromSelection(selectedObject);
export const applyColorMapToSelection = (opts) => fabricColorManager.applyColorMapToSelection(opts);
export const applyColorVisibilityToSelection = (opts) => fabricColorManager.applyColorVisibilityToSelection(opts);
export const flattenGradientsToSolid = (opts) => fabricColorManager.flattenGradientsToSolid(opts);

