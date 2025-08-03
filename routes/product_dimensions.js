const express = require('express');
const router = express.Router();
const productDimensionsController = require('../controllers/productDimensionsController');

router.post('/', productDimensionsController.createProductDimension);
router.get('/', productDimensionsController.getAllProductDimensions);
router.get('/:id', productDimensionsController.getProductDimensionById);
router.put('/:id', productDimensionsController.updateProductDimension);
router.delete('/:id', productDimensionsController.deleteProductDimension);

module.exports = router; 