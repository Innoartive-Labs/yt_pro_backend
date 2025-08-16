const express = require('express');
const router = express.Router();
const sales_warehouse_movementsController = require('../controllers/sales_warehouse_movementsController');

router.post('/', sales_warehouse_movementsController.createSales_warehouse_movements);
router.get('/', sales_warehouse_movementsController.getAllSales_warehouse_movementss);
router.get('/:id', sales_warehouse_movementsController.getSales_warehouse_movementsById);
router.put('/:id', sales_warehouse_movementsController.updateSales_warehouse_movements);
router.delete('/:id', sales_warehouse_movementsController.deleteSales_warehouse_movements);

module.exports = router;