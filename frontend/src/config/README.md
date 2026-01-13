# Tools Configuration

This directory contains the centralized configuration for all tools in the application.

## Structure

### `toolsConfig.js`

The single source of truth for all tools. Every tool used in the application is defined here.

#### Tool Categories

Tools are organized into 6 categories:

1. **Selection** - Select, Duplicate, Delete
2. **Create** - Text, Upload, AI Generate
3. **Draw** - Brush, Pen (freehand drawing)
4. **Shapes** - Rectangle, Circle, Triangle, Line
5. **Transform** - Flip, Rotate, Scale
6. **Navigation** - Zoom, Pan

#### Tool Properties

Each tool has the following properties:

```javascript
{
  id: 'unique-id',              // Unique identifier
  icon: LucideIcon,             // Icon component from lucide-react
  label: 'Short Name',          // Display name (for grid)
  description: 'Full Name',     // Full description (for tooltips)
  shortcut: 'K',                // Keyboard shortcut
  category: TOOL_CATEGORIES.X,  // Category classification
  type: 'action',               // 'action' or 'separator'
  requiresSelection: false,     // Requires object to be selected
  hideInEmptyState: false,      // Hide from center grid
  getAction: ({ deps }) => fn   // Factory function that returns action
}
```

#### Helper Functions

- `getToolbarTools()` - Returns all tools including separators (for ToolPalette)
- `getEmptyStateTools()` - Returns tools for center grid (excludes separators and hidden tools)
- `getToolsByCategory()` - Returns tools grouped by category
- `getToolsByCategoryId(id)` - Returns tools for specific category
- `getToolById(id)` - Find tool by ID
- `getKeyboardShortcuts()` - Get all keyboard shortcuts

## Adding a New Tool

1. **Define the tool** in `toolsConfig.js`:

```javascript
{ 
  id: 'my-tool', 
  icon: MyIcon, 
  label: 'My Tool',
  description: 'My Awesome Tool',
  shortcut: 'M',
  category: TOOL_CATEGORIES.CREATE,
  type: 'action',
  getAction: ({ handleCanvasAction }) => () => handleCanvasAction('MY_ACTION')
}
```

2. **Add the action** in `store/useStore.js` if needed:

```javascript
handleCanvasAction: (type) => {
  switch (type) {
    case "MY_ACTION":
      store.myFunction();
      break;
    // ...
  }
}
```

3. **That's it!** The tool will automatically appear in:
   - ToolPalette (left sidebar)
   - EmptyStateGuidance (center grid, if not hidden)

## Usage Examples

### In Components

```javascript
import { getToolbarTools, getEmptyStateTools } from '../config/toolsConfig';

// For toolbar
const tools = getToolbarTools();

// For empty state
const tools = getEmptyStateTools();

// Bind actions
const boundTools = tools.map(tool => ({
  ...tool,
  action: tool.getAction({ canvas, setActiveTool, handleCanvasAction })
}));
```

### Getting Keyboard Shortcuts

```javascript
import { getKeyboardShortcuts } from '../config/toolsConfig';

const shortcuts = getKeyboardShortcuts();
// Use for help panel, documentation, etc.
```

## Benefits

- ✅ **Single Source of Truth** - One place to manage all tools
- ✅ **Type Safety** - Clear structure with JSDoc comments
- ✅ **Flexibility** - Control visibility per context
- ✅ **Maintainability** - Easy to add/remove/modify tools
- ✅ **Consistency** - Same tool definition across all views
- ✅ **Scalability** - Supports unlimited tools with categorization

