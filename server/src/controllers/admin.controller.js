
const User = require('../models/user.model');
const Role = require('../models/role.model');
const ActivityLog = require('../models/activityLog.model');
const Setting = require('../models/setting.model');


exports.getAllUsers = async (req, res) => {
  const users = await User.find()
    .select('_id name email') 
    .populate({
      path: 'role',
      select: '_id name', 
      transform: (doc) => doc ? { 
        _id: doc._id,
        name: doc.name
      } : null
    })
    .lean();

  const transformedUsers = users.map(user => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    roles: user.role ? [user.role] : [] 
  }));

  res.json({
    success: true,
    message: 'Users retrieved successfully',
    data: { users: transformedUsers }
  });
};

exports.createUser = async (req, res) => {
  try {
    const userData = {
      ...req.body,
      role: Array.isArray(req.body.roles) ? req.body.roles[0] : req.body.role,
      organizationId: req.user.organizationId,
      settings: {
        notifications: true,
        emailPreferences: {},
        ...req.body.settings
      }
    };

    delete userData.roles;

    const user = await User.create(userData);
    
    await ActivityLog.create({
      userId: req.user._id,
      organizationId: req.user.organizationId,
      action: 'user_created',
      entityType: 'user',
      entityId: user._id,
      details: {
        createdUserEmail: user.email,
        role: userData.role
      }
    }).catch(err => console.error('Failed to log user creation:', err));
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
};


exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const updateData = { ...req.body };
    
    if (updateData.roles || updateData.role) {
      updateData.role = Array.isArray(updateData.roles) ? updateData.roles[0] : updateData.role;
      delete updateData.roles;
    }
    
    delete updateData.organizationId; 
    delete updateData.password; 
    delete updateData.createdAt;
    delete updateData.updatedAt;
    
    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    }).select('-password').populate('role', '_id name');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await ActivityLog.create({
      userId: req.user._id,
      organizationId: req.user.organizationId,
      action: 'user_updated',
      entityType: 'user',
      entityId: user._id,
      details: {
        targetUserEmail: user.email,
        updates: Object.keys(updateData)
      }
    }).catch(err => console.error('Failed to log user update:', err));
    
    const transformedUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      roles: user.role ? [user.role] : [] 
    };
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user: transformedUser }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await ActivityLog.create({
      userId: req.user._id,
      organizationId: req.user.organizationId,
      action: 'user_deleted',
      entityType: 'user',
      entityId: user._id,
      details: {
        deletedUserEmail: user.email
      }
    }).catch(err => console.error('Failed to log user deletion:', err));
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: null
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};

exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.find()
      .populate({
        path: 'permissions',
        select: '_id name', 
        options: { sort: { name: 1 } }
      })
      .lean();

    if (!roles) {
      return res.status(404).json({
        success: false,
        message: 'No roles found'
      });
    }

    const transformedRoles = roles.map(role => ({
      _id: role._id,
      name: role.name,
      description: role.description,
      permissions: role.permissions.map(perm => 
        typeof perm === 'object' && perm.name ? perm.name : String(perm)
      )
    }));

    res.json({
      success: true,
      message: 'Roles retrieved successfully',
      data: { roles: transformedRoles }
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving roles',
      error: error.message
    });
  }
};

exports.createRole = async (req, res) => {
  try {
    const role = await Role.create(req.body);
    
    await ActivityLog.create({
      userId: req.user._id,
      organizationId: req.user.organizationId,
      action: 'role_created',
      entityType: 'role',
      entityId: role._id,
      details: {
        roleName: role.name,
        permissions: req.body.permissions
      }
    }).catch(err => console.error('Failed to log role creation:', err));

    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: { role }
    });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating role',
      error: error.message
    });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const role = await Role.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    await ActivityLog.create({
      userId: req.user._id,
      organizationId: req.user.organizationId,
      action: 'role_updated',
      entityType: 'role',
      entityId: role._id,
      details: {
        roleName: role.name,
        updates: Object.keys(req.body)
      }
    }).catch(err => console.error('Failed to log role update:', err));
    
    res.json({
      success: true,
      message: 'Role updated successfully',
      data: { role }
    });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating role',
      error: error.message
    });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const role = await Role.findByIdAndDelete(req.params.id);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    await ActivityLog.create({
      userId: req.user._id,
      organizationId: req.user.organizationId,
      action: 'role_deleted',
      entityType: 'role',
      entityId: role._id,
      details: {
        roleName: role.name
      }
    }).catch(err => console.error('Failed to log role deletion:', err));
    
    res.status(200).json({
      success: true,
      message: 'Role deleted successfully',
      data: null
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting role',
      error: error.message
    });
  }
};

