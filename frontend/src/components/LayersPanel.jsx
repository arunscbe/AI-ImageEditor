import React, { useEffect, useState } from 'react';
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
    Layers,
    Edit2
} from 'lucide-react';
import useStore from '../store/useStore';

const LayersPanel = ({ embedded = false }) => {
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
        isLayersPanelOpen,
        updateLayers
    } = useStore();

    const [editingIndex, setEditingIndex] = useState(null);
    const [editingName, setEditingName] = useState('');

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
        // Use stored name if available
        if (obj.name) return obj.name;
        
        // Fallback to default labels
        if (obj.type === 'i-text') return obj.text.substring(0, 15) || 'Text';
        if (obj.type === 'fabric-image' || obj.type === 'image') return 'Image';
        if (obj.type === 'group') return 'Group';
        return obj.type.charAt(0).toUpperCase() + obj.type.slice(1);
    };

    const getObjectType = (obj) => {
        // Determine if object is Vector or Raster
        const vectorTypes = ['group', 'path', 'polygon', 'polyline', 'rect', 'circle', 'ellipse', 'line', 'triangle', 'i-text'];
        
        if (vectorTypes.includes(obj.type)) {
            return 'vector';
        }
        
        if (obj.type === 'image' || obj.type === 'fabric-image') {
            return 'raster';
        }
        
        return 'unknown';
    };

    const TypeBadge = ({ type }) => {
        if (type === 'vector') {
            return (
                <span className="px-0.5 py-[1px] text-[7px] font-bold rounded bg-green-100 text-green-700 font-mono align-super leading-none" title="Vector">
                    V
                </span>
            );
        }
        if (type === 'raster') {
            return (
                <span className="px-0.5 py-[1px] text-[7px] font-bold rounded bg-blue-100 text-blue-700 font-mono align-super leading-none" title="Raster">
                    R
                </span>
            );
        }
        return null;
    };

    const handleRename = (obj, index) => {
        setEditingIndex(index);
        setEditingName(getLabel(obj));
    };

    const handleSaveRename = (obj, index) => {
        if (editingName.trim()) {
            obj.set('name', editingName.trim());
            canvas?.renderAll();
            updateLayers();
        }
        setEditingIndex(null);
        setEditingName('');
    };

    const handleCancelRename = () => {
        setEditingIndex(null);
        setEditingName('');
    };

    if (layers.length === 0) return null;
    if (!embedded && !isLayersPanelOpen) return null;

    if (embedded) {
        return (
            <div className="flex flex-col gap-0.5">
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
                            className={`group flex items-center gap-1.5 p-1.5 rounded-lg cursor-pointer transition-all duration-150 border ${isSelected ? 'bg-red-50 border-brand-primary' : 'bg-transparent border-transparent hover:bg-gray-50'}`}
                        >
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleVisibility(obj);
                                }}
                                className={`p-0.5 rounded hover:bg-white transition-colors ${isVisible ? 'text-gray-400' : 'text-gray-300'}`}
                            >
                                {isVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                            </button>

                            <div className="flex-1 flex items-center gap-1.5 overflow-hidden">
                                <Icon size={13} className={isSelected ? 'text-brand-primary' : 'text-gray-500'} />
                                {editingIndex === index ? (
                                    <input
                                        type="text"
                                        value={editingName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        onBlur={() => handleSaveRename(obj, index)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveRename(obj, index);
                                            if (e.key === 'Escape') handleCancelRename();
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        autoFocus
                                        className="flex-1 text-xs font-medium px-1 py-0.5 border border-brand-primary rounded-md focus:outline-none font-sans"
                                    />
                                ) : (
                                    <>
                                        <span 
                                            className={`text-xs font-medium truncate font-sans ${isSelected ? 'text-brand-dark' : 'text-gray-700'}`}
                                            onDoubleClick={(e) => {
                                                e.stopPropagation();
                                                handleRename(obj, index);
                                            }}
                                            title="Double-click to rename"
                                        >
                                            {getLabel(obj)}
                                        </span>
                                        <TypeBadge type={getObjectType(obj)} />
                                    </>
                                )}
                            </div>

                            <div className={`flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${isSelected ? 'opacity-100' : ''}`}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleLock(obj);
                                    }}
                                    className="p-0.5 hover:bg-white rounded transition-colors text-gray-400"
                                >
                                    {isLocked ? <Lock size={11} /> : <Unlock size={11} />}
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        bringForward(obj);
                                    }}
                                    className="p-0.5 hover:bg-white rounded transition-colors text-gray-400"
                                >
                                    <ChevronUp size={11} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        sendBackward(obj);
                                    }}
                                    className="p-0.5 hover:bg-white rounded transition-colors text-gray-400"
                                >
                                    <ChevronDown size={11} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteObject(obj);
                                    }}
                                    className="p-0.5 hover:bg-red-100 rounded transition-colors text-gray-400 hover:text-red-600"
                                >
                                    <Trash2 size={11} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="absolute top-3 right-4 z-10 w-[240px] bg-white rounded-lg shadow-md p-3 border border-gray-200 flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase font-sans">Layers</span>
                <span className="text-[9px] font-medium text-gray-400 font-sans">{layers.length} items</span>
            </div>

            <div className="flex flex-col gap-0.5 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
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
                            className={`group flex items-center gap-1.5 p-1.5 rounded-lg cursor-pointer transition-all duration-150 border ${isSelected ? 'bg-red-50 border-brand-primary' : 'bg-transparent border-transparent hover:bg-gray-50'}`}
                        >
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleVisibility(obj);
                                }}
                                className={`p-0.5 rounded hover:bg-white transition-colors ${isVisible ? 'text-gray-400' : 'text-gray-300'}`}
                            >
                                {isVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                            </button>

                            <div className="flex-1 flex items-center gap-1.5 overflow-hidden">
                                <Icon size={13} className={isSelected ? 'text-brand-primary' : 'text-gray-500'} />
                                {editingIndex === index ? (
                                    <input
                                        type="text"
                                        value={editingName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        onBlur={() => handleSaveRename(obj, index)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveRename(obj, index);
                                            if (e.key === 'Escape') handleCancelRename();
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        autoFocus
                                        className="flex-1 text-xs font-medium px-1 py-0.5 border border-brand-primary rounded-md focus:outline-none font-sans"
                                    />
                                ) : (
                                    <>
                                        <span 
                                            className={`text-xs font-medium truncate font-sans ${isSelected ? 'text-brand-dark' : 'text-gray-700'}`}
                                            onDoubleClick={(e) => {
                                                e.stopPropagation();
                                                handleRename(obj, index);
                                            }}
                                            title="Double-click to rename"
                                        >
                                            {getLabel(obj)}
                                        </span>
                                        <TypeBadge type={getObjectType(obj)} />
                                    </>
                                )}
                            </div>

                            <div className={`flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${isSelected ? 'opacity-100' : ''}`}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleLock(obj);
                                    }}
                                    className={`p-0.5 rounded hover:bg-white transition-colors ${isLocked ? 'text-amber-500' : 'text-gray-400'}`}
                                >
                                    {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                                </button>

                                <div className="flex flex-col gap-0">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            bringForward(obj);
                                        }}
                                        className="p-0.5 rounded hover:bg-white text-gray-400"
                                    >
                                        <ChevronUp size={11} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            sendBackward(obj);
                                        }}
                                        className="p-0.5 rounded hover:bg-white text-gray-400"
                                    >
                                        <ChevronDown size={11} />
                                    </button>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteObject(obj);
                                    }}
                                    className="p-0.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={12} />
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
