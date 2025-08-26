const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { db, db_promise } = require('../db');

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/cart-images';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        // Accept only images
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Upload cart image and create order
exports.uploadCartImageAndCreateOrder = (req, res) => {
    upload.single('cartImage')(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Cart image is required' });
        }

        console.log(req.user);

        const {
            customerInfo,
            shippingAddress,
            items,
            subtotal,
            shipping_cost = 0,
            tax_amount = 0,
            discount_amount = 0,
            total_amount,
            payment_method,
            notes = '',
            user_id
        } = req.body;

        // Validate required fields
        if (!shippingAddress || !items || !total_amount || !payment_method) {
            return res.status(400).json({ 
                message: 'Missing required fields: shipping address, items, total amount, and payment method are required' 
            });
        }

        let shippingAddress_Obj = JSON.parse(shippingAddress);
        let items_array = JSON.parse(items);

        console.log(items_array);
        if (!Array.isArray(items_array) || items_array.length === 0) {
            return res.status(400).json({ message: 'Order must contain at least one item' });
        }

        // Validate shipping address
        const requiredAddressFields = ['first_name', 'last_name', 'country', 'address_line1', 'city', 'state', 'postal_code', 'phone'];
        for (const field of requiredAddressFields) {
            if (!shippingAddress_Obj[field]) {
                return res.status(400).json({ message: `Missing required shipping address field: ${field}` });
            }
        }

        const connection = await db_promise.getConnection();

        try{
            // Start database transaction (promise-based)
            await connection.beginTransaction();

            // Generate order number
            const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            const uniqueId = uuidv4();

            // Create order with image reference
            const orderData = {
                order_number: orderNumber,
                unique_id: uniqueId,
                user_id: req.user ? req.user.id : user_id,
                guest_email: !req.user ? shippingAddress_Obj.email : null,
                guest_name: !req.user ? `${shippingAddress_Obj.first_name} ${shippingAddress_Obj.last_name}` : null,
                payment_method: payment_method,
                subtotal: subtotal,
                shipping_cost: shipping_cost,
                tax_amount: tax_amount,
                discount_amount: discount_amount,
                total_amount: total_amount,
                notes: notes,
                cart_image_path: req.file.path,
                cart_image_url: `/uploads/cart-images/${req.file.filename}`
            };

            const orderSql = `
                INSERT INTO orders (
                    order_number, unique_id, user_id, guest_email, guest_name, payment_method,
                    subtotal, shipping_cost, tax_amount, discount_amount, total_amount, notes,
                    cart_image_path, cart_image_url
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const orderValues = [
                orderData.order_number,
                orderData.unique_id,
                orderData.user_id,
                orderData.guest_email,
                orderData.guest_name,
                orderData.payment_method,
                orderData.subtotal,
                orderData.shipping_cost,
                orderData.tax_amount,
                orderData.discount_amount,
                orderData.total_amount,
                orderData.notes,
                orderData.cart_image_path,
                orderData.cart_image_url
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
                    shippingAddress_Obj.first_name,
                    shippingAddress_Obj.last_name,
                    shippingAddress_Obj.business_name || null,
                    shippingAddress_Obj.country,
                    shippingAddress_Obj.address_line1,
                    shippingAddress_Obj.address_line2 || null,
                    shippingAddress_Obj.city,
                    shippingAddress_Obj.state,
                    shippingAddress_Obj.postal_code,
                    shippingAddress_Obj.phone,
                    shippingAddress_Obj.email || null
                ];

            await connection.execute(addressSql, addressValues);

                    // Insert order items
            for (const item of items_array) {
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

                            // Create payment transaction record
                            const transactionSql = `
                                INSERT INTO payment_transactions (
                                    order_id, transaction_id, payment_method, amount, currency, status
                                ) VALUES (?, ?, ?, ?, ?, ?)
                            `;
                            const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
                            const transactionValues = [
                                orderId,
                                transactionId,
                                payment_method,
                                total_amount,
                                'INR',
                                'pending'
                            ];
            await connection.execute(transactionSql, transactionValues);

                                // Clear user's cart if they are logged in
                                if (req.user) {
                await connection.execute('DELETE FROM cart WHERE user_id = ?', [req.user.id]);
                                }

                                // Commit transaction
            await connection.commit();

                                    // Send WhatsApp notification
                                    sendWhatsAppNotification(orderData, shippingAddress_Obj);

                                    res.status(201).json({
                                        message: 'Order created successfully',
                                        order_id: orderId,
                                        order_number: orderNumber,
                                        unique_id: uniqueId,
                                        transaction_id: transactionId,
                                        total_amount: total_amount,
                                        admin_url: `${process.env.BASE_URL || 'http://localhost:5000'}/admin/order/${uniqueId}`
                                    });
        }catch(error){
            console.error('Error creating order:', error);
            return res.status(500).json({ message: 'Database error', error: error.message });
        }finally{
            connection.release();
        }
    });
};

// Get order details by unique ID (for admin)
exports.getOrderByUniqueId = (req, res) => {
    const { uniqueId } = req.params;

    if (!uniqueId) {
        return res.status(400).json({ message: 'Unique ID is required' });
    }

    // Get order with shipping address and items
    const orderSql = `
        SELECT 
            o.*,
            sa.first_name, sa.last_name, sa.business_name, sa.country,
            sa.address_line1, sa.address_line2, sa.city, sa.state, sa.postal_code, sa.phone, sa.email
        FROM orders o
        LEFT JOIN shipping_addresses sa ON o.id = sa.order_id
        WHERE o.unique_id = ?
    `;

    db.query(orderSql, [uniqueId], (err, orderResults) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err.message });
        }

        if (orderResults.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const order = orderResults[0];

        // Get order items
        const itemsSql = `
            SELECT * FROM order_items WHERE order_id = ?
        `;

        db.query(itemsSql, [order.id], (err2, items) => {
            if (err2) {
                return res.status(500).json({ message: 'Database error', error: err2.message });
            }

            // Get payment transaction
            const transactionSql = `
                SELECT * FROM payment_transactions WHERE order_id = ? ORDER BY created_at DESC LIMIT 1
            `;

            db.query(transactionSql, [order.id], (err3, transactions) => {
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

// Send WhatsApp notification
async function sendWhatsAppNotification(orderData, shippingAddress) {
    try {
        // You'll need to configure Twilio credentials in your .env file
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const fromNumber = process.env.TWILIO_FROM_NUMBER;
        const toNumber = process.env.ADMIN_WHATSAPP_NUMBER;

        if (!accountSid || !authToken || !fromNumber || !toNumber) {
            console.log('Twilio credentials not configured, skipping WhatsApp notification');
            return;
        }

        const twilio = require('twilio')(accountSid, authToken);
        
        const adminUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/admin/order/${orderData.unique_id}`;
        
        const message = `🛒 New Order Received!

Order #: ${orderData.order_number}
Customer: ${shippingAddress.first_name} ${shippingAddress.last_name}
Phone: ${shippingAddress.phone}
Total: ₹${orderData.total_amount}

View order details: ${adminUrl}`;

        await twilio.messages.create({
            from: `whatsapp:${fromNumber}`,
            to: `whatsapp:${toNumber}`,
            body: message
        });

        console.log('WhatsApp notification sent successfully');
    } catch (error) {
        console.error('Error sending WhatsApp notification:', error);
    }
}

// Serve uploaded images
exports.serveImage = (req, res) => {
    const { filename } = req.params;
    console.log("File Name :: "+filename)
    const imagePath = path.join(__dirname, '..', 'uploads', 'cart-images', filename);
    
    if (fs.existsSync(imagePath)) {
        res.sendFile(imagePath);
    } else {
        res.status(404).json({ message: 'Image not found' });
    }
}; 