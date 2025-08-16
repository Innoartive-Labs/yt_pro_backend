const express = require('express');
const router = express.Router();
const sales_invoicesController = require('../controllers/sales_invoicesController');

router.post('/', sales_invoicesController.createSales_invoices);
router.get('/', sales_invoicesController.getAllSales_invoicess);
router.get('/:id', sales_invoicesController.getSales_invoicesById);
router.put('/:id', sales_invoicesController.updateSales_invoices);
router.delete('/:id', sales_invoicesController.deleteSales_invoices);

module.exports = router;