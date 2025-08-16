const express = require('express');
const router = express.Router();
const banksController = require('../controllers/banksController');

router.post('/', banksController.createBanks);
router.get('/', banksController.getAllBankss);
router.get('/:id', banksController.getBanksById);
router.put('/:id', banksController.updateBanks);
router.delete('/:id', banksController.deleteBanks);

module.exports = router;