import { getConnection, getPool } from '../lib/db.js';

async function migrateOrderId() {
  let connection;
  try {
    connection = await getConnection();
    const [columns] = await connection.execute(
      "SELECT EXTRA FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'id'"
    );

    if (columns.length === 0) {
      throw new Error('The orders.id column was not found');
    }

    const [primaryIndex] = await connection.execute("SHOW INDEX FROM orders WHERE Key_name = 'PRIMARY'");
    if (primaryIndex.length === 0) {
      const [[idCounts]] = await connection.execute(
        'SELECT COUNT(*) AS total, COUNT(id) AS nonNullIds, COUNT(DISTINCT id) AS distinctIds FROM orders'
      );
      if (Number(idCounts.total) !== Number(idCounts.distinctIds)) {
        throw new Error('Duplicate or null order IDs must be resolved before adding the primary key');
      }
      await connection.execute('ALTER TABLE orders ADD PRIMARY KEY (id)');
    } else if (primaryIndex.length !== 1 || primaryIndex[0].Column_name !== 'id') {
      throw new Error('The orders table has an unexpected primary key');
    }

    if (!String(columns[0].EXTRA).includes('auto_increment')) {
      await connection.execute('ALTER TABLE orders MODIFY id INT NOT NULL AUTO_INCREMENT');
    }

    console.log('Orders.id is configured to auto-increment.');
  } catch (error) {
    console.error('Error migrating orders.id:', error.message);
    process.exitCode = 1;
  } finally {
    if (connection) await connection.end();
    await getPool().end();
  }
}

migrateOrderId();
