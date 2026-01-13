import { create } from "zustand";
import * as fabric from "fabric";
import { getApiUrl } from "../config/api";
import { extractColorsFromImage, replaceColorInImage, hexToRgb } from "../utils/colorExtractor";
import { CANVAS_CONFIG } from "../constants/canvasConfig";

const { IText, Rect, Circle, Line, Triangle, Group } = fabric;
const FabricImage = fabric.FabricImage;

const useStore = create((set, get) => ({
  canvas: null,
  setCanvas: (canvas) => set({ canvas }),

  isProcessing: false,
  processingMessage: '',
  setProcessing: (isProcessing, message = '') =>
    set({ isProcessing, processingMessage: message }),

  projectIntent: null,
  setProjectIntent: (intent) => set({ projectIntent: intent }),
  suggestedPrompts: [],
  setSuggestedPrompts: (prompts) => set({ suggestedPrompts: prompts }),

  zoom: 100,
  setZoom: (zoom) => set({ zoom }),

  isInsertOpen: false,
  toggleInsertMenu: () =>
    set((state) => ({ isInsertOpen: !state.isInsertOpen })),
  closeInsertMenu: () => set({ isInsertOpen: false }),

  isLayersPanelOpen: true,
  toggleLayersPanel: () =>
    set((state) => ({ isLayersPanelOpen: !state.isLayersPanelOpen })),

  activeTool: null,
  setActiveTool: (tool) => set({ activeTool: tool }),

  isMascotPickerOpen: false,
  setMascotPickerOpen: (isOpen) => set({ isMascotPickerOpen: isOpen }),
  brushSize: 4,
  setBrushSize: (size) => {
    const { canvas } = get();
    set({ brushSize: size });
    if (canvas && canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.width = size;
    }
  },
  brushColor: '#000000',
  setBrushColor: (color) => {
    const { canvas } = get();
    set({ brushColor: color });
    if (canvas && canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = color;
    }
  },

  selectedObject: null,
  setSelectedObject: (obj) => set({ selectedObject: obj }),

  colorMergeTolerance: 0,
  setColorMergeTolerance: (tolerance) => set({ colorMergeTolerance: tolerance }),
  focusObject: (obj) => {
    const canvas = get().canvas;
    if (!canvas || !obj) return;

    const zoom = canvas.getZoom();
    const center = obj.getCenterPoint();

    const startVpt = canvas.viewportTransform.slice();
    const targetX = canvas.width / 2 - center.x * zoom;
    const targetY = canvas.height / 2 - center.y * zoom;

    const duration = 500; // ms
    const start = performance.now();

    // Easing function: easeOutCubic
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      const currentVpt = startVpt.slice();
      currentVpt[4] = startVpt[4] + (targetX - startVpt[4]) * easedProgress;
      currentVpt[5] = startVpt[5] + (targetY - startVpt[5]) * easedProgress;

      canvas.setViewportTransform(currentVpt);
      canvas.requestRenderAll();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  },
  
  objectCount: 0,
  incrementObjectCount: () =>
    set((state) => ({ objectCount: state.objectCount + 1 })),
  getNextPosition: () => {
    const canvas = get().canvas;
    if (!canvas) return { left: 0, top: 0 };

    const center = canvas.getCenter();
    const objects = canvas.getObjects();

    if (objects.length === 0) {
      return {
        left: center.left - 100, // Initial start
        top: center.top,
      };
    }

    let maxRight = -Infinity;
    objects.forEach((obj) => {
      const boundingRect = obj.getBoundingRect();
      const right = boundingRect.left + boundingRect.width;
      if (right > maxRight) maxRight = right;
    });

    return {
      left: maxRight + 20, // 20px padding
      top: center.top,
    };
  },

  addText: () => {
    const { canvas, getNextPosition, incrementObjectCount } = get();
    if (canvas) {
      const pos = getNextPosition();
      const text = new IText("Type something...", {
        left: pos.left,
        top: pos.top,
        originX: "left",
        originY: "center",
        fontFamily: "Inter, sans-serif",
        fontSize: 40,
        fill: "#333",
      });
      canvas.add(text);
      canvas.setActiveObject(text);
      get().focusObject(text);
      incrementObjectCount();
    }
  },

  addImageBackground: () => {
    const { canvas, getNextPosition, incrementObjectCount } = get();
    if (canvas) {
      const pos = getNextPosition();
      const bgRect = new Rect({
        left: pos.left,
        top: pos.top,
        originX: "left",
        originY: "center",
        width: 1024,
        height: 1024,
        fill: "#d3e5ff",
      });
      canvas.add(bgRect);
      canvas.setActiveObject(bgRect);
      get().focusObject(bgRect);
      incrementObjectCount();
    }
  },

  addRectangle: () => {
    const { canvas, getNextPosition, incrementObjectCount } = get();
    if (canvas) {
      const pos = getNextPosition();
      const rect = new Rect({
        left: pos.left,
        top: pos.top,
        originX: "left",
        originY: "center",
        width: 200,
        height: 200,
        fill: "#111111ff",
      });
      canvas.add(rect);
      canvas.setActiveObject(rect);
      get().focusObject(rect);
      incrementObjectCount();
    }
  },

  addCircle: () => {
    const { canvas, getNextPosition, incrementObjectCount } = get();
    if (canvas) {
      const pos = getNextPosition();
      const circle = new Circle({
        left: pos.left,
        top: pos.top,
        originX: "left",
        originY: "center",
        radius: 100,
        fill: "#111111ff",
      });
      canvas.add(circle);
      canvas.setActiveObject(circle);
      get().focusObject(circle);
      incrementObjectCount();
    }
  },

  addTriangle: () => {
    const { canvas, getNextPosition, incrementObjectCount } = get();
    if (canvas) {
      const pos = getNextPosition();
      const triangle = new Triangle({
        left: pos.left,
        top: pos.top,
        originX: "left",
        originY: "center",
        width: 200,
        height: 200,
        fill: "#111111ff",
      });
      canvas.add(triangle);
      canvas.setActiveObject(triangle);
      get().focusObject(triangle);
      incrementObjectCount();
    }
  },

  addLine: () => {
    const { canvas, getNextPosition, incrementObjectCount } = get();
    if (canvas) {
      const pos = getNextPosition();
      const line = new Line([50, 0, 250, 0], {
        left: pos.left,
        top: pos.top,
        originX: "left",
        originY: "center",
        stroke: "#111111ff",
        strokeWidth: 4,
      });
      canvas.add(line);
      canvas.setActiveObject(line);
      get().focusObject(line);
      incrementObjectCount();
    }
  },

  addBlankCanvas: () => {
    const { canvas, getNextPosition, incrementObjectCount } = get();
    if (canvas) {
      const width = prompt("Enter canvas width (px):", "800");
      const height = prompt("Enter canvas height (px):", "600");
      
      if (width && height) {
        const w = parseInt(width);
        const h = parseInt(height);
        
        if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
          alert("Please enter valid positive numbers for width and height.");
          return;
        }
        
        const pos = getNextPosition();
        const rect = new Rect({
          left: pos.left,
          top: pos.top,
          originX: "left",
          originY: "center",
          width: w,
          height: h,
          fill: "#FFFFFFff",
          stroke: "#E5E7EB",
          strokeWidth: 2,
        });
        canvas.add(rect);
        canvas.setActiveObject(rect);
        get().focusObject(rect);
        incrementObjectCount();
      }
    }
  },

  addMascot: async (mascot) => {
    const { canvas, getNextPosition, incrementObjectCount } = get();
    if (!canvas || !mascot) {
      return;
    }

    try {
      const url = mascot.url.startsWith('http') || mascot.url.startsWith('/assets') 
        ? mascot.url 
        : new URL(mascot.url, import.meta.url).href;
      
      const { objects, options } = await fabric.loadSVGFromURL(url);
      
      if (!Array.isArray(objects) || objects.length === 0) {
        throw new Error('SVG parsed but produced no Fabric objects.');
      }
      
      const group = fabric.util.groupSVGElements(objects, options);
      
      const pos = getNextPosition();
      
      group.set({
        left: pos.left,
        top: pos.top,
        originX: 'left',
        originY: 'center',
        name: mascot.name || mascot.id
      });
      
      const maxSize = CANVAS_CONFIG.MASCOT_MAX_SIZE;
      const scale = Math.min(maxSize / group.width, maxSize / group.height);
      group.scale(scale);
      
      canvas.add(group);
      canvas.setActiveObject(group);
      canvas.requestRenderAll();
      
      get().focusObject(group);
      incrementObjectCount();
    } catch (error) {
      alert('Failed to load mascot: ' + error.message);
    }
  },

  addArrow: () => {
    const { canvas, getNextPosition, incrementObjectCount } = get();
    if (canvas) {
      const pos = getNextPosition();

      const line = new Line([0, 0, 150, 0], {
        stroke: "#111111ff",
        strokeWidth: 4,
        originX: "center",
        originY: "center",
      });

      const head = new Triangle({
        width: 20,
        height: 20,
        fill: "#111111ff",
        left: 150,
        top: 0,
        angle: 90,
        originX: "center",
        originY: "center",
      });

      const arrow = new Group([line, head], {
        left: pos.left,
        top: pos.top,
        originX: "left",
        originY: "center",
      });

      canvas.add(arrow);
      canvas.setActiveObject(arrow);
      get().focusObject(arrow);
      incrementObjectCount();
    }
  },

  sendTestRequest: async () => {
    try {
      const response = await fetch(getApiUrl("/test"), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  },
  vectorizeAPI: async () => {
    const { canvas, selectedObject, updateLayers, setProcessing } = get();

    if (!selectedObject || selectedObject.type !== "image") {
      alert("Please select an image first.");
      return;
    }

    setProcessing(true, "Vectorizing image...");

    try {
      const placement = {
        left: selectedObject.left,
        top: selectedObject.top,
        angle: selectedObject.angle,
        originX: selectedObject.originX,
        originY: selectedObject.originY,
        flipX: selectedObject.flipX,
        flipY: selectedObject.flipY,
      };

      const prevW = selectedObject.getScaledWidth();
      const prevH = selectedObject.getScaledHeight();

      const dataURL = selectedObject.toDataURL({ format: "png" });
      const blob = await (await fetch(dataURL)).blob();

      const formData = new FormData();
      formData.append("image", blob, "vector.png");

      const response = await fetch(getApiUrl("/vectorizeImage"), {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      const svgUrl = data?.image?.url || data?.data?.[0]?.url || data?.url;

      if (!svgUrl) {
        alert("Vectorization failed.");
        return;
      }

      const svgResponse = await fetch(svgUrl);
      const svgText = await svgResponse.text();
      
      const { objects, options } = await fabric.loadSVGFromString(svgText);
      const svg = fabric.util.groupSVGElements(objects, options);

      const naturalW = svg.width || svg.getScaledWidth();
      const naturalH = svg.height || svg.getScaledHeight();

      if (naturalW && naturalH) {
        svg.scaleX = prevW / naturalW;
        svg.scaleY = prevH / naturalH;
      }
      svg.set({ ...placement });

      canvas.remove(selectedObject);
      canvas.add(svg);
      canvas.setActiveObject(svg);
      canvas.renderAll();
      updateLayers();
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  },

  mergeColorsOnCanvas: () => {
    const { selectedObject, colorMergeTolerance } = get();
    
    if (!selectedObject || colorMergeTolerance === 0) {
      return;
    }

    const colors = extractColorsFromImage(selectedObject);
    const allColors = colors.flatMap(group => group.colors);
    
    if (allColors.length === 0) return;
    
    const sorted = [...allColors].sort((a, b) => b.count - a.count);
    const merged = new Map(); // Maps less prominent color to most prominent color
    const used = new Set();
    
    for (const color of sorted) {
      if (used.has(color.hex)) continue;
      
      const similar = sorted.filter(c => {
        if (used.has(c.hex) || c.hex === color.hex) return false;
        
        // Calculate RGB distance
        const rgb1 = hexToRgb(color.hex);
        const rgb2 = hexToRgb(c.hex);
        const distance = Math.sqrt(
          Math.pow(rgb1.r - rgb2.r, 2) +
          Math.pow(rgb1.g - rgb2.g, 2) +
          Math.pow(rgb1.b - rgb2.b, 2)
        );
        return distance <= colorMergeTolerance;
      });
      
      used.add(color.hex);
      
      similar.forEach(c => {
        merged.set(c.hex, color.hex);
        used.add(c.hex);
      });
    }
    
    merged.forEach((targetColor, sourceColor) => {
      replaceColorInImage(selectedObject, [sourceColor], targetColor);
    });
    
    if (selectedObject.canvas) {
      selectedObject.canvas.renderAll();
    }
  },

  forRemovingBG: async () => {
    const { canvas, selectedObject, focusObject, incrementObjectCount, setProcessing } = get();
    const placement = {
      scaleX: selectedObject.scaleX,
      scaleY: selectedObject.scaleY,
      left: selectedObject.left,
      right: selectedObject.right,
    };

    if (!selectedObject || selectedObject.type !== "image") {
      alert("Please select an image first.");
      return;
    }

    setProcessing(true, "Removing background...");

    try {
      // Convert fabric image to PNG blob
      const dataURL = selectedObject.toDataURL({
        format: "png",
        quality: 1,
      });

      const blob = await (await fetch(dataURL)).blob();

      // Prepare FormData
      const formData = new FormData();
      formData.append("image", blob, "selected.png");

      const response = await fetch(getApiUrl("/removebg"), {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const cleanedUrl = data?.image?.url;
      if (!cleanedUrl) {
        alert("Background removal failed.");
        return;
      }
      const img = await fabric.FabricImage.fromURL(cleanedUrl, {
        crossOrigin: "anonymous",
      });
      if (!img) {
        return;
      }
      const prevW = selectedObject.getScaledWidth();
      const prevH = selectedObject.getScaledHeight();

      const newW = img.width;
      const newH = img.height;

      const scaleX = prevW / newW;
      const scaleY = prevH / newH;

      img.set({
        left: selectedObject.left,
        top: selectedObject.top,
        angle: selectedObject.angle,
        flipX: selectedObject.flipX,
        flipY: selectedObject.flipY,
        originX: selectedObject.originX,
        originY: selectedObject.originY,
        scaleX,
        scaleY,
      });
      canvas.remove(selectedObject);
      canvas.add(img);
      canvas.setActiveObject(img);
      incrementObjectCount();
      canvas.renderAll();
      get().updateLayers();
    } catch (error) {
      alert(`Error removing BG: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  },

  upscaleImage: async () => {
    const { canvas, selectedObject, incrementObjectCount, setProcessing } = get();

    if (!selectedObject || selectedObject.type !== "image") {
      alert("Please select an image first.");
      return;
    }

    setProcessing(true, "Enhancing image with AI...");

    try {
      // Get image data URL
      const dataURL = selectedObject.toDataURL({
        format: "png",
        quality: 1,
      });

      const blob = await (await fetch(dataURL)).blob();

      // Upload image first to get a URL
      const uploadFormData = new FormData();
      uploadFormData.append("file", blob, "enhance.png");

      const uploadResponse = await fetch(getApiUrl("/upload_image"), {
        method: "POST",
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed! status: ${uploadResponse.status}`);
      }

      const uploadData = await uploadResponse.json();
      const imageUrl = uploadData?.url;

      if (!imageUrl) {
        alert("Image upload failed.");
        return;
      }

      // Call Gemini edit_image with enhancement prompt
      const enhanceResponse = await fetch(getApiUrl("/conversation/user-enhance/message"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Enhance this image quality without changing the design",
          image_url: imageUrl,
          style: "embroidery", // Default style, could be extracted from current selection
          provider: "gemini",
        }),
      });

      if (!enhanceResponse.ok) {
        throw new Error(`Enhancement failed! status: ${enhanceResponse.status}`);
      }

      const enhanceData = await enhanceResponse.json();

      const enhancedUrl = enhanceData?.images?.[0]?.url;
      if (!enhancedUrl) {
        alert("Image enhancement failed.");
        return;
      }

      const img = await fabric.FabricImage.fromURL(enhancedUrl, {
        crossOrigin: "anonymous",
      });

      if (!img) {
        return;
      }

      const prevW = selectedObject.getScaledWidth();
      const prevH = selectedObject.getScaledHeight();

      const newW = img.width;
      const newH = img.height;

      const scaleX = prevW / newW;
      const scaleY = prevH / newH;

      img.set({
        left: selectedObject.left,
        top: selectedObject.top,
        angle: selectedObject.angle,
        flipX: selectedObject.flipX,
        flipY: selectedObject.flipY,
        originX: selectedObject.originX,
        originY: selectedObject.originY,
        scaleX,
        scaleY,
      });

      canvas.remove(selectedObject);
      canvas.add(img);
      canvas.setActiveObject(img);
      incrementObjectCount();
      canvas.renderAll();
      get().updateLayers();
    } catch (error) {
      alert(`Error upscaling image: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  },

  eraseRegion: async (maskDataURL) => {
    const { canvas, selectedObject, incrementObjectCount, setProcessing } = get();

    if (!selectedObject || selectedObject.type !== "image") {
      alert("Please select an image first.");
      return;
    }

    setProcessing(true, "Erasing region...");

    try {
      const imgElement = selectedObject.getElement();
      const naturalWidth = imgElement.naturalWidth || imgElement.width;
      const naturalHeight = imgElement.naturalHeight || imgElement.height;

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = naturalWidth;
      tempCanvas.height = naturalHeight;
      const tempCtx = tempCanvas.getContext('2d');
      
      tempCtx.drawImage(imgElement, 0, 0, naturalWidth, naturalHeight);
      
      const imageDataURL = tempCanvas.toDataURL('image/png');

      const imageBlob = await (await fetch(imageDataURL)).blob();
      const maskBlob = await (await fetch(maskDataURL)).blob();

      const formData = new FormData();
      formData.append("image", imageBlob, "image.png");
      formData.append("mask", maskBlob, "mask.png");

      const response = await fetch(getApiUrl("/erase-region"), {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      const erasedUrl = data?.image?.url;
      if (!erasedUrl) {
        alert("Image erase region failed.");
        return;
      }

      const img = await fabric.FabricImage.fromURL(erasedUrl, {
        crossOrigin: "anonymous",
      });

      if (!img) {
        return;
      }

      const prevW = selectedObject.getScaledWidth();
      const prevH = selectedObject.getScaledHeight();

      const newW = img.width;
      const newH = img.height;

      const scaleX = prevW / newW;
      const scaleY = prevH / newH;

      img.set({
        left: selectedObject.left,
        top: selectedObject.top,
        angle: selectedObject.angle,
        flipX: selectedObject.flipX,
        flipY: selectedObject.flipY,
        originX: selectedObject.originX,
        originY: selectedObject.originY,
        scaleX,
        scaleY,
      });

      canvas.remove(selectedObject);
      canvas.add(img);
      canvas.setActiveObject(img);
      incrementObjectCount();
      canvas.renderAll();
      get().updateLayers();
    } catch (error) {
      alert(`Error erasing region: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  },

  maskDrawingMode: false,
  maskCanvas: null,
  setMaskDrawingMode: (mode) => set({ maskDrawingMode: mode }),
  setMaskCanvas: (canvas) => set({ maskCanvas: canvas }),

  handleCanvasAction: (type, payload = null) => {
    const store = get();
    const canvas = store.canvas;

    switch (type) {
      case "ADD_TEXT":
        store.addText();
        break;
      case "BLANK_CANVAS":
        store.addBlankCanvas();
        break;
      case "ADD_IMAGE_BACKGROUND":
        store.addImageBackground();
        break;
      case "ADD_RECTANGLE":
        store.addRectangle();
        break;
      case "ADD_CIRCLE":
        store.addCircle();
        break;
      case "ADD_TRIANGLE":
        store.addTriangle();
        break;
      case "ADD_LINE":
        store.addLine();
        break;
      case "ADD_ARROW":
        store.addArrow();
        break;
      case "TOGGLE_BRUSH":
        if (canvas) {
          canvas.isDrawingMode = true;

          if (!canvas.freeDrawingBrush) {
            canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
          }

          const { brushSize, brushColor } = get();
          canvas.freeDrawingBrush.width = brushSize;
          canvas.freeDrawingBrush.color = brushColor;
        }
        set({ activeTool: "brush" });
        break;
      case "TOGGLE_ERASER":
        if (canvas) {
          canvas.isDrawingMode = true;

          if (!canvas.freeDrawingBrush) {
            canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
          }

          const { brushSize: eraserSize } = get();
          canvas.freeDrawingBrush.width = eraserSize;
          canvas.freeDrawingBrush.color = '#ffffff';
        }
        set({ activeTool: "eraser" });
        break;
      case "CANCEL_TOOL":
        if (canvas) {
          canvas.isDrawingMode = false;
        }
        set({ activeTool: null });
        break;
      case "UPLOAD_IMAGE":
        set({ activeTool: "upload" });
        break;
      case "Image":
        store.sendTestRequest();
        break;
    }
    set({ isInsertOpen: false });
  },

  isExportDialogOpen: false,
  setExportDialogOpen: (isOpen) => set({ isExportDialogOpen: isOpen }),

  handleDuplicate: async () => {
    const canvas = get().canvas;
    const activeObject = canvas.getActiveObject();

    if (activeObject) {
      try {
        const clonedObj = await activeObject.clone();

        // Get the bounding box to calculate proper offset
        const boundingRect = activeObject.getBoundingRect();
        const offsetX = boundingRect.width + 20;

        clonedObj.set({
          left: activeObject.left + offsetX,
          top: activeObject.top,
          evented: true,
          selectable: true,
        });

        canvas.add(clonedObj);
        canvas.setActiveObject(clonedObj);
        canvas.requestRenderAll();

        // Focus and center cloned obj
        const clonedBoundingRect = clonedObj.getBoundingRect();
        const canvasCenter = canvas.getCenter();
        const viewportTransform = canvas.viewportTransform;
        
        // Calculate the center point of the cloned object
        const objCenterX = clonedBoundingRect.left + clonedBoundingRect.width / 2;
        const objCenterY = clonedBoundingRect.top + clonedBoundingRect.height / 2;
        
        // Pan the canvas to center the object
        const panX = canvasCenter.left - objCenterX;
        const panY = canvasCenter.top - objCenterY;
        
        canvas.relativePan({ x: panX, y: panY });
        canvas.requestRenderAll();

        get().updateLayers();
      } catch (error) {
        alert('Unable to duplicate this object');
      }
    }
  },

  handleExport: (options = {}) => {
    const canvas = get().canvas;
    if (!canvas) {
      return;
    }

    const activeObject = canvas.getActiveObject();
    if (!activeObject) {
      alert('Please select an object to export');
      return;
    }

    const {
      format = 'png',
      quality = 1,
      scale = 2,
    } = options;

    try {
      const objectName = activeObject.name || activeObject.type || 'object';
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `${objectName}-${timestamp}.${format}`;

      // Handle SVG export separately
      if (format === 'svg') {
        // Check if object is vector (not raster image)
        if (activeObject.type === 'image') {
          alert('Cannot export raster images as SVG. Please select a vector object or use PNG/JPG format.');
          return;
        }

        // Export as SVG
        const svgString = activeObject.toSVG();
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return;
      }

      // Handle raster formats (PNG, JPG, WebP)
      const originalLeft = activeObject.left;
      const originalTop = activeObject.top;

      activeObject.set({
        left: activeObject.width / 2,
        top: activeObject.height / 2,
      });
      activeObject.setCoords();

      const exportOptions = {
        format: format === 'jpg' ? 'jpeg' : format,
        quality: quality,
        multiplier: scale,
        enableRetinaScaling: true,
      };

      if (format === 'jpg') {
        exportOptions.backgroundColor = '#FFFFFF';
      }

      const dataURL = activeObject.toDataURL(exportOptions);

      activeObject.set({
        left: originalLeft,
        top: originalTop,
      });
      activeObject.setCoords();
      canvas.renderAll();

      const link = document.createElement('a');
      link.download = filename;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert('Failed to export object. Please try again.');
    }
  },

  // Layer Management
  layers: [],
  setLayers: (layers) => set({ layers }),

  updateLayers: () => {
    const canvas = get().canvas;
    if (canvas) {
      // Get all objects in reverse order (top to bottom as users expect in layers panel)
      const objects = [...canvas.getObjects()].reverse();
      set({ layers: objects });
    }
  },

  bringForward: (obj) => {
    const canvas = get().canvas;
    if (canvas && obj) {
      canvas.bringForward(obj);
      canvas.renderAll();
      get().updateLayers();
    }
  },

  sendBackward: (obj) => {
    const canvas = get().canvas;
    if (canvas && obj) {
      canvas.sendBackwards(obj);
      canvas.renderAll();
      get().updateLayers();
    }
  },

  toggleVisibility: (obj) => {
    const canvas = get().canvas;
    if (canvas && obj) {
      obj.set("visible", !obj.visible);
      canvas.renderAll();
      get().updateLayers();
    }
  },

  toggleLock: (obj) => {
    const canvas = get().canvas;
    if (canvas && obj) {
      const isLocked = !obj.lockMovementX;
      obj.set({
        lockMovementX: isLocked,
        lockMovementY: isLocked,
        lockRotation: isLocked,
        lockScalingX: isLocked,
        lockScalingY: isLocked,
        hasControls: !isLocked,
        selectable: !isLocked,
      });
      canvas.renderAll();
      get().updateLayers();
    }
  },

  deleteObject: (obj) => {
    const canvas = get().canvas;
    if (canvas && obj) {
      canvas.remove(obj);
      canvas.discardActiveObject();
      canvas.renderAll();
      set({ selectedObject: null });
      get().updateLayers();
    }
  },
  // FOR ADDING IMAGE INSIDE THE CANVAS
  addAIImage: async (url) => {
    const {
      canvas,
      selectedObject,
      getNextPosition,
      focusObject,
      incrementObjectCount,
      setProcessing,
    } = get();
    if (!canvas) {
      console.error("Canvas not initialized");
      return;
    }

    if (!url) {
      console.error("No image URL provided");
      return;
    }

    setProcessing(true, "Loading AI generated image...");

    try {
      const isSVG = url.toLowerCase().endsWith('.svg');
      
      if (isSVG) {
        const svgResponse = await fetch(url);
        const svgText = await svgResponse.text();
        
        const { objects, options } = await fabric.loadSVGFromString(svgText);
        
        if (!objects || objects.length === 0) {
          throw new Error('Failed to parse SVG - no objects found');
        }
        
        const svg = fabric.util.groupSVGElements(objects, options);
        const pos = getNextPosition();
        
        const naturalWidth = svg.width || 100;
        const naturalHeight = svg.height || 100;
        
        const maxSize = 512;
        let scale = 1;
        
        if (naturalWidth > maxSize || naturalHeight > maxSize) {
          scale = Math.min(maxSize / naturalWidth, maxSize / naturalHeight);
        } else if (naturalWidth < 100 && naturalHeight < 100) {
          scale = Math.min(512 / naturalWidth, 512 / naturalHeight);
        }

        svg.set({
          left: pos.left,
          top: pos.top,
          originX: "left",
          originY: "center",
          scaleX: scale,
          scaleY: scale,
        });

        canvas.add(svg);
        canvas.setActiveObject(svg);
        focusObject(svg);
        incrementObjectCount();
        canvas.renderAll();
        get().updateLayers();
      } else {
        const img = await fabric.FabricImage.fromURL(url, {
          crossOrigin: "anonymous",
        });

        if (!img) {
          return;
        }

        const pos = getNextPosition();

        img.set({
          left: pos.left,
          top: pos.top,
          originX: "left",
          originY: "center",
          scaleX: 0.4,
          scaleY: 0.4,
        });

        canvas.add(img);
        canvas.setActiveObject(img);
        focusObject(img);
        incrementObjectCount();
        canvas.renderAll();
        get().updateLayers();
      }
    } catch (error) {
      alert(`Error loading image: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  },
}));

export default useStore;
