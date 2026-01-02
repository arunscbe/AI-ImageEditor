import React, { useState, useEffect } from "react";
import {
  ChevronUp,
  Plus,
  ChevronDown,
  Palette,
  Sliders,
  Sparkles,
} from "lucide-react";
import useStore from "../store/useStore";
import { filters as fabricFilters, Shadow } from "fabric";
import {
  extractColorsFromImage,
  replaceColorInImage,
} from "../utils/colorExtractor";

const ImagePropertiesPanel = ({ embedded = false, flattened = false }) => {
  const { selectedObject, canvas } = useStore();
  const [isColorOpen, setIsColorOpen] = useState(true);
  const [isEffectsOpen, setIsEffectsOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);

  const [extractedColors, setExtractedColors] = useState([]);
  const [selectedColorIndex, setSelectedColorIndex] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pickerColor, setPickerColor] = useState("#000000");
  const [draggedColorIndex, setDraggedColorIndex] = useState(null);
  const [dropTargetIndex, setDropTargetIndex] = useState(null);

  const [activeEffects, setActiveEffects] = useState([]);
  const [openSettingsId, setOpenSettingsId] = useState(null);

  const [filters, setFilters] = useState({
    hue: 0,
    saturation: 0,
    brightness: 0,
    contrast: 0,
    opacity: 100,
  });

  const [effectValues, setEffectValues] = useState({
    blur: 0,
    shadowBlur: 10,
    shadowOffsetX: 5,
    shadowOffsetY: 5,
    shadowColor: "rgba(0,0,0,0.3)",
    strokeWidth: 0,
    strokeColor: "#000000",
  });

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (selectedObject && selectedObject.type === "image") {
      const updateProps = () => {
        const f = selectedObject.filters || [];

        const nextFilters = {
          hue: 0,
          saturation: 0,
          brightness: 0,
          contrast: 0,
          opacity: (selectedObject.opacity || 1) * 100,
        };

        const nextEffectValues = {
          blur: 0,
          shadowBlur: selectedObject.shadow?.blur || 10,
          shadowOffsetX: selectedObject.shadow?.offsetX || 5,
          shadowOffsetY: selectedObject.shadow?.offsetY || 5,
          shadowColor: selectedObject.shadow?.color || "rgba(0,0,0,0.3)",
          strokeWidth: selectedObject.strokeWidth || 0,
          strokeColor: selectedObject.stroke || "#000000",
        };

        const nextActiveEffects = [];

        f.forEach((filter, index) => {
          if (!filter) return;
          if (filter.type === "HueRotation")
            nextFilters.hue = filter.rotation || 0;
          else if (filter.type === "Saturation")
            nextFilters.saturation = filter.saturation || 0;
          else if (filter.type === "Brightness")
            nextFilters.brightness = filter.brightness || 0;
          else if (filter.type === "Contrast")
            nextFilters.contrast = filter.contrast || 0;
          else if (filter.type === "Blur") {
            nextActiveEffects.push({ id: `blur-${index}`, type: "Blur" });
            nextEffectValues.blur = filter.blur || 0;
          }
        });

        if (selectedObject.shadow) {
          nextActiveEffects.push({ id: "shadow-1", type: "Drop Shadow" });
        }

        if (selectedObject.strokeWidth > 0) {
          nextActiveEffects.push({ id: "stroke-1", type: "Stroke" });
        }

        setFilters(nextFilters);
        setEffectValues(nextEffectValues);
        setActiveEffects(nextActiveEffects);
        setDimensions({
          width: Math.round(selectedObject.getScaledWidth()),
          height: Math.round(selectedObject.getScaledHeight()),
        });
      };

      updateProps();

      selectedObject.on("modified", updateProps);
      selectedObject.on("scaling", updateProps);

      return () => {
        selectedObject.off("modified", updateProps);
        selectedObject.off("scaling", updateProps);
      };
    }
  }, [selectedObject]);

  // Extract colors for ANY object type (raster image, SVG, group, etc.)
  useEffect(() => {
    if (selectedObject) {
      console.log(
        "Extracting colors from object:",
        selectedObject.type,
        selectedObject
      );
      const colors = extractColorsFromImage(selectedObject, 8);
      console.log("Extracted colors:", colors);
      setExtractedColors(colors);
    } else {
      setExtractedColors([]);
    }
  }, [selectedObject]);

  if (!selectedObject) return null;

  // Check if object supports color/filter adjustments (only raster images)
  const isRasterImage = selectedObject.type === "image";

  const applyFilter = (type, value) => {
    if (!selectedObject) return;

    const f = selectedObject.filters || [];

    const getFilter = (FilterClass, filterType) => {
      let filter = f.find((item) => item.type === filterType);
      if (!filter) {
        filter = new FilterClass();
        f.push(filter);
      }
      return filter;
    };

    if (type === "opacity") {
      selectedObject.set("opacity", value / 100);
    } else {
      if (!fabricFilters) return;
      const fabricType = {
        hue: {
          cls: fabricFilters.HueRotation,
          name: "HueRotation",
          prop: "rotation",
        },
        saturation: {
          cls: fabricFilters.Saturation,
          name: "Saturation",
          prop: "saturation",
        },
        brightness: {
          cls: fabricFilters.Brightness,
          name: "Brightness",
          prop: "brightness",
        },
        contrast: {
          cls: fabricFilters.Contrast,
          name: "Contrast",
          prop: "contrast",
        },
        blur: { cls: fabricFilters.Blur, name: "Blur", prop: "blur" },
      }[type];

      if (fabricType && fabricType.cls) {
        const filter = getFilter(fabricType.cls, fabricType.name);
        filter[fabricType.prop] = value;
      }
    }

    selectedObject.applyFilters();
    canvas.renderAll();
    if (type === "blur") {
      setEffectValues((prev) => ({ ...prev, blur: value }));
    } else {
      setFilters((prev) => ({ ...prev, [type]: value }));
    }
  };

  const addEffectRow = (type) => {
    const id = Date.now().toString();
    setActiveEffects([...activeEffects, { id, type }]);
    setOpenSettingsId(id);
    updateFabricEffect(type, true);
    setIsEffectsOpen(false);
  };

  const removeEffectRow = (id, type) => {
    setActiveEffects(activeEffects.filter((e) => e.id !== id));
    if (openSettingsId === id) setOpenSettingsId(null);
    updateFabricEffect(type, false);
  };

  const updateEffectType = (id, oldType, newType) => {
    setActiveEffects(
      activeEffects.map((e) => (e.id === id ? { ...e, type: newType } : e))
    );
    updateFabricEffect(oldType, false);
    updateFabricEffect(newType, true);
  };

  const updateFabricEffect = (type, active) => {
    if (!selectedObject) return;

    if (type === "Drop Shadow") {
      selectedObject.set(
        "shadow",
        active
          ? new Shadow({
              color: effectValues.shadowColor,
              blur: effectValues.shadowBlur,
              offsetX: effectValues.shadowOffsetX,
              offsetY: effectValues.shadowOffsetY,
            })
          : null
      );
    } else if (type === "Blur") {
      if (!active) {
        selectedObject.filters = (selectedObject.filters || []).filter(
          (f) => f.type !== "Blur"
        );
        selectedObject.applyFilters();
      } else {
        applyFilter("blur", effectValues.blur || 0.1);
      }
    } else if (type === "Stroke") {
      selectedObject.set({
        stroke: active ? effectValues.strokeColor : null,
        strokeWidth: active ? effectValues.strokeWidth || 5 : 0,
      });
    }
    canvas.renderAll();
  };

  const handleEffectValueChange = (type, value) => {
    setEffectValues((prev) => ({ ...prev, [type]: value }));

    if (!selectedObject) return;

    if (type === "blur") {
      applyFilter("blur", value);
    } else if (type.startsWith("shadow")) {
      const shadow = selectedObject.shadow || new Shadow();
      const prop = type.replace("shadow", "");
      const fabricProp = prop.charAt(0).toLowerCase() + prop.slice(1);
      shadow[fabricProp] = value;
      selectedObject.set("shadow", shadow);
      canvas.renderAll();
    } else if (type === "strokeWidth") {
      selectedObject.set("strokeWidth", value);
      canvas.renderAll();
    }
  };

  const handleColorClick = (color, index) => {
    setSelectedColorIndex(index);
    setPickerColor(color.hex);
    setShowColorPicker(true);
  };

  const handleColorChange = (newColor) => {
    if (selectedColorIndex !== null && extractedColors[selectedColorIndex]) {
      const oldColor = extractedColors[selectedColorIndex].hex;
      replaceColorInImage(selectedObject, oldColor, newColor, 60);

      // Re-extract colors after replacement to update the palette
      setTimeout(() => {
        const colors = extractColorsFromImage(selectedObject, 8);
        setExtractedColors(colors);
        setSelectedColorIndex(null);
        setShowColorPicker(false);
      }, 100);
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedColorIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.target);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTargetIndex(index);
  };

  const handleDragLeave = () => {
    setDropTargetIndex(null);
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();

    if (draggedColorIndex !== null && targetIndex !== draggedColorIndex) {
      const sourceColor = extractedColors[draggedColorIndex].hex;
      const targetColor = extractedColors[targetIndex].hex;

      replaceColorInImage(selectedObject, targetColor, sourceColor, 60);

      // Re-extract colors after merge to update the palette
      setTimeout(() => {
        const colors = extractColorsFromImage(selectedObject, 8);
        setExtractedColors(colors);
      }, 100);
    }

    setDraggedColorIndex(null);
    setDropTargetIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedColorIndex(null);
    setDropTargetIndex(null);
  };

  const hexToRgbString = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return `rgb(${parseInt(result[1], 16)},${parseInt(
        result[2],
        16
      )},${parseInt(result[3], 16)})`;
    }
    return "rgb(0,0,0)";
  };

  const Slider = ({
    label,
    min,
    max,
    value,
    onChange,
    step = 1,
    isHue = false,
  }) => (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-gray-500 font-normal w-20 font-sans">{label}</span>
      <div className="flex-1 relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={`w-full h-1 rounded-full appearance-none cursor-pointer slider-thumb ${
            isHue ? "hue-slider" : "gray-slider"
          }`}
          style={
            isHue
              ? {
                  background:
                    "linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)",
                }
              : {}
          }
        />
      </div>
    </div>
  );

  const contentSections = (
    <>
      {extractedColors.length > 0 && (
        <div className="border-b border-gray-200">
          <button
            onClick={() => setIsPaletteOpen(!isPaletteOpen)}
            className="w-full px-2.5 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors duration-150 group"
          >
            <div className="flex items-center gap-1.5">
              <Palette size={14} className="text-brand-primary" />
              <span className="font-semibold text-gray-900 text-xs font-heading">
                Color Palette
              </span>
            </div>
            <ChevronDown
              size={14}
              className={`text-gray-400 transition-transform duration-150 ${
                isPaletteOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          <div
            className={`overflow-hidden transition-all duration-200 ease-in-out ${
              isPaletteOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="px-2.5 pb-2.5">
              <p className="text-[10px] text-gray-500 mb-1.5 font-sans">
                Click to edit • Drag to merge colors
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {extractedColors.map((color, index) => (
                  <button
                    key={index}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    onClick={() => handleColorClick(color, index)}
                    className={`group relative aspect-square rounded-md border-2 transition-all duration-150 hover:scale-105 cursor-move ${
                      selectedColorIndex === index
                        ? "border-brand-primary ring-2 ring-brand-primary/20"
                        : draggedColorIndex === index
                        ? "border-gray-400 opacity-50 scale-95"
                        : dropTargetIndex === index
                        ? "border-brand-primary ring-2 ring-brand-primary/30 scale-110"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={`${color.hex} - Drag to merge`}
                  >
                    <div className="absolute inset-0 rounded-md bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      {selectedColorIndex === index && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white shadow-md"></div>
                      )}
                      {dropTargetIndex === index &&
                        draggedColorIndex !== null &&
                        draggedColorIndex !== index && (
                          <div className="text-white font-bold text-[10px] bg-brand-primary rounded-full w-4 h-4 flex items-center justify-center">
                            ↓
                          </div>
                        )}
                    </div>
                  </button>
                ))}
              </div>

              {showColorPicker && selectedColorIndex !== null && (
                <div className="flex flex-col gap-2 p-2 mt-2 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700 font-sans">
                      Replace Color
                    </span>
                    <button
                      onClick={() => {
                        setShowColorPicker(false);
                        setSelectedColorIndex(null);
                      }}
                      className="text-[10px] text-gray-500 hover:text-gray-700 font-sans"
                    >
                      Done
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-md border-2 border-gray-300"
                      style={{
                        backgroundColor:
                          extractedColors[selectedColorIndex].hex,
                      }}
                    />
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      className="text-gray-400"
                    >
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                    <input
                      type="color"
                      value={pickerColor}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="w-8 h-8 rounded-md border-2 border-brand-primary cursor-pointer"
                    />
                    <input
                      type="text"
                      value={pickerColor}
                      onChange={(e) => {
                        const value = e.target.value;
                        setPickerColor(value);
                        if (/^#[0-9A-F]{6}$/i.test(value)) {
                          handleColorChange(value);
                        }
                      }}
                      className="flex-1 px-1.5 py-1 text-[10px] font-mono border border-gray-200 rounded-md focus:outline-none focus:border-brand-primary"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isRasterImage && (
        <div className="border-b border-gray-200">
          <button
            onClick={() => setIsColorOpen(!isColorOpen)}
            className="w-full px-2.5 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors duration-150 group"
          >
            <div className="flex items-center gap-1.5">
              <Sliders size={14} className="text-brand-primary" />
              <span className="font-semibold text-gray-900 text-xs font-heading">Color</span>
            </div>
            <ChevronDown
              size={14}
              className={`text-gray-400 transition-transform duration-150 ${
                isColorOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          <div
            className={`overflow-hidden transition-all duration-200 ease-in-out ${
              isColorOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="px-2.5 pb-2.5 flex flex-col gap-2">
              <Slider
                label="Hue"
                min="0"
                max="360"
                step="0.1"
                value={filters.hue}
                onChange={(v) => applyFilter("hue", v)}
                isHue={true}
              />
              <Slider
                label="Saturation"
                min="-1"
                max="1"
                step="0.001"
                value={filters.saturation}
                onChange={(v) => applyFilter("saturation", v)}
              />
              <Slider
                label="Brightness"
                min="-1"
                max="1"
                step="0.001"
                value={filters.brightness}
                onChange={(v) => applyFilter("brightness", v)}
              />
              <Slider
                label="Contrast"
                min="-1"
                max="1"
                step="0.001"
                value={filters.contrast}
                onChange={(v) => applyFilter("contrast", v)}
              />
              <Slider
                label="Opacity"
                min="0"
                max="100"
                step="0.1"
                value={filters.opacity}
                onChange={(v) => applyFilter("opacity", v)}
              />
            </div>
          </div>
        </div>
      )}

      {isRasterImage && (
        <div className="border-b border-gray-200">
          <div className="w-full px-2.5 py-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-brand-primary" />
              <span className="font-semibold text-gray-900 text-xs font-heading">
                Effects
              </span>
            </div>
            <div className="relative">
              <button
                onClick={() => setIsEffectsOpen(!isEffectsOpen)}
                className={`p-1 rounded-lg transition-colors duration-150 ${
                  isEffectsOpen ? "bg-gray-100" : "hover:bg-gray-50"
                }`}
              >
                <Plus size={16} className="text-gray-800" />
              </button>

              {isEffectsOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-[100]"
                    onClick={() => setIsEffectsOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1.5 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[101]">
                    <button
                      onClick={() => addEffectRow("Blur")}
                      className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors duration-150 font-sans"
                    >
                      Blur
                    </button>
                    <button
                      onClick={() => addEffectRow("Drop Shadow")}
                      className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors duration-150 font-sans"
                    >
                      Drop Shadow
                    </button>
                    <button
                      onClick={() => addEffectRow("Stroke")}
                      className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors duration-150 font-sans"
                    >
                      Stroke
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {activeEffects.length > 0 && (
            <div className="px-2.5 pb-2.5 flex flex-col gap-2">
              {activeEffects.map((effect) => (
                <div key={effect.id} className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        setOpenSettingsId(
                          openSettingsId === effect.id ? null : effect.id
                        )
                      }
                      className={`p-1.5 rounded-lg border transition-colors duration-150 ${
                        openSettingsId === effect.id
                          ? "bg-red-50 border-brand-primary text-brand-primary"
                          : "bg-white border-gray-200 text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="4" y1="21" x2="4" y2="14" />
                        <line x1="4" y1="10" x2="4" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12" y2="3" />
                        <line x1="20" y1="21" x2="20" y2="16" />
                        <line x1="20" y1="12" x2="20" y2="3" />
                        <line x1="1" y1="14" x2="7" y2="14" />
                        <line x1="9" y1="8" x2="15" y2="8" />
                        <line x1="17" y1="16" x2="23" y2="16" />
                      </svg>
                    </button>

                    <div className="flex-1 relative">
                      <select
                        value={effect.type}
                        onChange={(e) =>
                          updateEffectType(
                            effect.id,
                            effect.type,
                            e.target.value
                          )
                        }
                        className="w-full appearance-none bg-white border border-gray-200 rounded-lg py-1.5 px-2 text-xs font-medium text-gray-700 font-sans focus:outline-none focus:ring-2 focus:ring-brand-primary/20 cursor-pointer"
                      >
                        <option value="Blur">Blur</option>
                        <option value="Drop Shadow">Drop Shadow</option>
                        <option value="Stroke">Stroke</option>
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                    </div>

                    <button
                      onClick={() => removeEffectRow(effect.id, effect.type)}
                      className="p-1.5 text-gray-300 hover:text-red-500 transition-colors duration-150"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                  </div>

                  {openSettingsId === effect.id && (
                    <div className="bg-gray-50/50 rounded-xl p-3 flex flex-col gap-3 border border-gray-100/50">
                      {effect.type === "Blur" && (
                        <Slider
                          label="Radius"
                          min="0"
                          max="1"
                          step="0.001"
                          value={effectValues.blur}
                          onChange={(v) => handleEffectValueChange("blur", v)}
                        />
                      )}
                      {effect.type === "Drop Shadow" && (
                        <>
                          <Slider
                            label="Blur"
                            min="0"
                            max="50"
                            step="0.1"
                            value={effectValues.shadowBlur}
                            onChange={(v) =>
                              handleEffectValueChange("shadowBlur", v)
                            }
                          />
                          <Slider
                            label="Offset X"
                            min="-50"
                            max="50"
                            step="0.1"
                            value={effectValues.shadowOffsetX}
                            onChange={(v) =>
                              handleEffectValueChange("shadowOffsetX", v)
                            }
                          />
                          <Slider
                            label="Offset Y"
                            min="-50"
                            max="50"
                            step="0.1"
                            value={effectValues.shadowOffsetY}
                            onChange={(v) =>
                              handleEffectValueChange("shadowOffsetY", v)
                            }
                          />
                        </>
                      )}
                      {effect.type === "Stroke" && (
                        <Slider
                          label="Width"
                          min="0"
                          max="20"
                          step="0.1"
                          value={effectValues.strokeWidth}
                          onChange={(v) =>
                            handleEffectValueChange("strokeWidth", v)
                          }
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );

  if (embedded && flattened) {
    // Flattened mode: each section gets its own accordion at root level
    return contentSections;
  }

  if (embedded) {
    return <div className="flex flex-col gap-5">{contentSections}</div>;
  }

  return (
    <>
      <style>{`
                .slider-thumb::-webkit-slider-thumb {
                    appearance: none;
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    background: white;
                    border: 2px solid #d1d5db;
                    cursor: pointer;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                .slider-thumb::-moz-range-thumb {
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    background: white;
                    border: 2px solid #d1d5db;
                    cursor: pointer;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                .gray-slider {
                    background: #e5e7eb;
                }
            `}</style>
      <div className="absolute top-[250px] right-6 z-10 w-[280px] bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-5 border border-gray-100/50 flex flex-col gap-5 font-sans max-h-[calc(100vh-270px)] overflow-y-auto">
        {contentSections}
      </div>
    </>
  );
};

export default ImagePropertiesPanel;
