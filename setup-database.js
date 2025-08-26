const mysql = require('mysql');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'freelancing_ecommerce',
    multipleStatements: true // Allow multiple SQL statements
};

// Create connection
const connection = mysql.createConnection(dbConfig);

// Read the database schema
const schemaPath = path.join(__dirname, 'database-schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

console.log('Setting up database tables...');

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        process.exit(1);
    }
    console.log('Connected to MySQL database');

    // Execute the schema
    connection.query(schema, (err, results) => {
        if (err) {
            console.error('Error creating tables:', err);
            connection.end();
            process.exit(1);
        }

        console.log('Database tables created successfully!');
        console.log('Tables created:');
        console.log('- users');
        console.log('- products');
        console.log('- cart');
        console.log('- orders');
        console.log('- shipping_addresses');
        console.log('- order_items');
        console.log('- payment_transactions');

        // Insert sample data if needed
        insertSampleData();
    });
});

function insertSampleData() {
    console.log('\nInserting sample data...');

    // Sample products
    const sampleProducts = [];

    const productSql = `
        INSERT INTO products (name, description, price, image_url, category_name, brand, features, stock) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    let productsInserted = 0;
    sampleProducts.forEach(product => {
        connection.query(productSql, [
            product.name,
            product.description,
            product.price,
            product.image_url,
            product.category_name,
            product.brand,
            product.features,
            product.stock
        ], (err) => {
            if (err) {
                console.error('Error inserting product:', err);
            } else {
                productsInserted++;
                console.log(`Inserted product: ${product.name}`);
            }

            if (productsInserted === sampleProducts.length) {
                console.log('\nSample data insertion completed!');
                console.log('\nDatabase setup is complete!');
                console.log('You can now start the server and test the checkout functionality.');
                connection.end();
            }
        });
    });
} 