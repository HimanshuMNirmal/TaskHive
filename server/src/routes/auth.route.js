const express = require('express');
const { body, validationResult } = require('express-validator');

const router = express.Router();

const { registerUser, loginUser, forgotPassword, resetPassword } = require('../controllers/auth.controller');

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
}

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('role').optional().isIn(['admin', 'manager','member']).withMessage('Invalid role')
  ],
  handleValidation,                
  registerUser
);

router.post(
    '/login',
    [
        body('email').isEmail().withMessage('Valid email is require'),
        body('password').notEmpty().withMessage('Password is required'),
    ],
    handleValidation,
    loginUser
);

router.post(
    '/forgot-password',
    [
        body('email').isEmail().withMessage('Valid email is required'),
    ],
    handleValidation,
    forgotPassword
)

router.post(
    '/reset-password',
    [
        body('token').notEmpty().withMessage("Token is required"),
        body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
    ],
    handleValidation,
    resetPassword
)
module.exports = router;
