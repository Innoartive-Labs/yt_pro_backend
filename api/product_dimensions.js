const express = require('express');
const router = express.Router();
const product_dimensionsController = require('../controllers/product_dimensionsController');

router.post('/', product_dimensionsController.createProduct_dimensions);
router.get('/', product_dimensionsController.getAllProduct_dimensionss);
router.get('/:id', product_dimensionsController.getProduct_dimensionsById);
router.put('/:id', product_dimensionsController.updateProduct_dimensions);
router.delete('/:id', product_dimensionsController.deleteProduct_dimensions);

module.exports = router;