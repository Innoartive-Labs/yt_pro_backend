const express = require('express');
const router = express.Router();
const sales_ordersController = require('../controllers/sales_ordersController');

router.post('/', sales_ordersController.createSales_orders);
router.get('/', sales_ordersController.getAllSales_orderss);
router.get('/:id', sales_ordersController.getSales_ordersById);
router.put('/:id', sales_ordersController.updateSales_orders);
router.delete('/:id', sales_ordersController.deleteSales_orders);

module.exports = router;