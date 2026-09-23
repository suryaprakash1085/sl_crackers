import { getConnection } from '../lib/db.js';

async function addPaymentStatusColumn() {
  try {
    console.log('\n=== Adding payment_status Column ===\n');

    const connection = await getConnection();

    // Check if column already exists
    const query1 = 'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ? AND COLUMN_NAME = ?';
    const [columns] = await connection.execute(query1, ['orders', 'payment_status']);

    if (columns.length > 0) {
      console.log('✓ payment_status column already exists');
      await connection.end();
      return;
    }

    console.log('Adding payment_status column to orders table...');
    const query2 = 'ALTER TABLE orders ADD COLUMN payment_status VARCHAR(50) DEFAULT ? AFTER status';
    await connection.execute(query2, ['Unpaid']);
    console.log('✓ payment_status column added successfully');

    // Verify the column was added
    const [columns2] = await connection.execute(query1, ['orders', 'payment_status']);
    if (columns2.length > 0) {
      console.log('✓ Column verification successful');
    }

    await connection.end();
    console.log('\n✓ Migration completed successfully!\n');

  } catch (error) {
    console.error('\n✗ Migration failed:');
    console.error(error.message);
    process.exit(1);
  }
}

addPaymentStatusColumn();
