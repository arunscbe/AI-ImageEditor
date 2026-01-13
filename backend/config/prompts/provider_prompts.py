"""
Provider-Specific Prompts
Centralized prompt templates for all image generation providers.

Single source of truth for:
- Logo-only guardrails
- Style blocks
- Prompt builders for generate/edit/enhance
- Analysis prompt (structured JSON output)
- Style detection keyword map (legacy fallback)
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional


@dataclass(frozen=True)
class StylePromptConfig:
    leather_color: str = "natural leather tones (tan, brown, black)"
    ink_color: str = "dark debossed or metallic embossed look (gold/silver)"
    font_style: Optional[str] = None
    max_colors: Optional[int] = None  # e.g. for screen_print/woven


class ProviderPrompts:
    # ========================================
    # GLOBAL PROMPT GUARDRAILS (LOGO-ONLY)
    # ========================================

    LOGO_ONLY_OUTPUT = """OUTPUT TYPE (NON-NEGOTIABLE):
- Generate LOGO ARTWORK ONLY (isolated graphic asset), NOT a product mockup.
- Centered logo on plain background (transparent preferred; otherwise solid white).
- No scene, no environment, no props, no photography framing.
- Keep safe margins around the logo (do not crop)."""

    GLOBAL_NEGATIVES = """ABSOLUTE NEGATIVES (DO NOT INCLUDE ANY OF THESE):
- No cap, hat, jersey, shirt, hoodie, clothing, mannequin, person.
- No product mockup, no packaging, no tags-on-product, no lifestyle shots.
- No fabric folds, no tabletop scenes, no studio shadows, no staged lighting.
- No 3D renders, no perspective views, no dramatic angles.
- No watermark, no UI, no editor frames, no bounding boxes, no sample labels."""

    # Hard quality spec (use it everywhere)
    VECTOR_MASTER_QUALITY = """QUALITY (VECTOR-MASTER LOOK):
- Output must look like a clean vector master exported to PNG: sharp edges, no blur halos.
- Uniform stroke thickness; smooth curves; no wavy/jittery outlines.
- No pixelation, no JPEG artifacts, no double edges, no muddy anti-aliasing.
- Text must be crisp and legible; no broken letters, no smear.
- Flat fills only; keep consistent color regions with clean boundaries.
- High resolution output (aim for 2048x2048 or higher if possible)."""

    FLAT_VECTOR_CONSTRAINTS = """GEOMETRY / PRODUCTION SAFETY:
- Flat 2D design only (no 3D depth tricks).
- Clean edges: NO blur, NO fuzzy borders, NO glow, NO shadow.
- Closed shapes with precise boundaries; no gaps, no overlaps, no ragged corners.
- Smooth curves (no stair-stepping); consistent stroke width throughout.
- Avoid micro-details; keep minimum line thickness stitch/print-safe.
- High contrast and legibility at small sizes."""

    # ========================================
    # GEMINI ANALYSIS PROMPT (STRUCTURED JSON)
    # ========================================

    GEMINI_ANALYSIS_PROMPT = """You are an image analysis function for an image-processing orchestrator.

Return ONLY valid JSON (no markdown, no extra text) with this exact schema:
{
  "content_type": "logo|icon|illustration|photograph|text_heavy_graphic|diagram|other",
  "detected_style": "embroidery|screen_print|leather|woven|sublimation|pvc|digital_art|photograph|unknown",
  "visual_complexity": "flat_simple|mixed|photorealistic_complex",
  "vectorization_suitability": 1,
  "text_present": true,
  "text_legibility": "crisp|blurry|none",
  "quality_issues": ["blur","pixelation","noise","compression_artifacts","none"],
  "recommended_workflow": "enhance_then_vectorize|vectorize_only|enhance_only|use_as_is",
  "recommendations": ["..."]
}

Rules:
- Do NOT guess style: if uncertain use "unknown".
- vectorization_suitability is integer 1-5 (1=complex photo, 5=clean logo with crisp edges).
- If content_type is "photograph" OR visual_complexity is "photorealistic_complex":
  recommended_workflow must be "use_as_is" or "enhance_only".
- If vectorization_suitability >= 4 and image appears like clean logo/line-art:
  recommended_workflow should be "vectorize_only" or "enhance_then_vectorize" depending on quality_issues.
- recommendations must be short, actionable, and specific."""

    # ========================================
    # STYLE BLOCKS (MATCH YOUR GEMINIProvider)
    # ========================================

    GEMINI_EMBROIDERY_STYLE = """STYLE: Embroidery-ready logo asset (NOT a stitched product photo).
