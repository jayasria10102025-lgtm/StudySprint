const express = require('express');
const {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal
} = require('../controllers/goalController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  createGoalValidation,
  updateGoalValidation
} = require('../validators/goalValidators');
const { idParamValidation } = require('../validators/subjectValidators');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getGoals)
  .post(createGoalValidation, validate, createGoal);

router
  .route('/:id')
  .put(updateGoalValidation, validate, updateGoal)
  .delete(idParamValidation, validate, deleteGoal);

module.exports = router;

