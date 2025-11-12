const mongoose = require('mongoose');
const { Schema } = mongoose;

const MemberSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['admin', 'manager', 'member'], default: 'member' },
  joinedAt: { type: Date, default: Date.now }
}, { _id: false });

const CustomStatusSchema = new Schema({
  name: { type: String, required: true },
  color: { type: String }
}, { _id: false });

const TeamSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [MemberSchema],
  settings: {
    defaultAssigneeId: { type: Schema.Types.ObjectId, ref: 'User' },
    isPrivate: { type: Boolean, default: false },
    customStatuses: [CustomStatusSchema]
  }
}, {
  timestamps: true
});

TeamSchema.index({ organizationId: 1, ownerId: 1 });
TeamSchema.index({ organizationId: 1, 'members.userId': 1 });
TeamSchema.index({ organizationId: 1, name: 1 });

TeamSchema.methods.addMember = async function(userId, role = 'member') {
  const exists = this.members.find(m => m.userId.equals(userId));
  if (exists) return exists;
  const member = { userId, role, joinedAt: new Date() };
  this.members.push(member);
  await this.save();
  return member;
};

TeamSchema.methods.removeMember = async function(userId) {
  this.members = this.members.filter(m => !m.userId.equals(userId));
  await this.save();
  return this;
};

const Team = mongoose.model('Team', TeamSchema);
module.exports = Team;
