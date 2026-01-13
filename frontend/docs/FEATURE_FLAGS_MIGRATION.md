# Feature Flag Migration Guide

## Converting Existing Features to Use Flags

This guide shows how to convert existing hardcoded features to use the feature flag system.

---

## Pattern 1: Simple Conditional Rendering

### Before
```javascript
function TopNav() {
  return (
    <div>
      <Button>Share</Button>
      <Button>Templates</Button>
    </div>
  );
}
```

### After
```javascript
import useFeatureFlagStore from '../features/useFeatureFlag';
import { FEATURES } from '../features/featureFlags';

function TopNav() {
  const { isEnabled } = useFeatureFlagStore();

  return (
    <div>
      {isEnabled(FEATURES.SHARE_BUTTON) && <Button>Share</Button>}
      {isEnabled(FEATURES.TEMPLATES_MENU) && <Button>Templates</Button>}
    </div>
  );
}
```

---

## Pattern 2: Commented-Out Code

### Before
```javascript
function Sidebar() {
  const tools = [
    { icon: ImageIcon, label: 'Image', id: 'image' },
    // { icon: Frame, label: 'Frame', id: 'frame' },  // Coming soon
    // { icon: Mockup, label: 'Mockup', id: 'mockup' },  // Not ready
    { icon: Upload, label: 'Upload', id: 'upload' },
  ];
}
```

### After
```javascript
import useFeatureFlagStore from '../features/useFeatureFlag';
import { FEATURES } from '../features/featureFlags';

function Sidebar() {
  const { isEnabled } = useFeatureFlagStore();

  const allTools = [
    { icon: ImageIcon, label: 'Image', id: 'image', feature: FEATURES.AI_IMAGE_GENERATION },
    { icon: Frame, label: 'Frame', id: 'frame', feature: FEATURES.FRAME_TOOL },
    { icon: Mockup, label: 'Mockup', id: 'mockup', feature: FEATURES.MOCKUP_TOOL },
    { icon: Upload, label: 'Upload', id: 'upload', feature: FEATURES.UPLOAD_IMAGE },
  ];

  const tools = allTools.filter(tool => isEnabled(tool.feature));
}
```

---

## Pattern 3: Multiple Related Features

### Before
```javascript
function ImageActions({ selectedImage }) {
  if (!selectedImage) return null;

  return (
    <div>
      <Button onClick={removeBG}>Remove BG</Button>
      <Button onClick={vectorize}>Vectorize</Button>
      <Button onClick={upscale}>Upscale</Button>
    </div>
  );
}
```

### After
```javascript
import useFeatureFlagStore from '../features/useFeatureFlag';
import { FEATURES } from '../features/featureFlags';

function ImageActions({ selectedImage }) {
  const { isEnabled } = useFeatureFlagStore();

  if (!selectedImage) return null;

  return (
    <div>
      {isEnabled(FEATURES.REMOVE_BACKGROUND) && (
        <Button onClick={removeBG}>Remove BG</Button>
      )}
      {isEnabled(FEATURES.VECTORIZE_IMAGE) && (
        <Button onClick={vectorize}>Vectorize</Button>
      )}
      {isEnabled(FEATURES.CRISP_UPSCALE) && (
        <Button onClick={upscale}>Upscale</Button>
      )}
    </div>
  );
}
```

---

## Pattern 4: Menu Items

### Before
```javascript
const menuItems = [
  { label: 'Text', action: addText },
  { label: 'Brush', action: addBrush },
  { label: 'Rectangle', action: addRect },
  { label: 'Circle', action: addCircle },
];

return menuItems.map(item => <MenuItem {...item} />);
```

### After
```javascript
import useFeatureFlagStore from '../features/useFeatureFlag';
import { FEATURES } from '../features/featureFlags';

const { isEnabled } = useFeatureFlagStore();

const allMenuItems = [
  { label: 'Text', action: addText, feature: FEATURES.TEXT_TOOL },
  { label: 'Brush', action: addBrush, feature: FEATURES.BRUSH_TOOL },
  { label: 'Rectangle', action: addRect, feature: FEATURES.SHAPES_TOOLS },
  { label: 'Circle', action: addCircle, feature: FEATURES.SHAPES_TOOLS },
];

const menuItems = allMenuItems.filter(item => isEnabled(item.feature));

return menuItems.map(item => <MenuItem {...item} />);
```

---

## Pattern 5: Nested Components

### Before
```javascript
function App() {
  return (
    <div>
      <Canvas />
      <LayersPanel />
      <PropertiesPanel />
    </div>
  );
}
```

### After
```javascript
import useFeatureFlagStore from '../features/useFeatureFlag';
import { FEATURES } from '../features/featureFlags';

function App() {
  const { isEnabled } = useFeatureFlagStore();

  return (
    <div>
      <Canvas />
      {isEnabled(FEATURES.LAYERS_PANEL) && <LayersPanel />}
      {isEnabled(FEATURES.IMAGE_PROPERTIES) && <PropertiesPanel />}
    </div>
  );
}
```

---

## Pattern 6: Dynamic Panel Selection

### Before
```javascript
function PropertiesPanel() {
  const { selectedObject } = useStore();

  if (selectedObject?.type === 'text') return <TextProperties />;
  if (selectedObject?.type === 'image') return <ImageProperties />;
  if (selectedObject?.type === 'shape') return <ShapeProperties />;
  return null;
}
```

