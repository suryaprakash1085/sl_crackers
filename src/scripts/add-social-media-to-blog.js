import { getConnection } from '../lib/db.js';

async function addSocialMediaToBlog() {
  try {
    const connection = await getConnection();
    
    // Check if columns already exist
    const [columns] = await connection.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'blog' AND COLUMN_NAME IN ('socialMedia', 'socialLink')`
    );

    if (columns.length === 2) {
      console.log('✓ Social media columns already exist!');
      await connection.end();
      process.exit(0);
    }

    // Add socialMedia column if it doesn't exist
    if (!columns.find(col => col.COLUMN_NAME === 'socialMedia')) {
      await connection.execute(
        `ALTER TABLE blog ADD COLUMN socialMedia VARCHAR(50) DEFAULT NULL`
      );
      console.log('✓ Added socialMedia column');
    }

    // Add socialLink column if it doesn't exist
    if (!columns.find(col => col.COLUMN_NAME === 'socialLink')) {
      await connection.execute(
        `ALTER TABLE blog ADD COLUMN socialLink VARCHAR(500) DEFAULT NULL`
      );
      console.log('✓ Added socialLink column');
    }

    await connection.end();
    console.log('✓ Successfully added social media fields to blog table!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error adding social media fields:', error.message);
    process.exit(1);
  }
}

addSocialMediaToBlog();
