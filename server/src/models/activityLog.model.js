const mongoose = require('mongoose');
const { Schema } = mongoose;

const ActivityLogSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  entityType: { 
    type: String, 
    enum: ['task', 'team', 'user', 'role', 'permission', 'system'], 
    required: true 
  },
  entityId: { type: Schema.Types.ObjectId, required: false }, 
  action: { 
    type: String, 
    enum: [
      'created', 
      'updated', 
      'deleted', 
      'status_changed', 
      'assigned', 
      'commented',
      'permission_denied',
      'role_created',
      'role_updated',
      'role_deleted',
      'permission_removed_from_role',
      'user_created',
      'user_updated',
      'user_deleted',
      'permission_check_failed'
    ], 
    required: true 
  },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  details: {
    field: { type: String },
    oldValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed }
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

ActivityLogSchema.index({ organizationId: 1, entityType: 1, entityId: 1, createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);
module.exports = ActivityLog;
