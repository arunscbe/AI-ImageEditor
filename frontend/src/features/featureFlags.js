export const FEATURES = {
  AI_IMAGE_GENERATION: 'ai_image_generation',
  REMOVE_BACKGROUND: 'remove_background',
  VECTORIZE_IMAGE: 'vectorize_image',
  CRISP_UPSCALE: 'crisp_upscale',
  BRUSH_TOOL: 'brush_tool',
  LAYERS_PANEL: 'layers_panel',
  UPLOAD_IMAGE: 'upload_image',
  TEXT_TOOL: 'text_tool',
  SHAPES_TOOLS: 'shapes_tools',
  TEMPLATES_MENU: 'templates_menu',
  FILTERS_MENU: 'filters_menu',
  IMAGE_PROPERTIES: 'image_properties',
  TEXT_PROPERTIES: 'text_properties',
  SHAPE_PROPERTIES: 'shape_properties',
  SHARE_BUTTON: 'share_button',
};

export const DEFAULT_FLAGS = {
  [FEATURES.AI_IMAGE_GENERATION]: true,
  [FEATURES.REMOVE_BACKGROUND]: true,
  [FEATURES.VECTORIZE_IMAGE]: true,
  [FEATURES.CRISP_UPSCALE]: true,
  [FEATURES.BRUSH_TOOL]: true,
  [FEATURES.LAYERS_PANEL]: true,
  [FEATURES.UPLOAD_IMAGE]: true,
  [FEATURES.TEXT_TOOL]: true,
  [FEATURES.SHAPES_TOOLS]: true,
  [FEATURES.TEMPLATES_MENU]: false,
  [FEATURES.FILTERS_MENU]: false,
  [FEATURES.IMAGE_PROPERTIES]: true,
  [FEATURES.TEXT_PROPERTIES]: true,
  [FEATURES.SHAPE_PROPERTIES]: true,
  [FEATURES.SHARE_BUTTON]: true,
};

export const FEATURE_DESCRIPTIONS = {
  [FEATURES.AI_IMAGE_GENERATION]: 'AI-powered image generation from text prompts',
  [FEATURES.REMOVE_BACKGROUND]: 'Remove background from images',
  [FEATURES.VECTORIZE_IMAGE]: 'Convert raster images to vector format',
  [FEATURES.CRISP_UPSCALE]: 'Upscale images with AI enhancement',
  [FEATURES.BRUSH_TOOL]: 'Free drawing brush tool',
  [FEATURES.LAYERS_PANEL]: 'Layers management panel',
  [FEATURES.UPLOAD_IMAGE]: 'Upload images from local device',
  [FEATURES.TEXT_TOOL]: 'Add and edit text objects',
  [FEATURES.SHAPES_TOOLS]: 'Add shapes (rectangle, circle, line, arrow)',
  [FEATURES.TEMPLATES_MENU]: 'Pre-built design templates',
  [FEATURES.FILTERS_MENU]: 'Image filters and effects',
  [FEATURES.IMAGE_PROPERTIES]: 'Image properties editing panel',
  [FEATURES.TEXT_PROPERTIES]: 'Text properties editing panel',
  [FEATURES.SHAPE_PROPERTIES]: 'Shape properties editing panel',
  [FEATURES.SHARE_BUTTON]: 'Share project functionality',
};

const STORAGE_KEY = 'feature_flags';

export const getStoredFlags = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...DEFAULT_FLAGS, ...JSON.parse(stored) } : DEFAULT_FLAGS;
  } catch (error) {
    return DEFAULT_FLAGS;
  }
};

export const saveFlags = (flags) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
  } catch (error) {
    console.error('Failed to save feature flags:', error);
  }
};

export const resetFlags = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return DEFAULT_FLAGS;
  } catch (error) {
    return DEFAULT_FLAGS;
  }
};

