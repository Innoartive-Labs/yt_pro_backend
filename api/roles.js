const express = require('express');
const router = express.Router();
const rolesController = require('../controllers/rolesController');

router.post('/', rolesController.createRoles);
router.get('/', rolesController.getAllRoless);
router.get('/:id', rolesController.getRolesById);
router.put('/:id', rolesController.updateRoles);
router.delete('/:id', rolesController.deleteRoles);

module.exports = router;