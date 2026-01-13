// Helper functions for color conversion
const rgbToHex = (r, g, b) => {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  ).toUpperCase();
};

export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
};

// Convert RGB to HSL for color grouping
const rgbToHsl = (r, g, b) => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic (gray)
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
};

// Group colors by shade/hue family
const groupByShade = (colors) => {
  const groups = {
    blacks: [],    // Very dark colors (lightness < 15)
    grays: [],     // Low saturation (< 15)
    whites: [],    // Very light colors (lightness > 85)
    reds: [],      // Hue 0-15, 345-360
    oranges: [],   // Hue 16-45
    yellows: [],   // Hue 46-75
    greens: [],    // Hue 76-165
    cyans: [],     // Hue 166-195
    blues: [],     // Hue 196-255
    purples: [],   // Hue 256-290
    pinks: [],     // Hue 291-344
  };

  colors.forEach(color => {
    // Classify by lightness and saturation first
    if (color.lightness < 15) {
      groups.blacks.push(color);
    } else if (color.lightness > 85 && color.saturation < 15) {
      groups.whites.push(color);
    } else if (color.saturation < 15) {
      groups.grays.push(color);
    } else {
      // Classify by hue
      const hue = color.hue;
      if (hue >= 0 && hue <= 15 || hue >= 345) {
        groups.reds.push(color);
      } else if (hue >= 16 && hue <= 45) {
        groups.oranges.push(color);
      } else if (hue >= 46 && hue <= 75) {
        groups.yellows.push(color);
      } else if (hue >= 76 && hue <= 165) {
        groups.greens.push(color);
      } else if (hue >= 166 && hue <= 195) {
        groups.cyans.push(color);
      } else if (hue >= 196 && hue <= 255) {
        groups.blues.push(color);
      } else if (hue >= 256 && hue <= 290) {
        groups.purples.push(color);
      } else if (hue >= 291 && hue <= 344) {
        groups.pinks.push(color);
      }
    }
  });

  // Sort within each group by lightness (dark to light)
  Object.keys(groups).forEach(key => {
    groups[key].sort((a, b) => a.lightness - b.lightness);
  });

  return groups;
};

// Group colors by shade and return all colors (no limiting)
const selectRepresentativeColorsGrouped = (groups) => {
  // Define group order and display names
  const groupConfig = {
    blacks: { name: 'Blacks', emoji: '⚫' },
    grays: { name: 'Grays', emoji: '⬜' },
    whites: { name: 'Whites', emoji: '⚪' },
    reds: { name: 'Reds', emoji: '🔴' },
    oranges: { name: 'Oranges', emoji: '🟠' },
    yellows: { name: 'Yellows', emoji: '🟡' },
    greens: { name: 'Greens', emoji: '🟢' },
    cyans: { name: 'Cyans', emoji: '🔵' },
    blues: { name: 'Blues', emoji: '🔵' },
    purples: { name: 'Purples', emoji: '🟣' },
    pinks: { name: 'Pinks', emoji: '🩷' },
  };
  
  const groupOrder = Object.keys(groupConfig);
  
  // Build grouped result - take ALL colors from each group
  const result = [];
  
  groupOrder.forEach((groupKey) => {
    const group = groups[groupKey];
    
    if (group.length > 0) {
      // Sort by prominence within group (largest first)
      const sorted = [...group].sort((a, b) => b.count - a.count);
      
      result.push({
        groupKey: groupKey,
        groupName: groupConfig[groupKey].name,
        groupEmoji: groupConfig[groupKey].emoji,
        colors: sorted.map(({ rgb, hex, count }) => ({ rgb, hex, count }))
      });
    }
  });
  
  return result;
};

// Helper to normalize any color format to hex
const normalizeColorToHex = (color) => {
  if (!color || typeof color !== 'string') return null;
  
  color = color.trim().toLowerCase();
  
  // Skip transparent/none
  if (color === 'transparent' || color === 'none') return null;
  
  // Already hex
  if (color.startsWith('#')) {
    // Ensure uppercase for consistency
    return color.toUpperCase();
  }
  
  // rgb(r, g, b) format
  const rgbMatch = color.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);
    return rgbToHex(r, g, b);
  }
  
  return null;
};

