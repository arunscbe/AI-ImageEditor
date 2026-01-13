# AI Image Editor - Implementation Documentation

**Version:** 2.0  
**Last Updated:** January 1, 2026  
**Architecture:** Intent-First UX with Recraft API Backend

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Strategy](#architecture-strategy)
3. [Feature Implementation Matrix](#feature-implementation-matrix)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Implementation Roadmap](#implementation-roadmap)
7. [Technical Debt & Future Work](#technical-debt--future-work)

---

## Overview

This project is an AI-powered image editor that leverages the **Recraft API** for core AI operations while building a differentiated, **intent-first product experience**. Unlike canvas-first design tools, we prioritize user outcomes over tool exposure.

The architecture follows a clear separation:

- **Model Operations (20%)**: Outsourced to Recraft API
- **Product Experience (80%)**: Custom-built intent-driven UX, canvas, and asset management

### Core Philosophy

> "Recraft exposes all tools all the time. We expose only what's needed based on user intent. This shifts the product from 'how do I use this?' to 'what am I making?'"

### UX Differentiation Strategy

**Key Principle**: **Intent-First, Not Canvas-First**

- ❌ Recraft Pattern: Empty canvas → Manual tool selection → Prompt input
- ✅ Our Pattern: Intent selection → Contextual guidance → Outcome delivery

This documentation tracks what has been built, what remains, and our strategic differentiation from commodity design tools.

---

## Architecture Strategy

### What We Leverage from Recraft API ✅

| Feature | Endpoint | Status |
|---------|----------|--------|
| Text → Image Generation | `/v1/images/generations` | ✅ Implemented |
| Background Removal | `/v1/images/removeBackground` | ✅ Implemented |
| Image Vectorization | `/v1/images/vectorize` | ✅ Implemented |
| Crisp Upscale | `/v1/images/crispUpscale` | ✅ Implemented |
| Creative Upscale | `/v1/images/creativeUpscale` | 🔲 API Available |
| Erase Region (Mask-based) | `/v1/images/erase` | 🔲 API Available |
| Image → Image (Modifications) | `/v1/images/generations` | 🔲 API Available |
| Style Creation | `/v1/styles` | 🔲 API Available |

### What We Build Ourselves 🛠️

| Layer | Component | Status |
|-------|-----------|--------|
| **Canvas Layer** | Infinite canvas with pan/zoom | ✅ Implemented |
| | Layers management | ✅ Implemented |
| | Object positioning system | ✅ Implemented |
| | Selection & transforms | ✅ Implemented |
| | History/Undo system | 🔲 Not Started |
| **Drawing Tools** | Text tool | ✅ Implemented |
| | Shapes (rect, circle, line, arrow) | ✅ Implemented |
| | Brush tool | ✅ Implemented |
| | Mask editor (for erase API) | 🔲 Not Started |
| **Asset Management** | Image upload | ✅ Implemented |
| | Project management | ✅ Implemented |
| | Export system | 🔲 Not Started |
| **Collaboration** | Multi-user editing | 🔲 Not Started |
| | Comments system | 🔲 Not Started |
| | Real-time cursors | 🔲 Not Started |
| **Infrastructure** | Auth system | 🔲 Not Started |
| | Rate limiting | 🔲 Not Started |
| | Job queue | 🔲 Not Started |
| | CDN integration | 🔲 Not Started |

---

## Feature Implementation Matrix

### ✅ Completed Features

#### UX Differentiation Layer (NEW - v2.0)

1. **Intent Selector Screen** (`/project/:uuid/intent`)
   - **File**: `frontend/src/pages/IntentSelector.jsx`
   - **Purpose**: Replaces empty canvas with outcome-driven starting point
   - **Templates**:
     - Logo Creation
     - Icon Set Generation
     - Product Mockup
     - Social Media Assets
     - Vectorize Image
     - Blank Canvas (fallback)
   - **Each Intent Includes**:
     - Suggested prompts specific to use case
     - Contextual tool configuration
     - Canvas size recommendations
   - **Status**: ✅ Production Ready
   - **Impact**: HIGH - Primary differentiation from Recraft

2. **Smart Empty State Guidance**
   - **File**: `frontend/src/components/EmptyStateGuidance.jsx`
   - **Triggers**: When canvas has zero objects
   - **Features**:
     - Intent-aware messaging
     - Quick action buttons (AI, Upload, Text, Shapes)
     - Contextual tips based on selected intent
   - **Status**: ✅ Production Ready
   - **Impact**: HIGH - Reduces decision paralysis

3. **Contextual Suggested Prompts**
   - **Integration**: `AIChatPanel.jsx` + Zustand store
   - **Behavior**: Shows intent-specific prompt suggestions
   - **Examples**:
     - Logo Creation: "A minimalist tech startup logo..."
     - Icon Set: "Set of 10 outline-style UI icons..."
     - Product Mockup: "Clean product photography background..."
   - **Status**: ✅ Production Ready
   - **Impact**: MEDIUM - Accelerates time-to-first-result

4. **Intent State Management**
   - **Store**: `useStore.js`
   - **State**:
     - `projectIntent`: Current intent object
     - `suggestedPrompts`: Array of contextual prompts
   - **Persistence**: Via React Router location state
   - **Status**: ✅ Production Ready

#### Backend (Python FastAPI)

1. **AI Image Generation** (`/generate-image`)
   - **File**: `backend/generateImage.py`
   - **Model**: Recraft V3
   - **Parameters**: 
     - `prompt` (string, required)
     - `model` (string, default: "recraftv3")
     - `style` (string, default: "digital_illustration")
   - **Integration**: Direct Recraft API proxy
   - **Status**: ✅ Production Ready

2. **Background Removal** (`/removebg`)
   - **File**: `backend/removeBG.py`
   - **Accepts**: Image file upload (multipart/form-data)
   - **Returns**: PNG with transparent background
   - **Integration**: Direct Recraft API proxy
   - **Status**: ✅ Production Ready

3. **Image Vectorization** (`/vectorizeImage`)
   - **File**: `backend/vectorizeImage.py`
   - **Preprocessing**: Automatic resize to 256px minimum dimension
   - **Returns**: SVG file URL
   - **Integration**: Direct Recraft API proxy with PIL preprocessing
   - **Status**: ✅ Production Ready

4. **Image Upscaling** (`/upscale`)
   - **File**: `backend/upscaleImage.py`
   - **Endpoint**: `/images/crispUpscale`
   - **Accepts**: Image file upload (PNG/JPG/WEBP, max 5MB, max 4MP resolution)
   - **Returns**: Upscaled image URL (higher resolution)
   - **Integration**: Direct Recraft API proxy
   - **Status**: ✅ Production Ready

5. **API Infrastructure**
   - **File**: `backend/main.py`
   - **Framework**: FastAPI
   - **CORS**: Enabled for frontend development
   - **Router System**: Modular endpoint registration
   - **Status**: ✅ Production Ready

#### Frontend (React + Vite + Tailwind)

1. **Canvas Engine** (Fabric.js v6)
   - **File**: `frontend/src/store/useStore.js`
   - **Features**:
     - Infinite canvas with pan/zoom
     - Object positioning with auto-layout
     - Viewport animations (focus on object)
     - Object transforms (scale, rotate, flip)
   - **Status**: ✅ Production Ready

2. **Layer Management**
   - **Store**: `useStore.js` (lines 479-545)
   - **Features**:
     - Layer visibility toggle
     - Layer locking
     - Z-index reordering (bring forward, send backward)
     - Object deletion
     - Real-time layer sync with canvas
   - **UI**: `LayersPanel.jsx`
   - **Status**: ✅ Production Ready

3. **Drawing Tools**
   - **Text Tool**: Editable IText objects with Inter font
   - **Shapes**: Rectangle, Circle, Line, Arrow (grouped)
   - **Image Upload**: Direct canvas placement
   - **Brush Tool**: Free drawing with PencilBrush (adjustable size 1-100px, color picker)
   - **Eraser Tool**: White brush for erasing (shares size control with brush)
   - **Status**: ✅ Core Tools Complete

4. **AI Integration (Frontend)**
   - **AI Image Generation**:
     - UI: `AIChatPanel.jsx`
     - Store method: `addAIImage(url)`
     - Behavior: Replaces selected image or adds new
   - **Background Removal**:
     - Store method: `forRemovingBG()`
     - Preserves object placement and scale
   - **Vectorization**:
     - Store method: `vectorizeAPI()`
     - SVG loading via Fabric.js
     - Maintains exact positioning
   - **Image Upscaling**:
     - Store method: `upscaleImage()`
     - UI: TopNav button (when image selected)
     - Preserves object placement and scale
     - Increases resolution while maintaining display size
   - **Status**: ✅ Production Ready

5. **Properties Panels**
   - **ImagePropertiesPanel.jsx**: Image-specific controls
   - **TextPropertiesPanel.jsx**: Typography controls
   - **ShapePropertiesPanel.jsx**: Shape editing
   - **Status**: ✅ Implemented

6. **Navigation & Layout**
   - **TopNav.jsx**: Main toolbar
   - **Sidebar.jsx**: Tool palette
   - **BottomPanel.jsx**: Context panel
   - **Logo.jsx**: Brand component
   - **Status**: ✅ Implemented

7. **Project Management**
   - **ProjectsPage.jsx**: Project listing
   - **IntentSelector.jsx**: ✅ NEW - Intent-driven project creation
   - **ProjectPage.jsx**: Editor workspace with intent awareness
   - **Routing**: React Router v6 with intent flow
   - **Flow**: Projects → Create → **Intent Selector** → Canvas
   - **Status**: ✅ Implemented

8. **Feature Flag System**
   - **File**: `frontend/src/features/featureFlags.js`
   - **Hook**: `useFeatureFlag.js`
   - **UI**: `FeatureFlagsPanel.jsx`, `FeatureFlagStatus.jsx`
   - **Storage**: LocalStorage persistence
   - **Features Tracked**:
     - ✅ AI Image Generation
     - ✅ Remove Background
     - ✅ Vectorize Image
     - ✅ Crisp Upscale
     - ✅ Brush Tool
     - ✅ Layers Panel
     - ✅ Upload Image
     - ✅ Text Tool
     - ✅ Shapes Tools
     - 🔲 Templates Menu
     - 🔲 Filters Menu
     - ✅ Image Properties
     - ✅ Text Properties
     - ✅ Shape Properties
     - ✅ Share Button
   - **Status**: ✅ Production Ready

9. **UI Component Library**
   - **Button.jsx**: Primary UI button
   - **MenuItem.jsx**: Menu item component
   - **Styling**: Tailwind CSS utility classes
   - **Status**: ✅ Implemented

---

### 🚧 In Progress

*None currently*

---

### 🔲 Not Started (High Priority)

1. **History/Undo System**
   - **Complexity**: Medium
   - **Estimate**: 2-3 days
   - **Dependencies**: Canvas state serialization
   - **Notes**: Critical for production use

2. **Export System**
   - **Formats**: PNG, JPG, SVG, PDF
   - **Features**: Custom resolution, quality settings
   - **Complexity**: Medium
   - **Estimate**: 1-2 days

3. **Mask Editor (for Erase API)**
   - **Tools**: Brush, polygon, wand selection
   - **Output**: Binary mask (white = erase, black = keep)
   - **Complexity**: High
   - **Estimate**: 5-7 days
   - **Notes**: Required for `eraseRegion` endpoint

4. **Creative Upscale Integration**
   - **API**: Recraft creative upscale (`/images/creativeUpscale`)
   - **Difference**: Focuses on refining small details and faces
   - **Complexity**: Low (similar to crisp upscale)
   - **Estimate**: 1 hour (reuse existing code)

5. **Style Creation Integration**
   - **API**: Recraft style creation
   - **UI**: Brand color picker, style library
   - **Complexity**: Medium
   - **Estimate**: 2-3 days

---

### 🔲 Not Started (Low Priority / Future)

1. **Authentication System**
   - **Options**: Auth0, Supabase, Custom JWT
   - **Estimate**: 3-5 days

2. **Collaboration Features**
   - **Real-time sync**: WebSockets + CRDT
   - **Comments**: Thread-based commenting
   - **Cursors**: Live user presence
   - **Estimate**: 10-15 days
   - **Notes**: High complexity, deferred to v2

3. **Template System**
   - **Library**: Pre-built designs
   - **Customization**: Smart object replacement
   - **Estimate**: 5-7 days

4. **Filters & Effects**
   - **Implementation**: Canvas filters or WebGL shaders
   - **Estimate**: 3-5 days

5. **Job Queue System**
   - **Tool**: Redis + BullMQ or Temporal
   - **Use Case**: Async long-running operations
   - **Estimate**: 2-3 days

6. **Rate Limiting & Quotas**
   - **Implementation**: Redis-backed rate limiter
   - **Estimate**: 1-2 days

7. **Asset Management**
   - **Storage**: S3/R2 + CDN
   - **Features**: Versions, metadata, tagging
   - **Estimate**: 5-7 days

8. **Analytics & Billing**
   - **Tracking**: Usage per user/team
   - **Integration**: Stripe for billing
   - **Estimate**: 5-7 days

---

## Backend Implementation

### Tech Stack

- **Framework**: FastAPI (Python)
- **Dependencies**:
  - `fastapi`: Web framework
  - `uvicorn`: ASGI server
  - `python-dotenv`: Environment variables
  - `python-multipart`: File upload handling
  - `pillow`: Image preprocessing
  - `requests`: HTTP client for Recraft API

### Environment Configuration

```bash
RECRAFT_API_KEY=your_api_key_here
RECRAFT_URL=https://external.api.recraft.ai/v1
```

### API Endpoints

#### 1. Generate Image
```http
POST /generate-image
Content-Type: application/json

{
  "prompt": "A futuristic cityscape at sunset",
  "model": "recraftv3",
  "style": "digital_illustration"
}
```

**Response:**
```json
{
  "data": [{
    "url": "https://...",
    "content": "base64..."
  }]
}
```

#### 2. Remove Background
```http
POST /removebg
Content-Type: multipart/form-data

image: <file>
```

**Response:**
```json
{
  "image": {
    "url": "https://..."
  }
}
```

#### 3. Vectorize Image
```http
POST /vectorizeImage
Content-Type: multipart/form-data

image: <file>
```

**Response:**
```json
{
  "image": {
    "url": "https://...svg"
  }
}
```

### Code Organization

```
backend/
├── main.py              # FastAPI app + CORS + router registration
├── generateImage.py     # Text → Image generation
├── removeBG.py          # Background removal
├── vectorizeImage.py    # Raster → Vector conversion
├── upscaleImage.py      # Image upscaling (crisp)
├── requirements.txt     # Python dependencies
└── test.py             # Test utilities
```

### Key Implementation Patterns

1. **Router-based Architecture**: Each feature is a separate FastAPI router
2. **Environment Isolation**: API keys via `.env` file
3. **Error Handling**: Raw Recraft API responses (no transformation)
4. **Preprocessing**: PIL used for image size validation/resizing

---

## Frontend Implementation

### Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Canvas Engine**: Fabric.js v6
- **Routing**: React Router v6

### State Architecture (Zustand)

```javascript
{
  canvas: null,
  zoom: 100,
  selectedObject: null,
  layers: [],
  activeTool: null,
  isLayersPanelOpen: true,
  objectCount: 0,
  
  addText(),
  addRectangle(),
  addCircle(),
  addLine(),
  addArrow(),
  addImageBackground(),
  addAIImage(url),
  
  vectorizeAPI(),
  forRemovingBG(),
  
  updateLayers(),
  bringForward(obj),
  sendBackward(obj),
  toggleVisibility(obj),
  toggleLock(obj),
  deleteObject(obj),
  
  focusObject(obj),
  getNextPosition()
}
```

### Canvas Implementation Details

#### Object Positioning System
- **Auto-layout**: Objects placed sequentially with 20px padding
- **Initial Position**: Center of viewport
- **Focus Animation**: Smooth viewport pan with easeOutCubic
- **Origin Points**: All objects use consistent origin for transforms

#### Layer Management
- **Sync Strategy**: Canvas objects mirrored in Zustand state
- **Order**: Reversed for UI display (top-to-bottom)
- **Updates**: Triggered after every canvas mutation

#### AI Operation Patterns

**Pattern 1: Replace Selected Image**
```javascript
if (selectedObject && selectedObject.type === 'image') {
  selectedObject.setSrc(newUrl, () => {
    // Restore position/scale
  });
}
```

**Pattern 2: Add New Image**
```javascript
const img = await FabricImage.fromURL(url);
img.set({ left, top, scaleX, scaleY });
canvas.add(img);
```

### Component Structure

```
src/
├── components/
│   ├── AIChatPanel.jsx          # AI generation UI + suggested prompts
│   ├── CanvasArea.jsx           # Main canvas container
│   ├── EmptyStateGuidance.jsx   # ✅ NEW - Smart empty state
│   ├── LayersPanel.jsx          # Layer management
│   ├── TopNav.jsx               # Main toolbar
│   ├── Sidebar.jsx              # Tool palette
│   ├── BottomPanel.jsx          # Context panel
│   ├── ImagePropertiesPanel.jsx # Image controls
│   ├── TextPropertiesPanel.jsx  # Text controls
│   ├── ShapePropertiesPanel.jsx # Shape controls
│   ├── FeatureFlagsPanel.jsx    # Feature flag UI
│   ├── Logo.jsx                 # Brand component
│   └── ui/
│       ├── Button.jsx           # Button component
│       └── MenuItem.jsx         # Menu item component
├── pages/
│   ├── ProjectsPage.jsx         # Project list
│   ├── IntentSelector.jsx       # ✅ NEW - Intent selection screen
│   └── ProjectPage.jsx          # Editor workspace (intent-aware)
├── features/
│   ├── featureFlags.js          # Flag definitions
│   └── useFeatureFlag.js        # Feature flag hook
├── store/
│   └── useStore.js              # Zustand store (+ intent state)
└── App.jsx                      # Router setup (+ intent route)
```

### Feature Flag Integration

```javascript
import { useFeatureFlag } from '@/features/useFeatureFlag';

function Component() {
  const { isEnabled } = useFeatureFlag('ai_image_generation');
  
  if (!isEnabled) return null;
  
  return <AIPanel />;
}
```

---

## Implementation Roadmap

### Phase 1: Intent-First UX ✅ COMPLETED (v2.0)
- ✅ Intent Selector screen with 6 templates
- ✅ Smart empty state guidance
- ✅ Contextual suggested prompts
- ✅ Intent state management
- ✅ Intent-aware routing flow

### Phase 2: Core AI Features ✅ COMPLETED (v1.0)
- ✅ Text → Image generation
- ✅ Background removal
- ✅ Image vectorization
- ✅ Basic canvas with layers
- ✅ Drawing tools (text, shapes)

### Phase 3: Editor Completeness (Current Phase)
- 🔲 History/Undo system
- 🔲 Export functionality (PNG, JPG, SVG)
- 🔲 Image upscaling integration
- 🔲 Mask editor for erase tool
- 🔲 Keyboard shortcuts

### Phase 4: Production Readiness
- 🔲 Authentication system
- 🔲 Asset storage (S3/R2)
- 🔲 Rate limiting
- 🔲 Error handling & retry logic
- 🔲 Loading states & progress indicators

### Phase 5: Advanced Features
- 🔲 Style creation & brand colors
- 🔲 Template library
- 🔲 Filters & effects
- 🔲 Mockup system

### Phase 6: Collaboration (v2)
- 🔲 Real-time multi-user editing
- 🔲 Comments system
- 🔲 Version history
- 🔲 Team/organization management

---

## Technical Debt & Future Work

### Known Limitations

1. **No Undo/Redo**
   - **Impact**: High
   - **User Expectation**: Critical feature
   - **Solution**: Implement canvas state history with memento pattern

2. **No Error Handling for API Failures**
   - **Impact**: Medium
   - **Current**: Raw alert() messages
   - **Solution**: Toast notifications + retry logic

3. **No Loading States**
   - **Impact**: Medium
   - **Current**: Operations appear to hang
   - **Solution**: Skeleton screens + progress indicators

4. **Image Quality Loss on Transform**
   - **Impact**: Low
   - **Cause**: Canvas resampling
   - **Solution**: Keep original high-res source, render scaled

5. **No Project Persistence**
   - **Impact**: High
   - **Current**: Data lost on refresh
   - **Solution**: Auto-save to backend database

6. **CORS Restrictions**
   - **Impact**: Medium
   - **Current**: Wide-open CORS for development
   - **Solution**: Restrict origins in production

### Performance Optimizations Needed

1. **Canvas Rendering**
   - Use `requestRenderAll()` instead of `renderAll()`
   - Implement object caching
   - Debounce frequent updates

2. **Image Loading**
   - Lazy load images in layers panel
   - Thumbnail generation for large images
   - Image compression before upload

3. **State Management**
   - Memoize expensive selectors
   - Split store into domain-specific slices

### Security Considerations

1. **API Key Exposure**
   - **Current**: API key in backend only (✅ correct)
   - **Future**: Rotate keys regularly

2. **File Upload Validation**
   - **Needed**: File type, size, and content validation
   - **Current**: Minimal validation

3. **Rate Limiting**
   - **Needed**: Per-user quotas
   - **Current**: None

4. **CORS Policy**
   - **Current**: Allow all origins
   - **Production**: Restrict to specific domains

---

## Deployment Checklist

### Backend
- [ ] Environment variables configured
- [ ] CORS restricted to frontend domain
- [ ] Error logging (Sentry/CloudWatch)
- [ ] Health check endpoint
- [ ] Rate limiting enabled
- [ ] API key rotation strategy

### Frontend
- [ ] Environment variables for API URLs
- [ ] Production build optimization
- [ ] CDN for static assets
- [ ] Error boundary components
- [ ] Analytics integration
- [ ] SEO meta tags

### Infrastructure
- [ ] Database for project persistence
- [ ] S3/R2 bucket for asset storage
- [ ] CDN for image delivery
- [ ] Redis for caching & rate limiting
- [ ] Job queue for async operations

---

## Conclusion

**Current State**: MVP with intent-first UX differentiation + core AI features  
**Production Readiness**: 50%  
**Estimated Time to Production**: 3-5 weeks  

### Major Achievement: UX Differentiation (v2.0)

We have successfully implemented the **Intent-First UX** strategy, creating immediate differentiation from Recraft and similar tools:

**What This Means**:
- Users now state their **goal** before seeing tools
- Suggested prompts reduce time-to-first-result
- Empty state guidance eliminates blank canvas paralysis
- Mental model shifts from "how?" to "what?"

**Comparison Matrix**:

| Aspect | Recraft | Our Product (v2.0) |
|--------|---------|-------------------|
| Entry point | Blank canvas | **Intent selector** ✅ |
| Guidance | None | **Contextual prompts** ✅ |
| Empty state | Gray void | **Quick actions + tips** ✅ |
| Mental model | Tool-first | **Outcome-first** ✅ |

The product has successfully implemented:
- ✅ The "20% AI endpoints" layer
- ✅ The **Intent-First UX** differentiation layer (NEW)
- ✅ Approximately 50% of the "80% product experience" layer

**Next Critical Steps**:
1. Implement undo/redo (blocks user trust)
2. Add project persistence (blocks real usage)
3. Build export functionality (blocks deliverable output)
4. Implement batch operations for icon sets (leverage intent system)
5. Add operation history timeline (path to asset-centric model)

This architecture successfully avoids the "clone trap" by focusing on **user intent and outcomes** rather than replicating tool-first interfaces. The clean separation between intent selection and canvas execution allows rapid iteration on workflows without sacrificing flexibility.

---