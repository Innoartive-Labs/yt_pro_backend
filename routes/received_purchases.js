const express = require('express');
const router = express.Router();
const receivedPurchasesController = require('../controllers/receivedPurchasesController');
const auth = require('../middleware/auth');
const getUploader = require('../utils/upload');

// Configure upload for multiple files
const upload = getUploader('received_purchases', ['vehicle_image', 'delivery_slip_image']);

// Test route to debug upload (without auth for testing)
router.post('/test-upload-no-auth', upload, (req, res) => {
    console.log('=== TEST UPLOAD NO AUTH ===');
    console.log('Headers:', req.headers);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Body fields:', Object.keys(req.body));
    console.log('Body content:', req.body);
    console.log('Files:', req.files);
    console.log('File fields:', req.files ? Object.keys(req.files) : 'No files');
    
    res.json({ 
        message: 'Upload test successful',
        headers: req.headers,
        body: req.body,
        files: req.files,
        fileFields: req.files ? Object.keys(req.files) : []
    });
});

// Simple debug route without upload middleware
router.post('/debug', (req, res) => {
    console.log('=== DEBUG ROUTE ===');
    console.log('Headers:', req.headers);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Body fields:', Object.keys(req.body));
    console.log('Body content:', req.body);
    console.log('Files:', req.files);
    
    res.json({
        message: 'Debug route hit',
        headers: req.headers,
        body: req.body,
        files: req.files || 'No files middleware'
    });
});

// Apply authentication middleware to all routes
router.use(auth);

// Test route to debug upload (with auth)
router.post('/test-upload', upload, (req, res) => {
    console.log('=== TEST UPLOAD WITH AUTH ===');
    console.log('Headers:', req.headers);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Body fields:', Object.keys(req.body));
    console.log('Body content:', req.body);
    console.log('Files:', req.files);
    console.log('File fields:', req.files ? Object.keys(req.files) : 'No files');
    
    res.json({ 
        message: 'Upload test successful',
        headers: req.headers,
        body: req.body,
        files: req.files,
        fileFields: req.files ? Object.keys(req.files) : []
    });
});

// CRUD operations
router.post('/', upload, receivedPurchasesController.createReceivedPurchase);
router.get('/', receivedPurchasesController.getAllReceivedPurchases);
router.get('/purchase-order/:purchase_order_id', receivedPurchasesController.getReceivedPurchasesByPurchaseOrder);
router.get('/:id', receivedPurchasesController.getReceivedPurchaseById);
router.put('/:id', upload, receivedPurchasesController.updateReceivedPurchase);
router.delete('/:id', receivedPurchasesController.deleteReceivedPurchase);

module.exports = router; 