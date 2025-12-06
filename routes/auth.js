const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
  updateProfile
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Validation middleware
const registerValidation = [
  body('name').not().isEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please include a valid email'),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter'),
  body('role').optional().isIn(['buyer', 'manager']).withMessage('Role must be either buyer or manager')
];

const loginValidation = [
  body('email').isEmail().withMessage('Please include a valid email'),
  body('password').not().isEmpty().withMessage('Password is required')
];

// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);

module.exports = router;