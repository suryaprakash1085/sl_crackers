import { getConnection } from '../lib/db.js';

async function addInvoiceNumber() {
  try {
    const connection = await getConnection();
    
    // Check if invoice_number column exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'orders' AND COLUMN_NAME = 'invoice_number'
    `);

    if (columns.length === 0) {
      // Add invoice_number column
      await connection.execute(`
        ALTER TABLE orders ADD COLUMN invoice_number VARCHAR(20) UNIQUE
      `);
      console.log('✓ invoice_number column added to orders table');

      // Generate invoice numbers for existing orders
      const [orders] = await connection.execute('SELECT id FROM orders WHERE invoice_number IS NULL');
      
      for (const order of orders) {
        const invoiceNumber = `invno_${String(order.id).padStart(8, '0')}`;
        await connection.execute(
          'UPDATE orders SET invoice_number = ? WHERE id = ?',
          [invoiceNumber, order.id]
        );
      }

      if (orders.length > 0) {
        console.log(`✓ Generated ${orders.length} invoice numbers for existing orders`);
      }
    } else {
      console.log('✓ invoice_number column already exists');
    }

    await connection.end();
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

addInvoiceNumber();
