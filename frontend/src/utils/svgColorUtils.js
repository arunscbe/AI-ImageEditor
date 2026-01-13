/**
 * SVG Color Manipulation Utilities
 * Extract, merge, remove, and reduce colors in SVG content
 */

/**
 * Parse color to RGB
 */
function parseColor(colorStr) {
  if (!colorStr || colorStr === 'none' || colorStr === 'transparent') {
    return null;
  }

  // Hex color
  if (colorStr.startsWith('#')) {
    const hex = colorStr.slice(1);
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
      };
    } else if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
      };
    }
  }

  // rgb(r, g, b) or rgba(r, g, b, a)
  const rgbMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3]),
    };
  }

  return null;
}

/**
 * Convert RGB to hex
 */
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Calculate color distance (Euclidean distance in RGB space)
 */
function colorDistance(rgb1, rgb2) {
  return Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
    Math.pow(rgb1.g - rgb2.g, 2) +
    Math.pow(rgb1.b - rgb2.b, 2)
  );
}

/**
 * Extract all unique colors from SVG
 * Returns array of { hex, rgb, count }
 */
export function extractSVGColors(svgContent) {
  if (!svgContent) return [];

  const colorMap = new Map();
  
  // Extract from fill attributes
  const fillMatches = svgContent.matchAll(/fill=["']([^"']+)["']/g);
  for (const match of fillMatches) {
    const color = match[1];
    const rgb = parseColor(color);
    if (rgb) {
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      colorMap.set(hex, { hex, rgb, count: (colorMap.get(hex)?.count || 0) + 1 });
    }
  }

  // Extract from stroke attributes
  const strokeMatches = svgContent.matchAll(/stroke=["']([^"']+)["']/g);
  for (const match of strokeMatches) {
    const color = match[1];
    const rgb = parseColor(color);
    if (rgb) {
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      colorMap.set(hex, { hex, rgb, count: (colorMap.get(hex)?.count || 0) + 1 });
    }
  }

  // Extract from style attributes (fill: #xxx; stroke: #xxx;)
  const styleMatches = svgContent.matchAll(/style=["']([^"']+)["']/g);
  for (const match of styleMatches) {
    const style = match[1];
    const fillMatch = style.match(/fill:\s*([^;]+)/);
    const strokeMatch = style.match(/stroke:\s*([^;]+)/);
    
    [fillMatch, strokeMatch].forEach(m => {
      if (m) {
        const color = m[1].trim();
        const rgb = parseColor(color);
        if (rgb) {
          const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
          colorMap.set(hex, { hex, rgb, count: (colorMap.get(hex)?.count || 0) + 1 });
        }
      }
    });
  }

  // Sort by count descending
  return Array.from(colorMap.values()).sort((a, b) => b.count - a.count);
}

/**
 * Merge similar colors (colors within threshold distance)
 * threshold: 0-100, typical values 20-50
 */
export function mergeSimilarColors(colors, threshold = 30) {
  if (!colors || colors.length <= 1) return colors;

  const merged = [];
  const used = new Set();

  for (let i = 0; i < colors.length; i++) {
    if (used.has(i)) continue;

    const baseColor = colors[i];
    const similar = [baseColor];

    for (let j = i + 1; j < colors.length; j++) {
      if (used.has(j)) continue;

      const distance = colorDistance(baseColor.rgb, colors[j].rgb);
      if (distance <= threshold) {
        similar.push(colors[j]);
        used.add(j);
      }
    }

    // Average the similar colors
    const avgR = Math.round(similar.reduce((sum, c) => sum + c.rgb.r, 0) / similar.length);
    const avgG = Math.round(similar.reduce((sum, c) => sum + c.rgb.g, 0) / similar.length);
    const avgB = Math.round(similar.reduce((sum, c) => sum + c.rgb.b, 0) / similar.length);
    const totalCount = similar.reduce((sum, c) => sum + c.count, 0);

    merged.push({
      hex: rgbToHex(avgR, avgG, avgB),
      rgb: { r: avgR, g: avgG, b: avgB },
      count: totalCount,
      mergedFrom: similar.map(c => c.hex),
    });
  }

  return merged;
}

/**
 * Replace colors in SVG content
 * colorMap: { oldHex: newHex }
 */
