const express = require('express');
const router = express.Router();
const productsController = require('../controllers/productsController');
const { getUploader, cleanupTempFiles } = require('../utils/upload');
const { uploadImage, deleteImage } = require('../utils/cloudinary');

const upload = getUploader('products', 'product_image');

// Create products with Cloudinary upload
router.post('/', upload, async (req, res) => {
    try {
        // Upload image to Cloudinary if provided
        if (req.file) {
            const uploadResult = await uploadImage(req.file, 'products');
            if (uploadResult.success) {
                req.body.product_image = uploadResult.url;
                req.body.cloudinary_public_id = uploadResult.public_id;
            } else {
                return res.status(400).json({ error: 'Image upload failed', details: uploadResult.error });
            }
        }
        
        const result = await productsController.createProducts(req, res);
        
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

// Get all productss
router.get('/', productsController.getAllProductss);

// Get products by ID
router.get('/:id', productsController.getProductsById);

// Update products with Cloudinary upload
router.put('/:id', upload, async (req, res) => {
    try {
        // Get existing products to check for old image
        const existingProducts = await productsController.getProductsById(req, res, true);
        
        // Upload new image to Cloudinary if provided
        if (req.file) {
            const uploadResult = await uploadImage(req.file, 'products');
            if (uploadResult.success) {
                req.body.product_image = uploadResult.url;
                req.body.cloudinary_public_id = uploadResult.public_id;
                
                // Delete old image from Cloudinary if exists
                if (existingProducts && existingProducts.cloudinary_public_id) {
                    await deleteImage(existingProducts.cloudinary_public_id);
                }
            } else {
                return res.status(400).json({ error: 'Image upload failed', details: uploadResult.error });
            }
        }
        
        const result = await productsController.updateProducts(req, res);
        
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

// Delete products with Cloudinary cleanup
router.delete('/:id', async (req, res) => {
    try {
        // Get products to check for image
        const products = await productsController.getProductsById(req, res, true);
        
        // Delete image from Cloudinary if exists
        if (products && products.cloudinary_public_id) {
            await deleteImage(products.cloudinary_public_id);
        }
        
        return await productsController.deleteProducts(req, res);
    } catch (error) {
        throw error;
    }
});

module.exports = router;