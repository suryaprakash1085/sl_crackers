import { getConnection } from '../lib/db.js';

async function addCompanyFields() {
  try {
    const connection = await getConnection();
    
    // Check if columns already exist
    const [columns] = await connection.execute('DESCRIBE company_info');
    const columnNames = columns.map(col => col.Field);
    
    const fieldsToAdd = [
      { name: 'address', type: 'TEXT', alreadyExists: columnNames.includes('address') },
      { name: 'website', type: 'VARCHAR(255)', alreadyExists: columnNames.includes('website') }
    ];
    
    for (const field of fieldsToAdd) {
      if (!field.alreadyExists) {
        const query = `ALTER TABLE company_info ADD COLUMN ${field.name} ${field.type}`;
        await connection.execute(query);
        console.log(`✓ Added ${field.name} column to company_info table`);
      } else {
        console.log(`ℹ ${field.name} column already exists in company_info table`);
      }
    }
    
    await connection.end();
    console.log('✓ Company info table migration completed successfully!');
  } catch (error) {
    console.error('Error adding company fields:', error);
    process.exit(1);
  }
}

addCompanyFields();
