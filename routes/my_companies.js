const express = require('express');
const router = express.Router();
const myCompaniesController = require('../controllers/myCompaniesController');

router.post('/', myCompaniesController.createCompany);
router.get('/', myCompaniesController.getAllCompanies);
router.get('/:id', myCompaniesController.getCompanyById);
router.put('/:id', myCompaniesController.updateCompany);
router.delete('/:id', myCompaniesController.deleteCompany);

module.exports = router; 