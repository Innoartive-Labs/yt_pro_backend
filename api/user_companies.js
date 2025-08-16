const express = require('express');
const router = express.Router();
const user_companiesController = require('../controllers/user_companiesController');

router.post('/', user_companiesController.createUser_companies);
router.get('/', user_companiesController.getAllUser_companiess);
router.get('/:id', user_companiesController.getUser_companiesById);
router.put('/:id', user_companiesController.updateUser_companies);
router.delete('/:id', user_companiesController.deleteUser_companies);

module.exports = router;