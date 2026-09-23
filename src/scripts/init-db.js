import { getConnection } from '../lib/db.js';
import bcrypt from 'bcryptjs';

async function initializeDatabase() {
  try {
    const connection = await getConnection();
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        price_80 DECIMAL(10, 2),
        description TEXT,
        category VARCHAR(100),
        image LONGTEXT,
        quantity INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    
    await connection.execute(createTableQuery);
    console.log('✓ Products table created successfully!');

    const createAdminsTableQuery = `
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await connection.execute(createAdminsTableQuery);
    console.log('✓ Admins table created successfully!');

    const createOrdersTableQuery = `
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255),
        address TEXT NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        item_count INT NOT NULL,
        invoice_number VARCHAR(50),
        status VARCHAR(50) DEFAULT 'Pending',
        payment_status VARCHAR(50) DEFAULT 'Unpaid',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await connection.execute(createOrdersTableQuery);
    console.log('✓ Orders table created successfully!');

    const createOrderItemsTableQuery = `
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT,
        product_name VARCHAR(255) NOT NULL,
        quantity INT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        discount DECIMAL(5, 2) DEFAULT 0,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )
    `;

    await connection.execute(createOrderItemsTableQuery);
    console.log('✓ Order Items table created successfully!');

    const createProductSectionsTableQuery = `
      CREATE TABLE IF NOT EXISTS product_sections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;

    await connection.execute(createProductSectionsTableQuery);
    console.log('✓ Product Sections table created successfully!');

    const createSectionProductsTableQuery = `
      CREATE TABLE IF NOT EXISTS section_products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        section_id INT NOT NULL,
        product_id INT NOT NULL,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (section_id) REFERENCES product_sections(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE KEY unique_section_product (section_id, product_id)
      )
    `;

    await connection.execute(createSectionProductsTableQuery);
    console.log('✓ Section Products table created successfully!');

    const createCarouselImagesTableQuery = `
      CREATE TABLE IF NOT EXISTS carousel_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        image_url LONGTEXT NOT NULL,
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;

    await connection.execute(createCarouselImagesTableQuery);
    console.log('✓ Carousel Images table created successfully!');

    const createSettingsTableQuery = `
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(255) NOT NULL UNIQUE,
        setting_value LONGTEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;

    await connection.execute(createSettingsTableQuery);
    await connection.execute('ALTER TABLE settings MODIFY COLUMN setting_value LONGTEXT NOT NULL');
    console.log('✓ Settings table created successfully!');

    const createBlogTableQuery = `
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

    await connection.execute(createBlogTableQuery);
    console.log('✓ Blog table created successfully!');

    const createCompanyInfoTableQuery = `
      CREATE TABLE IF NOT EXISTS company_info (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_name VARCHAR(255) NOT NULL,
        phone_number VARCHAR(20),
        gst_number VARCHAR(50),
        email VARCHAR(255),
        logo LONGTEXT,
        price_list_pdf LONGTEXT,
        address TEXT,
        website VARCHAR(255),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        business_hours JSON,
        facebook_url VARCHAR(500),
        instagram_url VARCHAR(500),
        youtube_url VARCHAR(500),
        whatsapp_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;

    await connection.execute(createCompanyInfoTableQuery);
    console.log('✓ Company Info table created successfully!');

    // Insert default company info if table is empty
    const [companyInfo] = await connection.execute('SELECT COUNT(*) as count FROM company_info');
    if (companyInfo[0].count === 0) {
      const defaultBusinessHours = {
        monday: { open: '9 AM', close: '6 PM' },
        tuesday: { open: '9 AM', close: '6 PM' },
        wednesday: { open: '9 AM', close: '6 PM' },
        thursday: { open: '9 AM', close: '6 PM' },
        friday: { open: '9 AM', close: '6 PM' },
        saturday: { open: '9 AM', close: '6 PM' },
        sunday: { open: '10 AM', close: '4 PM' }
      };
      await connection.execute(
        'INSERT INTO company_info (company_name, phone_number, gst_number, email, address, business_hours) VALUES (?, ?, ?, ?, ?, ?)',
        ['Sivakasi Mart Traders', '+91 XXXXX XXXXX', '', 'support@paradisecrackers.com', 'Sivakasi, Tamil Nadu, India', JSON.stringify(defaultBusinessHours)]
      );
      console.log('✓ Default company info inserted');
    }

    // Check if default admin exists
    const [rows] = await connection.execute('SELECT * FROM admins WHERE username = ?', ['prasanna']);
    if (rows.length === 0) {
      const hashedPassword = await bcrypt.hash('pk160011', 10);
      await connection.execute(
        'INSERT INTO admins (username, password) VALUES (?, ?)',
        ['prasanna', hashedPassword]
      );
      console.log('✓ Default admin user created with encryption!');
    } else {
      // For existing user, update to encrypted password if it's still plain text
      const admin = rows[0];
      if (admin.password === 'pk160011') {
        const hashedPassword = await bcrypt.hash('pk160011', 10);
        await connection.execute(
          'UPDATE admins SET password = ? WHERE username = ?',
          [hashedPassword, 'prasanna']
        );
        console.log('✓ Admin password updated with encryption!');
      }
    }

    await connection.end();
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();
