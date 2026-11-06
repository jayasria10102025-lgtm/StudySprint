const { body, param } = require('express-validator');

const createGoalValidation = [
  body('subjectId')
    .notEmpty().withMessage('Subject ID is required')
    .isMongoId().withMessage('Invalid subject ID format'),
  body('title')
    .trim()
    .notEmpty().withMessage('Goal title is required')
    .isLength({ min: 1, max: 120 }).withMessage('Goal title must be between 1 and 120 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('plannedDuration')
    .notEmpty().withMessage('Planned duration in minutes is required')
    .isInt({ min: 1 }).withMessage('Planned duration must be at least 1 minute'),
  body('targetDate')
    .notEmpty().withMessage('Target date is required')
    .isISO8601().withMessage('Target date must be a valid ISO date'),
  body('goalType')
    .optional()
    .isIn(['daily', 'weekly', 'custom']).withMessage('Goal type must be daily, weekly, or custom')
];

const updateGoalValidation = [
  param('id')
    .isMongoId().withMessage('Invalid goal ID format'),
  body('subjectId')
    .optional()
    .isMongoId().withMessage('Invalid subject ID format'),
  body('title')
    .optional()
    .trim()
    .notEmpty().withMessage('Goal title cannot be empty')
    .isLength({ min: 1, max: 120 }).withMessage('Goal title must be between 1 and 120 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('plannedDuration')
    .optional()
    .isInt({ min: 1 }).withMessage('Planned duration must be at least 1 minute'),
  body('targetDate')
    .optional()
    .isISO8601().withMessage('Target date must be a valid ISO date'),
  body('goalType')
    .optional()
    .isIn(['daily', 'weekly', 'custom']).withMessage('Goal type must be daily, weekly, or custom'),
  body('status')
    .optional()
    .isIn(['in_progress', 'completed']).withMessage('Status must be in_progress or completed')
];

module.exports = {
  createGoalValidation,
  updateGoalValidation
};
