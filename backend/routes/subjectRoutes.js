const express = require('express');
const {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject
} = require('../controllers/subjectController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  createSubjectValidation,
  updateSubjectValidation,
  idParamValidation
} = require('../validators/subjectValidators');

const router = express.Router();

router.use(protect); // All subject routes require authentication

router
  .route('/')
  .get(getSubjects)
  .post(createSubjectValidation, validate, createSubject);

router
  .route('/:id')
  .get(idParamValidation, validate, getSubjectById)
  .put(updateSubjectValidation, validate, updateSubject)
  .patch(updateSubjectValidation, validate, updateSubject)
  .delete(idParamValidation, validate, deleteSubject);

module.exports = router;

