const express = require('express');
const router = express.Router();
const dailyCounterController = require('../controllers/dailyCounterController');

router.post('/', dailyCounterController.createDailyCounter);
router.get('/', dailyCounterController.getAllDailyCounters);
router.get('/:id', dailyCounterController.getDailyCounterById);
router.get('/company/:companyId', dailyCounterController.getDailyCounterByCompany);
router.get('/full/:id', dailyCounterController.getDailyCounterWithDetails);
router.put('/:id', dailyCounterController.updateDailyCounter);
router.delete('/:id', dailyCounterController.deleteDailyCounter);

module.exports = router; 