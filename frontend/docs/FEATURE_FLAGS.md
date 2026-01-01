# Feature Flags

Turn features on/off without changing code.

## Quick Start

```javascript
import useFeatureFlagStore from '../features/useFeatureFlag';
import { FEATURES } from '../features/featureFlags';

const { isEnabled } = useFeatureFlagStore();

{isEnabled(FEATURES.AI_IMAGE_GENERATION) && (
  <AIButton />
)}
```

## Managing Flags

Click the **⚙️ Settings icon** (top-right) to toggle features on/off.

## Available Features

**AI Features**
- AI Image Generation
- Remove Background
- Vectorize Image
- Crisp Upscale

**Tools**
- Brush Tool
- Text Tool
- Shapes Tools
- Upload Image

**Panels**
- Layers Panel
- Image Properties
- Text Properties
- Shape Properties

**UI Elements**
- Templates Menu
- Filters Menu
- Share Button

## Adding New Features

1. Add to `features/featureFlags.js`:

```javascript
export const FEATURES = {
  MY_FEATURE: 'my_feature',
};

export const DEFAULT_FLAGS = {
  [FEATURES.MY_FEATURE]: false,
};

export const FEATURE_DESCRIPTIONS = {
  [FEATURES.MY_FEATURE]: 'What this feature does',
};
```

2. Use in components:

```javascript
{isEnabled(FEATURES.MY_FEATURE) && <MyComponent />}
```

That's it! The feature will appear in Settings automatically.
