const express = require('express');
const {
  getOverview,
  getDaily,
  getWeekly,
  getMonthly,
  getSubjectDistribution,
  getPlannedVsCompleted
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/overview', getOverview);
router.get('/daily', getDaily);
router.get('/weekly', getWeekly);
router.get('/monthly', getMonthly);
router.get('/subjects', getSubjectDistribution);
router.get('/planned-vs-completed', getPlannedVsCompleted);

module.exports = router;

