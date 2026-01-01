# Frontend Documentation

Quick reference docs for the AI Image Editor frontend.

## 📁 Documentation

- **[BRAND_STYLE_GUIDE.md](./BRAND_STYLE_GUIDE.md)** - 3D Plus colors, buttons, typography
- **[FEATURE_FLAGS.md](./FEATURE_FLAGS.md)** - Turn features on/off
- **[ROUTING.md](./ROUTING.md)** - Navigation between pages

## 🚀 Tech Stack

- React 19 + Vite
- Tailwind CSS
- Zustand (state)
- Fabric.js (canvas)
- React Router

## 🎨 Quick Start

```jsx
// Use brand colors
<div className="bg-brand-primary text-white">3D Plus</div>

// Use feature flags
import { FEATURES } from './features/featureFlags';
import useFeatureFlagStore from './features/useFeatureFlag';

const { isEnabled } = useFeatureFlagStore();
{isEnabled(FEATURES.MY_FEATURE) && <Component />}

// Navigate
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
navigate('/projects');
```

## 📂 Structure

```
src/
├── pages/          # Routes
├── components/     # UI components
├── features/       # Feature flags
├── store/          # Zustand state
└── assets/         # Images, fonts
```

Need more? Check the individual docs above.
