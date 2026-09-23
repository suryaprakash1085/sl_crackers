import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export async function GET(request) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    connection = await getConnection();

    // Try to match by order ID first (if it's a number)
    let orderData = null;
    let orderItems = null;

    const orderId = parseInt(query);
    if (!isNaN(orderId)) {
      const [results] = await connection.execute(
        'SELECT * FROM orders WHERE id = ?',
        [orderId]
      );
      if (results.length > 0) {
        orderData = results[0];
      }
    }

    // If not found by ID, try by phone number
    if (!orderData) {
      const [results] = await connection.execute(
        'SELECT * FROM orders WHERE phone = ? ORDER BY created_at DESC LIMIT 1',
        [query]
      );
      if (results.length > 0) {
        orderData = results[0];
      }
    }

    if (!orderData) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Fetch order items
    const [items] = await connection.execute(
      'SELECT * FROM order_items WHERE order_id = ?',
      [orderData.id]
    );

    return NextResponse.json({
      order: orderData,
      items: items || []
    });
  } catch (error) {
    console.error('Error tracking order:', error);
    return NextResponse.json({ error: `Failed to track order: ${error.message}` }, { status: 500 });
  } finally {
    if (connection) await connection.end().catch(() => {});
  }
}
