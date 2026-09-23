import { getConnection } from '../lib/db.js';

async function checkSchema() {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute('DESCRIBE order_items');
    console.log('\nOrder Items table columns:');
    rows.forEach(row => {
      console.log(`  - ${row.Field} (${row.Type})`);
    });
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkSchema();
