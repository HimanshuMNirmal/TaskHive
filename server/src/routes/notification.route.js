const express = require('express');

const router = express.Router();

const { 
    getNotifications,
    markNotificationsAsRead
} = require('../controllers/notification.controller');

router.get('/', getNotifications);

router.post('/mark-read', markNotificationsAsRead);

module.exports = router;
