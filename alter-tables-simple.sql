-- Simple ALTER TABLE statements for existing tables
-- Run these statements one by one in phpMyAdmin or MySQL command line

-- ========================================
-- ALTER ORDERS TABLE
-- ========================================

-- Add order_number column
ALTER TABLE orders ADD COLUMN order_number VARCHAR(50) UNIQUE;

-- Add guest fields
ALTER TABLE orders ADD COLUMN guest_email VARCHAR(100) NULL;
ALTER TABLE orders ADD COLUMN guest_name VARCHAR(100) NULL;

-- Add status fields
ALTER TABLE orders ADD COLUMN status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending';

-- Add payment method
ALTER TABLE orders ADD COLUMN payment_method ENUM('bank_transfer', 'check_payment', 'cash_on_delivery', 'credit_card', 'paypal') DEFAULT 'cash_on_delivery';

-- Add pricing fields
ALTER TABLE orders ADD COLUMN shipping_cost DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN tax_amount DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0.00;

-- Add currency and notes
ALTER TABLE orders ADD COLUMN currency VARCHAR(3) DEFAULT 'INR';
ALTER TABLE orders ADD COLUMN notes TEXT NULL;

-- Add updated_at timestamp
ALTER TABLE orders ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- ========================================
-- ALTER ORDER_ITEMS TABLE
-- ========================================

-- Add product details
ALTER TABLE order_items ADD COLUMN product_name VARCHAR(255) DEFAULT 'Product';
ALTER TABLE order_items ADD COLUMN product_image VARCHAR(500) NULL;
ALTER TABLE order_items ADD COLUMN unit_price DECIMAL(10,2) DEFAULT 0.00;

-- ========================================
-- CREATE SHIPPING_ADDRESSES TABLE
-- ========================================

CREATE TABLE shipping_addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    business_name VARCHAR(100),
    country VARCHAR(100) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- ========================================
-- CREATE PAYMENT_TRANSACTIONS TABLE
-- ========================================

CREATE TABLE payment_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    transaction_id VARCHAR(100) UNIQUE,
    payment_method ENUM('bank_transfer', 'check_payment', 'cash_on_delivery', 'credit_card', 'paypal') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    gateway_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- ========================================
-- CREATE INDEXES
-- ========================================

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_shipping_addresses_order_id ON shipping_addresses(order_id);
CREATE INDEX idx_payment_transactions_order_id ON payment_transactions(order_id);

-- ========================================
-- UPDATE EXISTING DATA
-- ========================================

-- Update existing orders with order numbers
UPDATE orders SET order_number = CONCAT('ORD-', DATE_FORMAT(created_at, '%Y%m%d'), '-', LPAD(id, 6, '0')) WHERE order_number IS NULL;

-- Update order_items with product names and prices
UPDATE order_items oi 
JOIN products p ON oi.product_id = p.id 
SET oi.product_name = p.name, oi.unit_price = p.price 
WHERE oi.product_name = 'Product' OR oi.unit_price = 0.00; 