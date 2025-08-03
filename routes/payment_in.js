const express = require('express');
const router = express.Router();
const paymentInController = require('../controllers/paymentInController');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// Create payment in
router.post('/', paymentInController.createPaymentIn);

// Get all payments in (with optional company filter)
router.get('/', paymentInController.getAllPaymentsIn);

// Get payment in by ID
router.get('/:id', paymentInController.getPaymentInById);

// Update payment in
router.put('/:id', paymentInController.updatePaymentIn);

// Delete payment in (soft delete)
router.delete('/:id', paymentInController.deletePaymentIn);

// Get payments in by company
router.get('/company/:companyId', paymentInController.getPaymentsInByCompany);

module.exports = router; 