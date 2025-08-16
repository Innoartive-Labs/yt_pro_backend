const express = require('express');
const router = express.Router();
const product_pricesController = require('../controllers/product_pricesController');

router.post('/', product_pricesController.createProduct_prices);
router.get('/', product_pricesController.getAllProduct_pricess);
router.get('/:id', product_pricesController.getProduct_pricesById);
router.put('/:id', product_pricesController.updateProduct_prices);
router.delete('/:id', product_pricesController.deleteProduct_prices);

module.exports = router;