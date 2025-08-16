const express = require('express');
const router = express.Router();
const accessible_modulesController = require('../controllers/accessible_modulesController');

router.post('/', accessible_modulesController.createAccessible_modules);
router.get('/', accessible_modulesController.getAllAccessible_moduless);
router.get('/:id', accessible_modulesController.getAccessible_modulesById);
router.put('/:id', accessible_modulesController.updateAccessible_modules);
router.delete('/:id', accessible_modulesController.deleteAccessible_modules);

module.exports = router;