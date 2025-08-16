const express = require('express');
const router = express.Router();
const received_productsController = require('../controllers/received_productsController');
const { getUploader, cleanupTempFiles } = require('../utils/upload');
const { uploadImage, deleteImage } = require('../utils/cloudinary');

const upload = getUploader('received_products', 'received_product_image');

// Create received_products with Cloudinary upload
router.post('/', upload, async (req, res) => {
    try {
        // Upload image to Cloudinary if provided
        if (req.file) {
            const uploadResult = await uploadImage(req.file, 'received_products');
            if (uploadResult.success) {
                req.body.received_product_image = uploadResult.url;
                req.body.cloudinary_public_id = uploadResult.public_id;
            } else {
                return res.status(400).json({ error: 'Image upload failed', details: uploadResult.error });
            }
        }
        
        const result = await received_productsController.createReceived_products(req, res);
        
        // Clean up temp files
        if (req.file) {
            cleanupTempFiles(req.file);
        }
        
        return result;
    } catch (error) {
        // Clean up temp files on error
        if (req.file) {
            cleanupTempFiles(req.file);
        }
        throw error;
    }
});

// Get all received_productss
router.get('/', received_productsController.getAllReceived_productss);

// Get received_products by ID
router.get('/:id', received_productsController.getReceived_productsById);

// Update received_products with Cloudinary upload
router.put('/:id', upload, async (req, res) => {
    try {
        // Get existing received_products to check for old image
        const existingReceived_products = await received_productsController.getReceived_productsById(req, res, true);
        
        // Upload new image to Cloudinary if provided
        if (req.file) {
            const uploadResult = await uploadImage(req.file, 'received_products');
            if (uploadResult.success) {
                req.body.received_product_image = uploadResult.url;
                req.body.cloudinary_public_id = uploadResult.public_id;
                
                // Delete old image from Cloudinary if exists
                if (existingReceived_products && existingReceived_products.cloudinary_public_id) {
                    await deleteImage(existingReceived_products.cloudinary_public_id);
                }
            } else {
                return res.status(400).json({ error: 'Image upload failed', details: uploadResult.error });
            }
        }
        
        const result = await received_productsController.updateReceived_products(req, res);
        
        // Clean up temp files
        if (req.file) {
            cleanupTempFiles(req.file);
        }
        
        return result;
    } catch (error) {
        // Clean up temp files on error
        if (req.file) {
            cleanupTempFiles(req.file);
        }
        throw error;
    }
});

// Delete received_products with Cloudinary cleanup
router.delete('/:id', async (req, res) => {
    try {
        // Get received_products to check for image
        const received_products = await received_productsController.getReceived_productsById(req, res, true);
        
        // Delete image from Cloudinary if exists
        if (received_products && received_products.cloudinary_public_id) {
            await deleteImage(received_products.cloudinary_public_id);
        }
        
        return await received_productsController.deleteReceived_products(req, res);
    } catch (error) {
        throw error;
    }
});

module.exports = router;