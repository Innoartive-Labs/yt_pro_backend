const express = require('express');
const router = express.Router();
const vehiclesController = require('../controllers/vehiclesController');
const getUploader = require('../utils/upload');

const upload = getUploader('vehicles', 'vehicle_image');

router.post('/', upload, vehiclesController.createVehicle);
router.get('/', vehiclesController.getAllVehicles);
router.get('/:id', vehiclesController.getVehicleById);
router.put('/:id', upload, vehiclesController.updateVehicle);
router.delete('/:id', vehiclesController.deleteVehicle);

module.exports = router; 