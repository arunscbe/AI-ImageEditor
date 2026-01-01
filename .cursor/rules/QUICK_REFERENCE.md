# Quick Reference

## Backend (Python)

```python
# Type hints required
def process_image(file: UploadFile) -> dict:
    return {"status": "success"}

# Update requirements.txt when adding packages
# No global side effects
```

## Frontend (React)

```jsx
// Tailwind only, no inline styles
<Button variant="primary">Save</Button>

// Feature flags
import { FEATURES } from '../features/featureFlags';
import useFeatureFlagStore from '../features/useFeatureFlag';

const { isEnabled } = useFeatureFlagStore();
{isEnabled(FEATURES.MY_FEATURE) && <Component />}

// Routing
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
navigate('/projects');
```

## Brand Colors

```jsx
bg-brand-primary      // #e20b0b (red)
bg-brand-dark         // #121212 (black)
text-text-primary     // #545454 (gray)
font-heading          // Montserrat
font-sans             // Rubik
```

## Button Variants

```jsx
<Button variant="primary">Save</Button>     // Red
<Button variant="secondary">Cancel</Button> // Gray
<Button variant="dark">Download</Button>    // Black
<Button variant="ghost">More</Button>       // Transparent
<Button variant="outline">Details</Button>  // Bordered
<Button variant="white">Preview</Button>    // White
```

Sizes: `sm`, `md`, `lg`, `icon`

## Key Rules

- ❌ No API keys in code
- ❌ No `.md` files unless user asks
- ❌ No comments (except TODO)
- ❌ No inline styles
- ✅ Type hints (Python)
- ✅ Tailwind only
- ✅ Read docs first

## Docs to Read

- UI/Styling → `docs/BRAND_STYLE_GUIDE.md`
- Routing → `docs/ROUTING.md`
- Feature Flags → `docs/FEATURE_FLAGS.md`

See `README.md` for full rule files.
