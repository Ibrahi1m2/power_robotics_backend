const { db, db_promise } = require('../db');

// Create a new order with all checkout details
exports.createOrder = async (req, res) => {
  try {
    const {
      // Customer information
      customerInfo,
      // Shipping address
      shippingAddress,
      // Order details
      items,
      subtotal,
      shipping_cost = 0,
      tax_amount = 0,
      discount_amount = 0,
      total_amount,
      // Payment information
      payment_method,
      notes = ''
    } = req.body;

    console.log('Received order data:', { items, shippingAddress, total_amount, payment_method });

    // Validate required fields
    if (!shippingAddress || !items || !total_amount || !payment_method) {
      return res.status(400).json({ 
        message: 'Missing required fields: shipping address, items, total amount, and payment method are required' 
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }

    // Validate shipping address
    const requiredAddressFields = ['first_name', 'last_name', 'country', 'address_line1', 'city', 'state', 'postal_code', 'phone'];
    for (const field of requiredAddressFields) {
      if (!shippingAddress[field]) {
        return res.status(400).json({ message: `Missing required shipping address field: ${field}` });
      }
    }

    // Start database transaction (use promise-based pool)
    const connection = await db_promise.getConnection();
    await connection.beginTransaction();

    try {
      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Create order
      const orderData = {
        order_number: orderNumber,
        user_id: req.user ? req.user.id : null,
        guest_email: !req.user ? shippingAddress.email : null,
        guest_name: !req.user ? `${shippingAddress.first_name} ${shippingAddress.last_name}` : null,
        payment_method: payment_method,
        subtotal: subtotal,
        shipping_cost: shipping_cost,
        tax_amount: tax_amount,
        discount_amount: discount_amount,
        total_amount: total_amount,
        notes: notes
      };

      const orderSql = `
        INSERT INTO orders (
          order_number, user_id, guest_email, guest_name, payment_method,
          subtotal, shipping_cost, tax_amount, discount_amount, total_amount, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const orderValues = [
        orderData.order_number,
        orderData.user_id,
        orderData.guest_email,
        orderData.guest_name,
        orderData.payment_method,
        orderData.subtotal,
        orderData.shipping_cost,
        orderData.tax_amount,
        orderData.discount_amount,
        orderData.total_amount,
        orderData.notes
      ];

      const [orderResult] = await connection.execute(orderSql, orderValues);
      const orderId = orderResult.insertId;

      // Insert shipping address
      const addressSql = `
        INSERT INTO shipping_addresses (
          order_id, first_name, last_name, business_name, country,
          address_line1, address_line2, city, state, postal_code, phone, email
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const addressValues = [
        orderId,
        shippingAddress.first_name,
        shippingAddress.last_name,
        shippingAddress.business_name || null,
        shippingAddress.country,
        shippingAddress.address_line1,
        shippingAddress.address_line2 || null,
        shippingAddress.city,
        shippingAddress.state,
        shippingAddress.postal_code,
        shippingAddress.phone,
        shippingAddress.email || null
      ];

      await connection.execute(addressSql, addressValues);

      // Insert order items
      for (const item of items) {
        const itemSql = `
          INSERT INTO order_items (
            order_id, product_id, product_name, product_image,
            quantity, unit_price, total_price
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const itemValues = [
          orderId,
          item.id,
          item.name,
          item.image_url || null,
          item.quantity,
          item.price,
          item.price * item.quantity
        ];

        await connection.execute(itemSql, itemValues);
      }

      // Commit transaction
      await connection.commit();
      connection.release();

      res.status(201).json({
        message: 'Order created successfully',
        order_id: orderId,
        order_number: orderNumber
      });

    } catch (err) {
      // Rollback transaction
      await connection.rollback();
      connection.release();
      throw err;
    }

  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Database error', error: err.message });
  }
};

// Get order details by ID
exports.getOrderDetails = (req, res) => {
    const { orderId } = req.params;

    if (!orderId) {
        return res.status(400).json({ message: 'Order ID is required' });
    }

    // Get order with shipping address and items
    const orderSql = `
        SELECT 
            o.*,
            sa.first_name, sa.last_name, sa.business_name, sa.country,
            sa.address_line1, sa.address_line2, sa.city, sa.state, sa.postal_code, sa.phone, sa.email
        FROM orders o
        LEFT JOIN shipping_addresses sa ON o.id = sa.order_id
        WHERE o.id = ?
    `;

    db.query(orderSql, [orderId], (err, orderResults) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err.message });
        }

        if (orderResults.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const order = orderResults[0];

        // Check if user has permission to view this order
        if (req.user && req.user.role !== 'admin' && order.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Get order items
        const itemsSql = `
            SELECT * FROM order_items WHERE order_id = ?
        `;

        db.query(itemsSql, [orderId], (err2, items) => {
            if (err2) {
                return res.status(500).json({ message: 'Database error', error: err2.message });
            }

            // Get payment transaction
            const transactionSql = `
                SELECT * FROM payment_transactions WHERE order_id = ? ORDER BY created_at DESC LIMIT 1
            `;

            db.query(transactionSql, [orderId], (err3, transactions) => {
                if (err3) {
                    return res.status(500).json({ message: 'Database error', error: err3.message });
                }

                order.items = items;
                order.payment_transaction = transactions[0] || null;

                res.json(order);
            });
        });
    });
};

// Get user's order history
exports.getUserOrders = (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    const sql = `
        SELECT 
            o.id, o.order_number, o.status, o.payment_status, o.total_amount,
            o.created_at, COUNT(oi.id) as item_count
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.user_id = ?
        GROUP BY o.id
        ORDER BY o.created_at DESC
    `;

    db.query(sql, [req.user.id], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err.message });
        }

        res.json(results);
    });
};

// Update order status (admin only)
exports.updateOrderStatus = (req, res) => {
    const { orderId } = req.params;
    const { status, payment_status } = req.body;

    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }

    if (!orderId) {
        return res.status(400).json({ message: 'Order ID is required' });
    }

    const updateFields = [];
    const updateValues = [];

    if (status) {
        updateFields.push('status = ?');
        updateValues.push(status);
    }

    if (payment_status) {
        updateFields.push('payment_status = ?');
        updateValues.push(payment_status);
    }

    if (updateFields.length === 0) {
        return res.status(400).json({ message: 'No fields to update' });
    }

    updateValues.push(orderId);

    const sql = `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`;

    db.query(sql, updateValues, (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err.message });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json({ message: 'Order status updated successfully' });
    });
};

// Get order statistics (admin only)
exports.getOrderStats = (req, res) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }

    const sql = `
        SELECT 
            COUNT(*) as total_orders,
            SUM(total_amount) as total_revenue,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
            COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_orders,
            COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped_orders,
            COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
            COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
            COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_orders,
            COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_payments
        FROM orders
    `;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err.message });
        }

        res.json(results[0]);
    });
};

// Calculate shipping cost based on address
exports.calculateShipping = (req, res) => {
    const { country, state, city } = req.body;

    if (!country) {
        return res.status(400).json({ message: 'Country is required' });
    }

    // Simple shipping calculation logic
    let shippingCost = 0;

    // Free shipping for orders above certain amount (can be customized)
    const orderTotal = req.body.orderTotal || 0;
    
    if (orderTotal >= 2000) {
        shippingCost = 0; // Free shipping
    } else {
        // Basic shipping rates (can be customized based on your business logic)
        switch (country.toLowerCase()) {
            case 'india':
                shippingCost = 100;
                break;
            case 'united states':
            case 'usa':
                shippingCost = 500;
                break;
            case 'united kingdom':
            case 'uk':
                shippingCost = 400;
                break;
            default:
                shippingCost = 300;
        }
    }

    res.json({
        shipping_cost: shippingCost,
        estimated_delivery: '3-5 business days'
    });
}; 