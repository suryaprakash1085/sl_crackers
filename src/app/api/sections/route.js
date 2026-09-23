import { NextResponse } from 'next/server';
import { getConnection, getPool } from '@/lib/db';

const defaultImage = '/window.svg';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const imageSize = searchParams.get('imageSize') === 'thumb' || searchParams.get('imageSize') === 'card'
    ? searchParams.get('imageSize')
    : 'full';
  let connection;
  try {
    connection = getPool();
    const [rows] = await connection.execute(
      `SELECT s.id AS section_id, s.title, s.display_order AS section_display_order,
              p.id, p.name, p.price, p.price_80, p.description, p.category,
              p.quantity, p.image IS NOT NULL AS has_image,
              UNIX_TIMESTAMP(p.updated_at) AS image_version,
              sp.display_order AS product_display_order
       FROM product_sections s
       LEFT JOIN section_products sp ON s.id = sp.section_id
       LEFT JOIN products p ON p.id = sp.product_id
       ORDER BY s.display_order ASC, sp.display_order ASC`
    );

    const sectionsById = new Map();
    rows.forEach((row) => {
      if (!sectionsById.has(row.section_id)) {
        sectionsById.set(row.section_id, {
          id: row.section_id,
          title: row.title,
          display_order: row.section_display_order,
          products: [],
        });
      }

      if (row.id !== null) {
        sectionsById.get(row.section_id).products.push({
          id: row.id,
          name: row.name,
          price: row.price,
          price_80: row.price_80,
          description: row.description,
          category: row.category,
          quantity: row.quantity,
          image: row.has_image
            ? `/api/products/${row.id}?v=${row.image_version}${imageSize === 'full' ? '' : `&size=${imageSize}`}`
            : defaultImage,
        });
      }
    });

    const sectionsWithProducts = [...sectionsById.values()];

    return NextResponse.json(sectionsWithProducts, {
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (error) {
    console.error('Error fetching sections:', error.message);
    return NextResponse.json({ error: `Failed to fetch sections: ${error.message}` }, { status: 500 });
  }
}

export async function POST(request) {
  let connection;
  try {
    const { title, displayOrder = 0 } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    connection = await getConnection();
    const [result] = await connection.execute(
      'INSERT INTO product_sections (title, display_order) VALUES (?, ?)',
      [title, displayOrder]
    );

    const [newSection] = await connection.execute(
      'SELECT * FROM product_sections WHERE id = ?',
      [result.insertId]
    );

    await connection.end();

    return NextResponse.json(
      { ...newSection[0], products: [] },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating section:', error.message);
    if (connection) {
      try {
        await connection.end();
      } catch (e) {
        console.error('Error closing connection:', e);
      }
    }
    return NextResponse.json({ error: `Failed to create section: ${error.message}` }, { status: 500 });
  }
}
