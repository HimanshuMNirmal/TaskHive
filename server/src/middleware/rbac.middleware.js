const RBACService = require('../services/rbac.service');

const checkPermission = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const permissions = Array.isArray(requiredPermissions) 
        ? requiredPermissions 
        : [requiredPermissions];

      const userPermissions = await RBACService.getUserPermissions(req.user._id);
      
      const isAdmin = userPermissions.some(p => p.name === 'system:manage');
      if (isAdmin) {
        return next();
      }

      const hasAllPermissions = permissions.every(permission =>
        userPermissions.some(p => p.name === permission)
      );

      if (!hasAllPermissions) {
        return res.status(403).json({ 
          message: 'Insufficient permissions to perform this action' 
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ 
        message: 'Error checking permissions' 
      });
    }
  };
};

const checkOwnership = (getResourceOwner, ownershipPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const ownerId = await getResourceOwner(req);

      if (ownerId && ownerId.toString() === req.user._id.toString()) {
        return next();
      }

      const hasPermission = await RBACService.hasPermission(
        req.user._id, 
        ownershipPermission
      );

      if (!hasPermission) {
        return res.status(403).json({ 
          message: 'Insufficient permissions to access this resource' 
        });
      }

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({ 
        message: 'Error checking resource ownership' 
      });
    }
  };
};

module.exports = {
  checkPermission,
  checkOwnership
};