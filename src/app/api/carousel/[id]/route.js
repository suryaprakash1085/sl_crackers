import { NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { getConnection } from '@/lib/db';

export async function DELETE(request, { params }) {
  let connection;
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    connection = await getConnection();

    // First get the image to retrieve the file path
    const [checkImage] = await connection.execute('SELECT image_url FROM carousel_images WHERE id = ?', [id]);

    if (checkImage.length === 0) {
      return NextResponse.json({ error: 'Image not found in database' }, { status: 404 });
    }

    const imageUrl = checkImage[0].image_url;

    // Delete from database
    const [result] = await connection.execute('DELETE FROM carousel_images WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Failed to delete image - database error' }, { status: 500 });
    }

    // Delete file from filesystem if it's a local path
    if (imageUrl && imageUrl.startsWith('/carousel/')) {
      try {
        const filename = imageUrl.replace('/carousel/', '');
        const filepath = join(process.cwd(), 'public', 'carousel', filename);
        await unlink(filepath);
      } catch (fileError) {
        console.warn(`Warning: Could not delete file ${imageUrl}:`, fileError.message);
        // Don't fail the API call if file deletion fails
      }
    }

    return NextResponse.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting carousel image:', error);
    return NextResponse.json({ error: `Failed to delete carousel image: ${error.message}` }, { status: 500 });
  } finally {
    if (connection) await connection.end().catch(() => {});
  }
}
