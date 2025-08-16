const express = require('express');
const router = express.Router();
const returned_productsController = require('../controllers/returned_productsController');
const { getUploader, cleanupTempFiles } = require('../utils/upload');
const { uploadImage, deleteImage } = require('../utils/cloudinary');

const upload = getUploader('returned_products', 'returned_product_image');

// Create returned_products with Cloudinary upload
router.post('/', upload, async (req, res) => {
    try {
        // Upload image to Cloudinary if provided
        if (req.file) {
            const uploadResult = await uploadImage(req.file, 'returned_products');
            if (uploadResult.success) {
                req.body.returned_product_image = uploadResult.url;
                req.body.cloudinary_public_id = uploadResult.public_id;
            } else {
                return res.status(400).json({ error: 'Image upload failed', details: uploadResult.error });
            }
        }
        
        const result = await returned_productsController.createReturned_products(req, res);
        
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

// Get all returned_productss
router.get('/', returned_productsController.getAllReturned_productss);

// Get returned_products by ID
router.get('/:id', returned_productsController.getReturned_productsById);

// Update returned_products with Cloudinary upload
router.put('/:id', upload, async (req, res) => {
    try {
        // Get existing returned_products to check for old image
        const existingReturned_products = await returned_productsController.getReturned_productsById(req, res, true);
        
        // Upload new image to Cloudinary if provided
        if (req.file) {
            const uploadResult = await uploadImage(req.file, 'returned_products');
            if (uploadResult.success) {
                req.body.returned_product_image = uploadResult.url;
                req.body.cloudinary_public_id = uploadResult.public_id;
                
                // Delete old image from Cloudinary if exists
                if (existingReturned_products && existingReturned_products.cloudinary_public_id) {
                    await deleteImage(existingReturned_products.cloudinary_public_id);
                }
            } else {
                return res.status(400).json({ error: 'Image upload failed', details: uploadResult.error });
            }
        }
        
        const result = await returned_productsController.updateReturned_products(req, res);
        
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

// Delete returned_products with Cloudinary cleanup
router.delete('/:id', async (req, res) => {
    try {
        // Get returned_products to check for image
        const returned_products = await returned_productsController.getReturned_productsById(req, res, true);
        
        // Delete image from Cloudinary if exists
        if (returned_products && returned_products.cloudinary_public_id) {
            await deleteImage(returned_products.cloudinary_public_id);
        }
        
        return await returned_productsController.deleteReturned_products(req, res);
    } catch (error) {
        throw error;
    }
});

module.exports = router;