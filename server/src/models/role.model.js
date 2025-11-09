const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    enum: ['admin', 'manager', 'member'],
    trim: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  permissions: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Permission' 
  }],
  isSystem: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

RoleSchema.index({ name: 1 }, { unique: true });

RoleSchema.statics.findByNameWithPermissions = async function(name) {
  return this.findOne({ name }).populate('permissions');
};

const Role = mongoose.model('Role', RoleSchema);
module.exports = Role;