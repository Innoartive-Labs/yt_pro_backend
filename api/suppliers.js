const express = require('express');
const router = express.Router();
const suppliersController = require('../controllers/suppliersController');
const { getUploader, cleanupTempFiles } = require('../utils/upload');
const { uploadImage, deleteImage } = require('../utils/cloudinary');

const upload = getUploader('suppliers', 'supplier_image');

// Create suppliers with Cloudinary upload
router.post('/', upload, async (req, res) => {
    try {
        // Upload image to Cloudinary if provided
        if (req.file) {
            const uploadResult = await uploadImage(req.file, 'suppliers');
            if (uploadResult.success) {
                req.body.supplier_image = uploadResult.url;
                req.body.cloudinary_public_id = uploadResult.public_id;
            } else {
                return res.status(400).json({ error: 'Image upload failed', details: uploadResult.error });
            }
        }
        
        const result = await suppliersController.createSuppliers(req, res);
        
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

// Get all supplierss
router.get('/', suppliersController.getAllSupplierss);

// Get suppliers by ID
router.get('/:id', suppliersController.getSuppliersById);

// Update suppliers with Cloudinary upload
router.put('/:id', upload, async (req, res) => {
    try {
        // Get existing suppliers to check for old image
        const existingSuppliers = await suppliersController.getSuppliersById(req, res, true);
        
        // Upload new image to Cloudinary if provided
        if (req.file) {
            const uploadResult = await uploadImage(req.file, 'suppliers');
            if (uploadResult.success) {
                req.body.supplier_image = uploadResult.url;
                req.body.cloudinary_public_id = uploadResult.public_id;
                
                // Delete old image from Cloudinary if exists
                if (existingSuppliers && existingSuppliers.cloudinary_public_id) {
                    await deleteImage(existingSuppliers.cloudinary_public_id);
                }
            } else {
                return res.status(400).json({ error: 'Image upload failed', details: uploadResult.error });
            }
        }
        
        const result = await suppliersController.updateSuppliers(req, res);
        
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

// Delete suppliers with Cloudinary cleanup
router.delete('/:id', async (req, res) => {
    try {
        // Get suppliers to check for image
        const suppliers = await suppliersController.getSuppliersById(req, res, true);
        
        // Delete image from Cloudinary if exists
        if (suppliers && suppliers.cloudinary_public_id) {
            await deleteImage(suppliers.cloudinary_public_id);
        }
        
        return await suppliersController.deleteSuppliers(req, res);
    } catch (error) {
        throw error;
    }
});

module.exports = router;