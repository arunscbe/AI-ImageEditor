# Erase Region Feature - Implementation Complete ✅

**Date:** January 2, 2026  
**Status:** ✅ Fully Implemented  
**API:** Recraft AI - Erase Region Endpoint

---

## Overview

The **Erase Region** feature allows users to selectively erase parts of raster images by drawing a mask. White pixels in the mask indicate regions to erase, while black pixels mark areas to keep intact. This feature integrates with the Recraft AI API for intelligent region removal.

---

## Features Added

### 1. ✅ Backend API Endpoint
- New FastAPI router for `/erase-region`
- Handles multipart form-data with image and mask files
- Validates image dimensions and formats
- Returns processed image URL from Recraft AI

### 2. ✅ Interactive Mask Drawing Tool
- Canvas-based drawing interface
- Adjustable brush size (5-50px)
- Real-time mask preview with image overlay
- Clear and Apply actions

### 3. ✅ UI Integration
- Integrated into ImagePropertiesPanel
- Collapsible accordion section
- Only visible for raster images
- Clean, modern design matching existing UI

### 4. ✅ Store Management
- `eraseRegion()` method in Zustand store
- Maintains image position, scale, and rotation
- Proper error handling and user feedback
- Processing state management

---

## Implementation Details

### Backend (`backend/eraseRegion.py`)

```python
@router.post("/erase-region")
async def erase_region(
    image: UploadFile = File(...),
    mask: UploadFile = File(...),
    response_format: Optional[str] = Form("url")
)
```

**Request:**
- `image`: Raster image file (PNG, JPG, WEBP)
- `mask`: Grayscale mask (black/white)
- `response_format`: "url" or "b64_json" (optional)

**Response:**
```json
{
  "image": {
    "url": "https://img.recraft.ai/..."
  }
}
```

**Validation:**
- Max file size: 5 MB
- Max resolution: 4 MP (megapixels)
- Max dimension: 4096px
- Min dimension: 32px
- Mask must match image dimensions exactly

---

### Frontend Components

#### 1. **EraseRegionTool.jsx** (NEW)

Interactive canvas-based mask drawing tool.

**Features:**
- HTML5 Canvas for mask drawing
- Image preview overlay (30% opacity)
- Brush size slider (5-50px)
- Clear button (resets mask to black)
- Apply button (sends to API)

**Drawing Logic:**
```javascript
// Black canvas = keep everything
// White brush strokes = erase these areas
ctx.fillStyle = '#000000';  // Background (keep)
ctx.fillStyle = '#ffffff';  // Brush (erase)
```

**User Flow:**
1. Open "Erase Region" accordion
2. Draw white areas on the preview
3. Adjust brush size as needed
4. Click "Clear" to reset or "Apply" to process

---

#### 2. **ImagePropertiesPanel.jsx** (MODIFIED)

Added new collapsible section for Erase Region tool.

```jsx
{isRasterImage && (
  <div className="border-b border-gray-200">
    <button onClick={() => setIsEraseRegionOpen(!isEraseRegionOpen)}>
      <Eraser /> Erase Region
    </button>
    <div className={isEraseRegionOpen ? "max-h-[800px]" : "max-h-0"}>
      <EraseRegionTool />
    </div>
  </div>
)}
```

---

#### 3. **useStore.js** (MODIFIED)

Added `eraseRegion()` method to Zustand store.

```javascript
eraseRegion: async (maskDataURL) => {
  // 1. Convert selected image to blob
  // 2. Convert mask canvas to blob
  // 3. Send both to backend API
  // 4. Load processed image from URL
  // 5. Replace original image while preserving position/scale
}
```

**Preserves:**
- Position (left, top)
- Scale (scaleX, scaleY)
- Rotation (angle)
- Flip state (flipX, flipY)
- Origin point (originX, originY)

---

## Technical Architecture

### Data Flow

```
User draws mask → Canvas → DataURL → Blob
                                      ↓
                              FormData with image + mask
                                      ↓
                              Backend API (/erase-region)
                                      ↓
                              Recraft AI API
                                      ↓
                              Processed Image URL
                                      ↓
                              Fabric.js FabricImage
                                      ↓
                              Replace on canvas (preserving transforms)
```

---

### Mask Format Requirements

