# Feature Flags System

A comprehensive feature flag system for enabling/disabling functionality dynamically in the AI Image Editor.

## Overview

The feature flag system allows you to:
- Enable/disable features without code changes
- Test new features in production
- Provide different feature sets for different users
- Gradually roll out new functionality
- Quickly disable problematic features

## Architecture

### Components

1. **`featureFlags.js`** - Configuration and utilities
   - Defines all available features
   - Manages default states
   - Handles localStorage persistence

2. **`useFeatureFlag.js`** - Zustand store for state management
   - Centralized feature flag state
   - Methods to toggle/set flags
   - Persistent storage integration

3. **`FeatureFlagsPanel.jsx`** - Admin UI component
   - Visual interface for managing flags
   - Search functionality
   - Categorized features
   - Real-time toggle switches

## Usage

### 1. Check if a feature is enabled

```javascript
import useFeatureFlagStore from '../features/useFeatureFlag';
import { FEATURES } from '../features/featureFlags';

function MyComponent() {
  const { isEnabled } = useFeatureFlagStore();

  return (
    <div>
      {isEnabled(FEATURES.AI_IMAGE_GENERATION) && (
        <AIGenerationButton />
      )}
    </div>
  );
}
```

### 2. Toggle a feature programmatically

```javascript
const { toggleFeature } = useFeatureFlagStore();

toggleFeature(FEATURES.BRUSH_TOOL);
```

### 3. Set a feature explicitly

```javascript
const { setFeature } = useFeatureFlagStore();

setFeature(FEATURES.LAYERS_PANEL, true);
```

### 4. Get all flags

```javascript
const { getAllFlags } = useFeatureFlagStore();

const flags = getAllFlags();
```

### 5. Reset to defaults

```javascript
const { resetAllFlags } = useFeatureFlagStore();

resetAllFlags();
```

## Available Features

### AI Features
- `AI_IMAGE_GENERATION` - AI-powered image generation from text prompts
- `REMOVE_BACKGROUND` - Remove background from images
- `VECTORIZE_IMAGE` - Convert raster images to vector format
- `CRISP_UPSCALE` - Upscale images with AI enhancement

### Tools
- `BRUSH_TOOL` - Free drawing brush tool
- `TEXT_TOOL` - Add and edit text objects
- `SHAPES_TOOLS` - Add shapes (rectangle, circle, line, arrow)
- `UPLOAD_IMAGE` - Upload images from local device

### Panels
- `LAYERS_PANEL` - Layers management panel
- `IMAGE_PROPERTIES` - Image properties editing panel
- `TEXT_PROPERTIES` - Text properties editing panel
- `SHAPE_PROPERTIES` - Shape properties editing panel

### UI Elements
- `TEMPLATES_MENU` - Pre-built design templates
- `FILTERS_MENU` - Image filters and effects
- `SHARE_BUTTON` - Share project functionality

## Adding New Features

### Step 1: Define the feature

In `featureFlags.js`:

```javascript
export const FEATURES = {
  // ... existing features
  MY_NEW_FEATURE: 'my_new_feature',
};

export const DEFAULT_FLAGS = {
  // ... existing defaults
  [FEATURES.MY_NEW_FEATURE]: false,
};

export const FEATURE_DESCRIPTIONS = {
  // ... existing descriptions
  [FEATURES.MY_NEW_FEATURE]: 'Description of my new feature',
};
```

### Step 2: Add to category (optional)

In `FeatureFlagsPanel.jsx`, add to appropriate category:

```javascript
const categories = {
  tools: {
    label: 'Tools',
    features: [
      // ... existing features
      FEATURES.MY_NEW_FEATURE,
    ],
  },
};
```

### Step 3: Use in component

```javascript
import useFeatureFlagStore from '../features/useFeatureFlag';
import { FEATURES } from '../features/featureFlags';

function MyComponent() {
  const { isEnabled } = useFeatureFlagStore();

  return (
    <>
      {isEnabled(FEATURES.MY_NEW_FEATURE) && (
        <MyNewFeatureComponent />
      )}
    </>
  );
}
```

## Accessing the Feature Flags Panel

Click the **Settings icon** (⚙️) in the top-right corner of the navigation bar to open the Feature Flags management panel.

## Persistence

Feature flags are stored in `localStorage` under the key `feature_flags`. They persist across:
- Page refreshes
- Browser sessions
- Application restarts

To clear all flags, either:
1. Click "Reset All" in the Feature Flags panel
2. Clear browser localStorage
3. Call `resetAllFlags()` programmatically

## Best Practices

1. **Default to enabled for stable features** - Only disable by default if the feature is experimental
2. **Use descriptive feature names** - Make it clear what the feature does
3. **Group related features** - Consider using parent/child relationships for complex features
4. **Test both states** - Ensure your app works with features both on and off
5. **Clean up old flags** - Remove feature flags once features are stable and fully rolled out
6. **Document flags** - Keep the FEATURE_DESCRIPTIONS updated

## Integration Points

The feature flag system is integrated into:

- **TopNav.jsx** - Insert menu items, Templates, Filters, Share button, image editing actions
- **App.jsx** - Property panels, Layers panel, AI Chat panel
- **Sidebar.jsx** - Create new tools (Image, Upload)
- **CanvasArea.jsx** - (Future: tool-specific features)
- **AIChatPanel.jsx** - (Controlled via AI_IMAGE_GENERATION flag in App.jsx)

## Future Enhancements

Potential improvements:
- Server-side feature flags
- User-specific flags (per-user feature access)
- A/B testing support
- Analytics integration
- Feature flag expiration dates
- Gradual rollout percentages
- Feature dependencies (feature A requires feature B)

