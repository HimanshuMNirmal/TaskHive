const express = require('express');
const { body, validationResult } = require('express-validator');
const { checkPermission, checkOwnership } = require('../middleware/rbac.middleware');

const router = express.Router();

const {
    getCurrentUser,
    updateUserProfile,
    updateUserSettings,
    updateUserPassword,
    getUserTeams,
    getUserTasks,
    getUserNotifications,
    updateNotificationSettings,
    getUserActivitySummary,
    deactivateAccount
} = require('../controllers/user.controller');

function handleValidation(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
}

router.get('/me', getCurrentUser);

router.put('/profile',
    [
        body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
        body('email').optional().isEmail().withMessage('Valid email is required'),
        body('avatar').optional().isURL().withMessage('Valid avatar URL is required'),
        body('bio').optional().trim()
    ],
    handleValidation,
    updateUserProfile
);

router.put('/settings',
    [
        body('notifications').optional().isBoolean(),
        body('emailPreferences').optional().isObject(),
        body('emailPreferences.taskAssignments').optional().isBoolean(),
        body('emailPreferences.teamUpdates').optional().isBoolean(),
        body('emailPreferences.reminders').optional().isBoolean(),
        body('theme').optional().isIn(['light', 'dark', 'system']),
        body('language').optional().isString()
    ],
    handleValidation,
    updateUserSettings
);

router.put('/password',
    [
        body('currentPassword').notEmpty().withMessage('Current password is required'),
        body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
    ],
    handleValidation,
    updateUserPassword
);

router.get('/teams',
    [
        body('page').optional().isInt({ min: 1 }),
        body('limit').optional().isInt({ min: 1, max: 50 })
    ],
    handleValidation,
    getUserTeams
);

router.get('/tasks',
    [
        body('page').optional().isInt({ min: 1 }),
        body('limit').optional().isInt({ min: 1, max: 50 }),
        body('status').optional().isIn(['todo', 'in_progress', 'done']),
        body('priority').optional().isIn(['low', 'medium', 'high']),
        body('dueDate').optional().isISO8601()
    ],
    handleValidation,
    getUserTasks
);

router.get('/notifications',
    [
        body('page').optional().isInt({ min: 1 }),
        body('limit').optional().isInt({ min: 1, max: 50 }),
        body('unreadOnly').optional().isBoolean()
    ],
    handleValidation,
    getUserNotifications
);

router.put('/notifications/settings',
    [
        body('email').isBoolean().withMessage('Email notification setting must be boolean'),
        body('push').isBoolean().withMessage('Push notification setting must be boolean'),
        body('types').optional().isObject()
    ],
    handleValidation,
    updateNotificationSettings
);

router.get('/activity/summary',
    [
        body('startDate').optional().isISO8601(),
        body('endDate').optional().isISO8601()
    ],
    handleValidation,
    getUserActivitySummary
);

router.post('/deactivate',
    [
        body('password').notEmpty().withMessage('Password is required for account deactivation')
    ],
    handleValidation,
    deactivateAccount
);

module.exports = router;
