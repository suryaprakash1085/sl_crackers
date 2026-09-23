import { NextResponse } from 'next/server';
import { getConnection, getPool } from '@/lib/db';
import { resizeAndConvertToBase64 } from '@/lib/imageProcessor';

const defaultImage = '/window.svg';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedLimit = Number.parseInt(searchParams.get('limit') || '', 10);
    const requestedOffset = Number.parseInt(searchParams.get('offset') || '0', 10);
    const paginated = Number.isInteger(requestedLimit) && requestedLimit > 0;
    const limit = Math.min(paginated ? requestedLimit : 100, 100);
    const offset = Math.max(Number.isInteger(requestedOffset) ? requestedOffset : 0, 0);
    const requestedCategory = searchParams.get('category')?.trim() || '';
    const fresh = searchParams.get('fresh') === '1';
    const imageSize = searchParams.get('imageSize') === 'thumb' || searchParams.get('imageSize') === 'card'
      ? searchParams.get('imageSize')
      : 'full';
    const categoryFilter = requestedCategory
      ? " WHERE UPPER(REPLACE(TRIM(category), ' ', '')) = UPPER(REPLACE(TRIM(?), ' ', ''))"
      : '';
    const paginationClause = paginated ? ` LIMIT ${limit} OFFSET ${offset}` : '';
    const pool = getPool();
    const query = `SELECT id, name, price, price_80, description, category, quantity,
                          image IS NOT NULL AS has_image, UNIX_TIMESTAMP(updated_at) AS image_version
                   FROM products${categoryFilter}
                   ORDER BY created_at DESC, id DESC${paginationClause}`;
    const queryParams = requestedCategory ? [requestedCategory] : [];
    const [products] = await pool.execute(query, queryParams);

    const productsWithImages = products.map(({ has_image, image_version, ...product }) => {
      const fullImage = has_image ? `/api/products/${product.id}?v=${image_version}` : defaultImage;
      return {
        ...product,
        image: imageSize === 'full' ? fullImage : (has_image ? `/api/products/${product.id}?v=${image_version}&size=${imageSize}` : defaultImage),
        ...(imageSize === 'full' ? {} : { image_full: fullImage }),
      };
    });
    const headers = fresh
      ? { 'Cache-Control': 'no-store' }
      : { 'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300' };

    if (!paginated) {
      return NextResponse.json(productsWithImages, { headers });
    }

    const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM products${categoryFilter}`, queryParams);
    return NextResponse.json({ products: productsWithImages, total, offset, limit }, { headers });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request) {
  let connection;
  try {
    const contentType = request.headers.get('content-type');
    let name, price, price80, description, category, quantity, imageData = null;

    if (contentType && contentType.includes('application/json')) {
      // Handle JSON request (from admin panel)
      const data = await request.json();
      name = data.name;
      price = data.price;
      price80 = data.price_80 ?? data.price80;
      description = data.description;
      category = data.category;
      quantity = data.quantity;
      imageData = data.image;
    } else {
      // Handle FormData request
      const formData = await request.formData();
      name = formData.get('name');
      price = formData.get('price');
      price80 = formData.get('price_80');
      description = formData.get('description');
      category = formData.get('category');
      quantity = formData.get('quantity');
      const imageFile = formData.get('image');

      if (imageFile && imageFile.size > 0) {
        const buffer = await imageFile.arrayBuffer();
        imageData = await resizeAndConvertToBase64(Buffer.from(buffer), imageFile.type);
      }
    }

    console.log('POST /api/products - Received data:', { name, price, description, category, quantity, hasImage: !!imageData });

    if (!name || !price) {
      console.error('Validation error: Missing name or price');
      return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
    }

    console.log('Connecting to database...');
    connection = await getConnection();
    console.log('Database connected. Executing INSERT...');

    const normalizedPrice80 = price80 === undefined || price80 === null || price80 === ''
      ? Number(price) * 0.8
      : price80;
    const query = 'INSERT INTO products (name, price, price_80, description, category, image, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const [result] = await connection.execute(query, [name, price, normalizedPrice80, description, category, imageData, quantity]);

    console.log('INSERT successful. ID:', result.insertId);
    return NextResponse.json({
      id: result.insertId,
      name,
      price,
      price_80: normalizedPrice80,
      description,
      category,
      image: imageData,
      quantity,
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding product:', error.message);
    console.error('Full error:', error);
    return NextResponse.json({ error: `Failed to add product: ${error.message}` }, { status: 500 });
  } finally {
    if (connection) await connection.end().catch(() => {});
  }
}
