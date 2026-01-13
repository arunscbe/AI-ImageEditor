# Quick Test Guide: Crisp Upscale Feature

## Prerequisites
- Backend running on `http://127.0.0.1:8000`
- Frontend running with Vite dev server
- `RECRAFT_API_KEY` set in backend `.env` file
- Feature flag `CRISP_UPSCALE` enabled (default: true)

## Manual Testing Steps

### 1. Start Services

**Backend:**
```bash
cd backend
python main.py
```
Expected: FastAPI server running on port 8000

**Frontend:**
```bash
cd frontend
npm run dev
```
Expected: Vite dev server running (typically port 5173)

### 2. Basic Upscale Test

1. Open the application in browser
2. Create a new project (select any intent)
3. Upload an image OR generate one with AI
4. Click on the image to select it
5. Look for "Crisp upscale" button in TopNav (Wand2 icon)
6. Click the "Crisp upscale" button
7. Wait for "Upscaling image..." overlay
8. Verify upscaled image replaces original
9. Check that position/rotation/scale are maintained

**Expected Result:**
- ✅ Image is replaced with higher quality version
- ✅ Position unchanged
- ✅ Size on canvas unchanged
- ✅ Rotation preserved
- ✅ Layers panel updates

### 3. Edge Cases

#### Test A: No Image Selected
1. Deselect all objects (click on empty canvas)
2. Click "Crisp upscale" button
3. **Expected**: Button should not be visible (only shows when image selected)

#### Test B: Non-Image Object Selected
1. Add text object to canvas
2. Select the text object
3. **Expected**: "Crisp upscale" button not visible

#### Test C: Feature Flag Disabled
1. Open Feature Flags panel (Settings icon in TopNav)
2. Disable "Crisp Upscale" feature
3. Select an image object
4. **Expected**: "Crisp upscale" button not visible

#### Test D: Rotated Image
1. Add image to canvas
2. Rotate image 45 degrees
3. Click "Crisp upscale"
4. **Expected**: Image upscaled and rotation maintained at 45 degrees

#### Test E: Flipped Image
1. Add image to canvas
2. Flip image horizontally or vertically
3. Click "Crisp upscale"
4. **Expected**: Image upscaled and flip state preserved

#### Test F: Scaled Image
1. Add image to canvas
2. Scale image down to 50% size
3. Click "Crisp upscale"
4. **Expected**: Image upscaled but display size remains at 50%

### 4. Error Scenarios

#### Test G: Backend Offline
1. Stop backend server
2. Try to upscale an image
3. **Expected**: Error alert with message

#### Test H: Invalid API Key
1. Set invalid `RECRAFT_API_KEY` in `.env`
2. Restart backend
3. Try to upscale an image
4. **Expected**: Error alert (likely 401 Unauthorized)

#### Test I: Network Timeout
1. Disconnect internet
2. Try to upscale an image
3. **Expected**: Error alert with network error message

### 5. Console Verification

Open browser DevTools Console and check for:
- No JavaScript errors
- "Upscale Response:" log with successful response
- Canvas render calls completing

Open backend terminal and check for:
- "Upscale Response:" log with API response
- No 500 errors
- Successful POST to Recraft API

## API Response Format

**Expected Success Response:**
```json
{
  "image": {
    "url": "https://...upscaled-image.png"
  }
}
```

## Common Issues & Solutions

### Issue: Button not appearing
- **Solution**: Check if image is selected and feature flag is enabled

### Issue: "Please select an image first" alert
- **Solution**: Click on an image object to select it first

### Issue: Processing spinner never disappears
- **Solution**: Check backend logs for errors, verify API key

### Issue: Image disappears after upscale
- **Solution**: Check console for URL loading errors, verify CORS

### Issue: Image position changes after upscale
- **Solution**: Bug in code - verify placement calculations in store

## Performance Benchmarks

Expected operation times (will vary by image size):
- Small image (< 500KB): 2-5 seconds
- Medium image (500KB - 2MB): 5-10 seconds
- Large image (> 2MB): 10-20 seconds

## Verification Checklist

- [ ] Backend endpoint `/upscale` accessible
- [ ] Button visible when image selected
- [ ] Button hidden when non-image selected
- [ ] Processing overlay displays during operation
- [ ] Image successfully upscaled
- [ ] Position maintained
- [ ] Rotation maintained
- [ ] Scale maintained
- [ ] Flip state maintained
- [ ] Layers panel updates
- [ ] No console errors
- [ ] Error handling works (test with backend offline)

## Additional Testing

### Integration with Other Features
1. Generate image with AI, then upscale it
2. Remove background, then upscale the result
3. Vectorize image, then try to upscale (should fail - SVG not supported)
4. Upscale, then export (when export feature available)

### Multiple Operations
1. Upscale image twice (ensure quality improves each time)
2. Upscale, undo (when undo available), verify original restored
3. Upscale multiple different images in sequence

---

**Testing Status**: Ready for QA
**Last Updated**: January 1, 2026


