const RBACService = require('../services/rbac.service');

const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userPermissions = await RBACService.getUserPermissions(req.user._id);
    const isAdmin = userPermissions.some(p => p.name === 'system:manage');

    if (!isAdmin) {
      return res.status(403).json({ 
        message: 'Admin privileges required to access this resource' 
      });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ 
      message: 'Error checking admin permissions' 
    });
  }
};

module.exports = { requireAdmin };