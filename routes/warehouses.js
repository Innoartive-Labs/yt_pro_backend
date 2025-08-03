const express = require('express');
const router = express.Router();
const warehousesController = require('../controllers/warehousesController');

router.post('/', warehousesController.createWarehouse);
router.get('/', warehousesController.getAllWarehouses);
router.get('/:id', warehousesController.getWarehouseById);
router.put('/:id', warehousesController.updateWarehouse);
router.delete('/:id', warehousesController.deleteWarehouse);

module.exports = router; 