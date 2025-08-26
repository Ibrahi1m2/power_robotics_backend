const db = require('../db');
const bcrypt = require('bcryptjs');

exports.getAllUsers = (req, res) => {
  const sql = `
    SELECT u.id, u.name, u.email, u.role, u.created_at, 
           v.shop_name, v.description as vendor_description
    FROM users u 
    LEFT JOIN vendors v ON u.id = v.user_id
    ORDER BY u.created_at DESC
  `;
  
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });
    res.json(results);
  });
};

exports.getUserById = (req, res) => {
  const { id } = req.params;
  if (req.user.role !== 'admin' && req.user.id != id) {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  const sql = `
    SELECT u.id, u.name, u.email, u.role, u.created_at,
           v.shop_name, v.description as vendor_description
    FROM users u 
    LEFT JOIN vendors v ON u.id = v.user_id
    WHERE u.id = ?
  `;
  
  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });
    if (results.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(results[0]);
  });
};

exports.updateUser = (req, res) => {
  const { id } = req.params;
  const { name, email, password, role } = req.body;
  
  if (req.user.role !== 'admin' && req.user.id != id) {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  // Only admins can change roles
  if (role && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admins can change user roles' });
  }
  
  let updateFields = [];
  let values = [];
  if (name) { updateFields.push('name=?'); values.push(name); }
  if (email) { updateFields.push('email=?'); values.push(email); }
  if (password) { updateFields.push('password=?'); values.push(bcrypt.hashSync(password, 10)); }
  if (role && req.user.role === 'admin') { updateFields.push('role=?'); values.push(role); }
  
  if (updateFields.length === 0) {
    return res.status(400).json({ message: 'No fields to update' });
  }
  
  values.push(id);
  db.query(`UPDATE users SET ${updateFields.join(', ')} WHERE id=?`, values, (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User updated successfully' });
  });
};

exports.deleteUser = (req, res) => {
  const { id } = req.params;
  
  // Check if user has associated data
  db.query('SELECT COUNT(*) as count FROM products WHERE vendor_id IN (SELECT id FROM vendors WHERE user_id = ?)', [id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });
    
    if (results[0].count > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete user. They have associated products. Please remove products first.' 
      });
    }
    
    db.query('DELETE FROM users WHERE id = ?', [id], (err, result) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err.message });
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({ message: 'User deleted successfully' });
    });
  });
};

// Get current user's profile
exports.getProfile = (req, res) => {
  const user_id = req.user.id;
  const sql = `
    SELECT u.id, u.name, u.email, u.role, u.created_at,
           v.shop_name, v.description as vendor_description
    FROM users u 
    LEFT JOIN vendors v ON u.id = v.user_id
    WHERE u.id = ?
  `;
  
  db.query(sql, [user_id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });
    if (results.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(results[0]);
  });
};

// Update current user's profile
exports.updateProfile = (req, res) => {
  const user_id = req.user.id;
  const { name, email, password } = req.body;
  
  let updateFields = [];
  let values = [];
  if (name) { updateFields.push('name=?'); values.push(name); }
  if (email) { updateFields.push('email=?'); values.push(email); }
  if (password) { updateFields.push('password=?'); values.push(bcrypt.hashSync(password, 10)); }
  
  if (updateFields.length === 0) {
    return res.status(400).json({ message: 'No fields to update' });
  }
  
  values.push(user_id);
  db.query(`UPDATE users SET ${updateFields.join(', ')} WHERE id=?`, values, (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'Profile updated successfully' });
  });
};

// Get vendors (users with vendor role)
exports.getVendors = (req, res) => {
  const sql = `
    SELECT u.id, u.name, u.email, u.created_at,
           v.id as vendor_id, v.shop_name, v.description
    FROM users u 
    INNER JOIN vendors v ON u.id = v.user_id
    ORDER BY u.created_at DESC
  `;
  
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });
    res.json(results);
  });
}; 