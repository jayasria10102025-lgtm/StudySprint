const express = require('express');
const {
  getSessions,
  getActiveSession,
  startSession,
  pauseSession,
  resumeSession,
  completeSession,
  cancelSession
} = require('../controllers/sessionController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  startSessionValidation,
  sessionActionValidation
} = require('../validators/sessionValidators');

const router = express.Router();

router.use(protect);

router.get('/', getSessions);
router.get('/active', getActiveSession);
router.post('/start', startSessionValidation, validate, startSession);
router.patch('/:id/pause', sessionActionValidation, validate, pauseSession);
router.patch('/:id/resume', sessionActionValidation, validate, resumeSession);
router.patch('/:id/complete', sessionActionValidation, validate, completeSession);
router.patch('/:id/cancel', sessionActionValidation, validate, cancelSession);

module.exports = router;
