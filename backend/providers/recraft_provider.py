import httpx
import json
import re
import xml.etree.ElementTree as ET
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
from .base_provider import BaseImageProvider, ProviderFeature
import sys
import os

# Add parent directory to path for logger import
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from logger import get_logger

logger = get_logger(__name__)

SVG_NS = "http://www.w3.org/2000/svg"
SVG_TAG_PATH = f"{{{SVG_NS}}}path"


class ColorMapper:
    """Maps colors to the closest brand color"""

    def __init__(self, brand_colors_path: Optional[str] = None):
        if brand_colors_path is None:
            current_dir = Path(__file__).parent.parent
            brand_colors_path = current_dir / "constants" / "brand_colors.json"

        with open(brand_colors_path, "r") as f:
            brand_colors_data = json.load(f)

        self.brand_colors = []
        for color_data in brand_colors_data:
            hex_value = color_data.get("hexvalue", "")
            if hex_value:
                rgb = self._hex_to_rgb(hex_value)
                if rgb:
                    self.brand_colors.append(
                        {"name": color_data.get("name", ""), "hex": hex_value, "rgb": rgb}
                    )

    @staticmethod
    def _hex_to_rgb(hex_color: str) -> Optional[Tuple[int, int, int]]:
        hex_color = hex_color.strip().lstrip("#")
        if len(hex_color) == 8 and hex_color.endswith("00"):
            return None
        if len(hex_color) == 6:
            try:
                return (int(hex_color[0:2], 16), int(hex_color[2:4], 16), int(hex_color[4:6], 16))
            except ValueError:
                return None
        if len(hex_color) == 3:
            try:
                return (int(hex_color[0] * 2, 16), int(hex_color[1] * 2, 16), int(hex_color[2] * 2, 16))
            except ValueError:
                return None
        return None

    @staticmethod
    def _color_distance(rgb1: Tuple[int, int, int], rgb2: Tuple[int, int, int]) -> float:
        return sum((a - b) ** 2 for a, b in zip(rgb1, rgb2)) ** 0.5

    def find_closest_brand_color(self, color: str) -> Optional[str]:
        rgb = self._parse_color(color)
        if rgb is None or not self.brand_colors:
            return None

        min_distance = float("inf")
        closest_color = None
        for brand_color in self.brand_colors:
            distance = self._color_distance(rgb, brand_color["rgb"])
            if distance < min_distance:
                min_distance = distance
                closest_color = brand_color["hex"]
        return closest_color

    @staticmethod
    def _parse_color(color: str) -> Optional[Tuple[int, int, int]]:
        if not color or not isinstance(color, str):
            return None
        color = color.strip().lower()

        if color.startswith("#"):
            return ColorMapper._hex_to_rgb(color)

        rgb_match = re.match(r"rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)", color)
        if rgb_match:
            return (int(rgb_match.group(1)), int(rgb_match.group(2)), int(rgb_match.group(3)))

        rgba_match = re.match(
            r"rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*[\d.]+\s*\)", color
        )
        if rgba_match:
            return (int(rgba_match.group(1)), int(rgba_match.group(2)), int(rgba_match.group(3)))

        named_colors = {
            "black": (4, 4, 4),
            "white": (255, 255, 255),
            "red": (211, 0, 0),
            "green": (0, 163, 74),
            "blue": (0, 128, 193),
            "yellow": (255, 218, 31),
            "orange": (255, 86, 0),
            "purple": (72, 35, 110),
            "pink": (242, 131, 180),
            "transparent": None,
            "none": None,
        }
        return named_colors.get(color)


