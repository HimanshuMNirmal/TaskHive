const express = require('express');
const router = express.Router();
const { checkPermission } = require('../middleware/rbac.middleware');
const { getDashboardData } = require('../controllers/dashboard.controller');

router.get('/',
    checkPermission([
        'task:read',      
        'team:read',      
        'activityLog:read', 
        'notification:read' 
    ], { requireAll: false }), 
    getDashboardData
);

module.exports = router;