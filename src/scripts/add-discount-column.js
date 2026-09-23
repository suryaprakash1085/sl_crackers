import { getConnection } from '../lib/db.js';

async function addDiscountColumn() {
  try {
    console.log('Adding discount column to order_items...');
    const connection = await getConnection();
    
    const query = 'ALTER TABLE order_items ADD COLUMN discount DECIMAL(10, 2) DEFAULT 0 AFTER price';
    await connection.execute(query);
    
    console.log('✓ Discount column added successfully');
    await connection.end();
  } catch (error) {
    if (error.message.includes('Duplicate')) {
      console.log('✓ Discount column already exists');
    } else {
      console.error('Error:', error.message);
    }
  }
}

addDiscountColumn();
