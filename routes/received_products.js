const express = require('express');
const router = express.Router();
const receivedProductsController = require('../controllers/receivedProductsController');
const auth = require('../middleware/auth');
const getUploader = require('../utils/upload');

// Configure upload for invoice image
const upload = getUploader('received_products', 'invoice_image');

// Apply authentication middleware to all routes
router.use(auth);

// CRUD operations
router.post('/', upload, receivedProductsController.createReceivedProduct);
router.get('/', receivedProductsController.getAllReceivedProducts);
router.get('/purchase-order/:purchase_order_id', receivedProductsController.getReceivedProductsByPurchaseOrder);
router.get('/received-purchase/:received_purchase_id', receivedProductsController.getReceivedProductsByReceivedPurchase);
router.get('/:id', receivedProductsController.getReceivedProductById);
router.put('/:id', upload, receivedProductsController.updateReceivedProduct);
router.put('/review/:id', upload, receivedProductsController.updateReceivedProductWithPricing);
router.delete('/:id', receivedProductsController.deleteReceivedProduct);

module.exports = router; 