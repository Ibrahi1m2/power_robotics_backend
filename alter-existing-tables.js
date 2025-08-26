const mysql = require('mysql');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'freelancing_ecommerce',
    multipleStatements: true
};

// Create connection
const connection = mysql.createConnection(dbConfig);

// Read the alter tables SQL
const alterSqlPath = path.join(__dirname, 'alter-tables.sql');
const alterSql = fs.readFileSync(alterSqlPath, 'utf8');

console.log('Altering existing tables...');

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        process.exit(1);
    }
    console.log('Connected to MySQL database');

    // Execute the alter statements
    connection.query(alterSql, (err, results) => {
        if (err) {
            console.error('Error altering tables:', err);
            connection.end();
            process.exit(1);
        }

        console.log('Tables altered successfully!');
        console.log('Changes made:');
        console.log('- Added missing columns to orders table');
        console.log('- Added missing columns to order_items table');
        console.log('- Created shipping_addresses table');
        console.log('- Created payment_transactions table');
        console.log('- Added performance indexes');

        // Verify the changes
        verifyTables();
    });
});

function verifyTables() {
    console.log('\nVerifying table structures...');
    
    // Check orders table
    connection.query('DESCRIBE orders', (err, results) => {
        if (err) {
            console.error('Error checking orders table:', err);
        } else {
            console.log('\nOrders table structure:');
            results.forEach(row => {
                console.log(`- ${row.Field}: ${row.Type} ${row.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
            });
        }

        // Check order_items table
        connection.query('DESCRIBE order_items', (err, results) => {
            if (err) {
                console.error('Error checking order_items table:', err);
            } else {
                console.log('\nOrder_items table structure:');
                results.forEach(row => {
                    console.log(`- ${row.Field}: ${row.Type} ${row.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
                });
            }

            // Check if new tables exist
            connection.query('SHOW TABLES LIKE "shipping_addresses"', (err, results) => {
                if (err) {
                    console.error('Error checking shipping_addresses table:', err);
                } else {
                    console.log('\nNew tables created:');
                    console.log(`- shipping_addresses: ${results.length > 0 ? 'YES' : 'NO'}`);
                }

                connection.query('SHOW TABLES LIKE "payment_transactions"', (err, results) => {
                    if (err) {
                        console.error('Error checking payment_transactions table:', err);
                    } else {
                        console.log(`- payment_transactions: ${results.length > 0 ? 'YES' : 'NO'}`);
                        
                        console.log('\n✅ Table alteration completed successfully!');
                        console.log('Your existing tables have been updated to support the checkout system.');
                        connection.end();
                    }
                });
            });
        });
    });
} 