- Flat 2D, scan-like / top-down presentation.
- Thread texture allowed ONLY as subtle fill texture inside shapes (no photoreal lighting).
- Solid color blocks; digitization-friendly; crisp outlines.
- NO shadows, NO perspective, NO angled view."""

    GEMINI_LEATHER_STYLE = """STYLE: Leather stamp/patch logo asset (NOT on a bag/hat/clothing).
- Grain texture allowed only as subtle flat surface texture (scan-like), never a product scene.
- NO shadows, NO perspective, NO angled view."""

    GEMINI_SCREEN_PRINT_STYLE = """STYLE: Screen print logo artwork.
- Flat solid colors, high contrast, vector-ready.
- No gradients, no shadows, no 3D effects.
- Limited palette (2–4 colors)."""

    GEMINI_WOVEN_STYLE = """STYLE: Woven label logo artwork (NOT photographed sewn-on label).
- Weave texture allowed only as flat pattern fill.
- Limited colors (2–4).
- No depth, no shadows, no perspective."""

    GEMINI_SUBLIMATION_STYLE = """STYLE: Sublimation print logo artwork.
- Full color allowed; gradients allowed.
- Must remain flat (no 3D lighting), clean edges, no shadows."""

    GEMINI_PVC_STYLE = """STYLE: PVC/Rubber patch logo artwork (NOT photographed on clothing).
- Flat top-down / scan-like.
- Relief implied by simple edge definition (avoid realistic cast shadows).
- Solid colors, clean separations."""

    SAFE_FALLBACK_STYLE = """STYLE: Flat logo artwork.
- Clean, professional presentation.
- Centered on plain background."""

    STYLE_KEYWORDS: Dict[str, List[str]] = {
        # Legacy fallback only (if model returns non-JSON analysis text)
        "embroidery": ["embroidery", "embroidered", "stitched", "thread"],
        "leather": ["leather", "deboss", "emboss", "stamped"],
        "screen_print": ["screen print", "screenprint", "silkscreen", "silk screen"],
        "woven": ["woven", "weave", "fabric patch"],
        "sublimation": ["sublimation", "dye sublimation", "full color print"],
        "pvc": ["pvc", "rubber patch", "rubber", "molded"],
    }

    _STYLE_MAP: Dict[str, str] = {
        "embroidery": GEMINI_EMBROIDERY_STYLE,
        "leather": GEMINI_LEATHER_STYLE,
        "screen_print": GEMINI_SCREEN_PRINT_STYLE,
        "woven": GEMINI_WOVEN_STYLE,
        "sublimation": GEMINI_SUBLIMATION_STYLE,
        "pvc": GEMINI_PVC_STYLE,
        "rubber": GEMINI_PVC_STYLE,
    }

    # ========================================
    # PROMPT BUILDERS
    # ========================================

    @staticmethod
    def build_style_block(
        style: str,
        *,
        leather_color: Optional[str] = None,
        ink_color: Optional[str] = None,
        font_style: Optional[str] = None,
        max_colors: Optional[int] = None,
    ) -> str:
        style_key = (style or "embroidery").lower().strip()

        # Base always enforces logo-only + negatives + quality spec
        base = "\n\n".join(
            [
                ProviderPrompts.LOGO_ONLY_OUTPUT,
                ProviderPrompts.GLOBAL_NEGATIVES,
                ProviderPrompts.VECTOR_MASTER_QUALITY,
            ]
        )

        # Style-specific body
        if style_key == "leather":
            lc = leather_color or "natural leather tones (tan, brown, black)"
            ic = ink_color or "dark debossed or metallic embossed look (gold/silver)"
            style_body = (
                f"{ProviderPrompts.GEMINI_LEATHER_STYLE}\n"
                f"- Leather base color: {lc}\n"
                f"- Stamp/ink style: {ic}"
            )
        else:
            style_body = ProviderPrompts._STYLE_MAP.get(style_key, ProviderPrompts.SAFE_FALLBACK_STYLE)

        # Optional knobs
        knobs: List[str] = []
        if style_key in ("screen_print", "woven"):
            colors = max_colors or 4
            knobs.append(f"- Limited palette target: 2–{colors} colors.")
        if font_style:
            knobs.append(f"- Text font style: {font_style}")

        knobs_block = "\n".join(knobs).strip()

        # Append production constraints for styles that should stay “vector-like”
        needs_flat_constraints = style_key in ("embroidery", "leather", "screen_print", "woven", "pvc", "rubber")

        parts = [base, style_body]
        if knobs_block:
            parts.append(knobs_block)
        if needs_flat_constraints:
            parts.append(ProviderPrompts.FLAT_VECTOR_CONSTRAINTS)

        return "\n".join(parts).strip()

    @staticmethod
    def build_generate_prompt(
        user_prompt: str,
        *,
        style: str = "embroidery",
        leather_color: Optional[str] = None,
        ink_color: Optional[str] = None,
        font_style: Optional[str] = None,
        max_colors: Optional[int] = None,
    ) -> str:
        style_block = ProviderPrompts.build_style_block(
            style,
            leather_color=leather_color,
            ink_color=ink_color,
            font_style=font_style,
            max_colors=max_colors,
        )

        return f"""{style_block}

