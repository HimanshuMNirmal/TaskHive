const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { checkPermission } = require('../middleware/rbac.middleware');
const router = express.Router();
const adminController = require('../controllers/admin.controller');

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
}

router.get('/users', 
  checkPermission('user:manage'),
  adminController.getAllUsers);

router.post('/users', 
  checkPermission('user:create'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('role').optional().isMongoId().withMessage('Role must be a valid ObjectId'),
    body('roles').optional().isArray({ min: 1, max: 1 }).withMessage('Roles must be an array with at most one role'),
    body('roles.*').optional().isMongoId().withMessage('Role must be a valid ObjectId'),
  ], 
  handleValidation, 
  adminController.createUser);

router.put('/users/:id', 
  checkPermission('user:update'),
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('role').optional().isMongoId().withMessage('Role must be a valid ObjectId'),
    body('roles').optional().isArray({ min: 1, max: 1 }).withMessage('Roles must be an array with at most one role'),
    body('roles.*').optional().isMongoId().withMessage('Role must be a valid ObjectId'),
    body('settings').optional().isObject().withMessage('Settings must be an object'),
    body('avatarUrl').optional().isURL().withMessage('Avatar URL must be a valid URL'),
    body('twoFactorEnabled').optional().isBoolean().withMessage('twoFactorEnabled must be a boolean'),
  ], 
  handleValidation, 
  adminController.updateUser);

router.delete('/users/:id', 
  checkPermission('user:delete'),
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
  ], 
  handleValidation, 
  adminController.deleteUser);

router.get('/roles', 
  checkPermission('user:manage'),
  adminController.getRoles);

router.post('/roles', 
  checkPermission('user:manage'),
  [
    body('name').trim().notEmpty().withMessage('Role name is required'),
    body('permissions').isArray().withMessage('Permissions must be an array'),
    body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
  ], 
  handleValidation, 
  adminController.createRole);

router.put('/roles/:id', 
  checkPermission('user:manage'),
  [
    param('id').isMongoId().withMessage('Invalid role ID'),
    body('name').optional().trim().notEmpty().withMessage('Role name cannot be empty'),
    body('permissions').optional().isArray().withMessage('Permissions must be an array'),
    body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
  ], 
  handleValidation, 
  adminController.updateRole);

router.delete('/roles/:id', 
  checkPermission('user:manage'),
  [
    param('id').isMongoId().withMessage('Invalid role ID'),
  ], 
  handleValidation, 
  adminController.deleteRole);

router.delete('/roles/:roleId/permissions/:permissionId', 
  checkPermission('user:manage'),
  [
    param('roleId').isMongoId().withMessage('Invalid role ID'),
    param('permissionId').trim().notEmpty().withMessage('Permission ID is required'),
  ], 
  handleValidation, 
  adminController.removePermissionFromRole);

router.get('/settings', 
  checkPermission('system:manage'),
  adminController.getSystemSettings);

router.put('/settings', 
  checkPermission('system:manage'),
  [
    body('settings').isArray().withMessage('Settings must be an array'),
    body('settings.*.key').trim().notEmpty().withMessage('Setting key is required'),
    body('settings.*.value').notEmpty().withMessage('Setting value is required'),
    body('settings.*.category').trim().notEmpty().withMessage('Setting category is required'),
    body('settings.*.description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
    body('settings.*.isSecret').optional().isBoolean().withMessage('isSecret must be a boolean'),
  ], 
  handleValidation, 
  adminController.updateSystemSettings);

router.get('/stats', 
  checkPermission('system:manage'),
  adminController.getSystemStats);

router.get('/activity-logs', 
  checkPermission('activityLog:read'),
  adminController.getUserActivityLogs);

router.get('/access-logs', 
  checkPermission('system:manage'),
  adminController.getAccessLogs);

router.get('/system-logs', 
  checkPermission('system:manage'),
  adminController.getSystemLogs);

router.post('/backups', 
  checkPermission('system:manage'),
  adminController.createBackup);

router.get('/backups', 
  checkPermission('system:manage'),
  adminController.getBackups);

router.post('/backups/:id/restore', 
  checkPermission('system:manage'),
  adminController.restoreBackup);

router.post('/cache/clear', 
  checkPermission('system:manage'),
  adminController.clearCache);

router.post('/announcements', 
  checkPermission('system:manage'),
  [
    body('title').trim().notEmpty().withMessage('Announcement title is required'),
    body('message').trim().notEmpty().withMessage('Announcement message is required'),
    body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority level'),
    body('startDate').optional().isISO8601().withMessage('Invalid start date'),
    body('endDate').optional().isISO8601().withMessage('Invalid end date'),
  ], 
  handleValidation, 
  adminController.createAnnouncement);

router.get('/announcements', 
  adminController.getAnnouncements);

router.delete('/announcements/:id', 
  checkPermission('system:manage'),
  [
    param('id').isMongoId().withMessage('Invalid announcement ID'),
  ], 
  handleValidation, 
  adminController.deleteAnnouncement);

module.exports = router;