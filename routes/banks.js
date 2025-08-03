const express = require('express');
const router = express.Router();
const banksController = require('../controllers/banksController');

router.post('/', banksController.createBank);
router.get('/', banksController.getAllBanks);
router.get('/:id', banksController.getBankById);
router.put('/:id', banksController.updateBank);
router.delete('/:id', banksController.deleteBank);

module.exports = router; 