import { getConnection } from '../lib/db.js';

async function migrateOrderStatus() {
  try {
    const connection = await getConnection();
    
    // Update existing status values to match new tracking statuses
    // Map old values to new ones
    const statusMappings = [
      { old: 'Pending', new: 'not packing' },
      { old: 'Completed', new: 'delivered' },
      { old: 'Cancelled', new: 'not packing' }
    ];

    for (const mapping of statusMappings) {
      await connection.execute(
        'UPDATE orders SET status = ? WHERE status = ?',
        [mapping.new, mapping.old]
      );
      console.log(`✓ Migrated status: ${mapping.old} → ${mapping.new}`);
    }

    // Set any NULL or empty status values to 'not packing'
    await connection.execute(
      "UPDATE orders SET status = 'not packing' WHERE status IS NULL OR status = ''"
    );
    console.log('✓ Set default status for any NULL/empty values');

    await connection.end();
    console.log('\n✓ Order status migration completed successfully!');
  } catch (error) {
    console.error('✗ Error migrating order status:', error);
    process.exit(1);
  }
}

migrateOrderStatus();
