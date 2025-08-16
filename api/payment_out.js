const express = require('express');
const router = express.Router();
const payment_outController = require('../controllers/payment_outController');

router.post('/', payment_outController.createPayment_out);
router.get('/', payment_outController.getAllPayment_outs);
router.get('/:id', payment_outController.getPayment_outById);
router.put('/:id', payment_outController.updatePayment_out);
router.delete('/:id', payment_outController.deletePayment_out);

module.exports = router;