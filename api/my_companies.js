const express = require('express');
const router = express.Router();
const my_companiesController = require('../controllers/my_companiesController');

router.post('/', my_companiesController.createMy_companies);
router.get('/', my_companiesController.getAllMy_companiess);
router.get('/:id', my_companiesController.getMy_companiesById);
router.put('/:id', my_companiesController.updateMy_companies);
router.delete('/:id', my_companiesController.deleteMy_companies);

module.exports = router;