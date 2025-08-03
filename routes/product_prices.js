const express = require('express');
const router = express.Router();
const productPricesController = require('../controllers/productPricesController');

router.post('/', productPricesController.createProductPrice);
router.get('/', productPricesController.getAllProductPrices);
router.get('/:id', productPricesController.getProductPriceById);
router.put('/:id', productPricesController.updateProductPrice);
router.delete('/:id', productPricesController.deleteProductPrice);

module.exports = router; 