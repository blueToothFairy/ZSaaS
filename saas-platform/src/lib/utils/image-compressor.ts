import imageCompression from 'browser-image-compression';

/**
 * Compress an image file to a target size (default 500KB)
 * @param file - The image file to compress
 * @param targetSizeKB - Target size in kilobytes (default 500)
 * @returns Promise<File> - Compressed image file
 */
export async function compressImage(
  file: File,
  targetSizeKB: number = 500
): Promise<File> {
  const options = {
    maxSizeMB: targetSizeKB / 1024,
    maxWidthOrHeight: 1920,
    useWebWorker: true
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    return new File([compressedBlob], file.name, { type: compressedBlob.type });
  } catch (error) {
    throw new Error(`Failed to compress image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
