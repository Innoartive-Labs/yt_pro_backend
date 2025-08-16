const express = require('express');
const router = express.Router();
const purchase_ordersController = require('../controllers/purchase_ordersController');

router.post('/', purchase_ordersController.createPurchase_orders);
router.get('/', purchase_ordersController.getAllPurchase_orderss);
router.get('/:id', purchase_ordersController.getPurchase_ordersById);
router.put('/:id', purchase_ordersController.updatePurchase_orders);
router.delete('/:id', purchase_ordersController.deletePurchase_orders);

module.exports = router;