const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const emailService = require('../services/email.service');

const {
  CLIENT_URL,
  JWT_EXPIRES_IN,
  PASSWORD_RESET_EXPIRES,
  JWT_SECRET
} = process.env;

exports.registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User already exists'
    });
  }

  const user = new User({
    name,
    email,
    password: password,
    role,
    settings: { notifications: true, emailPreferences: {} }
  });
  await user.save();

  const token = jwt.sign(
    { userId: user._id },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    }
  });
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  const token = jwt.sign(
    { userId: user._id },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    }
  });
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  
  if (!user) {
    return res.json({
      success: true,
      message: 'If the email exists, a reset link has been sent.'
    });
  }

  const resetToken = jwt.sign(
    { userId: String(user._id), purpose: 'password_reset' },
    JWT_SECRET,
    { expiresIn: PASSWORD_RESET_EXPIRES || '15m' }
  );

  const resetUrl = `${CLIENT_URL.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(resetToken)}`;

  await emailService.sendPasswordResetEmail({
    to: email,
    name: user.name,
    resetUrl: resetUrl,
    expiresIn: PASSWORD_RESET_EXPIRES || '15 minutes'
  });

  return res.json({
    success: true,
    message: 'If the email exists, a reset link has been sent.'
  });
};
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  let payload;
  payload = jwt.verify(token, JWT_SECRET);

  if (payload.purpose !== 'password_reset') {
    return res.status(400).json({
      success: false,
      message: 'Invalid token purpose'
    });
  }

  const user = await User.findById(payload.userId);
  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid token'
    });
  }

  user.password = newPassword;
  await user.save();

  const authToken = jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return res.json({
    success: true,
    message: 'Password reset successful',
    data: { token: authToken }
  });
};
