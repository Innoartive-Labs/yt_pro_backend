const express = require('express');
const router = express.Router();
const bankAccountsController = require('../controllers/bankAccountsController');

router.post('/', bankAccountsController.createBankAccount);
router.get('/', bankAccountsController.getAllBankAccounts);
router.get('/:id', bankAccountsController.getBankAccountById);
router.put('/:id', bankAccountsController.updateBankAccount);
router.delete('/:id', bankAccountsController.deleteBankAccount);

module.exports = router; 