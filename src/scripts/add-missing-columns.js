import { getConnection } from '../lib/db.js';

async function addMissingColumns() {
  try {
    const connection = await getConnection();
    
    // Check and add invoice_number column to orders table
    try {
      const [columns] = await connection.execute(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='orders' AND COLUMN_NAME='invoice_number'"
      );
      
      if (columns.length === 0) {
        await connection.execute(
          'ALTER TABLE orders ADD COLUMN invoice_number VARCHAR(50)'
        );
        console.log('✓ Added invoice_number column to orders table');
      } else {
        console.log('✓ invoice_number column already exists in orders table');
      }
    } catch (error) {
      console.log('Info: Could not check/add invoice_number column:', error.message);
    }

    // Check and add discount column to order_items table
    try {
      const [columns] = await connection.execute(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='order_items' AND COLUMN_NAME='discount'"
      );
      
      if (columns.length === 0) {
        await connection.execute(
          'ALTER TABLE order_items ADD COLUMN discount DECIMAL(5, 2) DEFAULT 0'
        );
        console.log('✓ Added discount column to order_items table');
      } else {
        console.log('✓ discount column already exists in order_items table');
      }
    } catch (error) {
      console.log('Info: Could not check/add discount column:', error.message);
    }

    await connection.end();
    console.log('\n✓ Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

addMissingColumns();
