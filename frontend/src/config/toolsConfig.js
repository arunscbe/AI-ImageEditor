import {
  MousePointer2,
  Type,
  Pencil,
  Square,
  Circle,
  Triangle,
  Minus,
  Upload,
  ZoomIn,
  Hand,
  Image as ImageIcon,
  Copy,
  Trash2,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  FileText,
  Sparkles
} from 'lucide-react';

/**
 * Tool Categories for better organization
 */
export const TOOL_CATEGORIES = {
  SELECTION: {
    id: 'selection',
    name: 'Selection',
    description: 'Select and manipulate objects'
  },
  CREATE: {
    id: 'create',
    name: 'Create',
    description: 'Add new elements to canvas'
  },
  DRAW: {
    id: 'draw',
    name: 'Draw',
    description: 'Freehand drawing tools'
  },
  SHAPES: {
    id: 'shapes',
    name: 'Shapes',
    description: 'Geometric shapes'
  },
  TRANSFORM: {
    id: 'transform',
    name: 'Transform',
    description: 'Modify and arrange objects'
  },
  NAVIGATION: {
    id: 'navigation',
    name: 'Navigation',
    description: 'Pan and zoom canvas'
  }
};

/**
 * Central configuration for all tools in the application
 * This is the single source of truth used by both ToolPalette and EmptyStateGuidance
 */
export const TOOLS_CONFIG = [
  // ==================== SELECTION TOOLS ====================
  { 
    id: 'select', 
    icon: MousePointer2, 
    label: 'Select',
    description: 'Select & Move',
    shortcut: 'V',
    category: TOOL_CATEGORIES.SELECTION,
    type: 'action',
    initialHelpers: false, // Toolbar only - not needed for initial helpers
    getAction: ({ canvas, setActiveTool }) => () => {
      if (canvas) {
        canvas.isDrawingMode = false;
        canvas.selection = true;
        canvas.forEachObject(obj => {
          obj.selectable = true;
          obj.evented = true;
        });
      }
      setActiveTool('select');
    }
  },
  { 
    id: 'duplicate', 
    icon: Copy, 
    label: 'Duplicate',
    description: 'Duplicate Object',
    shortcut: 'D',
    category: TOOL_CATEGORIES.SELECTION,
    type: 'action',
    requiresSelection: true,
    initialHelpers: false, // Toolbar only
    getAction: ({ handleDuplicate }) => handleDuplicate,
    hideInEmptyState: true
  },
  { 
    id: 'delete', 
    icon: Trash2, 
    label: 'Delete',
    description: 'Delete Object',
    shortcut: 'Delete',
    category: TOOL_CATEGORIES.SELECTION,
    type: 'action',
    requiresSelection: true,
    initialHelpers: false, // Toolbar only
    getAction: ({ canvas }) => () => {
      if (canvas) {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
          canvas.remove(activeObject);
          canvas.discardActiveObject();
          canvas.renderAll();
        }
      }
    },
    hideInEmptyState: true
  },
  
  { type: 'separator' },
  
  // ==================== CREATE TOOLS ====================
  { 
    id: 'text', 
    icon: Type, 
    label: 'Text',
    description: 'Add Text',
    shortcut: 'T',
    category: TOOL_CATEGORIES.CREATE,
    type: 'action',
    initialHelpers: true, // Show in center grid - essential tool
    getAction: ({ handleCanvasAction }) => () => handleCanvasAction('ADD_TEXT')
  },
  { 
    id: 'upload', 
    icon: Upload, 
    label: 'Upload',
    description: 'Upload Image',
    shortcut: 'U',
    category: TOOL_CATEGORIES.CREATE,
    type: 'action',
    initialHelpers: true, // Show in center grid - essential tool
    getAction: ({ setActiveTool }) => () => setActiveTool('upload')
  },
  { 
    id: 'blank-canvas', 
    icon: FileText, 
    label: 'Blank Canvas',
    description: 'New Blank Canvas',
    shortcut: 'N',
    category: TOOL_CATEGORIES.CREATE,
    type: 'action',
    initialHelpers: true, // Show in center grid - essential tool
    getAction: ({ handleCanvasAction }) => () => handleCanvasAction('BLANK_CANVAS')
  },
  { 
    id: 'mascot', 
    icon: Sparkles, 
    label: 'Mascot',
    description: 'Choose Mascot',
    shortcut: 'M',
    category: TOOL_CATEGORIES.CREATE,
    type: 'action',
    initialHelpers: true, // Show in center grid - essential tool
    getAction: ({ setActiveTool }) => () => setActiveTool('mascot')
  },
  
  { type: 'separator' },
  
  // ==================== DRAW TOOLS ====================
  { 
    id: 'brush', 
    icon: Pencil, 
    label: 'Brush',
    description: 'Freehand Draw',
    shortcut: 'B',
    category: TOOL_CATEGORIES.DRAW,
    type: 'action',
    initialHelpers: false, // Toolbar only - more advanced
    getAction: ({ handleCanvasAction }) => () => handleCanvasAction('TOGGLE_BRUSH')
  },
  
  { type: 'separator' },
  
  // ==================== SHAPE TOOLS ====================
  { 
    id: 'shape-rect', 
    icon: Square, 
    label: 'Rectangle',
    description: 'Add Rectangle',
    shortcut: 'R',
    category: TOOL_CATEGORIES.SHAPES,
    type: 'action',
    initialHelpers: true, // Show in center grid - basic shape
    getAction: ({ handleCanvasAction }) => () => handleCanvasAction('ADD_RECTANGLE')
  },
  { 
    id: 'shape-circle', 
    icon: Circle, 
    label: 'Circle',
    description: 'Add Circle',
    shortcut: 'C',
    category: TOOL_CATEGORIES.SHAPES,
    type: 'action',
    initialHelpers: true, // Show in center grid - basic shape
    getAction: ({ handleCanvasAction }) => () => handleCanvasAction('ADD_CIRCLE')
  },
  { 
    id: 'shape-triangle', 
    icon: Triangle, 
    label: 'Triangle',
    description: 'Add Triangle',
    shortcut: 'Shift+T',
    category: TOOL_CATEGORIES.SHAPES,
    type: 'action',
    initialHelpers: false, // Toolbar only - additional shape
    getAction: ({ handleCanvasAction }) => () => handleCanvasAction('ADD_TRIANGLE'),
    hideInEmptyState: true
  },
  { 
    id: 'shape-line', 
    icon: Minus, 
    label: 'Line',
    description: 'Add Line',
    shortcut: 'L',
    category: TOOL_CATEGORIES.SHAPES,
    type: 'action',
    initialHelpers: false, // Toolbar only - additional shape
    getAction: ({ handleCanvasAction }) => () => handleCanvasAction('ADD_LINE'),
    hideInEmptyState: true
  },
  
  { type: 'separator' },
  
  // ==================== TRANSFORM TOOLS ====================
  { 
    id: 'flip-h', 
    icon: FlipHorizontal, 
    label: 'Flip H',
    description: 'Flip Horizontal',
    shortcut: 'Shift+H',
    category: TOOL_CATEGORIES.TRANSFORM,
    type: 'action',
    requiresSelection: true,
    initialHelpers: false, // Toolbar only - requires selection
    getAction: ({ canvas }) => () => {
      if (canvas) {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
          activeObject.set('flipX', !activeObject.flipX);
          canvas.renderAll();
        }
      }
    },
    hideInEmptyState: true
  },
  { 
    id: 'flip-v', 
    icon: FlipVertical, 
    label: 'Flip V',
    description: 'Flip Vertical',
    shortcut: 'Shift+V',
    category: TOOL_CATEGORIES.TRANSFORM,
    type: 'action',
    requiresSelection: true,
    initialHelpers: false, // Toolbar only - requires selection
    getAction: ({ canvas }) => () => {
      if (canvas) {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
          activeObject.set('flipY', !activeObject.flipY);
          canvas.renderAll();
        }
      }
    },
    hideInEmptyState: true
  },
  { 
    id: 'rotate', 
    icon: RotateCw, 
    label: 'Rotate',
    description: 'Rotate 90°',
    shortcut: 'Shift+R',
    category: TOOL_CATEGORIES.TRANSFORM,
    type: 'action',
    requiresSelection: true,
    initialHelpers: false, // Toolbar only - requires selection
    getAction: ({ canvas }) => () => {
      if (canvas) {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
          const currentAngle = activeObject.angle || 0;
          activeObject.rotate((currentAngle + 90) % 360);
          canvas.renderAll();
        }
      }
    },
    hideInEmptyState: true
  },
  
  { type: 'separator' },
  
  // ==================== NAVIGATION TOOLS ====================
  { 
    id: 'zoom', 
    icon: ZoomIn, 
    label: 'Zoom In',
    description: 'Zoom Tool',
    shortcut: 'Z',
    category: TOOL_CATEGORIES.NAVIGATION,
    type: 'action',
    initialHelpers: false, // Toolbar only - navigation tool
    getAction: ({ setActiveTool }) => () => setActiveTool('zoom')
  },
  { 
    id: 'pan', 
    icon: Hand, 
    label: 'Pan',
    description: 'Pan Canvas',
    shortcut: 'H',
    category: TOOL_CATEGORIES.NAVIGATION,
    type: 'action',
    initialHelpers: false, // Toolbar only - navigation tool
    getAction: ({ canvas, setActiveTool }) => () => {
      if (canvas) {
        canvas.isDrawingMode = false;
      }
      setActiveTool('pan');
    }
  }
];

