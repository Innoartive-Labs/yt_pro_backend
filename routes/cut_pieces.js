const express = require('express');
const router = express.Router();
const cutPiecesController = require('../controllers/cutPiecesController');
const auth = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(auth);

// Create a new cut piece
router.post('/', cutPiecesController.createCutPiece);

// Get all cut pieces
router.get('/', cutPiecesController.getAllCutPieces);

// Get cut piece by ID
router.get('/:id', cutPiecesController.getCutPieceById);

// Get cut pieces by sales order
router.get('/sales-order/:sales_order_id', cutPiecesController.getCutPiecesBySalesOrder);

// Get cut pieces by warehouse
router.get('/warehouse/:warehouse_id', cutPiecesController.getCutPiecesByWarehouse);

// Get cut pieces by product
router.get('/product/:product_id', cutPiecesController.getCutPiecesByProduct);

// Update cut piece
router.put('/:id', cutPiecesController.updateCutPiece);

// Delete cut piece
router.delete('/:id', cutPiecesController.deleteCutPiece);

module.exports = router; 