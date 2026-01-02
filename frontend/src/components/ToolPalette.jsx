import React, { useState, useEffect } from 'react';
import {
    MousePointer2,
    Type,
    Pencil,
    Square,
    Circle,
    Upload,
    ZoomIn,
    Hand,
    Eraser,
    Image as ImageIcon,
    Move,
    Copy
} from 'lucide-react';
import useStore from '../store/useStore';

const ToolPalette = () => {
    const { activeTool, setActiveTool, handleCanvasAction, canvas, handleDuplicate, selectedObject } = useStore();
    const [hoveredTool, setHoveredTool] = useState(null);

    const tools = [
        { 
            id: 'select', 
            icon: MousePointer2, 
            label: 'Select / Move',
            shortcut: 'V',
            action: () => {
                if (canvas) {
                    canvas.isDrawingMode = false;
                    canvas.selection = true;
                    canvas.forEachObject(obj => {
                        obj.selectable = true;
                        obj.evented = true;
                    });
                }
                setActiveTool('select');
            }
        },
        { 
            id: 'duplicate', 
            icon: Copy, 
            label: 'Duplicate',
            shortcut: 'D',
            action: () => handleDuplicate(),
            requiresSelection: true
        },
        { 
            type: 'separator' 
        },
        { 
            id: 'text', 
            icon: Type, 
            label: 'Text',
            shortcut: 'T',
            action: () => handleCanvasAction('ADD_TEXT')
        },
        { 
            id: 'brush', 
            icon: Pencil, 
            label: 'Brush',
            shortcut: 'B',
            action: () => handleCanvasAction('TOGGLE_BRUSH')
        },
        { 
            id: 'shape-rect', 
            icon: Square, 
            label: 'Rectangle',
            shortcut: 'R',
            action: () => handleCanvasAction('ADD_RECTANGLE')
        },
        { 
            id: 'shape-circle', 
            icon: Circle, 
            label: 'Circle',
            shortcut: 'C',
            action: () => handleCanvasAction('ADD_CIRCLE')
        },
        { 
            id: 'upload', 
            icon: Upload, 
            label: 'Upload Image',
            shortcut: 'U',
            action: () => setActiveTool('upload')
        },
        { 
            id: 'ai-image', 
            icon: ImageIcon, 
            label: 'AI Generate',
            shortcut: 'G',
            action: () => handleCanvasAction('Image')
        },
        { 
            type: 'separator' 
        },
        { 
            id: 'zoom', 
            icon: ZoomIn, 
            label: 'Zoom',
            shortcut: 'Z',
            action: () => {
                setActiveTool('zoom');
            }
        },
        { 
            id: 'pan', 
            icon: Hand, 
            label: 'Pan / Hand',
            shortcut: 'H',
            action: () => {
                if (canvas) {
                    canvas.isDrawingMode = false;
                }
                setActiveTool('pan');
            }
        }
    ];

    const handleToolClick = (tool) => {
        if (tool.requiresSelection && !selectedObject) {
            console.warn('This action requires a selected object');
            return;
        }
        
        if (tool.action) {
            tool.action();
            if (tool.id !== 'upload' && tool.id !== 'ai-image' && tool.id !== 'duplicate') {
                setActiveTool(tool.id);
            }
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            const key = e.key.toUpperCase();
            const tool = tools.find(t => t.shortcut === key);
            
            if (tool) {
                if (tool.requiresSelection && !selectedObject) {
                    return;
                }
                e.preventDefault();
                handleToolClick(tool);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [tools, canvas, selectedObject]);

    return (
        <>
            <div className="fixed left-4 top-1/2 -translate-y-1/2 z-20 bg-white rounded-lg shadow-md border border-gray-200 p-1.5 flex flex-col gap-0.5">
                {tools.map((tool, index) => {
                    if (tool.type === 'separator') {
                        return (
                            <div 
                                key={`separator-${index}`} 
                                className="h-px bg-gray-200 my-0.5"
                            />
                        );
                    }

                    const Icon = tool.icon;
                    const isActive = activeTool === tool.id;
                    const isDisabled = tool.requiresSelection && !selectedObject;

                    return (
                        <button
                            key={tool.id}
                            onClick={() => handleToolClick(tool)}
                            onMouseEnter={() => setHoveredTool(tool.id)}
                            onMouseLeave={() => setHoveredTool(null)}
                            disabled={isDisabled}
                            className={`
                                relative w-9 h-9 rounded-lg flex items-center justify-center
                                transition-all duration-150 ease-out
                                ${isDisabled
                                    ? 'text-gray-300 cursor-not-allowed opacity-50'
                                    : isActive 
                                    ? 'bg-brand-primary text-white' 
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }
                            `}
                            title={`${tool.label} (${tool.shortcut})`}
                        >
                            <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                        </button>
                    );
                })}
            </div>

            {hoveredTool && (
                <div 
                    className="fixed left-20 top-1/2 -translate-y-1/2 z-30 pointer-events-none"
                    style={{
                        animation: 'fadeIn 0.15s ease-out'
                    }}
                >
                    <div className="bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-lg">
                        <div className="font-medium font-sans">
                            {tools.find(t => t.id === hoveredTool)?.label}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5 font-sans">
                            Press {tools.find(t => t.id === hoveredTool)?.shortcut}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateX(-5px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
            `}</style>
        </>
    );
};

export default ToolPalette;

