const express = require('express');
const router = express.Router();
const accessibleModulesController = require('../controllers/accessibleModulesController');

router.post('/', accessibleModulesController.createModule);
router.get('/', accessibleModulesController.getAllModules);
router.get('/:id', accessibleModulesController.getModuleById);
router.put('/:id', accessibleModulesController.updateModule);
router.delete('/:id', accessibleModulesController.deleteModule);

module.exports = router; 