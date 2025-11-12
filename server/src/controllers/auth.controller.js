const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Organization = require('../models/organization.model');
const Role = require('../models/role.model');
const RBACService = require('../services/rbac.service');
const emailService = require('../services/email.service');
const settingsService = require('../services/settings.service');
const { accessLogger } = require('../services/logger.service');

const {
  CLIENT_URL,
  JWT_SECRET,
  JWT_EXPIRES_IN
} = process.env;

exports.registerUser = async (req, res) => {
  const { name, email, password, organizationName, organizationSlug } = req.body;

  const existingOrg = await Organization.findOne({ slug: organizationSlug });
  if (existingOrg) {
    return res.status(400).json({
      success: false,
      message: 'Organization URL identifier is already taken'
    });
  }

  const adminRole = await Role.findOne({ name: 'admin', isSystem: true });
  if (!adminRole) {
    throw new Error('Admin role not found');
  }

  // Create organization and user - validate before saving
  const organization = new Organization({
    name: organizationName,
    slug: organizationSlug,
    settings: {
      theme: {
        primaryColor: '#4f46e5'
      },
      features: {
        timeTracking: true,
        fileAttachments: true,
        taskDependencies: true
      },
      limits: {
        maxUsers: 10,
        maxStorage: 5368709120,
        maxTeams: 5
      }
    },
    status: 'active'
  });

  const user = new User({
    name,
    email,
    password,
    organizationId: organization._id,
    role: adminRole._id,
    settings: { notifications: true, emailPreferences: {} }
  });

  let organizationSaved = false;
  let userSaved = false;

  try {
    await user.validate();
    await organization.validate();

    // Save organization first
    await organization.save();
    organizationSaved = true;

    // Then save user
    await user.save();
    userSaved = true;

    const token = jwt.sign(
      { 
        userId: user._id,
        organizationId: organization._id,
        role: 'admin'
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const permissions = await RBACService.getUserPermissions(user._id);
    const permissionNames = permissions.map(p => p.name);

    res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      data: {
        token,
        user: { 
          id: user._id, 
          name: user.name, 
          email: user.email, 
          role: 'admin'
        },
        permissions: permissionNames,
        organization: {
          id: organization._id,
          name: organization.name,
          slug: organization.slug
        }
      }
    });
  } catch (error) {
    const cleanupPromises = [];

    if (organizationSaved && organization._id) {
      cleanupPromises.push(
        Organization.findByIdAndDelete(organization._id).catch(deleteError => {
          accessLogger.log(null, 'registerUser_cleanup', req.ip, `Failed to cleanup organization: ${deleteError.message}`);
        })
      );
    }

    if (userSaved && user._id) {
      cleanupPromises.push(
        User.findByIdAndDelete(user._id).catch(deleteError => {
          accessLogger.log(null, 'registerUser_cleanup', req.ip, `Failed to cleanup user: ${deleteError.message}`);
        })
      );
    }

    await Promise.all(cleanupPromises);

    throw error;
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  const { maxLoginAttempts, lockoutDuration, force2fa, sessionTimeout } = 
    await settingsService.getSecuritySettings();

  const user = await User.findOne({ email }).populate('role');
  if (!user) {
    accessLogger.log(null, 'login', req.ip, 'failed: user not found');
    return res.status(400).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  if (user.lockoutUntil && user.lockoutUntil > Date.now()) {
    accessLogger.log(user, 'login', req.ip, 'failed: account locked');
    return res.status(400).json({
      success: false,
      message: 'Account is temporarily locked. Please try again later.'
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    
    if (user.failedLoginAttempts >= maxLoginAttempts) {
      user.lockoutUntil = Date.now() + (lockoutDuration * 1000);
      await user.save();
      
      accessLogger.log(user, 'login', req.ip, 'failed: max attempts exceeded');
      return res.status(400).json({
        success: false,
        message: 'Account locked due to too many failed attempts'
      });
    }
    
    await user.save();
    accessLogger.log(user, 'login', req.ip, 'failed: invalid password');
    return res.status(400).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  user.failedLoginAttempts = 0;
  user.lockoutUntil = null;
  await user.save();

  if (force2fa && !user.twoFactorEnabled) {
    return res.status(403).json({
      success: false,
      message: 'Two-factor authentication is required'
    });
  }

  const organization = await Organization.findById(user.organizationId);

  const permissions = await RBACService.getUserPermissions(user._id);
  const permissionNames = permissions.map(p => p.name);

  const token = jwt.sign(
    { 
      userId: user._id,
      organizationId: user.organizationId,
      role: user.role.name
    },
    JWT_SECRET,
    { expiresIn: sessionTimeout + 's' }
  );

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role.name
      },
      permissions: permissionNames,
      organization: {
        id: organization._id,
        name: organization.name,
        slug: organization.slug
      }
    }
  });
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  
  if (!user) {
    return res.json({
      success: true,
      message: 'If the email exists, a reset link has been sent.'
    });
  }

  const resetToken = jwt.sign(
    { userId: String(user._id), purpose: 'password_reset' },
    JWT_SECRET,
    { expiresIn: PASSWORD_RESET_EXPIRES || '15m' }
  );

  const resetUrl = `${CLIENT_URL.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(resetToken)}`;

  await emailService.sendPasswordResetEmail({
    to: email,
    name: user.name,
    resetUrl: resetUrl,
    expiresIn: PASSWORD_RESET_EXPIRES || '15 minutes'
  });

  return res.json({
    success: true,
    message: 'If the email exists, a reset link has been sent.'
  });
};
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  let payload;
  payload = jwt.verify(token, JWT_SECRET);

  if (payload.purpose !== 'password_reset') {
    return res.status(400).json({
      success: false,
      message: 'Invalid token purpose'
    });
  }

  const user = await User.findById(payload.userId);
  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid token'
    });
  }

  user.password = newPassword;
  await user.save();

  const authToken = jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return res.json({
    success: true,
    message: 'Password reset successful',
    data: { token: authToken }
  });
};

exports.validatePasswordStrength = async (password) => {
  const { passwordPolicy } = await settingsService.getSecuritySettings();
  
  const errors = [];
  
  if (password.length < passwordPolicy.minLength) {
    errors.push(`Password must be at least ${passwordPolicy.minLength} characters long`);
  }
  
  if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (passwordPolicy.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (passwordPolicy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return errors;
};