**Canvas Drawing:**
- Pure black (#000000, RGB 0,0,0) = Keep intact
- Pure white (#ffffff, RGB 255,255,255) = Erase
- No gray values (must be binary)

**Image Dimensions:**
- Mask canvas automatically matches source image dimensions
- No manual resizing needed

---

## Files Modified/Created

### Created (2 files)
1. `backend/eraseRegion.py` - API endpoint
2. `frontend/src/components/EraseRegionTool.jsx` - Drawing UI

### Modified (3 files)
1. `backend/main.py` - Register erase router
2. `frontend/src/store/useStore.js` - Add eraseRegion method
3. `frontend/src/components/ImagePropertiesPanel.jsx` - Add UI section

---

## Usage Guide

### For Users

1. **Select a raster image** on the canvas
2. **Open Right Panel** (appears automatically)
3. **Expand "Erase Region"** accordion
4. **Draw on the preview** to mark areas to erase (white = erase)
5. **Adjust brush size** using the slider (5-50px)
6. **Click "Clear"** to start over if needed
7. **Click "Apply"** to process the image
8. **Wait for processing** (shows loading state)
9. **Image updates** in place with erased regions

### For Developers

```javascript
// Manual API call
const { eraseRegion } = useStore();
await eraseRegion(maskCanvasDataURL);

// Access store state
const { isProcessing, processingMessage } = useStore();
```

---

## Error Handling

### Backend Errors
- **400 Bad Request**: Invalid file format or dimensions
- **413 Payload Too Large**: Files exceed 5MB
- **500 Internal Server Error**: API or network issues

### Frontend Errors
- Alert dialog with error message
- Processing state reset
- Original image preserved on failure

### User Feedback
- Processing overlay during API calls
- "Erasing region..." message
- Success: Image updates automatically
- Failure: Alert with error details

---

## API Constraints (Recraft AI)

### File Requirements
- **Formats**: PNG, JPG, WEBP
- **Max Size**: 5 MB per file
- **Max Resolution**: 4 MP (megapixels)
- **Max Dimension**: 4096px (width or height)
- **Min Dimension**: 32px (width or height)

### Mask Requirements
- **Color Mode**: Grayscale
- **Values**: Only pure black (0) or pure white (255)
- **Dimensions**: Must exactly match image dimensions

---

## Testing Checklist

### Backend Tests
- [x] `/erase-region` endpoint responds
- [x] Accepts multipart form-data
- [x] Validates file types
- [x] Returns valid JSON response
- [x] Handles API errors gracefully

### Frontend Tests
- [x] EraseRegionTool renders for images
- [x] Canvas initializes with correct dimensions
- [x] Drawing creates white strokes on black canvas
- [x] Brush size slider works (5-50px)
- [x] Clear button resets canvas to black
- [x] Apply button sends data to API
- [x] Processing overlay appears during API call
- [x] Image updates with erased regions
- [x] Error messages display on failure
- [x] Component hidden for non-image objects

### Integration Tests
- [x] Tool only available for raster images
- [x] Image position/scale/rotation preserved
- [x] Layers panel updates correctly
- [x] Undo/redo compatibility (via canvas history)
- [x] Multiple erase operations on same image

---

## Known Limitations

1. **Raster Images Only**
   - Does not work on SVG, shapes, or text
   - Check: `selectedObject.type === 'image'`

2. **No Undo in Drawing**
   - Mask drawing has no undo (use "Clear")
   - Final image can be undone via canvas undo

3. **Binary Mask Only**
   - No gradient/partial erasing
   - Only pure black/white pixels

4. **No Mask Save/Load**
   - Cannot save mask for later use
   - Each operation creates fresh mask

5. **Canvas Size Constraints**
   - Drawing canvas fixed at 160px height (CSS)
   - Mask internally matches image dimensions
   - May be hard to draw on very large images

---

## Future Enhancements

### Potential Improvements

1. **Gradient Erasing**
   - Support grayscale masks for soft edges
   - Opacity control for partial transparency

2. **Mask Templates**
   - Save/load common mask patterns
   - Presets for corners, edges, centers

3. **Smart Selection Tools**
   - Magic wand for color-based selection
   - Lasso/polygon selection
   - AI-powered object detection

4. **Undo/Redo for Drawing**
   - Canvas history stack
   - Keyboard shortcuts (Ctrl+Z)

5. **Zoom/Pan in Preview**
   - Detailed editing on small areas
   - Better for high-resolution images

6. **Multi-Mask Layers**
   - Combine multiple masks
   - Boolean operations (union, subtract)

7. **Invert Mask**
   - Quick toggle black/white
   - Easier for complex selections

---

## API Reference

### Store Methods

```javascript
// Erase region using mask
eraseRegion(maskDataURL: string): Promise<void>

// Processing state
setProcessing(isProcessing: boolean, message?: string): void
```

### Component Props

```javascript
// EraseRegionTool (no props - uses store)
<EraseRegionTool />

// Auto-detects selectedObject from store
// Renders null if no image selected
```

---

## Troubleshooting

### Issue: Canvas not drawing
**Solution:** Check if image is selected and loaded

### Issue: Apply button does nothing
**Solution:** Ensure mask has white strokes (check canvas content)

### Issue: API returns 400 error
**Solution:** Verify mask dimensions match image exactly

### Issue: Processing never completes
**Solution:** Check network connection and API key validity

### Issue: Image quality degraded
**Solution:** Original image may exceed API constraints (4MP max)

---

## Status: ✅ Production Ready

All features implemented and tested. Ready for use with raster images in the canvas editor.

**Quick Start:**
1. Upload or create a raster image
2. Select it on the canvas
3. Open Right Panel → Erase Region
4. Draw mask and click Apply

---

## Related Features

- **Remove Background**: Full background removal (no mask needed)
- **Brush/Eraser**: Canvas-level drawing (not image editing)
- **Vectorize**: Convert raster to vector (different API)
- **Crisp Upscale**: Enhance image resolution

---

## Dependencies

### Backend
- FastAPI
- python-multipart (for file uploads)
- requests (for API calls)
- python-dotenv (for env vars)

### Frontend
- React 18+
- Zustand (state management)
- Fabric.js v6 (canvas)
- Lucide React (icons)
- Tailwind CSS (styling)

---

**Implementation Complete** - January 2, 2026

