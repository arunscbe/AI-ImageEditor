from typing import List, Dict, Any


ANALYZE_IMAGE_TOOL = {
    "name": "analyze_image",
    "description": """Analyze an image to determine quality and recommend optimal processing workflow.
    
    This tool examines:
    - Image resolution and dimensions
    - Content type (photo, logo, illustration, text-heavy)
    - Color complexity and suitability for vectorization
    - Quality assessment and improvement recommendations
    
    Use this FIRST when:
    - User provides an image without specific instructions
    - Determining the best workflow for processing
    
    The analysis returns actionable recommendations:
    1. Whether image needs quality improvement (if resolution < 1024px)
    2. Whether suitable for vectorization (logos, icons, simple graphics)
    3. Optimal processing order for best results
    
    ALWAYS analyze before processing uploaded images.""",
    "input_schema": {
        "type": "object",
        "properties": {
            "image_url": {
                "type": "string",
                "description": "URL of the image to analyze"
            }
        },
        "required": ["image_url"]
    }
}

GENERATE_IMAGE_TOOL = {
    "name": "generate_image",
    "description": """Generate a new image from a text prompt using AI.
    
    Use this when the user wants to create a new image from scratch.
    
    DEFAULT PROVIDER: gemini (use unless user requests otherwise)
    
    Provider selection guidance:
    - gemini: DEFAULT - Excellent quality, style control, text rendering (RECOMMENDED)
    - recraft: Fast, versatile, good for general use
    - openai: Optional - Creative interpretations (use only if user requests)
    - replicate (flux-dev): Highest quality, photorealistic
    - google-imagen: Best for text in images (logos, signs)
    
    Always enhance vague prompts with details about style, lighting, quality, etc.""",
    "input_schema": {
        "type": "object",
        "properties": {
            "prompt": {
                "type": "string",
                "description": "Detailed description of the image to generate"
            },
            "provider": {
                "type": "string",
                "enum": ["recraft", "openai", "replicate", "google-imagen"],
                "description": "AI provider to use"
            },
            "style": {
                "type": "string",
                "description": "Style for the image (e.g., realistic_image, digital_illustration)"
            },
            "size": {
                "type": "string",
                "description": "Image size (e.g., 1024x1024)"
            }
        },
        "required": ["prompt"]
    }
}

EDIT_IMAGE_TOOL = {
    "name": "edit_image",
    "description": """Edit and enhance an existing image based on text instructions.
    
    This tool handles BOTH editing AND enhancement in a single call:
    - Editing: Modify, transform, or change elements in the image
    - Enhancement: Automatically improves quality (sharpening, artifact removal, resolution) for low-quality images
    
    Use when user wants to:
    - Modify or transform an existing image
    - Enhance image quality (automatically applied if image is low-resolution)
    - Both edit and enhance (handled efficiently in one call)
    
    DEFAULT PROVIDER: gemini (use unless user requests otherwise)
    
    Best providers:
    - gemini: DEFAULT - Excellent style control, prompt understanding, and automatic quality enhancement (RECOMMENDED)
    - google-imagen: Precise edits
    - openai: Optional - Creative edits with masks (use only if user requests)
    - replicate (instruct-pix2pix): Instruction-based editing
    
    The tool automatically detects low-quality images and enhances them during editing.""",
    "input_schema": {
        "type": "object",
        "properties": {
            "image_url": {
                "type": "string",
                "description": "URL of the image to edit/enhance"
            },
            "prompt": {
                "type": "string",
                "description": "Instructions for editing the image. Can include both editing and enhancement requests."
            },
            "provider": {
                "type": "string",
                "enum": ["gemini", "google-imagen", "openai", "replicate"],
                "description": "Provider to use (default: gemini)"
            },
            "enhance_quality": {
                "type": "boolean",
                "description": "Automatically enhance image quality during edit if image is low-resolution or has quality issues (default: true for gemini provider)"
            }
        },
        "required": ["image_url", "prompt"]
    }
}

IMAGE_TO_IMAGE_TOOL = {
    "name": "image_to_image",
    "description": """Transform an image using a text prompt while maintaining structure.
    
    Use when user wants to change style or details while keeping composition.
    
    DEFAULT PROVIDER: gemini (use unless user requests otherwise)
    
    Example: Turn a sketch into a photo, change time of day, etc.""",
    "input_schema": {
        "type": "object",
        "properties": {
            "image_url": {
                "type": "string",
                "description": "URL of the source image"
            },
            "prompt": {
                "type": "string",
                "description": "Description of desired output"
            },
            "provider": {
                "type": "string",
                "enum": ["recraft", "openai", "replicate"],
                "description": "Provider to use"
            }
        },
        "required": ["image_url", "prompt"]
    }
}

