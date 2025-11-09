const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.header('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) return res.status(401).json({ message: 'Unauthorized: token missing' });

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET not set in env');
      return res.status(500).json({ message: 'Server misconfiguration' });
    }

    const payload = jwt.verify(token, secret);
    const userId = payload.sub || payload.userId || payload.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized: invalid token payload' });

    const user = await User.findById(userId).select('-password').lean();
    if (!user) return res.status(401).json({ message: 'Unauthorized: user not found' });

    req.user = user;
    return next();
  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(401).json({ message: 'Unauthorized: invalid token' });
  }
}

module.exports = {
  authenticate
};
