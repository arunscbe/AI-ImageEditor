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

const TextPropertiesPanel = ({ embedded = false, flattened = false }) => {
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

    const [isFontOpen, setIsFontOpen] = useState(false);
    const [isStyleOpen, setIsStyleOpen] = useState(false);

    const fonts = ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Playfair Display', 'Merriweather'];
    const styles = [
        { label: 'Normal', value: { fontWeight: 'normal', fontStyle: 'normal', underline: false } },
        { label: 'Bold', value: { fontWeight: 'bold', fontStyle: 'normal', underline: false } },
        { label: 'Italic', value: { fontWeight: 'normal', fontStyle: 'italic', underline: false } },
        { label: 'Bold Italic', value: { fontWeight: 'bold', fontStyle: 'italic', underline: false } },
        { label: 'Underline', value: { fontWeight: 'normal', fontStyle: 'normal', underline: true } },
    ];

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

    const getCurrentStyleLabel = () => {
        const found = styles.find(s => 
            s.value.fontWeight === properties.fontWeight &&
            s.value.fontStyle === properties.fontStyle &&
            s.value.underline === properties.underline
        );
        return found ? found.label : 'Normal';
    };

    const contentSections = (
        <div className="flex flex-col gap-2.5">
            {/* Font Family */}
            <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-medium text-gray-500 font-sans">Font</span>
                <div className="relative">
                    <div
                        onClick={() => setIsFontOpen(!isFontOpen)}
                        className="w-full flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors duration-150"
                    >
                        <span style={{ fontFamily: properties.fontFamily }}>{properties.fontFamily}</span>
                        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-150 ${isFontOpen ? 'rotate-180' : ''}`} />
                    </div>

                    {isFontOpen && (
                        <>
                            <div 
                                className="fixed inset-0 z-[100]"
                                onClick={() => setIsFontOpen(false)}
                            />
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[101] max-h-48 overflow-y-auto">
                                {fonts.map((font) => (
                                <div
                                    key={font}
                                    onClick={() => {
                                        handleChange('fontFamily', font);
                                        setIsFontOpen(false);
                                    }}
                                    className={`px-3 py-2 text-xs cursor-pointer hover:bg-gray-50 transition-colors duration-150 font-sans ${properties.fontFamily === font ? 'bg-red-50 text-brand-primary font-semibold' : 'text-gray-700'}`}
                                    style={{ fontFamily: font }}
                                >
                                    {font}
                                </div>
                            ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Style & Size */}
            <div className="flex gap-2">
                <div className="flex-1 flex flex-col gap-1.5">
                    <span className="text-[10px] font-medium text-gray-500 font-sans">Style</span>
                    <div className="relative">
                        <div
                            onClick={() => setIsStyleOpen(!isStyleOpen)}
                            className="w-full flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors duration-150"
                        >
                            <span>{getCurrentStyleLabel()}</span>
                            <ChevronDown size={14} className={`text-gray-400 transition-transform duration-150 ${isStyleOpen ? 'rotate-180' : ''}`} />
                        </div>

                        {isStyleOpen && (
                            <>
                                <div 
                                    className="fixed inset-0 z-[100]"
                                    onClick={() => setIsStyleOpen(false)}
                                />
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[101] overflow-hidden">
                                    {styles.map((style) => (
                                    <div
                                        key={style.label}
                                        onClick={() => {
                                            handleChange(style.value);
                                            setIsStyleOpen(false);
                                        }}
                                        className={`px-3 py-2 text-xs cursor-pointer hover:bg-gray-50 transition-colors duration-150 font-sans ${getCurrentStyleLabel() === style.label ? 'bg-red-50 text-brand-primary font-semibold' : 'text-gray-700'}`}
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
                            </>
                        )}
                    </div>
                </div>
                <div className="w-20 flex flex-col gap-1.5">
                    <span className="text-[10px] font-medium text-gray-500 font-sans">Size</span>
                    <input
                        type="number"
                        value={properties.fontSize}
                        onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
                        className="w-full p-2 bg-gray-50 rounded-lg border border-gray-200 text-xs text-center font-medium text-gray-700 focus:outline-none focus:border-brand-primary font-sans"
                    />
                </div>
            </div>

            {/* Alignment */}
            <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-medium text-gray-500 font-sans">Alignment</span>
                <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-200">
                    <button
                        onClick={() => handleChange('textAlign', 'left')}
                        className={`flex-1 flex items-center justify-center p-1.5 rounded-md transition-all duration-150 ${properties.textAlign === 'left' ? 'bg-white shadow-sm text-brand-primary' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <AlignLeft size={16} />
                    </button>
                    <button
                        onClick={() => handleChange('textAlign', 'center')}
                        className={`flex-1 flex items-center justify-center p-1.5 rounded-md transition-all duration-150 ${properties.textAlign === 'center' ? 'bg-white shadow-sm text-brand-primary' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <AlignCenter size={16} />
                    </button>
                    <button
                        onClick={() => handleChange('textAlign', 'right')}
                        className={`flex-1 flex items-center justify-center p-1.5 rounded-md transition-all duration-150 ${properties.textAlign === 'right' ? 'bg-white shadow-sm text-brand-primary' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <AlignRight size={16} />
                    </button>
                </div>
            </div>

            {/* Color */}
            <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-medium text-gray-500 font-sans">Color</span>
                <div className="flex items-center gap-2">
                    <input
                        type="color"
                        value={properties.fill}
                        onChange={(e) => handleChange('fill', e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200"
                    />
                    <input
                        type="text"
                        value={properties.fill}
                        onChange={(e) => handleChange('fill', e.target.value)}
                        className="flex-1 px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-gray-700 focus:outline-none focus:border-brand-primary"
                        placeholder="#000000"
                    />
                </div>
            </div>

            {/* Line Height & Char Spacing */}
            <div className="flex gap-2">
                <div className="flex-1 flex flex-col gap-1.5">
                    <span className="text-[10px] font-medium text-gray-500 font-sans">Line Height</span>
                    <input
                        type="number"
                        step="0.1"
                        value={properties.lineHeight}
                        onChange={(e) => handleChange('lineHeight', parseFloat(e.target.value))}
                        className="w-full p-2 bg-gray-50 rounded-lg border border-gray-200 text-xs text-center font-medium text-gray-700 focus:outline-none focus:border-brand-primary font-sans"
                    />
                </div>
                <div className="flex-1 flex flex-col gap-1.5">
                    <span className="text-[10px] font-medium text-gray-500 font-sans">Letter Spacing</span>
                    <input
                        type="number"
                        value={properties.charSpacing}
                        onChange={(e) => handleChange('charSpacing', parseInt(e.target.value))}
                        className="w-full p-2 bg-gray-50 rounded-lg border border-gray-200 text-xs text-center font-medium text-gray-700 focus:outline-none focus:border-brand-primary font-sans"
                    />
                </div>
            </div>
        </div>
    );

    if (embedded && flattened) {
        return contentSections;
    }

    if (embedded) {
        return (
            <div className="flex flex-col gap-2.5">
                {contentSections}
            </div>
        );
    }

    return (
        <div className="absolute top-[250px] right-4 z-10 w-[240px] bg-white rounded-lg shadow-md p-2.5 border border-gray-200 flex flex-col gap-2.5 max-h-[calc(100vh-270px)] overflow-y-auto">
            {contentSections}
        </div>
    );
};

export default TextPropertiesPanel;
