import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getConnection } from '@/lib/db';

export async function POST(request) {
  let connection;
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read Excel file
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'No data found in Excel file' }, { status: 400 });
    }

    connection = await getConnection();

    // Get existing product names for duplicate detection
    const [existingProducts] = await connection.execute('SELECT name FROM products');
    const existingProductNames = new Set(existingProducts.map(p => p.name.toLowerCase()));

    let successCount = 0;
    let errorCount = 0;
    let duplicateCount = 0;
    const errors = [];
    const duplicates = [];

    // Process each row
    for (let i = 0; i < data.length; i++) {
      try {
        const row = data[i];
        const name = row.Name || row.name;
        const price = parseFloat(row.Price || row.price);
        const price80Value = row['75%price'] ?? row['75% Price'] ?? row['Price 75%'] ?? row.Price80 ?? row.price80 ?? row.price_80;
        const price80 = price80Value === undefined || price80Value === ''
          ? price * 0.8
          : parseFloat(price80Value);
        const description = row.Description || row.description || '';
        const category = row.Category || row.category || '';
        const quantity = parseInt(row.Quantity || row.quantity || 0);

        // Validation
        if (!name || isNaN(price) || price < 0 || isNaN(price80) || price80 < 0) {
          errorCount++;
          errors.push(`Row ${i + 2}: Invalid name or price`);
          continue;
        }

        // Check for duplicates
        if (existingProductNames.has(name.toLowerCase())) {
          duplicateCount++;
          duplicates.push(`Row ${i + 2}: "${name}" (already exists in database)`);
          continue;
        }

        // Insert product
        const query = 'INSERT INTO products (name, price, price_80, description, category, quantity) VALUES (?, ?, ?, ?, ?, ?)';
        await connection.execute(query, [name, price, price80, description, category, quantity]);
        successCount++;

        // Add to existing products set to catch duplicates within the import file
        existingProductNames.add(name.toLowerCase());
      } catch (rowError) {
        errorCount++;
        errors.push(`Row ${i + 2}: ${rowError.message}`);
      }
    }

    return NextResponse.json({
      message: 'Import completed',
      successCount,
      errorCount,
      duplicateCount,
      errors: errors.length > 0 ? errors : undefined,
      duplicates: duplicates.length > 0 ? duplicates : undefined
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Failed to import products' }, { status: 500 });
  } finally {
    if (connection) await connection.end().catch(() => {});
  }
}
