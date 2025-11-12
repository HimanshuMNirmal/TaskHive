const express = require('express');
const { body, validationResult } = require('express-validator');
const { checkPermission, checkOwnership } = require('../middleware/rbac.middleware');
const router = express.Router();

const { 
    getNotifications,
    markNotificationsAsRead
} = require('../controllers/notification.controller');

function handleValidation(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
}

router.post('/',
    [
        body('page').optional().isInt({ min: 1 }),
        body('limit').optional().isInt({ min: 1, max: 100 }),
        body('unreadOnly').optional().isBoolean()
    ],
    handleValidation,
    getNotifications);

router.post('/mark-read', 
    checkPermission('notification:manage'),
    checkOwnership(
        async (req) => req.user._id,
        'notification:manage_all'
    ),
    markNotificationsAsRead
);

module.exports = router;
