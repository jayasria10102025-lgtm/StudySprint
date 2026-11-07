const { body, param } = require('express-validator');

const createNoteValidation = [
  body('subjectId')
    .notEmpty().withMessage('Subject ID is required')
    .isMongoId().withMessage('Invalid subject ID format'),
  body('title')
    .trim()
    .notEmpty().withMessage('Note title is required')
    .isLength({ min: 1, max: 150 }).withMessage('Note title must be between 1 and 150 characters'),
  body('content')
    .trim()
    .notEmpty().withMessage('Note content is required')
];

const updateNoteValidation = [
  param('id')
    .isMongoId().withMessage('Invalid note ID format'),
  body('subjectId')
    .optional()
    .isMongoId().withMessage('Invalid subject ID format'),
  body('title')
    .optional()
    .trim()
    .notEmpty().withMessage('Note title cannot be empty')
    .isLength({ min: 1, max: 150 }).withMessage('Note title must be between 1 and 150 characters'),
  body('content')
    .optional()
    .trim()
    .notEmpty().withMessage('Note content cannot be empty')
];

module.exports = {
  createNoteValidation,
  updateNoteValidation
};

