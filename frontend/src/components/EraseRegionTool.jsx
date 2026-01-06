import React, { useState, useRef, useEffect } from 'react';
import { Eraser, X, Check } from 'lucide-react';
import useStore from '../store/useStore';
import Button from './ui/Button';

const EraseRegionTool = () => {
  const { selectedObject, eraseRegion, setProcessing } = useStore();
  const [isDrawing, setIsDrawing] = useState(false);
  const [maskCanvas, setMaskCanvas] = useState(null);
  const [maskCtx, setMaskCtx] = useState(null);
  const [brushSize, setBrushSize] = useState(20);
  const canvasRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (!selectedObject || selectedObject.type !== 'image') {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    const imageDataURL = selectedObject.toDataURL({ format: 'png' });
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      setImagePreview(imageDataURL);
      setMaskCanvas(canvas);
      setMaskCtx(ctx);
    };
    img.src = imageDataURL;
  }, [selectedObject]);

  const handleMouseDown = (e) => {
    if (!maskCtx) return;
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasRef.current.height / rect.height);
    
    maskCtx.beginPath();
    maskCtx.arc(x, y, brushSize, 0, Math.PI * 2);
    maskCtx.fillStyle = '#ffffff';
    maskCtx.fill();
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !maskCtx) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasRef.current.height / rect.height);
    
    maskCtx.lineTo(x, y);
    maskCtx.lineWidth = brushSize * 2;
    maskCtx.strokeStyle = '#ffffff';
    maskCtx.lineCap = 'round';
    maskCtx.stroke();
    
    maskCtx.beginPath();
    maskCtx.arc(x, y, brushSize, 0, Math.PI * 2);
    maskCtx.fillStyle = '#ffffff';
    maskCtx.fill();
  };

  const handleMouseUp = () => {
    if (!maskCtx) return;
    setIsDrawing(false);
    maskCtx.beginPath();
  };

  const handleClear = () => {
    if (!maskCtx || !maskCanvas) return;
    maskCtx.fillStyle = '#000000';
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
  };

  const handleApply = async () => {
    if (!maskCanvas) return;
    
    const maskDataURL = maskCanvas.toDataURL('image/png');
    await eraseRegion(maskDataURL);
  };

  if (!selectedObject || selectedObject.type !== 'image') {
    return null;
  }

  return (
    <div className="px-2.5 pb-2.5 flex flex-col gap-2">
      <p className="text-[10px] text-gray-500 font-sans">
        Draw white areas to erase (white = erase, black = keep)
      </p>
      
      <div className="relative bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
        {imagePreview && (
          <img 
            src={imagePreview} 
            alt="Preview" 
            className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-30"
          />
        )}
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="w-full h-40 cursor-crosshair"
          style={{ mixBlendMode: 'normal' }}
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 font-sans">Brush Size</span>
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
          Apply
        </Button>
      </div>
    </div>
  );
};

export default EraseRegionTool;

