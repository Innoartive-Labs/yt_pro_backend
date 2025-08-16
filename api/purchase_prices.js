const express = require('express');
const router = express.Router();
const purchase_pricesController = require('../controllers/purchase_pricesController');

router.post('/', purchase_pricesController.createPurchase_prices);
router.get('/', purchase_pricesController.getAllPurchase_pricess);
router.get('/:id', purchase_pricesController.getPurchase_pricesById);
router.put('/:id', purchase_pricesController.updatePurchase_prices);
router.delete('/:id', purchase_pricesController.deletePurchase_prices);

module.exports = router;