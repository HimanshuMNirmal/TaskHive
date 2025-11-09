const mongoose = require('mongoose');

const PermissionSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  resource: { 
    type: String, 
    required: true,
    enum: ['task', 'team', 'user', 'notification', 'activityLog', 'all']
  },
  action: { 
    type: String, 
    required: true,
    enum: ['create', 'read', 'update', 'delete', 'manage']
  }
}, {
  timestamps: true
});

PermissionSchema.index({ name: 1 }, { unique: true });
PermissionSchema.index({ resource: 1, action: 1 }, { unique: true });

const Permission = mongoose.model('Permission', PermissionSchema);
module.exports = Permission;