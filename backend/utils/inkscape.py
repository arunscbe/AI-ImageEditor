import shutil
import subprocess
import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Dict, List, Optional
import re

SVG_NS = "http://www.w3.org/2000/svg"
ET.register_namespace("", SVG_NS)


class InkscapeError(RuntimeError):
    pass


def _find_inkscape(inkscape_path: Optional[str] = None) -> str:
    if inkscape_path and Path(inkscape_path).exists():
        return str(inkscape_path)

    which = shutil.which("inkscape")
    if which:
        return which

    # Windows common paths (prefer .com)
    candidates = [
        r"C:\Program Files\Inkscape\bin\inkscape.com",
        r"C:\Program Files\Inkscape\bin\inkscape.exe",
        r"C:\Program Files (x86)\Inkscape\bin\inkscape.com",
        r"C:\Program Files (x86)\Inkscape\bin\inkscape.exe",
    ]
    for c in candidates:
        if Path(c).exists():
            return c

    raise InkscapeError(
        "Inkscape not found. Add 'C:\\Program Files\\Inkscape\\bin' to PATH "
        "or pass inkscape_path explicitly (prefer inkscape.com on Windows)."
    )


def _style_get(style: str, prop: str) -> Optional[str]:
    if not style:
        return None
    m = re.search(rf"{re.escape(prop)}\s*:\s*([^;]+)", style, flags=re.IGNORECASE)
    return m.group(1).strip() if m else None


def _attr_or_style(el: ET.Element, name: str, default: str) -> str:
    v = el.get(name)
    if v is not None and v.strip() != "":
        return v.strip()
    s = el.get("style", "")
    sv = _style_get(s, name)
    return sv if sv is not None and sv.strip() != "" else default


def _paint_key(path: ET.Element) -> str:
    # Conservative: match your intent
    fill = _attr_or_style(path, "fill", "INHERIT")
    stroke = _attr_or_style(path, "stroke", "INHERIT")
    stroke_w = _attr_or_style(path, "stroke-width", "INHERIT")
    opacity = _attr_or_style(path, "opacity", "INHERIT")
    fill_op = _attr_or_style(path, "fill-opacity", "INHERIT")
    stroke_op = _attr_or_style(path, "stroke-opacity", "INHERIT")
    fill_rule = _attr_or_style(path, "fill-rule", "INHERIT")
    transform = _attr_or_style(path, "transform", "")
    clip_path = _attr_or_style(path, "clip-path", "")
    mask = _attr_or_style(path, "mask", "")
    flt = _attr_or_style(path, "filter", "")
    cls = _attr_or_style(path, "class", "")
    style = _attr_or_style(path, "style", "")

    # Include class/style in key because those often carry paint
    return "|".join([fill, stroke, stroke_w, opacity, fill_op, stroke_op, fill_rule, transform, clip_path, mask, flt, cls, style])


def merge_svg_paths_with_inkscape_inplace_combine(
    svg_content: str,
    *,
    inkscape_path: Optional[str] = None,
    timeout_s: int = 180,
) -> str:
    """
    In-place combine using Inkscape, preserving style inheritance and <style> rules.

    Key differences vs your previous attempt:
      - NO selection-ungroup
      - NO object-to-path
      - NO --export-plain-svg (keeps CSS/classes)
      - Combine happens *inside* the wrapper group using group-enter/select-all.
    """
    inkscape = _find_inkscape(inkscape_path)
    root = ET.fromstring(svg_content)

    # Build parent map
    parent_map: Dict[ET.Element, ET.Element] = {}
    for parent in root.iter():
        for child in list(parent):
            parent_map[child] = parent

    # Collect all paths
    paths = root.findall(f".//{{{SVG_NS}}}path")
    if len(paths) < 2:
        return svg_content

    # Group by parent (siblings only), then paint key
    per_parent: Dict[ET.Element, Dict[str, List[ET.Element]]] = {}
    for p in paths:
        parent = parent_map.get(p)
        if parent is None:
            continue
        per_parent.setdefault(parent, {}).setdefault(_paint_key(p), []).append(p)

    merge_group_ids: List[str] = []
    merge_idx = 0

    # Wrap each mergeable sibling group in a temp <g id="...">
    for parent, groups in per_parent.items():
        children = list(parent)

        for _, group_paths in groups.items():
            if len(group_paths) < 2:
                continue

            # Find insertion point (keep stacking)
            indices = [children.index(p) for p in group_paths if p in children]
            if not indices:
                continue
            insert_at = min(indices)

            merge_idx += 1
            gid = f"__merge_{merge_idx}__"
            merge_group_ids.append(gid)

            g = ET.Element(f"{{{SVG_NS}}}g")
            g.set("id", gid)
            parent.insert(insert_at, g)

            # Move paths into wrapper, preserving order
            group_paths_sorted = sorted(group_paths, key=lambda x: children.index(x))
            for p in group_paths_sorted:
                parent.remove(p)
                g.append(p)

    if not merge_group_ids:
        return svg_content

    with tempfile.TemporaryDirectory() as td:
        td = Path(td)
        in_path = td / "in.svg"
        out_path = td / "out.svg"
        in_path.write_text(ET.tostring(root, encoding="unicode"), encoding="utf-8")

        # Actions:
        # - select wrapper group by id
        # - enter group
        # - select-all within it
        # - path-combine
        # - exit group
        # This keeps inherited/CSS styling intact.
        actions_parts = []
        for gid in merge_group_ids:
            actions_parts.extend([
                f"select-by-id:{gid}",
                "selection-group-enter",
                "select-all",
                "path-combine",
                "selection-group-exit",
                "select-none",
            ])

        actions = ";".join(actions_parts)

        # Export as normal SVG to preserve <style> and class-based paint
        cmd = [
            inkscape,
            str(in_path),
            f"--export-filename={out_path}",
            "--actions",
            actions + ";export-do;",
        ]

        p = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout_s)
        if p.returncode != 0:
            msg = (p.stderr or p.stdout or "").strip()
            raise InkscapeError(f"Inkscape failed (rc={p.returncode}): {msg}")

        return out_path.read_text(encoding="utf-8")
