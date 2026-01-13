import React, { useEffect, useCallback, useMemo, useRef, useState } from "react";
import useStore from "../store/useStore";
import {
  colorKey,
  buildQuantizationMap,
  extractPaletteFromSelection,
  applyColorMapToSelection,
  storeOriginalColors,
  hasOriginalColors,
  restoreOriginalColors,
  flattenGradientsToSolid,
  hexToLabVec,
  distLabSq,
} from "../utils/FabricColorManager";
import brandColorsData from "../assets/brand_colors.json";
import Button from "./ui/Button";

const TRANSPARENT_RGBA = "rgba(0,0,0,0)";

// Parse brand colors
const BRAND_COLORS = brandColorsData.map(bc => ({
  name: bc.name,
  hex: bc.hexvalue.toLowerCase(),
  lab: hexToLabVec(bc.hexvalue)
})).filter(bc => bc.lab);

// ===============================
// Helper: Match color to brand name
// ===============================
function getColorName(hex) {
  const normalized = colorKey(hex);
  if (!normalized) return hex;
  
  // Try exact match first
  const exactMatch = BRAND_COLORS.find(bc => bc.hex === normalized);
  if (exactMatch) return exactMatch.name;
  
  // Try close match (within 8 Lab units = 64 squared)
  const lab = hexToLabVec(normalized);
  if (!lab) return hex;
  
  const MATCH_THRESHOLD = 64; // ~8 Lab units squared
  let bestMatch = null;
  let bestDist = Infinity;
  
  for (const bc of BRAND_COLORS) {
    const dist = distLabSq(lab, bc.lab);
    if (dist < MATCH_THRESHOLD && dist < bestDist) {
      bestDist = dist;
      bestMatch = bc;
    }
  }
  
  return bestMatch ? bestMatch.name : hex;
}

