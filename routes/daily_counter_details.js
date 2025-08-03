const express = require('express');
const router = express.Router();
const dailyCounterDetailsController = require('../controllers/dailyCounterDetailsController');

router.post('/', dailyCounterDetailsController.createDailyCounterDetail);
router.get('/', dailyCounterDetailsController.getAllDailyCounterDetails);
router.get('/:id', dailyCounterDetailsController.getDailyCounterDetailById);
router.get('/counter/:counterId', dailyCounterDetailsController.getDailyCounterDetailsByCounter);
router.get('/filter/by-date', dailyCounterDetailsController.getDailyCounterDetailsByDate);
router.get('/filter/by-type', dailyCounterDetailsController.getDailyCounterDetailsByType);
router.put('/:id', dailyCounterDetailsController.updateDailyCounterDetail);
router.delete('/:id', dailyCounterDetailsController.deleteDailyCounterDetail);

module.exports = router; 