/**
 * Get tools grouped by category
 */
export const getToolsByCategory = () => {
  const grouped = {};
  
  Object.values(TOOL_CATEGORIES).forEach(category => {
    grouped[category.id] = {
      ...category,
      tools: TOOLS_CONFIG.filter(tool => 
        tool.category?.id === category.id
      )
    };
  });
  
  return grouped;
};

/**
 * Get tools for the toolbar (includes separators and all tools)
 */
export const getToolbarTools = () => TOOLS_CONFIG;

/**
 * Get tools for the empty state grid (only tools marked as initialHelpers)
 */
export const getEmptyStateTools = () => 
  TOOLS_CONFIG.filter(tool => 
    tool.type !== 'separator' && tool.initialHelpers === true
  );

/**
 * Get tools by category ID
 */
export const getToolsByCategoryId = (categoryId) => 
  TOOLS_CONFIG.filter(tool => 
    tool.category?.id === categoryId && tool.type !== 'separator'
  );

/**
 * Find tool by ID
 */
export const getToolById = (id) => 
  TOOLS_CONFIG.find(tool => tool.id === id);

/**
 * Get all keyboard shortcuts
 */
export const getKeyboardShortcuts = () => 
  TOOLS_CONFIG
    .filter(tool => tool.shortcut && tool.type !== 'separator')
    .map(tool => ({
      id: tool.id,
      label: tool.label,
      shortcut: tool.shortcut,
      description: tool.description
    }));

