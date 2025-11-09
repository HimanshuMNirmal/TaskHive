const express = require('express');
const { body, validationResult } = require('express-validator');

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
            'task_created',
            'task_updated',
            'task_deleted',
            'task_status_changed',
            'task_assigned',
            'comment_added',
            'team_created',
            'team_updated',
            'team_deleted',
            'member_added',
            'member_removed',
            'member_role_updated'
        ]).withMessage('Invalid activity type'),
        body('taskId').optional().isMongoId(),
        body('teamId').optional().isMongoId(),
        body('metadata').optional().isObject()
    ],
    handleValidation,
    createActivityLog
);

router.get('/team/:teamId',
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
