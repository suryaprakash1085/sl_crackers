import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { getConnection, getPool } from '@/lib/db';
import sharp from 'sharp';

const CAROUSEL_DIR = join(process.cwd(), 'public', 'carousel');

async function prepareCarouselImage(input) {
  const base64Data = input.startsWith('data:') ? input.split(',')[1] : null;
  const source = base64Data
    ? Buffer.from(base64Data, 'base64')
    : Buffer.from(await (await fetch(input)).arrayBuffer());

  return sharp(source)
    .rotate()
    .resize({ width: 2400, height: 1200, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
    .toBuffer();
}

export async function GET() {
  try {
    const pool = getPool();
    const [images] = await pool.execute(
      'SELECT id, image_url, display_order, is_active FROM carousel_images WHERE is_active = true ORDER BY display_order ASC'
    );

    return NextResponse.json(images);
  } catch (error) {
    console.error('Error fetching carousel images:', error);
    return NextResponse.json({ error: 'Failed to fetch carousel images' }, { status: 500 });
  }
}

export async function POST(request) {
  let connection;
  try {
    const data = await request.json();
    let { imageUrl, displayOrder = 0 } = data;

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    // Create carousel directory if it doesn't exist
    await mkdir(CAROUSEL_DIR, { recursive: true });

    // Generate filename with timestamp
    const timestamp = Date.now();
    let filename, filepath, buffer, imageRelativePath;
    const isGif = imageUrl.toLowerCase().includes('data:image/gif') || imageUrl.toLowerCase().endsWith('.gif');

    if (isGif) {
      // Handle GIF files - preserve animation by saving as-is without conversion
      filename = `carousel-${timestamp}.gif`;
      filepath = join(CAROUSEL_DIR, filename);

      // Extract base64 data for GIFs
      let base64Data;
      if (imageUrl.startsWith('data:')) {
        base64Data = imageUrl.split(',')[1];
      } else {
        // If it's a URL, fetch and encode
        const response = await fetch(imageUrl);
        const arrayBuffer = await response.arrayBuffer();
        base64Data = Buffer.from(arrayBuffer).toString('base64');
      }

      buffer = Buffer.from(base64Data, 'base64');
    } else {
      // Preserve the banner aspect ratio and export at a high resolution.
      buffer = await prepareCarouselImage(imageUrl);
      filename = `carousel-${timestamp}.jpg`;
      filepath = join(CAROUSEL_DIR, filename);
    }

    imageRelativePath = `/carousel/${filename}`;
    await writeFile(filepath, buffer);

    connection = await getConnection();
    const query = 'INSERT INTO carousel_images (image_url, display_order) VALUES (?, ?)';
    const [result] = await connection.execute(query, [imageRelativePath, displayOrder]);
    return NextResponse.json({
      id: result.insertId,
      image_url: imageRelativePath,
      display_order: displayOrder,
      is_active: true,
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding carousel image:', error);
    return NextResponse.json({ error: 'Failed to add carousel image' }, { status: 500 });
  } finally {
    if (connection) await connection.end().catch(() => {});
  }
}
