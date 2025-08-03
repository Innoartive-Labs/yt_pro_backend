const express = require('express');
const router = express.Router();
const productsController = require('../controllers/productsController');
const getUploader = require('../utils/upload');

const upload = getUploader('products', 'product_image');

router.post('/', upload, productsController.createProduct);
router.get('/', productsController.getAllProducts);
router.get('/:id', productsController.getProductById);
router.get('/full/:id', productsController.getProductFullDetails);
router.put('/:id', upload, productsController.updateProduct);
router.delete('/:id', productsController.deleteProduct);

module.exports = router; 