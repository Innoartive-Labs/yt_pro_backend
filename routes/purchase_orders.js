const express = require('express');
const router = express.Router();
const purchaseOrdersController = require('../controllers/purchaseOrdersController');
const auth = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(auth);

// CRUD operations
router.post('/', purchaseOrdersController.createPurchaseOrder);
router.get('/', purchaseOrdersController.getAllPurchaseOrders);
router.get('/status/:status', purchaseOrdersController.getPurchaseOrdersByStatus);
router.get('/priority/:priority', purchaseOrdersController.getPurchaseOrdersByPriority);
router.get('/:id', purchaseOrdersController.getPurchaseOrderById);
router.put('/:id', purchaseOrdersController.updatePurchaseOrder);
router.put('/review/:id', purchaseOrdersController.reviewPurchaseOrder);
router.delete('/:id', purchaseOrdersController.deletePurchaseOrder);

// Status and priority update endpoints
router.patch('/:id/status', purchaseOrdersController.updatePurchaseOrderStatus);
router.patch('/:id/priority', purchaseOrdersController.updatePurchaseOrderPriority);

module.exports = router; 