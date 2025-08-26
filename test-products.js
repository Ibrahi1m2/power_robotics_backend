const db = require('./db');

console.log('Testing database connection and products...');

// Test database connection
db.query('SELECT 1', (err, results) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('✅ Database connection successful');
  
  // Test products query
  db.query('SELECT id, name, price, image_url FROM products LIMIT 5', (err, results) => {
    if (err) {
      console.error('❌ Products query failed:', err);
      return;
    }
    console.log('✅ Products query successful');
    console.log('📦 Found products:', results.length);
    results.forEach(product => {
      console.log(`  - ID: ${product.id}, Name: ${product.name}, Price: ${product.price}`);
    });
    
    process.exit(0);
  });
}); 