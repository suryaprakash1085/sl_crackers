import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export async function GET(request) {
  let connection;
  try {
    connection = await getConnection();

    // Get total orders count
    const [orders] = await connection.execute('SELECT COUNT(*) as count FROM orders');
    const totalOrders = orders[0].count;

    // Get unique customers count
    const [customers] = await connection.execute(
      'SELECT COUNT(DISTINCT email) as count FROM orders WHERE email IS NOT NULL AND email != ""'
    );
    const totalCustomers = customers[0].count;

    // Get total revenue from orders
    const [revenue] = await connection.execute(
      'SELECT COALESCE(SUM(total_amount), 0) as total FROM orders'
    );
    const totalRevenue = parseFloat(revenue[0].total) || 0;

    // Get top 5 selling products
    const [topProducts] = await connection.execute(
      `SELECT
        product_name,
        SUM(quantity) as total_quantity,
        AVG(price) as avg_price,
        COUNT(DISTINCT order_id) as sold_in_orders
      FROM order_items
      GROUP BY product_name
      ORDER BY total_quantity DESC
      LIMIT 5`
    );

    const topSellingProducts = topProducts.map(product => ({
      name: product.product_name,
      totalQuantity: product.total_quantity,
      avgPrice: parseFloat(product.avg_price).toFixed(2),
      soldInOrders: product.sold_in_orders
    }));

    return NextResponse.json({
      totalOrders,
      totalCustomers,
      totalRevenue,
      topSellingProducts
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return NextResponse.json(
      { error: `Failed to fetch dashboard metrics: ${error.message}` },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end().catch(() => {});
  }
}
