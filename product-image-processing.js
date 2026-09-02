/* Product-only image processing. Branding and cover assets intentionally bypass this helper. */
(function (global) {
  'use strict';
  const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  function decodeWithImage(file) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const url = URL.createObjectURL(file);
      image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
      image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('تعذر قراءة ملف الصورة.')); };
      image.src = url;
    });
  }
  function decode(file) {
    if (global.createImageBitmap) return global.createImageBitmap(file).catch(() => decodeWithImage(file));
    return decodeWithImage(file);
  }
  async function optimizeProductImage(file) {
    const extension = String(file?.name || '').toLowerCase().split('.').pop();
    const type = file?.type === 'image/jpg' ? 'image/jpeg' : file?.type;
    if (!file || (!TYPES.includes(type) && !['jpg', 'jpeg', 'png', 'webp'].includes(extension))) throw new Error('الصيغة غير مدعومة. استخدم JPG أو PNG أو WebP.');
    if (file.size > 10 * 1024 * 1024) throw new Error('حجم صورة المنتج يجب أن يكون أقل من 10MB.');
    const image = await decode(file);
    const width = image.width, height = image.height;
    if (!width || !height) throw new Error('ملف الصورة غير صالح أو بلا أبعاد.');
    const size = Math.min(1200, Math.max(width, height));
    const side = Math.min(width, height);
    const sx = (width - side) / 2, sy = (height - side) / 2;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const context = canvas.getContext('2d', { alpha: true });
    context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'high';
    context.drawImage(image, sx, sy, side, side, 0, 0, size, size);
    if (typeof image.close === 'function') image.close();
    let blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 0.86));
    let outputType = 'image/webp';
    if (!blob) { blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.86)); outputType = 'image/jpeg'; }
    if (!blob) throw new Error('تعذر تجهيز الصورة للرفع.');
    const base = (file.name || 'product-image').replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9._-]/g, '') || 'product-image';
    return new File([blob], `${base}.${outputType === 'image/webp' ? 'webp' : 'jpg'}`, { type: outputType, lastModified: Date.now() });
  }
  global.optimizeProductImage = optimizeProductImage;
})(window);
