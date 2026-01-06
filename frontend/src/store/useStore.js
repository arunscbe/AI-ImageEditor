import { create } from "zustand";
import * as fabric from "fabric";
import { getApiUrl } from "../config/api";

// Extract classes the correct way:
const { IText, Rect, Circle, Line, Triangle, Group } = fabric;

// Correct image class
const FabricImage = fabric.FabricImage;

const useStore = create((set, get) => ({
  // Canvas Instance
  canvas: null,
  setCanvas: (canvas) => set({ canvas }),

  // Processing State
  isProcessing: false,
  processingMessage: '',
  setProcessing: (isProcessing, message = '') =>
    set({ isProcessing, processingMessage: message }),

  // Project Intent State
  projectIntent: null,
  setProjectIntent: (intent) => set({ projectIntent: intent }),
  suggestedPrompts: [],
  setSuggestedPrompts: (prompts) => set({ suggestedPrompts: prompts }),

  // Zoom State
  zoom: 100,
  setZoom: (zoom) => set({ zoom }),

  // TopNav State
  isInsertOpen: false,
  toggleInsertMenu: () =>
    set((state) => ({ isInsertOpen: !state.isInsertOpen })),
  closeInsertMenu: () => set({ isInsertOpen: false }),

  // Layers Panel State
  isLayersPanelOpen: true,
  toggleLayersPanel: () =>
    set((state) => ({ isLayersPanelOpen: !state.isLayersPanelOpen })),

  // Sidebar State
  activeTool: null, // 'image', 'frame', 'brush', 'eraser', etc.
  setActiveTool: (tool) => set({ activeTool: tool }),

  // Brush State
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

  // Selection State
  selectedObject: null,
  setSelectedObject: (obj) => set({ selectedObject: obj }),

  // Viewport Actions
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
  // Positioning State
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

  // Canvas Actions
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

  // Function to send test request to backend
  sendTestRequest: async () => {
    try {
      const response = await fetch(getApiUrl("/test"), {
        method: "GET", // or "POST" if you prefer
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Backend Response:", data);
    } catch (error) {
      console.error("Error sending request:", error);
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

      // Fetch SVG text
      const svgResponse = await fetch(svgUrl);

      const svgText = await svgResponse.text();
      console.log(svgResponse, svgText);
      // Fabric v6 (browser): correct SVG load
      const { objects, options } = await fabric.loadSVGFromString(svgText);
      const svg = fabric.util.groupSVGElements(objects, options);

      const naturalW = svg.width;
      const naturalH = svg.height;

      svg.scaleX = prevW / naturalW;
      svg.scaleY = prevH / naturalH;
      svg.set({ ...placement });

      canvas.remove(selectedObject);
      canvas.add(svg);
      canvas.setActiveObject(svg);
      canvas.renderAll();
      updateLayers();
    } catch (error) {
      console.error("Vectorize error:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  },

  forRemovingBG: async () => {
    const { canvas, selectedObject, focusObject, incrementObjectCount, setProcessing } = get();
    console.log(selectedObject);
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
      console.log("removeBG Response:", data);

      const cleanedUrl = data?.image?.url;
      if (!cleanedUrl) {
        alert("Background removal failed.");
        return;
      }
      const img = await fabric.FabricImage.fromURL(cleanedUrl, {
        crossOrigin: "anonymous", // Handle CORS for external images
      });
      if (!img) {
        console.error("Failed to load image from URL:", url);
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
      // focusObject(img);
      incrementObjectCount();
      canvas.renderAll();
      get().updateLayers();
    } catch (error) {
      console.error("Error removing BG:", error);
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

    setProcessing(true, "Upscaling image...");

    try {
      const dataURL = selectedObject.toDataURL({
        format: "png",
        quality: 1,
      });

      const blob = await (await fetch(dataURL)).blob();

      const formData = new FormData();
      formData.append("image", blob, "upscale.png");

      const response = await fetch(getApiUrl("/upscale"), {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Upscale Response:", data);

      const upscaledUrl = data?.image?.url;
      if (!upscaledUrl) {
        alert("Image upscaling failed.");
        return;
      }

      const img = await fabric.FabricImage.fromURL(upscaledUrl, {
        crossOrigin: "anonymous",
      });

      if (!img) {
        console.error("Failed to load upscaled image from URL:", upscaledUrl);
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
      console.error("Error upscaling image:", error);
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
      
      console.log('Image dimensions:', {
        natural: `${naturalWidth}x${naturalHeight}`,
        scaled: `${selectedObject.getScaledWidth()}x${selectedObject.getScaledHeight()}`
      });

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = naturalWidth;
      tempCanvas.height = naturalHeight;
      const tempCtx = tempCanvas.getContext('2d');
      
      tempCtx.drawImage(imgElement, 0, 0, naturalWidth, naturalHeight);
      
      const imageDataURL = tempCanvas.toDataURL('image/png');

      const imageBlob = await (await fetch(imageDataURL)).blob();
      const maskBlob = await (await fetch(maskDataURL)).blob();

      console.log('Sending to API:', {
        imageSize: `${imageBlob.size} bytes`,
        maskSize: `${maskBlob.size} bytes`,
        imageType: imageBlob.type,
        maskType: maskBlob.type
      });

      const formData = new FormData();
      formData.append("image", imageBlob, "image.png");
      formData.append("mask", maskBlob, "mask.png");

      const response = await fetch(getApiUrl("/erase-region"), {
        method: "POST",
        body: formData,
      });

      console.log('API Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Erase Region Response:", data);

      const erasedUrl = data?.image?.url;
      if (!erasedUrl) {
        alert("Image erase region failed.");
        return;
      }

      const img = await fabric.FabricImage.fromURL(erasedUrl, {
        crossOrigin: "anonymous",
      });

      if (!img) {
        console.error("Failed to load erased image from URL:", erasedUrl);
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
      console.error("Error erasing region:", error);
      alert(`Error erasing region: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  },

  maskDrawingMode: false,
  maskCanvas: null,
  setMaskDrawingMode: (mode) => set({ maskDrawingMode: mode }),
  setMaskCanvas: (canvas) => set({ maskCanvas: canvas }),

  /*forRemovingBG: async () => {
    alert("sdsdsdsd");
    try {
      const response = await fetch(getApiUrl("/removebg"), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);
      if (!response.ok) {
        throw new error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("response data=>", data);
    } catch (error) {
      console.error("Error removing BG:", error);
      alert(`Error: ${error.message}`);
    }
  },*/
  handleCanvasAction: (type, payload = null) => {
    const store = get();
    const canvas = store.canvas;

    switch (type) {
      case "ADD_TEXT":
        store.addText();
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

        console.log('Object duplicated successfully');
      } catch (error) {
        console.error('Error duplicating object:', error);
        alert('Unable to duplicate this object');
      }
    } else {
      console.log("No object is currently selected.");
    }
  },

  handleExport: (options = {}) => {
    const canvas = get().canvas;
    if (!canvas) {
      console.error('Canvas not initialized');
      return;
    }

    const activeObject = canvas.getActiveObject();
    if (!activeObject) {
      console.warn('No object selected to export');
      alert('Please select an object to export');
      return;
    }

    const {
      format = 'png',
      quality = 1,
      scale = 2,
    } = options;

    try {
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
      const objectName = activeObject.name || activeObject.type || 'object';
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      link.download = `${objectName}-${timestamp}.${format}`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('Object exported successfully:', link.download);
    } catch (error) {
      console.error('Error exporting object:', error);
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
      const img = await fabric.FabricImage.fromURL(url, {
        crossOrigin: "anonymous",
      });

      if (!img) {
        console.error("Failed to load image from URL:", url);
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
    } catch (error) {
      console.error("Error loading image:", error);
      console.error("Image URL:", url);
    } finally {
      setProcessing(false);
    }
  },
}));

export default useStore;