exports.removePermissionFromRole = async (req, res) => {
  const { roleId, permissionId } = req.params;
  
  try {
    let role = await Role.findById(roleId);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    const Permission = require('../models/permission.model');
    const mongoose = require('mongoose');
    
    let permission;
    
    if (mongoose.Types.ObjectId.isValid(permissionId)) {
      permission = await Permission.findById(permissionId);
    }
    
    if (!permission) {
      permission = await Permission.findOne({ name: permissionId });
    }

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found'
      });
    }

    role = await Role.findByIdAndUpdate(
      roleId,
      { $pull: { permissions: permission._id } },
      { new: true, runValidators: true }
    ).populate({
      path: 'permissions',
      select: '_id name'
    });

    await ActivityLog.create({
      userId: req.user._id,
      organizationId: req.user.organizationId,
      action: 'permission_removed_from_role',
      entityType: 'role',
      entityId: role._id,
      details: {
        roleName: role.name,
        permissionId: permission._id,
        permissionName: permission.name
      }
    }).catch(err => console.error('Failed to log permission removal:', err));

    res.json({
      success: true,
      message: 'Permission removed from role successfully',
      data: { role }
    });
  } catch (error) {
    console.error('Error removing permission from role:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing permission from role',
      error: error.message
    });
  }
};

exports.getSystemSettings = async (req, res) => {
  const { category } = req.query;
  let settings;

  if (category) {
    settings = await Setting.getSettingsByCategory(category);
  } else {
    settings = await Setting.find()
      .select('-isSecret -createdAt -updatedAt')
      .lean();
  }

  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {});

  res.json({
    success: true,
    message: 'Settings retrieved successfully',
    data: { settings: groupedSettings }
  });
};

exports.updateSystemSettings = async (req, res) => {
  const { settings } = req.body;
  
  if (!Array.isArray(settings)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid settings format. Expected an array of settings.'
    });
  }

  const updatePromises = settings.map(async ({ key, value, description, category, isSecret }) => {
    return Setting.setSetting(key, value, {
      description,
      category,
      isSecret: isSecret || false
    });
  });

  await Promise.all(updatePromises);

  await ActivityLog.create({
    userId: req.user._id,
    action: 'settings:update',
    details: `Updated system settings: ${settings.map(s => s.key).join(', ')}`
  });

  const updatedSettings = await Setting.find()
    .select('-isSecret -createdAt -updatedAt')
    .lean();

  res.json({
    success: true,
    message: 'Settings updated successfully',
    data: { settings: updatedSettings }
  });
};

exports.getSystemStats = async (req, res) => {
  const stats = await Promise.all([
    User.countDocuments(),
    ActivityLog.aggregate([
      {
        $group: {
          _id: '$entityType',
          count: { $sum: 1 }
        }
      }
    ]),
    User.aggregate([
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 30 }
    ])
  ]);

  res.json({
    success: true,
    message: 'System statistics retrieved successfully',
    data: {
      totalUsers: stats[0],
      activityBreakdown: stats[1],
      userGrowth: stats[2]
    }
  });
};

exports.getUserActivityLogs = async (req, res) => {
  const logs = await ActivityLog.find()
    .populate('userId', 'name email')
    .sort('-createdAt')
    .limit(100);
  res.json({
    success: true,
    message: 'Activity logs retrieved successfully',
    data: { logs }
  });
};

exports.getAccessLogs = async (req, res) => {
  res.json({
    success: true,
    message: 'Access logs retrieved successfully',
    data: { logs: [] }
  });
};

exports.getSystemLogs = async (req, res) => {
  res.json({
    success: true,
    message: 'System logs retrieved successfully',
    data: { logs: [] }
  });
};

exports.createBackup = async (req, res) => {
  res.json({
    success: true,
    message: 'Backup initiated successfully',
    data: null
  });
};

exports.getBackups = async (req, res) => {
  res.json({
    success: true,
    message: 'Backups retrieved successfully',
    data: { backups: [] }
  });
};

exports.restoreBackup = async (req, res) => {
  res.json({
    success: true,
    message: 'Backup restore initiated successfully',
    data: null
  });
};

exports.clearCache = async (req, res) => {
  res.json({
    success: true,
    message: 'Cache cleared successfully',
    data: null
  });
};

exports.createAnnouncement = async (req, res) => {
  res.status(201).json({
    success: true,
    message: 'Announcement created successfully',
    data: null
  });
};

exports.getAnnouncements = async (req, res) => {
  res.json({
    success: true,
    message: 'Announcements retrieved successfully',
    data: { announcements: [] }
  });
};

exports.deleteAnnouncement = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Announcement deleted successfully',
    data: null
  });
};