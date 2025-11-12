const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { accessLogger } = require('../services/logger.service');
const settingsService = require('../services/settings.service');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.header('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      accessLogger.log(
        null,
        'authentication',
        req.ip,
        'failed: missing token'
      );
      return res.status(401).json({ message: 'Unauthorized: token missing' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      accessLogger.log(
        null,
        'authentication',
        req.ip,
        'error: server misconfiguration'
      );
      console.error('JWT_SECRET not set in env');
      return res.status(500).json({ message: 'Server misconfiguration' });
    }

    const { sessionTimeout } = await settingsService.getSecuritySettings();
    const payload = jwt.verify(token, secret);
    
    const tokenAge = Math.floor((Date.now() - payload.iat * 1000) / 1000);
    if (tokenAge > sessionTimeout) {
      accessLogger.log(
        null,
        'authentication',
        req.ip,
        'failed: token expired'
      );
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized: token expired' 
      });
    }

    const userId = payload.sub || payload.userId || payload.id;
    if (!userId) {
      accessLogger.log(
        null,
        'authentication',
        req.ip,
        'failed: invalid token payload'
      );
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized: invalid token payload' 
      });
    }

    const user = await User.findById(userId)
      .select('-password')
      .populate('organizationId', 'name')
      .populate('role', 'name')
      .lean();
    if (!user) {
      accessLogger.log(
        null,
        'authentication',
        req.ip,
        'failed: user not found'
      );
      return res.status(401).json({ message: 'Unauthorized: user not found' });
    }

    accessLogger.log(
      user,
      'authentication',
      req.ip,
      'success'
    );
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
