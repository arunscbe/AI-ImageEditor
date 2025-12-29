import React, { useEffect, useRef } from 'react';
import { Canvas, Rect, FabricObject, InteractiveFabricObject, IText, PencilBrush, FabricImage } from 'fabric';
import { Minus, Plus, Undo2, Layers, Upload } from 'lucide-react';
import useStore from '../store/useStore';
import Button from './ui/Button';

// Default Styles for all objects
const fabricDefaults = {
    transparentCorners: false,
    cornerColor: 'white',
    cornerStrokeColor: '#6366f1',
    borderColor: '#6366f1',
    cornerSize: 10,
    cornerStyle: 'square',
};

// Apply to all relevant classes' ownDefaults to ensure they override standard defaults
// Apply to all relevant classes' ownDefaults to ensure they override standard defaults
[FabricObject, InteractiveFabricObject, Rect, IText].forEach(cls => {
    if (cls.ownDefaults) {
        Object.assign(cls.ownDefaults, fabricDefaults);
    } else {
        // Fallback for classes that might not have ownDefaults static yet (unlikely in v6 but safe)
        // or if it's prototype based in some minor version
        Object.assign(cls.prototype, fabricDefaults);
    }
});

const CanvasArea = () => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const fabricCanvasRef = useRef(null);

    // Use Store
    const { zoom, setZoom, setCanvas, activeTool, handleCanvasAction, setSelectedObject, updateLayers, selectedObject, deleteObject, getNextPosition, incrementObjectCount, focusObject, toggleLayersPanel, isLayersPanelOpen } = useStore();
    const fileInputRef = useRef(null);

    // Keyboard Shortcuts (Escape, Delete, Backspace)
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Avoid triggering if user is typing in an input or textarea
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
                return;
            }

            if (e.key === 'Escape') {
                handleCanvasAction('CANCEL_TOOL');
            } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedObject) {
                deleteObject(selectedObject);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleCanvasAction, selectedObject, deleteObject]);

    // Initialization & Logic
    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return;

        const canvas = new Canvas(canvasRef.current, {
            backgroundColor: '#eaeaeaff',
            selection: true,
            preserveObjectStacking: true,
            renderOnAddRemove: true,
            fireMiddleClick: true, // Enable middle click events
            stopContextMenu: true, // Prevent browser context menu
        });

        fabricCanvasRef.current = canvas;
        setCanvas(canvas);

        // Zoom & Scroll Logic
        canvas.on('mouse:wheel', function (opt) {
            const delta = opt.e.deltaY;
            if (opt.e.ctrlKey) {
                // Zoom with Ctrl key
                opt.e.preventDefault();
                opt.e.stopPropagation();
                let newZoom = canvas.getZoom();
                newZoom *= 0.999 ** delta;
                if (newZoom > 20) newZoom = 20;
                if (newZoom < 0.1) newZoom = 0.1;
                canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, newZoom);
                setZoom(Math.round(newZoom * 100));
            } else {
                // Scroll vertically by default (panning)
                opt.e.preventDefault();
                opt.e.stopPropagation();
                canvas.relativePan({ x: 0, y: -delta });
            }
        });

        // Middle-click Panning
        let isPanning = false;
        let lastPosX;
        let lastPosY;

        canvas.on('mouse:down', function (opt) {
            // Check button: 1 is middle, 0 is left, 2 is right
            if (opt.e.button === 1) {
                isPanning = true;
                canvas.selection = false;
                lastPosX = opt.e.clientX;
                lastPosY = opt.e.clientY;
                canvas.defaultCursor = 'grabbing';
            }
        });

        canvas.on('mouse:move', function (opt) {
            if (isPanning) {
                const e = opt.e;
                const vpt = canvas.viewportTransform.slice();
                vpt[4] += e.clientX - lastPosX;
                vpt[5] += e.clientY - lastPosY;
                canvas.setViewportTransform(vpt);
                lastPosX = e.clientX;
                lastPosY = e.clientY;
            }
        });

        canvas.on('mouse:up', function (opt) {
            if (isPanning) {
                isPanning = false;
                canvas.selection = true;
                canvas.defaultCursor = 'default';
                canvas.requestRenderAll();
            }
        });

        // Selection Events
        canvas.on('selection:created', (e) => setSelectedObject(e.selected[0]));
        canvas.on('selection:updated', (e) => setSelectedObject(e.selected[0]));
        canvas.on('selection:cleared', () => setSelectedObject(null));

        // Listen for object changes to update UI if needed
        canvas.on('object:modified', (e) => {
            setSelectedObject(e.target);
            updateLayers();
        });
        canvas.on('object:scaling', (e) => setSelectedObject(e.target));
        canvas.on('object:moving', (e) => setSelectedObject(e.target));

        // Layer synchronization & Controls configuration
        canvas.on('object:added', (e) => {
            updateLayers();
            if (e.target) {
                e.target.setControlsVisibility({
                    mt: false,
                    mb: false,
                    ml: false,
                    mr: false
                });
            }
        });
        canvas.on('object:removed', updateLayers);

        const resizeCanvas = () => {
            if (containerRef.current) {
                canvas.setWidth(containerRef.current.clientWidth);
                canvas.setHeight(containerRef.current.clientHeight);
                canvas.renderAll();
            }
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            canvas.dispose();
            setCanvas(null);
        }
    }, [setZoom, setCanvas]);

    // Update Brush Mode
    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        if (activeTool === 'brush') {
            canvas.isDrawingMode = true;

            // Ensure brush is instantiated
            if (!canvas.freeDrawingBrush) {
                canvas.freeDrawingBrush = new PencilBrush(canvas);
            }

            // Configure brush
            canvas.freeDrawingBrush.width = 4;
            canvas.freeDrawingBrush.color = '#111111ff';
        } else if (activeTool === 'upload') {
            fileInputRef.current?.click();
            handleCanvasAction('CANCEL_TOOL');
        } else {
            canvas.isDrawingMode = false;
        }
    }, [activeTool, handleCanvasAction]);

    // Handle File Upload
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (f) => {
            const data = f.target.result;
            const img = await FabricImage.fromURL(data);

            const canvas = fabricCanvasRef.current;
            if (canvas) {
                // Resize to max 512px
                const maxSize = 512;
                if (img.width > maxSize || img.height > maxSize) {
                    if (img.width > img.height) {
                        img.scaleToWidth(maxSize);
                    } else {
                        img.scaleToHeight(maxSize);
                    }
                }

                const pos = getNextPosition();
                img.set({
                    left: pos.left,
                    top: pos.top,
                    originX: 'left',
                    originY: 'center',
                });

                canvas.add(img);
                incrementObjectCount();
                canvas.setActiveObject(img);
                focusObject(img);
                canvas.renderAll();
            }
        };
        reader.readAsDataURL(file);
        // Reset input
        e.target.value = '';
    };

    // Helper to zoom via buttons
    const handleZoom = (factor) => {
        if (!fabricCanvasRef.current) return;
        const canvas = fabricCanvasRef.current;
        let newZoom = canvas.getZoom() * factor;
        if (newZoom > 20) newZoom = 20;
        if (newZoom < 0.1) newZoom = 0.1;

        const center = canvas.getCenter();
        canvas.zoomToPoint({ x: center.left, y: center.top }, newZoom);
        setZoom(Math.round(newZoom * 100));
    };

    return (
        <div ref={containerRef} className="w-full h-full relative overflow-hidden">
            <canvas ref={canvasRef} />

            {/* Hidden File Input for Uploads */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
            />

            {/* Bottom Right Controls */}
            <div className="absolute bottom-6 right-6 flex items-center gap-4">
                {/* Zoom Controls */}
                <div className="flex items-center bg-white p-1 rounded-lg shadow-sm border border-gray-200">
                    <Button variant="ghost" size="icon-sm" onClick={() => { }} className="text-gray-500">
                        <Undo2 size={16} />
                    </Button>
                    <div className="w-px h-4 bg-gray-200 mx-1" />
                    <Button variant="ghost" size="icon-sm" onClick={() => handleZoom(0.9)} className="text-gray-500">
                        <Minus size={16} />
                    </Button>
                    <span className="text-xs font-semibold text-gray-700 w-10 text-center select-none">{zoom}%</span>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleZoom(1.1)} className="text-gray-500">
                        <Plus size={16} />
                    </Button>
                </div>

                {/* Layers Toggle */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleLayersPanel}
                        className={isLayersPanelOpen ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}
                    >
                        <Layers size={18} />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CanvasArea;
