const db = require('./db');
const bcrypt = require('bcryptjs');

// Create admin user
const createAdminUser = () => {
  const adminUser = {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin'
  };

  const hashedPassword = bcrypt.hashSync(adminUser.password, 10);

  // Check if admin user already exists
  db.query('SELECT * FROM users WHERE email = ?', [adminUser.email], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return;
    }
    
    if (results.length > 0) {
      console.log('Admin user already exists');
      return;
    }

    // Insert admin user
    db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [adminUser.name, adminUser.email, hashedPassword, adminUser.role],
      (err, result) => {
        if (err) {
          console.error('Error creating admin user:', err);
          return;
        }
        console.log('Admin user created successfully');
        console.log('Email:', adminUser.email);
        console.log('Password:', adminUser.password);
        console.log('Role:', adminUser.role);
      }
    );
  });
};

// Run the script
createAdminUser(); 