const {db,db_promise} = require('../db');

// Get all items in the user's cart
exports.getCart = async (req, res) => {
  try {
    const user_id = req.user.id;
    const sql = `
      SELECT c.id, c.product_id, c.quantity, 
             p.name, p.price, p.image_url, p.stock,
             (p.price * c.quantity) as total_price
      FROM cart c 
      JOIN products p ON c.product_id = p.id 
      WHERE c.user_id = ?
      ORDER BY c.id DESC
    `;
    
    const [results] = await db_promise.execute(sql, [user_id]);
    res.json(results);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Database error', error: err.message });
  }
};

// Add item to cart (if exists, update quantity)
exports.addToCart = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { product_id, quantity } = req.body;
    
    if (!product_id || !quantity) {
      return res.status(400).json({ message: 'Product ID and quantity are required' });
    }
    
    if (quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than 0' });
    }
    
    // Check if product exists and has sufficient stock
    const [productResults] = await db_promise.execute('SELECT stock FROM products WHERE id = ?', [product_id]);
    if (productResults.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const product = productResults[0];
    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock available' });
    }
    
    // Check if item already exists in cart
    const [cartResults] = await db_promise.execute('SELECT * FROM cart WHERE user_id = ? AND product_id = ?', [user_id, product_id]);
    
    if (cartResults.length > 0) {
      // Update quantity
      const newQuantity = cartResults[0].quantity + quantity;
      if (newQuantity > product.stock) {
        return res.status(400).json({ message: 'Insufficient stock available' });
      }
      
      await db_promise.execute('UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?', [newQuantity, user_id, product_id]);
      res.json({ message: 'Cart updated successfully' });
    } else {
      // Insert new item
      await db_promise.execute('INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)', [user_id, product_id, quantity]);
      res.status(201).json({ message: 'Item added to cart successfully' });
    }
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Database error', error: err.message });
  }
};

// Update quantity of a cart item
exports.updateCartItem = (req, res) => {
  const user_id = req.user.id;
  const { product_id, quantity } = req.body;
  
  if (!product_id || !quantity) {
    return res.status(400).json({ message: 'Product ID and quantity are required' });
  }
  
  if (quantity <= 0) {
    return res.status(400).json({ message: 'Quantity must be greater than 0' });
  }
  
  // Check if product exists and has sufficient stock
  db.query('SELECT stock FROM products WHERE id = ?', [product_id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });
    if (results.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const product = results[0];
    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock available' });
    }
    
    db.query('UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?', 
      [quantity, user_id, product_id], (err2, result) => {
      if (err2) return res.status(500).json({ message: 'Database error', error: err2.message });
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Cart item not found' });
      }
      res.json({ message: 'Cart item updated successfully' });
    });
  });
};

// Remove item from cart
exports.removeFromCart = (req, res) => {
  const user_id = req.user.id;
  const { product_id } = req.body;
  
  if (!product_id) {
    return res.status(400).json({ message: 'Product ID is required' });
  }
  
  db.query('DELETE FROM cart WHERE user_id = ? AND product_id = ?', [user_id, product_id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Cart item not found' });
    }
    res.json({ message: 'Item removed from cart successfully' });
  });
};

// Clear user's cart
exports.clearCart = (req, res) => {
  const user_id = req.user.id;
  
  db.query('DELETE FROM cart WHERE user_id = ?', [user_id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });
    res.json({ message: 'Cart cleared successfully' });
  });
};

// Get cart summary (total items and total price)
exports.getCartSummary = (req, res) => {
  const user_id = req.user.id;
  const sql = `
    SELECT 
      COUNT(c.id) as total_items,
      SUM(c.quantity) as total_quantity,
      SUM(p.price * c.quantity) as total_price
    FROM cart c 
    JOIN products p ON c.product_id = p.id 
    WHERE c.user_id = ?
  `;
  
  db.query(sql, [user_id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });
    const summary = results[0];
    summary.total_items = summary.total_items || 0;
    summary.total_quantity = summary.total_quantity || 0;
    summary.total_price = summary.total_price || 0;
    res.json(summary);
  });
}; 