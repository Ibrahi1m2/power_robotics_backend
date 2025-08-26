-- Add cart image fields to orders table
ALTER TABLE orders 
ADD COLUMN unique_id VARCHAR(36) UNIQUE AFTER order_number,
ADD COLUMN cart_image_path VARCHAR(500) AFTER notes,
ADD COLUMN cart_image_url VARCHAR(500) AFTER cart_image_path;

-- Add index for unique_id for faster lookups
CREATE INDEX idx_orders_unique_id ON orders(unique_id); 