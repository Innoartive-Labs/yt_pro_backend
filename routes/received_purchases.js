const express = require('express');
const router = express.Router();
const receivedPurchasesController = require('../controllers/receivedPurchasesController');
const auth = require('../middleware/auth');
const getUploader = require('../utils/upload');

// Configure upload for multiple files
const upload = getUploader('received_purchases', ['vehicle_image', 'delivery_slip_image']);

// Apply authentication middleware to all routes
router.use(auth);

// CRUD operations
router.post('/', upload, receivedPurchasesController.createReceivedPurchase);
router.get('/', receivedPurchasesController.getAllReceivedPurchases);
router.get('/purchase-order/:purchase_order_id', receivedPurchasesController.getReceivedPurchasesByPurchaseOrder);
router.get('/:id', receivedPurchasesController.getReceivedPurchaseById);
router.put('/:id', upload, receivedPurchasesController.updateReceivedPurchase);
router.delete('/:id', receivedPurchasesController.deleteReceivedPurchase);

module.exports = router; 