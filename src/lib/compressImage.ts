export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeMB?: number;
}

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<{ file: File; originalSize: number; compressedSize: number }> {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.8,
    maxSizeMB = 1,
  } = options;

  if (!file.type.startsWith('image/')) {
    throw new Error('الملف ليس صورة');
  }

  const originalSize = file.size;
  let targetQuality = quality;
  let resultFile: File = file;
  
  // Convert File to HTMLImageElement
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    const objUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objUrl);
      reject(new Error('فشل قراءة الصورة'));
    };
    img.src = objUrl;
  });

  // Calculate new dimensions
  let width = image.width;
  let height = image.height;

  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.floor(width * ratio);
    height = Math.floor(height * ratio);
  }

  // We use WebP which supports transparency and has good compression
  const mimeType = 'image/webp';
  
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('فشل إنشاء بيئة الرسم');
  }

  // Draw image
  ctx.drawImage(image, 0, 0, width, height);

  // Compress loop
  const maxBytes = maxSizeMB * 1024 * 1024;
  let compressedBlob: Blob | null = null;
  let isDone = false;

  while (!isDone) {
    compressedBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), mimeType, targetQuality);
    });

    if (!compressedBlob) {
        throw new Error('فشل ضغط الصورة');
    }

    if (compressedBlob.size <= maxBytes || targetQuality <= 0.3) {
      isDone = true;
    } else {
      // Reduce quality and try again
      targetQuality -= 0.1;
    }
  }

  if (compressedBlob) {
     const ext = '.webp';
     const filename = file.name.replace(/\.[^/.]+$/, "") + ext;
     resultFile = new File([compressedBlob], filename, {
        type: mimeType,
        lastModified: Date.now(),
     });
     
     // If compression made it larger (rare for webp unless tiny image), keep original if we didn't resize
     // But wait, if we resized, we must use the new blob.
     // To be safe and consistent with format, we just use the compressed blob.
  }

  return {
    file: resultFile,
    originalSize,
    compressedSize: resultFile.size,
  };
}

export function formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
