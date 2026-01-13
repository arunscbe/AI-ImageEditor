# 🎨 Fabric Style Presets System

## Overview

The AI Image Editor now supports **6 different fabric/patch styles**, each with specialized prompts optimized for production-ready outputs suitable for the fabric industry.

## Available Styles

### 1. **Embroidery Patch** (Default)
- **Key Features**: Stitched thread texture, flat vectorizable colors
- **Best For**: Traditional embroidered patches, vector conversion
- **Characteristics**:
  - Thread-like textures (not photorealistic)
  - Defined edges suitable for cutting
  - Solid color blocks with embroidery texture
  - No gradients

### 2. **Leather Patch**
- **Key Features**: Genuine leather texture, debossed/embossed
- **Best For**: Leather labels, premium branding
- **Characteristics**:
  - Natural leather grain and surface detail
  - Subtle shadows for depth
  - Natural leather tones (tan, brown, black)
  - Visible edge stitching
  - Suitable for laser engraving

### 3. **Screen Print / Transfer**
- **Key Features**: Flat colors, high contrast
- **Best For**: Heat transfer, direct screen printing
- **Characteristics**:
  - Limited color palette (2-4 colors)
  - No gradients (halftone dots if needed)
  - Vector-ready edges
  - Crisp, simplified shapes

### 4. **Woven Label**
- **Key Features**: Interlaced thread pattern
- **Best For**: Damask/jacquard weaving, high-end labels
- **Characteristics**:
  - Visible weave structure
  - Pixel-like texture
  - Limited colors (2-4)
  - Completely flat, no 3D effects

### 5. **Sublimation Print**
- **Key Features**: Full color, photographic quality
- **Best For**: Polyester fabrics, full-color designs
- **Characteristics**:
  - Vibrant colors
  - Gradients and details allowed
  - Subtle fabric weave visible
  - Edge bleed acceptable

### 6. **PVC/Rubber Patch**
- **Key Features**: 3D raised texture, glossy/matte finish
- **Best For**: Weather-resistant patches, outdoor gear
- **Characteristics**:
  - Smooth rubber surface (no fabric texture)
  - Solid colors with clean separation
  - Slight dimensional depth
  - Durable appearance

## How to Use

### Frontend

1. **Select a Style**: Use the style dropdown in the AI Chat Panel settings
2. **Enter Prompt**: Describe your desired changes
3. **Submit**: The selected style is automatically applied

### Backend

The style is parsed from the message tag `[Style: style_name]` and passed to the provider:

```python
# In orchestrator
style = "embroidery"  # default
if "[Style:" in message:
    style_match = re.search(r'\[Style:\s*(\w+)\]', message)
    if style_match:
        style = style_match.group(1).lower()

# Passed to provider
tool_input["style"] = style
```

### Gemini Provider

The Gemini provider has detailed prompts for each style:

```python
STYLE_PROMPTS = {
    "embroidery": "...",
    "leather": "...",
    # ... etc
}

enhanced_prompt = f"""Based on this patch design:

{style_requirements}

MODIFICATIONS REQUESTED:
{prompt}

CRITICAL OUTPUT REQUIREMENTS:
Generate an edited design that maintains the {style.upper()} aesthetic..."""
```

## Adding New Styles

### 1. Frontend (`AIChatPanel.jsx`)

Add to `STYLE_PRESETS`:

```javascript
const STYLE_PRESETS = {
  // ... existing styles
  chenille: {
    name: "Chenille Patch",
    description: "Raised, fuzzy texture"
  }
};
```

### 2. Backend (`gemini_provider.py`)

Add to `STYLE_PROMPTS`:

```python
STYLE_PROMPTS = {
    # ... existing styles
    "chenille": """
REQUIREMENTS:
- Raised, fuzzy chenille texture with visible pile
- Soft, plush appearance with dimensional depth
- Rich, saturated colors
- Visible yarn loops creating fuzzy surface
- Suitable for letterman jackets and vintage patches
"""
}
```

## Benefits

✅ **Consistent Output**: Each style has specific requirements for predictable results  
✅ **Production-Ready**: Optimized for real fabric manufacturing  
✅ **Vectorization-Friendly**: Most styles maintain clean edges  
✅ **Industry-Specific**: Tailored prompts for fabric/textile industry  
✅ **Flexible**: Easy to add new styles or modify existing ones  

## Technical Details

- **Default Style**: `embroidery`
- **Style Parameter**: Passed to `edit_image()`, `image_to_image()`, and `generate_image()` methods
- **Orchestrator**: GPT-4o-mini parses style from message tags
- **Provider Support**: Currently fully implemented in Gemini provider
- **Other Providers**: Accept the parameter but may not use style-specific prompts

## Examples

### Generate Embroidery Patch
```
"Create a dragon logo" [Style: embroidery]
```

### Edit as Leather
```
"Add texture and vintage look" [Style: leather]
```

### Screen Print Style
```
"Simplify colors for printing" [Style: screen_print]
```

---

**Last Updated**: January 5, 2026  
**Version**: 1.0


