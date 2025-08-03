const express = require('express');
const router = express.Router();
const userCompaniesController = require('../controllers/userCompaniesController');

router.post('/', userCompaniesController.createUserCompany);
router.get('/', userCompaniesController.getAllUserCompanies);
router.get('/:id', userCompaniesController.getUserCompanyById);
router.put('/:id', userCompaniesController.updateUserCompany);
router.delete('/:id', userCompaniesController.deleteUserCompany);

module.exports = router; 