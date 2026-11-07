const { body, param } = require('express-validator');

const createSubjectValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Subject name is required')
    .isLength({ min: 1, max: 80 }).withMessage('Subject name must be between 1 and 80 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('Description cannot exceed 300 characters'),
  body('color')
    .optional()
    .trim()
    .matches(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).withMessage('Color must be a valid hex code')
];

const updateSubjectValidation = [
  param('id')
    .isMongoId().withMessage('Invalid subject ID format'),
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Subject name cannot be empty')
    .isLength({ min: 1, max: 80 }).withMessage('Subject name must be between 1 and 80 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('Description cannot exceed 300 characters'),
  body('color')
    .optional()
    .trim()
    .matches(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).withMessage('Color must be a valid hex code')
];

const idParamValidation = [
  param('id')
    .isMongoId().withMessage('Invalid ID format')
];

module.exports = {
  createSubjectValidation,
  updateSubjectValidation,
  idParamValidation
};

