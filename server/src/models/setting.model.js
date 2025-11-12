const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  isSecret: {
    type: Boolean,
    default: false
  },
  scope: {
    type: String,
    enum: ['global', 'organization'],
    required: true,
    default: 'organization'
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: function() {
      return this.scope === 'organization';
    }
  },
  category: {
    type: String,
    enum: ['email', 'security', 'general', 'maintenance'],
    default: 'general'
  }
}, {
  timestamps: true
});

settingSchema.index({ key: 1 });
settingSchema.index({ category: 1 });

settingSchema.statics.getSetting = async function(key) {
  const setting = await this.findOne({ key });
  return setting?.value;
};

settingSchema.statics.setSetting = async function(key, value, options = {}) {
  return this.findOneAndUpdate(
    { key },
    { 
      $set: { 
        value,
        ...options
      } 
    },
    { 
      new: true,
      upsert: true
    }
  );
};

settingSchema.statics.getSettingsByCategory = async function(category) {
  return this.find({ category })
    .select('-isSecret -createdAt -updatedAt')
    .lean();
};

settingSchema.pre('find', function() {
  if (!this.getQuery().includeSecrets) {
    this.where({ isSecret: false });
  }
});

const Setting = mongoose.model('Setting', settingSchema);

module.exports = Setting;