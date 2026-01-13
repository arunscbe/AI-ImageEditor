import { normalizeToHex, colorKey, hexToLabVec } from "./colorQuantization";
// Fabric v6 uses class-based exports
import { Gradient } from "fabric";

// ===============================
// Promise detection helper
// ===============================
function isPromise(x) {
  return x && typeof x.then === "function";
}

// ===============================
// Fabric-specific helpers
// ===============================
export function collectAllObjects(root) {
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

export function getRoots(selectedObject) {
  if (!selectedObject) return [];
  if (selectedObject.getObjects && typeof selectedObject.getObjects === "function") {
    return selectedObject.getObjects();
  }
  return [selectedObject];
}

// ===============================
// Clone Fabric fill properly (handles gradients/patterns)
// ===============================
export function cloneFabricFill(fill) {
  if (!fill) return fill;

  // string fill
  if (typeof fill === "string") return fill;

  // gradient/pattern: prefer Fabric's toObject() if present
  if (typeof fill === "object") {
    if (typeof fill.toObject === "function") {
      return fill.toObject();
    }
    // fallback: structuredClone if available (better than JSON)
    try {
      return structuredClone(fill);
    } catch {
      return JSON.parse(JSON.stringify(fill));
    }
  }

  return fill;
}

// ===============================
// Enliven fill back into Fabric instance (handles gradients)
// Fabric v6: Gradient.fromObject is async and returns a Promise
// ===============================
export async function enlivenFillAsync(fillObj) {
  if (typeof fillObj === "string" || fillObj == null) return fillObj;

  const isGradient =
    fillObj &&
    typeof fillObj === "object" &&
    Array.isArray(fillObj.colorStops) &&
    fillObj.colorStops.length > 0;

  if (isGradient && Gradient?.fromObject) {
    try {
      const g = Gradient.fromObject(fillObj);
      return isPromise(g) ? await g : g;
    } catch (e) {
      console.error("Gradient enliven failed:", e);
      return fillObj;
    }
  }

  return fillObj;
}

// ===============================
// Store original colors in objects (for restoration)
// ===============================
export function storeOriginalColors(selectedObject) {
  if (!selectedObject) return;
  
  const roots = getRoots(selectedObject);
  
  roots.forEach((root) => {
    collectAllObjects(root).forEach((obj) => {
      // Store even if fill is falsy (empty string, null, undefined)
      if (obj.originalFill === undefined) {
        obj.originalFill = cloneFabricFill(obj.fill);
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

// ===============================
// Check if original colors are stored in the Fabric objects
// ===============================
export function hasOriginalColors(selectedObject) {
  if (!selectedObject) return false;
  
  const roots = getRoots(selectedObject);
  
  for (const root of roots) {
    const objects = collectAllObjects(root);
    for (const obj of objects) {
      if (obj.originalFill !== undefined || obj.originalStroke !== undefined) {
        return true;
      }
    }
  }
  
  return false;
}

// ===============================
// Restore original colors from stored references (proper Fabric restore)
// Async to handle Fabric v6 gradient promises
// ===============================
export async function restoreOriginalColors({ selectedObject, canvas }) {
  if (!selectedObject || !canvas) return;

  const roots = getRoots(selectedObject);
  const tasks = [];

  roots.forEach((root) => {
    collectAllObjects(root).forEach((obj) => {
      if (obj.originalFill !== undefined) {
        tasks.push(
          (async () => {
            const cloned =
              typeof structuredClone === "function"
                ? structuredClone(obj.originalFill)
                : obj.originalFill;

            const restored = await enlivenFillAsync(cloned);
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
// Palette extraction
// ===============================
export function extractPaletteFromSelection(selectedObject) {
  const roots = getRoots(selectedObject);
  if (roots.length === 0) return [];

  const colorMap = new Map(); // hex -> count

  const addHex = (hex) => {
    if (!hex) return;
    const k = colorKey(hex);
    if (!k || k === "none") return;
    colorMap.set(k, (colorMap.get(k) || 0) + 1);
  };

  const handleObj = (obj) => {
    // fill
    if (typeof obj.fill === "string") {
      addHex(normalizeToHex(obj.fill));
    } else if (obj.fill && typeof obj.fill === "object" && Array.isArray(obj.fill.colorStops)) {
      obj.fill.colorStops.forEach((stop) => addHex(normalizeToHex(stop?.color)));
    }

    // stroke
    if (typeof obj.stroke === "string") {
      addHex(normalizeToHex(obj.stroke));
    }
  };

  roots.forEach((root) => collectAllObjects(root).forEach(handleObj));

  return Array.from(colorMap.entries())
    .map(([hex, count]) => ({
      hex,
      count,
      lab: hexToLabVec(hex),
    }))
    .filter((c) => c.lab) // drop invalid conversions
    .sort((a, b) => b.count - a.count);
}

// ===============================
// Apply color map to Fabric objects (using original colors as reference)
// Async to handle Fabric v6 gradient promises
// ===============================
export async function applyColorMapToSelection({ selectedObject, canvas, colorMap, useOriginal = false }) {
  if (!selectedObject || !canvas || !colorMap || colorMap.size === 0) return;

  const roots = getRoots(selectedObject);
  const gradientTasks = [];

  const updateObj = async (obj) => {
    // fill (string)
    if (typeof obj.fill === "string") {
      // Fix: check !== undefined, not truthiness
      const hasOrigFill = useOriginal && obj.originalFill !== undefined;
      const referenceFill = hasOrigFill ? obj.originalFill : obj.fill;
      
      const h = normalizeToHex(referenceFill);
      // Fix: Don't recolor "no fill" (null, undefined, "none", transparent)
      if (!h) return;
      
      const to = colorMap.get(colorKey(h));
      if (to && colorKey(to) !== colorKey(h)) {
        obj.set("fill", to);
        obj.dirty = true;
      }
    } else if (obj.fill && typeof obj.fill === "object" && Array.isArray(obj.fill.colorStops)) {
      // Handle gradient fills
      const hasOrigFill = useOriginal && obj.originalFill !== undefined;
      const referenceFill = hasOrigFill ? obj.originalFill : obj.fill;
      
      const refStops = referenceFill?.colorStops;
      if (!Array.isArray(refStops) || refStops.length === 0) return;

      // Fix: Clone FROM reference, not current (prevents accumulation)
      const newStops = refStops.map((s) => ({ ...s }));

      let changed = false;
      newStops.forEach((stop) => {
        const h = normalizeToHex(stop?.color);
        if (!h) return;
        const to = colorMap.get(colorKey(h));
        if (to && colorKey(to) !== colorKey(h)) {
          stop.color = to;
          changed = true;
        }
      });

      if (changed) {
        // Fix: Use original gradient geometry when useOriginal=true (deterministic slider)
        const base =
          hasOrigFill && typeof obj.originalFill === "object"
            ? (typeof structuredClone === "function" ? structuredClone(obj.originalFill) : obj.originalFill)
            : (obj.fill?.toObject ? obj.fill.toObject() : { ...(obj.fill || {}) });

        base.colorStops = newStops;

        // Await gradient creation (Fabric v6 async)
        const maybe = Gradient?.fromObject ? Gradient.fromObject(base) : base;
        const enlivened = isPromise(maybe) ? await maybe : maybe;

        obj.set("fill", enlivened);
        obj.dirty = true;
      }
    }

    // stroke
    if (typeof obj.stroke === "string") {
      // Fix: check !== undefined, not truthiness
      const hasOrigStroke = useOriginal && obj.originalStroke !== undefined;
      const referenceStroke = hasOrigStroke ? obj.originalStroke : obj.stroke;
      
      const h = normalizeToHex(referenceStroke);
      // Fix: Don't recolor "no stroke"
      if (!h) return;
      
      const to = colorMap.get(colorKey(h));
      if (to && colorKey(to) !== colorKey(h)) {
        obj.set("stroke", to);
        obj.dirty = true;
      }
    }
  };

  // Process all objects and await any gradient updates
  for (const root of roots) {
    const objects = collectAllObjects(root);
    for (const obj of objects) {
      await updateObj(obj);
    }
    if (root.set) root.set('dirty', true);
  }

  // Mark the selected object as dirty and recalculate coordinates
  if (selectedObject.set) selectedObject.set('dirty', true);
  if (selectedObject.setCoords) selectedObject.setCoords();

  // Fabric best practice: requestRenderAll when possible
  if (typeof canvas.requestRenderAll === "function") canvas.requestRenderAll();
  else canvas.renderAll();
}

// ===============================
// Toggle visibility of objects with a specific color
// ===============================
export function applyColorVisibilityToSelection({ selectedObject, canvas, hideColorHex, shouldHide }) {
  if (!selectedObject || !canvas || !hideColorHex) return;

  const targetKey = colorKey(hideColorHex);
  const roots = getRoots(selectedObject);

  const updateObj = (obj) => {
    let hasTargetColor = false;

    // Check fill
    if (typeof obj.fill === "string") {
      const h = normalizeToHex(obj.fill);
      if (h && colorKey(h) === targetKey) {
        hasTargetColor = true;
      }
    } else if (obj.fill && typeof obj.fill === "object" && Array.isArray(obj.fill.colorStops)) {
      obj.fill.colorStops.forEach((stop) => {
        const h = normalizeToHex(stop?.color);
        if (h && colorKey(h) === targetKey) {
          hasTargetColor = true;
        }
      });
    }

    // Check stroke
    if (typeof obj.stroke === "string") {
      const h = normalizeToHex(obj.stroke);
      if (h && colorKey(h) === targetKey) {
        hasTargetColor = true;
      }
    }

    // Toggle visibility if this object has the target color
    if (hasTargetColor) {
      obj.set('visible', !shouldHide);
      obj.dirty = true;
    }
  };

  roots.forEach((root) => {
    collectAllObjects(root).forEach(updateObj);
    if (root.set) root.set('dirty', true);
  });

  // Mark the selected object as dirty and recalculate coordinates
  if (selectedObject.set) selectedObject.set('dirty', true);
  if (selectedObject.setCoords) selectedObject.setCoords();

  // Render
  if (typeof canvas.requestRenderAll === "function") canvas.requestRenderAll();
  else canvas.renderAll();
}

