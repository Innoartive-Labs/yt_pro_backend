const express = require('express');
const router = express.Router();
const returnedProductsController = require('../controllers/returnedProductsController');
const auth = require('../middleware/auth');
const getUploader = require('../utils/upload');

// Configure upload for returned image
const upload = getUploader('returned_products', 'returned_image');

// Apply authentication middleware to all routes
router.use(auth);

// CRUD operations
router.post('/', upload, returnedProductsController.createReturnedProduct);
router.get('/', returnedProductsController.getAllReturnedProducts);
router.get('/received-purchase/:received_purchase_id', returnedProductsController.getReturnedProductsByReceivedPurchase);
router.get('/:id', returnedProductsController.getReturnedProductById);
router.put('/:id', upload, returnedProductsController.updateReturnedProduct);
router.delete('/:id', returnedProductsController.deleteReturnedProduct);

module.exports = router; 