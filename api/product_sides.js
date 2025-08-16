const express = require('express');
const router = express.Router();
const product_sidesController = require('../controllers/product_sidesController');

router.post('/', product_sidesController.createProduct_sides);
router.get('/', product_sidesController.getAllProduct_sidess);
router.get('/:id', product_sidesController.getProduct_sidesById);
router.put('/:id', product_sidesController.updateProduct_sides);
router.delete('/:id', product_sidesController.deleteProduct_sides);

module.exports = router;