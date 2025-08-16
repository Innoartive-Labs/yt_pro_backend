const express = require('express');
const router = express.Router();
const received_purchasesController = require('../controllers/received_purchasesController');
const { getUploader, cleanupTempFiles } = require('../utils/upload');
const { uploadImage, deleteImage } = require('../utils/cloudinary');

const upload = getUploader('received_purchases', 'received_purchase_image');

// Create received_purchases with Cloudinary upload
router.post('/', upload, async (req, res) => {
    try {
        // Upload image to Cloudinary if provided
        if (req.file) {
            const uploadResult = await uploadImage(req.file, 'received_purchases');
            if (uploadResult.success) {
                req.body.received_purchase_image = uploadResult.url;
                req.body.cloudinary_public_id = uploadResult.public_id;
            } else {
                return res.status(400).json({ error: 'Image upload failed', details: uploadResult.error });
            }
        }
        
        const result = await received_purchasesController.createReceived_purchases(req, res);
        
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

// Get all received_purchasess
router.get('/', received_purchasesController.getAllReceived_purchasess);

// Get received_purchases by ID
router.get('/:id', received_purchasesController.getReceived_purchasesById);

// Update received_purchases with Cloudinary upload
router.put('/:id', upload, async (req, res) => {
    try {
        // Get existing received_purchases to check for old image
        const existingReceived_purchases = await received_purchasesController.getReceived_purchasesById(req, res, true);
        
        // Upload new image to Cloudinary if provided
        if (req.file) {
            const uploadResult = await uploadImage(req.file, 'received_purchases');
            if (uploadResult.success) {
                req.body.received_purchase_image = uploadResult.url;
                req.body.cloudinary_public_id = uploadResult.public_id;
                
                // Delete old image from Cloudinary if exists
                if (existingReceived_purchases && existingReceived_purchases.cloudinary_public_id) {
                    await deleteImage(existingReceived_purchases.cloudinary_public_id);
                }
            } else {
                return res.status(400).json({ error: 'Image upload failed', details: uploadResult.error });
            }
        }
        
        const result = await received_purchasesController.updateReceived_purchases(req, res);
        
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

// Delete received_purchases with Cloudinary cleanup
router.delete('/:id', async (req, res) => {
    try {
        // Get received_purchases to check for image
        const received_purchases = await received_purchasesController.getReceived_purchasesById(req, res, true);
        
        // Delete image from Cloudinary if exists
        if (received_purchases && received_purchases.cloudinary_public_id) {
            await deleteImage(received_purchases.cloudinary_public_id);
        }
        
        return await received_purchasesController.deleteReceived_purchases(req, res);
    } catch (error) {
        throw error;
    }
});

module.exports = router;