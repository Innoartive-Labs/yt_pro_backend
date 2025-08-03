const express = require('express');
const router = express.Router();
const salesWarehouseMovementsController = require('../controllers/salesWarehouseMovementsController');
const auth = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(auth);

// CRUD operations
router.post('/', salesWarehouseMovementsController.createSalesWarehouseMovement);
router.get('/', salesWarehouseMovementsController.getAllSalesWarehouseMovements);
router.get('/sales-order/:sales_order_id', salesWarehouseMovementsController.getSalesWarehouseMovementsBySalesOrder);
router.get('/warehouse/:warehouse_id', salesWarehouseMovementsController.getSalesWarehouseMovementsByWarehouse);
router.get('/:id', salesWarehouseMovementsController.getSalesWarehouseMovementById);
router.put('/:id', salesWarehouseMovementsController.updateSalesWarehouseMovement);
router.delete('/:id', salesWarehouseMovementsController.deleteSalesWarehouseMovement);

module.exports = router; 