TASK:
- Create the logo described below as a clean, production-ready asset.
- Prioritize fidelity and cleanliness over creativity.

LOGO BRIEF:
{user_prompt}

FINAL CHECKLIST (MUST PASS):
- Logo only (no product/mockup/apparel).
- Plain background (transparent or solid white).
- Crisp, vector-master edges (no blur halos, no pixelation, no double edges).
- Text is sharp and readable (no distortions, no smear).
- Keep safe margins; do not crop the logo.
""".strip()

    @staticmethod
    def build_edit_prompt(
        edit_instruction: str,
        *,
        style: str = "embroidery",
        leather_color: Optional[str] = None,
        ink_color: Optional[str] = None,
        font_style: Optional[str] = None,
        max_colors: Optional[int] = None,
    ) -> str:
        style_block = ProviderPrompts.build_style_block(
            style,
            leather_color=leather_color,
            ink_color=ink_color,
            font_style=font_style,
            max_colors=max_colors,
        )

        return f"""You are editing a LOGO ASSET (not a product mockup).

{style_block}

EDIT INSTRUCTIONS:
{edit_instruction}

OUTPUT REQUIREMENTS:
- Return the edited logo only, centered, on transparent or white background.
- No product mockups, no apparel, no scenes, no UI frames.
- Preserve overall geometry unless the edit instruction explicitly changes it.
- Maintain crisp vector-master edges and text legibility.
""".strip()

    @staticmethod
    def build_enhancement_prompt(style: str) -> str:
        """
        Standalone enhancement prompt - NOT wrapped by build_edit_prompt().
        Focused purely on quality improvement, no generation language.
        """
        style_hint = f" ({style} style)" if style and style != "unknown" else ""
        
        return f"""TASK: Enhance this logo{style_hint} quality. Do NOT redesign.

INPUT: An existing logo that needs quality improvement only.

ENHANCE:
- Sharpen edges and outlines (remove blur, pixelation, jagged edges)
- Clean up compression artifacts and noise
- Make text crisp and legible
- Smooth curves, ensure consistent stroke widths
- Improve color clarity and boundaries between regions

PRESERVE (DO NOT CHANGE):
- Exact design, layout, composition, and proportions
- All colors (no recoloring, no new gradients, no shading)
- Text content and font shapes
- Overall style and character of the original

OUTPUT:
- Return the enhanced image only
- Same dimensions or slightly larger for quality
- Plain background (keep existing or use white/transparent)
- No mockups, no product shots, no added elements
""".strip()

    @staticmethod
    def detect_style_from_text(analysis_text: str) -> Optional[str]:
        """Legacy fallback: detect style from free-text analysis. Prefer JSON analysis instead."""
        if not analysis_text:
            return None
        t = analysis_text.lower()
        for style, keywords in ProviderPrompts.STYLE_KEYWORDS.items():
            if any(k in t for k in keywords):
                return style
        return None

    @staticmethod
    def get_provider_capabilities() -> Dict[str, List[str]]:
        return {
            "gemini": [
                "Image generation with style control",
                "Image editing and transformation",
                "Image-to-image transformation",
                "Image analysis with vision AI",
                "Image enhancement (quality improvement)",
            ],
            "recraft": [
                "Fast image generation",
                "Vectorization (PNG/JPG to SVG)",
                "Color normalization to brand colors",
                "Background removal",
                "Background replacement",
                "Erase region with mask",
            ],
            "openai": [
                "DALL·E image generation (integration-dependent)",
                "Creative prompt interpretation",
                "Image editing with masks (integration-dependent)",
            ],
            "replicate": [
                "Flux models for photorealism (if configured)",
                "Upscaling (model-dependent)",
                "Instruct pix2pix editing (model-dependent)",
            ],
            "google-imagen": [
                "Text rendering in images (integration-dependent)",
                "Precise image editing (integration-dependent)",
                "2x/4x upscaling (integration-dependent)",
            ],
        }


# Singleton
provider_prompts = ProviderPrompts()
