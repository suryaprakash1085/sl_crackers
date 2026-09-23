import { getConnection } from '../lib/db.js';

async function migrateCarouselImagesTable() {
  try {
    const connection = await getConnection();
    
    // Alter the carousel_images table to change image_url from TEXT to LONGTEXT
    const alterTableQuery = `
      ALTER TABLE carousel_images 
      MODIFY COLUMN image_url LONGTEXT NOT NULL
    `;
    
    await connection.execute(alterTableQuery);
    console.log('✓ carousel_images.image_url column updated to LONGTEXT successfully!');
    
    await connection.end();
  } catch (error) {
    console.error('Error migrating carousel_images table:', error);
    process.exit(1);
  }
}

migrateCarouselImagesTable();
