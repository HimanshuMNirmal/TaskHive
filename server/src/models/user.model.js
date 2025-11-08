const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Schema } = mongoose;
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Invalid email'] },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'manager', 'member'], default: 'member'},
    teamIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
    avatarUrl: { type: String, default: '' },
  settings: {
    notifications: { type: Boolean, default: true },
    emailPreferences: { type: Schema.Types.Mixed, default: {} }
  }
}, {
  timestamps: true
});

UserSchema.index({ email: 1 }, { unique: true });

UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

UserSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

const User = mongoose.model('User', UserSchema);
module.exports = User;