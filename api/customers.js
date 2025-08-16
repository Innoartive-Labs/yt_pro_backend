const express = require('express');
const router = express.Router();
const customersController = require('../controllers/customersController');
const { getUploader, cleanupTempFiles } = require('../utils/upload');
const { uploadImage, deleteImage } = require('../utils/cloudinary');

const upload = getUploader('customers', 'customer_image');

// Create customers with Cloudinary upload
router.post('/', upload, async (req, res) => {
    try {
        // Upload image to Cloudinary if provided
        if (req.file) {
            const uploadResult = await uploadImage(req.file, 'customers');
            if (uploadResult.success) {
                req.body.customer_image = uploadResult.url;
                req.body.cloudinary_public_id = uploadResult.public_id;
            } else {
                return res.status(400).json({ error: 'Image upload failed', details: uploadResult.error });
            }
        }
        
        const result = await customersController.createCustomers(req, res);
        
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

// Get all customerss
router.get('/', customersController.getAllCustomerss);

// Get customers by ID
router.get('/:id', customersController.getCustomersById);

// Update customers with Cloudinary upload
router.put('/:id', upload, async (req, res) => {
    try {
        // Get existing customers to check for old image
        const existingCustomers = await customersController.getCustomersById(req, res, true);
        
        // Upload new image to Cloudinary if provided
        if (req.file) {
            const uploadResult = await uploadImage(req.file, 'customers');
            if (uploadResult.success) {
                req.body.customer_image = uploadResult.url;
                req.body.cloudinary_public_id = uploadResult.public_id;
                
                // Delete old image from Cloudinary if exists
                if (existingCustomers && existingCustomers.cloudinary_public_id) {
                    await deleteImage(existingCustomers.cloudinary_public_id);
                }
            } else {
                return res.status(400).json({ error: 'Image upload failed', details: uploadResult.error });
            }
        }
        
        const result = await customersController.updateCustomers(req, res);
        
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

// Delete customers with Cloudinary cleanup
router.delete('/:id', async (req, res) => {
    try {
        // Get customers to check for image
        const customers = await customersController.getCustomersById(req, res, true);
        
        // Delete image from Cloudinary if exists
        if (customers && customers.cloudinary_public_id) {
            await deleteImage(customers.cloudinary_public_id);
        }
        
        return await customersController.deleteCustomers(req, res);
    } catch (error) {
        throw error;
    }
});

module.exports = router;