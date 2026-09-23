import { getConnection } from '../lib/db.js';

async function addLocationCoordinates() {
  try {
    const connection = await getConnection();
    
    // Check if columns already exist
    const [columns] = await connection.execute('DESCRIBE company_info');
    const columnNames = columns.map(col => col.Field);
    
    const fieldsToAdd = [
      { name: 'latitude', type: 'DECIMAL(10, 8)', alreadyExists: columnNames.includes('latitude') },
      { name: 'longitude', type: 'DECIMAL(11, 8)', alreadyExists: columnNames.includes('longitude') }
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
    console.log('✓ Location coordinates migration completed successfully!');
  } catch (error) {
    console.error('Error adding location coordinates:', error);
    process.exit(1);
  }
}

addLocationCoordinates();
