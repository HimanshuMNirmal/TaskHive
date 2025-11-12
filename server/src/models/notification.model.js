const mongoose = require('mongoose');
const { Schema } = mongoose;

const NotificationSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['task_assigned', 'deadline_approaching', 'mention', 'comment', 'status_change'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, default: '' },
  reference: {
    type: { type: String, enum: ['task', 'comment', 'team'], required: true },
    id: { type: Schema.Types.ObjectId, required: true }
  },
  isRead: { type: Boolean, default: false },
  scheduledFor: { type: Date }, 
  dismissedAt: { type: Date }
}, {
  timestamps: true 
});

NotificationSchema.index({ organizationId: 1, userId: 1, isRead: 1 });
NotificationSchema.index({ organizationId: 1, userId: 1, createdAt: -1 });

NotificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  return this.save();
};

NotificationSchema.methods.dismiss = function() {
  this.dismissedAt = new Date();
  return this.save();
};

const Notification = mongoose.model('Notification', NotificationSchema);
module.exports = Notification;
