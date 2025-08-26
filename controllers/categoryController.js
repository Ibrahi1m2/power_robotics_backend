const db = require('../db');

exports.getAllCategories = (req, res) => {
  const sql = `
    SELECT c.*, COUNT(p.id) as product_count 
    FROM categories c 
    LEFT JOIN products p ON c.id = p.category_id 
    GROUP BY c.id 
    ORDER BY c.name
  `;
  
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });
    res.json(results);
  });
};

exports.getCategoryById = (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT c.*, COUNT(p.id) as product_count 
    FROM categories c 
    LEFT JOIN products p ON c.id = p.category_id 
    WHERE c.id = ? 
    GROUP BY c.id
  `;
  
  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });
    if (results.length === 0) return res.status(404).json({ message: 'Category not found' });
    res.json(results[0]);
  });
};

exports.createCategory = (req, res) => {
  const { name, description } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }
  
  db.query('INSERT INTO categories (name, description) VALUES (?, ?)', [name, description], (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });
    res.status(201).json({ id: result.insertId, name, description });
  });
};

exports.updateCategory = (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }
  
  db.query('UPDATE categories SET name=?, description=? WHERE id=?', [name, description, id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json({ message: 'Category updated successfully' });
  });
};

exports.deleteCategory = (req, res) => {
  const { id } = req.params;
  
  // Check if category has products
  db.query('SELECT COUNT(*) as count FROM products WHERE category_id = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });
    
    if (results[0].count > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category. It has associated products. Please remove or reassign products first.' 
      });
    }
    
    db.query('DELETE FROM categories WHERE id = ?', [id], (err, result) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err.message });
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Category not found' });
      }
      res.json({ message: 'Category deleted successfully' });
    });
  });
}; 