const express = require('express');
const router = express.Router();
const salesOrdersController = require('../controllers/salesOrdersController');
const auth = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(auth);

// CRUD operations
router.post('/', salesOrdersController.createSalesOrder);
router.get('/', salesOrdersController.getAllSalesOrders);
router.get('/status/:status', salesOrdersController.getSalesOrdersByStatus);
router.get('/customer/:customer_id', salesOrdersController.getSalesOrdersByCustomer);
router.get('/delivery', salesOrdersController.getSalesOrdersWithDeliveryInfo);
router.get('/:id', salesOrdersController.getSalesOrderById);
router.put('/:id', salesOrdersController.updateSalesOrder);
router.delete('/:id', salesOrdersController.deleteSalesOrder);

// Status update endpoint
router.patch('/:id/status', salesOrdersController.updateSalesOrderStatus);

module.exports = router; 