class RecraftProvider(BaseImageProvider):
    DEFAULT_BASE_URL = "https://external.api.recraft.ai/v1"

    def __init__(self, api_key: str, base_url: Optional[str] = None):
        super().__init__(api_key, base_url or self.DEFAULT_BASE_URL)
        self._client = httpx.AsyncClient(
            timeout=120.0,
            headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
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
        **kwargs,
    ) -> Dict[str, Any]:
        if style in ["embroidery", "leather", "screen_print", "woven", "sublimation", "pvc"]:
            style = "realistic_image"

        response = await self._client.post(
            f"{self.base_url}/images/generations",
            json={"prompt": prompt, "style": style, "size": size, "model": model, "n": n, **kwargs},
        )
        response.raise_for_status()
        data = response.json()

        return self.normalize_response(
            {"images": [{"url": img.get("url")} for img in data.get("data", [])], "model": model, "style": style}
        )

    async def image_to_image(
        self,
        image_url: str,
        prompt: str,
        style: str = "realistic_image",
        size: str = "1024x1024",
        model: str = "recraftv3",
        **kwargs,
    ) -> Dict[str, Any]:
        response = await self._client.post(
            f"{self.base_url}/images/generations",
            json={"prompt": prompt, "style": style, "size": size, "model": model, "image_url": image_url, **kwargs},
        )
        response.raise_for_status()
        data = response.json()
        return self.normalize_response({"images": [{"url": img.get("url")} for img in data.get("data", [])]})

    async def upscale_image(self, image_url: str, upscale_type: str = "crisp", **kwargs) -> Dict[str, Any]:
        valid_types = ["crisp", "creative"]
        if upscale_type not in valid_types:
            raise ValueError(f"upscale_type must be one of {valid_types}")

        response = await self._client.post(
            f"{self.base_url}/images/{upscale_type}_upscale", json={"image_url": image_url, **kwargs}
        )
        response.raise_for_status()
        data = response.json()
        return self.normalize_response(
            {"images": [{"url": data.get("data", {}).get("url")}], "upscale_type": upscale_type}
        )

    async def remove_background(self, image_url: str, **kwargs) -> Dict[str, Any]:
        response = await self._client.post(f"{self.base_url}/images/removeBackground", json={"image_url": image_url, **kwargs})
        response.raise_for_status()
        data = response.json()
        return self.normalize_response({"images": [{"url": data.get("data", {}).get("url")}]})


    async def replace_background(
        self, image_url: str, prompt: str, style: str = "realistic_image", **kwargs
    ) -> Dict[str, Any]:
        response = await self._client.post(
            f"{self.base_url}/images/replaceBackground",
            json={"image_url": image_url, "prompt": prompt, "style": style, **kwargs},
        )
        response.raise_for_status()
        data = response.json()
        return self.normalize_response({"images": [{"url": img.get("url")} for img in data.get("data", [])]})

    # -----------------------------
    # SVG FIXES (black rendering)
    # -----------------------------

    @staticmethod
    def _local_tag(tag: str) -> str:
        if tag.startswith("{"):
            return tag.split("}", 1)[1]
        return tag

    @staticmethod
    def _parse_style(style: str) -> Dict[str, str]:
        out: Dict[str, str] = {}
        if not style:
            return out
        for part in style.split(";"):
            if ":" not in part:
                continue
            k, v = part.split(":", 1)
            k = k.strip().lower()
            v = v.strip()
            if k:
                out[k] = v
        return out

    @staticmethod
    def _serialize_style(style_map: Dict[str, str]) -> str:
        # Stable style serialization (optional if you want to keep styles)
        return ";".join(f"{k}:{v}" for k, v in style_map.items() if v is not None and v != "")

    @staticmethod
    def _extract_css_class_rules(svg_root: ET.Element) -> Dict[str, Dict[str, str]]:
        """
        FIX: Inline CSS classes.
        Parses very common patterns like:
          .st0{fill:#ff00aa;stroke:none;opacity:1}
        Returns { "st0": {"fill":"#ff00aa", "stroke":"none"} }
        Conservative: only supports simple ".class{...}" rules.
        """
        rules: Dict[str, Dict[str, str]] = {}

        # Find all <style> nodes under SVG namespace
        for style_el in svg_root.findall(f".//{{{SVG_NS}}}style"):
            text = style_el.text or ""
            # Remove comments
            text = re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)

            # Match .className{...}
            for m in re.finditer(r"\.([A-Za-z0-9_-]+)\s*\{([^}]+)\}", text):
                cls = m.group(1).strip()
                body = m.group(2).strip()
                props = {}
                for part in body.split(";"):
                    if ":" not in part:
                        continue
                    k, v = part.split(":", 1)
                    k = k.strip().lower()
                    v = v.strip()
                    if k:
                        props[k] = v
                if props:
                    rules[cls] = props

        return rules

    @staticmethod
    def _apply_class_rules_to_path(path_el: ET.Element, class_rules: Dict[str, Dict[str, str]]) -> None:
        """
        FIX: Apply class rule properties onto presentation attributes.
        """
        cls_attr = (path_el.get("class") or "").strip()
        if not cls_attr:
            return

        # class="st0 st1" -> apply in order; later wins (CSS-like)
        classes = [c for c in cls_attr.split() if c]
        merged_props: Dict[str, str] = {}
        for c in classes:
            props = class_rules.get(c)
            if props:
                merged_props.update(props)

        if not merged_props:
            return

        # Merge with inline style too (inline wins)
        inline_style_map = RecraftProvider._parse_style(path_el.get("style", "") or "")
        merged_props.update(inline_style_map)

        # Apply to attributes (presentation attributes)
        for k, v in merged_props.items():
            # Only set SVG presentation attrs we care about
            if k in {
                "fill", "stroke", "stroke-width", "stroke-linejoin", "stroke-linecap",
                "stroke-miterlimit", "stroke-dasharray", "stroke-dashoffset",
                "opacity", "fill-opacity", "stroke-opacity", "fill-rule",
                "vector-effect", "paint-order"
            }:
                path_el.set(k, v)

        # Remove style and class to prevent renderer confusion (Fabric often ignores CSS anyway)
        if "style" in path_el.attrib:
            del path_el.attrib["style"]
        # You can keep class if you want, but removing is safer for canvas parsers.
        if "class" in path_el.attrib:
            del path_el.attrib["class"]

    def _inline_css_classes(self, svg_content: str) -> str:
        """
        FIX: Convert <style> class rules into explicit attributes on paths.
        This prevents black fallback when parser doesn't apply CSS.
        """
        try:
            ET.register_namespace("", SVG_NS)
            root = ET.fromstring(svg_content)
            class_rules = self._extract_css_class_rules(root)
            if not class_rules:
                return svg_content

            count = 0
            for path in root.findall(f".//{SVG_TAG_PATH}"):
                before_fill = path.get("fill")
                self._apply_class_rules_to_path(path, class_rules)
                after_fill = path.get("fill")
                if before_fill != after_fill:
                    count += 1

            logger.info(f"Inlined CSS class rules into {count} paths")
            return ET.tostring(root, encoding="unicode")
        except Exception as e:
            logger.warning(f"Failed to inline CSS classes: {e}")
            return svg_content

    def _flatten_url_paints(self, svg_content: str) -> str:
        """
        FIX (optional): Some renderers can't do fill="url(#...)" gradients/patterns and show black.
        This replaces url(#id) with the FIRST stop-color inside that gradient if found.
        Conservative and imperfect, but prevents black blobs.
        """
        try:
            ET.register_namespace("", SVG_NS)
            root = ET.fromstring(svg_content)

            # map id -> first stop-color
            paint_map: Dict[str, str] = {}
            for grad in root.findall(f".//{{{SVG_NS}}}linearGradient") + root.findall(f".//{{{SVG_NS}}}radialGradient"):
                gid = grad.get("id")
                if not gid:
                    continue
                stop = grad.find(f".//{{{SVG_NS}}}stop")
                if stop is None:
                    continue
                col = stop.get("stop-color")
                if col:
                    paint_map[gid] = col

            if not paint_map:
                return svg_content

            url_re = re.compile(r"url\(#([A-Za-z0-9_-]+)\)")
            replaced = 0

            for path in root.findall(f".//{SVG_TAG_PATH}"):
                for attr in ("fill", "stroke"):
                    v = path.get(attr)
                    if not v:
                        continue
                    m = url_re.search(v)
                    if not m:
                        continue
                    pid = m.group(1)
                    solid = paint_map.get(pid)
                    if solid:
                        path.set(attr, solid)
                        replaced += 1

            if replaced:
                logger.info(f"Flattened {replaced} url(#...) paints to solid colors")

            return ET.tostring(root, encoding="unicode")
        except Exception as e:
            logger.warning(f"Failed to flatten url() paints: {e}")
            return svg_content

    @staticmethod
    def _effective_prop(el: ET.Element, style_map: Dict[str, str], name: str, default: str) -> str:
        v = style_map.get(name)
        if v is not None and v != "":
            return v
        v = el.get(name)
        if v is not None and v != "":
            return v
        return default

    def _extract_path_attributes(self, path_element: ET.Element) -> Dict[str, str]:
        style_map = self._parse_style(path_element.get("style", "") or "")
        attrs: Dict[str, str] = {}

        attrs["fill"] = self._effective_prop(path_element, style_map, "fill", "none")
        attrs["stroke"] = self._effective_prop(path_element, style_map, "stroke", "none")
        attrs["stroke_width"] = self._effective_prop(path_element, style_map, "stroke-width", "none")
        attrs["stroke_linejoin"] = self._effective_prop(path_element, style_map, "stroke-linejoin", "miter")
        attrs["stroke_linecap"] = self._effective_prop(path_element, style_map, "stroke-linecap", "butt")
        attrs["stroke_miterlimit"] = self._effective_prop(path_element, style_map, "stroke-miterlimit", "")
        attrs["stroke_dasharray"] = self._effective_prop(path_element, style_map, "stroke-dasharray", "")
        attrs["stroke_dashoffset"] = self._effective_prop(path_element, style_map, "stroke-dashoffset", "")
        attrs["vector_effect"] = self._effective_prop(path_element, style_map, "vector-effect", "")
        attrs["paint_order"] = self._effective_prop(path_element, style_map, "paint-order", "")

        attrs["opacity"] = self._effective_prop(path_element, style_map, "opacity", "1")
        attrs["fill_opacity"] = self._effective_prop(path_element, style_map, "fill-opacity", "1")
        attrs["stroke_opacity"] = self._effective_prop(path_element, style_map, "stroke-opacity", "1")

        attrs["fill_rule"] = self._effective_prop(path_element, style_map, "fill-rule", "nonzero")

        attrs["transform"] = path_element.get("transform", "") or ""
        attrs["clip_path"] = path_element.get("clip-path", "") or ""
        attrs["mask"] = path_element.get("mask", "") or ""
        attrs["filter"] = path_element.get("filter", "") or ""

        attrs["class"] = path_element.get("class", "") or ""
        attrs["id"] = path_element.get("id", "") or ""
        attrs["style"] = path_element.get("style", "") or ""

        return attrs

    def _create_merge_key(self, attrs: Dict[str, str]) -> str:
        key_parts = [
            attrs["fill"], attrs["stroke"], attrs["stroke_width"],
            attrs["stroke_linejoin"], attrs["stroke_linecap"],
            attrs["stroke_miterlimit"], attrs["stroke_dasharray"], attrs["stroke_dashoffset"],
            attrs["vector_effect"], attrs["paint_order"],
            attrs["opacity"], attrs["fill_opacity"], attrs["stroke_opacity"],
            attrs["fill_rule"],
            attrs["transform"], attrs["clip_path"], attrs["mask"], attrs["filter"],
        ]
        return "|".join(str(p) for p in key_parts)

    def _copy_attributes_to_element(self, source_attrs: Dict[str, str], target_element: ET.Element) -> None:
        target_element.set("fill", source_attrs["fill"] if source_attrs["fill"] else "none")

        if source_attrs["stroke"] and source_attrs["stroke"] != "none":
            target_element.set("stroke", source_attrs["stroke"])
            if source_attrs["stroke_width"] and source_attrs["stroke_width"] != "none":
                target_element.set("stroke-width", source_attrs["stroke_width"])
            target_element.set("stroke-linejoin", source_attrs["stroke_linejoin"])
            target_element.set("stroke-linecap", source_attrs["stroke_linecap"])

            if source_attrs["stroke_miterlimit"]:
                target_element.set("stroke-miterlimit", source_attrs["stroke_miterlimit"])
            if source_attrs["stroke_dasharray"]:
                target_element.set("stroke-dasharray", source_attrs["stroke_dasharray"])
            if source_attrs["stroke_dashoffset"]:
                target_element.set("stroke-dashoffset", source_attrs["stroke_dashoffset"])
            if source_attrs["vector_effect"]:
                target_element.set("vector-effect", source_attrs["vector_effect"])
            if source_attrs["paint_order"]:
                target_element.set("paint-order", source_attrs["paint_order"])
        else:
            target_element.set("stroke", "none")

        if source_attrs["opacity"] and source_attrs["opacity"] != "1":
            target_element.set("opacity", source_attrs["opacity"])
        if source_attrs["fill_opacity"] and source_attrs["fill_opacity"] != "1":
            target_element.set("fill-opacity", source_attrs["fill_opacity"])
        if source_attrs["stroke_opacity"] and source_attrs["stroke_opacity"] != "1":
            target_element.set("stroke-opacity", source_attrs["stroke_opacity"])

        if source_attrs["fill_rule"] and source_attrs["fill_rule"] != "nonzero":
            target_element.set("fill-rule", source_attrs["fill_rule"])

        if source_attrs["transform"]:
            target_element.set("transform", source_attrs["transform"])
        if source_attrs["clip_path"]:
            target_element.set("clip-path", source_attrs["clip_path"])
        if source_attrs["mask"]:
            target_element.set("mask", source_attrs["mask"])
        if source_attrs["filter"]:
            target_element.set("filter", source_attrs["filter"])

    def _is_in_skip_container(self, ancestor_stack: List[ET.Element]) -> bool:
        skip = {"defs", "clippath", "mask", "symbol", "pattern", "marker"}
        for anc in ancestor_stack:
            if self._local_tag(anc.tag).lower() in skip:
                return True
        return False

    def _merge_paths_in_group(self, parent_element: ET.Element, ancestor_stack: List[ET.Element]) -> int:
        if self._is_in_skip_container(ancestor_stack):
            return 0

        children = list(parent_element)
        paths = [c for c in children if c.tag == SVG_TAG_PATH]
        if len(paths) < 2:
            return 0

        paths_by_key: Dict[str, List[Tuple[ET.Element, Dict[str, str], int]]] = {}

        for idx, node in enumerate(children):
            if node.tag != SVG_TAG_PATH:
                continue
            # Skip if still has id/class (means we didn't inline CSS fully)
            if (node.get("id") or "").strip() or (node.get("class") or "").strip():
                continue

            attrs = self._extract_path_attributes(node)
            merge_key = self._create_merge_key(attrs)
            paths_by_key.setdefault(merge_key, []).append((node, attrs, idx))

        reduced = 0

        for merge_key, items in paths_by_key.items():
            if len(items) < 2:
                continue

            merged_d_parts: List[str] = []
            included: List[Tuple[ET.Element, int]] = []

            for path, attrs, idx in items:
                d = (path.get("d") or "").strip()
                if not d:
                    continue
                if not (d.startswith("M") or d.startswith("m")):
                    # Do not remove. Just don't merge this one.
                    continue
                merged_d_parts.append(d)
                included.append((path, idx))

            if len(included) < 2:
                continue

            merged_path = ET.Element(SVG_TAG_PATH)
            first_attrs = items[0][1]
            self._copy_attributes_to_element(first_attrs, merged_path)
            merged_path.set("d", " ".join(merged_d_parts))

            insert_index = min(i for _, i in included)

            for p, _ in included:
                try:
                    parent_element.remove(p)
                except ValueError:
                    pass

            parent_element.insert(insert_index, merged_path)
            reduced += len(included) - 1

        return reduced

    def _merge_svg_paths_by_color(self, svg_content: str) -> str:
        try:
            ET.register_namespace("", SVG_NS)
            root = ET.fromstring(svg_content)

            total_before = len(root.findall(f".//{SVG_TAG_PATH}"))

            def walk(el: ET.Element, stack: List[ET.Element]) -> int:
                merged = 0
                for child in list(el):
                    merged += walk(child, stack + [el])
                merged += self._merge_paths_in_group(el, stack + [el])
                return merged

            reduced = walk(root, [])
            total_after = len(root.findall(f".//{SVG_TAG_PATH}"))

            logger.info(f"Merged SVG paths: {total_before} -> {total_after} (reduced by {reduced})")
            return ET.tostring(root, encoding="unicode")
        except Exception as e:
            logger.error(f"Error merging SVG paths: {str(e)}", exc_info=True)
            return svg_content

    # -----------------------------
    # Color normalization (unchanged)
    # -----------------------------

    def _normalize_svg_colors(self, svg_content: str) -> str:
        return self._normalize_svg_colors_regex(svg_content)

    def _normalize_style_colors(self, style: str) -> str:
        color_patterns = [
            (r"fill:\s*([^;]+)", "fill"),
            (r"stroke:\s*([^;]+)", "stroke"),
            (r"color:\s*([^;]+)", "color"),
            (r"background-color:\s*([^;]+)", "background-color"),
        ]

        for pattern, prop in color_patterns:

            def replace_color(match):
                color_value = match.group(1).strip()
                normalized = self._color_mapper.find_closest_brand_color(color_value)
                if normalized:
                    return f"{prop}: {normalized}"
                return match.group(0)

            style = re.sub(pattern, replace_color, style, flags=re.IGNORECASE)

        return style

    def _normalize_svg_colors_regex(self, svg_content: str) -> str:
        hex_pattern = r'((?:fill|stroke|stop-color|flood-color|lighting-color|color)=")#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})(")'

        def replace_hex_attr(match):
            attr_name = match.group(1)
            hex_value = match.group(2)
            closing = match.group(3)
            hex_color = "#" + hex_value
            normalized = self._color_mapper.find_closest_brand_color(hex_color)
            if normalized:
                return attr_name + normalized + closing
            return match.group(0)

        hex_style_pattern = r"((?:fill|stroke|stop-color|color):\s*)#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b"

        def replace_hex_style(match):
            css_prop = match.group(1)
            hex_value = match.group(2)
            hex_color = "#" + hex_value
            normalized = self._color_mapper.find_closest_brand_color(hex_color)
            if normalized:
                return css_prop + normalized
            return match.group(0)

        rgb_pattern = r"rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)"

        def replace_rgb(match):
            rgb = (int(match.group(1)), int(match.group(2)), int(match.group(3)))
            min_distance = float("inf")
            closest_color = None
            for brand_color in self._color_mapper.brand_colors:
                distance = ColorMapper._color_distance(rgb, brand_color["rgb"])
                if distance < min_distance:
                    min_distance = distance
                    closest_color = brand_color["hex"]
            return closest_color or match.group(0)

        svg_content = re.sub(hex_pattern, replace_hex_attr, svg_content)
        svg_content = re.sub(hex_style_pattern, replace_hex_style, svg_content)
        svg_content = re.sub(rgb_pattern, replace_rgb, svg_content)
        return svg_content

    async def vectorize_image(self, image_url: str, **kwargs) -> Dict[str, Any]:
        """
        Vectorize a raster image to SVG
        Recraft requires file upload, not URL
        """
        image_response = await self._client.get(image_url)
        image_response.raise_for_status()
        image_bytes = image_response.content

        from PIL import Image
        from io import BytesIO

        img = Image.open(BytesIO(image_bytes))
        w, h = img.size

        if w < 256 or h < 256:
            scale = 256 / min(w, h)
            new_w = int(w * scale)
            new_h = int(h * scale)
            img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
            out = BytesIO()
            img.save(out, format="PNG")
            image_bytes = out.getvalue()

        files = {"file": ("image.png", image_bytes, "image/png")}

        async with httpx.AsyncClient(timeout=120.0) as upload_client:
            response = await upload_client.post(
                f"{self.base_url}/images/vectorize",
                headers={"Authorization": f"Bearer {self.api_key}"},
                files=files,
            )
            response.raise_for_status()
            data = response.json()

        svg_url = data.get("image", {}).get("url")
        if not svg_url:
            logger.error("No SVG URL returned from Recraft vectorize API")
            raise ValueError("No SVG URL returned from Recraft vectorize API")

        logger.info(f"Recraft vectorize API returned SVG URL: {svg_url}")

        try:
            svg_response = await self._client.get(svg_url)
            svg_response.raise_for_status()
            svg_content = svg_response.text

            # Fix preserveAspectRatio="none"
            svg_content = re.sub(
                r'preserveAspectRatio\s*=\s*["\']none["\']',
                'preserveAspectRatio="xMidYMid meet"',
                svg_content,
                flags=re.IGNORECASE,
            )

            # FIX 1: Inline CSS class-based styles so renderers don't default to black
            svg_content = self._inline_css_classes(svg_content)

            # FIX 2 (optional but recommended if you see url(#...) rendering as black):
            # If your renderer doesn't support gradients/patterns, flatten them.
            svg_content = self._flatten_url_paints(svg_content)

            # Merge paths using Inkscape (more robust than custom implementation)
            try:
                from utils.inkscape import merge_svg_paths_with_inkscape_inplace_combine
                logger.info("Merging SVG paths with Inkscape...")
                svg_content = merge_svg_paths_with_inkscape_inplace_combine(svg_content)
                logger.info("Successfully merged paths with Inkscape")
            except ImportError:
                logger.warning("Inkscape utility not available, skipping path merging")
            except Exception as e:
                logger.warning(f"Inkscape path merging failed: {str(e)}, continuing with unmerged SVG", exc_info=True)

            # Save processed SVG
            from utils.image_storage import save_svg_content, get_image_url

            filepath = save_svg_content(svg_content.encode("utf-8"), prefix="final_")
            final_url = get_image_url(filepath)

            return self.normalize_response({"images": [{"url": final_url}]})

        except Exception as e:
            logger.error(f"Failed to process SVG from Recraft: {str(e)}", exc_info=True)
            return self.normalize_response({"images": [{"url": svg_url}]})
