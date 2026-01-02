import React, { useState } from 'react';
import { 
    ChevronUp, 
    ChevronDown, 
    Layers as LayersIcon,
    Palette,
    Sliders,
    Sparkles,
    Plus,
    Brush,
    Type
} from 'lucide-react';
import useStore from '../store/useStore';
import LayersPanel from './LayersPanel';
import ImagePropertiesPanel from './ImagePropertiesPanel';
import TextPropertiesPanel from './TextPropertiesPanel';
import BrushSettings from './BrushSettings';

const RightPanel = () => {
    const { selectedObject, layers, activeTool } = useStore();
    const [openSections, setOpenSections] = useState({
        layers: true,
        brush: true,
        text: true,
    });

    const toggleSection = (section) => {
        setOpenSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const isTextSelected = selectedObject?.type === 'i-text';
    const isImageOrVectorSelected = selectedObject && 
        (selectedObject.type === 'image' || ['rect', 'circle', 'line', 'path', 'polygon', 'polyline', 'triangle', 'group'].includes(selectedObject.type));
    
    const isBrushActive = activeTool === 'brush' || activeTool === 'eraser';

    if (layers.length === 0 && !selectedObject && !isBrushActive) return null;

    return (
        <div className="fixed top-16 right-4 z-10 w-[240px] bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden max-h-[calc(100vh-88px)] flex flex-col">
            
            {layers.length > 0 && (
                <div className="border-b border-gray-200">
                    <button
                        onClick={() => toggleSection('layers')}
                        className="w-full px-2.5 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors duration-150 group"
                    >
                        <div className="flex items-center gap-1.5">
                            <LayersIcon size={14} className="text-brand-primary" />
                            <span className="font-semibold text-gray-900 text-xs font-heading">Layers</span>
                            <span className="text-[9px] text-gray-400 font-medium font-sans">{layers.length}</span>
                        </div>
                        <ChevronDown 
                            size={14} 
                            className={`text-gray-400 transition-transform duration-150 ${openSections.layers ? 'rotate-180' : ''}`}
                        />
                    </button>
                    
                    <div 
                        className={`overflow-hidden transition-all duration-200 ease-in-out ${
                            openSections.layers ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
                        }`}
                    >
                        <div className="px-2.5 pb-2 max-h-[200px] overflow-y-auto">
                            <LayersPanel embedded={true} />
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto">
                {isBrushActive && (
                    <div className="border-b border-gray-200">
                        <button
                            onClick={() => toggleSection('brush')}
                            className="w-full px-2.5 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors duration-150 group"
                        >
                            <div className="flex items-center gap-1.5">
                                <Brush size={14} className="text-brand-primary" />
                                <span className="font-semibold text-gray-900 text-xs font-heading">
                                    {activeTool === 'eraser' ? 'Eraser' : 'Brush'}
                                </span>
                            </div>
                            <ChevronDown 
                                size={14} 
                                className={`text-gray-400 transition-transform duration-150 ${openSections.brush ? 'rotate-180' : ''}`}
                            />
                        </button>
                        
                        <div 
                            className={`overflow-hidden transition-all duration-200 ease-in-out ${
                                openSections.brush ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                            }`}
                        >
                            <div className="px-2.5 pb-2.5">
                                <BrushSettings embedded={true} />
                            </div>
                        </div>
                    </div>
                )}
                
                {isTextSelected && (
                    <div className="border-b border-gray-200">
                        <button
                            onClick={() => toggleSection('text')}
                            className="w-full px-2.5 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors duration-150 group"
                        >
                            <div className="flex items-center gap-1.5">
                                <Type size={14} className="text-brand-primary" />
                                <span className="font-semibold text-gray-900 text-xs font-heading">Text</span>
                            </div>
                            <ChevronDown 
                                size={14} 
                                className={`text-gray-400 transition-transform duration-150 ${openSections.text ? 'rotate-180' : ''}`}
                            />
                        </button>
                        
                        <div 
                            className={`overflow-hidden transition-all duration-200 ease-in-out ${
                                openSections.text ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                            }`}
                        >
                            <div className="px-2.5 pb-2.5">
                                <TextPropertiesPanel embedded={true} flattened={true} />
                            </div>
                        </div>
                    </div>
                )}
                
                {isImageOrVectorSelected && <ImagePropertiesPanel embedded={true} flattened={true} />}
            </div>

            {layers.length === 0 && !selectedObject && !isBrushActive && (
                <div className="px-2.5 py-4 text-center text-gray-400 text-xs font-sans">
                    No layers or objects selected
                </div>
            )}
        </div>
    );
};

export default RightPanel;
