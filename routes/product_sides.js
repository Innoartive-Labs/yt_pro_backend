const express = require('express');
const router = express.Router();
const productSidesController = require('../controllers/productSidesController');

router.post('/', productSidesController.createProductSide);
router.get('/', productSidesController.getAllProductSides);
router.get('/:id', productSidesController.getProductSideById);
router.put('/:id', productSidesController.updateProductSide);
router.delete('/:id', productSidesController.deleteProductSide);

module.exports = router; 