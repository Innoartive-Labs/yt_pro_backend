const express = require('express');
const router = express.Router();
const paymentOutController = require('../controllers/paymentOutController');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// Create payment out
router.post('/', paymentOutController.createPaymentOut);

// Get all payments out (with optional company filter)
router.get('/', paymentOutController.getAllPaymentsOut);

// Get payment out by ID
router.get('/:id', paymentOutController.getPaymentOutById);

// Update payment out
router.put('/:id', paymentOutController.updatePaymentOut);

// Delete payment out (soft delete)
router.delete('/:id', paymentOutController.deletePaymentOut);

// Get payments out by company
router.get('/company/:companyId', paymentOutController.getPaymentsOutByCompany);

module.exports = router; 