import { getConnection } from '../lib/db.js';

async function createBlogTable() {
  try {
    const connection = await getConnection();
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS blog (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content LONGTEXT,
        image VARCHAR(255),
        author VARCHAR(255),
        date DATE,
        socialMedia VARCHAR(50) DEFAULT NULL,
        socialLink VARCHAR(500) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    
    await connection.execute(createTableQuery);
    console.log('✓ Blog table created successfully!');
    
    // Check if there are existing blog posts in settings table
    const [existingSettings] = await connection.execute(
      'SELECT setting_value FROM settings WHERE setting_key = ? LIMIT 1',
      ['blog_posts_data']
    );

    if (existingSettings.length > 0) {
      try {
        const blogPosts = JSON.parse(existingSettings[0].setting_value);
        
        if (Array.isArray(blogPosts) && blogPosts.length > 0) {
          console.log(`Found ${blogPosts.length} existing blog posts. Migrating to new table...`);
          
          for (const post of blogPosts) {
            await connection.execute(
              'INSERT INTO blog (id, title, content, image, author, date) VALUES (?, ?, ?, ?, ?, ?)',
              [
                post.id,
                post.title || '',
                post.content || '',
                post.image || '📝',
                post.author || '',
                post.date || new Date().toISOString().split('T')[0]
              ]
            );
          }
          
          console.log(`✓ Successfully migrated ${blogPosts.length} blog posts to new table!`);
        }
      } catch (e) {
        console.log('No existing blog posts to migrate or migration skipped.');
      }
    }
    
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('✗ Error creating blog table:', error.message);
    process.exit(1);
  }
}

createBlogTable();
