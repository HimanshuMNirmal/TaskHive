const express = require('express');
const { body, validationResult } = require('express-validator');
const { checkOwnership, checkPermission } = require('../middleware/rbac.middleware');
const Task = require('../models/task.model');
const Team = require('../models/team.model');
const router = express.Router();

const { 
    createActivityLog,
    getTeamActivityLogs,
    getTaskActivityLogs,
    getUserActivityLogs,
    getActivityLogsByDateRange
} = require('../controllers/activityLog.controller');

function handleValidation(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
}

router.post('/',
    [
        body('type').isIn([
            'created',
            'updated',
            'deleted',
            'status_changed',
            'assigned',
            'commented',
            'permission_denied',
            'role_created',
            'role_updated',
            'role_deleted',
            'permission_removed_from_role',
            'user_created',
            'user_updated',
            'user_deleted',
            'permission_check_failed'
        ]).withMessage('Invalid activity type'),
        body('entityType').isIn([
            'task',
            'team',
            'user',
            'role',
            'permission',
            'system'
        ]).withMessage('Invalid entity type'),
        body('entityId').optional().isMongoId(),
        body('metadata').optional().isObject()
    ],
    handleValidation,
    createActivityLog
);

router.get('/team/:teamId',
    checkPermission('activityLog:read'),
    checkOwnership(
        async (req) => {
            const team = await Team.findById(req.params.teamId);
            return team ? team.ownerId : null;
        },
        'team:manage'
    ),
    [
        body('page').optional().isInt({ min: 1 }),
        body('limit').optional().isInt({ min: 1, max: 100 }),
        body('startDate').optional().isISO8601(),
        body('endDate').optional().isISO8601()
    ],
    handleValidation,
    getTeamActivityLogs
);

router.get('/task/:taskId',
    checkPermission('activityLog:read'),
    checkOwnership(
        async (req) => {
            const task = await Task.findById(req.params.taskId);
            return task ? task.ownerId : null;
        },
        'task:manage'
    ),
    [
        body('page').optional().isInt({ min: 1 }),
        body('limit').optional().isInt({ min: 1, max: 100 })
    ],
    handleValidation,
    getTaskActivityLogs
);

router.get('/user',
    [
        body('page').optional().isInt({ min: 1 }),
        body('limit').optional().isInt({ min: 1, max: 100 })
    ],
    handleValidation,
    getUserActivityLogs
);

router.get('/range',
    [
        body('startDate').isISO8601().withMessage('Valid start date required'),
        body('endDate').isISO8601().withMessage('Valid end date required'),
        body('type').optional().isIn([
            'task',
            'team',
            'user',
            'all'
        ])
    ],
    handleValidation,
    getActivityLogsByDateRange
);

module.exports = router;
