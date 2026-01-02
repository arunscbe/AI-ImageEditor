export const extractColorsFromImage = (fabricObject, numColors = 8) => {
  if (!fabricObject) {
    return [];
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
    // For vector objects (SVG, groups, paths, etc.)
    else {
      const maxDimension = 150;
      const objWidth = fabricObject.width * (fabricObject.scaleX || 1);
      const objHeight = fabricObject.height * (fabricObject.scaleY || 1);
      
      if (!objWidth || !objHeight) {
        console.warn('Object has no dimensions');
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
    console.error('Error extracting colors:', error);
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
  // Increase threshold to 0.5% to filter out tiny color variations
  const minThreshold = totalPixels * 0.005;

  const sortedColors = Array.from(colorMap.entries())
    .filter(([_, count]) => count > minThreshold)
    .sort((a, b) => b[1] - a[1])
    .slice(0, numColors)
    .map(([rgb, count]) => {
      const [r, g, b] = rgb.split(',').map(Number);
      return {
        rgb: `rgb(${r},${g},${b})`,
        hex: rgbToHex(r, g, b),
        count,
      };
    });

  return sortedColors;
};

const rgbToHex = (r, g, b) => {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
};

export const replaceColorInImage = (fabricObject, fromColor, toColor, tolerance = 60) => {
  if (!fabricObject) {
    return;
  }

  // For raster images
  if (fabricObject._element) {
    const img = fabricObject._element;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = img.width;
    canvas.height = img.height;

    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    const from = hexToRgb(fromColor);
    const to = hexToRgb(toColor);

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];

      const distance = Math.sqrt(
        Math.pow(r - from.r, 2) +
          Math.pow(g - from.g, 2) +
          Math.pow(b - from.b, 2)
      );

      if (distance <= tolerance) {
        pixels[i] = to.r;
        pixels[i + 1] = to.g;
        pixels[i + 2] = to.b;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    const newDataUrl = canvas.toDataURL();
    fabricObject.setSrc(newDataUrl, () => {
      fabricObject.canvas?.renderAll();
    });
  } 
  // For vector objects (SVG, groups, paths)
  else {
    const from = hexToRgb(fromColor);
    const to = hexToRgb(toColor);
    const toHex = toColor;

    // Helper to replace colors recursively
    const replaceInObject = (obj) => {
      // Handle fill color
      if (obj.fill && typeof obj.fill === 'string') {
        const fillRgb = hexToRgb(obj.fill);
        const distance = Math.sqrt(
          Math.pow(fillRgb.r - from.r, 2) +
          Math.pow(fillRgb.g - from.g, 2) +
          Math.pow(fillRgb.b - from.b, 2)
        );
        if (distance <= tolerance) {
          obj.set('fill', toHex);
        }
      }

      // Handle stroke color
      if (obj.stroke && typeof obj.stroke === 'string') {
        const strokeRgb = hexToRgb(obj.stroke);
        const distance = Math.sqrt(
          Math.pow(strokeRgb.r - from.r, 2) +
          Math.pow(strokeRgb.g - from.g, 2) +
          Math.pow(strokeRgb.b - from.b, 2)
        );
        if (distance <= tolerance) {
          obj.set('stroke', toHex);
        }
      }

      // Recursively handle groups
      if (obj.type === 'group' && obj._objects) {
        obj._objects.forEach(child => replaceInObject(child));
      }
    };

    replaceInObject(fabricObject);
    fabricObject.canvas?.renderAll();
  }
};

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
};

