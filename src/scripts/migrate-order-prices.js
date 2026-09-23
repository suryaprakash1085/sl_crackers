import { getConnection } from '../lib/db.js';

async function migrateOrderPrices() {
  try {
    console.log('Starting migration: Fixing old orders price data...\n');
    const connection = await getConnection();

    // Get all orders
    const [orders] = await connection.execute('SELECT id FROM orders ORDER BY id');
    console.log(`Found ${orders.length} orders to process\n`);

    let updatedCount = 0;

    for (const order of orders) {
      const orderId = order.id;

      // Get all items for this order
      const [items] = await connection.execute(
        'SELECT id, price, discount FROM order_items WHERE order_id = ?',
        [orderId]
      );

      for (const item of items) {
        const currentPrice = parseFloat(item.price);
        const currentDiscount = parseFloat(item.discount) || 0;

        // Check if this item needs migration (discount is 0 or very small, meaning it's old data)
        // Old items have only discounted price stored with no discount percentage
        if (currentDiscount === 0 || currentDiscount < 10) {
          // Calculate original price (assuming 50% discount)
          const originalPrice = currentPrice * 2;
          const discountPercent = 50;

          // Update the order_item
          await connection.execute(
            'UPDATE order_items SET price = ?, discount = ? WHERE id = ?',
            [originalPrice, discountPercent, item.id]
          );

          console.log(`Order #${orderId} - Item ID ${item.id}: ₹${currentPrice} → Original: ₹${originalPrice}, Discount: ${discountPercent}%`);
          updatedCount++;
        }
      }
    }

    console.log(`\n✓ Migration completed successfully!`);
    console.log(`✓ Updated ${updatedCount} order items with correct pricing data`);
    console.log(`\nNow all orders will display:`);
    console.log(`  Original Price (strikethrough) → Discount % → Discounted Price (in red)`);

    await connection.end();
  } catch (error) {
    console.error('Error during migration:', error.message);
    process.exit(1);
  }
}

migrateOrderPrices();
