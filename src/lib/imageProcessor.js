import sharp from 'sharp';

const DEFAULT_WIDTH = 500;
const DEFAULT_HEIGHT = 500;

export async function resizeAndConvertToBase64(input, mimeType = 'image/jpeg', width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT) {
  try {
    let buffer = input;

    // If input is base64 data URL, extract the buffer
    if (typeof input === 'string' && input.startsWith('data:')) {
      const base64String = input.split(',')[1];
      buffer = Buffer.from(base64String, 'base64');
    }

    // Resize image with 'contain' fit and transparent background
    const resizedBuffer = await sharp(buffer)
      .resize(width, height, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 } // transparent background
      })
      .webp({ quality: 82 })
      .toBuffer();

    const base64 = resizedBuffer.toString('base64');
    return `data:image/webp;base64,${base64}`;
  } catch (error) {
    console.error('Error resizing image:', error);
    throw new Error(`Failed to process image: ${error.message}`);
  }
}
