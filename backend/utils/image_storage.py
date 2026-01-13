import os
import base64
import uuid
from pathlib import Path
from PIL import Image
from io import BytesIO


STORAGE_DIR = Path(os.getenv("IMAGE_STORAGE_PATH", "generated_images"))
STORAGE_DIR.mkdir(exist_ok=True)
PUBLIC_BASE_URL = os.getenv("PUBLIC_BASE_URL")  # no default; fail fast


# Import centralized configuration
try:
    from config.configuration import storage_config
    PREFIX_FINAL = storage_config.PREFIX_FINAL
    PREFIX_TEMP = storage_config.PREFIX_TEMP
    PREFIX_UPLOAD = storage_config.PREFIX_UPLOAD
except ImportError:
    # Fallback if configuration not available
    PREFIX_FINAL = "final_"
    PREFIX_TEMP = "temp_"
    PREFIX_UPLOAD = "upload_"


def save_base64_image(base64_data: str, prefix: str = None) -> str:
    """
    Save a base64 encoded image to disk and return the file path.

    Args:
        base64_data: Base64 encoded image string (with or without data URI prefix)
        prefix: Filename prefix (defaults to PREFIX_FINAL)

    Returns:
        Relative file path to the saved image
    """
    if prefix is None:
        prefix = PREFIX_FINAL
        
    if base64_data.startswith("data:image"):
        base64_data = base64_data.split(",", 1)[1]

    image_bytes = base64.b64decode(base64_data)

    unique_id = str(uuid.uuid4())
    filename = f"{prefix}{unique_id}.png"

    filepath = STORAGE_DIR / filename

    with open(filepath, "wb") as f:
        f.write(image_bytes)

    return str(filepath).replace("\\", "/")


def save_pil_image(pil_image, prefix: str = None) -> str:
    """
    Save a PIL Image to disk and return the file path.

    Args:
        pil_image: PIL Image object or compatible image object
        prefix: Filename prefix (defaults to PREFIX_FINAL)

    Returns:
        Relative file path to the saved image
    """
    if prefix is None:
        prefix = PREFIX_FINAL
        
    unique_id = str(uuid.uuid4())
    filename = f"{prefix}{unique_id}.png"

    filepath = STORAGE_DIR / filename

    try:
        pil_image.save(filepath, format="PNG")
    except TypeError:
        pil_image.save(filepath)

    return str(filepath).replace("\\", "/")


def get_image_url(filepath: str, base_url: str = PUBLIC_BASE_URL) -> str:
    """
    Convert a file path to a URL.

    Args:
        filepath: Relative file path
        base_url: Base URL of the server

    Returns:
        Full URL to access the image
    """
    filename = Path(filepath).name
    return f"{base_url}/images/{filename}"


def save_uploaded_file(file_data: bytes, filename: str) -> str:
    """
    Save uploaded file bytes to disk.
    
    Args:
        file_data: Raw file bytes
        filename: Original filename (used for extension)
    
    Returns:
        Relative file path to the saved file
    """
    unique_id = str(uuid.uuid4())
    ext = Path(filename).suffix
    new_filename = f"upload_{unique_id}{ext}"
    
    filepath = STORAGE_DIR / new_filename
    
    with open(filepath, "wb") as f:
        f.write(file_data)
    
    return str(filepath).replace("\\", "/")


def save_svg_content(svg_content: bytes, prefix: str = None) -> str:
    """
    Save SVG content to disk.
    
    Args:
        svg_content: SVG file bytes
        prefix: Filename prefix (defaults to PREFIX_FINAL)
    
    Returns:
        Relative file path to the saved SVG
    """
    if prefix is None:
        prefix = PREFIX_FINAL
        
    unique_id = str(uuid.uuid4())
    filename = f"{prefix}{unique_id}.svg"
    
    filepath = STORAGE_DIR / filename
    
    with open(filepath, "wb") as f:
        f.write(svg_content)
    
    return str(filepath).replace("\\", "/")
