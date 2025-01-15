import { Blob } from 'buffer';

const MAX_WIDTH = 1200;
const MAX_FILE_SIZE = 500 * 1024; // 500KB
const QUALITY = 0.8;

export async function optimizeImage(file: File): Promise<File> {
  // Return original file if it's not an image
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // If file is already small enough, return it
  if (file.size <= MAX_FILE_SIZE) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions
      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw image on canvas
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Create new file from blob
              const optimizedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(optimizedFile);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          'image/jpeg',
          QUALITY
        );
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load image
    img.src = URL.createObjectURL(file);
  });
}