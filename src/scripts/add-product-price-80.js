import { getConnection } from '../lib/db.js';

async function addProductPrice80() {
  const connection = await getConnection();

  try {
    const [columns] = await connection.execute(
      `SELECT COUNT(*) AS count
       FROM information_schema.columns
       WHERE table_schema = DATABASE()
         AND table_name = 'products'
         AND column_name = 'price_80'`
    );

    if (columns[0].count === 0) {
      await connection.execute('ALTER TABLE products ADD COLUMN price_80 DECIMAL(10, 2)');
      console.log('Added products.price_80');
    } else {
      console.log('products.price_80 already exists');
    }

    await connection.execute(
      'UPDATE products SET price_80 = ROUND(price * 0.8, 2) WHERE price_80 IS NULL'
    );
    console.log('Backfilled missing 80% prices');
  } finally {
    await connection.end();
  }
}

addProductPrice80().catch((error) => {
  console.error('Failed to add products.price_80:', error);
  process.exitCode = 1;
});
