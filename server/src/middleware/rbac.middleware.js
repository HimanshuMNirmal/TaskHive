const RBACService = require('../services/rbac.service');
const ActivityLog = require('../models/activityLog.model');

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
        await ActivityLog.create({
          userId: req.user._id,
          organizationId: req.user.organizationId,
          action: 'permission_denied',
          entityType: 'system',
          details: {
            requiredPermissions: permissions,
            endpoint: req.originalUrl,
            method: req.method
          }
        }).catch(err => console.error('Failed to log permission denial:', err));

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
        console.log(`[RBAC] Ownership check failed for user ${req.user._id} - required permission: ${ownershipPermission}`);
        
        await ActivityLog.create({
          userId: req.user._id,
          organizationId: req.user.organizationId,
          action: 'permission_denied',
          entityType: 'resource',
          details: {
            requiredPermission: ownershipPermission,
            endpoint: req.originalUrl,
            method: req.method,
            checkType: 'ownership'
          }
        }).catch(err => console.error('Failed to log ownership denial:', err));

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

const checkResourcePermission = (requiredPermissions, options = {}) => {
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

      const hasPermission = permissions.every(permission =>
        userPermissions.some(p => p.name === permission)
      );

      if (!hasPermission) {
        console.log(`[RBAC] Basic permission check failed for user ${req.user._id} - required permissions: ${permissions.join(', ')}`);
        
        await ActivityLog.create({
          userId: req.user._id,
          organizationId: req.user.organizationId,
          action: 'permission_denied',
          entityType: 'resource',
          details: {
            requiredPermissions: permissions,
            endpoint: req.originalUrl,
            method: req.method,
            checkType: 'basic'
          }
        }).catch(err => console.error('Failed to log resource permission denial:', err));

        return res.status(403).json({ 
          message: 'Insufficient permissions to perform this action' 
        });
      }

      if (options.checkCreator) {
        const getCreator = options.getCreator;
        if (getCreator) {
          const ownerId = await getCreator(req);
          if (ownerId && ownerId.toString() !== req.user._id.toString()) {
            const hasManagePermission = userPermissions.some(p => 
              p.name.includes(':manage')
            );
            if (!hasManagePermission) {
              console.log(`[RBAC] Creator check failed for user ${req.user._id} - user is not the creator and lacks manage permission`);
              
              await ActivityLog.create({
                userId: req.user._id,
                organizationId: req.user.organizationId,
                action: 'permission_denied',
                entityType: 'resource',
                details: {
                  endpoint: req.originalUrl,
                  method: req.method,
                  checkType: 'creator',
                  ownerId: ownerId
                }
              }).catch(err => console.error('Failed to log creator check denial:', err));

              return res.status(403).json({ 
                message: 'Only the creator or administrators can modify this resource' 
              });
            }
          }
        }
      }

      if (options.checkTeamMember) {
        const getTeamId = options.getTeamId;
        if (getTeamId) {
          const teamId = await getTeamId(req);
          if (teamId) {
            const Team = require('../models/team.model');
            const isMember = await Team.findOne({
              _id: teamId,
              'members.userId': req.user._id
            });
            if (!isMember) {
              console.log(`[RBAC] Team member check failed for user ${req.user._id} - not a member of team ${teamId}`);
              
              await ActivityLog.create({
                userId: req.user._id,
                organizationId: req.user.organizationId,
                action: 'permission_denied',
                entityType: 'team',
                details: {
                  teamId: teamId,
                  endpoint: req.originalUrl,
                  method: req.method,
                  checkType: 'team_membership'
                }
              }).catch(err => console.error('Failed to log team membership denial:', err));

              return res.status(403).json({ 
                message: 'You are not a member of this team'  
              });
            }
          }
        }
      }

      next();
    } catch (error) {
      console.error('Resource permission check error:', error);
      res.status(500).json({ 
        message: 'Error checking resource permissions' 
      });
    }
  };
};

module.exports = {
  checkPermission,
  checkOwnership,
  checkResourcePermission
};