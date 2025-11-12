const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: function() {
      return !this.isSystem;
    }
  },
  name: { 
    type: String, 
    required: true,
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

RoleSchema.index({ 
  name: 1,
  organizationId: 1,
  isSystem: 1
}, { 
  unique: true,
  partialFilterExpression: { isSystem: false } 
});

RoleSchema.index({ 
  name: 1,
  isSystem: 1
}, { 
  unique: true,
  partialFilterExpression: { isSystem: true } 
});

RoleSchema.statics.findByNameWithPermissions = async function(name, organizationId = null) {
  const query = organizationId 
    ? { name, $or: [{ organizationId }, { isSystem: true }] }
    : { name, isSystem: true };
  return this.findOne(query).populate('permissions');
};

const Role = mongoose.model('Role', RoleSchema);
module.exports = Role;