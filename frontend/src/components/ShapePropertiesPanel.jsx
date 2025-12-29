import React, { useState, useEffect } from 'react';
import { Pipette } from 'lucide-react';
import useStore from '../store/useStore';

const ShapePropertiesPanel = () => {
    const { selectedObject, canvas } = useStore();
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [fill, setFill] = useState('#000000');
    const [hsv, setHsv] = useState({ h: 0, s: 0, v: 0 });

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

    useEffect(() => {
        if (selectedObject) {
            const updateProps = () => {
                setDimensions({
                    width: Math.round(selectedObject.getScaledWidth()),
                    height: Math.round(selectedObject.getScaledHeight())
                });

                // Groups (arrows) - get color from first child
                let currentFill;
                if (selectedObject.type === 'group') {
                    const children = selectedObject.getObjects();
                    const firstChild = children[0];
                    currentFill = firstChild.type === 'line'
                        ? (firstChild.stroke || '#000000')
                        : (firstChild.fill || '#000000');
                } else if (selectedObject.type === 'line') {
                    currentFill = selectedObject.stroke || '#000000';
                } else {
                    currentFill = selectedObject.fill || '#000000';
                }

                setFill(currentFill);
                const rgb = hexToRgb(currentFill);
                const newHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
                setHsv(newHsv);
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

    if (!selectedObject) return null;

    // Support rect, circle, line, group (arrows), and any path-based shapes
    const shapeTypes = ['rect', 'circle', 'line', 'path', 'polygon', 'polyline', 'triangle', 'group'];
    if (!shapeTypes.includes(selectedObject.type)) return null;

    // Helper to update color for groups (arrows) - update all children
    const updateGroupColor = (color) => {
        if (selectedObject.type === 'group') {
            selectedObject.getObjects().forEach(obj => {
                if (obj.type === 'line') {
                    obj.set('stroke', color);
                } else {
                    obj.set('fill', color);
                }
            });
        }
    };

    const getShapeName = () => {
        switch (selectedObject.type) {
            case 'rect': return 'RECTANGLE';
            case 'circle': return 'CIRCLE';
            case 'line': return 'LINE';
            case 'group': return 'ARROW';
            case 'path':
            case 'polygon':
            case 'polyline':
            case 'triangle':
                return 'SHAPE';
            default: return 'SHAPE';
        }
    };

    const isLineType = selectedObject.type === 'line';

    const handleSlMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));

        const newS = x * 100;
        const newV = y * 100;

        const newRgb = hsvToRgb(hsv.h, newS, newV);
        const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);

        // Handle different object types
        if (selectedObject.type === 'group') {
            updateGroupColor(newHex);
        } else if (isLineType) {
            selectedObject.set('stroke', newHex);
        } else {
            selectedObject.set('fill', newHex);
        }
        canvas.renderAll();
        setFill(newHex);
        setHsv({ h: hsv.h, s: newS, v: newV });
    };

    const handleHueMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const newH = x * 360;

        const newRgb = hsvToRgb(newH, hsv.s, hsv.v);
        const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);

        // Handle different object types
        if (selectedObject.type === 'group') {
            updateGroupColor(newHex);
        } else if (isLineType) {
            selectedObject.set('stroke', newHex);
        } else {
            selectedObject.set('fill', newHex);
        }
        canvas.renderAll();
        setFill(newHex);
        setHsv({ h: newH, s: hsv.s, v: hsv.v });
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

    const handleHexChange = (e) => {
        let hex = e.target.value.replace('#', '');
        if (hex.length === 6 && /^[0-9A-Fa-f]{6}$/.test(hex)) {
            const fullHex = '#' + hex;

            // Handle different object types
            if (selectedObject.type === 'group') {
                updateGroupColor(fullHex);
            } else if (isLineType) {
                selectedObject.set('stroke', fullHex);
            } else {
                selectedObject.set('fill', fullHex);
            }
            canvas.renderAll();
            setFill(fullHex);
            const rgb = hexToRgb(fullHex);
            const newHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
            setHsv(newHsv);
        }
    };

    const rgb = hexToRgb(fill);

    return (
        <div className="absolute top-3 left-6 z-10 w-[300px] bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-5 border border-gray-100/50 flex flex-col gap-5 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-indigo-500 tracking-widest">{getShapeName()}</span>
                <div className="flex items-center gap-2 text-[10px] font-medium text-gray-400">
                    <span>W {dimensions.width}</span>
                    <span>H {dimensions.height}</span>
                </div>
            </div>

            {/* Color Picker Section */}
            <div className="flex flex-col gap-3">
                {/* S/V Picker */}
                <div
                    onMouseDown={startDragging(handleSlMove)}
                    className="w-full aspect-[4/3] rounded-lg relative overflow-hidden border border-gray-100 shadow-inner cursor-crosshair"
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
                    className="h-3 w-full rounded-full bg-gradient-to-r from-[#f00] via-[#ff0] via-[#0f0] via-[#0ff] via-[#00f] via-[#f0f] to-[#f00] shadow-inner cursor-pointer relative"
                >
                    <div
                        className="absolute top-0 bottom-0 w-1.5 bg-white border border-gray-200 shadow-sm rounded-full -translate-x-1/2 pointer-events-none"
                        style={{ left: `${(hsv.h / 360) * 100}%` }}
                    />
                </div>

                {/* Hex Input */}
                <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <input
                            type="text"
                            value={fill.replace('#', '')}
                            onChange={handleHexChange}
                            className="w-full bg-transparent text-sm font-semibold text-gray-700 focus:outline-none uppercase"
                            maxLength={6}
                        />
                    </div>
                    <button className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                        <Pipette size={16} />
                    </button>
                </div>

                {/* RGBA Displays */}
                <div className="flex gap-2">
                    {[
                        { label: 'R', value: rgb.r },
                        { label: 'G', value: rgb.g },
                        { label: 'B', value: rgb.b },
                        { label: 'A', value: 100 }
                    ].map((item) => (
                        <div key={item.label} className="flex-1 flex flex-col items-center gap-1.5">
                            <div className="w-full p-2 bg-gray-50 rounded-lg border border-gray-100 text-xs font-bold text-gray-700 text-center">
                                {item.value}
                            </div>
                            <span className="text-[10px] font-bold text-gray-300">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ShapePropertiesPanel;
