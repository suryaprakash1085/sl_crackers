import { getConnection } from '../lib/db.js';

async function testDatabase() {
  console.log('\n=== Testing Database Connection ===\n');

  try {
    // Test connection
    console.log('1. Testing database connection...');
    const connection = await getConnection();
    console.log('✓ Connected to database successfully!');

    // Check if products table exists
    console.log('\n2. Checking products table...');
    const [tableInfo] = await connection.execute('DESCRIBE products');
    console.log('✓ Products table exists with columns:');
    tableInfo.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });

    // Count existing products
    console.log('\n3. Counting existing products...');
    const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM products');
    const productCount = countResult[0].count;
    console.log(`✓ Found ${productCount} products in database`);

    // List all products
    if (productCount > 0) {
      console.log('\n4. Current products in database:');
      const [products] = await connection.execute('SELECT id, name, price, category FROM products');
      products.forEach(product => {
        console.log(`  - ID: ${product.id}, Name: ${product.name}, Price: ₹${product.price}, Category: ${product.category}`);
      });
    }

    // Test insert
    console.log('\n5. Testing INSERT operation...');
    const testProduct = {
      name: `Test Product ${Date.now()}`,
      price: 100,
      description: 'Test product for verification',
      category: 'TEST',
      image: '🧪',
      quantity: 10
    };

    const [insertResult] = await connection.execute(
      'INSERT INTO products (name, price, description, category, image, quantity) VALUES (?, ?, ?, ?, ?, ?)',
      [testProduct.name, testProduct.price, testProduct.description, testProduct.category, testProduct.image, testProduct.quantity]
    );
    
    console.log(`✓ Test product inserted successfully!`);
    console.log(`  Insert ID: ${insertResult.insertId}`);

    // Verify insert
    console.log('\n6. Verifying inserted product...');
    const [verifyResult] = await connection.execute('SELECT * FROM products WHERE id = ?', [insertResult.insertId]);
    if (verifyResult.length > 0) {
      const product = verifyResult[0];
      console.log('✓ Product verified in database:');
      console.log(`  ID: ${product.id}`);
      console.log(`  Name: ${product.name}`);
      console.log(`  Price: ₹${product.price}`);
      console.log(`  Category: ${product.category}`);
      console.log(`  Created: ${product.created_at}`);
    }

    await connection.end();
    console.log('\n✓ All database tests passed!\n');

  } catch (error) {
    console.error('\n✗ Database test failed:');
    console.error(error.message);
    process.exit(1);
  }
}

testDatabase();
