const MAX_DIMENSION = 1000;
const TARGET_BYTES = 300 * 1024; // 300 KB
const MIN_QUALITY = 0.4;
const MIN_DIMENSION = 200;

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob returned null"));
      },
      "image/jpeg",
      quality
    );
  });
}

/**
 * Compresses an image file client-side to JPEG (<= 300 KB, max 1000px longest side).
 * Re-encoding through canvas automatically strips EXIF metadata (including GPS).
 */
export async function compressImageToJpeg(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });

  try {
    const longestSide = Math.max(bitmap.width, bitmap.height);
    let scale = longestSide > MAX_DIMENSION ? MAX_DIMENSION / longestSide : 1;
    let width = Math.max(1, Math.round(bitmap.width * scale));
    let height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not acquire 2D canvas context");
    }

    let bestBlob: Blob | null = null;

    while (true) {
      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(bitmap, 0, 0, width, height);

      for (let q = 0.8; q >= MIN_QUALITY - 0.001; q -= 0.1) {
        const quality = Math.max(MIN_QUALITY, Number(q.toFixed(2)));
        const blob = await canvasToJpegBlob(canvas, quality);
        bestBlob = blob;
        if (blob.size <= TARGET_BYTES) {
          return new File([blob], "photo.jpg", { type: "image/jpeg" });
        }
      }

      if (Math.max(width, height) <= MIN_DIMENSION) {
        break;
      }

      width = Math.max(MIN_DIMENSION, Math.round(width * 0.85));
      height = Math.max(MIN_DIMENSION, Math.round(height * 0.85));
    }

    if (!bestBlob) {
      throw new Error("Image compression failed");
    }

    return new File([bestBlob], "photo.jpg", { type: "image/jpeg" });
  } finally {
    bitmap.close();
  }
}
