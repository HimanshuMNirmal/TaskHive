const Notification = require('../models/notification.model');

exports.createNotification = async ({
    userId,
    type,
    title,
    message,
    metadata = {}
}) => {
    const notification = new Notification({
        userId,
        type,
        title,
        message,
        metadata,
        createdAt: new Date(),
        read: false
    });

    await notification.save();
    
    res.json({
        success: true,
        message: 'Notifications created successfully',
        data: { notification}
    });
};

exports.getNotifications = async (req, res) => {
    const { page = 1, limit = 20, unreadOnly = false } = req.body;
    const skip = (page - 1) * limit;

    const query = { userId: req.user._id };
    if (unreadOnly === 'true') {
        query.read = false;
    }

    const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
        userId: req.user._id,
        read: false
    });

    res.json({
        success: true,
        message: 'Notifications retrieved successfully',
        data: { notifications, unreadCount },
        meta: {
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / limit)
            }
        }
    });
};

exports.markNotificationsAsRead = async (req, res) => {
    const { notificationIds } = req.body;

    if (!notificationIds || !notificationIds.length) {
        await Notification.updateMany(
            { userId: req.user._id, read: false },
            { $set: { read: true, readAt: new Date() } }
        );
    } else {
        await Notification.updateMany(
            {
                _id: { $in: notificationIds },
                userId: req.user._id
            },
            { $set: { read: true, readAt: new Date() } }
        );
    }

    res.json({
        success: true,
        message: 'Notifications marked as read'
    });
};
