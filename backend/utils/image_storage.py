import os
import base64
import uuid
from pathlib import Path
from datetime import datetime
from PIL import Image
from io import BytesIO


STORAGE_DIR = Path(os.getenv("IMAGE_STORAGE_PATH", "generated_images"))
STORAGE_DIR.mkdir(exist_ok=True)
PUBLIC_BASE_URL = os.getenv("PUBLIC_BASE_URL")  # no default; fail fast


def save_base64_image(base64_data: str, prefix: str = "img") -> str:
    """
    Save a base64 encoded image to disk and return the file path.

    Args:
        base64_data: Base64 encoded image string (with or without data URI prefix)
        prefix: Filename prefix (default: "img")

    Returns:
        Relative file path to the saved image
    """
    if base64_data.startswith("data:image"):
        base64_data = base64_data.split(",", 1)[1]

    image_bytes = base64.b64decode(base64_data)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    filename = f"{prefix}_{timestamp}_{unique_id}.png"

    filepath = STORAGE_DIR / filename

    with open(filepath, "wb") as f:
        f.write(image_bytes)

    return str(filepath).replace("\\", "/")


def save_pil_image(pil_image, prefix: str = "img") -> str:
    """
    Save a PIL Image to disk and return the file path.

    Args:
        pil_image: PIL Image object or compatible image object
        prefix: Filename prefix (default: "img")

    Returns:
        Relative file path to the saved image
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    filename = f"{prefix}_{timestamp}_{unique_id}.png"

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
