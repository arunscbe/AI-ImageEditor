# Brush Tool Fix

**Date:** January 2, 2026  
**Status:** ✅ Fixed  

---

## Problem

The brush tool was broken - clicking the brush button would not enable drawing mode.

## Root Cause

In the `handleCanvasAction` function in `useStore.js`, the `TOGGLE_BRUSH` case was trying to set properties on `canvas.freeDrawingBrush` before it was initialized:

```javascript
case "TOGGLE_BRUSH":
  if (canvas) {
    canvas.isDrawingMode = true;
    canvas.freeDrawingBrush.width = 4;  // ❌ freeDrawingBrush is undefined!
    canvas.freeDrawingBrush.color = '#111111ff';
  }
  set({ activeTool: "brush" });
  break;
```

This would cause a JavaScript error: **Cannot read properties of undefined (reading 'width')**.

---

## Solution

Added a check to initialize the `PencilBrush` if it doesn't exist:

```javascript
case "TOGGLE_BRUSH":
  if (canvas) {
    canvas.isDrawingMode = true;
    
    // Initialize brush if not exists
    if (!canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    }
    
    canvas.freeDrawingBrush.width = 4;
    canvas.freeDrawingBrush.color = '#111111ff';
  }
  set({ activeTool: "brush" });
  break;
```

---

## How It Works Now

1. User clicks "Brush" button in TopNav or presses "B" shortcut
2. `handleCanvasAction("TOGGLE_BRUSH")` is called
3. Store checks if brush exists, creates it if needed
4. Sets canvas to drawing mode
5. Configures brush width (4px) and color (black)
6. Sets `activeTool` to "brush"
7. CanvasArea's useEffect sees activeTool change and ensures drawing mode
8. User can now draw on canvas
9. When path is created, `object:added` event fires
10. Layers panel updates automatically

---

## Testing

**To test the brush:**
1. Click the "Brush" button in the TopNav (or press "B")
2. Canvas should enter drawing mode
3. Draw on the canvas - you should see black lines
4. Press Escape to exit brush mode
5. Drawn paths should appear in the Layers panel
6. Drawn paths can be selected, moved, deleted like any other object

---

## Files Modified

1. **frontend/src/store/useStore.js**
   - Added initialization check for `freeDrawingBrush`
   - Prevents undefined error when toggling brush mode

---

## Additional Notes

The brush functionality works in tandem with:
- **TopNav.jsx**: Brush button that triggers `TOGGLE_BRUSH`
- **CanvasArea.jsx**: useEffect that monitors `activeTool` and ensures drawing mode
- **FeatureFlags**: Controlled by `BRUSH_TOOL` feature flag (enabled by default)

The brush creates Fabric.js `Path` objects which are treated as regular canvas objects - they can be:
- Selected
- Moved
- Scaled
- Rotated
- Deleted
- Shown in layers panel

---

## Status: ✅ Fixed and Ready to Test

The browser should auto-reload with the fix. Try clicking the Brush button now!


