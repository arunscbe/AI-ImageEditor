import React, { useEffect, useRef } from "react";
import {
  Canvas,
  Rect,
  FabricObject,
  InteractiveFabricObject,
  IText,
  PencilBrush,
  FabricImage,
} from "fabric";
import * as fabric from "fabric";
import { Minus, Plus, Undo2, Layers, Upload } from "lucide-react";
import useStore from "../store/useStore";
import Button from "./ui/Button";

// Default Styles for all objects
const fabricDefaults = {
  transparentCorners: false,
  cornerColor: "white",
  cornerStrokeColor: "#e20b0b",
  borderColor: "#e20b0b",
  cornerSize: 10,
  cornerStyle: "square",
};

// Apply to all relevant classes' ownDefaults to ensure they override standard defaults
// Apply to all relevant classes' ownDefaults to ensure they override standard defaults
[FabricObject, InteractiveFabricObject, Rect, IText].forEach((cls) => {
  if (cls.ownDefaults) {
    Object.assign(cls.ownDefaults, fabricDefaults);
  } else {
    // Fallback for classes that might not have ownDefaults static yet (unlikely in v6 but safe)
    // or if it's prototype based in some minor version
    Object.assign(cls.prototype, fabricDefaults);
  }
});

const CanvasArea = ({ projectId }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const activeToolRef = useRef(null);

  const {
    zoom,
    setZoom,
    setCanvas,
    activeTool,
    handleCanvasAction,
    setSelectedObject,
    updateLayers,
    selectedObject,
    deleteObject,
    getNextPosition,
    incrementObjectCount,
    focusObject,
    toggleLayersPanel,
    isLayersPanelOpen,
    brushSize,
    brushColor,
  } = useStore();
  const fileInputRef = useRef(null);

  // Keep activeToolRef in sync with activeTool
  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);

  useEffect(() => {
    if (projectId) {
      // Project loading logic can be added here
    }
  }, [projectId]);

  // Keyboard Shortcuts (Escape, Delete, Backspace, Undo, Redo)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Avoid triggering if user is typing in an input or textarea
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable
      ) {
        return;
      }

      if (e.key === "Escape") {
        handleCanvasAction("CANCEL_TOOL");
      } else if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedObject
      ) {
        deleteObject(selectedObject);
      } else if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        const { undo } = useStore.getState();
        undo();
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        const { redo } = useStore.getState();
        redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCanvasAction, selectedObject, deleteObject]);

  // Initialization & Logic
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      backgroundColor: "#eaeaeaff",
      selection: true,
      preserveObjectStacking: true,
      renderOnAddRemove: true,
      fireMiddleClick: true, // Enable middle click events
      stopContextMenu: true, // Prevent browser context menu
    });

    // Initialize history for undo/redo
    const historyState = {
      undos: [],
      redos: [],
      maxHistorySize: 50,
      isRestoring: false, // Flag to prevent saving during undo/redo
      eventHandlers: [], // Store event handlers so we can remove them
    };
    canvas.historyState = historyState;

    // Save state function
    const saveState = () => {
      // Don't save if we're currently restoring state (undo/redo in progress)
      if (historyState.isRestoring) {
        console.log("Skipping save - restore in progress");
        return;
      }

      try {
        const json = JSON.stringify(canvas.toJSON(["selectable", "evented"]));
        historyState.undos.push(json);
        if (historyState.undos.length > historyState.maxHistorySize) {
          historyState.undos.shift();
        }
        historyState.redos = []; // Clear redos when new action is performed
      } catch (error) {
        console.error("Error saving canvas state:", error);
      }
    };

    // Debounced save state to avoid too many saves
    let saveTimeout;
    const debouncedSaveState = (delay = 100) => {
      if (historyState.isRestoring) {
        return;
      }
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(saveState, delay);
    };

    // Immediate save for critical property changes (colors, etc.)
    const immediateSaveState = () => {
      if (historyState.isRestoring) {
        return;
      }
      clearTimeout(saveTimeout);
      saveState();
    };

    // Event handlers - save immediately for modifications (includes color changes)
    const handlers = {
      added: debouncedSaveState,
      removed: debouncedSaveState,
      modified: immediateSaveState, // Save immediately on modifications (color changes trigger this)
      pathCreated: debouncedSaveState,
      moving: debouncedSaveState, // Debounce moving/scaling/rotating
      scaling: debouncedSaveState,
      rotating: debouncedSaveState,
      afterRender: () => {}, // Don't save on every render, only on actual changes
    };

    // Store handlers for later removal
    historyState.eventHandlers = handlers;

    // Initial state
    saveState();

    // Save state on object modifications
    canvas.on("object:added", handlers.added);
    canvas.on("object:removed", handlers.removed);
    canvas.on("object:modified", handlers.modified);
    canvas.on("path:created", handlers.pathCreated);
    canvas.on("object:moving", handlers.moving);
    canvas.on("object:scaling", handlers.scaling);
    canvas.on("object:rotating", handlers.rotating);
    
    // Note: after:render handler removed - we save on object:modified instead
    
    // Expose save function for manual calls from components
    canvas.saveHistoryState = () => {
      if (!historyState.isRestoring) {
        immediateSaveState();
      }
    };

    // Function to temporarily disable history saving
    canvas.disableHistorySaving = () => {
      historyState.isRestoring = true;
      canvas.off("object:added", handlers.added);
      canvas.off("object:removed", handlers.removed);
      canvas.off("object:modified", handlers.modified);
      canvas.off("path:created", handlers.pathCreated);
      canvas.off("object:moving", handlers.moving);
      canvas.off("object:scaling", handlers.scaling);
      canvas.off("object:rotating", handlers.rotating);
      canvas.off("after:render", handlers.afterRender);
    };

    // Function to re-enable history saving
    canvas.enableHistorySaving = () => {
      setTimeout(() => {
        historyState.isRestoring = false;
        canvas.on("object:added", handlers.added);
        canvas.on("object:removed", handlers.removed);
        canvas.on("object:modified", handlers.modified);
        canvas.on("path:created", handlers.pathCreated);
        canvas.on("object:moving", handlers.moving);
        canvas.on("object:scaling", handlers.scaling);
        canvas.on("object:rotating", handlers.rotating);
        canvas.on("after:render", handlers.afterRender);
      }, 500); // Longer delay to ensure all events have fired
    };

    fabricCanvasRef.current = canvas;
    setCanvas(canvas);

    // Zoom & Scroll Logic
    canvas.on("mouse:wheel", function (opt) {
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

    let isPanning = false;
    let lastPosX;
    let lastPosY;

    canvas.on("mouse:down", function (opt) {
      // Middle-click always pans, left-click only pans when pan tool is active
      const isMiddleClick = opt.e.button === 1;
      const isLeftClickWithPanTool =
        opt.e.button === 0 && activeToolRef.current === "pan";

      if (isMiddleClick || isLeftClickWithPanTool) {
        isPanning = true;
        canvas.selection = false;
        lastPosX = opt.e.clientX;
        lastPosY = opt.e.clientY;
        canvas.defaultCursor = "grabbing";
        opt.e.preventDefault();
      }
    });

    canvas.on("mouse:move", function (opt) {
      if (isPanning) {
        const e = opt.e;
        const vpt = canvas.viewportTransform.slice();
        vpt[4] += e.clientX - lastPosX;
        vpt[5] += e.clientY - lastPosY;
        canvas.setViewportTransform(vpt);
        lastPosX = e.clientX;
        lastPosY = e.clientY;
        canvas.requestRenderAll();
      }
    });

    canvas.on("mouse:up", function (opt) {
      if (isPanning) {
        isPanning = false;
        canvas.selection = true;
        canvas.defaultCursor =
          activeToolRef.current === "pan" ? "grab" : "default";
        canvas.requestRenderAll();
      }
    });

    // Selection Events
    canvas.on("selection:created", (e) => setSelectedObject(e.selected[0]));
    canvas.on("selection:updated", (e) => setSelectedObject(e.selected[0]));
    canvas.on("selection:cleared", () => setSelectedObject(null));

    // Listen for object changes to update UI if needed
    canvas.on("object:modified", (e) => {
      setSelectedObject(e.target);
      updateLayers();
    });
    canvas.on("object:scaling", (e) => setSelectedObject(e.target));
    canvas.on("object:moving", (e) => setSelectedObject(e.target));

    // Layer synchronization & Controls configuration
    canvas.on("object:added", (e) => {
      updateLayers();
      if (e.target) {
        e.target.setControlsVisibility({
          mt: false,
          mb: false,
          ml: false,
          mr: false,
        });
      }
    });
    canvas.on("object:removed", updateLayers);

    const resizeCanvas = () => {
      if (containerRef.current) {
        canvas.setWidth(containerRef.current.clientWidth);
        canvas.setHeight(containerRef.current.clientHeight);
        canvas.renderAll();
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      canvas.dispose();
      setCanvas(null);
    };
  }, [setZoom, setCanvas]);

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    if (activeTool === "brush" || activeTool === "eraser") {
      canvas.isDrawingMode = true;

      if (!canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush = new PencilBrush(canvas);
      }

      canvas.freeDrawingBrush.width = brushSize;
      canvas.freeDrawingBrush.color =
        activeTool === "eraser" ? "#ffffff" : brushColor;
    } else if (activeTool === "upload") {
      fileInputRef.current?.click();
      handleCanvasAction("CANCEL_TOOL");
    } else if (activeTool === "pan") {
      canvas.isDrawingMode = false;
      canvas.selection = false;
      canvas.defaultCursor = "grab";
      canvas.hoverCursor = "grab";
      canvas.forEachObject((obj) => {
        obj.selectable = false;
        obj.evented = false;
      });
    } else {
      canvas.isDrawingMode = false;
      canvas.selection = true;
      canvas.defaultCursor = "default";
      canvas.hoverCursor = "move";
      canvas.forEachObject((obj) => {
        obj.selectable = true;
        obj.evented = true;
      });
    }
  }, [activeTool, handleCanvasAction, brushSize, brushColor]);

  // Handle File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
    const isSVG = file.type === "image/svg+xml" || file.name.endsWith(".svg");

    if (isSVG) {
      const reader = new FileReader();
      reader.onload = async (f) => {
        const svgText = f.target.result;

        try {
          const { objects, options } = await fabric.loadSVGFromString(svgText);
          const svg = fabric.util.groupSVGElements(objects, options);

          const canvas = fabricCanvasRef.current;
          if (canvas) {
            const maxSize = 512;
            const svgWidth = svg.width || 100;
            const svgHeight = svg.height || 100;

            if (svgWidth > maxSize || svgHeight > maxSize) {
              const scale = Math.min(maxSize / svgWidth, maxSize / svgHeight);
              svg.scale(scale);
            }

            const pos = getNextPosition();
            svg.set({
              left: pos.left,
              top: pos.top,
              originX: "left",
              originY: "center",
              name: fileName, // Store filename
            });

            canvas.add(svg);
            incrementObjectCount();
            canvas.setActiveObject(svg);
            focusObject(svg);
            canvas.renderAll();
            updateLayers();
          }
        } catch (error) {
          alert("Failed to load SVG file. Please ensure it's a valid SVG.");
        }
      };
      reader.readAsText(file);
    } else {
      const reader = new FileReader();
      reader.onload = async (f) => {
        const data = f.target.result;
        const img = await FabricImage.fromURL(data);

        const canvas = fabricCanvasRef.current;
        if (canvas) {
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
            originX: "left",
            originY: "center",
            name: fileName, // Store filename
          });

          canvas.add(img);
          incrementObjectCount();
          canvas.setActiveObject(img);
          focusObject(img);
          canvas.renderAll();
          updateLayers();
        }
      };
      reader.readAsDataURL(file);
    }

    e.target.value = "";
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
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {}}
            className="text-gray-500"
          >
            <Undo2 size={16} />
          </Button>
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleZoom(0.9)}
            className="text-gray-500"
          >
            <Minus size={16} />
          </Button>
          <span className="text-xs font-semibold text-gray-700 w-10 text-center select-none">
            {zoom}%
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleZoom(1.1)}
            className="text-gray-500"
          >
            <Plus size={16} />
          </Button>
        </div>

        {/* Layers Toggle */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleLayersPanel}
            className={
              isLayersPanelOpen
                ? "text-brand-primary"
                : "text-gray-500 hover:text-gray-700"
            }
          >
            <Layers size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CanvasArea;
