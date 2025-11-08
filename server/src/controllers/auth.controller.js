const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/user.model');

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  FRONTEND_URL,
  JWT_EXPIRES_IN,
  PASSWORD_RESET_EXPIRES,
  JWT_SECRET
} = process.env;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
    }
});

async function sendMail( { to, subject, text, html } ){
    if (!transporter) throw new Error("Email transporter not configured");
    const info = await transporter.sendMail({
        from: `"TaskHive" <${SMTP_USER}>`,
        to,
        subject,
        text,
        html
    });
    return info;
}

exports.registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' });
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
    message: 'User registered successfully',
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

  const token = jwt.sign(
    { userId: user._id },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  res.status(200).json({
    message: 'Login successful',
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.json({ message: 'If the email exists, a reset link has been sent.' });
  }

  const resetToken = jwt.sign(
    { userId: String(user._id), purpose: 'password_reset' },
    JWT_SECRET,
    { expiresIn: PASSWORD_RESET_EXPIRES || '15m' }
  );

  const resetUrl = `${FRONTEND_URL.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(resetToken)}`;

  const subject = 'TaskHive — Password reset';
  const html = `
    <p>Hi ${user.name || ''},</p>
    <p>You requested a password reset. Click the link below to set a new password. This link expires in ${PASSWORD_RESET_EXPIRES || '15 minutes'}.</p>
    <p><a href="${resetUrl}">Reset password</a></p>
    <p>If you did not request this, ignore this email.</p>
    <p>— TaskHive</p>
  `;
  const text = `Reset your password: ${resetUrl}`;

  try {
    await sendMail({ to: email, subject, html, text });
    return res.json({ message: 'If the email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('forgotPassword sendMail error:', err);
    return res.status(500).json({ message: 'Failed to send reset email' });
  }
};
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.error('resetPassword verify error:', err);
    return res.status(400).json({ message: 'Invalid or expired token' });
  }

  if (payload.purpose !== 'password_reset') {
    return res.status(400).json({ message: 'Invalid token purpose' });
  }

  const user = await User.findById(payload.userId);
  if (!user) {
    return res.status(400).json({ message: 'Invalid token' });
  }

  user.password = newPassword;
  await user.save();

  const authToken = jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return res.json({ message: 'Password reset successful', token: authToken });
};
