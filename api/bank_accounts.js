const express = require('express');
const router = express.Router();
const bank_accountsController = require('../controllers/bank_accountsController');

router.post('/', bank_accountsController.createBank_accounts);
router.get('/', bank_accountsController.getAllBank_accountss);
router.get('/:id', bank_accountsController.getBank_accountsById);
router.put('/:id', bank_accountsController.updateBank_accounts);
router.delete('/:id', bank_accountsController.deleteBank_accounts);

module.exports = router;