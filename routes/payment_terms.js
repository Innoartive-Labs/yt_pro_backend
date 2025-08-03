const express = require('express');
const router = express.Router();
const paymentTermsController = require('../controllers/paymentTermsController');

router.post('/', paymentTermsController.createPaymentTerm);
router.get('/', paymentTermsController.getAllPaymentTerms);
router.get('/:id', paymentTermsController.getPaymentTermById);
router.put('/:id', paymentTermsController.updatePaymentTerm);
router.delete('/:id', paymentTermsController.deletePaymentTerm);

module.exports = router; 