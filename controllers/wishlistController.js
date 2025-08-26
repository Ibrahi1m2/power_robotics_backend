const db = require('../db');

// Get all items in the user's wishlist
exports.getWishlist = (req, res) => {
  const user_id = req.user.id;
  db.query('SELECT w.id, w.product_id, p.name, p.price FROM wishlist w JOIN products p ON w.product_id = p.id WHERE w.user_id = ?', [user_id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(results);
  });
};

// Add item to wishlist (if not already present)
exports.addToWishlist = (req, res) => {
  const user_id = req.user.id;
  const { product_id } = req.body;
  if (!product_id) {
    return res.status(400).json({ message: 'Product required' });
  }
  db.query('SELECT * FROM wishlist WHERE user_id = ? AND product_id = ?', [user_id, product_id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length > 0) {
      return res.status(400).json({ message: 'Product already in wishlist' });
    }
    db.query('INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)', [user_id, product_id], (err2) => {
      if (err2) return res.status(500).json({ message: 'Database error' });
      res.status(201).json({ message: 'Added to wishlist' });
    });
  });
};

// Remove item from wishlist
exports.removeFromWishlist = (req, res) => {
  const user_id = req.user.id;
  const { product_id } = req.body;
  if (!product_id) {
    return res.status(400).json({ message: 'Product required' });
  }
  db.query('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?', [user_id, product_id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json({ message: 'Removed from wishlist' });
  });
}; 