### After
```javascript
import useFeatureFlagStore from '../features/useFeatureFlag';
import { FEATURES } from '../features/featureFlags';

function PropertiesPanel() {
  const { selectedObject } = useStore();
  const { isEnabled } = useFeatureFlagStore();

  if (selectedObject?.type === 'text' && isEnabled(FEATURES.TEXT_PROPERTIES)) {
    return <TextProperties />;
  }
  if (selectedObject?.type === 'image' && isEnabled(FEATURES.IMAGE_PROPERTIES)) {
    return <ImageProperties />;
  }
  if (selectedObject?.type === 'shape' && isEnabled(FEATURES.SHAPE_PROPERTIES)) {
    return <ShapeProperties />;
  }
  return null;
}
```

---

## Pattern 7: API Calls

### Before
```javascript
async function handleGenerateImage(prompt) {
  const response = await fetch('/api/generate', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  });
  return response.json();
}
```

### After
```javascript
import useFeatureFlagStore from '../features/useFeatureFlag';
import { FEATURES } from '../features/featureFlags';

async function handleGenerateImage(prompt) {
  const { isEnabled } = useFeatureFlagStore.getState();

  if (!isEnabled(FEATURES.AI_IMAGE_GENERATION)) {
    console.warn('AI Image Generation is disabled');
    return null;
  }

  const response = await fetch('/api/generate', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  });
  return response.json();
}
```

---

## Pattern 8: Complex Logic

### Before
```javascript
function Toolbar() {
  const showAdvanced = process.env.REACT_APP_ENABLE_ADVANCED === 'true';
  const isBeta = window.location.hostname.includes('beta');

  return (
    <div>
      <BasicTools />
      {(showAdvanced || isBeta) && <AdvancedTools />}
    </div>
  );
}
```

### After
```javascript
import useFeatureFlagStore from '../features/useFeatureFlag';
import { FEATURES } from '../features/featureFlags';

function Toolbar() {
  const { isEnabled } = useFeatureFlagStore();

  return (
    <div>
      <BasicTools />
      {isEnabled(FEATURES.ADVANCED_TOOLS) && <AdvancedTools />}
    </div>
  );
}
```

---

## Pattern 9: Store/State Management

### Before
```javascript
const useStore = create((set) => ({
  enabledFeatures: {
    brush: true,
    text: true,
    shapes: false,
  },
  canUseBrush: () => get().enabledFeatures.brush,
}));
```

### After
```javascript
import useFeatureFlagStore from '../features/useFeatureFlag';
import { FEATURES } from '../features/featureFlags';

// Remove feature flags from main store
const useStore = create((set) => ({
  // Other state...
}));

// Use feature flag store instead
const canUseBrush = () => useFeatureFlagStore.getState().isEnabled(FEATURES.BRUSH_TOOL);
```

---

## Pattern 10: Keyboard Shortcuts

### Before
```javascript
useEffect(() => {
  const handleKeyPress = (e) => {
    if (e.key === 't') addText();
    if (e.key === 'b') addBrush();
    if (e.key === 'r') addRectangle();
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);
```

### After
```javascript
import useFeatureFlagStore from '../features/useFeatureFlag';
import { FEATURES } from '../features/featureFlags';

const { isEnabled } = useFeatureFlagStore();

useEffect(() => {
  const handleKeyPress = (e) => {
    if (e.key === 't' && isEnabled(FEATURES.TEXT_TOOL)) addText();
    if (e.key === 'b' && isEnabled(FEATURES.BRUSH_TOOL)) addBrush();
    if (e.key === 'r' && isEnabled(FEATURES.SHAPES_TOOLS)) addRectangle();
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [isEnabled]);
```

---

## Checklist for Migration

- [ ] Identify hardcoded features
- [ ] Define feature flags in `featureFlags.js`
- [ ] Set appropriate defaults
- [ ] Add descriptions
- [ ] Update components to use `isEnabled()`
- [ ] Remove commented code (now controlled by flags)
- [ ] Test both enabled and disabled states
- [ ] Update documentation
- [ ] Notify team of new flags
- [ ] Add to Feature Flags panel categories

---

## Best Practices

1. **Always provide defaults** - Don't break existing functionality
2. **Test both states** - Ensure app works with features on AND off
3. **Use descriptive names** - `AI_IMAGE_GENERATION` not `FEATURE_1`
4. **Group related features** - Consider using parent flags for feature sets
5. **Clean up old flags** - Remove flags once features are stable
6. **Document changes** - Update FEATURE_DESCRIPTIONS
7. **Consider dependencies** - Some features may require others

---

## Common Pitfalls

❌ **Don't hardcode flag checks**
```javascript
if (flags.ai_image_generation === true) // Bad
```

✅ **Use the helper method**
```javascript
if (isEnabled(FEATURES.AI_IMAGE_GENERATION)) // Good
```

❌ **Don't forget to handle disabled state**
```javascript
{isEnabled(FEATURES.BRUSH_TOOL) && <BrushTool />}
// What if user clicks brush button but flag is off?
```

✅ **Provide feedback**
```javascript
{isEnabled(FEATURES.BRUSH_TOOL) ? (
  <BrushTool />
) : (
  <DisabledMessage>Brush tool is not available</DisabledMessage>
)}
```

---

## Need Help?

- Review `features/README.md` for detailed documentation
- Check `FeatureFlagExamples.jsx` for usage patterns
- Test with the Feature Flags panel (⚙️ icon)

---

**Happy Feature Flagging!** 🚀


