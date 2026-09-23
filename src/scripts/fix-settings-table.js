import { getConnection } from '../lib/db.js';

async function fixSettingsTable() {
  try {
    const connection = await getConnection();
    
    // Alter the settings table to use LONGTEXT for setting_value
    const alterTableQuery = `
      ALTER TABLE settings 
      MODIFY COLUMN setting_value LONGTEXT NOT NULL
    `;
    
    await connection.execute(alterTableQuery);
    console.log('✓ Settings table updated successfully!');
    
    await connection.end();
  } catch (error) {
    console.error('Error fixing settings table:', error);
    process.exit(1);
  }
}

fixSettingsTable();
