const mongoose = require('mongoose');
const { Schema } = mongoose;

const OrganizationSchema = new Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  slug: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true,
    lowercase: true 
  },
  domain: { 
    type: String, 
    trim: true,
    lowercase: true 
  },
  settings: {
    theme: {
      primaryColor: { type: String, default: '#4f46e5' },
      logo: { type: String }
    },
    features: {
      timeTracking: { type: Boolean, default: true },
      fileAttachments: { type: Boolean, default: true },
      taskDependencies: { type: Boolean, default: true }
    },
    limits: {
      maxUsers: { type: Number, default: 10 },
      maxStorage: { type: Number, default: 5368709120 },
      maxTeams: { type: Number, default: 5 }
    }
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'deleted'],
    default: 'active'
  },
  subscription: {
    plan: { type: String, default: 'free' },
    startDate: Date,
    endDate: Date
  }
}, {
  timestamps: true
});

OrganizationSchema.index({ slug: 1 }, { unique: true });
OrganizationSchema.index({ domain: 1 });
OrganizationSchema.index({ status: 1 });

const Organization = mongoose.model('Organization', OrganizationSchema);
module.exports = Organization;
