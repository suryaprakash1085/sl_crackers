import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export async function GET(request, { params: paramsPromise }) {
  let connection;
  try {
    const params = paramsPromise instanceof Promise ? await paramsPromise : paramsPromise;
    const id = params?.id;

    if (!id) {
      return NextResponse.json({ error: 'Section ID is required' }, { status: 400 });
    }

    const sectionId = parseInt(id, 10);

    if (isNaN(sectionId)) {
      return NextResponse.json({ error: 'Invalid section ID' }, { status: 400 });
    }

    connection = await getConnection();

    const [sections] = await connection.execute(
      'SELECT * FROM product_sections WHERE id = ?',
      [sectionId]
    );

    if (sections.length === 0) {
      await connection.end();
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    const section = sections[0];
    const [products] = await connection.execute(
      `SELECT p.* FROM products p
       INNER JOIN section_products sp ON p.id = sp.product_id
       WHERE sp.section_id = ?
       ORDER BY sp.display_order ASC`,
      [sectionId]
    );

    await connection.end();

    return NextResponse.json({
      ...section,
      products: products || [],
    });
  } catch (error) {
    console.error('Error fetching section:', error.message);
    if (connection) {
      try {
        await connection.end();
      } catch (e) {
        console.error('Error closing connection:', e);
      }
    }
    return NextResponse.json({ error: `Failed to fetch section: ${error.message}` }, { status: 500 });
  }
}

export async function PUT(request, { params: paramsPromise }) {
  let connection;
  try {
    const params = paramsPromise instanceof Promise ? await paramsPromise : paramsPromise;
    const id = params?.id;

    if (!id) {
      return NextResponse.json({ error: 'Section ID is required' }, { status: 400 });
    }

    const { title, displayOrder } = await request.json();

    const sectionId = parseInt(id, 10);
    if (isNaN(sectionId)) {
      return NextResponse.json({ error: 'Invalid section ID' }, { status: 400 });
    }

    connection = await getConnection();

    await connection.execute(
      'UPDATE product_sections SET title = ?, display_order = ? WHERE id = ?',
      [title, displayOrder || 0, sectionId]
    );

    const [updatedSection] = await connection.execute(
      'SELECT * FROM product_sections WHERE id = ?',
      [sectionId]
    );

    if (updatedSection.length === 0) {
      await connection.end();
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    const [products] = await connection.execute(
      `SELECT p.* FROM products p
       INNER JOIN section_products sp ON p.id = sp.product_id
       WHERE sp.section_id = ?
       ORDER BY sp.display_order ASC`,
      [sectionId]
    );

    await connection.end();

    return NextResponse.json({
      ...updatedSection[0],
      products: products || [],
    });
  } catch (error) {
    console.error('Error updating section:', error.message);
    if (connection) {
      try {
        await connection.end();
      } catch (e) {
        console.error('Error closing connection:', e);
      }
    }
    return NextResponse.json({ error: `Failed to update section: ${error.message}` }, { status: 500 });
  }
}

export async function DELETE(request, { params: paramsPromise }) {
  let connection;
  try {
    const params = paramsPromise instanceof Promise ? await paramsPromise : paramsPromise;
    const id = params?.id;

    if (!id) {
      return NextResponse.json({ error: 'Section ID is required' }, { status: 400 });
    }

    const sectionId = parseInt(id, 10);
    if (isNaN(sectionId)) {
      return NextResponse.json({ error: 'Invalid section ID' }, { status: 400 });
    }

    connection = await getConnection();

    await connection.execute(
      'DELETE FROM product_sections WHERE id = ?',
      [sectionId]
    );

    await connection.end();

    return NextResponse.json({ message: 'Section deleted successfully' });
  } catch (error) {
    console.error('Error deleting section:', error.message);
    if (connection) {
      try {
        await connection.end();
      } catch (e) {
        console.error('Error closing connection:', e);
      }
    }
    return NextResponse.json({ error: `Failed to delete section: ${error.message}` }, { status: 500 });
  }
}
