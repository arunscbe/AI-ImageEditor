import React, { useState, useRef, useEffect } from 'react';
import { Lasso, Paintbrush, Square, Wand2, X, Check } from 'lucide-react';
import useStore from '../store/useStore';
import Button from './ui/Button';

const EnhancedEraseRegionTool = () => {
  const { selectedObject, eraseRegion } = useStore();
  const [isDrawing, setIsDrawing] = useState(false);
  const [maskCanvas, setMaskCanvas] = useState(null);
  const [maskCtx, setMaskCtx] = useState(null);
  const [brushSize, setBrushSize] = useState(20);
  const [selectionTool, setSelectionTool] = useState('brush');
  const [isAltPressed, setIsAltPressed] = useState(false);
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [lassoPoints, setLassoPoints] = useState([]);

  const tools = [
    { id: 'lasso', icon: Lasso, label: 'Lasso' },
    { id: 'brush', icon: Paintbrush, label: 'Brush' },
    { id: 'area', icon: Square, label: 'Area' },
    { id: 'wand', icon: Wand2, label: 'Wand' },
  ];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey) setIsAltPressed(true);
    };
    const handleKeyUp = (e) => {
      if (!e.altKey) setIsAltPressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!selectedObject || selectedObject.type !== 'image') {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    const img = selectedObject.getElement();
    const naturalWidth = img.naturalWidth || img.width;
    const naturalHeight = img.naturalHeight || img.height;
    
    canvas.width = naturalWidth;
    canvas.height = naturalHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const imageDataURL = selectedObject.toDataURL({ format: 'png' });
    setImagePreview(imageDataURL);
    setMaskCanvas(canvas);
    setMaskCtx(ctx);
    
    console.log('Mask canvas initialized:', {
      width: canvas.width,
      height: canvas.height,
      naturalWidth,
      naturalHeight
    });
  }, [selectedObject]);

  const getCanvasCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const drawBrush = (x, y, erase = false) => {
    if (!maskCtx) return;
    
    maskCtx.globalCompositeOperation = 'source-over';
    maskCtx.beginPath();
    maskCtx.arc(x, y, brushSize, 0, Math.PI * 2);
    maskCtx.fillStyle = erase ? 'rgba(0, 0, 0, 0)' : 'rgba(0, 255, 100, 0.6)';
    maskCtx.fill();
  };

  const handleMouseDown = (e) => {
    if (!maskCtx) return;
    const { x, y } = getCanvasCoords(e);

    if (selectionTool === 'brush') {
      setIsDrawing(true);
      drawBrush(x, y, isAltPressed);
      maskCtx.beginPath();
      maskCtx.moveTo(x, y);
    } else if (selectionTool === 'lasso') {
      setIsDrawing(true);
      setLassoPoints([{ x, y }]);
    } else if (selectionTool === 'area') {
      setIsDrawing(true);
      maskCtx.beginPath();
      maskCtx.moveTo(x, y);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !maskCtx) return;
    const { x, y } = getCanvasCoords(e);

    if (selectionTool === 'brush') {
      maskCtx.globalCompositeOperation = 'source-over';
      maskCtx.lineTo(x, y);
      maskCtx.lineWidth = brushSize * 2;
      maskCtx.strokeStyle = isAltPressed ? 'rgba(0, 0, 0, 0)' : 'rgba(0, 255, 100, 0.6)';
      maskCtx.lineCap = 'round';
      maskCtx.stroke();
      
      drawBrush(x, y, isAltPressed);
    } else if (selectionTool === 'lasso') {
      setLassoPoints(prev => [...prev, { x, y }]);
    }
  };

  const handleMouseUp = () => {
    if (!maskCtx || !isDrawing) return;

    if (selectionTool === 'lasso' && lassoPoints.length > 2) {
      maskCtx.globalCompositeOperation = 'source-over';
      maskCtx.beginPath();
      maskCtx.moveTo(lassoPoints[0].x, lassoPoints[0].y);
      lassoPoints.forEach(point => maskCtx.lineTo(point.x, point.y));
      maskCtx.closePath();
      maskCtx.fillStyle = isAltPressed ? 'rgba(0, 0, 0, 0)' : 'rgba(0, 255, 100, 0.5)';
      maskCtx.fill();
      
      setLassoPoints([]);
    }

    setIsDrawing(false);
    maskCtx.beginPath();
  };

  const handleClear = () => {
    if (!maskCtx || !maskCanvas) return;
    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
  };

  const handleApply = async () => {
    if (!maskCanvas) {
      alert('Mask canvas not initialized');
      return;
    }
    
    console.log('Converting green overlay to binary mask');
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = maskCanvas.width;
    tempCanvas.height = maskCanvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCtx.fillStyle = '#000000';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    const imageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const green = data[i + 1];
      const alpha = data[i + 3];
      
      if (green > 100 && alpha > 100) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = 255;
      } else {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 255;
      }
    }
    
    tempCtx.putImageData(imageData, 0, 0);
    
    const maskDataURL = tempCanvas.toDataURL('image/png');
    console.log('Binary mask created, data URL length:', maskDataURL.length);
    
    try {
      await eraseRegion(maskDataURL);
    } catch (error) {
      console.error('Erase region failed:', error);
      alert(`Failed to erase region: ${error.message}`);
    }
  };

  if (!selectedObject || selectedObject.type !== 'image') {
    return null;
  }

  return (
    <div className="px-2.5 pb-2.5 flex flex-col gap-3">
      <div>
        <p className="text-[10px] text-gray-500 font-sans mb-2">Selection</p>
        <div className="grid grid-cols-4 gap-1">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => setSelectionTool(tool.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                  selectionTool === tool.id
                    ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <Icon size={16} />
                <span className="text-[9px] font-medium font-sans">
                  {tool.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="text-[10px] text-gray-500 font-sans flex items-center gap-1.5">
        <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[9px] font-mono">
          Alt
        </kbd>
        <span>to erase from selection</span>
        {isAltPressed && (
          <span className="ml-auto text-brand-primary font-medium">
            Erase mode
          </span>
        )}
      </div>
      
      <div className="relative bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
        {imagePreview && (
          <img 
            src={imagePreview} 
            alt="Preview" 
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />
        )}
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="w-full h-48 cursor-crosshair relative"
        />
        <div className="absolute top-2 right-2 bg-black/60 text-white text-[9px] px-2 py-1 rounded font-sans">
          {selectionTool.charAt(0).toUpperCase() + selectionTool.slice(1)} tool
        </div>
      </div>

      {selectionTool === 'brush' && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-sans">Brush</span>
          <input
            type="range"
            min="5"
            max="50"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
          />
          <span className="text-xs text-gray-700 font-medium w-8 font-sans">
            {brushSize}px
          </span>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="flex-1 flex items-center justify-center gap-1.5"
        >
          <X size={14} />
          Clear
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleApply}
          className="flex-1 flex items-center justify-center gap-1.5"
        >
          <Check size={14} />
          Erase area
        </Button>
      </div>
    </div>
  );
};

export default EnhancedEraseRegionTool;

