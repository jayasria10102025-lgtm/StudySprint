const express = require('express');
const { updateProfile, changePassword } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  updateProfileValidation,
  changePasswordValidation
} = require('../validators/userValidators');

const router = express.Router();

router.use(protect);

router.put('/profile', updateProfileValidation, validate, updateProfile);
router.put('/change-password', changePasswordValidation, validate, changePassword);

module.exports = router;

