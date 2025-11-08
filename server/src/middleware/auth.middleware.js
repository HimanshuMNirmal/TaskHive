const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

/**
 * authenticate
 * - verify JWT
 * - load full user from DB (without password)
 * - attach req.user (full doc)
 *
 * If token missing => 401
 */
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

function authorize(...allowedRoles) {
  let opts = {};
  if (allowedRoles.length && typeof allowedRoles[allowedRoles.length - 1] === 'object') {
    opts = allowedRoles.pop();
  }

  return async (req, res, next) => {
    if (!req.user) {
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
      } catch (err) {
        console.error('Auth error (inline):', err.message);
        return res.status(401).json({ message: 'Unauthorized: invalid token' });
      }
    }

    if (opts.checkOwnership) {
      if (typeof req.isOwner === 'function') {
        try {
          const ownerResult = await Promise.resolve(req.isOwner());
          if (ownerResult) return next();
        } catch (err) {
          console.error('req.isOwner() threw:', err);
        }
      }
    }

    if (!allowedRoles || allowedRoles.length === 0) return next();

    const userRole = req.user && req.user.role;
    if (!userRole) return res.status(403).json({ message: 'Forbidden: role missing' });

    if (allowedRoles.includes(userRole)) return next();

    if (userRole === 'superadmin') return next();

    return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
  };
}

module.exports = {
  authenticate,
  authorize
};