// Extract colors directly from SVG vector objects (preserves exact hex values)
export const extractColorsFromSVG = (fabricObject) => {
  if (!fabricObject) {
    return [];
  }

  const colorMap = new Map();

  // Recursively collect colors from fabric objects
  const collectColors = (obj) => {
    // Collect fill color
    if (obj.fill && typeof obj.fill === 'string') {
      const hex = normalizeColorToHex(obj.fill);
      // Skip #000000 as it's not in brand colors (Fabric.js default)
      if (hex && hex !== '#000000') {
        // Weight by object area (approximation)
        const area = (obj.width || 0) * (obj.height || 0) * (obj.scaleX || 1) * (obj.scaleY || 1);
        colorMap.set(hex, (colorMap.get(hex) || 0) + Math.max(area, 100));
      }
    }

    // Collect stroke color
    if (obj.stroke && typeof obj.stroke === 'string') {
      const hex = normalizeColorToHex(obj.stroke);
      // Skip #000000 as it's not in brand colors (Fabric.js default)
      if (hex && hex !== '#000000') {
        // Weight by stroke "area" (perimeter * width)
        const strokeArea = (obj.strokeWidth || 1) * ((obj.width || 0) + (obj.height || 0)) * (obj.scaleX || 1);
        colorMap.set(hex, (colorMap.get(hex) || 0) + Math.max(strokeArea, 50));
      }
    }

    // Recursively handle groups
    if (obj.type === 'group' && obj._objects) {
      obj._objects.forEach(child => collectColors(child));
    }
  };

  collectColors(fabricObject);

  let colorsWithInfo = Array.from(colorMap.entries()).map(([hex, count]) => {
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    return {
      rgb: `rgb(${rgb.r},${rgb.g},${rgb.b})`,
      hex: hex,
      count: Math.round(count),
      hue: hsl.h,
      saturation: hsl.s,
      lightness: hsl.l,
    };
  });

  // Group by color family based on hue
  const grouped = groupByShade(colorsWithInfo);
  
  // Group colors by shade - display all colors found
  const groupedColors = selectRepresentativeColorsGrouped(grouped);

  return groupedColors;
};

