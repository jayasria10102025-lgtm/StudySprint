const express = require('express');
const {
  getNotes,
  createNote,
  updateNote,
  deleteNote
} = require('../controllers/noteController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  createNoteValidation,
  updateNoteValidation
} = require('../validators/noteValidators');
const { idParamValidation } = require('../validators/subjectValidators');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getNotes)
  .post(createNoteValidation, validate, createNote);

router
  .route('/:id')
  .put(updateNoteValidation, validate, updateNote)
  .delete(idParamValidation, validate, deleteNote);

module.exports = router;

