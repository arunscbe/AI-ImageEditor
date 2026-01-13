# Feature Flags Quick Reference

## 🔑 Key Files

| File | Purpose |
|------|---------|
| `features/featureFlags.js` | Feature definitions & configuration |
| `features/useFeatureFlag.js` | Zustand store (state management) |
| `components/FeatureFlagsPanel.jsx` | Admin UI for managing flags |

## 📋 Common Operations

### Check if Feature is Enabled
```javascript
import useFeatureFlagStore from '../features/useFeatureFlag';
import { FEATURES } from '../features/featureFlags';

const { isEnabled } = useFeatureFlagStore();

if (isEnabled(FEATURES.BRUSH_TOOL)) {
  // Feature is enabled
}
```

### Conditional Rendering
```javascript
{isEnabled(FEATURES.AI_IMAGE_GENERATION) && (
  <AIGenerationButton />
)}
```

### Toggle Feature
```javascript
const { toggleFeature } = useFeatureFlagStore();
toggleFeature(FEATURES.LAYERS_PANEL);
```

### Set Feature State
```javascript
const { setFeature } = useFeatureFlagStore();
setFeature(FEATURES.SHARE_BUTTON, true);  // Enable
setFeature(FEATURES.SHARE_BUTTON, false); // Disable
```

### Get All Flags
```javascript
const { getAllFlags } = useFeatureFlagStore();
const allFlags = getAllFlags();
```

### Reset to Defaults
```javascript
const { resetAllFlags } = useFeatureFlagStore();
resetAllFlags();
```

## 🎯 Feature List

### AI Features (4)
- `AI_IMAGE_GENERATION` ✓
- `REMOVE_BACKGROUND` ✓
- `VECTORIZE_IMAGE` ✓
- `CRISP_UPSCALE` ✗

### Tools (4)
- `BRUSH_TOOL` ✓
- `TEXT_TOOL` ✓
- `SHAPES_TOOLS` ✓
- `UPLOAD_IMAGE` ✓

### Panels (4)
- `LAYERS_PANEL` ✓
- `IMAGE_PROPERTIES` ✓
- `TEXT_PROPERTIES` ✓
- `SHAPE_PROPERTIES` ✓

### UI Elements (3)
- `TEMPLATES_MENU` ✗
- `FILTERS_MENU` ✗
- `SHARE_BUTTON` ✓

✓ = Enabled by default
✗ = Disabled by default

## 🎨 Access UI

**Desktop App:** Click ⚙️ Settings icon (top-right corner)

## 💾 Storage

- Location: `localStorage`
- Key: `feature_flags`
- Persistence: Across sessions
- Clear: Use "Reset All" button or clear browser storage

## 🔧 Adding New Feature

### 1. Define in `featureFlags.js`
```javascript
export const FEATURES = {
  MY_NEW_FEATURE: 'my_new_feature',
};

export const DEFAULT_FLAGS = {
  [FEATURES.MY_NEW_FEATURE]: false,
};

export const FEATURE_DESCRIPTIONS = {
  [FEATURES.MY_NEW_FEATURE]: 'My new feature description',
};
```

### 2. Use in Component
```javascript
const { isEnabled } = useFeatureFlagStore();

{isEnabled(FEATURES.MY_NEW_FEATURE) && <MyFeature />}
```

### 3. Test
- Open Feature Flags panel
- Toggle your feature
- Verify behavior

## ⚡ Pro Tips

1. **Feature Dependencies**: Check multiple flags for complex features
   ```javascript
   const canEdit = isEnabled(FEATURES.IMAGE_PROPERTIES) && 
                   isEnabled(FEATURES.REMOVE_BACKGROUND);
   ```

2. **Fallback UI**: Provide alternative when feature is disabled
   ```javascript
   {isEnabled(FEATURES.BRUSH_TOOL) ? (
     <BrushTool />
   ) : (
     <ComingSoonMessage />
   )}
   ```

3. **Debug Mode**: Use FeatureFlagStatus component to show current states

4. **Batch Operations**: Set multiple features at once
   ```javascript
   const enableAllAI = () => {
     setFeature(FEATURES.AI_IMAGE_GENERATION, true);
     setFeature(FEATURES.REMOVE_BACKGROUND, true);
     setFeature(FEATURES.VECTORIZE_IMAGE, true);
   };
   ```

## 🐛 Troubleshooting

**Feature not updating?**
- Check localStorage permissions
- Try resetAllFlags()
- Clear browser cache

**Panel not opening?**
- Ensure Settings icon is visible
- Check console for errors
- Verify import paths

**State not persisting?**
- Check localStorage quota
- Verify browser supports localStorage
- Check privacy/incognito mode

## 📞 Support

For issues or questions:
1. Check `features/README.md` for detailed docs
2. Review `FeatureFlagExamples.jsx` for usage patterns
3. Inspect `FeatureFlagsPanel.jsx` for UI behavior

---

**Last Updated**: 2025-12-31
**Version**: 1.0.0


