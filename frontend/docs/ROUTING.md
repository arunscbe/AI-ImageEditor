# Routing System Documentation

## Overview

The application now has a multi-page routing system with:
- **Projects List Page** (`/projects`) - View and manage all projects
- **Project Canvas Page** (`/project/:uuid`) - Edit individual projects

---

## Routes

### 1. `/projects` - Projects List Page

**Features:**
- Grid view of all projects
- Create new project button
- Project thumbnails with metadata
- Click any project to open it
- Responsive grid layout (1-4 columns)

**Components:**
- `ProjectsPage.jsx`
- Logo, Button components
- Icons: Plus, Clock, Grid, List

### 2. `/project/:uuid` - Individual Project Canvas

**Features:**
- Full canvas editor
- UUID-based project identification
- "Back to Projects" button
- All editing tools (sidebar, properties, layers, AI chat)
- Project-specific canvas state

**Components:**
- `ProjectPage.jsx`
- All editor components (TopNav, Sidebar, Canvas, etc.)
- Uses React Router `useParams()` for UUID

### 3. `/` - Root

**Behavior:**
- Redirects to `/projects`

---

## Usage

### Navigate to Projects List
```jsx
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate('/projects');
```

### Create New Project
```jsx
const newId = Date.now().toString();
navigate(`/project/${newId}`);
```

### Open Existing Project
```jsx
navigate(`/project/${projectId}`);
```

### Get Current Project ID
```jsx
import { useParams } from 'react-router-dom';

const { uuid } = useParams();
console.log('Current project:', uuid);
```

---

## File Structure

```
src/
├── App.jsx                     # Router configuration
├── pages/
│   ├── ProjectsPage.jsx        # Projects list (/projects)
│   └── ProjectPage.jsx         # Canvas editor (/project/:uuid)
└── components/
    ├── CanvasArea.jsx          # Updated to accept projectId prop
    └── ... (all other components)
```

---

## Key Features

### Projects Page
- **Create New**: Click "+" to create and open new project
- **Grid View**: Responsive grid (1-4 columns based on screen size)
- **Project Cards**: Show thumbnails, names, and last modified time
- **Hover Effects**: Cards highlight on hover
- **Brand Styling**: Uses 3D Plus colors and typography

### Project Page
- **Back Navigation**: Return to projects list
- **UUID-based**: Each project has unique identifier
- **Full Editor**: All tools and panels available
- **Project Context**: Canvas knows which project is active

---

## Backend Integration (Future)

### Save Project
```jsx
const saveProject = async (projectId, canvasData) => {
  await fetch(`/api/projects/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify({
      canvas: canvasData,
      thumbnail: generateThumbnail(),
      modified: new Date(),
    }),
  });
};
```

### Load Project
```jsx
const loadProject = async (projectId) => {
  const response = await fetch(`/api/projects/${projectId}`);
  const data = await response.json();
  canvas.loadFromJSON(data.canvas);
};
```

### List Projects
```jsx
const fetchProjects = async () => {
  const response = await fetch('/api/projects');
  return response.json();
};
```

---

## State Management

### Current Implementation
- Projects list is hardcoded in `ProjectsPage.jsx`
- Canvas state managed by Zustand store
- Project ID passed as prop to `CanvasArea`

### Future Enhancements
- Store projects in localStorage/IndexedDB
- Implement auto-save
- Add project metadata (name, description, tags)
- Add project search/filter
- Add project delete/duplicate

---

## Navigation Flow

```
App starts
   ↓
Redirects to /projects
   ↓
Shows ProjectsPage (list of projects)
   ↓
User clicks "Create new project"
   ↓
Navigate to /project/{uuid}
   ↓
Shows ProjectPage (canvas editor)
   ↓
User clicks "Back to Projects"
   ↓
Navigate to /projects
```

---

## Styling

- **Brand Colors**: Red primary (#e20b0b)
- **Gradients**: Subtle gray backgrounds
- **Shadows**: Elevation on hover
- **Transitions**: Smooth animations
- **Responsive**: Mobile-first grid

---

## Next Steps

1. **Backend Integration**: Connect to API for project CRUD
2. **Auto-save**: Save canvas state periodically
3. **Thumbnails**: Generate canvas thumbnails
4. **Project Metadata**: Add name editing, descriptions
5. **Search/Filter**: Add project search functionality
6. **Sharing**: Add project sharing capabilities
7. **Templates**: Add project templates

---

**Created**: 2025-12-31
**Version**: 1.0.0


