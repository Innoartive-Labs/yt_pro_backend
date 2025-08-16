const express = require('express');
const router = express.Router();
const vehiclesController = require('../controllers/vehiclesController');
const { getUploader, cleanupTempFiles } = require('../utils/upload');
const { uploadImage, deleteImage } = require('../utils/cloudinary');

const upload = getUploader('vehicles', 'vehicle_image');

// Create vehicles with Cloudinary upload
router.post('/', upload, async (req, res) => {
    try {
        // Upload image to Cloudinary if provided
        if (req.file) {
            const uploadResult = await uploadImage(req.file, 'vehicles');
            if (uploadResult.success) {
                req.body.vehicle_image = uploadResult.url;
                req.body.cloudinary_public_id = uploadResult.public_id;
            } else {
                return res.status(400).json({ error: 'Image upload failed', details: uploadResult.error });
            }
        }
        
        const result = await vehiclesController.createVehicles(req, res);
        
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

// Get all vehicless
router.get('/', vehiclesController.getAllVehicless);

// Get vehicles by ID
router.get('/:id', vehiclesController.getVehiclesById);

// Update vehicles with Cloudinary upload
router.put('/:id', upload, async (req, res) => {
    try {
        // Get existing vehicles to check for old image
        const existingVehicles = await vehiclesController.getVehiclesById(req, res, true);
        
        // Upload new image to Cloudinary if provided
        if (req.file) {
            const uploadResult = await uploadImage(req.file, 'vehicles');
            if (uploadResult.success) {
                req.body.vehicle_image = uploadResult.url;
                req.body.cloudinary_public_id = uploadResult.public_id;
                
                // Delete old image from Cloudinary if exists
                if (existingVehicles && existingVehicles.cloudinary_public_id) {
                    await deleteImage(existingVehicles.cloudinary_public_id);
                }
            } else {
                return res.status(400).json({ error: 'Image upload failed', details: uploadResult.error });
            }
        }
        
        const result = await vehiclesController.updateVehicles(req, res);
        
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

// Delete vehicles with Cloudinary cleanup
router.delete('/:id', async (req, res) => {
    try {
        // Get vehicles to check for image
        const vehicles = await vehiclesController.getVehiclesById(req, res, true);
        
        // Delete image from Cloudinary if exists
        if (vehicles && vehicles.cloudinary_public_id) {
            await deleteImage(vehicles.cloudinary_public_id);
        }
        
        return await vehiclesController.deleteVehicles(req, res);
    } catch (error) {
        throw error;
    }
});

module.exports = router;