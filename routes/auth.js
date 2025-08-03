const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateJWT = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/logout', authController.logout);

module.exports = router; 