const express = require('express');
const router = express.Router();
const purchasePricesController = require('../controllers/purchasePricesController');

router.post('/', purchasePricesController.createPurchasePrice);
router.get('/', purchasePricesController.getAllPurchasePrices);
router.get('/:id', purchasePricesController.getPurchasePriceById);
router.get('/product/:productId', purchasePricesController.getPurchasePricesByProduct);
router.get('/supplier/:supplierId', purchasePricesController.getPurchasePricesBySupplier);
router.put('/:id', purchasePricesController.updatePurchasePrice);
router.delete('/:id', purchasePricesController.deletePurchasePrice);

module.exports = router;
