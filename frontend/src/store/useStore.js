import { create } from "zustand";
import * as fabric from "fabric";

// Extract classes the correct way:
const { IText, Rect, Circle, Line, Triangle, Group } = fabric;

// Correct image class
const FabricImage = fabric.FabricImage;

const useStore = create((set, get) => ({
  // Canvas Instance
  canvas: null,
  setCanvas: (canvas) => set({ canvas }),

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
  activeTool: null, // 'image', 'frame', etc.
  setActiveTool: (tool) => set({ activeTool: tool }),

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
      const response = await fetch("http://127.0.0.1:8000/test", {
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
    // const fabric = window.fabric; // Removed to use imported fabric
    const { canvas, selectedObject, updateLayers } = get();

    if (!selectedObject || selectedObject.type !== "image") {
      alert("Please select an image first.");
      return;
    }

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

      const response = await fetch("http://127.0.0.1:8000/vectorizeImage", {
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
    }
  },

  forRemovingBG: async () => {
    const { canvas, selectedObject, focusObject, incrementObjectCount } = get();
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

      const response = await fetch("http://127.0.0.1:8000/removebg", {
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
    }
  },

  /*forRemovingBG: async () => {
    alert("sdsdsdsd");
    try {
      const response = await fetch("http://127.0.0.1:8000/removebg", {
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
        set({ activeTool: "brush" });
        break;
      case "CANCEL_TOOL":
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
    } = get();
    if (!canvas) {
      console.error("Canvas not initialized");
      return;
    }

    if (!url) {
      console.error("No image URL provided");
      return;
    }

    try {
      // If an image object is selected → replace its image
      if (selectedObject && selectedObject.type === "image") {
        try {
          const img = await fabric.FabricImage.fromURL(url, {
            crossOrigin: "anonymous",
          });
          if (img) {
            // Get the current position and size of the selected image
            const currentLeft = selectedObject.left;
            const currentTop = selectedObject.top;
            const currentScaleX = selectedObject.scaleX;
            const currentScaleY = selectedObject.scaleY;

            // Replace the image source
            selectedObject.setSrc(url, () => {
              // Restore position and scale
              selectedObject.set({
                left: currentLeft,
                top: currentTop,
                scaleX: currentScaleX,
                scaleY: currentScaleY,
              });
              canvas.renderAll();
              get().updateLayers();
            });
          }
        } catch (error) {
          console.error("Error replacing image:", error);
          // Fall through to create new image instead
        }
        return;
      }

      // Otherwise → create a new image
      const img = await fabric.FabricImage.fromURL(url, {
        crossOrigin: "anonymous", // Handle CORS for external images
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
    }
  },
}));

export default useStore;