REMOVE_BACKGROUND_TOOL = {
    "name": "remove_background",
    "description": """Remove the background from an image, leaving transparent background.
    
    Only available with Recraft provider.
    
    Use when user wants to isolate the subject or create cutouts.""",
    "input_schema": {
        "type": "object",
        "properties": {
            "image_url": {
                "type": "string",
                "description": "URL of the image"
            }
        },
        "required": ["image_url"]
    }
}

REPLACE_BACKGROUND_TOOL = {
    "name": "replace_background",
    "description": """Replace the background of an image with a new AI-generated background.
    
    Only available with Recraft provider.
    
    Use when user wants to change the environment/setting while keeping the subject.""",
    "input_schema": {
        "type": "object",
        "properties": {
            "image_url": {
                "type": "string",
                "description": "URL of the image"
            },
            "prompt": {
                "type": "string",
                "description": "Description of the new background"
            }
        },
        "required": ["image_url", "prompt"]
    }
}

VECTORIZE_IMAGE_TOOL = {
    "name": "vectorize_image",
    "description": """Convert a raster image to vector format (SVG).
    
    REQUIRED PROVIDER: recraft (only provider that supports vectorization)
    ALWAYS use provider="recraft" for this operation.
    
    CRITICAL: Only call this tool when user EXPLICITLY requests vectorization in their message.
    Do NOT call this tool if:
    - analyze_image recommends vectorization (ignore those recommendations)
    - User only asks to edit or enhance an image
    - Analysis suggests "enhance_then_vectorize" (only do the enhance part via edit_image)
    
    ONLY call when user message explicitly contains:
    - "vectorize this image"
    - "convert to SVG"
    - "make it vector"
    - "turn into vector format"
    - "vector format"
    - "SVG format"
    
    For best results, use edit_image first to enhance low-resolution images before vectorizing.""",
    "input_schema": {
        "type": "object",
        "properties": {
            "image_url": {
                "type": "string",
                "description": "URL of the image to vectorize"
            }
        },
        "required": ["image_url"]
    }
}

LIST_PROVIDERS_TOOL = {
    "name": "list_providers",
    "description": """List all available AI image providers and their capabilities.
    
    Use when user asks what providers are available or what each can do.""",
    "input_schema": {
        "type": "object",
        "properties": {},
        "required": []
    }
}

ERASE_REGION_TOOL = {
    "name": "erase_region",
    "description": """Remove a specific region from an image using AI.
    
    REQUIRED PROVIDER: recraft (only provider that supports erase region)
    This operation automatically uses Recraft.
    
    Use when user wants to remove unwanted parts, objects, or backgrounds from an image.
    Requires both the image and a mask indicating what to remove.""",
    "input_schema": {
        "type": "object",
        "properties": {
            "image_url": {
                "type": "string",
                "description": "URL of the image to edit"
            },
            "mask_url": {
                "type": "string",
                "description": "URL of the mask image (white = keep, black = erase)"
            }
        },
        "required": ["image_url", "mask_url"]
    }
}

INGEST_FILE_TOOL = {
    "name": "ingest_file",
    "description": """Process an uploaded file (PNG, JPG, PDF, or AI) and prepare it for editing.
    
    Automatically detects file type and:
    - PNG/JPG: Optionally vectorizes to SVG using Recraft
    - PDF/AI: Converts to SVG using Inkscape
    
    Use when user uploads a file or wants to import existing artwork.""",
    "input_schema": {
        "type": "object",
        "properties": {
            "file_url": {
                "type": "string",
                "description": "URL of the uploaded file"
            },
            "vectorize": {
                "type": "boolean",
                "description": "Whether to vectorize raster images (default: true)",
                "default": True
            }
        },
        "required": ["file_url"]
    }
}


ALL_TOOLS: List[Dict[str, Any]] = [
    ANALYZE_IMAGE_TOOL,
    GENERATE_IMAGE_TOOL,
    EDIT_IMAGE_TOOL,
    IMAGE_TO_IMAGE_TOOL,
    REMOVE_BACKGROUND_TOOL,
    REPLACE_BACKGROUND_TOOL,
    VECTORIZE_IMAGE_TOOL,
    ERASE_REGION_TOOL,
    INGEST_FILE_TOOL,
    LIST_PROVIDERS_TOOL,
]


def get_tool_by_name(name: str) -> Dict[str, Any]:
    for tool in ALL_TOOLS:
        if tool["name"] == name:
            return tool
    raise ValueError(f"Tool '{name}' not found")
