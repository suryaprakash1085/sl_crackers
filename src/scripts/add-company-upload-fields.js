import { getConnection } from '../lib/db.js';

async function addCompanyUploadFields() {
  const connection = await getConnection();

  try {
    const [columns] = await connection.execute('DESCRIBE company_info');
    const existingColumns = new Set(columns.map((column) => column.Field));

    if (!existingColumns.has('logo')) {
      await connection.execute('ALTER TABLE company_info ADD COLUMN logo LONGTEXT');
    }

    if (!existingColumns.has('price_list_pdf')) {
      await connection.execute('ALTER TABLE company_info ADD COLUMN price_list_pdf LONGTEXT');
    }
  } finally {
    await connection.end();
  }
}

addCompanyUploadFields().catch((error) => {
  console.error('Unable to add company upload fields:', error);
  process.exitCode = 1;
});
