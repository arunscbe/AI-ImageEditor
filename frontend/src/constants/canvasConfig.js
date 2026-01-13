/**
 * Canvas Configuration Constants
 * Central place for all canvas-related settings
 */

export const CANVAS_CONFIG = {
  // Default canvas dimensions
  DEFAULT_WIDTH: 1200,
  DEFAULT_HEIGHT: 800,
  
  // Object loading sizes
  MASCOT_MAX_SIZE: 600, // Max width/height for loaded mascots
  IMAGE_MAX_SIZE: 800,  // Max width/height for uploaded images
  SHAPE_DEFAULT_SIZE: 200, // Default size for shapes (rectangles, circles, etc.)
  
  // Positioning
  INITIAL_POSITION: {
    left: 100,
    top: 100
  },
  POSITION_OFFSET: 30, // Offset for stacking new objects
  
  // Grid and guides
  GRID_SIZE: 10,
  SNAP_THRESHOLD: 5,
  
  // Zoom
  MIN_ZOOM: 0.1,
  MAX_ZOOM: 5,
  ZOOM_STEP: 0.1,
  
  // Performance
  RENDER_ON_ADD_REMOVE: true,
  SELECTION_LINE_WIDTH: 2,
};

export default CANVAS_CONFIG;

