const db = require('../db');

// Get all reviews for a product
exports.getProductReviews = (req, res) => {
  const { product_id } = req.params;
  
  const sql = `
    SELECT r.*, u.name as user_name
    FROM reviews r
    LEFT JOIN users u ON r.user_id = u.id
    WHERE r.product_id = ?
    ORDER BY r.created_at DESC
  `;
  
  db.query(sql, [product_id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });
    res.json(results);
  });
};

// Get all reviews (admin only)
exports.getAllReviews = (req, res) => {
  const sql = `
    SELECT r.*, u.name as user_name, p.name as product_name
    FROM reviews r
    LEFT JOIN users u ON r.user_id = u.id
    LEFT JOIN products p ON r.product_id = p.id
    ORDER BY r.created_at DESC
  `;
  
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });
    res.json(results);
  });
};

// Get review by ID
exports.getReviewById = (req, res) => {
  const { id } = req.params;
  
  const sql = `
    SELECT r.*, u.name as user_name, p.name as product_name
    FROM reviews r
    LEFT JOIN users u ON r.user_id = u.id
    LEFT JOIN products p ON r.product_id = p.id
    WHERE r.id = ?
  `;
  
  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });
    if (results.length === 0) return res.status(404).json({ message: 'Review not found' });
    res.json(results[0]);
  });
};

// Create a new review
exports.createReview = (req, res) => {
  const user_id = req.user.id;
  const { product_id, rating, comment } = req.body;
  
  if (!product_id || !rating) {
    return res.status(400).json({ message: 'Product ID and rating are required' });
  }
  
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });
  }
  
  // Check if product exists
  db.query('SELECT id FROM products WHERE id = ?', [product_id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });
    if (results.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if user already reviewed this product
    db.query('SELECT id FROM reviews WHERE user_id = ? AND product_id = ?', [user_id, product_id], (err2, results2) => {
      if (err2) return res.status(500).json({ message: 'Database error', error: err2.message });
      if (results2.length > 0) {
        return res.status(400).json({ message: 'You have already reviewed this product' });
      }
      
      // Create review
      const sql = `
        INSERT INTO reviews (user_id, product_id, rating, comment, created_at) 
        VALUES (?, ?, ?, ?, NOW())
      `;
      
      db.query(sql, [user_id, product_id, rating, comment], (err3, result) => {
        if (err3) return res.status(500).json({ message: 'Database error', error: err3.message });
        res.status(201).json({ 
          message: 'Review created successfully',
          id: result.insertId,
          user_id,
          product_id,
          rating,
          comment
        });
      });
    });
  });
};

// Update a review
exports.updateReview = (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;
  const { rating, comment } = req.body;
  
  if (rating && (rating < 1 || rating > 5)) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });
  }
  
  // Check if review exists and belongs to user
  db.query('SELECT * FROM reviews WHERE id = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });
    if (results.length === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    const review = results[0];
    if (review.user_id !== user_id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Update review
    let updateFields = [];
    let values = [];
    if (rating !== undefined) { updateFields.push('rating=?'); values.push(rating); }
    if (comment !== undefined) { updateFields.push('comment=?'); values.push(comment); }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    values.push(id);
    const sql = `UPDATE reviews SET ${updateFields.join(', ')} WHERE id=?`;
    
    db.query(sql, values, (err2, result) => {
      if (err2) return res.status(500).json({ message: 'Database error', error: err2.message });
      res.json({ message: 'Review updated successfully' });
    });
  });
};

// Delete a review
exports.deleteReview = (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;
  
  // Check if review exists and belongs to user
  db.query('SELECT * FROM reviews WHERE id = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });
    if (results.length === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    const review = results[0];
    if (review.user_id !== user_id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    db.query('DELETE FROM reviews WHERE id = ?', [id], (err2, result) => {
      if (err2) return res.status(500).json({ message: 'Database error', error: err2.message });
      res.json({ message: 'Review deleted successfully' });
    });
  });
};

// Get product rating statistics
exports.getProductRatingStats = (req, res) => {
  const { product_id } = req.params;
  
  const sql = `
    SELECT 
      COUNT(*) as total_reviews,
      AVG(rating) as average_rating,
      COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
      COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
      COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
      COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
      COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
    FROM reviews 
    WHERE product_id = ?
  `;
  
  db.query(sql, [product_id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });
    const stats = results[0];
    stats.average_rating = parseFloat(stats.average_rating || 0).toFixed(1);
    res.json(stats);
  });
}; 