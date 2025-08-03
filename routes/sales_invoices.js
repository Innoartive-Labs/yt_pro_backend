const express = require('express');
const router = express.Router();
const salesInvoicesController = require('../controllers/salesInvoicesController');
const auth = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(auth);

// CRUD operations
router.post('/', salesInvoicesController.createSalesInvoice);
router.get('/', salesInvoicesController.getAllSalesInvoices);
router.get('/orders-with-movements/:sale_order_number', salesInvoicesController.getOrdersWithMovementsBySalesOrderNumber);
router.get('/sales-order/:sales_order_id', salesInvoicesController.getSalesInvoicesBySalesOrder);
router.get('/customer/:customer_id', salesInvoicesController.getSalesInvoicesByCustomer);
router.get('/:id', salesInvoicesController.getSalesInvoiceById);
router.put('/:id', salesInvoicesController.updateSalesInvoice);
router.delete('/:id', salesInvoicesController.deleteSalesInvoice);

// Test route for debugging customer balance updates
router.get('/test-balance/:customer_id', salesInvoicesController.testCustomerBalance);

// Test route for simulating sales invoice creation
router.post('/test-creation', salesInvoicesController.testSalesInvoiceCreation);

module.exports = router; 