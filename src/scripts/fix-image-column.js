import { getConnection } from '../lib/db.js';

async function fixImageColumn() {
  try {
    const connection = await getConnection();
    
    console.log('Checking current products table schema...');
    const [rows] = await connection.execute('DESCRIBE products');
    
    const imageColumn = rows.find(row => row.Field === 'image');
    if (imageColumn) {
      console.log(`Current image column type: ${imageColumn.Type}`);
    }
    
    console.log('\nUpdating image column to LONGTEXT...');
    const alterQuery = 'ALTER TABLE products MODIFY COLUMN image LONGTEXT';
    await connection.execute(alterQuery);
    
    console.log('✓ Image column updated successfully to LONGTEXT!');
    console.log('  - Now supports images up to 4GB');
    console.log('  - Your saved products should now display images correctly');
    
    await connection.end();
  } catch (error) {
    console.error('Error fixing image column:', error.message);
    process.exit(1);
  }
}

fixImageColumn();
