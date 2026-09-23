import { getConnection } from '../lib/db.js';

async function addColumn() {
  try {
    console.log('Adding payment_status column...');
    const connection = await getConnection();
    
    const query = 'ALTER TABLE orders ADD COLUMN payment_status VARCHAR(50) DEFAULT "Unpaid" AFTER status';
    await connection.execute(query);
    
    console.log('✓ Column added successfully');
    await connection.end();
  } catch (error) {
    if (error.message.includes('Duplicate')) {
      console.log('✓ Column already exists');
    } else {
      console.error('Error:', error.message);
    }
  }
}

addColumn();
