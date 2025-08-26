const db = require('../db');

exports.getOrders = (req, res) => {
  let sql = `
    SELECT o.*, u.name as customer_name, u.email as customer_email,
           COUNT(oi.id) as item_count
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
  `;
  
  if (req.user.role === 'admin') {
    sql += ' GROUP BY o.id ORDER BY o.created_at DESC';
    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err.message });
      res.json(results);
    });
  } else {
    sql += ' WHERE o.user_id = ? GROUP BY o.id ORDER BY o.created_at DESC';
    db.query(sql, [req.user.id], (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err.message });
      res.json(results);
    });
  }
};

exports.getOrderById = (req, res) => {
  const { id } = req.params;
  
  // Get order details
  const orderSql = `
    SELECT o.*, u.name as customer_name, u.email as customer_email
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    WHERE o.id = ?
  `;
  
  db.query(orderSql, [id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });
    if (results.length === 0) return res.status(404).json({ message: 'Order not found' });
    
    const order = results[0];
    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get order items with product details
    const itemsSql = `
      SELECT oi.*, p.name as product_name, p.image_url as product_image
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `;
    
    db.query(itemsSql, [id], (err2, items) => {
      if (err2) return res.status(500).json({ message: 'Database error', error: err2.message });
      order.items = items;
      res.json(order);
    });
  });
};

exports.createOrder = (req, res) => {
  const { items, total } = req.body;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Order items required' });
  }
  
  if (!total || total <= 0) {
    return res.status(400).json({ message: 'Valid total amount required' });
  }
  
  // Start transaction
  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });
    
    // Create order
    db.query(
      'INSERT INTO orders (user_id, total, status, created_at) VALUES (?, ?, ?, NOW())', 
      [req.user.id, total, 'pending'], 
      (err, result) => {
        if (err) {
          return db.rollback(() => {
            res.status(500).json({ message: 'Database error', error: err.message });
          });
        }
        
        const orderId = result.insertId;
        const values = items.map(item => [orderId, item.product_id, item.quantity, item.price]);
        
        // Insert order items
        db.query(
          'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?', 
          [values], 
          (err2) => {
            if (err2) {
              return db.rollback(() => {
                res.status(500).json({ message: 'Database error', error: err2.message });
              });
            }
            
            // Commit transaction
            db.commit((err3) => {
              if (err3) {
                return db.rollback(() => {
                  res.status(500).json({ message: 'Database error', error: err3.message });
                });
              }
              res.status(201).json({ message: 'Order created successfully', order_id: orderId });
            });
          }
        );
      }
    );
  });
};

exports.updateOrderStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }
  
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }
  
  db.query('UPDATE orders SET status=? WHERE id=?', [status, id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json({ message: 'Order status updated successfully' });
  });
};

exports.deleteOrder = (req, res) => {
  const { id } = req.params;
  
  // Start transaction
  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });
    
    // Delete order items first
    db.query('DELETE FROM order_items WHERE order_id = ?', [id], (err) => {
      if (err) {
        return db.rollback(() => {
          res.status(500).json({ message: 'Database error', error: err.message });
        });
      }
      
      // Delete order
      db.query('DELETE FROM orders WHERE id = ?', [id], (err2, result) => {
        if (err2) {
          return db.rollback(() => {
            res.status(500).json({ message: 'Database error', error: err2.message });
          });
        }
        
        if (result.affectedRows === 0) {
          return db.rollback(() => {
            res.status(404).json({ message: 'Order not found' });
          });
        }
        
        // Commit transaction
        db.commit((err3) => {
          if (err3) {
            return db.rollback(() => {
              res.status(500).json({ message: 'Database error', error: err3.message });
            });
          }
          res.json({ message: 'Order deleted successfully' });
        });
      });
    });
  });
};

// Get order statistics
exports.getOrderStats = (req, res) => {
  const sql = `
    SELECT 
      COUNT(*) as total_orders,
      SUM(total) as total_revenue,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
      COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_orders,
      COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped_orders,
      COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders
    FROM orders
  `;
  
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });
    res.json(results[0]);
  });
}; 