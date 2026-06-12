'use client';

/**
 * Client-side avatar compression — the profile photo never leaves the browser
 * at full size. Center-crops to a square, downscales to 192px, and walks JPEG
 * quality down until the data URL fits the server's cap, so a 12MB phone
 * photo becomes a ~10–25KB payload. No upload service, no storage bill.
 */
const TARGET_PX = 192;
const MAX_DATA_URL_CHARS = 60_000; // well under the server's 90k cap

export async function compressAvatar(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file.');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Could not read that image.'));
      i.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = TARGET_PX;
    canvas.height = TARGET_PX;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Image processing unavailable in this browser.');
    // Center-crop the largest square, then scale down.
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    ctx.drawImage(
      img,
      (img.naturalWidth - side) / 2,
      (img.naturalHeight - side) / 2,
      side,
      side,
      0,
      0,
      TARGET_PX,
      TARGET_PX,
    );
    for (const q of [0.82, 0.7, 0.58, 0.45, 0.35]) {
      const data = canvas.toDataURL('image/jpeg', q);
      if (data.length <= MAX_DATA_URL_CHARS) return data;
    }
    throw new Error('Could not compress that image enough — try a simpler photo.');
  } finally {
    URL.revokeObjectURL(url);
  }
}
