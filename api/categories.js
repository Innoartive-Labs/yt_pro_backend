const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/categoriesController');

router.post('/', categoriesController.createCategories);
router.get('/', categoriesController.getAllCategoriess);
router.get('/:id', categoriesController.getCategoriesById);
router.put('/:id', categoriesController.updateCategories);
router.delete('/:id', categoriesController.deleteCategories);

module.exports = router;