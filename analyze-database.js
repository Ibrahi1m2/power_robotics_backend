const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'freelancing_ecommerce',
});

console.log('🔍 Analyzing existing database structure...\n');

connection.connect((err) => {
  if (err) {
    console.error('❌ Error connecting to the database:', err);
    return;
  }
  console.log('✅ Connected to MySQL database: freelancing_ecommerce\n');
  
  // Get all tables
  connection.query(`
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_SCHEMA = 'freelancing_ecommerce' 
    ORDER BY TABLE_NAME
  `, (err, tables) => {
    if (err) {
      console.error('Error getting tables:', err);
      return;
    }
    
    console.log('📋 Available tables in database:');
    tables.forEach(table => {
      console.log(`  - ${table.TABLE_NAME}`);
    });
    
    console.log('\n🔍 Analyzing table structures...\n');
    
    // Analyze each table structure
    let tableCount = 0;
    tables.forEach(table => {
      connection.query(`
        SELECT 
          COLUMN_NAME, 
          DATA_TYPE, 
          IS_NULLABLE, 
          COLUMN_DEFAULT, 
          COLUMN_KEY,
          EXTRA
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'freelancing_ecommerce' 
        AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
      `, [table.TABLE_NAME], (err, columns) => {
        if (err) {
          console.error(`Error analyzing table ${table.TABLE_NAME}:`, err);
          return;
        }
        
        console.log(`📋 Table: ${table.TABLE_NAME}`);
        columns.forEach(col => {
          const constraints = [];
          if (col.IS_NULLABLE === 'NO') constraints.push('NOT NULL');
          if (col.COLUMN_KEY === 'PRI') constraints.push('PRIMARY KEY');
          if (col.COLUMN_KEY === 'UNI') constraints.push('UNIQUE');
          if (col.EXTRA === 'auto_increment') constraints.push('AUTO_INCREMENT');
          
          console.log(`    ${col.COLUMN_NAME} (${col.DATA_TYPE}) ${constraints.join(' ')}`);
        });
        
        // Check if table has data
        connection.query(`SELECT COUNT(*) as count FROM ${table.TABLE_NAME}`, (err, result) => {
          if (!err) {
            console.log(`    📊 Records: ${result[0].count}`);
          }
          console.log('');
          
          tableCount++;
          if (tableCount === tables.length) {
            // Analysis complete
            console.log('🎉 Database analysis complete!');
            console.log('\n💡 Next steps:');
            console.log('1. Review the table structures above');
            console.log('2. Identify which tables can be used for products, users, orders, etc.');
            console.log('3. Adapt the Node Server controllers to use existing table names and structures');
            console.log('4. Add any missing tables if needed');
            
            connection.end();
          }
        });
      });
    });
  });
}); 