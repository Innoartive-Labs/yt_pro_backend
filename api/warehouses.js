const express = require('express');
const router = express.Router();
const warehousesController = require('../controllers/warehousesController');

router.post('/', warehousesController.createWarehouses);
router.get('/', warehousesController.getAllWarehousess);
router.get('/:id', warehousesController.getWarehousesById);
router.put('/:id', warehousesController.updateWarehouses);
router.delete('/:id', warehousesController.deleteWarehouses);

module.exports = router;