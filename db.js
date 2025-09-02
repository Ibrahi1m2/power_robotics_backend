const mysql = require('mysql2');
require('dotenv').config();

// Parse database configuration from environment variables

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'freelancing_ecommerce',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  ssl: process.env.DB_CA_CERT
    ? {
        rejectUnauthorized: true,
        ca: process.env.DB_CA_CERT, // pulled from .env (string)
      }
    : undefined,
};


// Log database configuration (without password)
console.log('Database Configuration:', {
  ...dbConfig,
  password: dbConfig.password ? '***' : 'not set'
});

// Create a connection pool
const pool = mysql.createPool(dbConfig);

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