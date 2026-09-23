import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { getConnection, getPool } from '@/lib/db';
import { resizeAndConvertToBase64 } from '@/lib/imageProcessor';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const pool = getPool();
    const [products] = await pool.execute('SELECT image FROM products WHERE id = ?', [parseInt(id, 10)]);

    const image = products[0]?.image;
    if (!image || !image.startsWith('data:')) {
      return new Response('Image not found', { status: 404 });
    }

    const [metadata, encodedImage] = image.split(',');
    const originalContentType = metadata.match(/^data:(.*?);base64$/)?.[1] || 'image/png';
    let imageBuffer = Buffer.from(encodedImage, 'base64');
    let contentType = originalContentType;
    const size = new URL(request.url).searchParams.get('size');

    if (size === 'thumb' || size === 'card') {
      const dimension = size === 'thumb' ? 160 : 320;
      imageBuffer = await sharp(imageBuffer)
        .resize(dimension, size === 'thumb' ? 160 : 480, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      contentType = 'image/webp';
    }

    return new Response(imageBuffer, {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Type': contentType,
      },
    });
  } catch (error) {
    console.error('Error fetching product image:', error);
    return new Response('Failed to fetch product image', { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  let connection;
  try {
    const { id } = await params;

    console.log('DELETE request for product ID:', id);
    console.log('ID type:', typeof id);

    if (!id) {
      console.error('DELETE error: No ID provided in params');
      return NextResponse.json({ error: 'No product ID provided' }, { status: 400 });
    }

    const numId = parseInt(id, 10);
    console.log('Parsed numeric ID:', numId);

    if (isNaN(numId)) {
      console.error('DELETE error: Invalid ID format:', id);
      return NextResponse.json({ error: 'Invalid product ID format' }, { status: 400 });
    }

    connection = await getConnection();
    console.log('Database connected. Executing DELETE for ID:', numId);

    const [result] = await connection.execute('DELETE FROM products WHERE id = ?', [numId]);

    console.log('Delete query result:', result);
    console.log('Rows affected:', result.affectedRows);



    if (result.affectedRows === 0) {
      console.error('Product not found in database with ID:', numId);
      return NextResponse.json({ error: 'Product not found in database' }, { status: 404 });
    }

    console.log('Product deleted successfully from database');
    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/products/[id]:', error.message);
    console.error('Full error details:', error);
    return NextResponse.json({ error: `Failed to delete product: ${error.message}` }, { status: 500 });
  } finally {
    if (connection) await connection.end().catch(() => {});
  }
}

export async function PATCH(request, { params }) {
  let connection;
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'No product ID provided' }, { status: 400 });
    }

    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid product ID format' }, { status: 400 });
    }

    const contentType = request.headers.get('content-type');
    let name, price, price80, description, category, quantity, imageData = undefined;

    if (contentType && contentType.includes('application/json')) {
      // Handle JSON request (clearing image)
      const body = await request.json();
      if ('image' in body && body.image === null) {
        imageData = null;
      }
    } else {
      // Handle FormData request (full product update)
      const formData = await request.formData();
      name = formData.get('name');
      price = formData.get('price');
      price80 = formData.get('price_80');
      description = formData.get('description');
      category = formData.get('category');
      quantity = formData.get('quantity');
      const imageFile = formData.get('image');
      const removeImage = formData.get('remove_image') === 'true';

      if (imageFile && imageFile.size > 0) {
        const buffer = await imageFile.arrayBuffer();
        imageData = await resizeAndConvertToBase64(Buffer.from(buffer), imageFile.type);
      } else if (removeImage) {
        imageData = null;
      }
    }

    connection = await getConnection();

    // If updating entire product
    if (name || price || price80 !== undefined || description !== undefined || category !== undefined || quantity !== undefined) {
      if (!name || !price) {
        return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
      }

      const updates = [];
      const values = [];

      if (name) {
        updates.push('name = ?');
        values.push(name);
      }
      if (price) {
        updates.push('price = ?');
        values.push(price);
      }
      if (price80 !== undefined) {
        updates.push('price_80 = ?');
        values.push(price80 === '' ? Number(price) * 0.8 : price80);
      }
      if (description !== undefined) {
        updates.push('description = ?');
        values.push(description);
      }
      if (category !== undefined) {
        updates.push('category = ?');
        values.push(category);
      }
      if (quantity !== undefined) {
        updates.push('quantity = ?');
        values.push(quantity);
      }
      if (imageData !== undefined) {
        updates.push('image = ?');
        values.push(imageData);
      }

      values.push(numId);

      const query = `UPDATE products SET ${updates.join(', ')} WHERE id = ?`;
      const [result] = await connection.execute(query, values);

      if (result.affectedRows === 0) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: 'Product updated successfully' });
    }

    // If only clearing image via JSON
    if (imageData === null) {
      const [result] = await connection.execute(
        'UPDATE products SET image = NULL WHERE id = ?',
        [numId]
      );

      if (result.affectedRows === 0) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: 'Product image removed successfully' });
    }


    return NextResponse.json({ error: 'No update data provided' }, { status: 400 });
  } catch (error) {
    console.error('Error in PATCH /api/products/[id]:', error.message);
    return NextResponse.json({ error: `Failed to update product: ${error.message}` }, { status: 500 });
  } finally {
    if (connection) await connection.end().catch(() => {});
  }
}
