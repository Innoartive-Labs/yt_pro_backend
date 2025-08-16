const express = require('express');
const router = express.Router();
const driversController = require('../controllers/driversController');

router.post('/', driversController.createDrivers);
router.get('/', driversController.getAllDriverss);
router.get('/:id', driversController.getDriversById);
router.put('/:id', driversController.updateDrivers);
router.delete('/:id', driversController.deleteDrivers);

module.exports = router;