export function replaceColorsInSVG(svgContent, colorMap) {
  if (!svgContent || !colorMap || Object.keys(colorMap).length === 0) {
    return svgContent;
  }

  let result = svgContent;

  Object.entries(colorMap).forEach(([oldColor, newColor]) => {
    // Normalize colors (case-insensitive, with/without #)
    const oldHex = oldColor.toLowerCase().replace('#', '');
    const newHex = newColor.toLowerCase().replace('#', '');

    // Replace in fill attributes
    result = result.replace(
      new RegExp(`fill=["']#${oldHex}["']`, 'gi'),
      `fill="${newColor}"`
    );

    // Replace in stroke attributes
    result = result.replace(
      new RegExp(`stroke=["']#${oldHex}["']`, 'gi'),
      `stroke="${newColor}"`
    );

    // Replace in style attributes
    result = result.replace(
      new RegExp(`fill:\\s*#${oldHex}([;"])`, 'gi'),
      `fill: ${newColor}$1`
    );
    result = result.replace(
      new RegExp(`stroke:\\s*#${oldHex}([;"])`, 'gi'),
      `stroke: ${newColor}$1`
    );
  });

  return result;
}

/**
 * Remove a specific color from SVG (replace with transparent/none)
 */
export function removeColorFromSVG(svgContent, colorToRemove) {
  if (!svgContent || !colorToRemove) return svgContent;

  const hex = colorToRemove.toLowerCase().replace('#', '');
  
  let result = svgContent;
  
  // Replace fill
  result = result.replace(
    new RegExp(`fill=["']#${hex}["']`, 'gi'),
    'fill="none"'
  );
  
  // Replace stroke
  result = result.replace(
    new RegExp(`stroke=["']#${hex}["']`, 'gi'),
    'stroke="none"'
  );
  
  // Replace in styles
  result = result.replace(
    new RegExp(`fill:\\s*#${hex}([;"])`, 'gi'),
    'fill: none$1'
  );
  result = result.replace(
    new RegExp(`stroke:\\s*#${hex}([;"])`, 'gi'),
    'stroke: none$1'
  );

  return result;
}

/**
 * Reduce number of colors using k-means clustering
 */
export function reduceColors(colors, targetCount) {
  if (!colors || colors.length <= targetCount) return colors;

  // Simple k-means clustering
  let centroids = colors.slice(0, targetCount).map(c => ({ ...c.rgb }));
  
  for (let iteration = 0; iteration < 10; iteration++) {
    const clusters = Array(targetCount).fill(null).map(() => []);

    // Assign each color to nearest centroid
    colors.forEach(color => {
      let minDist = Infinity;
      let clusterIdx = 0;

      centroids.forEach((centroid, idx) => {
        const dist = colorDistance(color.rgb, centroid);
        if (dist < minDist) {
          minDist = dist;
          clusterIdx = idx;
        }
      });

      clusters[clusterIdx].push(color);
    });

    // Recalculate centroids
    centroids = clusters.map(cluster => {
      if (cluster.length === 0) return centroids[0]; // Handle empty cluster

      const avgR = Math.round(cluster.reduce((sum, c) => sum + c.rgb.r, 0) / cluster.length);
      const avgG = Math.round(cluster.reduce((sum, c) => sum + c.rgb.g, 0) / cluster.length);
      const avgB = Math.round(cluster.reduce((sum, c) => sum + c.rgb.b, 0) / cluster.length);

      return { r: avgR, g: avgG, b: avgB };
    });
  }

  // Build final color list
  return centroids.map((rgb, idx) => ({
    hex: rgbToHex(rgb.r, rgb.g, rgb.b),
    rgb,
    count: colors.reduce((sum, c) => {
      const dist = colorDistance(c.rgb, rgb);
      return dist < 50 ? sum + c.count : sum;
    }, 0),
  })).filter(c => c.count > 0);
}

/**
 * Apply color palette to SVG
 * Maps all colors to nearest color in new palette
 */
export function applyColorPalette(svgContent, currentColors, newPalette) {
  if (!svgContent || !currentColors || !newPalette) return svgContent;

  const colorMap = {};

  currentColors.forEach(oldColor => {
    // Find nearest color in new palette
    let minDist = Infinity;
    let nearestColor = newPalette[0];

    newPalette.forEach(newColor => {
      const dist = colorDistance(oldColor.rgb, newColor.rgb);
      if (dist < minDist) {
        minDist = dist;
        nearestColor = newColor;
      }
    });

    colorMap[oldColor.hex] = nearestColor.hex;
  });

  return replaceColorsInSVG(svgContent, colorMap);
}

