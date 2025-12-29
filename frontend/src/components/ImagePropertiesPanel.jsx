import React, { useState, useEffect } from 'react';
import { ChevronUp, Plus, ChevronDown } from 'lucide-react';
import useStore from '../store/useStore';
import { filters as fabricFilters, Shadow } from 'fabric';

const ImagePropertiesPanel = () => {
    const { selectedObject, canvas } = useStore();
    const [isColorOpen, setIsColorOpen] = useState(true);
    const [isEffectsOpen, setIsEffectsOpen] = useState(false);

    const [activeEffects, setActiveEffects] = useState([]);
    const [openSettingsId, setOpenSettingsId] = useState(null);

    const [filters, setFilters] = useState({
        hue: 0,
        saturation: 0,
        brightness: 0,
        contrast: 0,
        opacity: 100
    });

    const [effectValues, setEffectValues] = useState({
        blur: 0,
        shadowBlur: 10,
        shadowOffsetX: 5,
        shadowOffsetY: 5,
        shadowColor: 'rgba(0,0,0,0.3)',
        strokeWidth: 0,
        strokeColor: '#000000'
    });

    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (selectedObject && selectedObject.type === 'image') {
            const updateProps = () => {
                const f = selectedObject.filters || [];

                const nextFilters = {
                    hue: 0,
                    saturation: 0,
                    brightness: 0,
                    contrast: 0,
                    opacity: (selectedObject.opacity || 1) * 100
                };

                const nextEffectValues = {
                    blur: 0,
                    shadowBlur: selectedObject.shadow?.blur || 10,
                    shadowOffsetX: selectedObject.shadow?.offsetX || 5,
                    shadowOffsetY: selectedObject.shadow?.offsetY || 5,
                    shadowColor: selectedObject.shadow?.color || 'rgba(0,0,0,0.3)',
                    strokeWidth: selectedObject.strokeWidth || 0,
                    strokeColor: selectedObject.stroke || '#000000'
                };

                const nextActiveEffects = [];

                f.forEach((filter, index) => {
                    if (!filter) return;
                    if (filter.type === 'HueRotation') nextFilters.hue = filter.rotation || 0;
                    else if (filter.type === 'Saturation') nextFilters.saturation = filter.saturation || 0;
                    else if (filter.type === 'Brightness') nextFilters.brightness = filter.brightness || 0;
                    else if (filter.type === 'Contrast') nextFilters.contrast = filter.contrast || 0;
                    else if (filter.type === 'Blur') {
                        nextActiveEffects.push({ id: `blur-${index}`, type: 'Blur' });
                        nextEffectValues.blur = filter.blur || 0;
                    }
                });

                if (selectedObject.shadow) {
                    nextActiveEffects.push({ id: 'shadow-1', type: 'Drop Shadow' });
                }

                if (selectedObject.strokeWidth > 0) {
                    nextActiveEffects.push({ id: 'stroke-1', type: 'Stroke' });
                }

                setFilters(nextFilters);
                setEffectValues(nextEffectValues);
                setActiveEffects(nextActiveEffects);
                setDimensions({
                    width: Math.round(selectedObject.getScaledWidth()),
                    height: Math.round(selectedObject.getScaledHeight())
                });
            };

            updateProps();

            selectedObject.on('modified', updateProps);
            selectedObject.on('scaling', updateProps);

            return () => {
                selectedObject.off('modified', updateProps);
                selectedObject.off('scaling', updateProps);
            };
        }
    }, [selectedObject]);

    if (!selectedObject || selectedObject.type !== 'image') return null;

    const applyFilter = (type, value) => {
        if (!selectedObject) return;

        const f = selectedObject.filters || [];

        const getFilter = (FilterClass, filterType) => {
            let filter = f.find(item => item.type === filterType);
            if (!filter) {
                filter = new FilterClass();
                f.push(filter);
            }
            return filter;
        };

        if (type === 'opacity') {
            selectedObject.set('opacity', value / 100);
        } else {
            if (!fabricFilters) return;
            const fabricType = {
                hue: { cls: fabricFilters.HueRotation, name: 'HueRotation', prop: 'rotation' },
                saturation: { cls: fabricFilters.Saturation, name: 'Saturation', prop: 'saturation' },
                brightness: { cls: fabricFilters.Brightness, name: 'Brightness', prop: 'brightness' },
                contrast: { cls: fabricFilters.Contrast, name: 'Contrast', prop: 'contrast' },
                blur: { cls: fabricFilters.Blur, name: 'Blur', prop: 'blur' }
            }[type];

            if (fabricType && fabricType.cls) {
                const filter = getFilter(fabricType.cls, fabricType.name);
                filter[fabricType.prop] = value;
            }
        }

        selectedObject.applyFilters();
        canvas.renderAll();
        if (type === 'blur') {
            setEffectValues(prev => ({ ...prev, blur: value }));
        } else {
            setFilters(prev => ({ ...prev, [type]: value }));
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
        setActiveEffects(activeEffects.filter(e => e.id !== id));
        if (openSettingsId === id) setOpenSettingsId(null);
        updateFabricEffect(type, false);
    };

    const updateEffectType = (id, oldType, newType) => {
        setActiveEffects(activeEffects.map(e => e.id === id ? { ...e, type: newType } : e));
        updateFabricEffect(oldType, false);
        updateFabricEffect(newType, true);
    };

    const updateFabricEffect = (type, active) => {
        if (!selectedObject) return;

        if (type === 'Drop Shadow') {
            selectedObject.set('shadow', active ? new Shadow({
                color: effectValues.shadowColor,
                blur: effectValues.shadowBlur,
                offsetX: effectValues.shadowOffsetX,
                offsetY: effectValues.shadowOffsetY
            }) : null);
        } else if (type === 'Blur') {
            if (!active) {
                selectedObject.filters = (selectedObject.filters || []).filter(f => f.type !== 'Blur');
                selectedObject.applyFilters();
            } else {
                applyFilter('blur', effectValues.blur || 0.1);
            }
        } else if (type === 'Stroke') {
            selectedObject.set({
                stroke: active ? effectValues.strokeColor : null,
                strokeWidth: active ? (effectValues.strokeWidth || 5) : 0
            });
        }
        canvas.renderAll();
    };

    const handleEffectValueChange = (type, value) => {
        setEffectValues(prev => ({ ...prev, [type]: value }));

        if (!selectedObject) return;

        if (type === 'blur') {
            applyFilter('blur', value);
        } else if (type.startsWith('shadow')) {
            const shadow = selectedObject.shadow || new Shadow();
            const prop = type.replace('shadow', '');
            const fabricProp = prop.charAt(0).toLowerCase() + prop.slice(1);
            shadow[fabricProp] = value;
            selectedObject.set('shadow', shadow);
            canvas.renderAll();
        } else if (type === 'strokeWidth') {
            selectedObject.set('strokeWidth', value);
            canvas.renderAll();
        }
    };

    const Slider = ({ label, min, max, value, onChange, step = 1, isHue = false }) => (
        <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-gray-400 font-normal w-24">{label}</span>
            <div className="flex-1 relative">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    className={`w-full h-1 rounded-full appearance-none cursor-pointer slider-thumb ${isHue ? 'hue-slider' : 'gray-slider'}`}
                    style={isHue ? {
                        background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
                    } : {}}
                />
            </div>
        </div>
    );

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
            <div className="absolute top-3 left-6 z-10 w-[300px] bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-5 border border-gray-100/50 flex flex-col gap-5 font-sans">
                {/* Color section */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsColorOpen(!isColorOpen)}>
                        <span className="text-base font-semibold text-gray-900">Color</span>
                        {isColorOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                    </div>

                    {isColorOpen && (
                        <div className="flex flex-col gap-3">
                            <Slider label="Hue" min="0" max="360" step="0.1" value={filters.hue} onChange={(v) => applyFilter('hue', v)} isHue={true} />
                            <Slider label="Saturation" min="-1" max="1" step="0.001" value={filters.saturation} onChange={(v) => applyFilter('saturation', v)} />
                            <Slider label="Brightness" min="-1" max="1" step="0.001" value={filters.brightness} onChange={(v) => applyFilter('brightness', v)} />
                            <Slider label="Contrast" min="-1" max="1" step="0.001" value={filters.contrast} onChange={(v) => applyFilter('contrast', v)} />
                            <Slider label="Opacity" min="0" max="100" step="0.1" value={filters.opacity} onChange={(v) => applyFilter('opacity', v)} />
                        </div>
                    )}
                </div>

                {/* Effects Section */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <span className="text-base font-semibold text-gray-900">Effects</span>
                        <div className="relative">
                            <button
                                onClick={() => setIsEffectsOpen(!isEffectsOpen)}
                                className={`p-1 rounded-lg transition-colors ${isEffectsOpen ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                            >
                                <Plus size={20} className="text-gray-800" />
                            </button>

                            {isEffectsOpen && (
                                <div className="absolute right-0 top-full mt-2 w-36 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
                                    <button
                                        onClick={() => addEffectRow('Blur')}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Blur
                                    </button>
                                    <button
                                        onClick={() => addEffectRow('Drop Shadow')}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Drop Shadow
                                    </button>
                                    <button
                                        onClick={() => addEffectRow('Stroke')}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Stroke
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        {activeEffects.map((effect) => (
                            <div key={effect.id} className="flex flex-col gap-3">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setOpenSettingsId(openSettingsId === effect.id ? null : effect.id)}
                                        className={`p-2 rounded-lg border transition-colors ${openSettingsId === effect.id ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-gray-100 text-gray-400 hover:text-gray-600'}`}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
                                            <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
                                            <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
                                            <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
                                        </svg>
                                    </button>

                                    <div className="flex-1 relative">
                                        <select
                                            value={effect.type}
                                            onChange={(e) => updateEffectType(effect.id, effect.type, e.target.value)}
                                            className="w-full appearance-none bg-white border border-gray-100 rounded-lg py-2 px-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
                                        >
                                            <option value="Blur">Blur</option>
                                            <option value="Drop Shadow">Drop Shadow</option>
                                            <option value="Stroke">Stroke</option>
                                        </select>
                                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>

                                    <button
                                        onClick={() => removeEffectRow(effect.id, effect.type)}
                                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                        </svg>
                                    </button>
                                </div>

                                {openSettingsId === effect.id && (
                                    <div className="bg-gray-50/50 rounded-xl p-3 flex flex-col gap-3 border border-gray-100/50">
                                        {effect.type === 'Blur' && (
                                            <Slider label="Radius" min="0" max="1" step="0.001" value={effectValues.blur} onChange={(v) => handleEffectValueChange('blur', v)} />
                                        )}
                                        {effect.type === 'Drop Shadow' && (
                                            <>
                                                <Slider label="Blur" min="0" max="50" step="0.1" value={effectValues.shadowBlur} onChange={(v) => handleEffectValueChange('shadowBlur', v)} />
                                                <Slider label="Offset X" min="-50" max="50" step="0.1" value={effectValues.shadowOffsetX} onChange={(v) => handleEffectValueChange('shadowOffsetX', v)} />
                                                <Slider label="Offset Y" min="-50" max="50" step="0.1" value={effectValues.shadowOffsetY} onChange={(v) => handleEffectValueChange('shadowOffsetY', v)} />
                                            </>
                                        )}
                                        {effect.type === 'Stroke' && (
                                            <Slider label="Width" min="0" max="20" step="0.1" value={effectValues.strokeWidth} onChange={(v) => handleEffectValueChange('strokeWidth', v)} />
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

export default ImagePropertiesPanel;
