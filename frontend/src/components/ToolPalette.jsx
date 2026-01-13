import React, { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { getToolbarTools } from '../config/toolsConfig';

const ToolPalette = ({ hasCanvasObjects = false }) => {
    const { activeTool, setActiveTool, handleCanvasAction, canvas, handleDuplicate, selectedObject } = useStore();
    const [hoveredTool, setHoveredTool] = useState(null);

    // Get tools from central config and bind actions
    const toolsConfig = getToolbarTools();
    const tools = toolsConfig.map(tool => {
        if (tool.type === 'separator') {
            return tool;
        }
        
        return {
            ...tool,
            action: tool.getAction({ 
                canvas, 
                setActiveTool, 
                handleCanvasAction, 
                handleDuplicate 
            })
        };
    });

    const handleToolClick = (tool) => {
        if (tool.requiresSelection && !selectedObject) {
            return;
        }
        
        if (tool.action) {
            tool.action();
            if (tool.id !== 'upload' && tool.id !== 'blank-canvas' && tool.id !== 'duplicate') {
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

    // Don't render at all if no objects
    if (!hasCanvasObjects) {
        return null;
    }

    return (
        <>
            <div 
                className="fixed top-1/2 -translate-y-1/2 z-20 bg-white rounded-lg shadow-md border border-gray-200 p-1.5 flex flex-col gap-0.5"
                style={{
                    animation: 'slideInFromCenter 0.5s cubic-bezier(0.4, 0, 0.6, 1) forwards',
                }}
            >
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
                            {tools.find(t => t.id === hoveredTool)?.description || tools.find(t => t.id === hoveredTool)?.label}
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
                
                @keyframes slideInFromCenter {
                    0% {
                        opacity: 0;
                        left: 50%;
                        transform: translateX(-50%) translateY(-50%) scale(0.95);
                    }
                    35% {
                        opacity: 0;
                        left: 40%;
                        transform: translateX(-50%) translateY(-50%) scale(0.96);
                    }
                    50% {
                        opacity: 0.5;
                        left: 25%;
                        transform: translateX(-50%) translateY(-50%) scale(0.98);
                    }
                    75% {
                        opacity: 0.8;
                        left: 10%;
                        transform: translateX(-50%) translateY(-50%) scale(0.99);
                    }
                    100% {
                        opacity: 1;
                        left: 1rem;
                        transform: translateX(0) translateY(-50%) scale(1);
                    }
                }
            `}</style>
        </>
    );
};

export default ToolPalette;