// ===============================
// Component
// ===============================
export default function SVGColorPalette({ selectedObject }) {
  const { canvas } = useStore();

  const [palette, setPalette] = useState([]);
  const [originalPalette, setOriginalPalette] = useState([]);
  const [originalPaletteSize, setOriginalPaletteSize] = useState(0);
  const [targetColorCount, setTargetColorCount] = useState(12);
  const [lockedColors, setLockedColors] = useState([]);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [draggedColor, setDraggedColor] = useState(null);
  const [dropTargetColor, setDropTargetColor] = useState(null);
  const [showBrandPicker, setShowBrandPicker] = useState(null); // hex of color being changed

  const inputRefs = useRef(new Map());

  // Check if originals are stored in Fabric objects
  const originalsStored = useMemo(
    () => hasOriginalColors(selectedObject),
    [selectedObject, palette, updateTrigger]
  );

  const refreshPalette = useCallback(() => {
    if (!selectedObject) return [];
    return extractPaletteFromSelection(selectedObject);
  }, [selectedObject]);

  // Extract palette when selection changes
  useEffect(() => {
    if (!selectedObject) {
      setPalette([]);
      setOriginalPalette([]);
      setOriginalPaletteSize(0);
      return;
    }
    try {
      const p = refreshPalette();
      setPalette(p);
      // Store original palette (frozen for quantization reference)
      setOriginalPalette(p);
      setOriginalPaletteSize(p.length);
      setTargetColorCount((v) => Math.min(Math.max(1, v), Math.max(1, p.length)));
    } catch (e) {
      console.error("Palette extract failed:", e);
      setPalette([]);
      setOriginalPalette([]);
      setOriginalPaletteSize(0);
    }
  }, [selectedObject, refreshPalette]);

  // Use original palette size as max (frozen, doesn't shrink after quantization)
  const sliderMax = Math.max(1, originalPaletteSize);
  const sliderValue = Math.max(1, Math.min(targetColorCount, sliderMax));

  // Manual color change (from color picker)
  const applyColorChange = useCallback(
    async (fromHex, toHexOrTransparent) => {
      if (!selectedObject || !canvas) return;

      const from = colorKey(fromHex);
      if (!from) return;

      const to =
        toHexOrTransparent === TRANSPARENT_RGBA
          ? TRANSPARENT_RGBA
          : colorKey(toHexOrTransparent) || null;

      if (!to) return;

      const map = new Map();
      map.set(from, to);
      await applyColorMapToSelection({ selectedObject, canvas, colorMap: map });
      const updatedPalette = refreshPalette();
      setPalette(updatedPalette);
      // Preserve original palette size (don't let it shrink)
      setOriginalPaletteSize((prev) => Math.max(prev, updatedPalette.length));
    },
    [selectedObject, canvas, refreshPalette]
  );

  // Quantize colors using k-means
  const handleApplyQuantize = useCallback(async () => {
    if (!selectedObject || !canvas) return;
    if (!originalPalette || originalPalette.length === 0) return;

    // Store original colors on first application
    if (!hasOriginalColors(selectedObject)) {
      storeOriginalColors(selectedObject);
    }

    const k = sliderValue;

    // STEP 1: Flatten gradients to solid colors first (cleaner quantization)
    flattenGradientsToSolid({ selectedObject, canvas });

    // STEP 2: Extract palette after flattening (no more gradients)
    const flattenedPalette = refreshPalette();

    // STEP 3: Build quantization map from flattened palette
    // Always use locked colors if available (brand colors as default behavior)
    const map = buildQuantizationMap(
      flattenedPalette,
      k,
      lockedColors.length > 0 ? lockedColors : []
    );

    // STEP 4: Apply quantization to the flattened colors
    await applyColorMapToSelection({
      selectedObject,
      canvas,
      colorMap: map,
      useOriginal: false, // Already flattened, work from current state
    });

    // STEP 5: Refresh palette to show final quantized colors
    const newPalette = refreshPalette();
    setPalette(newPalette);

    // Keep slider max frozen at original palette size (don't shrink)
  }, [selectedObject, canvas, originalPalette, sliderValue, lockedColors, refreshPalette]);

  // Toggle locked color for brand palette
  const toggleLockedColor = useCallback((hex) => {
    const h = colorKey(hex);
    if (!h) return;
    setLockedColors((prev) => {
      const s = new Set(prev.map(colorKey));
      if (s.has(h)) s.delete(h);
      else s.add(h);
      return Array.from(s);
    });
  }, []);

  // Handle brand color selection from picker
  const handleBrandColorSelect = useCallback(
    async (fromHex, toHex) => {
      if (!selectedObject || !canvas) return;
      await applyColorChange(fromHex, toHex);
      setShowBrandPicker(null);
    },
    [selectedObject, canvas, applyColorChange]
  );

  // Handle color box click - open brand picker
  const handleColorClick = useCallback((hex) => {
    setShowBrandPicker(hex);
  }, []);

  // Reset colors to originals
  const handleResetColors = useCallback(async () => {
    if (!selectedObject || !canvas) return;

    await restoreOriginalColors({ selectedObject, canvas });
    const restoredPalette = refreshPalette();
    setPalette(restoredPalette);
    // Restore original palette and size
    setOriginalPalette(restoredPalette);
    setOriginalPaletteSize(restoredPalette.length);
    setUpdateTrigger((prev) => prev + 1);
  }, [selectedObject, canvas, refreshPalette]);

  // Drag and drop handlers
  const handleDragStart = useCallback((e, color) => {
    e.dataTransfer.effectAllowed = "move";
    setDraggedColor(color.hex);
  }, []);

  const handleDragOver = useCallback((e, color) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTargetColor(color.hex);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDropTargetColor(null);
  }, []);

  const handleDrop = useCallback(
    (e, targetColor) => {
      e.preventDefault();
      if (!draggedColor || !targetColor.hex || draggedColor === targetColor.hex) {
        setDraggedColor(null);
        setDropTargetColor(null);
        return;
      }

      // Merge: replace draggedColor with targetColor
      applyColorChange(draggedColor, targetColor.hex);

      setDraggedColor(null);
      setDropTargetColor(null);
    },
    [draggedColor, applyColorChange]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedColor(null);
    setDropTargetColor(null);
  }, []);

  const emptyText = useMemo(() => {
    if (!selectedObject) return "Select an SVG to see colors";
    return "No colors detected";
  }, [selectedObject]);

  if (!selectedObject || palette.length === 0) {
    return (
      <>
        <div style={styles.container}>
          <div style={styles.emptyState}>{emptyText}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        .color-swatch:hover {
          transform: scale(1.05) !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
        }
        .brand-swatch:hover {
          transform: scale(1.08);
          box-shadow: 0 2px 8px rgba(0,123,255,0.3);
        }
        .apply-btn:hover {
          background-color: #c00024 !important;
        }
        .reset-btn:hover {
          background-color: #dc3545 !important;
          color: #fff !important;
        }
        .clear-btn:hover {
          background-color: #007bff !important;
          color: #fff !important;
        }
        .toggle-lock-btn:hover {
          background-color: #007bff !important;
          color: #fff !important;
        }
      `}</style>
      <div style={styles.container}>
        <div style={styles.header}>
        <div style={styles.titleRow}>
          <h3 style={styles.title}>Colors ({palette.length})</h3>
          {originalsStored && (
            <Button variants="secondary" size="sm" onClick={handleResetColors}> Reset </Button>
            // <button
            //   type="button"
            //   onClick={handleResetColors}
            //   style={styles.resetBtn}
            //   className="reset-btn"
            //   title="Restore original colors"
            // >
            //   Reset
            // </button>
          )}
        </div>
        {lockedColors.length > 0 && (
          <button
            type="button"
            onClick={() => setLockedColors([])}
            style={styles.clearBtn}
            className="clear-btn"
          >
            Clear locked ({lockedColors.length})
          </button>
        )}
      </div>

      {/* Swatches */}
      <div style={styles.scrollContainer}>
        <div style={styles.colorsGrid}>
          {palette.map((c) => {
            const isLocked = lockedColors.map(colorKey).includes(colorKey(c.hex));
            const isDragging = draggedColor === c.hex;
            const isDropTarget = dropTargetColor === c.hex;
            
            return (
              <div key={c.hex} style={styles.colorItem}>
                <div style={styles.swatchWrapper}>
                  <div
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, c)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, c)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, c)}
                    className="color-swatch"
                    style={{
                      ...styles.colorSwatch,
                      backgroundColor: c.hex,
                      outline: isLocked 
                        ? "2px solid #007bff" 
                        : isDropTarget 
                        ? "2px dashed #007bff" 
                        : "none",
                      opacity: isDragging ? 0.4 : 1,
                      cursor: "pointer",
                      transform: isDropTarget ? "scale(1.05)" : "scale(1)",
                    }}
                    onClick={() => handleColorClick(c.hex)}
                    title={`Click to change color`}
                  />
                  {isLocked && (
                    <div style={styles.lockBadge} title="Locked brand color">✓</div>
                  )}
                </div>
                <div style={styles.colorName} title={c.hex}>
                  {getColorName(c.hex)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Brand Color Picker Modal */}
      {showBrandPicker && (
        <div style={styles.modalOverlay} onClick={() => setShowBrandPicker(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h4 style={styles.modalTitle}>Select Brand Color</h4>
              <button style={styles.closeBtn} onClick={() => setShowBrandPicker(null)}>×</button>
            </div>
            <div style={styles.brandGrid}>
              {BRAND_COLORS.map((bc) => (
                <div
                  key={bc.hex}
                  className="brand-swatch"
                  style={{
                    ...styles.brandSwatch,
                    backgroundColor: bc.hex,
                  }}
                  onClick={() => handleBrandColorSelect(showBrandPicker, bc.hex)}
                  title={bc.name}
                >
                  <div style={styles.brandName}>{bc.name}</div>
                </div>
              ))}
            </div>
            <div style={styles.modalFooter}>
              <button 
                style={styles.toggleLockBtn}
                className="toggle-lock-btn"
                onClick={() => {
                  toggleLockedColor(showBrandPicker);
                  setShowBrandPicker(null);
                }}
              >
                {lockedColors.includes(colorKey(showBrandPicker)) ? 'Unlock Color' : 'Lock as Brand Color'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quantize Slider */}
      {palette.length > 1 && (
        <div style={styles.section} className="flex justify-center align-center flex-col w-full px-20">
          <label style={styles.label}>
            Colors: {sliderValue}
          </label>
          <input
            type="range"
            min="1"
            max={sliderMax}
            value={sliderValue}
            onChange={(e) => setTargetColorCount(parseInt(e.target.value, 10))}
            style={styles.slider}
          />
          <Button className="w-full m-auto" onClick={handleApplyQuantize}> Apply </Button>

        </div>
      )}
    </div>
    </>
  );
}

const styles = {
  container: { 
    padding: "0",
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },
  header: { 
    marginBottom: "16px",
  },
  titleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  title: { 
    margin: 0, 
    fontSize: "12px", 
    fontWeight: "600", 
    color: "#333",
  },
  resetBtn: {
    padding: "4px 10px",
    border: "1px solid #dc3545",
    borderRadius: "4px",
    background: "#fff",
    color: "#dc3545",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: "500",
    transition: "all 0.2s",
  },
  clearBtn: {
    padding: "6px 12px",
    border: "1px solid #007bff",
    borderRadius: "4px",
    background: "#fff",
    color: "#007bff",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: "500",
    width: "100%",
    transition: "all 0.2s",
  },
  emptyState: { 
    padding: "40px 20px", 
    textAlign: "center", 
    color: "#999", 
    fontSize: "13px",
  },
  scrollContainer: {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
    marginBottom: "16px",
  },
  colorsGrid: { 
display: "flex",
flexWrap: "wrap",
gap: "12px",
justifyContent: "center",
overflow: "auto",
maxHeight: "20vh"
  },
  colorItem: { 
    display: "flex", 
    flexDirection: "column", 
    alignItems: "center", 
    gap: "6px",
  },
  swatchWrapper: {
    position: "relative",
  },
  colorSwatch: {
    width: "40px",
    height: "40px",
    borderRadius: "8px",
    border: "2px solid #dee2e6",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  },
  lockBadge: {
    position: "absolute",
    top: "-4px",
    right: "-4px",
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    backgroundColor: "#007bff",
    color: "#fff",
    fontSize: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
  },
  colorName: { 
    fontSize: "10px", 
    color: "#495057", 
    fontWeight: "500",
    textAlign: "center",
    maxWidth: "52px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  section: { 
    padding: "12px", 
    backgroundColor: "#f8f9fa", 
    borderRadius: "6px", 
    border: "1px solid #dee2e6",
  },
  label: { 
    display: "block", 
    marginBottom: "10px", 
    fontSize: "12px", 
    fontWeight: "500", 
    color: "#495057",
  },
  slider: { 
    width: "100%", 
    marginBottom: "12px",
  },
  applyBtn: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#E4002B",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  applyBtnHover: {
    backgroundColor: "#c00024",
  },
  // Modal styles
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10000,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: "8px",
    width: "90%",
    maxWidth: "500px",
    maxHeight: "80vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid #dee2e6",
  },
  modalTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "600",
    color: "#333",
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "28px",
    color: "#999",
    cursor: "pointer",
    padding: 0,
    width: "30px",
    height: "30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
  },
  brandGrid: {
    padding: "20px",
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: "12px",
    overflowY: "auto",
    flex: 1,
  },
  brandSwatch: {
    aspectRatio: "1",
    borderRadius: "6px",
    border: "2px solid #dee2e6",
    cursor: "pointer",
    display: "flex",
    alignItems: "flex-end",
    padding: "4px",
    transition: "transform 0.2s",
  },
  brandName: {
    fontSize: "8px",
    color: "#fff",
    textShadow: "0 1px 2px rgba(0,0,0,0.8)",
    fontWeight: "600",
    width: "100%",
    textAlign: "center",
    lineHeight: 1.1,
  },
  modalFooter: {
    padding: "12px 20px",
    borderTop: "1px solid #dee2e6",
  },
  toggleLockBtn: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#fff",
    color: "#007bff",
    border: "1px solid #007bff",
    borderRadius: "4px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
  },
};
