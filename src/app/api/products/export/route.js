import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getConnection } from '@/lib/db';

export async function GET() {
  let connection;
  try {
    connection = await getConnection();

    const [products] = await connection.execute('SELECT id, name, price, price_80, description, category, quantity FROM products ORDER BY created_at DESC');

    // Remove base64 images and convert to Excel-friendly format
    const exportData = products.map(product => ({
      ID: product.id,
      Name: product.name,
      Price: product.price,
      '75%price': product.price_80 ?? Number(product.price) * 0.8,
      Description: product.description || '',
      Category: product.category || '',
      Quantity: product.quantity || 0
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const columnWidths = [
      { wch: 8 },  // ID
      { wch: 25 }, // Name
      { wch: 12 }, // Price
      { wch: 12 }, // 75% Price
      { wch: 30 }, // Description
      { wch: 15 }, // Category
      { wch: 10 }  // Quantity
    ];
    worksheet['!cols'] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    // Set response headers for file download
    return new NextResponse(Buffer.from(excelBuffer), {
      status: 200,
      headers: {
        'Content-Disposition': 'attachment; filename="products.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export products' }, { status: 500 });
  } finally {
    if (connection) await connection.end().catch(() => {});
  }
}
