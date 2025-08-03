const express = require('express');
const router = express.Router();
const driversController = require('../controllers/driversController');

router.post('/', driversController.createDriver);
router.get('/', driversController.getAllDrivers);
router.get('/:id', driversController.getDriverById);
router.put('/:id', driversController.updateDriver);
router.delete('/:id', driversController.deleteDriver);

module.exports = router; 