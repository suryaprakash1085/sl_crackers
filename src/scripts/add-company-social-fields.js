import { getConnection } from '../lib/db.js';

async function addCompanySocialFields() {
  try {
    const connection = await getConnection();
    const [columns] = await connection.execute('DESCRIBE company_info');
    const columnNames = columns.map((column) => column.Field);
    const fieldsToAdd = [
      { name: 'facebook_url', type: 'VARCHAR(500)' },
      { name: 'instagram_url', type: 'VARCHAR(500)' },
      { name: 'youtube_url', type: 'VARCHAR(500)' },
      { name: 'whatsapp_url', type: 'VARCHAR(500)' },
    ];

    for (const field of fieldsToAdd) {
      if (!columnNames.includes(field.name)) {
        await connection.execute(`ALTER TABLE company_info ADD COLUMN ${field.name} ${field.type}`);
        console.log(`Added ${field.name} to company_info`);
      }
    }

    await connection.end();
  } catch (error) {
    console.error('Error adding company social fields:', error);
    process.exit(1);
  }
}

addCompanySocialFields();
