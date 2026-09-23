import { getConnection } from '../lib/db.js';

const indexes = [
  ['products', 'idx_products_created_id', 'created_at, id'],
  ['product_sections', 'idx_product_sections_display_id', 'display_order, id'],
  ['section_products', 'idx_section_products_order_product', 'section_id, display_order, product_id'],
];

async function addCatalogIndexes() {
  const connection = await getConnection();

  try {
    for (const [table, name, columns] of indexes) {
      const [existing] = await connection.execute(
        `SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ? LIMIT 1`,
        [table, name]
      );

      if (existing.length === 0) {
        await connection.execute(`CREATE INDEX ${name} ON ${table} (${columns})`);
      }
    }
  } finally {
    await connection.end();
  }
}

addCatalogIndexes().catch((error) => {
  console.error('Unable to add catalog indexes:', error);
  process.exitCode = 1;
});
