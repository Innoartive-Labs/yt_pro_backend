const express = require('express');
const router = express.Router();
const companiesController = require('../controllers/companiesController');

router.post('/', companiesController.createCompanies);
router.get('/', companiesController.getAllCompaniess);
router.get('/:id', companiesController.getCompaniesById);
router.put('/:id', companiesController.updateCompanies);
router.delete('/:id', companiesController.deleteCompanies);

module.exports = router;