import os
from typing import Dict, Any, List, Optional
from .base_provider import BaseImageProvider, ProviderFeature
from google import genai
import httpx
from PIL import Image
from io import BytesIO
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils import save_pil_image, get_image_url


class GeminiProvider(BaseImageProvider):
    """
    Google Gemini Provider with Image Generation
    Uses google-genai SDK.
    """

    # ---- Global prompt guardrails (logo-only, no mockups) ----
    LOGO_ONLY_OUTPUT = """
OUTPUT TYPE (NON-NEGOTIABLE):
- Generate LOGO ARTWORK ONLY (isolated graphic asset), NOT a product mockup.
- Centered logo on plain background (transparent preferred; otherwise solid white).
- No scene, no environment, no props, no photography framing.
- Keep safe margins around the logo (do not crop).
"""

    GLOBAL_NEGATIVES = """
ABSOLUTE NEGATIVES (DO NOT INCLUDE ANY OF THESE):
- No cap, hat, jersey, shirt, hoodie, clothing, mannequin, person.
- No product mockup, no packaging, no tags-on-product, no lifestyle shots.
- No fabric folds, no tabletop scenes, no studio shadows, no staged lighting.
- No 3D renders, no perspective views, no dramatic angles.
- No watermark, no UI, no editor frames, no bounding boxes, no sample labels.
"""

    FLAT_VECTOR_CONSTRAINTS = """
GEOMETRY / PRODUCTION SAFETY:
- Flat 2D design only (no 3D depth tricks).
- Clean edges, closed shapes, crisp separations between colors.
- Avoid micro-details; keep minimum line thickness stitch/print-safe.
- High contrast and legibility at small sizes.
"""

    # Optional: if you ever want mockups later, you can add output_mode and skip these blocks.

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment")

        self.client = genai.Client(api_key=self.api_key)
        self._http_client = httpx.AsyncClient(timeout=120.0)

    @property
    def provider_name(self) -> str:
        return "gemini"

    def get_supported_features(self) -> List[ProviderFeature]:
        return [
            ProviderFeature.GENERATE,
            ProviderFeature.EDIT,
            ProviderFeature.IMAGE_TO_IMAGE,
            ProviderFeature.UPSCALE,
        ]

    # -----------------------------
    # Prompt builders (single source of truth)
    # -----------------------------
    def _style_prompt(
        self,
        style: str,
        leather_color: Optional[str] = None,
        ink_color: Optional[str] = None,
        font_style: Optional[str] = None,
    ) -> str:
        style = (style or "embroidery").lower().strip()

        # Baseline: always enforce logo-only + negatives
        base = f"""
{self.LOGO_ONLY_OUTPUT}
{self.GLOBAL_NEGATIVES}
"""

        if style == "embroidery":
            return f"""{base}
STYLE: Embroidery-ready logo asset (NOT a stitched product photo).
- Flat 2D, scan-like / top-down presentation.
- Thread texture allowed ONLY as subtle fill texture inside shapes (no photoreal lighting).
- Solid color blocks; digitization-friendly; crisp outlines.
- NO shadows, NO perspective, NO angled view.
{self.FLAT_VECTOR_CONSTRAINTS}
{("- Text font style: " + font_style) if font_style else ""}
"""

        if style == "leather":
            lc = leather_color or "natural leather tones (tan, brown, black)"
            ic = ink_color or "dark debossed or metallic embossed look (gold/silver)"
            return f"""{base}
STYLE: Leather stamp/patch logo asset (NOT on a bag/hat/clothing).
- Leather base color: {lc}
- Stamp/ink style: {ic}
- Grain texture allowed only as subtle flat surface texture (scan-like), never a product scene.
- NO shadows, NO perspective, NO angled view.
{self.FLAT_VECTOR_CONSTRAINTS}
{("- Text font style: " + font_style) if font_style else ""}
"""

        if style == "screen_print":
            return f"""{base}
STYLE: Screen print logo artwork.
- Flat solid colors, high contrast, vector-ready.
- No gradients, no shadows, no 3D effects.
- Limited palette (2–4 colors).
{self.FLAT_VECTOR_CONSTRAINTS}
"""

        if style == "woven":
            return f"""{base}
STYLE: Woven label logo artwork (NOT photographed sewn-on label).
- Weave texture allowed only as flat pattern fill.
- Limited colors (2–4).
- No depth, no shadows, no perspective.
{self.FLAT_VECTOR_CONSTRAINTS}
"""

        if style == "sublimation":
            return f"""{base}
STYLE: Sublimation print logo artwork.
- Full color allowed; gradients allowed.
- Must remain flat (no 3D lighting), clean edges, no shadows.
"""

        if style == "pvc":
            return f"""{base}
STYLE: PVC/Rubber patch logo artwork (NOT photographed on clothing).
- Flat top-down / scan-like.
- Relief implied by simple edge definition (avoid realistic cast shadows).
- Solid colors, clean separations.
{self.FLAT_VECTOR_CONSTRAINTS}
"""

        # Fallback
        return f"""{base}
STYLE: Flat logo artwork.
{self.FLAT_VECTOR_CONSTRAINTS}
"""

    def _build_generate_prompt(
        self,
        user_prompt: str,
        style: str,
        leather_color: Optional[str] = None,
        ink_color: Optional[str] = None,
        font_style: Optional[str] = None,
    ) -> str:
        style_block = self._style_prompt(
            style=style,
            leather_color=leather_color,
            ink_color=ink_color,
            font_style=font_style,
        )

        return f"""{style_block}

TASK:
- Create the logo described below as an isolated asset.

LOGO BRIEF:
{user_prompt}

FINAL CHECKLIST (MUST PASS):
- Logo only (no product/mockup/apparel).
- Plain background (transparent or solid white).
- Flat, production-ready edges and shapes.
- Keep safe margins; do not crop the logo.
"""

    def _build_edit_prompt(
        self,
        edit_instruction: str,
        style: str,
        leather_color: Optional[str] = None,
        ink_color: Optional[str] = None,
        font_style: Optional[str] = None,
    ) -> str:
        style_block = self._style_prompt(
            style=style,
            leather_color=leather_color,
            ink_color=ink_color,
            font_style=font_style,
        )

        return f"""
You are editing a LOGO ASSET (not a product mockup).

{style_block}

EDIT INSTRUCTIONS:
{edit_instruction}

OUTPUT REQUIREMENTS:
- Return the edited logo only, centered, on transparent or white background.
- No product mockups, no apparel, no scenes, no UI frames.
- Preserve overall geometry unless the edit instruction explicitly changes it.
"""

    # -----------------------------
    # Image generation
    # -----------------------------
    async def generate_image(
        self,
        prompt: str,
        model: str = "gemini-3-pro-image-preview",
        aspect_ratio: str = "1:1",
        number_of_images: int = 1,
        style: str = "embroidery",
        leather_color: str = None,
        ink_color: str = None,
        font_style: str = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Generate images using Gemini models that support image generation.
        """

        available_models = [
            "gemini-3-pro-image-preview",
            "gemini-2.5-flash-image",
            "gemini-1.5-pro-latest",
        ]
        if model not in available_models:
            model = "gemini-3-pro-image-preview"

        enhanced_prompt = self._build_generate_prompt(
            user_prompt=prompt,
            style=style,
            leather_color=leather_color,
            ink_color=ink_color,
            font_style=font_style,
        )

        print(f"Gemini using model: {model}")
        print(f"Enhanced prompt: {enhanced_prompt[:250]}...")

        results = []
        for attempt in range(number_of_images):
            try:
                response = self.client.models.generate_content(
                    model=model,
                    contents=enhanced_prompt,
                )

                if hasattr(response, "prompt_feedback"):
                    print(f"Gemini prompt feedback: {response.prompt_feedback}")

                if not getattr(response, "parts", None):
                    error_details = []
                    if hasattr(response, "candidates") and response.candidates:
                        for candidate in response.candidates:
                            if hasattr(candidate, "finish_reason"):
                                error_details.append(f"Finish reason: {candidate.finish_reason}")
                            if hasattr(candidate, "safety_ratings"):
                                error_details.append(f"Safety ratings: {candidate.safety_ratings}")

                    error_msg = " | ".join(error_details) if error_details else "No parts in response"
                    print(f"Gemini returned no image parts: {error_msg}")
                    continue

                for part in response.parts:
                    if hasattr(part, "inline_data") and part.inline_data:
                        image = part.as_image()
                        filepath = save_pil_image(image, prefix="gemini_gen")
                        image_url = get_image_url(filepath)

                        results.append({"url": image_url, "local_path": filepath})
                        print(f"Gemini generated image: {image_url}")

            except Exception as e:
                print(f"Error in Gemini generate_image (attempt {attempt + 1}): {str(e)}")
                if "NOT_FOUND" in str(e) and "generateContent" in str(e):
                    print(
                        f"Model {model} doesn't support generateContent for images. "
                        f"Use Gemini image-capable models, not Imagen models."
                    )
                import traceback

                traceback.print_exc()

        if not results:
            raise ValueError(
                f"No images generated by Gemini ({model}). "
                "Possible reasons: 1) Text in images blocked by safety filters, "
                "2) Model doesn't support image generation via generate_content, "
                "3) Prompt triggered content policy. "
                "Try using Recraft or OpenAI instead."
            )

        return self.normalize_response(
            {"images": results, "model": model, "aspect_ratio": aspect_ratio}
        )

    # -----------------------------
    # Image editing
    # -----------------------------
    async def edit_image(
        self,
        image_url: str,
        prompt: str,
        model: str = "gemini-3-pro-image-preview",
        style: str = "embroidery",
        leather_color: str = None,
        ink_color: str = None,
        font_style: str = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Edit an image using Gemini with style presets + global "logo-only" guardrails.
        """
        image_bytes = await self._download_image(image_url)
        pil_image = Image.open(BytesIO(image_bytes))

        enhanced_prompt = self._build_edit_prompt(
            edit_instruction=prompt,
            style=style,
            leather_color=leather_color,
            ink_color=ink_color,
            font_style=font_style,
        )

        try:
            response = self.client.models.generate_content(
                model=model,
                contents=[pil_image, enhanced_prompt],
            )

            if not getattr(response, "parts", None):
                raise ValueError(
                    "Gemini did not generate any image parts. "
                    f"Response: {response.text if hasattr(response, 'text') else 'No response text'}"
                )

            results = []
            for part in response.parts:
                if hasattr(part, "inline_data") and part.inline_data:
                    image = part.as_image()
                    filepath = save_pil_image(image, prefix="gemini_edit")
                    result_url = get_image_url(filepath)
                    results.append({"url": result_url, "local_path": filepath})

            if not results:
                raise ValueError("Gemini generated a response but no images. Try a different prompt or model.")

            return self.normalize_response({"images": results, "model": model})

        except Exception as e:
            raise ValueError(f"Gemini image editing failed: {str(e)}")

    async def image_to_image(self, image_url: str, prompt: str, **kwargs) -> Dict[str, Any]:
        """Image-to-image transformation"""
        return await self.edit_image(image_url, prompt, **kwargs)

    async def upscale_image(
        self,
        image_url: str,
        upscale_factor: str = "x2",
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Upscale using high-quality LANCZOS interpolation.
        Note: Gemini doesn't have dedicated upscaling, so we use PIL.
        """
        image_bytes = await self._download_image(image_url)
        pil_image = Image.open(BytesIO(image_bytes))

        width, height = pil_image.size

        if upscale_factor == "x2":
            scale = 2
        elif upscale_factor in ("x4", "4"):
            scale = 4
        else:
            scale = 2

        new_width = width * scale
        new_height = height * scale

        upscaled = pil_image.resize((new_width, new_height), Image.Resampling.LANCZOS)

        filepath = save_pil_image(upscaled, prefix="gemini_upscale")
        result_url = get_image_url(filepath)

        return self.normalize_response(
            {"images": [{"url": result_url, "local_path": filepath}], "upscale_factor": upscale_factor}
        )

    async def _download_image(self, url: str) -> bytes:
        """Download image from URL or decode from base64"""
        if url.startswith("data:"):
            import base64

            header, encoded = url.split(",", 1)
            return base64.b64decode(encoded)

        response = await self._http_client.get(url)
        response.raise_for_status()
        return response.content

    def get_available_models(self) -> List[str]:
        return [
            "gemini-3-pro-image-preview",
            "gemini-2.0-flash-exp",
            "gemini-1.5-flash",
            "gemini-1.5-pro",
        ]
