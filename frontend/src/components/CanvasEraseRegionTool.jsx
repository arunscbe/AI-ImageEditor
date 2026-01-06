import React, { useState, useEffect, useRef } from 'react';
import { Lasso, Paintbrush, Square, Wand2, X, Check } from 'lucide-react';
import useStore from '../store/useStore';
import Button from './ui/Button';
import * as fabric from 'fabric';

const CanvasEraseRegionTool = () => {
  const { 
    selectedObject, 
    eraseRegion, 
    canvas,
  } = useStore();
  
  const [brushSize, setBrushSize] = useState(20);
  const [selectionTool, setSelectionTool] = useState('brush');
  const [isAltPressed, setIsAltPressed] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [maskCanvas, setMaskCanvas] = useState(null);
  
  const drawnPathsRef = useRef([]);
  const lassoPointsRef = useRef([]);
  const isDrawingRef = useRef(false);
  const currentPathRef = useRef(null);

  const tools = [
    { id: 'lasso', icon: Lasso, label: 'Lasso' },
    { id: 'brush', icon: Paintbrush, label: 'Brush' },
    { id: 'area', icon: Square, label: 'Area' },
    { id: 'wand', icon: Wand2, label: 'Wand' },
  ];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey) setIsAltPressed(true);
      if (e.key === 'Escape' && isActive) {
        handleCancel();
      }
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
  }, [isActive]);

  const createMaskCanvas = () => {
    if (!selectedObject) return null;
    
    const maskCanvasEl = document.createElement('canvas');
    maskCanvasEl.width = selectedObject.width * (selectedObject.scaleX || 1);
    maskCanvasEl.height = selectedObject.height * (selectedObject.scaleY || 1);
    
    const ctx = maskCanvasEl.getContext('2d');
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, maskCanvasEl.width, maskCanvasEl.height);
    
    return { canvas: maskCanvasEl, ctx };
  };

  const getLocalCoords = (e) => {
    if (!canvas || !selectedObject) return { x: 0, y: 0 };
    
    const pointer = canvas.getPointer(e.e);
    const transform = selectedObject.calcTransformMatrix();
    const invertedTransform = fabric.util.invertTransform(transform);
    const localPoint = fabric.util.transformPoint(pointer, invertedTransform);
    
    return {
      x: localPoint.x + selectedObject.width / 2,
      y: localPoint.y + selectedObject.height / 2
    };
  };

  const drawOnMask = (x, y, erase) => {
    if (!maskCanvas) return;
    
    maskCanvas.ctx.beginPath();
    maskCanvas.ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    maskCanvas.ctx.fillStyle = erase ? '#000000' : '#ffffff';
    maskCanvas.ctx.fill();
  };

  const handleMouseDown = (opt) => {
    if (!isActive || !canvas) return;
    
    isDrawingRef.current = true;
    const pointer = canvas.getPointer(opt.e);
    const local = getLocalCoords(opt);
    
    if (selectionTool === 'brush') {
      drawOnMask(local.x, local.y, isAltPressed);
      
      const path = new fabric.Path(`M ${pointer.x} ${pointer.y}`, {
        stroke: isAltPressed ? 'rgba(255, 0, 0, 0.4)' : 'rgba(0, 255, 100, 0.4)',
        strokeWidth: brushSize * 2,
        fill: '',
        selectable: false,
        evented: false,
        strokeLineCap: 'round',
        strokeLineJoin: 'round',
        objectCaching: false,
        hasBorders: false,
        hasControls: false,
        lockMovementX: true,
        lockMovementY: true,
      });
      
      currentPathRef.current = path;
      drawnPathsRef.current.push(path);
      canvas.add(path);
      canvas.renderAll();
      
    } else if (selectionTool === 'lasso') {
      lassoPointsRef.current = [{ x: local.x, y: local.y, pointer }];
      
      const path = new fabric.Path(`M ${pointer.x} ${pointer.y}`, {
        stroke: isAltPressed ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 255, 100, 0.5)',
        strokeWidth: 2,
        fill: '',
        selectable: false,
        evented: false,
        objectCaching: false,
        hasBorders: false,
        hasControls: false,
        lockMovementX: true,
        lockMovementY: true,
      });
      
      currentPathRef.current = path;
      drawnPathsRef.current.push(path);
      canvas.add(path);
      canvas.renderAll();
    }
  };

  const handleMouseMove = (opt) => {
    if (!isDrawingRef.current || !isActive || !currentPathRef.current || !canvas) return;
    
    const pointer = canvas.getPointer(opt.e);
    const local = getLocalCoords(opt);
    
    if (selectionTool === 'brush') {
      drawOnMask(local.x, local.y, isAltPressed);
      
      const pathArray = currentPathRef.current.path;
      pathArray.push(['L', pointer.x, pointer.y]);
      currentPathRef.current.set({ path: pathArray, dirty: true });
      canvas.renderAll();
      
    } else if (selectionTool === 'lasso') {
      lassoPointsRef.current.push({ x: local.x, y: local.y, pointer });
      
      const pathArray = currentPathRef.current.path;
      pathArray.push(['L', pointer.x, pointer.y]);
      currentPathRef.current.set({ path: pathArray, dirty: true });
      canvas.renderAll();
    }
  };

  const handleMouseUp = () => {
    if (!isDrawingRef.current || !isActive) return;
    
    if (selectionTool === 'lasso' && lassoPointsRef.current.length > 2 && maskCanvas) {
      maskCanvas.ctx.beginPath();
      maskCanvas.ctx.moveTo(lassoPointsRef.current[0].x, lassoPointsRef.current[0].y);
      lassoPointsRef.current.forEach(point => {
        maskCanvas.ctx.lineTo(point.x, point.y);
      });
      maskCanvas.ctx.closePath();
      maskCanvas.ctx.fillStyle = isAltPressed ? '#000000' : '#ffffff';
      maskCanvas.ctx.fill();
      
      if (currentPathRef.current) {
        currentPathRef.current.set({
          fill: isAltPressed ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 255, 100, 0.2)',
          dirty: true,
        });
      }
      
      lassoPointsRef.current = [];
    }
    
    isDrawingRef.current = false;
    currentPathRef.current = null;
    
    if (canvas) {
      canvas.renderAll();
    }
  };

  const handleStartDrawing = () => {
    if (!canvas || !selectedObject) return;
    
    const { canvas: maskCanvasEl, ctx } = createMaskCanvas();
    setMaskCanvas({ canvas: maskCanvasEl, ctx });
    setIsActive(true);
    
    canvas.isDrawingMode = false;
    canvas.selection = false;
    
    canvas.forEachObject(obj => {
      if (obj !== selectedObject) {
        obj.selectable = false;
        obj.evented = false;
      }
    });
    
    selectedObject.selectable = false;
    selectedObject.evented = false;
    selectedObject.hasControls = false;
    selectedObject.hasBorders = true;
    selectedObject.borderColor = 'rgba(0, 255, 100, 0.8)';
    selectedObject.borderScaleFactor = 3;
    selectedObject.set({
      strokeWidth: 0,
      stroke: null,
    });
    
    canvas.setActiveObject(selectedObject);
    
    const overlayRect = new fabric.Rect({
      left: selectedObject.left,
      top: selectedObject.top,
      width: selectedObject.width * selectedObject.scaleX,
      height: selectedObject.height * selectedObject.scaleY,
      angle: selectedObject.angle,
      fill: 'rgba(0, 255, 100, 0.05)',
      stroke: 'rgba(0, 255, 100, 0.6)',
      strokeWidth: 3,
      selectable: false,
      evented: false,
      objectCaching: false,
      name: 'edit-mode-overlay',
    });
    
    canvas.add(overlayRect);
    drawnPathsRef.current.push(overlayRect);
    
    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);
    
    canvas.renderAll();
  };

  const cleanupDrawing = () => {
    if (!canvas) return;
    
    canvas.off('mouse:down', handleMouseDown);
    canvas.off('mouse:move', handleMouseMove);
    canvas.off('mouse:up', handleMouseUp);
    
    drawnPathsRef.current.forEach(path => {
      canvas.remove(path);
    });
    drawnPathsRef.current = [];
    
    if (selectedObject) {
      selectedObject.set({
        hasBorders: true,
        hasControls: true,
        selectable: true,
        evented: true,
        borderColor: '#e20b0b',
        borderScaleFactor: 1,
      });
      canvas.setActiveObject(selectedObject);
    }
    
    canvas.forEachObject(obj => {
      if (obj !== selectedObject) {
        obj.selectable = true;
        obj.evented = true;
      }
    });
    
    canvas.selection = true;
    canvas.renderAll();
  };

  const handleClear = () => {
    if (!canvas || !maskCanvas) return;
    
    maskCanvas.ctx.fillStyle = '#000000';
    maskCanvas.ctx.fillRect(0, 0, maskCanvas.canvas.width, maskCanvas.canvas.height);
    
    drawnPathsRef.current.forEach(path => {
      canvas.remove(path);
    });
    drawnPathsRef.current = [];
    
    canvas.renderAll();
  };

  const handleApply = async () => {
    if (!maskCanvas || !canvas) return;
    
    const maskDataURL = maskCanvas.canvas.toDataURL('image/png');
    
    cleanupDrawing();
    
    setIsActive(false);
    setMaskCanvas(null);
    
    await eraseRegion(maskDataURL);
  };

  const handleCancel = () => {
    cleanupDrawing();
    setIsActive(false);
    setMaskCanvas(null);
  };

  useEffect(() => {
    return () => {
      if (isActive) {
        cleanupDrawing();
      }
    };
  }, []);

  if (!selectedObject || selectedObject.type !== 'image') {
    return null;
  }

  return (
    <div className="px-2.5 pb-2.5 flex flex-col gap-3">
      {!isActive ? (
        <>
          <p className="text-[10px] text-gray-500 font-sans">
            Draw directly on canvas to select areas to erase
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={handleStartDrawing}
            className="w-full"
          >
            Start Selection
          </Button>
        </>
      ) : (
        <>
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

          <div className="flex items-center justify-between text-[10px] font-sans">
            <div className="flex items-center gap-1.5 text-gray-500">
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[9px] font-mono">
                Alt
              </kbd>
              <span>to erase</span>
            </div>
            {isAltPressed && (
              <span className="text-red-500 font-medium">
                Erase mode
              </span>
            )}
            {!isAltPressed && (
              <span className="text-green-600 font-medium">
                Add mode
              </span>
            )}
          </div>

          <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-[10px] text-green-700 font-medium font-sans">
              🎨 Draw on canvas • Green = erase • Red = keep
            </p>
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
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="flex-1 flex items-center justify-center gap-1.5"
            >
              Cancel
            </Button>
          </div>
          
          <Button
            variant="primary"
            size="sm"
            onClick={handleApply}
            className="w-full flex items-center justify-center gap-1.5"
          >
            <Check size={14} />
            Erase area
          </Button>
        </>
      )}
    </div>
  );
};

export default CanvasEraseRegionTool;
