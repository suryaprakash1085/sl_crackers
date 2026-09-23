import { getConnection } from '../lib/db.js';

async function addPriceListPdfField() {
  try {
    const connection = await getConnection();
    const [columns] = await connection.execute('DESCRIBE company_info');

    if (!columns.some((column) => column.Field === 'price_list_pdf')) {
      await connection.execute('ALTER TABLE company_info ADD COLUMN price_list_pdf LONGTEXT');
      console.log('Added price_list_pdf to company_info');
    } else {
      console.log('price_list_pdf already exists in company_info');
    }

    await connection.end();
  } catch (error) {
    console.error('Error adding price list PDF field:', error);
    process.exit(1);
  }
}

addPriceListPdfField();