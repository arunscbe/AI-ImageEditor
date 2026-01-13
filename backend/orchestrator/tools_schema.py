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
    - Determining the best workflow for SVG generation
    - Need to decide if upscaling before vectorization would help
    
    The analysis returns actionable recommendations:
    1. Whether to upscale first (if resolution < 1024px)
    2. Whether suitable for vectorization (logos, icons, simple graphics)
    3. Optimal processing order for best SVG quality
    
    ALWAYS analyze before processing uploaded images for vectorization.""",
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

UPSCALE_IMAGE_TOOL = {
    "name": "upscale_image",
    "description": """Enhance image quality with optional style-aware improvements.
    
    Use when user wants to improve image quality before vectorization or for better detail.
    
    DEFAULT PROVIDER: gemini (style-aware enhancement)
    
    If style is detected from image analysis, provide it for style-specific enhancement:
    - embroidery: Preserves thread texture and stitch details
    - leather: Maintains deboss/emboss characteristics
    - screen_print: Keeps flat colors and high contrast
    - woven: Preserves interlaced thread patterns
    - sublimation: Enhances vibrant colors
    - pvc: Maintains 3D raised effect
    
    Providers:
    - gemini: DEFAULT - Style-aware enhancement or LANCZOS upscaling
    - replicate: Real-ESRGAN for true resolution increase
    - google-imagen: 2x/4x resolution upscaling""",
    "input_schema": {
        "type": "object",
        "properties": {
            "image_url": {
                "type": "string",
                "description": "URL of the image to enhance/upscale"
            },
            "provider": {
                "type": "string",
                "enum": ["gemini", "replicate", "google-imagen"],
                "description": "Provider to use (default: gemini)"
            },
            "style": {
                "type": "string",
                "enum": ["embroidery", "leather", "screen_print", "woven", "sublimation", "pvc"],
                "description": "Detected style for style-aware enhancement (gemini only)"
            },
            "scale": {
                "type": "number",
                "description": "Upscale factor (2 or 4)"
            }
        },
        "required": ["image_url"]
    }
}

EDIT_IMAGE_TOOL = {
    "name": "edit_image",
    "description": """Edit an existing image based on text instructions.
    
    Use when user wants to modify or transform an existing image.
    
    DEFAULT PROVIDER: gemini (use unless user requests otherwise)
    
    Best providers:
    - gemini: DEFAULT - Excellent style control and prompt understanding (RECOMMENDED)
    - google-imagen: Precise edits
    - openai: Optional - Creative edits with masks (use only if user requests)
    - replicate (instruct-pix2pix): Instruction-based editing""",
    "input_schema": {
        "type": "object",
        "properties": {
            "image_url": {
                "type": "string",
                "description": "URL of the image to edit"
            },
            "prompt": {
                "type": "string",
                "description": "Instructions for editing the image"
            },
            "provider": {
                "type": "string",
                "enum": ["google-imagen", "openai", "replicate"],
                "description": "Provider to use"
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
    
    Recraft automatically normalizes colors to brand colors for consistent output.
    
    Use when user needs scalable graphics, logos, or vector artwork.
    For best results, upscale low-resolution images BEFORE vectorizing.""",
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
    UPSCALE_IMAGE_TOOL,
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


