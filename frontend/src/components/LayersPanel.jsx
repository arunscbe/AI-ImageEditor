import React, { useEffect } from 'react';
import {
    Eye,
    EyeOff,
    Lock,
    Unlock,
    ChevronUp,
    ChevronDown,
    Trash2,
    Type,
    Image as ImageIcon,
    Square,
    Circle,
    Layers
} from 'lucide-react';
import useStore from '../store/useStore';

const LayersPanel = () => {
    const {
        layers,
        selectedObject,
        setSelectedObject,
        bringForward,
        sendBackward,
        toggleVisibility,
        toggleLock,
        deleteObject,
        canvas,
        isLayersPanelOpen
    } = useStore();

    const getIcon = (type) => {
        switch (type) {
            case 'i-text': return Type;
            case 'fabric-image': return ImageIcon;
            case 'rect': return Square;
            case 'circle': return Circle;
            default: return Layers;
        }
    };

    const getLabel = (obj) => {
        if (obj.type === 'i-text') return obj.text.substring(0, 15) || 'Text';
        if (obj.type === 'fabric-image') return 'Image';
        if (obj.type === 'group') return 'Arrow';
        return obj.type.charAt(0).toUpperCase() + obj.type.slice(1);
    };

    if (layers.length === 0) return null;
    if (!isLayersPanelOpen) return null;

    return (
        <div className="absolute top-3 right-6 z-10 w-[240px] bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-4 border border-gray-100/50 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Layers</span>
                <span className="text-[10px] font-medium text-gray-400">{layers.length} items</span>
            </div>

            <div className="flex flex-col gap-1 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {layers.map((obj, index) => {
                    const Icon = getIcon(obj.type);
                    const isSelected = selectedObject === obj;
                    const isVisible = obj.visible;
                    const isLocked = obj.lockMovementX;

                    return (
                        <div
                            key={index}
                            onClick={() => {
                                if (canvas) {
                                    canvas.setActiveObject(obj);
                                    canvas.renderAll();
                                }
                                setSelectedObject(obj);
                            }}
                            className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all border ${isSelected ? 'bg-indigo-50 border-indigo-100 shadow-sm' : 'bg-transparent border-transparent hover:bg-gray-50'}`}
                        >
                            {/* Visibility Toggle */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleVisibility(obj);
                                }}
                                className={`p-1 rounded hover:bg-white transition-colors ${isVisible ? 'text-gray-400' : 'text-gray-300'}`}
                            >
                                {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                            </button>

                            {/* Icon & Label */}
                            <div className="flex-1 flex items-center gap-2 overflow-hidden">
                                <Icon size={14} className={isSelected ? 'text-indigo-600' : 'text-gray-500'} />
                                <span className={`text-xs font-medium truncate ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>
                                    {getLabel(obj)}
                                </span>
                            </div>

                            {/* Actions (Locked/Order/Delete) */}
                            <div className={`flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${isSelected ? 'opacity-100' : ''}`}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleLock(obj);
                                    }}
                                    className={`p-1 rounded hover:bg-white transition-colors ${isLocked ? 'text-amber-500' : 'text-gray-400'}`}
                                >
                                    {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                                </button>

                                <div className="flex flex-col gap-0">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            bringForward(obj);
                                        }}
                                        className="p-0.5 rounded hover:bg-white text-gray-400"
                                    >
                                        <ChevronUp size={12} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            sendBackward(obj);
                                        }}
                                        className="p-0.5 rounded hover:bg-white text-gray-400"
                                    >
                                        <ChevronDown size={12} />
                                    </button>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteObject(obj);
                                    }}
                                    className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LayersPanel;
