from typing import List, Dict, Any


GENERATE_IMAGE_TOOL = {
    "name": "generate_image",
    "description": """Generate a new image from a text prompt using AI.
    
    Use this when the user wants to create a new image from scratch.
    
    Provider selection guidance:
    - recraft: Fast, versatile, good for general use
    - openai: Best prompt understanding, creative interpretations
    - replicate (flux-dev): Highest quality, photorealistic
    - replicate (flux-schnell): Fast generation
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
    "description": """Upscale an existing image to higher resolution.
    
    Use when user wants to increase image quality or size.
    
    Providers:
    - recraft: Fast, crisp or creative upscaling
    - google-imagen: Good quality, x2 or x4
    - replicate: Real-ESRGAN, highest quality""",
    "input_schema": {
        "type": "object",
        "properties": {
            "image_url": {
                "type": "string",
                "description": "URL of the image to upscale"
            },
            "provider": {
                "type": "string",
                "enum": ["recraft", "google-imagen", "replicate"],
                "description": "Provider to use for upscaling"
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
    
    Best providers:
    - google-imagen: Precise edits
    - openai: Creative edits with masks
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
    
    Only available with Recraft provider.
    
    Use when user needs scalable graphics, logos, or vector artwork.""",
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


ALL_TOOLS: List[Dict[str, Any]] = [
    GENERATE_IMAGE_TOOL,
    UPSCALE_IMAGE_TOOL,
    EDIT_IMAGE_TOOL,
    IMAGE_TO_IMAGE_TOOL,
    REMOVE_BACKGROUND_TOOL,
    REPLACE_BACKGROUND_TOOL,
    VECTORIZE_IMAGE_TOOL,
    LIST_PROVIDERS_TOOL,
]


def get_tool_by_name(name: str) -> Dict[str, Any]:
    for tool in ALL_TOOLS:
        if tool["name"] == name:
            return tool
    raise ValueError(f"Tool '{name}' not found")


