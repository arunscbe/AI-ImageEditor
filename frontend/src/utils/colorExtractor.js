export const extractColorsFromImage = (fabricImage, numColors = 8) => {
  if (!fabricImage || !fabricImage._element) {
    return [];
  }

  const img = fabricImage._element;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const maxDimension = 150;
  const scale = Math.min(maxDimension / img.width, maxDimension / img.height);
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  const colorMap = new Map();

  for (let i = 0; i < pixels.length; i += 4) {
    const r = Math.round(pixels[i] / 25) * 25;
    const g = Math.round(pixels[i + 1] / 25) * 25;
    const b = Math.round(pixels[i + 2] / 25) * 25;
    const a = pixels[i + 3];

    if (a < 128) continue;

    const key = `${r},${g},${b}`;
    colorMap.set(key, (colorMap.get(key) || 0) + 1);
  }

  const totalPixels = (canvas.width * canvas.height);
  const minThreshold = totalPixels * 0.002;

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

export const replaceColorInImage = (fabricImage, fromColor, toColor, tolerance = 40) => {
  if (!fabricImage || !fabricImage._element) {
    return;
  }

  const img = fabricImage._element;
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
  fabricImage.setSrc(newDataUrl, () => {
    fabricImage.canvas?.renderAll();
  });
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

