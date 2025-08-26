const mysql = require('mysql2');
require('dotenv').config();

// Create a connection pool with simpler configuration
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'freelancing_ecommerce',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});


// Test the connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the MySQL database: freelancing_ecommerce');
  connection.release();
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

const db = pool;
const db_promise = pool.promise();

module.exports = {db,db_promise};