# Erase Region - Quick Start Guide

## Overview
The Erase Region feature allows you to selectively erase parts of images by drawing a mask where white areas indicate regions to erase.

## How to Use

### Step 1: Select an Image
1. Upload or generate an image in the canvas
2. Click on the image to select it
3. The Right Panel will appear automatically

### Step 2: Open Erase Region Tool
1. In the Right Panel, find the "Erase Region" section
2. Click to expand it (look for the Eraser icon)
3. You'll see a preview canvas with your image

### Step 3: Draw the Mask
1. **Draw on the canvas** with your mouse
   - White areas = will be erased
   - Black areas = will be kept
2. **Adjust brush size** using the slider (5-50px)
3. Use the **Clear** button to reset if needed

### Step 4: Apply Changes
1. Click the **Apply** button
2. Wait for processing (usually 2-5 seconds)
3. Your image will update with the erased regions

## Tips & Tricks

### Best Practices
- **Start with a larger brush** for rough areas
- **Use a smaller brush** for detailed edges
- **Preview your mask** before applying
- **Draw continuously** for smooth results

### Common Use Cases
- Remove unwanted objects from photos
- Create custom cutouts
- Erase backgrounds selectively
- Clean up image edges

### Keyboard Shortcuts
- **No direct shortcuts** for Erase Region
- Use **V** to select objects
- Use **Esc** to cancel/deselect

## Technical Notes

### Mask Format
- **Black (#000000)** = Keep this area
- **White (#ffffff)** = Erase this area
- Must be pure black/white (no gray)

### Image Requirements
- Only works with **raster images** (PNG, JPG)
- Max file size: **5 MB**
- Max resolution: **4 MP**
- Max dimension: **4096px**

### API Processing
- Uses Recraft AI's erase region endpoint
- Maintains original image position and scale
- Preserves rotation and flip states

## Troubleshooting

### Tool not visible?
- Make sure you selected a **raster image** (not SVG/shape)
- Check if the image is properly loaded

### Apply button not working?
- Ensure you drew some white strokes on the mask
- Check your internet connection
- Verify API key is configured

### Poor results?
- Try using a larger brush for smoother edges
- Redraw the mask with more precision
- Ensure white areas cover exactly what you want to erase

## Examples

### Example 1: Remove Background Object
```
1. Select image with unwanted object
2. Draw white mask over the object
3. Click Apply
4. Object is erased, background fills in
```

### Example 2: Create Custom Shape
```
1. Select rectangular image
2. Draw white mask around edges
3. Click Apply
4. Creates custom-shaped image
```

### Example 3: Clean Up Edges
```
1. Select cutout image with rough edges
2. Use small brush to mark rough areas
3. Click Apply
4. Edges are smoothed out
```

## Related Features

- **Remove Background**: Full auto background removal
- **Brush Tool**: Draw on canvas (not edit image)
- **Vectorize**: Convert to vector format
- **Crisp Upscale**: Enhance image quality

---

**Need Help?** Check the full documentation in `ERASE_REGION_COMPLETE.md`

