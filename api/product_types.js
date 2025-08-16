const express = require('express');
const router = express.Router();
const product_typesController = require('../controllers/product_typesController');

router.post('/', product_typesController.createProduct_types);
router.get('/', product_typesController.getAllProduct_typess);
router.get('/:id', product_typesController.getProduct_typesById);
router.put('/:id', product_typesController.updateProduct_types);
router.delete('/:id', product_typesController.deleteProduct_types);

module.exports = router;