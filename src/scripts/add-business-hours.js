import { getConnection } from '../lib/db.js';

async function addBusinessHours() {
  try {
    const connection = await getConnection();
    
    // Check if column already exists
    const [columns] = await connection.execute('DESCRIBE company_info');
    const columnNames = columns.map(col => col.Field);
    
    if (!columnNames.includes('business_hours')) {
      const query = `ALTER TABLE company_info ADD COLUMN business_hours JSON`;
      await connection.execute(query);
      console.log('✓ Added business_hours column to company_info table');
      
      // Set default business hours for existing records
      const defaultHours = {
        monday: { open: '9 AM', close: '6 PM' },
        tuesday: { open: '9 AM', close: '6 PM' },
        wednesday: { open: '9 AM', close: '6 PM' },
        thursday: { open: '9 AM', close: '6 PM' },
        friday: { open: '9 AM', close: '6 PM' },
        saturday: { open: '9 AM', close: '6 PM' },
        sunday: { open: '10 AM', close: '4 PM' }
      };
      
      await connection.execute(
        'UPDATE company_info SET business_hours = ? WHERE business_hours IS NULL',
        [JSON.stringify(defaultHours)]
      );
      console.log('✓ Set default business hours for existing records');
    } else {
      console.log('ℹ business_hours column already exists in company_info table');
    }
    
    await connection.end();
    console.log('✓ Business hours migration completed successfully!');
  } catch (error) {
    console.error('Error adding business hours field:', error);
    process.exit(1);
  }
}

addBusinessHours();
