-- Migration script to update received_purchases table for multiple images
-- Run this script to update your existing database

-- Step 1: Add new columns
ALTER TABLE received_purchases 
ADD COLUMN vehicle_images_new TEXT NULL AFTER vehicle_image,
ADD COLUMN delivery_slip_images_new TEXT NULL AFTER delivery_slip_image;

-- Step 2: Copy existing data to new columns (if any existing data exists)
UPDATE received_purchases 
SET vehicle_images_new = vehicle_image 
WHERE vehicle_image IS NOT NULL AND vehicle_image != '';

UPDATE received_purchases 
SET delivery_slip_images_new = delivery_slip_image 
WHERE delivery_slip_image IS NOT NULL AND delivery_slip_image != '';

-- Step 3: Drop old columns
ALTER TABLE received_purchases 
DROP COLUMN vehicle_image,
DROP COLUMN delivery_slip_image;

-- Step 4: Rename new columns to final names
ALTER TABLE received_purchases 
CHANGE COLUMN vehicle_images_new vehicle_images TEXT NULL,
CHANGE COLUMN delivery_slip_images_new delivery_slip_images TEXT NULL;

-- Verify the changes
DESCRIBE received_purchases;
