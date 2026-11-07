const { body, param } = require('express-validator');

const startSessionValidation = [
  body('subjectId')
    .notEmpty().withMessage('Subject ID is required')
    .isMongoId().withMessage('Invalid subject ID format'),
  body('goalId')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId().withMessage('Invalid goal ID format'),
  body('title')
    .trim()
    .notEmpty().withMessage('Session title is required')
    .isLength({ min: 1, max: 120 }).withMessage('Session title must be between 1 and 120 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters')
];

const sessionActionValidation = [
  param('id')
    .isMongoId().withMessage('Invalid session ID format')
];

module.exports = {
  startSessionValidation,
  sessionActionValidation
};

