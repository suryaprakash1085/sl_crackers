import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export async function POST(request, { params: paramsPromise }) {
  let connection;
  try {
    // Await params if it's a promise (Next.js 15+)
    const params = paramsPromise instanceof Promise ? await paramsPromise : paramsPromise;
    let id = params?.id;

    // If params.id is not available, try extracting from URL
    if (!id) {
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/');
      // URL format: /api/sections/[id]/products
      const sectionsIndex = pathParts.indexOf('sections');
      if (sectionsIndex !== -1 && sectionsIndex + 1 < pathParts.length) {
        id = pathParts[sectionsIndex + 1];
      }
    }

    const { productIds } = await request.json();

    console.log('POST /api/sections/[id]/products - id:', id, 'productIds:', productIds, 'params:', params);

    if (!id) {
      console.error('Error: Section ID not found in params or URL');
      return NextResponse.json({ error: 'Section ID is required' }, { status: 400 });
    }

    if (!Array.isArray(productIds)) {
      return NextResponse.json({ error: 'Product IDs must be an array' }, { status: 400 });
    }

    const sectionId = parseInt(id, 10);
    if (isNaN(sectionId)) {
      return NextResponse.json({ error: 'Invalid section ID' }, { status: 400 });
    }

    connection = await getConnection();

    // First, clear existing products for this section
    await connection.execute(
      'DELETE FROM section_products WHERE section_id = ?',
      [sectionId]
    );

    // Insert new products with display order
    if (productIds.length > 0) {
      for (let i = 0; i < productIds.length; i++) {
        const productId = parseInt(productIds[i], 10);
        if (isNaN(productId)) {
          throw new Error(`Invalid product ID at index ${i}: ${productIds[i]}`);
        }
        console.log(`Inserting product ${productId} into section ${sectionId} at order ${i}`);
        await connection.execute(
          'INSERT INTO section_products (section_id, product_id, display_order) VALUES (?, ?, ?)',
          [sectionId, productId, i]
        );
      }
    }

    // Fetch updated products
    const [products] = await connection.execute(
      `SELECT p.* FROM products p
       INNER JOIN section_products sp ON p.id = sp.product_id
       WHERE sp.section_id = ?
       ORDER BY sp.display_order ASC`,
      [sectionId]
    );

    await connection.end();

    console.log(`Successfully saved ${productIds.length} products to section ${sectionId}`);
    return NextResponse.json({
      message: 'Products updated successfully',
      products: products || [],
    });
  } catch (error) {
    console.error('Error updating section products:', error.message);
    console.error('Full error:', error);
    if (connection) {
      try {
        await connection.end();
      } catch (e) {
        console.error('Error closing connection:', e);
      }
    }
    return NextResponse.json({ error: `Failed to update section products: ${error.message}` }, { status: 500 });
  }
}

export async function DELETE(request, { params: paramsPromise }) {
  let connection;
  try {
    // Await params if it's a promise (Next.js 15+)
    const params = paramsPromise instanceof Promise ? await paramsPromise : paramsPromise;
    let id = params?.id;

    // If params.id is not available, try extracting from URL
    if (!id) {
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/');
      const sectionsIndex = pathParts.indexOf('sections');
      if (sectionsIndex !== -1 && sectionsIndex + 1 < pathParts.length) {
        id = pathParts[sectionsIndex + 1];
      }
    }

    const { searchParams } = new URL(request.url);
    const productIdStr = searchParams.get('productId');

    if (!productIdStr) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const sectionId = parseInt(id, 10);
    const productId = parseInt(productIdStr, 10);

    if (isNaN(sectionId) || isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid section or product ID' }, { status: 400 });
    }

    connection = await getConnection();

    await connection.execute(
      'DELETE FROM section_products WHERE section_id = ? AND product_id = ?',
      [sectionId, productId]
    );

    // Fetch remaining products
    const [products] = await connection.execute(
      `SELECT p.* FROM products p
       INNER JOIN section_products sp ON p.id = sp.product_id
       WHERE sp.section_id = ?
       ORDER BY sp.display_order ASC`,
      [sectionId]
    );

    await connection.end();

    return NextResponse.json({
      message: 'Product removed successfully',
      products: products || [],
    });
  } catch (error) {
    console.error('Error removing product from section:', error.message);
    console.error('Full error:', error);
    if (connection) {
      try {
        await connection.end();
      } catch (e) {
        console.error('Error closing connection:', e);
      }
    }
    return NextResponse.json({ error: `Failed to remove product: ${error.message}` }, { status: 500 });
  }
}
