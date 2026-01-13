import httpx
import json
import re
import xml.etree.ElementTree as ET
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
from .base_provider import BaseImageProvider, ProviderFeature


class ColorMapper:
    """Maps colors to the closest brand color"""
    
    def __init__(self, brand_colors_path: Optional[str] = None):
        if brand_colors_path is None:
            # Default to constants/brand_colors.json relative to this file
            current_dir = Path(__file__).parent.parent
            brand_colors_path = current_dir / "constants" / "brand_colors.json"
        
        with open(brand_colors_path, 'r') as f:
            brand_colors_data = json.load(f)
        
        # Build a list of brand colors with RGB values
        self.brand_colors = []
        for color_data in brand_colors_data:
            hex_value = color_data.get("hexvalue", "")
            if hex_value:
                rgb = self._hex_to_rgb(hex_value)
                if rgb:
                    self.brand_colors.append({
                        "name": color_data.get("name", ""),
                        "hex": hex_value,
                        "rgb": rgb
                    })
    
    @staticmethod
    def _hex_to_rgb(hex_color: str) -> Optional[Tuple[int, int, int]]:
        """Convert hex color to RGB tuple"""
        hex_color = hex_color.strip().lstrip('#')
        
        # Handle transparent
        if len(hex_color) == 8 and hex_color.endswith('00'):
            return None  # Transparent, skip
        
        # Handle 6-digit hex
        if len(hex_color) == 6:
            try:
                return (
                    int(hex_color[0:2], 16),
                    int(hex_color[2:4], 16),
                    int(hex_color[4:6], 16)
                )
            except ValueError:
                return None
        
        # Handle 3-digit hex
        if len(hex_color) == 3:
            try:
                return (
                    int(hex_color[0] * 2, 16),
                    int(hex_color[1] * 2, 16),
                    int(hex_color[2] * 2, 16)
                )
            except ValueError:
                return None
        
        return None
    
    @staticmethod
    def _color_distance(rgb1: Tuple[int, int, int], rgb2: Tuple[int, int, int]) -> float:
        """Calculate Euclidean distance between two RGB colors"""
        return sum((a - b) ** 2 for a, b in zip(rgb1, rgb2)) ** 0.5
    
    def find_closest_brand_color(self, color: str) -> Optional[str]:
        """
        Find the closest brand color for a given color.
        
        Args:
            color: Color in hex (#RRGGBB), rgb(r,g,b), or named color format
        
        Returns:
            Hex value of closest brand color, or None if color is invalid/transparent
        """
        rgb = self._parse_color(color)
        if rgb is None:
            return None
        
        if not self.brand_colors:
            return None
        
        # Find closest brand color
        min_distance = float('inf')
        closest_color = None
        
        for brand_color in self.brand_colors:
            distance = self._color_distance(rgb, brand_color["rgb"])
            if distance < min_distance:
                min_distance = distance
                closest_color = brand_color["hex"]
        
        return closest_color
    
    @staticmethod
    def _parse_color(color: str) -> Optional[Tuple[int, int, int]]:
        """Parse various color formats to RGB tuple"""
        if not color or not isinstance(color, str):
            return None
        
        color = color.strip().lower()
        
        # Handle hex colors
        if color.startswith('#'):
            return ColorMapper._hex_to_rgb(color)
        
        # Handle rgb(r, g, b) format
        rgb_match = re.match(r'rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)', color)
        if rgb_match:
            return (
                int(rgb_match.group(1)),
                int(rgb_match.group(2)),
                int(rgb_match.group(3))
            )
        
        # Handle rgba(r, g, b, a) - ignore alpha for now
        rgba_match = re.match(r'rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*[\d.]+\s*\)', color)
        if rgba_match:
            return (
                int(rgba_match.group(1)),
                int(rgba_match.group(2)),
                int(rgba_match.group(3))
            )
        
        # Handle named colors (basic set)
        named_colors = {
            'black': (4, 4, 4),
            'white': (255, 255, 255),
            'red': (211, 0, 0),
            'green': (0, 163, 74),
            'blue': (0, 128, 193),
            'yellow': (255, 218, 31),
            'orange': (255, 86, 0),
            'purple': (72, 35, 110),
            'pink': (242, 131, 180),
            'transparent': None,
            'none': None
        }
        
        if color in named_colors:
            return named_colors[color]
        
        return None


