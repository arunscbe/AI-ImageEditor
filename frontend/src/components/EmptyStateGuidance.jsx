import React, { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { getEmptyStateTools } from '../config/toolsConfig';

const EmptyStateGuidance = ({ hasCanvasObjects = false }) => {
  const { projectIntent, handleCanvasAction, setActiveTool, canvas, handleDuplicate } = useStore();
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);

  // Get tools from central config (excludes separators and hidden tools)
  const toolsConfig = getEmptyStateTools();
  const tools = toolsConfig.map(tool => ({
    ...tool,
    action: tool.getAction({ 
      canvas, 
      setActiveTool, 
      handleCanvasAction, 
      handleDuplicate 
    })
  }));

  const handleToolClick = (tool) => {
    // Trigger slide animation immediately
    setIsAnimatingOut(true);
    
    // Execute the tool action immediately (parallel with animation)
    if (tool.action) {
      tool.action();
    }

    // Stop rendering after animation completes (500ms now)
    setTimeout(() => {
      setShouldRender(false);
    }, 500);
  };

  // Trigger animation when canvas gets objects
  useEffect(() => {
    if (hasCanvasObjects && !isAnimatingOut) {
      setIsAnimatingOut(true);
      setTimeout(() => {
        setShouldRender(false);
      }, 500);
    }
  }, [hasCanvasObjects, isAnimatingOut]);

  // Reset when canvas becomes empty again
  useEffect(() => {
    if (!hasCanvasObjects) {
      setIsAnimatingOut(false);
      setShouldRender(true);
    }
  }, [hasCanvasObjects]);

  // Don't render if we've completed the exit animation
  if (!shouldRender) {
    return null;
  }

  return (
    <>
      <div 
        className={`absolute inset-0 flex items-center justify-center z-10 ${
          isAnimatingOut ? 'animate-slideOutToLeft pointer-events-none' : 'pointer-events-none'
        }`}
      >
        <div className="text-center max-w-2xl px-4 pointer-events-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-2">
            {projectIntent?.title
              ? `Ready to: ${projectIntent.title}`
              : 'Start your production workflow'}
          </h2>
          <p className="text-base text-gray-600 font-sans">
            {projectIntent?.description ||
              'Select a tool to begin'}
          </p>
          {projectIntent?.workflow && (
            <div className="mt-3 inline-block bg-white rounded-lg px-3 py-2 border border-gray-200 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 font-sans">
                Workflow Steps
              </p>
              <ol className="text-xs text-gray-700 space-y-0.5 font-sans text-left">
                {projectIntent.workflow.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-brand-primary font-semibold">
                      {idx + 1}.
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Toolbar Grid */}
        <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => handleToolClick(tool)}
                className="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-brand-primary hover:shadow-lg transition-all duration-150 flex flex-col items-center gap-2 group"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-50 group-hover:bg-red-50 flex items-center justify-center transition-colors">
                  <Icon className="text-gray-600 group-hover:text-brand-primary transition-colors" size={20} strokeWidth={1.5} />
                </div>
                <div className="text-xs font-semibold text-gray-900 font-heading">
                  {tool.label}
                </div>
                <div className="text-[10px] text-gray-500 font-sans">
                  Press {tool.shortcut}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 text-xs text-gray-500 font-sans">
          <p>
            💡 Tip: Use keyboard shortcuts for quick access
          </p>
        </div>
      </div>
    </div>

    <style>{`
      @keyframes slideOutToLeft {
        0% {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
        25% {
          opacity: 0.7;
          transform: translateX(-10%) scale(0.98);
        }
        35% {
          opacity: 0.3;
          transform: translateX(-20%) scale(0.96);
        }
        50% {
          opacity: 0;
          transform: translateX(-50%) scale(0.95);
        }
        100% {
          opacity: 0;
          transform: translateX(-100%) scale(0.95);
          visibility: hidden;
          pointer-events: none;
        }
      }
      
      .animate-slideOutToLeft {
        animation: slideOutToLeft 0.5s cubic-bezier(0.4, 0, 0.6, 1) forwards;
        pointer-events: none;
      }
    `}</style>
  </>
  );
};

export default EmptyStateGuidance;

