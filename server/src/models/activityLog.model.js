const mongoose = require('mongoose');
const { Schema } = mongoose;

const ActivityLogSchema = new Schema({
  entityType: { type: String, enum: ['task', 'team', 'user'], required: true },
  entityId: { type: Schema.Types.ObjectId, required: true },
  action: { type: String, enum: ['created', 'updated', 'deleted', 'status_changed', 'assigned', 'commented'], required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  details: {
    field: { type: String },
    oldValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed }
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

ActivityLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);
module.exports = ActivityLog;
