-- ALTER TABLE statements to modify existing tables
-- Run these statements in your MySQL database (phpMyAdmin or MySQL command line)

-- ========================================
-- ALTER ORDERS TABLE
-- ========================================

-- Add missing columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS order_number VARCHAR(50) UNIQUE NOT NULL DEFAULT CONCAT('ORD-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(id, 6, '0'));

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS guest_email VARCHAR(100) NULL;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS guest_name VARCHAR(100) NULL;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending';

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending';

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_method ENUM('bank_transfer', 'check_payment', 'cash_on_delivery', 'credit_card', 'paypal') NOT NULL DEFAULT 'cash_on_delivery';

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10,2) DEFAULT 0.00;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) DEFAULT 0.00;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0.00;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'INR';

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS notes TEXT NULL;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- ========================================
-- ALTER ORDER_ITEMS TABLE
-- ========================================

-- Add missing columns to order_items table
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS product_name VARCHAR(255) NOT NULL DEFAULT 'Product';

ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS product_image VARCHAR(500) NULL;

ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- ========================================
-- CREATE SHIPPING_ADDRESSES TABLE
-- ========================================

-- Create shipping_addresses table if it doesn't exist
CREATE TABLE IF NOT EXISTS shipping_addresses (
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

-- Create payment_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS payment_transactions (
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
-- CREATE INDEXES FOR BETTER PERFORMANCE
-- ========================================

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_shipping_addresses_order_id ON shipping_addresses(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);

-- ========================================
-- UPDATE EXISTING DATA (if needed)
-- ========================================

-- Update existing orders to have proper order_number if they don't have one
UPDATE orders 
SET order_number = CONCAT('ORD-', DATE_FORMAT(created_at, '%Y%m%d'), '-', LPAD(id, 6, '0'))
WHERE order_number IS NULL OR order_number = '';

-- Update existing order_items to have product_name if they don't have one
UPDATE order_items oi 
JOIN products p ON oi.product_id = p.id 
SET oi.product_name = p.name 
WHERE oi.product_name IS NULL OR oi.product_name = 'Product';

-- Update existing order_items to have unit_price if they don't have one
UPDATE order_items oi 
JOIN products p ON oi.product_id = p.id 
SET oi.unit_price = p.price 
WHERE oi.unit_price IS NULL OR oi.unit_price = 0.00;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check orders table structure
DESCRIBE orders;

-- Check order_items table structure  
DESCRIBE order_items;

-- Check if new tables were created
SHOW TABLES LIKE 'shipping_addresses';
SHOW TABLES LIKE 'payment_transactions'; 