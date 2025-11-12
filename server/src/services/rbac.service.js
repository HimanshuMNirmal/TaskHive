const Permission = require('../models/permission.model');
const Role = require('../models/role.model');
const User = require('../models/user.model');

class RBACService {
  static async initializeRBAC() {
    try {
      const defaultPermissions = [
        { name: 'task:create', description: 'Create tasks', resource: 'task', action: 'create' },
        { name: 'task:read', description: 'Read tasks', resource: 'task', action: 'read' },
        { name: 'task:update', description: 'Update tasks', resource: 'task', action: 'update' },
        { name: 'task:delete', description: 'Delete tasks', resource: 'task', action: 'delete' },
        { name: 'task:manage', description: 'Manage all tasks', resource: 'task', action: 'manage' },

        { name: 'team:create', description: 'Create teams', resource: 'team', action: 'create' },
        { name: 'team:read', description: 'Read team info', resource: 'team', action: 'read' },
        { name: 'team:update', description: 'Update team info', resource: 'team', action: 'update' },
        { name: 'team:delete', description: 'Delete teams', resource: 'team', action: 'delete' },
        { name: 'team:manage', description: 'Manage all teams', resource: 'team', action: 'manage' },

        { name: 'user:create', description: 'Create users', resource: 'user', action: 'create' },
        { name: 'user:read', description: 'Read user info', resource: 'user', action: 'read' },
        { name: 'user:update', description: 'Update user info', resource: 'user', action: 'update' },
        { name: 'user:delete', description: 'Delete users', resource: 'user', action: 'delete' },
        { name: 'user:manage', description: 'Manage all users', resource: 'user', action: 'manage' },

        { name: 'team:manage_members', description: 'Manage team members (invite, remove, change roles)', resource: 'team', action: 'manage_members' },

        { name: 'activityLog:read', description: 'Read activity logs', resource: 'activityLog', action: 'read' },

        { name: 'notification:read', description: 'Read notifications', resource: 'notification', action: 'read' },

        { name: 'system:manage', description: 'Manage system settings', resource: 'all', action: 'manage' },
      ];

      for (const permission of defaultPermissions) {
        await Permission.findOneAndUpdate(
          { name: permission.name },
          permission,
          { upsert: true, new: true }
        );
      }

      const allPermissions = await Permission.find();
      const taskPermissions = allPermissions.filter(p => p.resource === 'task');
      const teamPermissions = allPermissions.filter(p => p.resource === 'team');
      const userPermissions = allPermissions.filter(p => p.resource === 'user');
      const systemPermissions = allPermissions.filter(p => p.resource === 'all');
      const activityLogPermissions = allPermissions.filter(p => p.resource === 'activityLog');
      const notificationPermissions = allPermissions.filter(p => p.resource === 'notification');

      const defaultRoles = [
        {
          name: 'admin',
          description: 'System administrator with full access',
          permissions: allPermissions.map(p => p._id),
          isSystem: true
        },
        {
          name: 'manager',
          description: 'Team manager with team management permissions',
          permissions: [
            ...taskPermissions.map(p => p._id),
            ...teamPermissions.filter(p => p.action !== 'delete').map(p => p._id),
            ...userPermissions.filter(p => p.action === 'read').map(p => p._id),
            ...activityLogPermissions.map(p => p._id),
            ...notificationPermissions.map(p => p._id)
          ],
          isSystem: true
        },
        {
          name: 'member',
          description: 'Regular team member',
          permissions: [
            ...taskPermissions.filter(p => p.action !== 'delete').map(p => p._id),
            ...teamPermissions.filter(p => p.action === 'read').map(p => p._id),
            ...userPermissions.filter(p => p.action === 'read').map(p => p._id),
            ...activityLogPermissions.map(p => p._id),
            ...notificationPermissions.map(p => p._id)
          ],
          isSystem: true
        }
      ];

      for (const role of defaultRoles) {
        await Role.findOneAndUpdate(
          { name: role.name },
          role,
          { upsert: true, new: true }
        );
      }

      return true;
    } catch (error) {
      console.error('Error initializing RBAC:', error);
      throw error;
    }
  }

  static async hasPermission(userId, permissionName) {
    try {
      const user = await User.findById(userId).populate({
        path: 'role',
        populate: {
          path: 'permissions'
        }
      });

      if (!user || !user.role) return false;

      const hasPermission = user.role.permissions.some(
        permission => permission.name === permissionName
      );

      return hasPermission;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  static async getUserPermissions(userId) {
    try {
      const user = await User.findById(userId).populate({
        path: 'role',
        populate: {
          path: 'permissions'
        }
      });

      if (!user || !user.role) return [];

      return user.role.permissions;
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return [];
    }
  }
}

module.exports = RBACService;