export const extractColorsFromImage = (fabricObject) => {
  if (!fabricObject) {
    return [];
  }

  if (fabricObject.type === 'group' || fabricObject.type === 'path' || 
      fabricObject.type === 'polygon' || fabricObject.type === 'polyline' ||
      fabricObject.type === 'rect' || fabricObject.type === 'circle' ||
      fabricObject.type === 'ellipse' || fabricObject.type === 'line' ||
      (fabricObject.type !== 'image' && !fabricObject._element)) {
    return extractColorsFromSVG(fabricObject);
  }
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  try {
    // For raster images with _element
    if (fabricObject._element && fabricObject.type === 'image') {
      const img = fabricObject._element;
      const maxDimension = 150;
      const scale = Math.min(maxDimension / img.width, maxDimension / img.height);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    } 
    // Fallback for other objects
    else {
      const maxDimension = 150;
      const objWidth = fabricObject.width * (fabricObject.scaleX || 1);
      const objHeight = fabricObject.height * (fabricObject.scaleY || 1);
      
      if (!objWidth || !objHeight) {
        return [];
      }
      
      const scale = Math.min(maxDimension / objWidth, maxDimension / objHeight);
      
      canvas.width = Math.max(10, objWidth * scale);
      canvas.height = Math.max(10, objHeight * scale);

      // Render the fabric object to the temporary canvas
      ctx.save();
      ctx.scale(scale, scale);
      
      // Use fabric's built-in toCanvasElement for accurate rendering
      const tempCanvas = fabricObject.toCanvasElement({
        enableRetinaScaling: false,
        withoutTransform: true
      });
      ctx.drawImage(tempCanvas, 0, 0);
      ctx.restore();
    }
  } catch (error) {
    return [];
  }

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  const colorMap = new Map();

  // Use larger buckets (40 instead of 25) to group similar colors more aggressively
  for (let i = 0; i < pixels.length; i += 4) {
    const r = Math.round(pixels[i] / 40) * 40;
    const g = Math.round(pixels[i + 1] / 40) * 40;
    const b = Math.round(pixels[i + 2] / 40) * 40;
    const a = pixels[i + 3];

    if (a < 128) continue;

    const key = `${r},${g},${b}`;
    colorMap.set(key, (colorMap.get(key) || 0) + 1);
  }

  const totalPixels = (canvas.width * canvas.height);
  // Increase threshold to 2% to filter out tiny color variations and noise
  const minThreshold = totalPixels * 0.02;

  const colorsWithInfo = Array.from(colorMap.entries())
    .filter(([_, count]) => count > minThreshold)
    .map(([rgb, count]) => {
      const [r, g, b] = rgb.split(',').map(Number);
      const hex = rgbToHex(r, g, b);
      const hsl = rgbToHsl(r, g, b);
      return {
        rgb: `rgb(${r},${g},${b})`,
        hex: hex,
        count,
        hue: hsl.h,
        saturation: hsl.s,
        lightness: hsl.l,
      };
    });

  // Group by shade and return in same format as SVG extraction
  const grouped = groupByShade(colorsWithInfo);
  const groupedColors = selectRepresentativeColorsGrouped(grouped);
  
  return groupedColors;
};

export const replaceColorInImage = (fabricObject, fromColors, toColor, tolerance = 0) => {
  if (!fabricObject) {
    return;
  }

  // Only support vector objects (SVG, groups, paths)
  // Raster image color replacement is disabled
  
  // Support both single color (string) and array of colors
  const fromColorsArray = Array.isArray(fromColors) ? fromColors : [fromColors];
  const toHex = normalizeColorToHex(toColor);
  
  if (!toHex) {
    return;
  }

  const fromHexSet = new Set();
  const fromRgbArray = [];
  
  fromColorsArray.forEach(color => {
    const hex = normalizeColorToHex(color);
    if (hex) {
      fromHexSet.add(hex);
      fromRgbArray.push(hexToRgb(hex));
    }
  });

  if (fromHexSet.size === 0) {
    return;
  }
  
  let replacementCount = 0;

  // Helper to check if a color matches any of the fromColors
  const matchesFromColor = (testHex) => {
    // First check exact matches
    if (fromHexSet.has(testHex)) return true;
    
    // Then check tolerance matches if tolerance > 0
    if (tolerance > 0) {
      const testRgb = hexToRgb(testHex);
      return fromRgbArray.some(fromRgb => {
        const distance = Math.sqrt(
          Math.pow(testRgb.r - fromRgb.r, 2) +
          Math.pow(testRgb.g - fromRgb.g, 2) +
          Math.pow(testRgb.b - fromRgb.b, 2)
        );
        return distance <= tolerance;
      });
    }
    
    return false;
  };

  const replaceInObject = (obj) => {
    if (obj.fill && typeof obj.fill === 'string') {
      const fillHex = normalizeColorToHex(obj.fill);
      if (fillHex && matchesFromColor(fillHex)) {
        obj.set('fill', toHex);
        replacementCount++;
      }
    }

    if (obj.stroke && typeof obj.stroke === 'string') {
      const strokeHex = normalizeColorToHex(obj.stroke);
      if (strokeHex && matchesFromColor(strokeHex)) {
        obj.set('stroke', toHex);
        replacementCount++;
      }
    }

    if (obj.type === 'group' && obj._objects) {
      obj._objects.forEach(child => replaceInObject(child));
    }
  };

  replaceInObject(fabricObject);
  fabricObject.canvas?.renderAll();
};
