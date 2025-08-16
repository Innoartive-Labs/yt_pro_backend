const express = require('express');
const router = express.Router();
const payment_termsController = require('../controllers/payment_termsController');

router.post('/', payment_termsController.createPayment_terms);
router.get('/', payment_termsController.getAllPayment_termss);
router.get('/:id', payment_termsController.getPayment_termsById);
router.put('/:id', payment_termsController.updatePayment_terms);
router.delete('/:id', payment_termsController.deletePayment_terms);

module.exports = router;