class RecraftProvider(BaseImageProvider):
    
    DEFAULT_BASE_URL = "https://external.api.recraft.ai/v1"
    
    def __init__(self, api_key: str, base_url: Optional[str] = None):
        super().__init__(api_key, base_url or self.DEFAULT_BASE_URL)
        self._client = httpx.AsyncClient(
            timeout=120.0,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
        )
        self._color_mapper = ColorMapper()
    
    @property
    def provider_name(self) -> str:
        return "recraft"
    
    def get_supported_features(self) -> List[ProviderFeature]:
        return [
            ProviderFeature.GENERATE,
            ProviderFeature.IMAGE_TO_IMAGE,
            ProviderFeature.UPSCALE,
            ProviderFeature.REMOVE_BACKGROUND,
            ProviderFeature.REPLACE_BACKGROUND,
            ProviderFeature.VECTORIZE,
        ]
    
    async def generate_image(
        self,
        prompt: str,
        style: str = "realistic_image",
        size: str = "1024x1024",
        model: str = "recraftv3",
        n: int = 1,
        leather_color: str = None,
        ink_color: str = None,
        **kwargs
    ) -> Dict[str, Any]:
        
        if style in ["embroidery", "leather", "screen_print", "woven", "sublimation", "pvc"]:
            style = "realistic_image"
        
        response = await self._client.post(
            f"{self.base_url}/images/generations",
            json={
                "prompt": prompt,
                "style": style,
                "size": size,
                "model": model,
                "n": n,
                **kwargs
            }
        )
        response.raise_for_status()
        data = response.json()
        
        return self.normalize_response({
            "images": [{"url": img.get("url")} for img in data.get("data", [])],
            "model": model,
            "style": style
        })
    
    async def image_to_image(
        self,
        image_url: str,
        prompt: str,
        style: str = "realistic_image",
        size: str = "1024x1024",
        model: str = "recraftv3",
        **kwargs
    ) -> Dict[str, Any]:
        response = await self._client.post(
            f"{self.base_url}/images/generations",
            json={
                "prompt": prompt,
                "style": style,
                "size": size,
                "model": model,
                "image_url": image_url,
                **kwargs
            }
        )
        response.raise_for_status()
        data = response.json()
        
        return self.normalize_response({
            "images": [{"url": img.get("url")} for img in data.get("data", [])]
        })
    
    async def upscale_image(
        self,
        image_url: str,
        upscale_type: str = "crisp",
        **kwargs
    ) -> Dict[str, Any]:
        
        valid_types = ["crisp", "creative"]
        if upscale_type not in valid_types:
            raise ValueError(f"upscale_type must be one of {valid_types}")
        
        response = await self._client.post(
            f"{self.base_url}/images/{upscale_type}_upscale",
            json={
                "image_url": image_url,
                **kwargs
            }
        )
        response.raise_for_status()
        data = response.json()
        
        return self.normalize_response({
            "images": [{"url": data.get("data", {}).get("url")}],
            "upscale_type": upscale_type
        })
    
    async def remove_background(
        self,
        image_url: str,
        **kwargs
    ) -> Dict[str, Any]:
        response = await self._client.post(
            f"{self.base_url}/images/removeBackground",
            json={
                "image_url": image_url,
                **kwargs
            }
        )
        response.raise_for_status()
        data = response.json()
        
        return self.normalize_response({
            "images": [{"url": data.get("data", {}).get("url")}]
        })
    
    async def replace_background(
        self,
        image_url: str,
        prompt: str,
        style: str = "realistic_image",
        **kwargs
    ) -> Dict[str, Any]:
        response = await self._client.post(
            f"{self.base_url}/images/replaceBackground",
            json={
                "image_url": image_url,
                "prompt": prompt,
                "style": style,
                **kwargs
            }
        )
        response.raise_for_status()
        data = response.json()
        
        return self.normalize_response({
            "images": [{"url": img.get("url")} for img in data.get("data", [])]
        })
    
    def _normalize_svg_colors(self, svg_content: str) -> str:
        """
        Normalize colors in SVG content to match brand colors.
        
        Args:
            svg_content: SVG XML content as string
        
        Returns:
            SVG content with colors normalized to brand colors
        """
        # Use regex-based replacement to avoid namespace issues with ElementTree
        # ElementTree adds namespace prefixes that break SVG rendering in browsers
        return self._normalize_svg_colors_regex(svg_content)
    
    def _normalize_element_colors(self, element: ET.Element):
        """Recursively normalize colors in SVG element and its children"""
        # Normalize fill attribute
        if 'fill' in element.attrib:
            original_fill = element.attrib['fill']
            normalized = self._color_mapper.find_closest_brand_color(original_fill)
            if normalized:
                element.attrib['fill'] = normalized
        
        # Normalize stroke attribute
        if 'stroke' in element.attrib:
            original_stroke = element.attrib['stroke']
            normalized = self._color_mapper.find_closest_brand_color(original_stroke)
            if normalized:
                element.attrib['stroke'] = normalized
        
        # Normalize style attribute (contains fill, stroke, etc.)
        if 'style' in element.attrib:
            style = element.attrib['style']
            normalized_style = self._normalize_style_colors(style)
            element.attrib['style'] = normalized_style
        
        # Recursively process children
        for child in element:
            self._normalize_element_colors(child)
    
    def _normalize_style_colors(self, style: str) -> str:
        """Normalize colors in CSS style string"""
        # Pattern to match color properties: fill: #color, stroke: rgb(...), etc.
        color_patterns = [
            (r'fill:\s*([^;]+)', 'fill'),
            (r'stroke:\s*([^;]+)', 'stroke'),
            (r'color:\s*([^;]+)', 'color'),
            (r'background-color:\s*([^;]+)', 'background-color'),
        ]
        
        for pattern, prop in color_patterns:
            def replace_color(match):
                color_value = match.group(1).strip()
                normalized = self._color_mapper.find_closest_brand_color(color_value)
                if normalized:
                    return f'{prop}: {normalized}'
                return match.group(0)
            
            style = re.sub(pattern, replace_color, style, flags=re.IGNORECASE)
        
        return style
    
    def _normalize_svg_colors_regex(self, svg_content: str) -> str:
        """Regex-based color normalization that preserves SVG structure"""
        hex_pattern = r'((?:fill|stroke|stop-color|flood-color|lighting-color|color)=")#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})(")'
        
        def replace_hex_attr(match):
            attr_name = match.group(1)
            hex_value = match.group(2)
            closing = match.group(3)
            
            hex_color = '#' + hex_value
            normalized = self._color_mapper.find_closest_brand_color(hex_color)
            
            if normalized:
                return attr_name + normalized + closing
            return match.group(0)
        
        hex_style_pattern = r'((?:fill|stroke|stop-color|color):\s*)#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b'
        
        def replace_hex_style(match):
            css_prop = match.group(1)
            hex_value = match.group(2)
            
            hex_color = '#' + hex_value
            normalized = self._color_mapper.find_closest_brand_color(hex_color)
            
            if normalized:
                return css_prop + normalized
            return match.group(0)
        
        rgb_pattern = r'rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)'
        
        def replace_rgb(match):
            rgb = (int(match.group(1)), int(match.group(2)), int(match.group(3)))
            min_distance = float('inf')
            closest_color = None
            for brand_color in self._color_mapper.brand_colors:
                distance = ColorMapper._color_distance(rgb, brand_color["rgb"])
                if distance < min_distance:
                    min_distance = distance
                    closest_color = brand_color["hex"]
            
            if closest_color:
                return closest_color
            return match.group(0)
        
        svg_content = re.sub(hex_pattern, replace_hex_attr, svg_content)
        svg_content = re.sub(hex_style_pattern, replace_hex_style, svg_content)
        svg_content = re.sub(rgb_pattern, replace_rgb, svg_content)
        
        return svg_content
    
    async def vectorize_image(
        self,
        image_url: str,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Vectorize a raster image to SVG
        Recraft requires file upload, not URL
        """
        # Download the image first
        image_response = await self._client.get(image_url)
        image_response.raise_for_status()
        image_bytes = image_response.content
        
        # Ensure minimum size (256x256)
        from PIL import Image
        from io import BytesIO
        
        img = Image.open(BytesIO(image_bytes))
        w, h = img.size
        
        if w < 256 or h < 256:
            scale = 256 / min(w, h)
            new_w = int(w * scale)
            new_h = int(h * scale)
            img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
            
            output = BytesIO()
            img.save(output, format="PNG")
            image_bytes = output.getvalue()
        
        # Send as file upload (multipart/form-data)
        files = {
            "file": ("image.png", image_bytes, "image/png")
        }
        
        # Create new client without JSON header for multipart
        async with httpx.AsyncClient(timeout=120.0) as upload_client:
            response = await upload_client.post(
                f"{self.base_url}/images/vectorize",
                headers={"Authorization": f"Bearer {self.api_key}"},
                files=files
            )
            response.raise_for_status()
            data = response.json()
        
        svg_url = data.get("image", {}).get("url")
        
        if not svg_url:
            raise ValueError("No SVG URL returned from Recraft vectorize API")

        # Download SVG and normalize colors
        try:
            svg_response = await self._client.get(svg_url)
            svg_response.raise_for_status()
            svg_content = svg_response.text
            
            # Normalize colors to brand colors
            normalized_svg = self._normalize_svg_colors(svg_content)
            
            # Save normalized SVG
            from utils.image_storage import save_svg_content, get_image_url
            filepath = save_svg_content(svg_content.encode('utf-8'), prefix="final_")
            normalized_svg_url = get_image_url(filepath)
            
            return self.normalize_response({
                "images": [{"url": normalized_svg_url}]
            })
        except Exception as e:
            return self.normalize_response({
                "images": [{"url": svg_url}]
            })

