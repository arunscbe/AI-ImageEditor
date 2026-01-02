import React from 'react';
import useStore from '../store/useStore';
import { Minus, Plus } from 'lucide-react';

const BrushSettings = ({ embedded = false }) => {
  const { activeTool, brushSize, setBrushSize, brushColor, setBrushColor } = useStore();

  if (activeTool !== 'brush' && activeTool !== 'eraser') {
    return null;
  }

  if (embedded) {
    return (
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2.5">
          <span className="text-[10px] font-medium text-gray-600 font-sans">Size</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setBrushSize(Math.max(1, brushSize - 2))}
              className="w-5 h-5 rounded bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors duration-150"
            >
              <Minus size={10} />
            </button>
            <div className="w-10 text-center">
              <span className="text-[10px] font-semibold text-gray-900 font-sans">{brushSize}px</span>
            </div>
            <button
              onClick={() => setBrushSize(Math.min(100, brushSize + 2))}
              className="w-5 h-5 rounded bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors duration-150"
            >
              <Plus size={10} />
            </button>
          </div>
        </div>

        <div className="relative">
          <input
            type="range"
            min="1"
            max="100"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-full h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer accent-brand-primary"
          />
        </div>

        {activeTool === 'brush' && (
          <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-gray-200">
            <span className="text-[10px] font-medium text-gray-600 font-sans">Color</span>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className="w-7 h-7 rounded-md cursor-pointer border border-gray-200"
              />
              <span className="text-[9px] text-gray-400 uppercase font-mono">{brushColor}</span>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-gray-200">
          <div className="text-[9px] text-gray-400 text-center font-sans">
            Press <kbd className="px-1 py-0.5 bg-gray-50 rounded border border-gray-200 font-mono text-[8px]">Esc</kbd> to exit
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-[200px] right-4 z-10 w-[240px] bg-white rounded-lg shadow-md p-2.5 border border-gray-200">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[9px] font-bold text-gray-400 tracking-widest uppercase font-sans">
          {activeTool === 'eraser' ? 'ERASER' : 'BRUSH'}
        </span>
      </div>
      
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2.5">
          <span className="text-[10px] font-medium text-gray-600 font-sans">Size</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setBrushSize(Math.max(1, brushSize - 2))}
              className="w-5 h-5 rounded bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors duration-150"
            >
              <Minus size={10} />
            </button>
            <div className="w-10 text-center">
              <span className="text-[10px] font-semibold text-gray-900 font-sans">{brushSize}px</span>
            </div>
            <button
              onClick={() => setBrushSize(Math.min(100, brushSize + 2))}
              className="w-5 h-5 rounded bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors duration-150"
            >
              <Plus size={10} />
            </button>
          </div>
        </div>

        <div className="relative">
          <input
            type="range"
            min="1"
            max="100"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-full h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer accent-brand-primary"
          />
        </div>

        {activeTool === 'brush' && (
          <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-gray-200">
            <span className="text-[10px] font-medium text-gray-600 font-sans">Color</span>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className="w-7 h-7 rounded-md cursor-pointer border border-gray-200"
              />
              <span className="text-[9px] text-gray-400 uppercase font-mono">{brushColor}</span>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-gray-200">
          <div className="text-[9px] text-gray-400 text-center font-sans">
            Press <kbd className="px-1 py-0.5 bg-gray-50 rounded border border-gray-200 font-mono text-[8px]">Esc</kbd> to exit
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrushSettings;

