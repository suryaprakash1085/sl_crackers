import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export async function GET(request) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('search');

    connection = await getConnection();

    if (searchQuery) {
      // Search customers by name or phone
      const searchTerm = `%${searchQuery}%`;
      const [customers] = await connection.execute(
        `SELECT 
          customer_name,
          phone,
          email,
          COUNT(*) as total_orders,
          SUM(total_amount) as total_spent,
          MAX(created_at) as last_order_date
        FROM orders 
        WHERE customer_name LIKE ? OR phone LIKE ?
        GROUP BY phone
        ORDER BY total_spent DESC`,
        [searchTerm, searchTerm]
      );

      return NextResponse.json(customers);
    } else {
      // Fetch all unique customers
      const [customers] = await connection.execute(
        `SELECT 
          customer_name,
          phone,
          email,
          COUNT(*) as total_orders,
          SUM(total_amount) as total_spent,
          MAX(created_at) as last_order_date
        FROM orders 
        GROUP BY phone
        ORDER BY total_spent DESC`
      );

      return NextResponse.json(customers);
    }
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: `Failed to fetch customers: ${error.message}` }, { status: 500 });
  } finally {
    if (connection) await connection.end().catch(() => {});
  }
}
