# Routing

## Pages

**`/projects`** - List of all projects  
**`/project/:uuid`** - Canvas editor for a specific project  
**`/`** - Redirects to `/projects`

## Usage

```jsx
import { useNavigate, useParams } from 'react-router-dom';

// Navigate to projects list
const navigate = useNavigate();
navigate('/projects');

// Open a project
navigate(`/project/${projectId}`);

// Get current project ID
const { uuid } = useParams();
```

## Creating New Projects

```jsx
const newId = Date.now().toString();
navigate(`/project/${newId}`);
```

## File Structure

```
pages/
├── ProjectsPage.jsx   // Grid of projects
└── ProjectPage.jsx    // Canvas editor
```

That's it!
