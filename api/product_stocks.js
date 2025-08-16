const express = require('express');
const router = express.Router();
const product_stocksController = require('../controllers/product_stocksController');

router.post('/', product_stocksController.createProduct_stocks);
router.get('/', product_stocksController.getAllProduct_stockss);
router.get('/:id', product_stocksController.getProduct_stocksById);
router.put('/:id', product_stocksController.updateProduct_stocks);
router.delete('/:id', product_stocksController.deleteProduct_stocks);

module.exports = router;