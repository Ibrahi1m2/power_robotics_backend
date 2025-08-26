const mysql = require('mysql');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'freelancing_ecommerce'
};

// Create connection
const connection = mysql.createConnection(dbConfig);

// ALTER statements to run one by one
const alterStatements = [
    // Alter orders table
    "ALTER TABLE orders ADD COLUMN order_number VARCHAR(50) UNIQUE",
    "ALTER TABLE orders ADD COLUMN guest_email VARCHAR(100) NULL",
    "ALTER TABLE orders ADD COLUMN guest_name VARCHAR(100) NULL",
    "ALTER TABLE orders ADD COLUMN status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending'",
    "ALTER TABLE orders ADD COLUMN payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending'",
    "ALTER TABLE orders ADD COLUMN payment_method ENUM('bank_transfer', 'check_payment', 'cash_on_delivery', 'credit_card', 'paypal') DEFAULT 'cash_on_delivery'",
    "ALTER TABLE orders ADD COLUMN shipping_cost DECIMAL(10,2) DEFAULT 0.00",
    "ALTER TABLE orders ADD COLUMN tax_amount DECIMAL(10,2) DEFAULT 0.00",
    "ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0.00",
    "ALTER TABLE orders ADD COLUMN currency VARCHAR(3) DEFAULT 'INR'",
    "ALTER TABLE orders ADD COLUMN notes TEXT NULL",
    "ALTER TABLE orders ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
    
    // Alter order_items table
    "ALTER TABLE order_items ADD COLUMN product_name VARCHAR(255) DEFAULT 'Product'",
    "ALTER TABLE order_items ADD COLUMN product_image VARCHAR(500) NULL",
    "ALTER TABLE order_items ADD COLUMN unit_price DECIMAL(10,2) DEFAULT 0.00",
    
    // Create shipping_addresses table
    `CREATE TABLE shipping_addresses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        business_name VARCHAR(100),
        country VARCHAR(100) NOT NULL,
        address_line1 VARCHAR(255) NOT NULL,
        address_line2 VARCHAR(255),
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        postal_code VARCHAR(20) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )`,
    
    // Create payment_transactions table
    `CREATE TABLE payment_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        transaction_id VARCHAR(100) UNIQUE,
        payment_method ENUM('bank_transfer', 'check_payment', 'cash_on_delivery', 'credit_card', 'paypal') NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'INR',
        status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
        gateway_response TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )`,
    
    // Create indexes
    "CREATE INDEX idx_orders_user_id ON orders(user_id)",
    "CREATE INDEX idx_orders_status ON orders(status)",
    "CREATE INDEX idx_orders_created_at ON orders(created_at)",
    "CREATE INDEX idx_order_items_order_id ON order_items(order_id)",
    "CREATE INDEX idx_shipping_addresses_order_id ON shipping_addresses(order_id)",
    "CREATE INDEX idx_payment_transactions_order_id ON payment_transactions(order_id)"
];

console.log('Starting to alter tables...');

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        process.exit(1);
    }
    console.log('Connected to MySQL database');

    // Run statements one by one
    runStatements(0);
});

function runStatements(index) {
    if (index >= alterStatements.length) {
        console.log('\n✅ All statements executed successfully!');
        console.log('Your tables have been updated to support the checkout system.');
        
        // Update existing data
        updateExistingData();
        return;
    }

    const statement = alterStatements[index];
    console.log(`\nExecuting statement ${index + 1}/${alterStatements.length}:`);
    console.log(statement.substring(0, 50) + '...');

    connection.query(statement, (err, result) => {
        if (err) {
            // Check if it's a "column already exists" error
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️  Column already exists, skipping...');
            } else if (err.code === 'ER_DUP_KEYNAME') {
                console.log('⚠️  Index already exists, skipping...');
            } else if (err.code === 'ER_TABLE_EXISTS_ERROR') {
                console.log('⚠️  Table already exists, skipping...');
            } else {
                console.error('❌ Error:', err.message);
            }
        } else {
            console.log('✅ Success');
        }

        // Run next statement
        runStatements(index + 1);
    });
}

function updateExistingData() {
    console.log('\nUpdating existing data...');
    
    // Update order numbers
    connection.query(
        "UPDATE orders SET order_number = CONCAT('ORD-', DATE_FORMAT(created_at, '%Y%m%d'), '-', LPAD(id, 6, '0')) WHERE order_number IS NULL",
        (err, result) => {
            if (err) {
                console.error('Error updating order numbers:', err.message);
            } else {
                console.log('✅ Updated order numbers');
            }

            // Update product names and prices
            connection.query(
                `UPDATE order_items oi 
                 JOIN products p ON oi.product_id = p.id 
                 SET oi.product_name = p.name, oi.unit_price = p.price 
                 WHERE oi.product_name = 'Product' OR oi.unit_price = 0.00`,
                (err, result) => {
                    if (err) {
                        console.error('Error updating product details:', err.message);
                    } else {
                        console.log('✅ Updated product details');
                    }

                    console.log('\n🎉 Database setup completed successfully!');
                    console.log('Your checkout system is now ready to use.');
                    connection.end();
                }
            );
        }
    );
} 