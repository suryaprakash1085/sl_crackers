import { getConnection } from '../lib/db.js';

async function testDelete() {
  try {
    console.log('\n=== Testing DELETE Functionality ===\n');
    
    const connection = await getConnection();
    
    // Create a test product
    console.log('1. Creating test product...');
    const testName = `Test Delete Product ${Date.now()}`;
    const [insertResult] = await connection.execute(
      'INSERT INTO products (name, price, description, category, quantity) VALUES (?, ?, ?, ?, ?)',
      [testName, 50, 'Test for delete', 'TEST_DELETE', 5]
    );
    const testId = insertResult.insertId;
    console.log(`✓ Test product created with ID: ${testId}`);
    
    // Verify it exists
    console.log('\n2. Verifying product exists...');
    const [selectBefore] = await connection.execute('SELECT * FROM products WHERE id = ?', [testId]);
    if (selectBefore.length > 0) {
      console.log(`✓ Product found: ${selectBefore[0].name}`);
    }
    
    // Delete the product
    console.log('\n3. Deleting product...');
    const [deleteResult] = await connection.execute('DELETE FROM products WHERE id = ?', [testId]);
    console.log(`✓ Delete executed`);
    console.log(`  Affected rows: ${deleteResult.affectedRows}`);
    
    // Verify it's deleted
    console.log('\n4. Verifying product is deleted...');
    const [selectAfter] = await connection.execute('SELECT * FROM products WHERE id = ?', [testId]);
    if (selectAfter.length === 0) {
      console.log('✓ Product successfully deleted from database');
    } else {
      console.log('✗ Product still exists in database');
    }
    
    await connection.end();
    console.log('\n✓ Delete test completed successfully!\n');
    
  } catch (error) {
    console.error('\n✗ Delete test failed:');
    console.error(error.message);
    process.exit(1);
  }
}

testDelete();
