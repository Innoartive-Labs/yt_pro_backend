const express = require('express');
const router = express.Router();
const payment_inController = require('../controllers/payment_inController');

router.post('/', payment_inController.createPayment_in);
router.get('/', payment_inController.getAllPayment_ins);
router.get('/:id', payment_inController.getPayment_inById);
router.put('/:id', payment_inController.updatePayment_in);
router.delete('/:id', payment_inController.deletePayment_in);

module.exports = router;