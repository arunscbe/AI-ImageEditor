import React, { useState, useEffect } from 'react';
import {
    AlignLeft,
    AlignCenter,
    AlignRight,
    Type,
    MoveHorizontal,
    ArrowUpFromLine,
    Pipette,
    ChevronDown
} from 'lucide-react';
import useStore from '../store/useStore';

const TextPropertiesPanel = () => {
    const { selectedObject, canvas } = useStore();
    const [properties, setProperties] = useState({
        width: 0,
        height: 0,
        fontFamily: 'Inter',
        fontWeight: 'normal',
        fontStyle: 'normal',
        underline: false,
        fontSize: 16,
        textAlign: 'left',
        lineHeight: 1.2,
        charSpacing: 0,
        fill: '#000000'
    });

    useEffect(() => {
        if (selectedObject) {
            const updateProps = () => {
                setProperties({
                    width: Math.round(selectedObject.getScaledWidth()),
                    height: Math.round(selectedObject.getScaledHeight()),
                    fontFamily: selectedObject.fontFamily || 'Inter',
                    fontWeight: selectedObject.fontWeight || 'normal',
                    fontStyle: selectedObject.fontStyle || 'normal',
                    underline: selectedObject.underline || false,
                    fontSize: Math.round((selectedObject.fontSize || 16) * (selectedObject.scaleY || 1)),
                    textAlign: selectedObject.textAlign || 'left',
                    lineHeight: selectedObject.lineHeight || 1.2,
                    charSpacing: selectedObject.charSpacing || 0,
                    fill: selectedObject.fill || '#000000'
                });
            };

            updateProps();

            // Listen for changes
            selectedObject.on('modified', updateProps);
            selectedObject.on('scaling', updateProps);

            return () => {
                selectedObject.off('modified', updateProps);
                selectedObject.off('scaling', updateProps);
            };
        }
    }, [selectedObject]);

    if (!selectedObject || selectedObject.type !== 'i-text') return null;

    const handleChange = (key, value) => {
        if (!selectedObject || !canvas) return;

        if (typeof key === 'object') {
            selectedObject.set(key);
        } else {
            if (key === 'fontSize') {
                selectedObject.set({
                    fontSize: value,
                    scaleX: 1,
                    scaleY: 1
                });
            } else {
                selectedObject.set(key, value);
            }
        }

        canvas.renderAll();

        const updatedDims = {
            width: Math.round(selectedObject.getScaledWidth()),
            height: Math.round(selectedObject.getScaledHeight())
        };

        let update;
        if (typeof key === 'object') {
            update = { ...key, ...updatedDims };
        } else if (key === 'fontSize') {
            update = { fontSize: value, ...updatedDims };
        } else {
            update = { [key]: value, ...updatedDims };
        }

        setProperties(prev => ({ ...prev, ...update }));
    };

    // Color conversion helpers
    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    };

    const rgbToHsv = (r, g, b) => {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, v = max;
        const d = max - min;
        s = max === 0 ? 0 : d / max;
        if (max === min) {
            h = 0;
        } else {
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h: h * 360, s: s * 100, v: v * 100 };
    };

    const hsvToRgb = (h, s, v) => {
        s /= 100; v /= 100;
        let r, g, b;
        const i = Math.floor(h / 60);
        const f = h / 60 - i;
        const p = v * (1 - s);
        const q = v * (1 - f * s);
        const t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0: r = v, g = t, b = p; break;
            case 1: r = q, g = v, b = p; break;
            case 2: r = p, g = v, b = t; break;
            case 3: r = p, g = q, b = v; break;
            case 4: r = t, g = p, b = v; break;
            case 5: r = v, g = p, b = q; break;
        }
        return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
    };

    const rgbToHex = (r, g, b) => {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    };

    const [hsv, setHsv] = useState({ h: 200, s: 50, v: 50 });

    useEffect(() => {
        if (properties.fill) {
            const rgb = hexToRgb(properties.fill);
            const newHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
            setHsv(newHsv);
        }
    }, [properties.fill]);

    const handleSlMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));

        const newS = x * 100;
        const newV = y * 100;

        const newRgb = hsvToRgb(hsv.h, newS, newV);
        const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
        handleChange('fill', newHex);
    };

    const handleHueMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const newH = x * 360;

        const newRgb = hsvToRgb(newH, hsv.s, hsv.v);
        const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
        handleChange('fill', newHex);
    };

    const startDragging = (handler) => (e) => {
        handler(e);
        const onMouseMove = (moveEvent) => handler(moveEvent);
        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    const [isFontOpen, setIsFontOpen] = useState(false);
    const fonts = [
        'Inter',
        'Roboto',
        'Playfair Display',
        'Montserrat',
        'Pacifico',
        'Oswald'
    ];

    const [isStyleOpen, setIsStyleOpen] = useState(false);
    const styles = [
        { label: 'Normal', value: { fontWeight: 'normal', fontStyle: 'normal', underline: false } },
        { label: 'Bold', value: { fontWeight: 'bold', fontStyle: 'normal', underline: false } },
        { label: 'Italics', value: { fontWeight: 'normal', fontStyle: 'italic', underline: false } },
        { label: 'Underline', value: { fontWeight: 'normal', fontStyle: 'normal', underline: true } },
        { label: 'Bold + Underline', value: { fontWeight: 'bold', fontStyle: 'normal', underline: true } },
        { label: 'Italics + Underline', value: { fontWeight: 'normal', fontStyle: 'italic', underline: true } }
    ];

    const getCurrentStyleLabel = () => {
        const found = styles.find(s =>
            s.value.fontWeight === properties.fontWeight &&
            s.value.fontStyle === properties.fontStyle &&
            s.value.underline === properties.underline
        );
        return found ? found.label : 'Normal';
    };

    return (
        <div className="absolute top-3 left-6 z-10 w-[240px] bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-4 border border-gray-100/50 flex flex-col gap-4">
            {/* Header: Type & Dimensions */}
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Text</span>
                <div className="flex items-center gap-2 text-[10px] font-medium text-gray-400">
                    <span>W {properties.width}</span>
                    <span>H {properties.height}</span>
                </div>
            </div>

            {/* Font Family Dropdown */}
            <div className="relative">
                <div
                    onClick={() => setIsFontOpen(!isFontOpen)}
                    className="w-full flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                    <span style={{ fontFamily: properties.fontFamily }}>{properties.fontFamily}</span>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${isFontOpen ? 'rotate-180' : ''}`} />
                </div>

                {isFontOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-[100] max-h-48 overflow-y-auto custom-scrollbar">
                        {fonts.map((font) => (
                            <div
                                key={font}
                                onClick={() => {
                                    handleChange('fontFamily', font);
                                    setIsFontOpen(false);
                                }}
                                className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors ${properties.fontFamily === font ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-gray-700'}`}
                                style={{ fontFamily: font }}
                            >
                                {font}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Style & Size */}
            <div className="flex gap-2">
                <div className="flex-1 relative">
                    <div
                        onClick={() => setIsStyleOpen(!isStyleOpen)}
                        className="w-full flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                        <span>{getCurrentStyleLabel()}</span>
                        <ChevronDown size={14} className={`text-gray-400 transition-transform ${isStyleOpen ? 'rotate-180' : ''}`} />
                    </div>

                    {isStyleOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-[100] overflow-hidden">
                            {styles.map((style) => (
                                <div
                                    key={style.label}
                                    onClick={() => {
                                        handleChange(style.value);
                                        setIsStyleOpen(false);
                                    }}
                                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors ${getCurrentStyleLabel() === style.label ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-gray-700'}`}
                                    style={{
                                        fontWeight: style.value.fontWeight,
                                        fontStyle: style.value.fontStyle,
                                        textDecoration: style.value.underline ? 'underline' : 'none'
                                    }}
                                >
                                    {style.label}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="w-20 relative">
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
                        <MoveHorizontal size={12} className="text-gray-400" />
                    </div>
                    <input
                        type="number"
                        value={properties.charSpacing}
                        onChange={(e) => handleChange('charSpacing', parseInt(e.target.value))}
                        className="w-full p-2 pl-6 bg-gray-50 rounded-lg border border-gray-100 text-sm font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                </div>
            </div>

            {/* Alignment */}
            <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-100">
                <button
                    onClick={() => handleChange('textAlign', 'left')}
                    className={`flex-1 flex items-center justify-center p-1.5 rounded-md transition-all ${properties.textAlign === 'left' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <AlignLeft size={16} />
                </button>
                <button
                    onClick={() => handleChange('textAlign', 'center')}
                    className={`flex-1 flex items-center justify-center p-1.5 rounded-md transition-all ${properties.textAlign === 'center' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <AlignCenter size={16} />
                </button>
                <button
                    onClick={() => handleChange('textAlign', 'right')}
                    className={`flex-1 flex items-center justify-center p-1.5 rounded-md transition-all ${properties.textAlign === 'right' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <AlignRight size={16} />
                </button>
            </div>

            {/* Spacing & Height */}
            <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                    <ArrowUpFromLine size={14} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Auto</span>
                </div>
                <div className="flex-1 flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                    <Type size={14} className="text-gray-400" />
                    <input
                        type="number"
                        value={properties.fontSize}
                        onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
                        className="w-full bg-transparent text-sm font-medium text-gray-700 focus:outline-none"
                    />
                </div>
            </div>

            {/* Color Picker Section */}
            <div className="flex flex-col gap-3 pt-2">
                <div
                    onMouseDown={startDragging(handleSlMove)}
                    className="sl-picker w-full aspect-[4/3] rounded-lg relative overflow-hidden border border-gray-100 shadow-inner cursor-crosshair"
                    style={{ backgroundColor: `hsl(${hsv.h}, 100%, 50%)` }}
                >
                    {/* White to transparent gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
                    {/* Transparent to black gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />

                    {/* Picker indicator */}
                    <div
                        className="absolute w-3 h-3 border-2 border-white rounded-full shadow-md -translate-x-1/2 translate-y-1/2 pointer-events-none"
                        style={{
                            left: `${hsv.s}%`,
                            bottom: `${hsv.v}%`
                        }}
                    />
                </div>

                {/* Hue Slider */}
                <div
                    onMouseDown={startDragging(handleHueMove)}
                    className="hue-picker h-3 w-full rounded-full bg-gradient-to-r from-[#f00] via-[#ff0] via-[#0f0] via-[#0ff] via-[#00f] via-[#f0f] to-[#f00] shadow-inner cursor-pointer relative"
                >
                    <div
                        className="absolute top-0 bottom-0 w-1.5 bg-white border border-gray-200 shadow-sm rounded-full -translate-x-1/2 pointer-events-none"
                        style={{ left: `${(hsv.h / 360) * 100}%` }}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                        <input
                            type="text"
                            value={properties.fill.replace('#', '')}
                            onChange={(e) => handleChange('fill', '#' + e.target.value)}
                            className="w-full bg-transparent text-xs font-bold text-gray-700 focus:outline-none uppercase"
                        />
                    </div>
                    <button className="p-2 bg-gray-50 rounded-lg border border-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                        <Pipette size={16} />
                    </button>
                </div>

                {/* RGBA Inputs */}
                <div className="flex gap-1">
                    {(() => {
                        const rgb = hexToRgb(properties.fill);
                        return (
                            <>
                                {[
                                    { label: 'R', value: rgb.r },
                                    { label: 'G', value: rgb.g },
                                    { label: 'B', value: rgb.b },
                                    { label: 'A', value: 100 }
                                ].map((item) => (
                                    <div key={item.label} className="flex-1 flex flex-col items-center gap-1">
                                        <div className="w-full p-1 bg-gray-50 rounded border border-gray-100 text-[10px] font-bold text-gray-700 text-center">
                                            {item.value}
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-300">{item.label}</span>
                                    </div>
                                ))}
                            </>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
};

export default TextPropertiesPanel;
